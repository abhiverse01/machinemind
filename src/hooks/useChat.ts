'use client'

import { useCallback, useRef } from 'react'
import { useChatStore } from '@/store/chat'
import { classifyInput } from '@/lib/nlp/classifier'
import { RULES } from '@/lib/nlp/rules'
import { pickTemplate } from '@/lib/composer/templates'
import { formatWithTone } from '@/lib/composer/personality'
import { contextMemory } from '@/lib/memory/context'
import { executeTool, executeChain } from '@/lib/tools/registry'
import { sysInfoState } from '@/lib/tools/sysinfo'
import { memoryStore } from '@/lib/tools/memory'
import type { Message, Tone, ChatStore } from '@/lib/types'

type StoreApi = ChatStore

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useChat() {
  const store = useChatStore()
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(
    async (input: string) => {
      if (!input.trim() || store.isStreaming) return

      const trimmed = input.trim()

      // 1. Add user message
      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        displayType: 'text',
        timestamp: Date.now(),
      }
      store.addMessage(userMsg)

      // 2. Update context memory
      contextMemory.push('user', trimmed)

      // 3. Check for direct ! tool invocation
      if (trimmed.startsWith('!')) {
        const parts = trimmed.slice(1).trim()
        const spaceIdx = parts.indexOf(' ')
        const toolName = spaceIdx === -1 ? parts.toLowerCase() : parts.slice(0, spaceIdx).toLowerCase()
        const toolInput = spaceIdx === -1 ? '' : parts.slice(spaceIdx + 1).trim()

        // Special: !help, !status, !tools → show help info directly
        if (toolName === 'help' || toolName === 'tools') {
          const helpResponse = pickTemplate('HELP_RESPONSE')
          await addAssistantMessage(store, helpResponse, 'text', undefined, undefined, 'neutral')
          return
        }

        if (toolName === 'status') {
          await handleToolExecution('sysinfo', trimmed, store, 'neutral')
          return
        }

        await handleToolExecution(toolName, toolInput || trimmed, store, 'neutral')
        return
      }

      // 4. Check for tool chain (pipe syntax)
      if (trimmed.includes('|')) {
        const chainPattern = /\w+\s+[^|]+\|/
        if (chainPattern.test(trimmed)) {
          await handleToolChain(trimmed, store)
          return
        }
      }

      // 5. Run full NLP pipeline (GibberishParser → FuzzyMatcher → Tokenizer → Classifier)
      const classification = classifyInput(trimmed, contextMemory.getFlags())
      const tone: Tone = classification.parsedInput?.tone ?? 'neutral'

      // 6. Update context memory with classification info
      contextMemory.push('system', `Intent: ${classification.intent}`, {
        classification,
      })

      // 7. Check for follow-up with pronoun resolution
      if (contextMemory.isFollowUp(trimmed)) {
        const lastTopic = contextMemory.expandLastTopic()
        if (lastTopic) {
          const rawResponse = pickTemplate('FOLLOW_UP', {
            topic: 'previous topic',
            detail: lastTopic,
          })
          const response = formatWithTone(rawResponse, tone, false)
          await addAssistantMessage(store, response, 'text', undefined, undefined, tone)
          return
        }
      }

      // 8. If intent has a tool hint, execute the tool
      if (classification.toolHint) {
        await handleToolExecution(classification.toolHint, trimmed, store, tone)
        return
      }

      // 9. If mode is 'ai_relay', POST to /api/chat, stream tokens
      if (store.mode === 'ai_relay') {
        await handleAIRelay(trimmed, store, abortRef, tone, classification.parsedInput)
        return
      }

      // 10. Rule engine: compose response from templates with personality
      // When a rule matched, use the rule's response field (specific template key like CONV_NATURAL)
      // When no rule matched (fallback), use the intent-to-template mapping
      let templateKey = 'UNKNOWN'
      if (classification.matchedRuleId) {
        // Look up the matched rule's response field for the specific template key
        const matchedRule = RULES.find(r => r.id === classification.matchedRuleId)
        templateKey = matchedRule?.response ?? getTemplateKeyFromIntent(classification.intent)
      }

      const rawResponse = pickTemplate(templateKey)
      const response = formatWithTone(rawResponse, tone, false)
      await addAssistantMessage(store, response, 'text', undefined, undefined, tone)

      // 11. Update system info state
      sysInfoState.turnCount = contextMemory.turnCount
      sysInfoState.storedVarsCount = memoryStore.list().length
      sysInfoState.contextFlags = [...contextMemory.getFlags()]
    },
    [store]
  )

  const abort = useCallback(() => {
    abortRef.current?.abort()
    store.setStreaming(false)
  }, [store])

  return { send, abort, isStreaming: store.isStreaming }
}

async function handleToolExecution(
  toolName: string,
  input: string,
  store: StoreApi,
  tone: Tone,
) {
  store.setToolStatus(toolName, 'running')
  store.setStreaming(true)

  try {
    const result = await executeTool(toolName, input)
    store.setToolStatus(toolName, result.status === 'ok' ? 'done' : 'error')

    const content =
      result.status === 'ok'
        ? formatWithTone(pickTemplate('TOOL_RESULT', { result: result.raw }), tone, true)
        : pickTemplate('TOOL_ERROR', {
            tool: toolName,
            message: String(result.result),
            suggestion: 'Try using !help to see available tools and syntax.',
          })

    await addAssistantMessage(store, content, result.displayType, toolName, result.execMs, tone)
  } catch (err) {
    store.setToolStatus(toolName, 'error')
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    await addAssistantMessage(
      store,
      pickTemplate('TOOL_ERROR', {
        tool: toolName,
        message: errorMsg,
        suggestion: 'Check your input and try again.',
      }),
      'error',
      toolName,
      undefined,
      tone,
    )
  } finally {
    store.setStreaming(false)
  }
}

async function handleToolChain(
  chain: string,
  store: StoreApi,
) {
  store.setStreaming(true)

  try {
    const result = await executeChain(chain)
    const content =
      result.status === 'ok'
        ? pickTemplate('TOOL_CHAIN_RESULT', {
            count: 'multiple',
            result: result.raw,
          })
        : pickTemplate('TOOL_ERROR', {
            tool: 'chain',
            message: String(result.result),
            suggestion: 'Check each step of your chain.',
          })

    await addAssistantMessage(store, content, result.displayType, 'chain', result.execMs, 'neutral')
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    await addAssistantMessage(
      store,
      pickTemplate('TOOL_ERROR', {
        tool: 'chain',
        message: errorMsg,
        suggestion: 'Maximum chain depth is 5. Cycles are not allowed.',
      }),
      'error',
      'chain',
    )
  } finally {
    store.setStreaming(false)
  }
}

async function handleAIRelay(
  input: string,
  store: StoreApi,
  abortRef: React.RefObject<AbortController | null>,
  tone: Tone,
  parsedInput?: import('@/lib/types').ParsedInput,
) {
  store.setStreaming(true)

  const assistantId = generateId()
  const assistantMsg: Message = {
    id: assistantId,
    role: 'assistant',
    content: '',
    displayType: 'text',
    timestamp: Date.now(),
    tone,
  }
  store.addMessage(assistantMsg)

  try {
    const context = contextMemory.summarize()
    const messages = useChatStore
      .getState()
      .messages.filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    const controller = new AbortController()
    abortRef.current = controller

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        context,
        tone,
        parsedInput: parsedInput ? {
          cleaned: parsedInput.cleaned,
          tone: parsedInput.tone,
          hedgeLevel: parsedInput.hedgeLevel,
          confidence: parsedInput.confidence,
        } : undefined,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    // Handle SSE streaming response
    if (response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const eventData = line.slice(6)
          if (eventData === '[DONE]') continue

          try {
            const event = JSON.parse(eventData)
            if (event.token) {
              fullContent += event.token
              store.updateLastMessage(event.token)
            }
            if (event.done) {
              store.setStreaming(false)
            }
            if (event.fallback) {
              // Server fell back to rule engine
              const classification = classifyInput(input, contextMemory.getFlags())
              const templateKey = getTemplateKeyFromIntent(classification.intent)
              const ruleResponse = formatWithTone(pickTemplate(templateKey), tone, false)
              store.updateLastMessage(ruleResponse)
              contextMemory.push('assistant', ruleResponse)
              return
            }
          } catch {
            // Skip malformed events
          }
        }
      }

      contextMemory.push('assistant', fullContent)
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      // User aborted, that's fine
    } else {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      store.updateLastMessage(
        `AI relay error: ${errorMsg}. Falling back to rule engine.`
      )
    }
  } finally {
    store.setStreaming(false)
  }
}

async function addAssistantMessage(
  store: StoreApi,
  content: string,
  displayType: Message['displayType'],
  toolName?: string,
  execMs?: number,
  tone?: Tone,
) {
  const msg: Message = {
    id: generateId(),
    role: 'assistant',
    content,
    displayType,
    toolName,
    execMs,
    timestamp: Date.now(),
    tone,
  }
  store.addMessage(msg)
  contextMemory.push('assistant', content, { toolName, execMs })

  // Update system info
  sysInfoState.turnCount = contextMemory.turnCount
  sysInfoState.storedVarsCount = memoryStore.list().length
  sysInfoState.contextFlags = [...contextMemory.getFlags()]
}

function getTemplateKeyFromIntent(intent: string): string {
  const mapping: Record<string, string> = {
    GREETING: 'GREET',
    FAREWELL: 'FAREWELL',
    GRATITUDE: 'GRATITUDE',
    APOLOGY: 'APOLOGY_ACK',
    AFFIRMATION: 'AFFIRM',
    NEGATION: 'NEGATE',
    QUESTION_META: 'IDENTITY',
    QUESTION_FACTUAL: 'CONV_QUESTION',
    QUESTION_OPINION: 'SMALL_TALK_OPINION',
    COMMAND: 'CONV_QUESTION',
    MATH: 'TOOL_RESULT',
    TIME: 'TOOL_RESULT',
    CONVERT: 'TOOL_RESULT',
    ENCODE: 'TOOL_RESULT',
    HASH: 'TOOL_RESULT',
    COLOR: 'TOOL_RESULT',
    REGEX: 'TOOL_RESULT',
    RANDOM: 'TOOL_RESULT',
    MEMORY_STORE: 'TOOL_RESULT',
    MEMORY_RECALL: 'TOOL_RESULT',
    SYSTEM_STATUS: 'SYSINFO',
    CHAIN_TOOL: 'TOOL_CHAIN_RESULT',
    FOLLOW_UP: 'FOLLOW_UP',
    SMALL_TALK: 'SMALL_TALK_STATUS',
    EMOTIONAL: 'EMOTIONAL_SOFT',
    CONFUSION: 'CONV_CONFUSED',
    REPAIR: 'REPAIR_REQUEST',
    PRESENCE: 'PRESENCE_CONFIRM',
    WORD: 'TOOL_RESULT',
    JSON: 'TOOL_RESULT',
    UNKNOWN: 'UNKNOWN',
  }
  return mapping[intent] || 'UNKNOWN'
}
