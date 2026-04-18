// ─────────────────────────────────────────────────────────────
// MACHINE MIND v5.0 — Value Extractor
// Extracts structured values from free-text input:
// numbers, strings, emails, URLs, units, colors, dates, IPs.
// ─────────────────────────────────────────────────────────────

import type { ExtractedValues } from '../types'

// ── Number word maps ─────────────────────────────────────────
const ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9,
}

const TEENS: Record<string, number> = {
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
}

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}

const SCALES: Record<string, number> = {
  hundred: 100, thousand: 1000, million: 1_000_000,
  billion: 1_000_000_000, trillion: 1_000_000_000_000,
}

const NUMBER_WORDS: Record<string, number> = { ...ONES, ...TEENS, ...TENS, ...SCALES }

const FRACTION_WORDS: Record<string, number> = {
  half: 0.5, third: 1 / 3, quarter: 0.25, fifth: 0.2,
  sixth: 1 / 6, seventh: 1 / 7, eighth: 1 / 8, ninth: 1 / 9, tenth: 0.1,
}

// ── Named colors ─────────────────────────────────────────────
const NAMED_COLORS: Record<string, string> = {
  red: '#ff0000', green: '#008000', blue: '#0000ff', black: '#000000',
  white: '#ffffff', yellow: '#ffff00', cyan: '#00ffff', magenta: '#ff00ff',
  orange: '#ffa500', pink: '#ffc0cb', purple: '#800080', brown: '#a52a2a',
  gray: '#808080', grey: '#808080', silver: '#c0c0c0', gold: '#ffd700',
  lime: '#00ff00', navy: '#000080', teal: '#008080', maroon: '#800000',
  olive: '#808000', aqua: '#00ffff', coral: '#ff7f50', salmon: '#fa8072',
  violet: '#ee82ee', indigo: '#4b0082', crimson: '#dc143c', turquoise: '#40e0d0',
  lavender: '#e6e6fa', beige: '#f5f5dc', ivory: '#fffff0', khaki: '#f0e68c',
}

// ── Unit patterns ────────────────────────────────────────────
const UNIT_PATTERN = /\b(\d+(?:\.\d+)?)\s*(km|mi|miles|m|cm|mm|ft|feet|foot|in|inch|inches|yd|yard|yards|kg|lb|lbs|pound|pounds|oz|ounce|ounces|g|gram|grams|mg|l|ml|gal|gallon|gallons|qt|quart|pt|pint|cup|cups|fl\s*oz|fahrenheit|celsius|kelvin|°[fFcCkK]|°|fps|mph|km\/h|m\/s|kb|mb|gb|tb|pb|kbps|mbps|gbps|hz|khz|mhz|ghz|pa|bar|psi|atm|va|w|kw|mw|hp|byte|bytes|bit|bits)\b/gi

// ── Parse written numbers like "five hundred and twenty three" ──
function parseWrittenNumber(text: string): number | null {
  const words = text.toLowerCase().replace(/[,-]/g, ' ').split(/\s+/).filter(Boolean)

  if (words.length === 0) return null
  if (words.length === 1) {
    if (NUMBER_WORDS[words[0]] !== undefined) return NUMBER_WORDS[words[0]]
    if (FRACTION_WORDS[words[0]] !== undefined) return FRACTION_WORDS[words[0]]
    return null
  }

  // Handle "and" separator: "five hundred and twenty three"
  const cleaned = words.filter(w => w !== 'and')

  let total = 0
  let current = 0

  for (const word of cleaned) {
    if (ONES[word] !== undefined) {
      current += ONES[word]
    } else if (TEENS[word] !== undefined) {
      current += TEENS[word]
    } else if (TENS[word] !== undefined) {
      current += TENS[word]
    } else if (word === 'hundred') {
      current *= 100
    } else if (SCALES[word] !== undefined) {
      current *= SCALES[word]
      total += current
      current = 0
    } else {
      // Unknown word — can't parse
      return null
    }
  }

  total += current
  return total > 0 ? total : null
}

// ─────────────────────────────────────────────────────────────
// ValueExtractor — all static methods, zero state
// ─────────────────────────────────────────────────────────────

export class ValueExtractor {
  // ── Master extraction ───────────────────────────────────────
  static extract(input: string): ExtractedValues {
    return {
      numbers:     ValueExtractor.extractNumbers(input),
      strings:     ValueExtractor.extractStrings(input),
      emails:      ValueExtractor.extractEmails(input),
      urls:        ValueExtractor.extractURLs(input),
      units:       ValueExtractor.extractUnits(input),
      colors:      ValueExtractor.extractColors(input),
      dates:       ValueExtractor.extractDates(input),
      ipAddresses: ValueExtractor.extractIPs(input),
    }
  }

  // ── Numbers: digit forms, written words, percentages, fractions ──
  static extractNumbers(input: string): Array<{ value: number; raw: string; position: number }> {
    const results: Array<{ value: number; raw: string; position: number }> = []
    const seen = new Set<string>()

    // Digit-based numbers: integers, decimals, percentages, negatives
    const digitPattern = /(-?\d+(?:\.\d+)?)(?:\s*%)?/g
    let match: RegExpExecArray | null
    while ((match = digitPattern.exec(input)) !== null) {
      const raw = match[0]
      if (!seen.has(raw)) {
        seen.add(raw)
        const num = parseFloat(raw.replace('%', '').trim())
        if (!isNaN(num)) {
          // If it has %, store as percentage fraction
          const value = raw.includes('%') ? num / 100 : num
          results.push({ value, raw, position: match.index })
        }
      }
    }

    // Fraction forms: "3/4", "1/2"
    const fracPattern = /\b(\d+)\s*\/\s*(\d+)\b/g
    while ((match = fracPattern.exec(input)) !== null) {
      const raw = match[0]
      if (!seen.has(raw)) {
        seen.add(raw)
        const num = parseInt(match[1], 10)
        const den = parseInt(match[2], 10)
        if (den !== 0) {
          results.push({ value: num / den, raw, position: match.index })
        }
      }
    }

    // Written number words: "five hundred and twenty three"
    // Match sequences of number words (with optional "and")
    const writtenPattern = /\b((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|trillion|and)\s*)+)\b/gi
    while ((match = writtenPattern.exec(input)) !== null) {
      const raw = match[0].trim()
      if (raw.length === 0) continue
      // Must end on a number word (not "and")
      const lastWord = raw.split(/\s+/).pop() ?? ''
      if (lastWord === 'and') continue
      const parsed = parseWrittenNumber(raw)
      if (parsed !== null && !seen.has(raw)) {
        seen.add(raw)
        results.push({ value: parsed, raw, position: match.index })
      }
    }

    // Fraction words: "half", "quarter", "third"
    for (const [word, value] of Object.entries(FRACTION_WORDS)) {
      const idx = input.toLowerCase().indexOf(word)
      if (idx !== -1 && !seen.has(word)) {
        seen.add(word)
        results.push({ value, raw: word, position: idx })
      }
    }

    return results.sort((a, b) => a.position - b.position)
  }

  // ── Strings: quoted, colon-delimited, implicit ─────────────
  static extractStrings(input: string): Array<{ value: string; delimiter: 'quote'|'colon'|'implicit'; position: number }> {
    const results: Array<{ value: string; delimiter: 'quote'|'colon'|'implicit'; position: number }> = []
    const seen = new Set<string>()

    // Double-quoted strings
    const dqPattern = /"([^"]+)"/g
    let match: RegExpExecArray | null
    while ((match = dqPattern.exec(input)) !== null) {
      if (!seen.has(match[1])) {
        seen.add(match[1])
        results.push({ value: match[1], delimiter: 'quote', position: match.index })
      }
    }

    // Single-quoted strings
    const sqPattern = /'([^']+)'/g
    while ((match = sqPattern.exec(input)) !== null) {
      if (!seen.has(match[1])) {
        seen.add(match[1])
        results.push({ value: match[1], delimiter: 'quote', position: match.index })
      }
    }

    // Backtick-quoted strings
    const btPattern = /`([^`]+)`/g
    while ((match = btPattern.exec(input)) !== null) {
      if (!seen.has(match[1])) {
        seen.add(match[1])
        results.push({ value: match[1], delimiter: 'quote', position: match.index })
      }
    }

    // Colon-delimited key:value pairs: "name: Alice"
    const colonPattern = /\b(\w[\w\s]*?):\s*([^\n,;]+)/g
    while ((match = colonPattern.exec(input)) !== null) {
      const val = match[2].trim()
      if (val.length > 0 && !seen.has(val)) {
        seen.add(val)
        results.push({ value: val, delimiter: 'colon', position: match.index + match[0].indexOf(val) })
      }
    }

    // Implicit strings: words that look like identifiers, paths, or code
    const implicitPattern = /\b([a-zA-Z_][\w./_-]*[\w/-])\b/g
    while ((match = implicitPattern.exec(input)) !== null) {
      const val = match[1]
      // Skip if it's a common word or already seen
      if (val.length <= 2 || seen.has(val)) continue
      // Skip common English words
      if (/^(the|this|that|with|from|into|for|and|but|not|are|was|has|had|have|been|will|would|could|should|can|may|might|shall|our|your|their|what|which|where|when|how|why|who|some|more|most|very|just|also|then|than|such|only|same|each|every|both|other|first|last|next|used|using|like|over|also|after|before|between|under|about|above|below|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|only|own|same|than|too|very)$/i.test(val)) continue
      seen.add(val)
      results.push({ value: val, delimiter: 'implicit', position: match.index })
    }

    return results.sort((a, b) => a.position - b.position)
  }

  // ── Emails ──────────────────────────────────────────────────
  static extractEmails(input: string): string[] {
    const results: string[] = []
    const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g
    let match: RegExpExecArray | null
    while ((match = emailPattern.exec(input)) !== null) {
      if (!results.includes(match[0])) {
        results.push(match[0])
      }
    }
    return results
  }

  // ── URLs ────────────────────────────────────────────────────
  static extractURLs(input: string): string[] {
    const results: string[] = []
    const urlPattern = /\b(?:https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:[/?#][^\s<>"')\]]*)?/gi
    let match: RegExpExecArray | null
    while ((match = urlPattern.exec(input)) !== null) {
      let url = match[0]
      // Clean trailing punctuation
      url = url.replace(/[.,;:!?)\]}>]+$/, '')
      if (!results.includes(url)) {
        results.push(url)
      }
    }
    return results
  }

  // ── Units: number + unit patterns ───────────────────────────
  static extractUnits(input: string): Array<{ value: number; unit: string; position: number }> {
    const results: Array<{ value: number; unit: string; position: number }> = []
    const seen = new Set<string>()

    let match: RegExpExecArray | null
    UNIT_PATTERN.lastIndex = 0
    while ((match = UNIT_PATTERN.exec(input)) !== null) {
      const key = `${match[1]}${match[2]}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          value: parseFloat(match[1]),
          unit: match[2].toLowerCase(),
          position: match.index,
        })
      }
    }

    // Temperature shorthand: "32°F", "100°C", "273K"
    const tempPattern = /(-?\d+(?:\.\d+)?)\s*(°[fFcCkK]|°)\b/g
    while ((match = tempPattern.exec(input)) !== null) {
      const key = `${match[1]}${match[2]}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          value: parseFloat(match[1]),
          unit: match[2],
          position: match.index,
        })
      }
    }

    return results.sort((a, b) => a.position - b.position)
  }

  // ── Colors: hex, rgb(), hsl(), named ────────────────────────
  static extractColors(input: string): Array<{ value: string; format: 'hex'|'rgb'|'hsl'|'name'; position: number }> {
    const results: Array<{ value: string; format: 'hex'|'rgb'|'hsl'|'name'; position: number }> = []
    const seen = new Set<string>()

    // Hex colors: #RGB, #RRGGBB, #RRGGBBAA
    const hexPattern = /#([0-9a-fA-F]{3,8})\b/g
    let match: RegExpExecArray | null
    while ((match = hexPattern.exec(input)) !== null) {
      const hex = match[0].toLowerCase()
      const len = match[1].length
      // Only accept valid hex color lengths: 3, 4, 6, 8
      if (len === 3 || len === 4 || len === 6 || len === 8) {
        if (!seen.has(hex)) {
          seen.add(hex)
          results.push({ value: hex, format: 'hex', position: match.index })
        }
      }
    }

    // rgb() colors
    const rgbPattern = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi
    while ((match = rgbPattern.exec(input)) !== null) {
      const val = match[0]
      if (!seen.has(val.toLowerCase())) {
        seen.add(val.toLowerCase())
        results.push({ value: val, format: 'rgb', position: match.index })
      }
    }

    // hsl() colors
    const hslPattern = /hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)/gi
    while ((match = hslPattern.exec(input)) !== null) {
      const val = match[0]
      if (!seen.has(val.toLowerCase())) {
        seen.add(val.toLowerCase())
        results.push({ value: val, format: 'hsl', position: match.index })
      }
    }

    // Named colors
    for (const [name, hex] of Object.entries(NAMED_COLORS)) {
      const idx = input.toLowerCase().indexOf(name)
      // Make sure it's a word boundary match
      if (idx !== -1) {
        const before = idx === 0 ? '' : input[idx - 1]
        const after = idx + name.length >= input.length ? '' : input[idx + name.length]
        const isWordBoundary = (before === '' || /[\s,;:(!]/.test(before)) && (after === '' || /[\s,;:!.)\]]/.test(after))
        if (isWordBoundary && !seen.has(name)) {
          seen.add(name)
          results.push({ value: hex, format: 'name', position: idx })
        }
      }
    }

    return results.sort((a, b) => a.position - b.position)
  }

  // ── Dates: ISO, US, EU, month-name ─────────────────────────
  static extractDates(input: string): string[] {
    const results: string[] = []
    const seen = new Set<string>()

    // ISO 8601: 2024-01-15, 2024-01-15T10:30:00
    const isoPattern = /\b(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?)?\b/g
    let match: RegExpExecArray | null
    while ((match = isoPattern.exec(input)) !== null) {
      const month = parseInt(match[2], 10)
      const day = parseInt(match[3], 10)
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        if (!seen.has(match[0])) {
          seen.add(match[0])
          results.push(match[0])
        }
      }
    }

    // US format: 01/15/2024, 1/15/2024
    const usPattern = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g
    while ((match = usPattern.exec(input)) !== null) {
      const month = parseInt(match[1], 10)
      const day = parseInt(match[2], 10)
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        if (!seen.has(match[0])) {
          seen.add(match[0])
          results.push(match[0])
        }
      }
    }

    // EU format: 15.01.2024, 15/01/2024 (day first, ambiguous with US)
    const euPattern = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g
    while ((match = euPattern.exec(input)) !== null) {
      const day = parseInt(match[1], 10)
      const month = parseInt(match[2], 10)
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        if (!seen.has(match[0])) {
          seen.add(match[0])
          results.push(match[0])
        }
      }
    }

    // Month-name formats: "January 15, 2024", "15 January 2024", "Jan 15 2024"
    const monthNames = 'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec'

    // "Month Day, Year"
    const mdYPattern = new RegExp(`\\b(${monthNames})\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'gi')
    while ((match = mdYPattern.exec(input)) !== null) {
      if (!seen.has(match[0])) {
        seen.add(match[0])
        results.push(match[0])
      }
    }

    // "Day Month Year"
    const dMYPattern = new RegExp(`\\b(\\d{1,2})\\s+(${monthNames}),?\\s+(\\d{4})\\b`, 'gi')
    while ((match = dMYPattern.exec(input)) !== null) {
      if (!seen.has(match[0])) {
        seen.add(match[0])
        results.push(match[0])
      }
    }

    return results
  }

  // ── IP Addresses ────────────────────────────────────────────
  static extractIPs(input: string): string[] {
    const results: string[] = []

    // IPv4
    const ipv4Pattern = /\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b/g
    let match: RegExpExecArray | null
    while ((match = ipv4Pattern.exec(input)) !== null) {
      if (!results.includes(match[0])) {
        results.push(match[0])
      }
    }

    // IPv6 (simplified — full address with colons)
    const ipv6Pattern = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g
    while ((match = ipv6Pattern.exec(input)) !== null) {
      if (!results.includes(match[0])) {
        results.push(match[0])
      }
    }

    // IPv6 shortened with ::
    const ipv6ShortPattern = /\b(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}\b/g
    while ((match = ipv6ShortPattern.exec(input)) !== null) {
      if (!results.includes(match[0])) {
        results.push(match[0])
      }
    }

    return results
  }
}
