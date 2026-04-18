// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Tokenizer
// Full NLP tokenization, normalization, POS tagging, entity
// extraction, and language detection.
// ─────────────────────────────────────────────────────────────

import type { TokenTag, ExtractedEntities } from '../types'

export class Tokenizer {
  // ── Contraction expansion map ──────────────────────────────
  private static CONTRACTIONS: Record<string, string> = {
    "don't": 'do not',
    "i'm": 'i am',
    "can't": 'cannot',
    "won't": 'will not',
    "it's": 'it is',
    "you're": 'you are',
    "i've": 'i have',
    "i'll": 'i will',
    "i'd": 'i would',
    "you've": 'you have',
    "you'll": 'you will',
    "you'd": 'you would',
    "he's": 'he is',
    "she's": 'she is',
    "they're": 'they are',
    "we're": 'we are',
    "that's": 'that is',
    "there's": 'there is',
    "here's": 'here is',
    "what's": 'what is',
    "where's": 'where is',
    "who's": 'who is',
    "how's": 'how is',
    "isn't": 'is not',
    "aren't": 'are not',
    "wasn't": 'was not',
    "weren't": 'were not',
    "hasn't": 'has not',
    "haven't": 'have not',
    "hadn't": 'had not',
    "doesn't": 'does not',
    "didn't": 'did not',
    "wouldn't": 'would not',
    "couldn't": 'could not',
    "shouldn't": 'should not',
    "mightn't": 'might not',
    "mustn't": 'must not',
    "let's": 'let us',
    "that'll": 'that will',
    "who'll": 'who will',
    "what'll": 'what will',
    "when'll": 'when will',
    "where'll": 'where will',
    "how'll": 'how will',
    "there'll": 'there will',
    "it'll": 'it will',
    "we'll": 'we will',
    "they'll": 'they will',
    "he'll": 'he will',
    "she'll": 'she will',
    "y'all": 'you all',
    "ain't": 'am not',
    'gonna': 'going to',
    'wanna': 'want to',
    'gotta': 'got to',
    'kinda': 'kind of',
    'sorta': 'sort of',
    'dunno': 'do not know',
    'lemme': 'let me',
    'gimme': 'give me',
    'imma': 'i am going to',
  }

  // ── Common word lists for POS tagging ──────────────────────
  private static COMMON_NOUNS = new Set([
    'time', 'year', 'people', 'way', 'day', 'man', 'woman', 'child', 'world',
    'life', 'hand', 'part', 'place', 'case', 'week', 'company', 'system',
    'program', 'question', 'work', 'government', 'number', 'night', 'point',
    'home', 'water', 'room', 'mother', 'area', 'money', 'story', 'fact',
    'month', 'lot', 'right', 'study', 'book', 'eye', 'job', 'word',
    'business', 'issue', 'side', 'kind', 'head', 'house', 'service',
    'friend', 'father', 'power', 'hour', 'game', 'line', 'end', 'member',
    'law', 'car', 'city', 'community', 'name', 'president', 'team', 'minute',
    'idea', 'body', 'information', 'back', 'parent', 'face', 'level',
    'office', 'door', 'health', 'person', 'art', 'war', 'history', 'party',
    'result', 'change', 'morning', 'reason', 'research', 'girl', 'guy',
    'moment', 'air', 'teacher', 'force', 'education', 'food', 'picture',
    'color', 'data', 'computer', 'text', 'message', 'chat', 'bot', 'ai',
    'machine', 'code', 'number', 'string', 'file', 'list', 'table', 'name',
    'value', 'key', 'user', 'input', 'output', 'error', 'function', 'class',
    'method', 'object', 'array', 'element', 'field', 'record', 'query',
    'database', 'server', 'client', 'request', 'response', 'token', 'model',
    'pattern', 'rule', 'format', 'type', 'operator', 'expression', 'variable',
    'parameter', 'argument', 'result', 'status', 'version', 'feature',
    'option', 'setting', 'config', 'log', 'event', 'action', 'handler',
    'callback', 'promise', 'state', 'context', 'session', 'cookie', 'cache',
    'memory', 'storage', 'index', 'collection', 'document', 'page', 'link',
    'image', 'video', 'audio', 'font', 'icon', 'button', 'form', 'menu',
    'modal', 'dialog', 'tooltip', 'notification', 'alert', 'badge', 'card',
    'header', 'footer', 'sidebar', 'layout', 'grid', 'column', 'row',
    'capital', 'country', 'city', 'planet', 'ocean', 'mountain', 'river',
    'continent', 'language', 'currency', 'president', 'temperature',
    'distance', 'speed', 'weight', 'height', 'length', 'width', 'area',
    'volume', 'angle', 'degree', 'percentage', 'fraction', 'decimal',
    'integer', 'digit', 'equation', 'formula', 'solution', 'problem',
    'answer', 'question', 'calculation', 'operation', 'addition',
    'subtraction', 'multiplication', 'division', 'remainder', 'power',
    'root', 'square', 'cube', 'circle', 'triangle', 'rectangle',
    'hexagon', 'color', 'palette', 'shade', 'tint', 'hue', 'contrast',
  ])

  private static COMMON_VERBS = new Set([
    'be', 'is', 'am', 'are', 'was', 'were', 'been', 'being',
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'say', 'said', 'get', 'got', 'make', 'made', 'go', 'went', 'gone',
    'know', 'knew', 'take', 'took', 'see', 'saw', 'come', 'came',
    'think', 'thought', 'look', 'looking', 'want', 'give', 'use',
    'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave',
    'call', 'keep', 'let', 'begin', 'show', 'hear', 'play', 'run',
    'move', 'live', 'believe', 'hold', 'bring', 'happen', 'write',
    'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include',
    'continue', 'set', 'learn', 'change', 'lead', 'understand',
    'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow',
    'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer',
    'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve',
    'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach',
    'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require',
    'report', 'decide', 'pull', 'develop', 'eat', 'drink', 'sleep',
    'calculate', 'compute', 'convert', 'encode', 'decode', 'hash',
    'generate', 'parse', 'validate', 'format', 'extract', 'test',
    'search', 'filter', 'sort', 'merge', 'split', 'join', 'count',
    'check', 'verify', 'compare', 'evaluate', 'execute', 'process',
    'handle', 'manage', 'store', 'retrieve', 'delete', 'update',
    'insert', 'select', 'return', 'display', 'render', 'print',
    'export', 'import', 'download', 'upload', 'save', 'load',
  ])

  private static COMMON_ADJECTIVES = new Set([
    'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own',
    'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large',
    'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same',
    'able', 'free', 'full', 'sure', 'real', 'strong', 'hard', 'true',
    'whole', 'low', 'late', 'deep', 'fast', 'dark', 'bright', 'simple',
    'clear', 'easy', 'ready', 'green', 'nice', 'huge', 'popular',
    'natural', 'physical', 'social', 'financial', 'political', 'available',
    'likely', 'current', 'national', 'federal', 'international', 'medical',
    'traditional', 'digital', 'beautiful', 'hot', 'cold', 'warm', 'cool',
    'dry', 'wet', 'heavy', 'light', 'soft', 'sharp', 'smooth', 'rough',
    'quiet', 'loud', 'clean', 'dirty', 'safe', 'dangerous', 'rich',
    'poor', 'happy', 'sad', 'angry', 'afraid', 'brave', 'calm', 'kind',
    'mean', 'polite', 'rude', 'smart', 'stupid', 'funny', 'serious',
    'strange', 'normal', 'common', 'rare', 'specific', 'general',
    'exact', 'approximate', 'positive', 'negative', 'neutral', 'active',
    'passive', 'static', 'dynamic', 'local', 'remote', 'internal',
    'external', 'basic', 'advanced', 'simple', 'complex', 'open',
    'closed', 'fixed', 'variable', 'constant', 'random', 'certain',
    'valid', 'invalid', 'correct', 'incorrect', 'empty', 'complete',
    'partial', 'total', 'main', 'primary', 'secondary', 'final',
  ])

  // ── Normalize ──────────────────────────────────────────────
  normalize(input: string): string {
    let text = input.toLowerCase().trim()

    // Expand contractions (sort by length descending to match longest first)
    const sortedKeys = Object.keys(Tokenizer.CONTRACTIONS).sort(
      (a, b) => b.length - a.length
    )
    for (const contraction of sortedKeys) {
      const expanded = Tokenizer.CONTRACTIONS[contraction]
      // Use global regex to replace all occurrences
      const regex = new RegExp(`\\b${contraction.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      text = text.replace(regex, expanded)
    }

    // Strip non-alphanumeric except math operators (+-*/^%=), preserve
    // decimal points within numbers and negative signs before numbers.
    // Strategy: walk character by character
    const result: string[] = []
    const mathOperators = new Set(['+', '-', '*', '/', '^', '%', '='])
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const code = ch.charCodeAt(0)

      // Alphanumeric: always keep
      if (
        (code >= 48 && code <= 57) ||  // 0-9
        (code >= 97 && code <= 122) ||  // a-z
        ch === ' '
      ) {
        result.push(ch)
        continue
      }

      // Math operators: always keep
      if (mathOperators.has(ch)) {
        result.push(ch)
        continue
      }

      // Decimal point: keep only if surrounded by digits
      if (ch === '.') {
        const prevIsDigit = i > 0 && text.charCodeAt(i - 1) >= 48 && text.charCodeAt(i - 1) <= 57
        const nextIsDigit = i < text.length - 1 && text.charCodeAt(i + 1) >= 48 && text.charCodeAt(i + 1) <= 57
        if (prevIsDigit && nextIsDigit) {
          result.push(ch)
          continue
        }
        // If it's a trailing decimal after digits (e.g., "3." at end of string)
        if (prevIsDigit && (i === text.length - 1 || !((text.charCodeAt(i + 1) >= 97 && text.charCodeAt(i + 1) <= 122)))) {
          result.push(ch)
          continue
        }
        // Replace with space
        result.push(' ')
        continue
      }

      // Negative sign: keep only if preceding char is operator/space/start and next is digit
      if (ch === '-' || ch === '−') {
        const prevChar = i > 0 ? text[i - 1] : ' '
        const nextIsDigit = i < text.length - 1 && text.charCodeAt(i + 1) >= 48 && text.charCodeAt(i + 1) <= 57
        if ((mathOperators.has(prevChar) || prevChar === ' ' || i === 0) && nextIsDigit) {
          result.push('-')
          continue
        }
        // Not a negative sign, treat as minus operator if preceded by space or digit
        if (prevChar === ' ' || (i > 0 && text.charCodeAt(i - 1) >= 48 && text.charCodeAt(i - 1) <= 57)) {
          result.push('-')
          continue
        }
        result.push(' ')
        continue
      }

      // Replace all other characters with space
      result.push(' ')
    }

    // Collapse multiple spaces and trim
    return result.join('').replace(/\s+/g, ' ').trim()
  }

  // ── Tokenize ───────────────────────────────────────────────
  tokenize(text: string): string[] {
    const normalized = this.normalize(text)
    if (!normalized) return []

    const tokens: string[] = []
    // Split on whitespace first
    const parts = normalized.split(/\s+/)

    for (const part of parts) {
      if (!part) continue

      // Further split on punctuation boundaries, but preserve:
      // - Numbers (including decimals and negatives): "-3.14", "42"
      // - Math operators: "+", "-", "*", "/", "^", "%", "="
      // - Operator-number combinations: "+5", "-3"

      // Check if the entire part is a number (including negative and decimal)
      if (/^-?\d+(\.\d+)?$/.test(part)) {
        tokens.push(part)
        continue
      }

      // Check if part is a single math operator
      if (/^[+\-*/^%=]$/.test(part)) {
        tokens.push(part)
        continue
      }

      // Check for operator+number pattern (e.g., "+5", "-3", "*2")
      if (/^[+\-*/^%]=-?\d+(\.\d+)?$/.test(part)) {
        tokens.push(part[0])
        tokens.push(part.slice(1))
        continue
      }

      // For mixed content, split at boundaries between letters and non-letters
      // but keep numbers together
      let current = ''
      for (let i = 0; i < part.length; i++) {
        const ch = part[i]
        const isAlpha = /[a-z]/i.test(ch)
        const isDigit = /[0-9]/.test(ch)
        const isMathOp = /[+\-*/^%=]/.test(ch)
        const isDot = ch === '.'

        if (!current) {
          current = ch
          continue
        }

        const lastCh = current[current.length - 1]
        const lastIsAlpha = /[a-z]/i.test(lastCh)
        const lastIsDigit = /[0-9]/.test(lastCh)

        // Keep number-dot-digit sequences together (decimals)
        if (lastIsDigit && isDot && i + 1 < part.length && /[0-9]/.test(part[i + 1])) {
          current += ch
          continue
        }

        // Keep digit sequences together
        if (lastIsDigit && isDigit) {
          current += ch
          continue
        }

        // Keep letter sequences together
        if (lastIsAlpha && isAlpha) {
          current += ch
          continue
        }

        // Keep math operators as individual tokens
        if (isMathOp) {
          if (current) tokens.push(current)
          current = ch
          continue
        }

        // Transition between different types: split
        if (current) tokens.push(current)
        current = ch
      }

      if (current) tokens.push(current)
    }

    // Filter empty tokens and single dots that aren't part of numbers
    return tokens.filter(t => t && t !== '.')
  }

  // ── POS Tagging ────────────────────────────────────────────
  tagPOS(tokens: string[]): TokenTag[] {
    return tokens.map(token => {
      const lower = token.toLowerCase()

      // Punctuation detection (including math operators treated as punct)
      if (/^[+\-*/^%=]$/.test(token)) {
        return { token, pos: 'punct' }
      }
      if (/^[^\w]+$/.test(token)) {
        return { token, pos: 'punct' }
      }

      // Number detection
      if (/^-?\d+(\.\d+)?$/.test(token)) {
        return { token, pos: 'number' }
      }

      // Noun check
      if (Tokenizer.COMMON_NOUNS.has(lower)) {
        return { token, pos: 'noun' }
      }

      // Verb check
      if (Tokenizer.COMMON_VERBS.has(lower)) {
        return { token, pos: 'verb' }
      }

      // Adjective check
      if (Tokenizer.COMMON_ADJECTIVES.has(lower)) {
        return { token, pos: 'adj' }
      }

      // Common suffix heuristics
      if (/(?:tion|sion|ment|ness|ity|ence|ance|ism|ist|ery|ory|dom|ship|hood)$/.test(lower)) {
        return { token, pos: 'noun' }
      }
      if (/(?:ing|ed|ize|ise|ify|ate|en)$/.test(lower) && lower.length > 3) {
        return { token, pos: 'verb' }
      }
      if (/(?:ful|less|ous|ive|able|ible|al|ial|ic|ical|ish|ent|ant|ary|ory|ly)$/.test(lower) && lower.length > 3) {
        return { token, pos: 'adj' }
      }

      return { token, pos: 'unknown' }
    })
  }

  // ── Entity Extraction ──────────────────────────────────────
  extractEntities(text: string): ExtractedEntities {
    const dates: string[] = []
    const numbers: number[] = []
    const quoted: string[] = []
    const urls: string[] = []

    // ── Dates ──
    // ISO format: YYYY-MM-DD
    const isoDateRegex = /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g
    let match: RegExpExecArray | null
    while ((match = isoDateRegex.exec(text)) !== null) {
      dates.push(match[1])
    }

    // US format: MM/DD/YYYY or MM-DD-YYYY
    const usDateRegex = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/g
    while ((match = usDateRegex.exec(text)) !== null) {
      if (!dates.includes(match[1])) dates.push(match[1])
    }

    // Written dates: January 15, 2024 / Jan 15 2024 / 15 January 2024
    const writtenDateRegex = /\b((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s*\d{4}|\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4})\b/gi
    while ((match = writtenDateRegex.exec(text)) !== null) {
      if (!dates.includes(match[1])) dates.push(match[1])
    }

    // Relative dates: today, tomorrow, yesterday, next week, etc.
    const relativeDateRegex = /\b(today|tomorrow|yesterday|next\s+(?:week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|last\s+(?:week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi
    while ((match = relativeDateRegex.exec(text)) !== null) {
      if (!dates.includes(match[1])) dates.push(match[1])
    }

    // ── Numbers ──
    // Build set of character ranges that belong to date strings, so we don't
    // extract the year/month/day segments as standalone numbers.
    const dateRanges: Array<[number, number]> = []
    for (const d of dates) {
      let start = 0
      while (true) {
        const idx = text.indexOf(d, start)
        if (idx === -1) break
        dateRanges.push([idx, idx + d.length])
        start = idx + 1
      }
    }

    const isInDateRange = (pos: number, len: number): boolean => {
      for (const [ds, de] of dateRanges) {
        if (pos >= ds && pos + len <= de) return true
      }
      return false
    }

    // Integers and decimals (including negative)
    const numberRegex = /-?\b\d+(?:\.\d+)?\b/g
    while ((match = numberRegex.exec(text)) !== null) {
      if (isInDateRange(match.index, match[0].length)) continue
      const num = parseFloat(match[0])
      if (!isNaN(num) && !numbers.includes(num)) {
        numbers.push(num)
      }
    }

    // Fractions: 1/2, 3/4, etc. (but not dates)
    const fractionRegex = /\b(\d+)\/(\d+)\b/g
    while ((match = fractionRegex.exec(text)) !== null) {
      if (isInDateRange(match.index, match[0].length)) continue
      const numerator = parseInt(match[1], 10)
      const denominator = parseInt(match[2], 10)
      if (denominator !== 0 && denominator <= 1000 && numerator <= 1000) {
        const fractionVal = numerator / denominator
        if (!numbers.includes(fractionVal)) {
          numbers.push(fractionVal)
        }
      }
    }

    // Percentages: 50%, 3.14%
    const percentRegex = /(-?\d+(?:\.\d+)?)%/g
    while ((match = percentRegex.exec(text)) !== null) {
      const pct = parseFloat(match[1])
      if (!isNaN(pct) && !numbers.includes(pct)) {
        numbers.push(pct)
      }
    }

    // ── Quoted strings ──
    // Double quotes
    const doubleQuoteRegex = /"([^"]+)"/g
    while ((match = doubleQuoteRegex.exec(text)) !== null) {
      quoted.push(match[1])
    }

    // Single quotes (but not contractions)
    const singleQuoteRegex = /'([^']+)'/g
    while ((match = singleQuoteRegex.exec(text)) !== null) {
      if (match[1].length > 1 && !match[1].includes(' ')) {
        // Skip single-word single-quoted items that look like contractions
      }
      quoted.push(match[1])
    }

    // Backtick quoted
    const backtickRegex = /`([^`]+)`/g
    while ((match = backtickRegex.exec(text)) !== null) {
      quoted.push(match[1])
    }

    // ── URLs ──
    const urlRegex = /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z]{2,})(?:\/[^\s]*)?\b/g
    while ((match = urlRegex.exec(text)) !== null) {
      urls.push(match[0])
    }

    return { dates, numbers, quoted, urls }
  }

  // ── Language / Register Detection ──────────────────────────
  detectLanguage(text: string): 'en' | 'formal' | 'casual' {
    if (!text || text.trim().length === 0) return 'en'

    const lower = text.toLowerCase()
    const words = lower.split(/\s+/).filter(Boolean)

    if (words.length === 0) return 'en'

    // Count contractions and slang
    const contractions = [
      "don't", "can't", "won't", "i'm", "you're", "they're", "we're",
      "it's", "that's", "isn't", "aren't", "wasn't", "weren't",
      "hasn't", "haven't", "didn't", "doesn't", "wouldn't", "couldn't",
      "shouldn't", "i'll", "you'll", "we'll", "they'll", "he'll", "she'll",
      "i've", "you've", "i'd", "you'd", "let's", "ain't",
      'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'dunno', 'lemme',
      'gimme', 'imma', "y'all",
    ]

    const slang = [
      'lol', 'lmao', 'rofl', 'brb', 'btw', 'omg', 'wtf', 'idk',
      'tbh', 'imo', 'imho', 'fyi', 'afk', 'nvm', 'smh', 'ngl',
      'yolo', 'fomo', 'jk', 'thx', 'ty', 'np', 'yw', 'ily',
      'sup', 'yo', 'hey', 'hiya', 'howdy', 'dunno', 'whatcha',
      'ya', 'nah', 'yep', 'nope', 'dude', 'bro', 'bruh',
    ]

    let contractionCount = 0
    let slangCount = 0

    for (const word of words) {
      // Strip trailing punctuation for matching
      const cleaned = word.replace(/[.!?,;:]+$/, '')
      if (contractions.includes(cleaned)) contractionCount++
      if (slang.includes(cleaned)) slangCount++
    }

    const totalMarkers = contractionCount + slangCount
    const markerRatio = totalMarkers / words.length

    // If significant casual markers, classify as casual
    if (markerRatio > 0.1 || totalMarkers >= 2) return 'casual'

    // Check for formal indicators: longer average word length, no contractions
    const avgWordLength = words.reduce((sum, w) => sum + w.replace(/[^a-z]/g, '').length, 0) / words.length
    const hasQuestionMark = text.includes('?')
    const hasExclamation = text.includes('!')
    const longerWords = words.filter(w => w.replace(/[^a-z]/g, '').length > 7).length
    const longerRatio = longerWords / words.length

    // Formal: no contractions, longer words, no excessive punctuation
    if (contractionCount === 0 && avgWordLength > 5 && longerRatio > 0.2 && !hasExclamation) {
      return 'formal'
    }

    // Structured questions with no contractions lean formal
    if (contractionCount === 0 && hasQuestionMark && avgWordLength > 4.5) {
      return 'formal'
    }

    return 'en'
  }
}
