// ─────────────────────────────────────────────────────────────
// MACHINE MIND v4.0 — Tone Detection Module
// Detects emotional tone of input to modulate response style.
// Frustrated → crisper. Playful → drier wit.
// ─────────────────────────────────────────────────────────────

import type { Tone } from '@/lib/types'

interface ToneSignal {
  words: string[]
  patterns: RegExp[]
  weight: number
}

type ToneCategory = Exclude<Tone, 'neutral'>

const TONE_SIGNALS: Record<ToneCategory, ToneSignal> = {
  frustrated: {
    words: [
      'ugh', 'wtf', 'wth', 'why wont', "why won't", 'doesnt work', 'broken',
      'not working', 'still not', 'again', 'seriously', 'come on', 'ffs',
      'this is stupid', 'i hate', 'terrible', 'useless', 'trash',
    ],
    patterns: [
      /!{2,}/,
      /\?\?\?+/,
      /\.{4,}/,
      /wtf+/i,
      /wth+/i,
    ],
    weight: 1.5,
  },

  urgent: {
    words: [
      'asap', 'urgent', 'emergency', 'right now', 'immediately', 'quick',
      'hurry', 'fast', 'quickly', 'need now', 'deadline', 'critical',
    ],
    patterns: [
      /!+$/,
      /\bnow\b.*\bplease\b/i,
      /\bdeadline\b/i,
    ],
    weight: 1.2,
  },

  playful: {
    words: [
      'lol', 'lmao', 'haha', 'hehe', 'lmfao', 'rofl', 'xd', ':)',
      ':D', '\u{1F602}', '\u{1F604}', '\u{1F923}', 'fun', 'cool', 'nice',
      'sweet', 'dope', 'sick', 'rad', 'epic', 'awesome', 'wild',
    ],
    patterns: [
      /lol+/i,
      /hah+a+/i,
      /\u{1F602}|\u{1F923}|\u{1F604}/,
    ],
    weight: 1.0,
  },

  curious: {
    words: [
      'how', 'why', 'what', 'explain', 'tell me', 'curious', 'wondering',
      'understand', 'learn', 'interesting', 'what if', 'could',
    ],
    patterns: [
      /^(how|why|what|where|when|who)\b/i,
      /\?$/,
    ],
    weight: 0.8,
  },
} as const

/**
 * Detect the emotional tone of a given input string.
 *
 * Scoring: each tone category earns (word hits + pattern matches) × weight.
 * Scores are then normalised by dividing by total signals found (min 1).
 * The highest-scoring tone wins; ties fall back to 'neutral'.
 * If every score is zero, returns 'neutral' with confidence 0.5.
 */
export function detectTone(input: string): { tone: Tone; confidence: number } {
  const lower = input.toLowerCase()

  // ── Accumulate raw scores per category ──────────────────────
  const scores: Record<ToneCategory, number> = {
    frustrated: 0,
    urgent: 0,
    playful: 0,
    curious: 0,
  }

  let totalSignals = 0

  const categories = Object.keys(TONE_SIGNALS) as ToneCategory[]

  for (const category of categories) {
    const signal = TONE_SIGNALS[category]

    // Word hits — case-insensitive substring check
    let wordHits = 0
    for (const word of signal.words) {
      if (lower.includes(word.toLowerCase())) {
        wordHits++
      }
    }

    // Pattern matches
    let patternHits = 0
    for (const pattern of signal.patterns) {
      // Reset lastIndex in case a pattern was previously used with the `g` flag
      pattern.lastIndex = 0
      if (pattern.test(input)) {
        patternHits++
      }
    }

    const rawHits = wordHits + patternHits
    scores[category] = rawHits * signal.weight
    totalSignals += rawHits
  }

  // ── All-zero fallback ───────────────────────────────────────
  if (totalSignals === 0) {
    return { tone: 'neutral', confidence: 0.5 }
  }

  // ── Normalise ───────────────────────────────────────────────
  const normalised: Record<ToneCategory, number> = {
    frustrated: scores.frustrated / totalSignals,
    urgent: scores.urgent / totalSignals,
    playful: scores.playful / totalSignals,
    curious: scores.curious / totalSignals,
  }

  // ── Find highest score ──────────────────────────────────────
  let bestCategory: ToneCategory | null = null
  let bestScore = 0
  let isTie = false

  for (const category of categories) {
    if (normalised[category] > bestScore) {
      bestScore = normalised[category]
      bestCategory = category
      isTie = false
    } else if (normalised[category] === bestScore && bestScore > 0) {
      isTie = true
    }
  }

  // Ties default to neutral
  if (isTie || bestCategory === null) {
    return { tone: 'neutral', confidence: 0.5 }
  }

  // Clamp confidence to [0, 1]
  const confidence = Math.min(1, Math.max(0, bestScore))

  return { tone: bestCategory, confidence }
}
