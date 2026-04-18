// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Intent Classifier v4.0
// Full pipeline: GibberishParser → FuzzyMatcher → Tokenizer → Rules → Fallback
// ─────────────────────────────────────────────────────────────

import type { ClassifiedIntent, IntentCategory, ParsedInput } from '../types'
import { Tokenizer } from './tokenizer'
import { GibberishParser } from './gibberish'
import { FuzzyMatcher } from './fuzzy'
import { RULES } from './rules'

// ── Weighted keyword markers for fallback scoring ───────────
const INTENT_WEIGHTS = {
  QUESTION:  { markers: ['what', 'who', 'where', 'when', 'why', 'how', '?'], w: 1.0 },
  COMMAND:   { markers: ['show', 'get', 'find', 'list', 'run', '!'],         w: 1.2 },
  SOCIAL:    { markers: ['thanks', 'bye', 'please', 'sorry', 'hello'],       w: 0.8 },
  MATH:      { markers: ['+', '-', '*', '/', 'sqrt', 'calculate', '%'],      w: 1.5 },
  SEARCH:    { markers: ['search', 'look up', 'find', 'info on', 'about'],   w: 1.3 },
  META:      { markers: ['you', 'your name', 'what are you', 'can you'],     w: 1.0 },
  TOOL_CALL: { markers: ['!', 'run', 'execute', 'use', 'activate'],         w: 2.0 },
} as const

// ── Map rule ID prefix → IntentCategory ─────────────────────
function mapRuleIdToIntent(ruleId: string): IntentCategory {
  const prefix = ruleId.split('_')[0]
  switch (prefix) {
    case 'GREET':  return 'GREETING'
    case 'FARE':   return 'FAREWELL'
    case 'GRAT':   return 'GRATITUDE'
    case 'APOL':   return 'APOLOGY'
    case 'AFFI':   return 'AFFIRMATION'
    case 'NEGA':   return 'NEGATION'
    case 'META':   return 'QUESTION_META'
    case 'FACT':   return 'QUESTION_FACTUAL'
    case 'OPIN':   return 'QUESTION_OPINION'
    case 'MATH':   return 'MATH'
    case 'TIME':   return 'TIME'
    case 'CONV':   return 'CONVERT'
    case 'ENC':    return 'ENCODE'
    case 'HASH':   return 'HASH'
    case 'COLR':   return 'COLOR'
    case 'REGX':   return 'REGEX'
    case 'RAND':   return 'RANDOM'
    case 'MEM': {
      if (ruleId === 'MEM_001' || ruleId === 'MEM_005' || ruleId === 'MEM_009') {
        return 'MEMORY_STORE'
      }
      return 'MEMORY_RECALL'
    }
    case 'WORD':   return 'WORD'
    case 'JSON':   return 'JSON'
    case 'SYS':    return 'SYSTEM_STATUS'
    case 'CHAIN':  return 'CHAIN_TOOL'
    case 'FOLL':   return 'FOLLOW_UP'
    case 'SMTK':   return 'SMALL_TALK'
    case 'EMOT':   return 'EMOTIONAL'
    case 'CONF':   return 'CONFUSION'
    case 'CMD':    return 'COMMAND'
    case 'EDGE':   return 'UNKNOWN'
    default:       return 'UNKNOWN'
  }
}

// ── Map fallback category → IntentCategory ──────────────────
function mapFallbackCategory(cat: string): IntentCategory {
  switch (cat) {
    case 'QUESTION':  return 'QUESTION_META'
    case 'COMMAND':   return 'COMMAND'
    case 'SOCIAL':    return 'SMALL_TALK'
    case 'MATH':      return 'MATH'
    case 'SEARCH':    return 'COMMAND'
    case 'META':      return 'QUESTION_META'
    case 'TOOL_CALL': return 'COMMAND'
    default:          return 'UNKNOWN'
  }
}

// ── Main classify function (v4.0 — uses ParsedInput from GibberishParser) ──
export function classify(
  input: string,
  normalised: string,
  tokens: string[],
  contextFlags: Set<string>,
  parsedInput?: ParsedInput,
): ClassifiedIntent {

  // ── Step 1: Check RULES array (sorted by priority, highest first) ──
  for (const rule of RULES) {
    // If the rule requires a context flag, verify it exists
    if (rule.contextRequired !== null && rule.contextRequired !== 'ANY' && !contextFlags.has(rule.contextRequired)) {
      continue
    }

    // For 'ANY' contextRequired, require at least one flag
    if (rule.contextRequired === 'ANY' && contextFlags.size === 0) {
      continue
    }

    // Test each pattern against both the original and normalised input
    for (const pattern of rule.patterns) {
      // Reset lastIndex for stateful regexes
      pattern.lastIndex = 0
      if (pattern.test(normalised) || pattern.test(input)) {
        return {
          intent: mapRuleIdToIntent(rule.id),
          confidence: parsedInput ? Math.min(1, parsedInput.confidence + 0.1) : 1.0,
          matchedRuleId: rule.id,
          toolHint: rule.tool,
          parsedInput: parsedInput ?? {
            raw: input,
            cleaned: normalised,
            originalIntent: normalised,
            corrections: [],
            tone: 'neutral',
            hedgeLevel: 0,
            confidence: 1.0,
            emojiIntents: [],
            wasCorrected: false,
          },
        }
      }
    }
  }

  // ── Step 2: Fallback to weighted keyword scoring ──────────
  const lowerInput = normalised.toLowerCase()
  const lowerTokens = tokens.map(t => t.toLowerCase())

  type CategoryKey = keyof typeof INTENT_WEIGHTS
  const scores: Record<CategoryKey, number> = {
    QUESTION: 0,
    COMMAND: 0,
    SOCIAL: 0,
    MATH: 0,
    SEARCH: 0,
    META: 0,
    TOOL_CALL: 0,
  }

  for (const [category, config] of Object.entries(INTENT_WEIGHTS) as Array<[CategoryKey, typeof INTENT_WEIGHTS[CategoryKey]]>) {
    let categoryScore = 0

    for (const marker of config.markers) {
      if (marker.includes(' ')) {
        if (lowerInput.includes(marker)) {
          categoryScore += config.w
        }
      } else {
        if (lowerTokens.includes(marker)) {
          categoryScore += config.w
        }
        if (lowerInput.includes(marker) && marker.length > 1) {
          categoryScore += config.w * 0.5
        }
      }
    }

    scores[category] = categoryScore
  }

  let bestCategory: CategoryKey = 'QUESTION'
  let bestScore = 0

  for (const [cat, score] of Object.entries(scores) as Array<[CategoryKey, number]>) {
    if (score > bestScore) {
      bestScore = score
      bestCategory = cat
    }
  }

  if (bestScore === 0) {
    return {
      intent: 'UNKNOWN',
      confidence: 0.1,
      matchedRuleId: null,
      toolHint: null,
      parsedInput: parsedInput ?? {
        raw: input,
        cleaned: normalised,
        originalIntent: normalised,
        corrections: [],
        tone: 'neutral',
        hedgeLevel: 0,
        confidence: 0.1,
        emojiIntents: [],
        wasCorrected: false,
      },
    }
  }

  const maxPossible = Object.values(INTENT_WEIGHTS).reduce((sum, cfg) => sum + cfg.w * cfg.markers.length, 0)
  const rawConfidence = bestScore / maxPossible
  const confidence = Math.min(0.45, rawConfidence * 2)

  return {
    intent: mapFallbackCategory(bestCategory),
    confidence: Math.max(0.15, confidence),
    matchedRuleId: null,
    toolHint: null,
    parsedInput: parsedInput ?? {
      raw: input,
      cleaned: normalised,
      originalIntent: normalised,
      corrections: [],
      tone: 'neutral',
      hedgeLevel: 0,
      confidence: Math.max(0.15, confidence),
      emojiIntents: [],
      wasCorrected: false,
    },
  }
}

// ── Convenience: full pipeline from raw input (v4.0) ────────
// GibberishParser → FuzzyMatcher → Tokenizer → classify
export function classifyInput(
  rawInput: string,
  contextFlags: Set<string> = new Set(),
): ClassifiedIntent {
  // Step 1: GibberishParser — human noise parser (runs first!)
  const parsedInput = GibberishParser.parse(rawInput)

  // Step 2: FuzzyMatcher — typo correction
  const fuzzyTokens = parsedInput.cleaned.split(/\s+/).filter(Boolean)
  const { tokens: correctedTokens, corrections } = FuzzyMatcher.correctSentence(fuzzyTokens)

  // Update parsedInput with corrections
  const updatedParsedInput: ParsedInput = {
    ...parsedInput,
    corrections: [...parsedInput.corrections, ...corrections],
    wasCorrected: parsedInput.wasCorrected || corrections.length > 0,
    cleaned: correctedTokens.join(' '),
  }

  // Step 3: Tokenizer — normalize and tokenize
  const tokenizer = new Tokenizer()
  const normalised = tokenizer.normalize(updatedParsedInput.cleaned)
  const tokens = tokenizer.tokenize(normalised)

  // Step 4: Classify
  return classify(rawInput, normalised, tokens, contextFlags, updatedParsedInput)
}
