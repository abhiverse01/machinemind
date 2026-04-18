// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Voice Engine / Personality Module v4.0
// Dry. Precise. Slightly self-aware. Never sycophantic.
// ─────────────────────────────────────────────────────────────

import type { Tone } from '@/lib/types'

// ── Persona Constant ────────────────────────────────────────

export const PERSONA = {
  name: 'MACHINE MIND',
  voice: 'dry-precise',

  FORBIDDEN_PHRASES: [
    'Great question!',
    'Certainly!',
    'Of course!',
    'Absolutely!',
    'Sure thing!',
    'Happy to help!',
    "I'd be happy to",
    "I'm just an AI",
    'As an AI language model',
    'I apologize for any confusion',
    'I hope that helps!',
    'Feel free to ask',
    "Don't hesitate to",
    'Please let me know if',
    'Is there anything else',
  ],

  TONE_RULES: {
    frustrated: {
      responseStyle: 'terse-direct',
      maxWords: 40,
      skipSmallTalk: true,
      prefixes: ['Got it.', 'Here:', 'Result:', 'Done.'],
    },
    playful: {
      responseStyle: 'dry-wit',
      allowHumor: true,
      prefixes: ['Alright.', 'Fine.', 'As requested.', 'Here you go.'],
    },
    urgent: {
      responseStyle: 'instant',
      maxWords: 20,
      skipPreamble: true,
    },
    curious: {
      responseStyle: 'informative-precise',
      allowExtraContext: true,
    },
    neutral: {
      responseStyle: 'default-precise',
    },
  },
} as const

// ── Dry Wit Pool ────────────────────────────────────────────

const DRY_WIT_POOL: string[] = [
  'SHA-256. Cryptographically irreversible. Like most decisions.',
  'The dice have spoken. As they always have.',
  'Kilometers. Miles. The universe doesn\'t care about either.',
  'Math. Still works.',
  'All just wavelengths, really.',
  'Encoded. Still the same data, just wearing a different hat.',
  'Statistically unique. So are you, for what it\'s worth.',
  'Reads the same backwards. Like time, if you squint.',
  'Counting down. The universe is indifferent to your deadline.',
  'Noted. I\'ll keep it until you close the tab.',
  'Result computed. The void remains unimpressed.',
  'Conversion complete. Reality unchanged.',
  'Pattern found. Meaning optional.',
  'Randomness generated. Deterministically, of course.',
  'Color parsed. Beauty is still subjective.',
  'Memory stored. Don\'t expect me to care about it though.',
  'Valid JSON. The machine is satisfied.',
  'No regex match. Sometimes absence is the answer.',
  'Password generated. Don\'t write it on a sticky note.',
  'Time checked. It keeps moving, regardless.',
]

// ── Wit Rate Limiter ────────────────────────────────────────
// Ensures wit fires no more than 1 in 5 non-tool responses.

let witCounter: number = 0
const WIT_INTERVAL: number = 5

// ── Forbidden Phrase Check ──────────────────────────────────

/**
 * Returns true if `text` contains any FORBIDDEN_PHRASE (case-insensitive).
 */
export function checkForbidden(text: string): boolean {
  const lower = text.toLowerCase()
  return PERSONA.FORBIDDEN_PHRASES.some((phrase) =>
    lower.includes(phrase.toLowerCase()),
  )
}

// ── Strip Forbidden Phrases ─────────────────────────────────

/**
 * Removes all occurrences of forbidden phrases from text.
 * Collapses resulting double-spaces back to single spaces and trims.
 */
function stripForbidden(text: string): string {
  let cleaned = text
  for (const phrase of PERSONA.FORBIDDEN_PHRASES) {
    // Match case-insensitively, handle any surrounding whitespace
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(escaped, 'gi')
    cleaned = cleaned.replace(re, '')
  }
  // Collapse multiple spaces and trim
  return cleaned.replace(/\s{2,}/g, ' ').trim()
}

// ── Tone Prefix ─────────────────────────────────────────────

/**
 * Returns a random tone-appropriate prefix from TONE_RULES.
 * Falls back to empty string if no prefixes defined for the tone.
 */
export function getTonePrefix(tone: Tone): string {
  const rules = PERSONA.TONE_RULES[tone]
  const prefixes = 'prefixes' in rules ? rules.prefixes : undefined
  if (!prefixes || prefixes.length === 0) return ''
  const idx = Math.floor(Math.random() * prefixes.length)
  return prefixes[idx]
}

// ── Word Truncation ─────────────────────────────────────────

/**
 * Truncates text to at most `maxWords` words, appending an ellipsis
 * only when truncation actually occurs.
 */
function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + '…'
}

// ── Apply Tone Rules ────────────────────────────────────────

/**
 * Applies tone-specific rules to the response text:
 * - frustrated: terse prefix + word cap + no small talk
 * - urgent: word cap + skip preamble
 * - playful: maybe inject dry wit
 * - curious: allow extra context (no truncation)
 * - neutral: pass through
 *
 * Always strips forbidden phrases.
 */
export function applyToneRules(text: string, tone: Tone): string {
  // Strip forbidden phrases first, regardless of tone
  let result = stripForbidden(text)

  const rules = PERSONA.TONE_RULES[tone]

  switch (tone) {
    case 'frustrated': {
      const prefix = getTonePrefix(tone)
      if ('maxWords' in rules && typeof rules.maxWords === 'number') {
        result = truncateWords(result, rules.maxWords)
      }
      result = prefix ? `${prefix} ${result}` : result
      break
    }

    case 'urgent': {
      if ('maxWords' in rules && typeof rules.maxWords === 'number') {
        result = truncateWords(result, rules.maxWords)
      }
      // skipPreamble: strip any leading filler ("Well,", "So,", etc.)
      result = result.replace(/^(Well,?\s*|So,?\s*|Okay,?\s*|Look,?\s*|Now,?\s*)/i, '')
      break
    }

    case 'playful': {
      const prefix = getTonePrefix(tone)
      const wit = maybeInjectWit()
      if (wit) {
        result = `${result}\n${wit}`
      }
      result = prefix ? `${prefix} ${result}` : result
      break
    }

    case 'curious': {
      // Allow extra context — no truncation, no special formatting
      break
    }

    case 'neutral':
    default: {
      // Pass through
      break
    }
  }

  return result.trim()
}

// ── Maybe Inject Wit ────────────────────────────────────────

/**
 * Returns a random dry wit one-liner with ~20% probability (1 in 5),
 * otherwise null. Uses a counter to enforce the rate limit.
 */
export function maybeInjectWit(): string | null {
  witCounter++
  if (witCounter % WIT_INTERVAL !== 0) return null
  const idx = Math.floor(Math.random() * DRY_WIT_POOL.length)
  return DRY_WIT_POOL[idx]
}

// ── Master Formatting ───────────────────────────────────────

/**
 * Master formatting function for all MACHINE MIND responses.
 *
 * - Tool results: skip wit injection, still apply tone + forbidden check
 * - Non-tool results: maybe inject wit, then apply tone rules
 * - Always strips forbidden phrases
 */
export function formatWithTone(
  template: string,
  tone: Tone,
  isToolResult: boolean,
): string {
  let formatted = template

  if (!isToolResult) {
    // Maybe inject wit for conversational (non-tool) responses
    const wit = maybeInjectWit()
    if (wit) {
      formatted = `${formatted}\n${wit}`
    }
  }

  // Apply tone-specific rules (includes forbidden phrase stripping)
  formatted = applyToneRules(formatted, tone)

  // Final forbidden phrase safety net
  if (checkForbidden(formatted)) {
    formatted = stripForbidden(formatted)
  }

  return formatted.trim()
}
