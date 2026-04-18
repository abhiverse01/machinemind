// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Random Tool
// All randomness via crypto.getRandomValues(). No Math.random().
// execMs measured with Date.now().
// ─────────────────────────────────────────────────────────────

import type { ToolResult, DiceResult, PasswordOptions } from '../types'

// ── Crypto random helpers ────────────────────────────────────
function randomUint32(): number {
  const buf = new Uint32Array(1)
  globalThis.crypto.getRandomValues(buf)
  return buf[0]
}

function randomFloat(): number {
  return randomUint32() / 0xFFFFFFFF
}

function randomInt(min: number, max: number): number {
  // Rejection sampling for uniform distribution
  const range = max - min + 1
  if (range <= 0) throw new Error('Invalid range: max must be >= min')
  const maxUint32 = 0xFFFFFFFF
  const maxAllowed = maxUint32 - (maxUint32 % range)
  let val: number
  do {
    val = randomUint32()
  } while (val > maxAllowed)
  return min + (val % range)
}

// ── Dice roller (NdM format) ─────────────────────────────────
function rollDice(notation: string): DiceResult {
  // Parse NdM or NdM+K format: 2d20, d6, 4d8, 3d6+5, 3d6-2
  const match = notation.toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/)
  if (!match) throw new Error(`Invalid dice notation: "${notation}". Use NdM format (e.g., 2d20, d6, 4d8+2)`)
  const count = match[1] ? parseInt(match[1]) : 1
  const sides = parseInt(match[2])
  const modifier = match[3] ? parseInt(match[3]) : 0

  if (count < 1 || count > 100) throw new Error('Dice count must be between 1 and 100')
  if (sides < 2 || sides > 1000) throw new Error('Dice sides must be between 2 and 1000')

  const rolls: number[] = []
  for (let i = 0; i < count; i++) {
    rolls.push(randomInt(1, sides))
  }
  const total = rolls.reduce((a, b) => a + b, 0) + modifier

  return { rolls, total, notation }
}

// ── Coin flip ────────────────────────────────────────────────
function flipCoin(): 'Heads' | 'Tails' {
  const buf = new Uint8Array(1)
  globalThis.crypto.getRandomValues(buf)
  // 1-bit sample
  return (buf[0] & 1) === 0 ? 'Heads' : 'Tails'
}

// ── Password generator ───────────────────────────────────────
function generatePassword(options: PasswordOptions): string {
  const LOWER = 'abcdefghijklmnopqrstuvwxyz'
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const DIGITS = '0123456789'
  const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let charset = ''
  if (options.lowercase) charset += LOWER
  if (options.uppercase) charset += UPPER
  if (options.digits) charset += DIGITS
  if (options.symbols) charset += SYMBOLS
  if (charset.length === 0) {
    charset = LOWER + UPPER + DIGITS
  }

  const bytes = new Uint8Array(options.length)
  globalThis.crypto.getRandomValues(bytes)

  let password = ''
  for (let i = 0; i < options.length; i++) {
    // Modulo on random byte for charset selection
    password += charset[bytes[i]! % charset.length]
  }
  return password
}

// ── Pick from list ───────────────────────────────────────────
function pickFromList(items: string[]): string {
  if (items.length === 0) throw new Error('Empty list to pick from')
  const idx = randomInt(0, items.length - 1)
  return items[idx]
}

// ── Fisher-Yates shuffle with crypto random ──────────────────
function shuffleList<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Input parsing ────────────────────────────────────────────
type RandomAction = 'dice' | 'coin' | 'integer' | 'float' | 'password' | 'pick' | 'shuffle'

interface ParsedRandomInput {
  action: RandomAction
  notation?: string
  min?: number
  max?: number
  items?: string[]
  passwordOptions?: PasswordOptions
}

function parsePasswordOptions(input: string): PasswordOptions {
  const lower = input.toLowerCase()
  const lengthMatch = lower.match(/^(\d+)/)
  const length = lengthMatch ? parseInt(lengthMatch[1]) : 16

  // If charset keywords are specified after the length, use them
  const hasLower = /\blower(?:case)?\b/.test(lower)
  const hasUpper = /\bupper(?:case)?\b/.test(lower)
  const hasDigits = /\bdigits?\b/.test(lower)
  const hasSymbols = /\bsymbols?\b/.test(lower)

  // If any charset keyword is present, only use specified charsets
  if (hasLower || hasUpper || hasDigits || hasSymbols) {
    return {
      length,
      lowercase: hasLower,
      uppercase: hasUpper,
      digits: hasDigits,
      symbols: hasSymbols,
    }
  }

  // Default: all charsets
  return { length, lowercase: true, uppercase: true, digits: true, symbols: true }
}

function parseInput(input: string): ParsedRandomInput {
  const lower = input.toLowerCase().trim()

  // "roll 2d20" / "roll d6"
  const rollMatch = lower.match(/^roll\s+(\d*d\d+(?:[+-]\d+)?)$/)
  if (rollMatch) {
    return { action: 'dice', notation: rollMatch[1] }
  }

  // "dice d6" / "dice 2d20" / "dice 3d6+5"
  const diceKeywordMatch = lower.match(/^dice\s+(\d*d\d+(?:[+-]\d+)?)$/)
  if (diceKeywordMatch) {
    return { action: 'dice', notation: diceKeywordMatch[1] }
  }

  // Bare NdM notation: "2d20", "d6", "4d8", "3d6+5"
  const bareDiceMatch = lower.match(/^(\d*d\d+(?:[+-]\d+)?)$/)
  if (bareDiceMatch) {
    return { action: 'dice', notation: bareDiceMatch[1] }
  }

  // "flip a coin" / "flip coin" / "coin flip" / "coin toss" / "coin"
  if (/^(?:flip\s+(?:a\s+)?)?coin|coin\s*(?:flip|toss)?$/.test(lower)) {
    return { action: 'coin' }
  }

  // "random 1-100" / "random 1 to 100" / "random between 1 and 100"
  const rangeMatch = lower.match(/^random\s+(\d+)\s*[-–to]+\s*(\d+)$/)
  if (rangeMatch) {
    return { action: 'integer', min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) }
  }

  // "random number 50" / "random number" → 1-N range
  const randomNumberMatch = lower.match(/^random\s+number\s+(\d+)$/)
  if (randomNumberMatch) {
    return { action: 'integer', min: 1, max: parseInt(randomNumberMatch[1]) }
  }

  // "float" / "random float"
  if (/^(?:random\s+)?float$/.test(lower)) {
    return { action: 'float' }
  }

  // "password 20" / "password 12 upper digits" / "password 16 lower symbols"
  const pwdWithArgsMatch = lower.match(/^password\s+(.+)$/)
  if (pwdWithArgsMatch) {
    return {
      action: 'password',
      passwordOptions: parsePasswordOptions(pwdWithArgsMatch[1]),
    }
  }

  // "password" / "generate password" — default password
  if (/^(?:generate\s+)?password$/.test(lower)) {
    return {
      action: 'password',
      passwordOptions: { length: 16, lowercase: true, uppercase: true, digits: true, symbols: true },
    }
  }

  // "pick from apple banana cherry" / "pick apple, banana, cherry"
  const pickMatch = input.match(/^pick\s+(?:from\s+)?(.+)$/i)
  if (pickMatch) {
    const items = pickMatch[1].split(/[\s,]+/).filter(s => s.length > 0)
    return { action: 'pick', items }
  }

  // "shuffle a b c d e" / "shuffle a, b, c, d, e"
  const shuffleMatch = input.match(/^shuffle\s+(.+)$/i)
  if (shuffleMatch) {
    const items = shuffleMatch[1].split(/[\s,]+/).filter(s => s.length > 0)
    return { action: 'shuffle', items }
  }

  // Default: coin flip
  return { action: 'coin' }
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const parsed = parseInput(input)

    switch (parsed.action) {
      case 'dice': {
        const result = rollDice(parsed.notation!)
        const execMs = Date.now() - t0
        const hasModifier = /[+-]/.test(parsed.notation!)
        const raw = hasModifier
          ? `Rolling ${result.notation}: [${result.rolls.join(', ')}] + modifier = ${result.total}`
          : `Rolling ${result.notation}: [${result.rolls.join(', ')}] = ${result.total}`
        return { status: 'ok', result, displayType: 'code', raw, execMs }
      }
      case 'coin': {
        const result = flipCoin()
        const execMs = Date.now() - t0
        return { status: 'ok', result, displayType: 'text', raw: result, execMs }
      }
      case 'integer': {
        const min = parsed.min ?? 1
        const max = parsed.max ?? 100
        const result = randomInt(min, max)
        const execMs = Date.now() - t0
        const raw = `Random integer (${min}\u2013${max}): ${result}`
        return { status: 'ok', result, displayType: 'text', raw, execMs }
      }
      case 'float': {
        const result = randomFloat()
        const execMs = Date.now() - t0
        const raw = `Random float: ${result}`
        return { status: 'ok', result, displayType: 'text', raw, execMs }
      }
      case 'password': {
        const opts = parsed.passwordOptions ?? { length: 16, lowercase: true, uppercase: true, digits: true, symbols: true }
        const result = generatePassword(opts)
        const execMs = Date.now() - t0
        const charsets: string[] = []
        if (opts.lowercase) charsets.push('lowercase')
        if (opts.uppercase) charsets.push('uppercase')
        if (opts.digits) charsets.push('digits')
        if (opts.symbols) charsets.push('symbols')
        const raw = `Generated password (${opts.length} chars, ${charsets.join('/')}): ${result}`
        return { status: 'ok', result, displayType: 'code', raw, execMs }
      }
      case 'pick': {
        if (!parsed.items || parsed.items.length === 0) throw new Error('No items to pick from')
        const picked = pickFromList(parsed.items)
        const execMs = Date.now() - t0
        const raw = `Picked: ${picked} (from: ${parsed.items.join(', ')})`
        return { status: 'ok', result: { picked, from: parsed.items }, displayType: 'text', raw, execMs }
      }
      case 'shuffle': {
        if (!parsed.items || parsed.items.length === 0) throw new Error('No items to shuffle')
        const result = shuffleList(parsed.items)
        const execMs = Date.now() - t0
        const raw = `Shuffled: ${result.join(', ')}`
        return { status: 'ok', result, displayType: 'text', raw, execMs }
      }
    }
  } catch (err: unknown) {
    const execMs = Date.now() - t0
    const message = err instanceof Error ? err.message : String(err)
    return { status: 'error', result: { error: message }, displayType: 'error', raw: message, execMs }
  }
}
