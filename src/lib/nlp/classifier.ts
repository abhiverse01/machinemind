// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Intent Classifier v5.0
// Full pipeline: GibberishParser → ImplicitFactExtractor → FuzzyMatcher
//   → WorkingMemory.resolve → ValueExtractor → StateMachine → classify
// ─────────────────────────────────────────────────────────────

import type { ClassifiedIntent, ConversationState, ExtractedValues, ImplicitFact, IntentCategory, ParsedInput } from '../types'
import { Tokenizer } from './tokenizer'
import { GibberishParser } from './gibberish'
import { FuzzyMatcher } from './fuzzy'
import { RULES } from './rules'
import { WorkingMemory } from './workingMemory'
import { ValueExtractor } from './valueExtractor'
import { ImplicitFactExtractor } from './implicitFacts'
import { ConversationStateMachine } from './stateMachine'

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
    case 'CONV':   return 'CONVERT'  // CONV_* = conversion rules (CONV_001-016)
    case 'TALK':   return 'SMALL_TALK' // TALK_* = conversational rules (TALK_001-022)
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
    case 'BOOL':   return 'BOOLEAN'
    case 'DIFF':   return 'DIFF'
    case 'DOC':    return 'DOC_MODE'
    case 'WM':     return 'CHAIN_TOOL'
    case 'IMPL':   return 'MEMORY_RECALL'
    case 'BASE':   return 'CONVERT'
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

// ── Extended return type for v5.0 pipeline ──────────────────
export interface ClassifiedIntentV5 extends ClassifiedIntent {
  implicitFacts?: ImplicitFact[]
  extractedValues?: ExtractedValues
}

// ── Main classify function (v5.0 — state-aware, uses ParsedInput from GibberishParser) ──
export function classify(
  input: string,
  normalised: string,
  tokens: string[],
  contextFlags: Set<string>,
  parsedInput?: ParsedInput,
  conversationState?: ConversationState,
): ClassifiedIntent {

  // ── Step 1: Check RULES array (sorted by priority, highest first) ──
  // Sort rules by priority descending so higher-priority rules match first
  const sortedRules = [...RULES].sort((a, b) => b.priority - a.priority)
  for (const rule of sortedRules) {
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
      const cleanedInput = parsedInput?.cleaned ?? normalised
      if (pattern.test(normalised) || pattern.test(input) || pattern.test(cleanedInput)) {
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

// ── Convenience: full pipeline from raw input (v5.0) ────────
// GibberishParser → ImplicitFactExtractor → FuzzyMatcher
//   → WorkingMemory.resolve → ValueExtractor → StateMachine → classify
export function classifyInput(
  rawInput: string,
  contextFlags: Set<string> = new Set(),
  workingMemory?: WorkingMemory,
  conversationState?: ConversationState,
): ClassifiedIntentV5 {
  // Step 1: GibberishParser — human noise parser (runs first!)
  const parsedInput = GibberishParser.parse(rawInput)

  // Step 2: ImplicitFactExtractor — detect implicit personal facts
  const implicitFacts = ImplicitFactExtractor.extract(rawInput)

  // Step 3: FuzzyMatcher — typo correction
  const fuzzyTokens = parsedInput.cleaned.split(/\s+/).filter(Boolean)
  const { tokens: correctedTokens, corrections } = FuzzyMatcher.correctSentence(fuzzyTokens)

  // Update parsedInput with corrections
  const correctedCleaned = correctedTokens.join(' ')
  // If cleaning emptied the input (e.g., all fillers stripped from a greeting like "hey"),
  // fall back to the original raw input so the classifier still has something to match.
  const finalCleaned = correctedCleaned.length > 0 ? correctedCleaned : rawInput.trim()
  const updatedParsedInput: ParsedInput = {
    ...parsedInput,
    corrections: [...parsedInput.corrections, ...corrections],
    wasCorrected: parsedInput.wasCorrected || corrections.length > 0,
    cleaned: finalCleaned,
  }

  // Step 4: WorkingMemory.resolve — resolve pronouns/demonstratives before classification
  let resolvedInput = finalCleaned
  let wmResolved = false
  if (workingMemory) {
    const resolveResult = workingMemory.resolve(finalCleaned)
    if (resolveResult) {
      // Replace the pronoun/demonstrative with the resolved value
      resolvedInput = finalCleaned.replace(/\b(that|it|this|the result|the value|the previous|the output|the answer|that result|this result|that value|this value)\b/i, resolveResult.resolved)
      if (resolvedInput === finalCleaned) {
        // Fallback: if the regex didn't match, just use resolved value directly
        resolvedInput = resolveResult.resolved
      }
      wmResolved = true
    }
  }

  // Step 5: ValueExtractor — extract typed values from the (possibly resolved) input
  const extractedValues = ValueExtractor.extract(resolvedInput)

  // Step 6: ConversationStateMachine.transition — update conversation state
  // (state machine is managed externally; we just provide the signal here)
  // If conversationState is provided, add it to context flags for state-aware routing
  const enrichedContextFlags = new Set(contextFlags)
  if (conversationState) {
    enrichedContextFlags.add(`STATE_${conversationState}`)
  }
  if (wmResolved) {
    enrichedContextFlags.add('WM_RESOLVED')
  }

  // Step 7: Tokenizer — normalize and tokenize the resolved input
  const tokenizer = new Tokenizer()
  const inputForClassification = wmResolved ? resolvedInput : updatedParsedInput.cleaned
  const normalised = tokenizer.normalize(inputForClassification)
  const tokens = tokenizer.tokenize(normalised)

  // Step 8: Classify with full context
  const result = classify(
    wmResolved ? resolvedInput : rawInput,
    normalised,
    tokens,
    enrichedContextFlags,
    wmResolved ? { ...updatedParsedInput, cleaned: inputForClassification } : updatedParsedInput,
    conversationState,
  )

  // Return v5.0 result with implicit facts and extracted values
  return {
    ...result,
    ...(implicitFacts.length > 0 ? { implicitFacts } : {}),
    ...(extractedValues.numbers.length > 0 ||
      extractedValues.strings.length > 0 ||
      extractedValues.emails.length > 0 ||
      extractedValues.urls.length > 0 ||
      extractedValues.units.length > 0 ||
      extractedValues.colors.length > 0 ||
      extractedValues.dates.length > 0 ||
      extractedValues.ipAddresses.length > 0
      ? { extractedValues }
      : {}),
  }
}
