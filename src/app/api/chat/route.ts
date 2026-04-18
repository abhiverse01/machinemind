// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Streaming Chat Handler (POST)
// Critical security boundary: API key never leaves the server.
// Edge Runtime for streaming response with proper SSE headers.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, context, toolResults } = body as {
      messages: Array<{ role: string; content: string }>
      context?: string
      toolResults?: string
    }

    // API key comes ONLY from server-side env var
    // Never from the request body
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      // Fall back to rule engine — return a signal, not an error message
      return NextResponse.json({ fallback: true }, { status: 200 })
    }

    const systemPrompt = `You are MACHINE MIND. Precise. Direct. Minimal. No filler. No apologies. No "certainly!". When you don't know, say so in one sentence. When you do know, be exact.

Prior context: ${context || 'None'}
${toolResults ? `Tool results from this turn: ${toolResults}` : ''}`

    // Stream from Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Anthropic API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    // Return a ReadableStream of SSE-formatted tokens
    const encoder = new TextEncoder()
    const reader = response.body?.getReader()

    if (!reader) {
      return NextResponse.json({ error: 'No response body' }, { status: 500 })
    }

    const readable = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder()
        let buffer = ''

        try {
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
              if (data === '[DONE]') {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ done: true, usage: { input_tokens: 0, output_tokens: 0 } })}\n\n`
                  )
                )
                continue
              }

              try {
                const parsed = JSON.parse(data)

                if (
                  parsed.type === 'content_block_delta' &&
                  parsed.delta?.type === 'text_delta'
                ) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ token: parsed.delta.text })}\n\n`
                    )
                  )
                }

                if (parsed.type === 'message_delta' && parsed.usage) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        done: true,
                        usage: {
                          input_tokens: 0,
                          output_tokens: parsed.usage.output_tokens || 0,
                        },
                      })}\n\n`
                    )
                  )
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
