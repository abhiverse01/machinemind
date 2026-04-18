// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Human Noise Parser (GibberishParser) v4.0
// Runs BEFORE the tokenizer on every input. Converts human
// chaos into structured intent.
// ─────────────────────────────────────────────────────────────

import type { Tone, HedgeLevel, ParsedInput } from '@/lib/types'

// ── Correction markers used by extractLastIntent ─────────────
const CORRECTION_MARKERS: RegExp[] = [
  /\bwait\s+no\b/i,
  /\bactually\s+(nvm|nevermind|forget\s+(it|that))\b/i,
  /\bnvm\s+(actually|wait)\b/i,
  /\b(oh wait|oh no)\b/i,
  /\*correction\*/i,
  /,?\s*i mean\s+/i,
]

// ── Hedge patterns used by stripHedges ───────────────────────
const HEDGE_PATTERNS: RegExp[] = [
  /^(can\s+you\s+)?(maybe\s+)?(try\s+to\s+)?(like\s+)?/i,
  /^(would\s+you\s+)?(be\s+able\s+to\s+)?/i,
  /^(is\s+it\s+possible\s+(for\s+you\s+)?to\s+)?/i,
  /^(could\s+you\s+)?(possibly\s+)?/i,
  /\s+(for\s+me)?\s*(please|pls|plz)?\s*\??$/i,
  /\s+(if\s+that\s+(makes\s+sense|works|is\s+ok))?\s*$/i,
  /\s+(or\s+(something|smth|whatever|w\/e))?\s*$/i,
  /\s+(i\s+think|i\s+guess|maybe)?\s*$/i,
]

// ── Tone signal patterns ─────────────────────────────────────
const FRUSTRATED_SIGNALS: RegExp[] = [
  /\bwtf\b/i,
  /\bugh\b/i,
  /\bfuck/i,
  /\bdamn/i,
  /\bhell\b/i,
  /!!!/,
  /\?{3,}/,
  /\bomfg\b/i,
  /\bwth\b/i,
  /\bstupid\b/i,
  /\bannoying\b/i,
]

const URGENT_SIGNALS: RegExp[] = [
  /\basap\b/i,
  /\bnow\b/i,
  /\burgent\b/i,
  /\bimmediately\b/i,
  /\bright now\b/i,
  /\bemergency\b/i,
  /\bquick\b/i,
  /\bhurry\b/i,
]

const PLAYFUL_SIGNALS: RegExp[] = [
  /\blol\b/i,
  /\blmao\b/i,
  /\bhaha\b/i,
  /\bhehe\b/i,
  /\bomg\b/i,
  /:\)/,
  /:D/,
  /;D/,
  /:P/i,
  /\brofl\b/i,
]

const CURIOUS_SIGNALS: RegExp[] = [
  /\bhow\b/i,
  /\bwhy\b/i,
  /\bwhat\b/i,
  /\bwhere\b/i,
  /\bwhen\b/i,
  /\bwho\b/i,
  /\bwhich\b/i,
  /\?/,
]

export class GibberishParser {
  // ── 1. FILLERS ─────────────────────────────────────────────
  static readonly FILLERS: Set<string> = new Set([
    // Vocal fillers
    'like', 'um', 'uh', 'er', 'hmm', 'hm', 'ah', 'oh', 'so',
    // Qualifier fillers
    'basically', 'literally', 'actually', 'honestly', 'right',
    // Discourse markers
    'you know', 'ya know', 'i mean', 'sort of', 'kind of', 'kinda', 'sorta',
    // Vague tail fillers
    'or something', 'or smth', 'or whatever', 'or w/e', 'idk', 'i guess',
    'i think', 'i feel like', 'tbh', 'ngl', 'imo', 'imho',
    // Emotional interjections
    'lol', 'lmao', 'haha', 'hehe', 'omg', 'omfg', 'wtf', 'wth',
    // Stall / restart
    'wait', 'hold on', 'ok so', 'okay so', 'alright so', 'anyway',
    // Minimizers
    'just', 'quick question', 'random question', 'dumb question',
    // Hedging question openers
    'is there a way to', 'how do i', 'how would i', 'can you like',
    'do you think you could', 'is it possible to', 'would it be possible',
    // Address fillers
    'hey', 'yo', 'oi', 'bro', 'dude', 'man', 'mate', 'fam',
    // Politeness fillers
    'pls', 'plz', 'please', 'thanks', 'ty', 'thx',
    // Time pressure fillers
    'rn', 'atm', 'asap', 'nvm', 'nevermind', 'forget it',
    // Mid-thought reversals
    'nah wait', 'actually wait', 'hold up', 'wait no',
  ])

  // ── 4. ABBREVS ─────────────────────────────────────────────
  static readonly ABBREVS: Record<string, string> = {
    // Math
    'sq root': 'square root',
    'sq rt': 'square root',
    // With/without
    'w/': 'with',
    'w/o': 'without',
    // Numeric slang
    'b/c': 'because',
    'b4': 'before',
    'gr8': 'great',
    'l8r': 'later',
    // Pronoun / verb short forms
    'r': 'are',
    'u': 'you',
    'ur': 'your',
    'yr': 'your',
    'n': 'and',
    'nd': 'and',
    'bc': 'because',
    'cuz': 'because',
    'cos': 'because',
    // Adverb short forms
    'rly': 'really',
    'rlly': 'really',
    'prolly': 'probably',
    'probs': 'probably',
    'def': 'definitely',
    'obv': 'obviously',
    'obvi': 'obviously',
    // Acronym expansions
    'ngl': 'not going to lie',
    'tbh': 'to be honest',
    'imo': 'in my opinion',
    'rn': 'right now',
    'atm': 'at the moment',
    'asap': 'as soon as possible',
    'irl': 'in real life',
    'imho': 'in my humble opinion',
    'iirc': 'if i remember correctly',
    'afaik': 'as far as i know',
    // Noun short forms
    'smth': 'something',
    'sth': 'something',
    'ppl': 'people',
    'info': 'information',
    'deets': 'details',
    'specs': 'specifications',
    // Tool verb short forms
    'calc': 'calculate',
    'calcs': 'calculate',
    'comp': 'compute',
    'conv': 'convert',
    'enc': 'encode',
    'dec': 'decode',
    'gen': 'generate',
    'rand': 'random',
    'pwd': 'password',
    'pw': 'password',
    // Encoding / hashing
    'hex': 'hexadecimal',
    'b64': 'base64',
    'sha': 'sha256',
    'regex': 'regular expression',
    'regexp': 'regular expression',
    // Unit abbreviations — data
    'kb': 'kilobytes',
    'mb': 'megabytes',
    'gb': 'gigabytes',
    'tb': 'terabytes',
    // Unit abbreviations — length
    'km': 'kilometers',
    'mi': 'miles',
    'ft': 'feet',
    // Unit abbreviations — temperature
    'c': 'celsius',
    'f': 'fahrenheit',
    'k': 'kelvin',
    // Unit abbreviations — weight
    'lbs': 'pounds',
    'oz': 'ounces',
    'kg': 'kilograms',
    // Timezone abbreviations
    'utc': 'UTC',
    'est': 'EST',
    'pst': 'PST',
    'gmt': 'GMT',
    'jst': 'JST',
    'ist': 'IST',
    'cet': 'CET',
    // Day / time abbreviations
    'tmrw': 'tomorrow',
    'tmr': 'tomorrow',
    'tml': 'tomorrow',
    'mo': 'month',
    'wk': 'week',
    'hr': 'hour',
    'min': 'minute',
    'sec': 'second',
  }

  // ── 5. EMOJI_INTENTS ───────────────────────────────────────
  static readonly EMOJI_INTENTS: Record<string, string> = {
    // Math
    '🧮': 'calculate',
    '➕': 'add',
    '➖': 'subtract',
    '✖️': 'multiply',
    '➗': 'divide',
    // Time / date
    '🕐': 'time',
    '⏰': 'time',
    '📅': 'date',
    '📆': 'date',
    // Random
    '🎲': 'random',
    '🎰': 'roll dice',
    '🪙': 'flip coin',
    // Security
    '🔑': 'generate password',
    '🔐': 'hash',
    '🔒': 'encrypt',
    // Color
    '🎨': 'color',
    '🖌️': 'color',
    // Conversion
    '📏': 'convert length',
    '⚖️': 'convert weight',
    '🌡️': 'convert temperature',
    // Data / search
    '📦': 'json',
    '🔍': 'search',
    '💾': 'remember',
    '🧠': 'remember',
    // Help
    '❓': 'help',
    '🆘': 'help',
    '📖': 'explain',
    // Emotion
    '😤': 'frustrated',
    '😭': 'distressed',
    '😊': 'happy',
    '😴': 'sleepy',
    '🤔': 'thinking',
    '💡': 'idea',
    // Affirmation / negation
    '👍': 'yes',
    '✅': 'yes',
    '❌': 'no',
    '👎': 'no',
    // Farewell
    '👋': 'goodbye',
    '✌️': 'goodbye',
  }

  // ── 2. extractLastIntent ───────────────────────────────────
  /** Detects mid-thought corrections and returns the last coherent segment. */
  static extractLastIntent(input: string): string {
    let text = input
    let lastIdx = -1

    for (const marker of CORRECTION_MARKERS) {
      marker.lastIndex = 0
      const match = marker.exec(text)
      if (match && match.index > lastIdx) {
        lastIdx = match.index
      }
      // Also check for later occurrences
      marker.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = marker.exec(text)) !== null) {
        if (m.index > lastIdx) {
          lastIdx = m.index
        }
      }
    }

    if (lastIdx === -1) return input.trim()

    // Split at the last correction marker — take the part after it
    const remainder = input.slice(lastIdx)
    // Remove the correction marker itself from the start of the remainder
    let cleaned = remainder
    for (const marker of CORRECTION_MARKERS) {
      marker.lastIndex = 0
      cleaned = cleaned.replace(marker, '')
    }

    return cleaned.trim()
  }

  // ── 3. stripHedges ─────────────────────────────────────────
  /** Removes uncertainty wrappers from the input. Returns the stripped string. */
  static stripHedges(input: string): string {
    let text = input

    for (const pattern of HEDGE_PATTERNS) {
      text = text.replace(pattern, '')
    }

    return text.trim()
  }

  // ── 6. extractEmojiIntents ─────────────────────────────────
  /** Returns an array of intent strings for each emoji found in the input. */
  static extractEmojiIntents(input: string): string[] {
    const intents: string[] = []
    const seen = new Set<string>()

    for (const char of input) {
      const intent = GibberishParser.EMOJI_INTENTS[char]
      if (intent && !seen.has(intent)) {
        intents.push(intent)
        seen.add(intent)
      }
    }

    // Also check for multi-codepoint emoji (e.g., ✖️ = ✖ + FE0F)
    // The simple character iteration above catches most emoji since
    // JavaScript iterates over code points. For the ✖️ case, the
    // variation selector FE0F is a separate character but our map
    // keys are the base emoji characters which are matched.

    return intents
  }

  // ── 7. expandAbbreviations ─────────────────────────────────
  /** Replaces standalone abbreviations with their expanded forms. */
  static expandAbbreviations(input: string): string {
    let text = input

    // Sort abbreviations by length descending so multi-word abbreviations
    // (e.g., "sq root", "or something") match before shorter substrings.
    const sortedKeys = Object.keys(GibberishParser.ABBREVS).sort(
      (a, b) => b.length - a.length
    )

    for (const abbr of sortedKeys) {
      const expansion = GibberishParser.ABBREVS[abbr]

      // Multi-word abbreviations: match as a phrase with word boundaries
      if (abbr.includes(' ')) {
        const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
        text = text.replace(regex, expansion)
        continue
      }

      // Single-char abbreviations (c, f, k, r, u, n) need strict word
      // boundary matching to avoid replacing inside other words.
      if (abbr.length === 1) {
        // Match only when surrounded by word boundaries that are NOT
        // adjacent to other word characters (i.e., truly standalone).
        // Use \b on both sides and verify the match is a whole word.
        const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(?<=^|\\s)${escaped}(?=\\s|$|[.,!?;:])`, 'gi')
        text = text.replace(regex, expansion)
        continue
      }

      // Multi-char single-word abbreviations: use word boundaries.
      // But be careful with abbreviations that contain regex-special chars.
      const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      // For abbreviations ending with punctuation like w/ and w/o,
      // use a custom boundary approach
      if (/[\/\\]/.test(abbr)) {
        const regex = new RegExp(`(?<=^|\\s)${escaped}(?=\\s|$|[.,!?;:])`, 'gi')
        text = text.replace(regex, expansion)
        continue
      }

      const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
      text = text.replace(regex, expansion)
    }

    return text
  }

  // ── 8. stripFillers ────────────────────────────────────────
  /** Strips filler words from the input. Handles multi-word fillers first. */
  static stripFillers(input: string): string {
    let text = input

    // Sort fillers by length descending so multi-word fillers are
    // removed before single-word ones (prevents partial matches).
    const sortedFillers = Array.from(GibberishParser.FILLERS).sort(
      (a, b) => b.length - a.length
    )

    for (const filler of sortedFillers) {
      const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Match the filler as a whole word/phrase, case-insensitive
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
      text = text.replace(regex, ' ')
    }

    // Collapse multiple spaces and trim
    return text.replace(/\s+/g, ' ').trim()
  }

  // ── 9. MASTER PARSE FUNCTION ───────────────────────────────
  /**
   * Full parsing pipeline:
   * 1. extractLastIntent (handle mid-thought corrections)
   * 2. expandAbbreviations
   * 3. extractEmojiIntents (save for emojiIntents field)
   * 4. stripFillers
   * 5. stripHedges
   * 6. normalize whitespace
   * 7. detect tone
   * 8. calculate confidence
   * 9. calculate hedgeLevel
   * 10. return ParsedInput
   */
  static parse(rawInput: string): ParsedInput {
    const raw = rawInput

    // ── Step 1: extractLastIntent ─────────────────────────────
    const afterCorrection = GibberishParser.extractLastIntent(rawInput)
    const wasCorrected = afterCorrection !== rawInput.trim()

    // Track corrections
    const corrections: Array<{ original: string; corrected: string }> = []
    if (wasCorrected) {
      corrections.push({
        original: rawInput.trim(),
        corrected: afterCorrection,
      })
    }

    // ── Step 2: expandAbbreviations ───────────────────────────
    const afterAbbrevs = GibberishParser.expandAbbreviations(afterCorrection)

    // ── Step 3: extractEmojiIntents ───────────────────────────
    const emojiIntents = GibberishParser.extractEmojiIntents(afterAbbrevs)

    // ── Step 4: stripFillers ─────────────────────────────────
    const afterFillers = GibberishParser.stripFillers(afterAbbrevs)

    // ── Step 5: stripHedges ──────────────────────────────────
    // Count hedges before stripping by checking how many patterns match
    let hedgesStripped = 0
    let preHedgeText = afterFillers
    for (const pattern of HEDGE_PATTERNS) {
      pattern.lastIndex = 0
      if (pattern.test(preHedgeText)) {
        hedgesStripped++
      }
    }
    const afterHedges = GibberishParser.stripHedges(afterFillers)

    // ── Step 6: normalize whitespace ──────────────────────────
    const cleaned = afterHedges.replace(/\s+/g, ' ').trim()

    // ── Step 7: detect tone ───────────────────────────────────
    const tone = GibberishParser.detectTone(rawInput)

    // ── Step 8: calculate confidence ──────────────────────────
    // Start at 0.8, add 0.1 for each correction rule matched,
    // subtract 0.1 for each hedge stripped, clamp 0-1.
    let confidence = 0.8
    if (wasCorrected) {
      confidence += 0.1
    }
    confidence -= hedgesStripped * 0.1
    // Bonus for emoji intents (they signal clear intent)
    if (emojiIntents.length > 0) {
      confidence += 0.05
    }
    // Penalize very short cleaned output
    if (cleaned.length > 0 && cleaned.length < 3) {
      confidence -= 0.1
    }
    confidence = Math.max(0, Math.min(1, confidence))

    // ── Step 9: calculate hedgeLevel ──────────────────────────
    // 0 = no hedges, 1 = light, 2 = moderate, 3 = heavy hedging
    let hedgeLevel: HedgeLevel
    if (hedgesStripped === 0) {
      hedgeLevel = 0
    } else if (hedgesStripped <= 1) {
      hedgeLevel = 1
    } else if (hedgesStripped <= 2) {
      hedgeLevel = 2
    } else {
      hedgeLevel = 3
    }

    // ── Step 10: return ParsedInput ───────────────────────────
    return {
      raw,
      cleaned,
      originalIntent: afterCorrection,
      corrections,
      tone,
      hedgeLevel,
      confidence,
      emojiIntents,
      wasCorrected,
    }
  }

  // ── Tone detection helper ──────────────────────────────────
  private static detectTone(input: string): Tone {
    let frustratedScore = 0
    let urgentScore = 0
    let playfulScore = 0
    let curiousScore = 0

    for (const signal of FRUSTRATED_SIGNALS) {
      signal.lastIndex = 0
      if (signal.test(input)) frustratedScore++
    }

    for (const signal of URGENT_SIGNALS) {
      signal.lastIndex = 0
      if (signal.test(input)) urgentScore++
    }

    for (const signal of PLAYFUL_SIGNALS) {
      signal.lastIndex = 0
      if (signal.test(input)) playfulScore++
    }

    for (const signal of CURIOUS_SIGNALS) {
      signal.lastIndex = 0
      if (signal.test(input)) curiousScore++
    }

    // Find the dominant tone
    const scores: Array<{ tone: Tone; score: number }> = [
      { tone: 'frustrated', score: frustratedScore * 1.5 }, // weight frustration higher
      { tone: 'urgent', score: urgentScore * 1.3 },         // weight urgency higher
      { tone: 'playful', score: playfulScore },
      { tone: 'curious', score: curiousScore },
    ]

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score)

    // If the top score is 0, return neutral
    if (scores[0].score === 0) return 'neutral'

    // If there's a tie between the top two, prefer the more specific one
    // (frustrated > urgent > curious > playful)
    if (
      scores[0].score === scores[1].score &&
      scores[0].score > 0
    ) {
      const tonePriority: Record<Tone, number> = {
        frustrated: 4,
        urgent: 3,
        curious: 2,
        playful: 1,
        neutral: 0,
      }
      if (tonePriority[scores[0].tone] >= tonePriority[scores[1].tone]) {
        return scores[0].tone
      }
      return scores[1].tone
    }

    return scores[0].tone
  }
}
