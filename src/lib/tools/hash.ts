// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Hash Tool
// SHA-256 via Web Crypto API, UUID v4 via crypto.getRandomValues.
// Works in both browser and server-side (Edge Runtime) contexts.
// ─────────────────────────────────────────────────────────────

import type { ToolResult } from '../types'

// ── SHA-256 via Web Crypto API ───────────────────────────────
async function sha256(message: string): Promise<string> {
  const subtle = globalThis.crypto.subtle
  if (!subtle) {
    throw new Error('Web Crypto API (crypto.subtle) not available in this environment')
  }
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── UUID v4 (RFC 4122 compliant) ────────────────────────────
function uuidv4(): string {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  // Version 4: clear high nibble of byte 6, set 0100
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  // Variant 1: clear 2 high bits of byte 8, set 10
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// ── Input parsing ────────────────────────────────────────────
interface ParsedHashInput {
  action: 'sha256' | 'uuid'
  data: string
}

function parseInput(input: string): ParsedHashInput {
  const lower = input.toLowerCase().trim()

  // "uuid" / "generate uuid"
  if (/^uuid$/.test(lower) || /^generate\s+uuid$/.test(lower)) {
    return { action: 'uuid', data: '' }
  }

  // "sha256 hello" / "sha-256 hello" / "sha_256 hello" / "hash test string"
  const shaMatch = lower.match(/^(?:sha256|sha-256|sha_256|hash)\s+([\s\S]*)$/)
  if (shaMatch) {
    // Preserve original case for data
    const fullMatch = input.match(/^(?:sha256|sha-256|sha_256|hash)\s+([\s\S]*)$/i)
    return { action: 'sha256', data: fullMatch ? fullMatch[1] : shaMatch[1] }
  }

  // Default: sha256 of the input
  return { action: 'sha256', data: input.trim() }
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const { action, data } = parseInput(input)

    if (action === 'uuid') {
      const uuid = uuidv4()
      const execMs = Date.now() - t0
      return {
        status: 'ok',
        result: { uuid },
        displayType: 'code',
        raw: uuid,
        execMs,
      }
    }

    // SHA-256
    if (!data) {
      throw new Error('No input provided for SHA-256 hash')
    }
    const hash = await sha256(data)
    const execMs = Date.now() - t0
    return {
      status: 'ok',
      result: { algorithm: 'SHA-256', input: data, hash },
      displayType: 'code',
      raw: hash,
      execMs,
    }
  } catch (err: unknown) {
    const execMs = Date.now() - t0
    const message = err instanceof Error ? err.message : String(err)
    return {
      status: 'error',
      result: { error: message },
      displayType: 'error',
      raw: message,
      execMs,
    }
  }
}
