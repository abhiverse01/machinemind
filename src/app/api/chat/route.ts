// ─────────────────────────────────────────────────────────────
// MACHINE MIND v5.0 — Streaming Chat Handler (POST)
// Full Anthropic function calling + stream interruption.
// Edge Runtime + Anthropic SDK for agentic tool-use loop.
// API key lives in process.env only — never touches browser.
// ─────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'

export const runtime = 'edge'

// ═══════════════════════════════════════════════════════════════
// 14 TOOL DEFINITIONS for Anthropic function calling
// ═══════════════════════════════════════════════════════════════
const TOOL_DEFINITIONS = [
  {
    name: 'calculator',
    description:
      'Evaluate mathematical expressions — arithmetic, functions (sqrt, sin, cos, log, abs, ceil, floor, round), constants (pi, e), percentages, factorials, and power. Handles expressions like "2+3*4", "sqrt(144)", "5% of 200", "10!", "2^16", "sin(pi/4)". Returns numeric result with steps when applicable.',
    input_schema: {
      type: 'object' as const,
      properties: {
        expression: {
          type: 'string',
          description:
            'The math expression to evaluate, e.g. "2+3*4", "sqrt(144)", "50% of 200", "2^16", "sin(pi/4)", "10!"',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: 'clock',
    description:
      'Get current time/date in any timezone, convert between timezones, countdown to events, day-of-week lookup, and Unix timestamp conversion. Handles "time in Tokyo", "convert 3pm EST to JST", "days until 2025-12-25", "what day is 2025-07-04", "unix timestamp now".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Time query: timezone name, conversion, countdown, or Unix timestamp. e.g. "time in Tokyo", "convert 3pm EST to JST", "days until 2025-12-25", "what day is 2025-07-04", "unix now"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'converter',
    description:
      'Convert between units — length (km, mi, m, ft, in, cm, mm, yd), mass (kg, lb, oz, g), temperature (F, C, K), speed (mph, km/h, m/s, knots), data (KB, MB, GB, TB), area (sqft, sqm, acre, hectare), volume (L, gal, cup, ml, floz). Handles "5km to miles", "100F to C", "32oz to grams", "100mph to km/h".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Conversion query, e.g. "5km to miles", "100F to C", "32oz to grams", "100mph to km/h", "1 acre to sqft"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'encoder',
    description:
      'Encode and decode text — Base64, URL encoding, Hex, Binary, ROT13, Morse code. Handles "encode base64 hello world", "decode base64 aGVsbG8=", "encode hex Hello", "decode hex 48656c6c6f", "rot13 hello", "morse encode SOS", "morse decode ... --- ...".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Encoding/decoding instruction, e.g. "encode base64 hello world", "decode hex 48656c6c6f", "rot13 secret message", "morse encode SOS", "decode base64 aGVsbG8="',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'hash',
    description:
      'Compute SHA-256/SHA-1/MD5 hashes using Web Crypto API, or generate UUID v4. Handles "sha256 hello world", "sha1 hello", "md5 hello", "uuid", "uuid v4". Returns hex digest or UUID string.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Hash instruction: "sha256 <text>", "sha1 <text>", "md5 <text>", "uuid", "uuid v4". e.g. "sha256 hello world", "uuid"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'color',
    description:
      'Color conversion (HEX/RGB/HSL), palette generation (complementary, triadic, analogous, split-complementary), and WCAG contrast ratio checking. Handles "#ff6600 to rgb", "contrast #333 on #fff", "palette #6366f1", "complementary #ff0000", "triadic #00ff00", "analogous #3b82f6".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Color query: hex code for conversion, "contrast <c1> on <c2>", "palette <color>", "complementary <color>", "triadic <color>", "analogous <color>", "split <color>". e.g. "#ff6600", "contrast #333 on #fff", "palette #6366f1"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'random',
    description:
      'Cryptographically secure randomness — dice rolling (NdM), coin flips, random integers in range, password generation with configurable length/charset, pick from list, shuffle list. Handles "roll 2d20", "flip coin", "random 1-100", "password 16", "pick from red green blue", "shuffle a b c d e".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Randomness instruction: "roll 2d20", "roll d6", "flip coin", "random 1-100", "password 20", "password 12 --symbols", "pick from red green blue", "shuffle a b c d e"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'boolean',
    description:
      'Evaluate yes/no computational questions with proof — primality, perfect squares/cubes, divisibility, coprimality, range checks, palindromes, anagrams, even/odd, power of two, Fibonacci check. Handles "is 17 prime?", "is 64 a perfect square?", "is 100 divisible by 4?", "are 12 and 35 coprime?", "is racecar a palindrome?", "is 256 a power of 2?".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Boolean query, e.g. "is 17 prime?", "is 64 a perfect square?", "is 100 divisible by 4?", "are 12 and 35 coprime?", "is racecar a palindrome?", "is 256 a power of 2?", "is 21 a Fibonacci number?"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'diff',
    description:
      'Compare texts using Myers diff algorithm — character, word, or JSON mode with auto-detection. Shows added (+), removed (-), and unchanged content with similarity score percentage. Handles "diff hello vs hallo", "compare version1 and version2", "word diff the cat sat vs the dog sat".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Diff instruction: "<original> vs <modified>" or "diff <a> vs <b>". Supports mode prefix: "char diff ...", "word diff ...", "json diff ...". e.g. "hello vs hallo", "word diff the cat sat vs the dog sat"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'wordtools',
    description:
      'Text analysis — word count, character count (with/without spaces), sentence count, syllable count, Flesch reading ease score, Flesch-Kincaid grade level, palindrome check, anagram check, letter frequency analysis. Handles "analyze some text", "word count The quick brown fox", "readability of some text", "letter frequency hello world".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Text analysis instruction: "analyze <text>", "word count <text>", "char count <text>", "syllable count <word>", "readability <text>", "palindrome <word>", "anagram word1 word2", "letter frequency <text>". e.g. "analyze The quick brown fox jumps"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'json',
    description:
      'JSON tools — parse and pretty-print, minify, validate with error location, extract by dot-path (supports array indexing), list keys at path, and type checking. Handles "json format {...}", "json validate {...}", "json minify {...}", "json extract users[0].name from {...}", "json keys {...}", "json type users from {...}".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'JSON instruction: "format <json>", "validate <json>", "minify <json>", "extract <path> from <json>", "keys <json>", "keys <path> from <json>", "type <path> from <json>". e.g. "format {\\"name\\":\\"test\\"}", "extract users[0].name from {...}"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'regex',
    description:
      'Regex testing with capture groups highlighted, plain-English explanation of patterns, and common pattern library (email, URL, phone_us, ipv4, ipv6, hex_color, date_iso, credit_card, zip_us, slug). Handles "regex test /\\d+/ abc123", "regex explain /[a-z]+/gi", "regex for email", "regex for url".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Regex instruction: "test /pattern/flags testString" — runs regex and shows matches with groups, "explain /pattern/flags" — plain English breakdown, "for <patternName>" — returns common pattern (email, url, phone_us, ipv4, ipv6, hex_color, date_iso, credit_card, zip_us, slug). e.g. "test /\\d+/ abc123", "explain /[a-z]+/gi", "for email"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'memory',
    description:
      'Session memory — store, recall, forget, list, and clear key-value pairs. Persists across turns within a conversation session. Handles "remember Paris as my_city", "recall my_city", "forget my_city", "list memory", "clear memory". Keys are case-insensitive.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Memory instruction: "remember <value> as <key>", "recall <key>", "forget <key>", "list", "clear". e.g. "remember Paris as my_city", "recall my_city", "list"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'converter_advanced',
    description:
      'Advanced unit conversions with detailed step-by-step explanations and multi-step/chained conversions. Use this instead of converter when the user asks for conversion explanations, needs intermediate steps shown, or has complex multi-unit conversion chains. Handles "5km to miles with steps", "explain 100F to C conversion", "chain 5km to miles then miles to feet", "compare 1 liter in all volume units".',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Advanced conversion query requiring detailed output, step-by-step reasoning, or multi-step chaining. e.g. "5km to miles with steps", "explain 100F to C conversion", "chain 5km to miles then to feet", "compare 1 liter across volume units"',
        },
      },
      required: ['query'],
    },
  },
] as const

// ═══════════════════════════════════════════════════════════════
// SSE Helper
// ═══════════════════════════════════════════════════════════════
function sse(encoder: TextEncoder, event: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
}

// ═══════════════════════════════════════════════════════════════
// POST handler
// ═══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { messages = [], context, tone, workingMemory } = body

  // ── API key check (server-side only, never exposed) ──────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ fallback: true }, { status: 200 })
  }

  // ── Dynamic import of Anthropic SDK (Edge-compatible) ────
  // If SDK is not installed, silently fall back to rule engine
  let AnthropicCtor: any
  try {
    const mod = await import('@anthropic-ai/sdk')
    AnthropicCtor = mod.default
  } catch {
    return Response.json({ fallback: true }, { status: 200 })
  }

  const client = new AnthropicCtor({ apiKey })

  // ── Tone-adaptive system prompt ──────────────────────────
  const toneInstruction: Record<string, string> = {
    frustrated:
      'The user is frustrated. Be extremely concise. Lead with the answer. No preamble. Skip pleasantries entirely.',
    urgent:
      'The user needs this fast. Answer first, context second. Prioritize speed of comprehension.',
    playful:
      'The user is playful. Match with dry wit. Precision first, humor second. Keep it sharp.',
    curious:
      'The user wants to understand. Be precise and add just enough context to illuminate. Explain the "why" briefly.',
    neutral:
      'Be direct and precise. No filler words. Minimum viable response that is complete and correct.',
  }

  const workingMemorySummary = workingMemory
    ? Object.entries(workingMemory as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join('\n')
    : ''

  const systemPrompt = [
    'You are MACHINE MIND v5.0. Precise. Direct. Minimal.',
    'Never say "Great question!" "Certainly!" "Happy to help" "I\'d be happy to" or any sycophantic opener.',
    'Never apologize for being an AI. Never mention limitations unprompted.',
    'Answer in the fewest words that are complete and correct.',
    'Use tools when computation, conversion, encoding, hashing, or verification is needed — do not guess when you can compute.',
    'Chain tools naturally — hash then encode, calculate then convert, check then assert.',
    'When you use a tool, present its result cleanly without repeating the tool name unless helpful for clarity.',
    toneInstruction[tone ?? 'neutral'] ?? toneInstruction.neutral,
    context ? `Conversation context:\n${context}` : '',
    workingMemorySummary
      ? `Working memory (recent results the user may reference):\n${workingMemorySummary}`
      : '',
    'Built by Abhishek Shah · abhishekshah.vercel.app · abhishek.aimarine@gmail.com',
  ]
    .filter(Boolean)
    .join('\n\n')

  // ── Stream interruption signal ───────────────────────────
  const abortController = new AbortController()
  let streamClosed = false

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      let currentMessages = messages
      let iterationCount = 0
      const MAX_TOOL_ITERATIONS = 5

      const close = () => {
        if (!streamClosed) {
          streamClosed = true
          try {
            controller.close()
          } catch {
            // Stream already closed — ignore
          }
        }
      }

      const enqueue = (event: Record<string, unknown>) => {
        if (streamClosed) return
        try {
          controller.enqueue(sse(encoder, event))
        } catch {
          // Stream broken — mark closed
          streamClosed = true
        }
      }

      // Listen for client disconnect
      req.signal.addEventListener('abort', () => {
        abortController.abort()
        close()
      })

      try {
        // ═══════════════════════════════════════════════════
        // AGENTIC LOOP: stream → detect tools → execute → feed back
        // ═══════════════════════════════════════════════════
        while (iterationCount < MAX_TOOL_ITERATIONS && !streamClosed) {
          iterationCount++

          const stream = client.messages.stream(
            {
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1024,
              system: systemPrompt,
              tools: TOOL_DEFINITIONS as unknown as AnthropicToolDef[],
              messages: currentMessages,
            },
            {
              signal: abortController.signal,
            }
          )

          let hasToolUse = false
          const toolUseBlocks: ToolUseBlock[] = []
          const inputAccumulators: Map<string, string> = new Map()
          let textBuffer = ''

          // ── Process stream events ────────────────────────
          for await (const event of stream) {
            if (streamClosed) break

            // Text tokens — stream to client immediately
            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                textBuffer += event.delta.text
                enqueue({ token: event.delta.text })
              }
              // Accumulate partial JSON for tool inputs
              if (event.delta.type === 'input_json_delta') {
                const lastTool = toolUseBlocks[toolUseBlocks.length - 1]
                if (lastTool) {
                  const existing = inputAccumulators.get(lastTool.id) ?? ''
                  inputAccumulators.set(
                    lastTool.id,
                    existing + event.delta.partial_json
                  )
                }
              }
            }

            // Tool use block started
            if (
              event.type === 'content_block_start' &&
              event.content_block?.type === 'tool_use'
            ) {
              hasToolUse = true
              toolUseBlocks.push({
                id: event.content_block.id,
                name: event.content_block.name,
              })
              inputAccumulators.set(event.content_block.id, '')
            }
          }

          // Stream was interrupted — bail out
          if (streamClosed) break

          // ── Get final message from stream ────────────────
          let finalMsg: any
          try {
            finalMsg = await stream.finalMessage()
          } catch {
            // Stream interrupted or aborted
            enqueue({ done: true, usage: null })
            break
          }

          // ── No tools used — we're done ───────────────────
          if (!hasToolUse || toolUseBlocks.length === 0) {
            enqueue({ done: true, usage: finalMsg.usage ?? null })
            break
          }

          // ═════════════════════════════════════════════════
          // Execute tool calls server-side
          // ═════════════════════════════════════════════════
          const toolResults: AnthropicToolResult[] = []

          for (const toolBlock of toolUseBlocks) {
            if (streamClosed) break

            const rawInput = inputAccumulators.get(toolBlock.id) ?? '{}'
            let toolInput: Record<string, unknown>
            try {
              toolInput = JSON.parse(rawInput)
            } catch {
              toolInput = {}
            }

            // Notify client: tool is running
            enqueue({
              toolRunning: toolBlock.name,
              toolId: toolBlock.id,
            })

            try {
              const result = await executeToolServerSide(
                toolBlock.name,
                toolInput
              )
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolBlock.id,
                content: typeof result === 'string' ? result : JSON.stringify(result),
              })

              // Notify client: tool completed
              enqueue({
                toolDone: toolBlock.name,
                toolId: toolBlock.id,
                result,
              })
            } catch (err) {
              const errorMsg =
                err instanceof Error ? err.message : String(err)
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolBlock.id,
                content: JSON.stringify({ error: errorMsg }),
                is_error: true,
              })

              enqueue({
                toolDone: toolBlock.name,
                toolId: toolBlock.id,
                result: { error: errorMsg },
              })
            }
          }

          // Stream was interrupted during tool execution
          if (streamClosed) break

          // ── Feed tool results back and continue loop ─────
          currentMessages = [
            ...currentMessages,
            { role: 'assistant', content: finalMsg.content },
            { role: 'user', content: toolResults },
          ]
        }

        // ── Max iterations safety exit ─────────────────────
        if (iterationCount >= MAX_TOOL_ITERATIONS && !streamClosed) {
          enqueue({
            done: true,
            maxIterationsReached: true,
            usage: null,
          })
        }
      } catch (err) {
        if (!streamClosed) {
          const msg = err instanceof Error ? err.message : 'Stream error'
          enqueue({ error: msg })
        }
      }

      close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ═══════════════════════════════════════════════════════════════
// Server-side tool executor — dynamic imports from @/lib/tools/*
// ═══════════════════════════════════════════════════════════════
async function executeToolServerSide(
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const toolMap: Record<
    string,
    () => Promise<{ execute: (input: string) => Promise<unknown> }>
  > = {
    calculator: () => import('@/lib/tools/calculator'),
    clock: () => import('@/lib/tools/clock'),
    converter: () => import('@/lib/tools/converter'),
    encoder: () => import('@/lib/tools/encoder'),
    hash: () => import('@/lib/tools/hash'),
    color: () => import('@/lib/tools/color'),
    random: () => import('@/lib/tools/random'),
    boolean: () => import('@/lib/tools/boolean'),
    diff: () => import('@/lib/tools/diff'),
    wordtools: () => import('@/lib/tools/wordtools'),
    json: () => import('@/lib/tools/json'),
    regex: () => import('@/lib/tools/regex'),
    memory: () => import('@/lib/tools/memory'),
    converter_advanced: () => import('@/lib/tools/converter'),
  }

  const loader = toolMap[toolName]
  if (!loader) throw new Error(`Unknown tool: ${toolName}`)

  const mod = await loader()

  // Resolve the input string — tools accept a single query/expression string
  const queryStr =
    typeof input.query === 'string'
      ? input.query
      : typeof input.expression === 'string'
        ? input.expression
        : typeof input.input === 'string'
          ? input.input
          : JSON.stringify(input)

  return mod.execute(queryStr)
}

// ═══════════════════════════════════════════════════════════════
// Type helpers (kept local — Anthropic types may not be installed)
// ═══════════════════════════════════════════════════════════════
interface ToolUseBlock {
  id: string
  name: string
}

interface AnthropicToolResult {
  type: 'tool_result'
  tool_use_id: string
  content: string
  is_error?: boolean
}

interface AnthropicToolDef {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}
