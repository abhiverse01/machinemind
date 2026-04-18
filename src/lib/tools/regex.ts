// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Regex Tool
// Test patterns, match with capture groups, explain in plain
// English, common pattern library.
// ─────────────────────────────────────────────────────────────

import type { ToolResult } from '../types'

// ── Common pattern library ───────────────────────────────────
const COMMON_PATTERNS: Record<string, { pattern: string; flags: string; description: string }> = {
  email: {
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: '',
    description: 'Email address',
  },
  url: {
    pattern: 'https?://[\\w\\-]+(\\.[\\w\\-]+)+[\\w.,@?^=%&:/~+#-]*',
    flags: '',
    description: 'HTTP/HTTPS URL',
  },
  date_iso: {
    pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])',
    flags: '',
    description: 'ISO date (YYYY-MM-DD)',
  },
  date_us: {
    pattern: '(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\\d|3[01])/\\d{4}',
    flags: '',
    description: 'US date (MM/DD/YYYY)',
  },
  phone_us: {
    pattern: '\\(?(?:\\d{3})?\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
    flags: '',
    description: 'US phone number',
  },
  phone_intl: {
    pattern: '\\+?\\d{1,3}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}',
    flags: '',
    description: 'International phone number',
  },
  ipv4: {
    pattern: '(?:\\d{1,3}\\.){3}\\d{1,3}',
    flags: '',
    description: 'IPv4 address',
  },
  ipv6: {
    pattern: '(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}',
    flags: '',
    description: 'IPv6 address',
  },
  hex_color: {
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}',
    flags: '',
    description: 'Hex color code',
  },
  slug: {
    pattern: '[a-z0-9]+(?:-[a-z0-9]+)*',
    flags: '',
    description: 'URL slug',
  },
}

// ── Plain-English regex explainer (rule-based) ───────────────
function explainRegex(pattern: string): string {
  const explanations: string[] = []
  let i = 0

  while (i < pattern.length) {
    const ch = pattern[i]

    // ── Anchors ──
    if (ch === '^') {
      explanations.push('"^" — start of string')
      i++
      continue
    }
    if (ch === '$') {
      explanations.push('"$" — end of string')
      i++
      continue
    }

    // ── Escape sequences ──
    if (ch === '\\' && i + 1 < pattern.length) {
      const next = pattern[i + 1]
      const escapeMap: Record<string, string> = {
        d: '"\\d" — any digit (0-9)',
        D: '"\\D" — any non-digit',
        w: '"\\w" — any word character (a-z, A-Z, 0-9, _)',
        W: '"\\W" — any non-word character',
        s: '"\\s" — any whitespace',
        S: '"\\S" — any non-whitespace',
        b: '"\\b" — word boundary',
        B: '"\\B" — non-word boundary',
        n: '"\\n" — newline',
        t: '"\\t" — tab',
        r: '"\\r" — carriage return',
      }
      if (escapeMap[next]) {
        explanations.push(escapeMap[next])
        i += 2
        continue
      }
      // Escaped special character (literal)
      explanations.push(`"\\${next}" — literal "${next}"`)
      i += 2
      continue
    }

    // ── Character class [...] ──
    if (ch === '[') {
      let end = i + 1
      let negated = false
      if (end < pattern.length && pattern[end] === '^') {
        negated = true
        end++
      }
      // Handle ] as first char inside class (it's literal, not closing)
      if (end < pattern.length && pattern[end] === ']') {
        end++
      }
      const start = end
      while (end < pattern.length && pattern[end] !== ']') end++
      const content = pattern.slice(start, end)
      const neg = negated ? 'NOT ' : ''
      const fromTo = content.match(/^(\w)-(\w)$/)
      let desc: string
      if (fromTo) {
        desc = `${neg}any character from ${fromTo[1]} to ${fromTo[2]}`
      } else {
        desc = `${neg}any character in "${content}"`
      }
      explanations.push(`"[${negated ? '^' : ''}${content}]" — ${desc}`)
      i = end + 1
      continue
    }

    // ── Grouping (...) ──
    if (ch === '(') {
      if (pattern.slice(i).startsWith('(?:')) {
        explanations.push('"(?:...)" — non-capturing group')
        i += 3
        continue
      }
      if (pattern.slice(i).startsWith('(?=')) {
        explanations.push('"(?=...)" — positive lookahead')
        i += 3
        continue
      }
      if (pattern.slice(i).startsWith('(?!')) {
        explanations.push('"(?!...)" — negative lookahead')
        i += 3
        continue
      }
      if (pattern.slice(i).startsWith('(?<=')) {
        explanations.push('"(?<=...)" — positive lookbehind')
        i += 4
        continue
      }
      if (pattern.slice(i).startsWith('(?<!')) {
        explanations.push('"(?<!...)" — negative lookbehind')
        i += 4
        continue
      }
      explanations.push('"(...)" — capture group')
      i++
      continue
    }
    if (ch === ')') {
      i++
      continue
    }

    // ── Quantifiers ──
    if (ch === '?') {
      explanations.push('"?" — zero or one time (optional)')
      i++
      continue
    }
    if (ch === '*') {
      explanations.push('"*" — zero or more times')
      i++
      continue
    }
    if (ch === '+') {
      explanations.push('"+" — one or more times')
      i++
      continue
    }

    // ── Curly brace quantifier {n}, {n,}, {n,m} ──
    if (ch === '{') {
      let end = i + 1
      while (end < pattern.length && pattern[end] !== '}') end++
      const content = pattern.slice(i + 1, end)
      if (/^\d+$/.test(content)) {
        explanations.push(`"{${content}}" — exactly ${content} times`)
      } else if (/^\d+,$/.test(content)) {
        const n = content.replace(',', '')
        explanations.push(`"{${content}}" — ${n} or more times`)
      } else if (/^\d+,\d+$/.test(content)) {
        const parts = content.split(',')
        explanations.push(`"{${content}}" — between ${parts[0]} and ${parts[1]} times`)
      } else {
        explanations.push(`"{${content}}" — repeat ${content} times`)
      }
      i = end + 1
      continue
    }

    // ── Alternation ──
    if (ch === '|') {
      explanations.push('"|" — OR alternation')
      i++
      continue
    }

    // ── Dot ──
    if (ch === '.') {
      explanations.push('"." — any character except newline')
      i++
      continue
    }

    // ── Literal character ──
    explanations.push(`"${ch}" — literal "${ch}"`)
    i++
  }

  return explanations.join('\n')
}

// ── Execute regex against a string ───────────────────────────
interface RegexMatch {
  match: string
  index: number
  groups: string[]
  namedGroups: Record<string, string>
}

interface RegexTestResult {
  pattern: string
  flags: string
  matches: RegexMatch[]
  matchCount: number
}

function testRegex(pattern: string, flags: string, testString: string): RegexTestResult {
  // Always add 'g' flag to collect all matches
  const effectiveFlags = flags.includes('g') ? flags : flags + 'g'
  const re = new RegExp(pattern, effectiveFlags)
  const matches: RegexMatch[] = []
  let m: RegExpExecArray | null

  while ((m = re.exec(testString)) !== null) {
    const namedGroups: Record<string, string> = {}
    if (m.groups) {
      for (const [k, v] of Object.entries(m.groups)) {
        namedGroups[k] = v ?? ''
      }
    }
    matches.push({
      match: m[0],
      index: m.index,
      groups: Array.from(m).slice(1),
      namedGroups,
    })
    if (m[0].length === 0) re.lastIndex++ // prevent infinite loop on zero-length matches
  }

  return { pattern, flags, matches, matchCount: matches.length }
}

// ── Input parsing ────────────────────────────────────────────
type RegexAction = 'test' | 'match' | 'explain' | 'pattern'

interface ParsedRegexInput {
  action: RegexAction
  pattern?: string
  flags?: string
  testString?: string
  patternName?: string
}

function parseInput(input: string): ParsedRegexInput {
  const trimmed = input.trim()

  // "regex test /\d+/ abc123"
  const testMatch = trimmed.match(/^regex\s+test\s+\/(.+?)\/([gimsuy]*)\s+([\s\S]*)$/i)
  if (testMatch) {
    return { action: 'test', pattern: testMatch[1], flags: testMatch[2], testString: testMatch[3] }
  }

  // "regex match /(\d{3})-(\d{4})/ 555-1234"
  const matchMatch = trimmed.match(/^regex\s+match\s+\/(.+?)\/([gimsuy]*)\s+([\s\S]*)$/i)
  if (matchMatch) {
    return { action: 'match', pattern: matchMatch[1], flags: matchMatch[2], testString: matchMatch[3] }
  }

  // "regex explain /[a-z]+@[a-z]+\.[a-z]{2,}/"
  const explainMatch = trimmed.match(/^regex\s+explain\s+\/(.+?)\/([gimsuy]*)$/i)
  if (explainMatch) {
    return { action: 'explain', pattern: explainMatch[1], flags: explainMatch[2] }
  }

  // "regex for email" / "regex pattern phone_us"
  const patternMatch = trimmed.match(/^regex\s+(?:for|pattern)\s+(\w+)$/i)
  if (patternMatch) {
    return { action: 'pattern', patternName: patternMatch[1].toLowerCase() }
  }

  // Bare regex test: "/\d+/ abc123"
  const bareTest = trimmed.match(/^\/(.+?)\/([gimsuy]*)\s+([\s\S]*)$/)
  if (bareTest) {
    return { action: 'test', pattern: bareTest[1], flags: bareTest[2], testString: bareTest[3] }
  }

  // Bare regex explain: "/\d+/"
  const bareExplain = trimmed.match(/^\/(.+?)\/([gimsuy]*)$/)
  if (bareExplain) {
    return { action: 'explain', pattern: bareExplain[1], flags: bareExplain[2] }
  }

  // "explain <pattern>"
  if (/^explain\s+/i.test(trimmed)) {
    const rest = trimmed.slice(8)
    const slashMatch = rest.match(/^\/(.+?)\/([gimsuy]*)$/)
    if (slashMatch) {
      return { action: 'explain', pattern: slashMatch[1], flags: slashMatch[2] }
    }
    return { action: 'explain', pattern: rest }
  }

  // Default: explain the input as a pattern
  return { action: 'explain', pattern: trimmed }
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const parsed = parseInput(input)

    switch (parsed.action) {
      case 'test':
      case 'match': {
        if (!parsed.pattern || !parsed.testString) {
          throw new Error(
            'Need pattern and test string. Use: "regex test /pattern/flags testString" or "regex match /pattern/flags testString"'
          )
        }
        // Validate the regex pattern
        try {
          new RegExp(parsed.pattern, parsed.flags ?? '')
        } catch (err: unknown) {
          throw new Error(
            `Invalid regex pattern: ${err instanceof Error ? err.message : String(err)}`
          )
        }
        const result = testRegex(parsed.pattern, parsed.flags ?? '', parsed.testString)
        const execMs = Date.now() - t0

        let raw: string
        if (result.matchCount === 0) {
          raw = `Pattern: /${parsed.pattern}/${parsed.flags ?? ''}\nNo matches found in "${parsed.testString}"`
        } else {
          const matchLines = result.matches.map((m, i) => {
            let line = `Match ${i + 1}: "${m.match}" at index ${m.index}`
            if (m.groups.length > 0) {
              line += `\n  Capture groups: ${m.groups.map((g, gi) => `$${gi + 1}="${g}"`).join(', ')}`
            }
            const namedKeys = Object.keys(m.namedGroups)
            if (namedKeys.length > 0) {
              line += `\n  Named groups: ${namedKeys.map(k => `${k}="${m.namedGroups[k]}"`).join(', ')}`
            }
            return line
          })
          raw = `Pattern: /${parsed.pattern}/${parsed.flags ?? ''}\n${result.matchCount} match${result.matchCount !== 1 ? 'es' : ''} found:\n${matchLines.join('\n')}`
        }

        return {
          status: 'ok',
          result,
          displayType: 'code',
          raw,
          execMs,
        }
      }

      case 'explain': {
        if (!parsed.pattern) throw new Error('No pattern to explain')
        // Validate the regex pattern
        try {
          new RegExp(parsed.pattern, parsed.flags ?? '')
        } catch (err: unknown) {
          throw new Error(
            `Invalid regex pattern: ${err instanceof Error ? err.message : String(err)}`
          )
        }
        const explanation = explainRegex(parsed.pattern)
        const execMs = Date.now() - t0
        const raw = `Pattern: /${parsed.pattern}/${parsed.flags ?? ''}\n\n${explanation}`
        return {
          status: 'ok',
          result: { pattern: parsed.pattern, flags: parsed.flags ?? '', explanation },
          displayType: 'code',
          raw,
          execMs,
        }
      }

      case 'pattern': {
        const name = parsed.patternName ?? ''
        const common = COMMON_PATTERNS[name]
        if (!common) {
          const available = Object.keys(COMMON_PATTERNS).join(', ')
          throw new Error(`Unknown pattern "${name}". Available patterns: ${available}`)
        }
        const execMs = Date.now() - t0
        const raw = `${common.description}: /${common.pattern}/${common.flags}`
        return {
          status: 'ok',
          result: { name, ...common },
          displayType: 'code',
          raw,
          execMs,
        }
      }
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
