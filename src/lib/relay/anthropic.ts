// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Server-Side Anthropic SDK Wrapper
// API key lives ONLY in environment variables.
// It never touches the browser, session storage, or client code.
// ─────────────────────────────────────────────────────────────

import { ApiChatRequest, ApiChatStreamEvent } from '../types'

export interface RelayConfig {
  apiKey: string
  model?: string
  maxTokens?: number
}

export interface RelayMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface RelayStreamCallbacks {
  onToken: (token: string) => void
  onDone: (usage: { input_tokens: number; output_tokens: number }) => void
  onError: (error: Error) => void
}

const SYSTEM_PROMPT_BASE = `You are MACHINE MIND. Precise. Direct. Minimal. No filler. No apologies. No "certainly!". When you don't know, say so in one sentence. When you do know, be exact. You have access to tools but respond as a conversational AI. Keep responses concise and useful.`

export class AnthropicRelay {
  private apiKey: string
  private model: string
  private maxTokens: number

  constructor(config: RelayConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'claude-sonnet-4-20250514'
    this.maxTokens = config.maxTokens || 1024
  }

  buildSystemPrompt(context: string, toolResults?: string): string {
    let prompt = SYSTEM_PROMPT_BASE
    if (context) {
      prompt += `\n\n${context}`
    }
    if (toolResults) {
      prompt += `\n\nTool results from this turn: ${toolResults}`
    }
    return prompt
  }

  formatMessages(messages: Array<{ role: string; content: string }>): RelayMessage[] {
    return messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
  }

  async *streamResponse(
    messages: RelayMessage[],
    systemPrompt: string
  ): AsyncGenerator<ApiChatStreamEvent> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let totalInputTokens = 0
    let totalOutputTokens = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)

          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            yield { token: parsed.delta.text }
          }

          if (parsed.type === 'message_start' && parsed.message?.usage) {
            totalInputTokens = parsed.message.usage.input_tokens || 0
          }

          if (parsed.type === 'message_delta' && parsed.usage) {
            totalOutputTokens = parsed.usage.output_tokens || 0
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    yield {
      done: true,
      usage: { input_tokens: totalInputTokens, output_tokens: totalOutputTokens },
    }
  }
}

export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

export function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY
}
