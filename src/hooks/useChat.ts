'use client'

import { useCallback } from 'react'
import { useChatStore } from '@/store/chat'
import { classifyInput } from '@/lib/nlp/classifier'
import { RULES } from '@/lib/nlp/rules'
import { pickTemplate } from '@/lib/composer/templates'
import { formatWithTone } from '@/lib/composer/personality'
import { contextMemory } from '@/lib/memory/context'
import { executeTool, executeChain } from '@/lib/tools/registry'
import { sysInfoState } from '@/lib/tools/sysinfo'
import { memoryStore } from '@/lib/tools/memory'
import { GibberishParser } from '@/lib/nlp/gibberish'
import { FuzzyMatcher } from '@/lib/nlp/fuzzy'
import { ImplicitFactExtractor } from '@/lib/nlp/implicitFacts'
import { ValueExtractor } from '@/lib/nlp/valueExtractor'
import type { Message, Tone, ToolResult, ConversationState } from '@/lib/types'

type StoreApi = ReturnType<typeof useChatStore.getState>

export function useChat() {
  const isStreaming = useChatStore((s) => s.isStreaming)

  const send = useCallback(
    async (input: string) => {
      const store = useChatStore.getState()
      if (!input.trim() || store.isStreaming) return

      const trimmed = input.trim()
      const charCount = trimmed.length

      // ── v5.0 Step 1: Paste / Document detection ─────────────
      const newlineCount = (trimmed.match(/\n/g) ?? []).length
      const hasJSONBlock = /^\s*[\[{]/.test(trimmed) && /[\]}]\s*$/.test(trimmed)
      const hasCodeBlock = /```/.test(trimmed)
      const isDocMode = charCount > 200 || newlineCount >= 3 || hasJSONBlock || hasCodeBlock

      // ── v5.0 Step 2: GibberishParser.parse ──────────────────
      const parsedInput = GibberishParser.parse(trimmed)

      // ── v5.0 Step 3: ImplicitFactExtractor.extract → store ──
      const implicitFacts = ImplicitFactExtractor.extract(trimmed)
      for (const fact of implicitFacts) {
        store.addImplicitFact(fact.key, fact.value)
      }

      // ── v5.0 Step 4: FuzzyMatcher.correctSentence ───────────
      const fuzzyTokens = parsedInput.cleaned.split(/\s+/).filter(Boolean)
      const { tokens: correctedTokens, corrections: fuzzyCorrections } = FuzzyMatcher.correctSentence(fuzzyTokens)

      // Merge corrections into parsedInput
      const allCorrections = [...parsedInput.corrections, ...fuzzyCorrections]
      const correctedCleaned = correctedTokens.join(' ') || trimmed
      const enrichedParsedInput = {
        ...parsedInput,
        corrections: allCorrections,
        wasCorrected: parsedInput.wasCorrected || fuzzyCorrections.length > 0,
        cleaned: correctedCleaned,
      }

      // ── v5.0 Step 5: WorkingMemory.resolve → resolve pronouns
      let resolvedInput = correctedCleaned
      const wmResult = store.workingMemory.resolve(correctedCleaned)
      if (wmResult) {
        resolvedInput = correctedCleaned.replace(
      /\b(that|it|this|the result|the value|the previous|the output|the answer|that result|this result|that value|this value)\b/i,
      wmResult.resolved,
    )
        if (resolvedInput === correctedCleaned) {
          resolvedInput = wmResult.resolved
        }
      }

      // ── v5.0 Step 6: ConversationStateMachine.transition ────
      const tone: Tone = enrichedParsedInput.tone ?? 'neutral'
      store.updateConversationState(trimmed, tone, charCount)

      // ── v5.0 Step 7: ValueExtractor.extract ─────────────────
      ValueExtractor.extract(resolvedInput)

      // ── Add user message ────────────────────────────────────
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        displayType: 'text',
        timestamp: Date.now(),
      }
      store.addMessage(userMsg)

      // ── Update context memory ───────────────────────────────
      contextMemory.push('user', trimmed)

      // ── Check for direct ! tool invocation ──────────────────
      if (trimmed.startsWith('!')) {
        const parts = trimmed.slice(1).trim()
        const spaceIdx = parts.indexOf(' ')
        const toolName = spaceIdx === -1 ? parts.toLowerCase() : parts.slice(0, spaceIdx).toLowerCase()
        const toolInput = spaceIdx === -1 ? '' : parts.slice(spaceIdx + 1).trim()

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

      // ── Check for tool chain (pipe syntax) ──────────────────
      if (trimmed.includes('|')) {
        const chainPattern = /\w+\s+[^|]+\|/
        if (chainPattern.test(trimmed)) {
          await handleToolChain(trimmed, store)
          return
        }
      }

      // ── v5.0 Step 8: Doc mode detection ────────────────────
      if (isDocMode) {
        store.setDocModeContent(trimmed)
        store.setConversationState('DOC_MODE')

        // Auto-detect tool: JSON → json, long text → wordtools
        let autoTool = 'wordtools'
        if (hasJSONBlock) {
          autoTool = 'json'
        }

        const lines = (trimmed.match(/\n/g) ?? []).length + 1
        const docEnter = pickTemplate('DOC_MODE_ENTER', {
          chars: String(charCount),
          lines: String(lines),
          tool: autoTool,
        })
        await addAssistantMessage(store, docEnter, 'text', undefined, undefined, tone)

        // Execute the auto-detected tool
        await handleToolExecution(autoTool, trimmed, store, tone)
        return
      }

      // ── v5.0 Step 9: classifyInput with workingMemory + conversationState ──
      const classification = classifyInput(
        trimmed,
        contextMemory.getFlags(),
        store.workingMemory,
        store.conversationState,
      )
      const classTone: Tone = classification.parsedInput?.tone ?? tone

      // ── Update context memory with classification info ──────
      contextMemory.push('system', `Intent: ${classification.intent}`, {
        classification,
      })

      // ── v5.0: Build implicit fact confirmations ─────────────
      let factConfirmations = ''
      if (implicitFacts.length > 0) {
        const confirms = implicitFacts.map(
          (f) => pickTemplate('IMPLICIT_FACT_CONFIRM', { key: f.key, value: f.value })
        )
        factConfirmations = '\n' + confirms.join('\n')
      }

      // ── v5.0 Step 10: Route based on classification ────────

      // If intent has a tool hint, execute the tool
      if (classification.toolHint) {
        await handleToolExecution(classification.toolHint, trimmed, store, classTone, factConfirmations)
        return
      }

      // If mode is 'ai_relay', POST to /api/chat, stream tokens
      if (store.mode === 'ai_relay') {
        await handleAIRelay(trimmed, store, classTone, enrichedParsedInput, factConfirmations)
        return
      }

      // Rule engine: compose response from templates with personality
      let templateKey = 'UNKNOWN'
      if (classification.matchedRuleId) {
        const matchedRule = RULES.find(r => r.id === classification.matchedRuleId)
        templateKey = matchedRule?.response ?? getTemplateKeyFromIntent(classification.intent)
      }

      const rawResponse = pickTemplate(templateKey)
      const response = formatWithTone(rawResponse + factConfirmations, classTone, false)
      await addAssistantMessage(store, response, 'text', undefined, undefined, classTone)

      // ── Update system info state ────────────────────────────
      sysInfoState.turnCount = contextMemory.turnCount
      sysInfoState.storedVarsCount = memoryStore.list().length
      sysInfoState.contextFlags = [...contextMemory.getFlags()]
    },
    [],
  )

  const abort = useCallback(() => {
    useChatStore.getState().abortStream()
  }, [])

  return { send, abort, isStreaming }
}

// ── Tool Execution Handler ─────────────────────────────────
async function handleToolExecution(
  toolName: string,
  input: string,
  store: StoreApi,
  tone: Tone,
  factConfirmations: string = '',
) {
  store.setToolStatus(toolName, 'running')
  store.setStreaming(true)

  try {
    const result = await executeTool(toolName, input)
    store.setToolStatus(toolName, result.status === 'ok' ? 'done' : 'error')

    // v5.0: ALWAYS write to working memory after tool execution
    store.writeWorkingMemory(toolName, result, String(contextMemory.turnCount))

    // v5.0: ALWAYS increment tool frequency
    store.incrementToolFrequency(toolName)

    // Update working memory snapshot in context memory
    contextMemory.setWorkingMemorySnapshot(store.workingMemory.getAll())

    const content =
      result.status === 'ok'
        ? formatWithTone(pickTemplate('TOOL_RESULT', { result: result.raw }), tone, true)
        : pickTemplate('TOOL_ERROR', {
            tool: toolName,
            message: String(result.result),
            suggestion: 'Try using !help to see available tools and syntax.',
          })

    await addAssistantMessage(store, content + factConfirmations, result.displayType, toolName, result.execMs, tone)
  } catch (err) {
    store.setToolStatus(toolName, 'error')
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    await addAssistantMessage(
      store,
      pickTemplate('TOOL_ERROR', {
        tool: toolName,
        message: errorMsg,
        suggestion: 'Check your input and try again.',
      }) + factConfirmations,
      'error',
      toolName,
      undefined,
      tone,
    )
  } finally {
    store.setStreaming(false)
  }
}

// ── Tool Chain Handler ─────────────────────────────────────
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

    // v5.0: Write to working memory and increment frequency for chains
    store.writeWorkingMemory('chain', result, String(contextMemory.turnCount))
    store.incrementToolFrequency('chain')
    contextMemory.setWorkingMemorySnapshot(store.workingMemory.getAll())

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

// ── AI Relay Handler ───────────────────────────────────────
async function handleAIRelay(
  input: string,
  store: StoreApi,
  tone: Tone,
  parsedInput?: import('@/lib/types').ParsedInput,
  factConfirmations: string = '',
) {
  store.setStreaming(true)

  const assistantId = crypto.randomUUID()
  const assistantMsg: Message = {
    id: assistantId,
    role: 'assistant',
    content: '',
    displayType: 'text',
    timestamp: Date.now(),
    tone,
  }
  store.addMessage(assistantMsg)

  // Prepend fact confirmations if any
  if (factConfirmations) {
    store.updateLastMessage(factConfirmations.trim())
  }

  try {
    const context = contextMemory.summarize()
    const messages = useChatStore
      .getState()
      .messages.filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    // v5.0: Use AbortController from store
    const controller = new AbortController()
    store.setAbortController(controller)

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
      // User aborted — already handled by store.abortStream()
    } else {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      store.updateLastMessage(
        `AI relay error: ${errorMsg}. Falling back to rule engine.`
      )
    }
  } finally {
    store.setAbortController(null)
    store.setStreaming(false)
  }
}

// ── Assistant Message Helper ───────────────────────────────
async function addAssistantMessage(
  store: StoreApi,
  content: string,
  displayType: Message['displayType'],
  toolName?: string,
  execMs?: number,
  tone?: Tone,
) {
  const msg: Message = {
    id: crypto.randomUUID(),
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

// ── Intent → Template Key Mapping ──────────────────────────
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
    BOOLEAN: 'TOOL_RESULT',
    DIFF: 'TOOL_RESULT',
    DOC_MODE: 'DOC_MODE_PROMPT',
    UNKNOWN: 'UNKNOWN',
  }
  return mapping[intent] || 'UNKNOWN'
}
