// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Streaming Chat Handler (POST)
// v4.0: Tone-adaptive system prompt, parsedInput support.
// Edge Runtime + Anthropic SDK for streaming SSE.
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { messages, context, tone, parsedInput } = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ fallback: true }, { status: 200 })
  }

  // Dynamic import for Anthropic SDK (Edge-compatible)
  let Anthropic: typeof import('@anthropic-ai/sdk').default
  try {
    const mod = await import('@anthropic-ai/sdk')
    Anthropic = mod.default
  } catch {
    return Response.json({ fallback: true }, { status: 200 })
  }

  const client = new Anthropic({ apiKey })

  // Tone-adaptive system prompt
  const toneInstruction: Record<string, string> = {
    frustrated: 'The user is frustrated. Be extremely concise. No preamble. Just the answer.',
    urgent: 'The user needs this fast. Lead with the answer.',
    playful: 'The user is in a playful mood. Match with dry wit. Stay precise.',
    curious: 'The user wants to understand. Be informative but still concise.',
    neutral: 'Be direct and precise.',
  }

  const systemPrompt = [
    'You are MACHINE MIND. Precise. Direct. Minimal.',
    'Never say "Great question!" or "Certainly!" or "I\'d be happy to".',
    'Never apologize for being an AI. Never mention limitations unprompted.',
    'Answer in the fewest words that are complete and correct.',
    toneInstruction[tone ?? 'neutral'] ?? toneInstruction.neutral,
    context ? `Prior context: ${context}` : '',
    'Built by Abhishek Shah · abhishekshah.vercel.app',
  ].filter(Boolean).join('\n')

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`
              ))
            }
          }
          const final = await stream.finalMessage()
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ done: true, usage: final.usage })}\n\n`
          ))
          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ error: msg })}\n\n`
          ))
          controller.close()
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'API error'
    return Response.json({ fallback: true, error: msg }, { status: 200 })
  }
}
