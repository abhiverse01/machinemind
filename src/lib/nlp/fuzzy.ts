// ─────────────────────────────────────────────────────────────
// MACHINE MIND v4.0 — Typo Correction & Phonetic Matching
// Rule-based fuzzy matching: misspellings, keyboard-proximity
// errors, and phonetic near-matches. Zero external deps.
// ─────────────────────────────────────────────────────────────

export class FuzzyMatcher {
  // ── 1. Known typo → correction dictionary ────────────────────
  static readonly KNOWN_CORRECTIONS: Record<string, string> = {
    // Math
    calcualte: 'calculate',
    claculate: 'calculate',
    calulate: 'calculate',
    calcualtor: 'calculator',
    claculator: 'calculator',
    sqaure: 'square',
    squre: 'square',
    squroot: 'square root',
    mathmatix: 'mathematics',
    mathmetics: 'mathematics',
    devide: 'divide',
    divde: 'divide',
    multipley: 'multiply',
    multiplie: 'multiply',
    substract: 'subtract',
    substact: 'subtract',

    // Time
    timezoen: 'timezone',
    timzone: 'timezone',
    timzeone: 'timezone',
    tomorow: 'tomorrow',
    tommorow: 'tomorrow',
    tomorro: 'tomorrow',
    calender: 'calendar',
    calander: 'calendar',

    // Encoding
    'base 64': 'base64',
    baes64: 'base64',
    bse64: 'base64',
    encdoe: 'encode',
    ecnode: 'encode',
    endcode: 'encode',
    decoed: 'decode',
    decdoe: 'decode',
    encrytp: 'encrypt',
    encyrpt: 'encrypt',
    hexdecimal: 'hexadecimal',
    hexadeicmal: 'hexadecimal',
    morsse: 'morse',
    morsee: 'morse',
    mrse: 'morse',

    // Hashing
    'sha 256': 'sha256',
    'sha-256': 'sha256',
    sha265: 'sha256',
    uhash: 'uuid',
    uiid: 'uuid',
    uuidv4: 'uuid',
    hassh: 'hash',
    ahsh: 'hash',
    hsh: 'hash',

    // Color
    coler: 'color',
    coulour: 'color',
    coloer: 'color',
    converision: 'conversion',
    convertion: 'conversion',
    copmlementary: 'complementary',
    complimentary: 'complementary',

    // JSON
    jsno: 'json',
    jons: 'json',
    jsoon: 'json',
    parase: 'parse',
    prase: 'parse',
    pars: 'parse',
    formatt: 'format',
    fromat: 'format',

    // Random
    randm: 'random',
    randon: 'random',
    ranodm: 'random',
    dicee: 'dice',
    diec: 'dice',
    paswword: 'password',
    passowrd: 'password',
    pasword: 'password',

    // Regex
    regx: 'regex',
    reegx: 'regex',
    regext: 'regex',
    patten: 'pattern',
    patterm: 'pattern',

    // Units
    farenheit: 'fahrenheit',
    farenheight: 'fahrenheit',
    ferenhiet: 'fahrenheit',
    celcius: 'celsius',
    celcuis: 'celsius',
    celsuis: 'celsius',
    kilometre: 'kilometer',
    kilomter: 'kilometer',
    kilogarm: 'kilogram',

    // Common
    teh: 'the',
    hte: 'the',
    taht: 'that',
    thta: 'that',
    adn: 'and',
    nad: 'and',
    waht: 'what',
    hwat: 'what',
    shold: 'should',
    shoud: 'should',
    htink: 'think',
    jsut: 'just',
    juts: 'just',
    fomr: 'from',
    wiht: 'with',
    whit: 'with',
  }

  // ── 2. Core command / intent vocabulary ──────────────────────
  static readonly CORE_VOCABULARY: string[] = [
    'calculate', 'calculator', 'compute', 'convert', 'encode', 'decode',
    'hash', 'sha256', 'uuid', 'color', 'hex', 'rgb', 'hsl',
    'json', 'parse', 'format', 'regex', 'pattern', 'random', 'dice',
    'password', 'time', 'clock', 'timezone', 'memory', 'remember',
    'recall', 'forget', 'word', 'count', 'palindrome', 'anagram',
    'system', 'help', 'status', 'square', 'root', 'miles', 'kilometers',
    'fahrenheit', 'celsius', 'base64', 'morse', 'binary', 'rot13',
    'complementary', 'palette', 'contrast',
  ]

  // ── 3. QWERTY keyboard adjacency map ────────────────────────
  static readonly KEYBOARD_ADJACENCY: Record<string, string[]> = {
    q: ['w', 'a'],
    w: ['q', 'e', 'a', 's'],
    e: ['w', 'r', 's', 'd'],
    r: ['e', 't', 'd', 'f'],
    t: ['r', 'y', 'f', 'g'],
    y: ['t', 'u', 'g', 'h'],
    u: ['y', 'i', 'h', 'j'],
    i: ['u', 'o', 'j', 'k'],
    o: ['i', 'p', 'k', 'l'],
    p: ['o', 'l'],
    a: ['q', 'w', 's', 'z'],
    s: ['a', 'w', 'e', 'd', 'z', 'x'],
    d: ['s', 'e', 'r', 'f', 'x', 'c'],
    f: ['d', 'r', 't', 'g', 'c', 'v'],
    g: ['f', 't', 'y', 'h', 'v', 'b'],
    h: ['g', 'y', 'u', 'j', 'b', 'n'],
    j: ['h', 'u', 'i', 'k', 'n', 'm'],
    k: ['j', 'i', 'o', 'l', 'm'],
    l: ['k', 'o', 'p'],
    z: ['a', 's', 'x'],
    x: ['z', 's', 'd', 'c'],
    c: ['x', 'd', 'f', 'v'],
    v: ['c', 'f', 'g', 'b'],
    b: ['v', 'g', 'h', 'n'],
    n: ['b', 'h', 'j', 'm'],
    m: ['n', 'j', 'k'],
  }

  // ── 4. Levenshtein distance — rolling array O(min(m,n)) ────
  static levenshtein(a: string, b: string): number {
    // Ensure `a` is the shorter string for O(min(m,n)) space
    if (a.length > b.length) {
      const tmp = a
      a = b
      b = tmp
    }

    const m = a.length
    const n = b.length

    // Edge cases
    if (m === 0) return n
    if (n === 0) return m

    // Previous and current rows of the DP matrix
    let prev = new Array<number>(m + 1)
    let curr = new Array<number>(m + 1)

    // Initialize first row (transforming empty string → a[0..i])
    for (let i = 0; i <= m; i++) {
      prev[i] = i
    }

    // Fill DP row by row
    for (let j = 1; j <= n; j++) {
      curr[0] = j // Cost of deleting all chars from b[0..j]

      for (let i = 1; i <= m; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1
        curr[i] = Math.min(
          curr[i - 1] + 1,       // insertion
          prev[i] + 1,            // deletion
          prev[i - 1] + cost,     // substitution
        )
      }

      // Swap rows for next iteration
      const swap = prev
      prev = curr
      curr = swap
    }

    return prev[m]
  }

  // ── 5. Closest vocabulary match ─────────────────────────────
  static closestMatch(
    word: string,
    vocabulary: string[],
    maxDistance = 2,
  ): string | null {
    // Priority 1: Exact match
    if (vocabulary.includes(word)) {
      return word
    }

    // Priority 2: Known correction
    const knownCorrection = FuzzyMatcher.KNOWN_CORRECTIONS[word]
      ?? FuzzyMatcher.KNOWN_CORRECTIONS[word.toLowerCase()]
    if (knownCorrection !== undefined && vocabulary.includes(knownCorrection)) {
      return knownCorrection
    }

    // Priority 3: Levenshtein closest within maxDistance
    let bestWord: string | null = null
    let bestDist = maxDistance + 1

    for (const vocabWord of vocabulary) {
      const dist = FuzzyMatcher.levenshtein(word.toLowerCase(), vocabWord)
      if (dist < bestDist) {
        bestDist = dist
        bestWord = vocabWord
      }
    }

    if (bestDist <= maxDistance) {
      return bestWord
    }

    return null
  }

  // ── 6. Single-word typo correction pipeline ─────────────────
  static correctTypo(word: string): string {
    // Step 1: Check KNOWN_CORRECTIONS exact match
    const exactCorrection = FuzzyMatcher.KNOWN_CORRECTIONS[word]
    if (exactCorrection !== undefined) {
      return exactCorrection
    }

    // Step 2: Check lowercased KNOWN_CORRECTIONS
    const lowerWord = word.toLowerCase()
    const lowerCorrection = FuzzyMatcher.KNOWN_CORRECTIONS[lowerWord]
    if (lowerCorrection !== undefined) {
      return lowerCorrection
    }

    // Step 3: Keyboard adjacency single-swap correction
    // Try swapping each character with its adjacent keys on the QWERTY layout
    const chars = lowerWord.split('')
    for (let i = 0; i < chars.length; i++) {
      const adjacent = FuzzyMatcher.KEYBOARD_ADJACENCY[chars[i]]
      if (adjacent === undefined) continue

      for (const neighbor of adjacent) {
        const candidate = [...chars.slice(0, i), neighbor, ...chars.slice(i + 1)].join('')

        // Check if this candidate is in known corrections
        const adjKnownCorrection = FuzzyMatcher.KNOWN_CORRECTIONS[candidate]
        if (adjKnownCorrection !== undefined) {
          return adjKnownCorrection
        }

        // Check if this candidate is in core vocabulary
        if (FuzzyMatcher.CORE_VOCABULARY.includes(candidate)) {
          return candidate
        }
      }
    }

    // Step 4: Levenshtein against CORE_VOCABULARY (maxDistance 2)
    const closest = FuzzyMatcher.closestMatch(lowerWord, FuzzyMatcher.CORE_VOCABULARY, 2)
    if (closest !== null) {
      return closest
    }

    // Step 5: No confident match found — return original word
    return word
  }

  // ── 7. Sentence-level correction ────────────────────────────
  static correctSentence(tokens: string[]): {
    tokens: string[]
    corrections: Array<{ original: string; corrected: string }>
  } {
    const correctedTokens: string[] = []
    const corrections: Array<{ original: string; corrected: string }> = []

    for (const token of tokens) {
      const corrected = FuzzyMatcher.correctTypo(token)
      correctedTokens.push(corrected)

      if (corrected !== token) {
        corrections.push({ original: token, corrected })
      }
    }

    return { tokens: correctedTokens, corrections }
  }
}
