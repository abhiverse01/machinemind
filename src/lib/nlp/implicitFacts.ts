// ─────────────────────────────────────────────────────────────
// MACHINE MIND v5.0 — Implicit Fact Extractor
// Detects implicit personal facts from user input:
// preferences, identity, environment, credentials.
// ─────────────────────────────────────────────────────────────

import type { ImplicitFact } from '../types'

// ── Pattern definitions ──────────────────────────────────────
interface FactPattern {
  pattern: RegExp
  extractKey: (match: RegExpExecArray) => string
  extractValue: (match: RegExpExecArray) => string
  confidence: number
  confirmTemplate: string
}

const IMPLICIT_FACT_PATTERNS: FactPattern[] = [
  // 1. "my X is Y" — general possessive assertion
  {
    pattern: /\bmy\s+(\w+(?:\s+\w+)?)\s+is\s+(.+?)(?:[.!?,;]|\s*$)/i,
    extractKey: (m) => m[1].toLowerCase().replace(/\s+/g, '_'),
    extractValue: (m) => m[2].trim(),
    confidence: 0.85,
    confirmTemplate: 'Got it — your {key} is {value}.',
  },

  // 2. "I'm a role" / "I am a role" — professional or social identity
  {
    pattern: /\bI'?m\s+(?:a|an)\s+(\w+(?:\s+\w+){0,2}?)\b/i,
    extractKey: () => 'role',
    extractValue: (m) => m[1].trim(),
    confidence: 0.8,
    confirmTemplate: 'Noted — you identify as a {value}.',
  },

  // 3. "I'm working in X" / "I work in X" / "I work at X" — workplace
  {
    pattern: /\bI(?:'?m|\s+am)?\s+work(?:ing)?\s+(?:in|at|for|with)\s+(.+?)(?:[.!?,;]|\s*$)/i,
    extractKey: () => 'workplace',
    extractValue: (m) => m[1].trim(),
    confidence: 0.75,
    confirmTemplate: 'Understood — you work in/at {value}.',
  },

  // 4. "I use X" — tool or technology preference
  {
    pattern: /\bI\s+(?:use|prefer|like|love)\s+(\w+(?:\s+\w+){0,2}?)\s*(?:for\s+.+?)?(?:[.!?,;]|\s*$)/i,
    extractKey: () => 'preferred_tool',
    extractValue: (m) => m[1].trim(),
    confidence: 0.7,
    confirmTemplate: 'Noted — you use {value}.',
  },

  // 5. "the base URL is X" / "base url: X" — API endpoint
  {
    pattern: /\b(?:the\s+)?base\s+(?:url|endpoint|uri)\s+(?:is|:)\s*(.+?)(?:[.!?,;]|\s*$)/i,
    extractKey: () => 'base_url',
    extractValue: (m) => m[1].trim(),
    confidence: 0.9,
    confirmTemplate: 'Base URL set to {value}.',
  },

  // 6. "my timezone is X" / "I'm in timezone X"
  {
    pattern: /\b(?:my\s+)?timezone\s+(?:is|:)\s*(.+?)(?:[.!?,;]|\s*$)/i,
    extractKey: () => 'timezone',
    extractValue: (m) => m[1].trim(),
    confidence: 0.9,
    confirmTemplate: 'Timezone set to {value}.',
  },

  // 7. "I prefer metric" / "I use metric" / "I prefer imperial"
  {
    pattern: /\bI\s+(?:prefer|use)\s+(metric|imperial|celsius|fahrenheit|kelvin)\b/i,
    extractKey: (m) => {
      const unit = m[1].toLowerCase()
      if (unit === 'celsius' || unit === 'fahrenheit' || unit === 'kelvin') return 'temperature_unit'
      return 'measurement_system'
    },
    extractValue: (m) => m[1].toLowerCase(),
    confidence: 0.9,
    confirmTemplate: 'Preference noted: {value}.',
  },

  // 8. "my name is X" / "call me X"
  {
    pattern: /\b(?:my\s+name\s+is|call\s+me)\s+(\w+(?:\s+\w+)?)/i,
    extractKey: () => 'name',
    extractValue: (m) => m[1].trim(),
    confidence: 0.95,
    confirmTemplate: 'Nice to meet you, {value}!',
  },

  // 9. "my X key is Y" / "my X token is Y" — credential pattern
  {
    pattern: /\bmy\s+(\w+)\s+(?:key|token|secret|password|api[_-]?key)\s+(?:is|:)\s*(.+?)(?:[.!?,;]|\s*$)/i,
    extractKey: (m) => `${m[1].toLowerCase()}_key`,
    extractValue: (m) => m[2].trim(),
    confidence: 0.95,
    confirmTemplate: 'I\'ve noted your {key}. I won\'t store or display it.',
  },
]

// ─────────────────────────────────────────────────────────────
// ImplicitFactExtractor
// ─────────────────────────────────────────────────────────────

export class ImplicitFactExtractor {
  /**
   * Extract implicit facts from user input.
   * Returns an array of ImplicitFact objects, one per matched pattern.
   * Multiple patterns can match the same input.
   */
  static extract(input: string): ImplicitFact[] {
    const facts: ImplicitFact[] = []
    const seenKeys = new Set<string>()

    for (const factPattern of IMPLICIT_FACT_PATTERNS) {
      factPattern.pattern.lastIndex = 0
      const match = factPattern.pattern.exec(input)
      if (match === null) continue

      const key = factPattern.extractKey(match)
      const value = factPattern.extractValue(match)

      // Skip empty values
      if (!value || value.length === 0) continue

      // Deduplicate by key — keep the first (highest priority) match
      if (seenKeys.has(key)) continue
      seenKeys.add(key)

      facts.push({
        key,
        value,
        confidence: factPattern.confidence,
        pattern: factPattern.pattern.source,
        confirmation: factPattern.confirmTemplate
          .replace('{key}', key)
          .replace('{value}', value),
      })
    }

    return facts
  }
}
