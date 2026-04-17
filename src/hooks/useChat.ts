// ─────────────────────────────────────────────────────────────
// MACHINE MIND — useChat Hook
// Send message, handle stream, update store
// ─────────────────────────────────────────────────────────────

'use client'

import { useCallback, useRef } from 'react'
import { useChatStore } from '@/store/chat'
import { Tokenizer } from '@/lib/nlp/tokenizer'
import { classify } from '@/lib/nlp/classifier'
import { pickTemplate } from '@/lib/composer/templates'
import { contextMemory } from '@/lib/memory/context'
import { executeTool, executeChain } from '@/lib/tools/registry'
import { sysInfoState } from '@/lib/tools/sysinfo'
import { memoryStore } from '@/lib/tools/memory'
import type { Message, AppMode } from '@/lib/types'

const tokenizer = new Tokenizer()

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
          await addAssistantMessage(store, helpResponse, 'text')
          return
        }

        if (toolName === 'status') {
          await handleToolExecution('sysinfo', trimmed, store)
          return
        }

        // Route to the tool directly
        await handleToolExecution(toolName, toolInput || trimmed, store)
        return
      }

      // 4. Check for tool chain (pipe syntax)
      if (trimmed.includes('|')) {
        // Check if it looks like a tool chain
        const chainPattern = /\w+\s+[^|]+\|/
        if (chainPattern.test(trimmed)) {
          await handleToolChain(trimmed, store)
          return
        }
      }

      // 4. Run NLP pipeline
      const normalised = tokenizer.normalize(trimmed)
      const tokens = tokenizer.tokenize(normalised)
      const classification = classify(
        trimmed,
        normalised,
        tokens,
        contextMemory.getFlags()
      )

      // 5. Update context flags from matched rule
      // (This is handled inside classify indirectly, but we also
      // update context memory based on the classification result)
      contextMemory.push('system', `Intent: ${classification.intent}`, {
        classification,
      })

      // 6. Check for follow-up with pronoun resolution
      if (contextMemory.isFollowUp(trimmed)) {
        const lastTopic = contextMemory.expandLastTopic()
        if (lastTopic) {
          const response = pickTemplate('FOLLOW_UP', {
            topic: 'previous topic',
            detail: lastTopic,
          })
          await addAssistantMessage(store, response, 'text')
          return
        }
      }

      // 7. If intent has a tool hint, execute the tool
      if (classification.toolHint) {
        await handleToolExecution(classification.toolHint, trimmed, store)
        return
      }

      // 8. If mode is 'ai_relay', POST to /api/chat, stream tokens
      if (store.mode === 'ai_relay') {
        await handleAIRelay(trimmed, store, abortRef)
        return
      }

      // 9. Rule engine: compose response from templates
      const templateKey = classification.matchedRuleId
        ? getTemplateKeyFromIntent(classification.intent)
        : 'UNKNOWN'

      const response = pickTemplate(templateKey)
      await addAssistantMessage(store, response, 'text')

      // 10. Update system info state
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
  store: ReturnType<typeof useChatStore>
) {
  store.setToolStatus(toolName, 'running')
  store.setStreaming(true)

  try {
    const result = await executeTool(toolName, input)
    store.setToolStatus(toolName, result.status === 'ok' ? 'done' : 'error')

    const content =
      result.status === 'ok'
        ? pickTemplate('TOOL_RESULT', { result: result.raw })
        : pickTemplate('TOOL_ERROR', {
            tool: toolName,
            message: String(result.result),
            suggestion: 'Try using !help to see available tools and syntax.',
          })

    await addAssistantMessage(store, content, result.displayType, toolName, result.execMs)
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
      toolName
    )
  } finally {
    store.setStreaming(false)
  }
}

async function handleToolChain(
  chain: string,
  store: ReturnType<typeof useChatStore>
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

    await addAssistantMessage(store, content, result.displayType, 'chain', result.execMs)
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
      'chain'
    )
  } finally {
    store.setStreaming(false)
  }
}

async function handleAIRelay(
  input: string,
  store: ReturnType<typeof useChatStore>,
  abortRef: React.RefObject<AbortController | null>
) {
  store.setStreaming(true)

  const assistantId = generateId()
  const assistantMsg: Message = {
    id: assistantId,
    role: 'assistant',
    content: '',
    displayType: 'text',
    timestamp: Date.now(),
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
      body: JSON.stringify({ messages, context }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Check if server fell back to rule engine
    if (data.fallback) {
      // Re-run through rule engine
      const normalised = new Tokenizer().normalize(input)
      const tokens = new Tokenizer().tokenize(normalised)
      const classification = classify(input, normalised, tokens, contextMemory.getFlags())
      const templateKey = getTemplateKeyFromIntent(classification.intent)
      const ruleResponse = pickTemplate(templateKey)
      store.updateLastMessage(ruleResponse)
      contextMemory.push('assistant', ruleResponse)
      return
    }

    // Handle streaming response
    if (data.stream && response.body) {
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
          } catch {
            // Skip malformed events
          }
        }
      }

      contextMemory.push('assistant', fullContent)
    } else if (data.content) {
      // Non-streaming response
      store.updateLastMessage(data.content)
      contextMemory.push('assistant', data.content)
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
  store: ReturnType<typeof useChatStore>,
  content: string,
  displayType: Message['displayType'],
  toolName?: string,
  execMs?: number
) {
  const msg: Message = {
    id: generateId(),
    role: 'assistant',
    content,
    displayType,
    toolName,
    execMs,
    timestamp: Date.now(),
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
    QUESTION_FACTUAL: 'FACT_UNKNOWN',
    QUESTION_OPINION: 'OPINION_GENERIC',
    MATH: 'MATH_RESULT',
    TIME: 'TOOL_RESULT',
    CONVERT: 'TOOL_RESULT',
    ENCODE: 'TOOL_RESULT',
    HASH: 'TOOL_RESULT',
    COLOR: 'TOOL_RESULT',
    REGEX: 'TOOL_RESULT',
    RANDOM: 'TOOL_RESULT',
    MEMORY_STORE: 'TOOL_RESULT',
    MEMORY_RECALL: 'TOOL_RESULT',
    SYSTEM_STATUS: 'TOOL_RESULT',
    CHAIN_TOOL: 'TOOL_CHAIN_RESULT',
    FOLLOW_UP: 'FOLLOW_UP',
    SMALL_TALK: 'SMALL_TALK_STATUS',
    WORD: 'TOOL_RESULT',
    JSON: 'TOOL_RESULT',
    UNKNOWN: 'UNKNOWN',
    COMMAND: 'COMMAND_UNKNOWN',
  }
  return mapping[intent] || 'UNKNOWN'
}
