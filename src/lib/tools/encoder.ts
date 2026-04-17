// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Encoder Tool
// Base64, URL, Hex, Binary, ROT13, Morse — encode & decode.
// ─────────────────────────────────────────────────────────────

import type { ToolResult } from '../types'

// ── Base64 (Unicode-safe) ────────────────────────────────────
function b64Encode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1: string) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
}

function b64Decode(str: string): string {
  return decodeURIComponent(
    Array.from(atob(str), c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')
  )
}

// ── URL encoding ─────────────────────────────────────────────
function urlEncode(str: string): string {
  return encodeURIComponent(str)
}
function urlDecode(str: string): string {
  return decodeURIComponent(str)
}

// ── Hex encoding ─────────────────────────────────────────────
function hexEncode(str: string): string {
  return Array.from(str)
    .map(c => ('00' + c.charCodeAt(0).toString(16)).slice(-2))
    .join('')
}

function hexDecode(hex: string): string {
  const clean = hex.replace(/\s+/g, '')
  if (clean.length % 2 !== 0) throw new Error('Hex string must have even length')
  let result = ''
  for (let i = 0; i < clean.length; i += 2) {
    const code = parseInt(clean.slice(i, i + 2), 16)
    if (isNaN(code)) throw new Error(`Invalid hex pair at position ${i}: "${clean.slice(i, i + 2)}"`)
    result += String.fromCharCode(code)
  }
  return result
}

// ── Binary encoding ──────────────────────────────────────────
function binEncode(str: string): string {
  return Array.from(str)
    .map(c => ('00000000' + c.charCodeAt(0).toString(2)).slice(-8))
    .join(' ')
}

function binDecode(bin: string): string {
  const parts = bin.trim().split(/\s+/)
  return parts
    .map(b => {
      const code = parseInt(b, 2)
      if (isNaN(code) || b.length !== 8) throw new Error(`Invalid binary octet: "${b}"`)
      return String.fromCharCode(code)
    })
    .join('')
}

// ── ROT13 ────────────────────────────────────────────────────
function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

// ── Morse code (ITU) ─────────────────────────────────────────
const MORSE_ENCODE: Record<string, string> = {
  A: '.-',    B: '-...',  C: '-.-.',  D: '-..',   E: '.',     F: '..-.',
  G: '--.',   H: '....',  I: '..',    J: '.---',  K: '-.-',   L: '.-..',
  M: '--',    N: '-.',    O: '---',   P: '.--.',  Q: '--.-',  R: '.-.',
  S: '...',   T: '-',     U: '..-',   V: '...-',  W: '.--',   X: '-..-',
  Y: '-.--',  Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-',   ',': '--..--',   '?': '..--..',   "'": '.----.',
  '!': '-.-.--',   '/': '-..-.',    '(': '-.--.',    ')': '-.--.-',
  '&': '.-...',    ':': '---...',   ';': '-.-.-.',   '=': '-...-',
  '+': '.-.-.',    '-': '-....-',   '_': '..--.-',   '"': '.-..-.',
  '@': '.--.-.',
}

const MORSE_DECODE: Record<string, string> = {}
for (const [k, v] of Object.entries(MORSE_ENCODE)) {
  MORSE_DECODE[v] = k
}

function morseEncode(str: string): string {
  return str
    .toUpperCase()
    .split('')
    .map(c => {
      if (c === ' ') return '/'
      const code = MORSE_ENCODE[c]
      if (!code) throw new Error(`Cannot encode character in Morse: "${c}"`)
      return code
    })
    .join(' ')
}

function morseDecode(morse: string): string {
  return morse
    .trim()
    .split(/\s*\/\s*/)
    .map(word =>
      word
        .trim()
        .split(/\s+/)
        .map(code => {
          if (code === '') return ''
          const ch = MORSE_DECODE[code]
          if (!ch) throw new Error(`Unknown Morse sequence: "${code}"`)
          return ch
        })
        .join('')
    )
    .join(' ')
}

// ── Input parsing ────────────────────────────────────────────
type Encoding = 'base64' | 'url' | 'hex' | 'binary' | 'rot13' | 'morse'
type Direction = 'encode' | 'decode'

interface ParsedInput {
  encoding: Encoding
  direction: Direction
  data: string
}

function parseInput(input: string): ParsedInput {
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()

  // "encode base64 hello world" / "decode hex 48656c6c6f"
  const cmdMatch = lower.match(/^(encode|decode)\s+(base64|url|hex|binary|rot13|morse)\s+([\s\S]*)$/)
  if (cmdMatch) {
    const direction = cmdMatch[1] as Direction
    const encoding = cmdMatch[2] as Encoding
    // Preserve original case for data by slicing from the original string
    const prefixLen = (cmdMatch[1] + ' ' + cmdMatch[2] + ' ').length
    const data = trimmed.slice(prefixLen)
    return { encoding, direction, data }
  }

  // "morse encode SOS" / "morse decode ... --- ..."
  const morseDirMatch = lower.match(/^morse\s+(encode|decode)\s+([\s\S]*)$/)
  if (morseDirMatch) {
    const direction = morseDirMatch[1] as Direction
    const prefixLen = ('morse ' + morseDirMatch[1] + ' ').length
    const data = trimmed.slice(prefixLen)
    return { encoding: 'morse', direction, data }
  }

  // "rot13 hello" — ROT13 is its own inverse
  if (lower.startsWith('rot13 ')) {
    return { encoding: 'rot13', direction: 'encode', data: trimmed.slice(6) }
  }

  // "base64 hello" — assume encode
  const simpleMatch = lower.match(/^(base64|url|hex|binary|morse)\s+([\s\S]*)$/)
  if (simpleMatch) {
    const encoding = simpleMatch[1] as Encoding
    const prefixLen = simpleMatch[1].length + 1
    const data = trimmed.slice(prefixLen)
    return { encoding, direction: 'encode', data }
  }

  // Auto-detect: if input looks like encoded data, decode it
  if (/^[A-Za-z0-9+/]+=*$/.test(lower) && lower.length > 4) {
    return { encoding: 'base64', direction: 'decode', data: trimmed }
  }
  if (/^[0-9a-fA-F\s]+$/.test(lower) && lower.length >= 2) {
    return { encoding: 'hex', direction: 'decode', data: trimmed }
  }
  if (/^[01\s]+$/.test(lower)) {
    return { encoding: 'binary', direction: 'decode', data: trimmed }
  }
  if (/^[\s.\-/]+$/.test(lower) && (trimmed.includes('.') || trimmed.includes('-'))) {
    return { encoding: 'morse', direction: 'decode', data: trimmed }
  }

  // Default: base64 encode
  return { encoding: 'base64', direction: 'encode', data: trimmed }
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const { encoding, direction, data } = parseInput(input)

    if (!data && direction === 'encode') {
      throw new Error('No data to encode')
    }

    let result: string

    switch (encoding) {
      case 'base64':
        result = direction === 'encode' ? b64Encode(data) : b64Decode(data)
        break
      case 'url':
        result = direction === 'encode' ? urlEncode(data) : urlDecode(data)
        break
      case 'hex':
        result = direction === 'encode' ? hexEncode(data) : hexDecode(data)
        break
      case 'binary':
        result = direction === 'encode' ? binEncode(data) : binDecode(data)
        break
      case 'rot13':
        result = rot13(data)
        break
      case 'morse':
        result = direction === 'encode' ? morseEncode(data) : morseDecode(data)
        break
      default:
        throw new Error(`Unknown encoding: ${encoding}`)
    }

    const label = direction === 'encode' ? 'Encoded' : 'Decoded'
    const raw = `${label} (${encoding}):\n${result}`
    const execMs = Date.now() - t0

    return {
      status: 'ok',
      result: { encoding, direction, input: data, output: result },
      displayType: 'code',
      raw,
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
