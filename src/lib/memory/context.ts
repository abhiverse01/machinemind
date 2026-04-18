import { Role, ContextEntry } from '../types'

// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Context Memory Module
// Manages short-term conversation context, entity tracking,
// pronoun resolution, session variables, and context flags.
// ─────────────────────────────────────────────────────────────

const MAX_SHORT_TERM = 24          // 12 exchanges × 2 entries
const MAX_ENTITY_STACK = 5

// Pronouns we know how to resolve
const PRONOUN_IT = new Set(['it', 'its'])
const PRONOUN_THEY = new Set(['they', 'them', 'their', 'theirs'])
const PRONOUN_HE = new Set(['he', 'him', 'his'])
const PRONOUN_SHE = new Set(['she', 'her', 'hers'])
const PRONOUN_THIS_THAT = new Set(['this', 'that', 'these', 'those'])

// Follow-up detection patterns (case-insensitive)
const FOLLOW_UP_PATTERNS: RegExp[] = [
  /\btell me more\b/i,
  /\band\s*\??$/i,
  /\bwhy\s*\??$/i,
  /\bgo on\b/i,
  /\bexpand\b/i,
  /\belaborate\b/i,
  /\bmore about (that|it|this)\b/i,
  /\bwhat about (that|it|this)\b/i,
  /\bdetails please\b/i,
  /\bcontinue\b/i,
  /\bkeep going\b/i,
  /\bmore\b\s*\??$/i,
  /\bfurther\b/i,
  /\bcan you explain\b/i,
  /\bwhat else\b/i,
  /\band then\b/i,
  /\bsay more\b/i,
  /^more$/i,
  /^and$/i,
]

export class ContextMemory {
  private shortTerm: ContextEntry[] = []
  private sessionVars: Map<string, string> = new Map()
  private entityStack: string[] = []          // last 5 named entities (FIFO)
  private contextFlags: Set<string> = new Set()
  turnCount = 0

  // ── Core push ──────────────────────────────────────────────

  push(role: Role, content: string, meta?: Record<string, unknown>): void {
    // Add entry to short-term memory
    this.shortTerm.push({
      role,
      content,
      meta: meta ?? {},
    })

    // Trim to last 12 exchanges (24 entries max)
    if (this.shortTerm.length > MAX_SHORT_TERM) {
      this.shortTerm = this.shortTerm.slice(-MAX_SHORT_TERM)
    }

    // Extract entities and push to stack
    const entities = this.extractEntities(content)
    for (const entity of entities) {
      this.pushEntity(entity)
    }

    // Increment turn count on every push
    this.turnCount++
  }

  // ── Entity extraction ──────────────────────────────────────

  private extractEntities(content: string): string[] {
    const entities: string[] = []
    const seen = new Set<string>()

    // 1. Quoted terms — "some term" or 'some term'
    const quotedRegex = /["']([^"']+)["']/g
    let match: RegExpExecArray | null
    while ((match = quotedRegex.exec(content)) !== null) {
      const term = match[1].trim()
      if (term.length > 0 && !seen.has(term.toLowerCase())) {
        seen.add(term.toLowerCase())
        entities.push(term)
      }
    }

    // 2. Capitalized words not at the start of a sentence
    //    Match words that begin with uppercase but are NOT the first word
    //    after sentence-ending punctuation or the very start of the string.
    //    Also skip common false positives like "I", "The", "A", etc.
    const commonFalsePositives = new Set([
      'I', 'The', 'A', 'An', 'And', 'But', 'Or', 'So', 'If', 'It',
      'He', 'She', 'We', 'They', 'My', 'Your', 'His', 'Her', 'Our',
      'This', 'That', 'These', 'Those', 'What', 'Which', 'Who',
      'How', 'When', 'Where', 'Why', 'Is', 'Are', 'Was', 'Were',
      'Do', 'Does', 'Did', 'Has', 'Have', 'Had', 'Can', 'Could',
      'Will', 'Would', 'Should', 'May', 'Might', 'Must', 'Shall',
      'Not', 'No', 'Yes', 'Please', 'Thank', 'Thanks', 'Just',
      'There', 'Here', 'Also', 'Then', 'Now', 'Very', 'Really',
      'Still', 'Even', 'Only', 'About', 'Into', 'Over', 'After',
      'Before', 'Between', 'Through', 'During', 'Without', 'Within',
      'Each', 'Every', 'All', 'Some', 'Any', 'Many', 'Much',
      'More', 'Most', 'Such', 'Other', 'Both', 'Few', 'Same',
    ])

    // Split content into sentences to identify first-word positions
    const sentences = content.split(/(?<=[.!?])\s+/)
    const firstWords = new Set<string>()

    for (const sentence of sentences) {
      const firstWord = sentence.trim().split(/\s+/)[0]
      if (firstWord) {
        firstWords.add(firstWord)
      }
    }

    // Find all capitalized words that are proper nouns
    const capitalizedRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
    while ((match = capitalizedRegex.exec(content)) !== null) {
      const word = match[1]
      // Skip if it's the first word of a sentence
      if (firstWords.has(word)) continue
      // Skip common false positives
      if (commonFalsePositives.has(word)) continue
      // Skip single-letter matches
      if (word.length < 2) continue
      // Skip if already captured (case-insensitive)
      if (seen.has(word.toLowerCase())) continue

      seen.add(word.toLowerCase())
      entities.push(word)
    }

    // 3. Multi-word proper nouns (consecutive capitalized words)
    //    e.g. "New York", "Machine Mind"
    const multiCapRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g
    while ((match = multiCapRegex.exec(content)) !== null) {
      const phrase = match[1]
      if (seen.has(phrase.toLowerCase())) continue
      if (commonFalsePositives.has(phrase.split(/\s+/)[0])) continue

      seen.add(phrase.toLowerCase())
      entities.push(phrase)
    }

    return entities
  }

  // ── Entity stack management (FIFO, cap at 5) ──────────────

  private pushEntity(entity: string): void {
    // Remove if already exists (re-push to top)
    const idx = this.entityStack.findIndex(
      (e) => e.toLowerCase() === entity.toLowerCase()
    )
    if (idx !== -1) {
      this.entityStack.splice(idx, 1)
    }

    // Push to front
    this.entityStack.unshift(entity)

    // Trim to max size (FIFO — oldest at the end get dropped)
    if (this.entityStack.length > MAX_ENTITY_STACK) {
      this.entityStack = this.entityStack.slice(0, MAX_ENTITY_STACK)
    }
  }

  // ── Pronoun resolution ─────────────────────────────────────

  resolvePronoun(token: string): string {
    const lower = token.toLowerCase()

    // "it" / "its" → most recent entity
    if (PRONOUN_IT.has(lower)) {
      if (this.entityStack.length > 0) {
        return this.entityStack[0]
      }
      return token
    }

    // "they" / "them" / "their" / "theirs" → last plural entity
    if (PRONOUN_THEY.has(lower)) {
      const plural = this.entityStack.find((e) => e.endsWith('s'))
      if (plural) return plural
      // Fallback: most recent entity if none is plural
      if (this.entityStack.length > 0) {
        return this.entityStack[0]
      }
      return token
    }

    // "he" / "him" / "his" → last person entity (capitalized name)
    if (PRONOUN_HE.has(lower)) {
      const person = this.entityStack.find((e) =>
        /^[A-Z][a-z]+$/.test(e)
      )
      if (person) return person
      if (this.entityStack.length > 0) {
        return this.entityStack[0]
      }
      return token
    }

    // "she" / "her" / "hers" → last person entity (capitalized name)
    if (PRONOUN_SHE.has(lower)) {
      const person = this.entityStack.find((e) =>
        /^[A-Z][a-z]+$/.test(e)
      )
      if (person) return person
      if (this.entityStack.length > 0) {
        return this.entityStack[0]
      }
      return token
    }

    // "this" / "that" / "these" / "those" → most recent entity
    if (PRONOUN_THIS_THAT.has(lower)) {
      if (this.entityStack.length > 0) {
        return this.entityStack[0]
      }
      return token
    }

    // Not a known pronoun — return as-is
    return token
  }

  // ── Follow-up detection ────────────────────────────────────

  isFollowUp(input: string): boolean {
    const trimmed = input.trim()
    for (const pattern of FOLLOW_UP_PATTERNS) {
      if (pattern.test(trimmed)) return true
    }
    return false
  }

  // ── Expand last topic ──────────────────────────────────────

  expandLastTopic(): string {
    // Walk backwards to find the last assistant response
    for (let i = this.shortTerm.length - 1; i >= 0; i--) {
      if (this.shortTerm[i].role === 'assistant') {
        return this.shortTerm[i].content
      }
    }
    return ''
  }

  // ── Context flags ──────────────────────────────────────────

  setFlag(flag: string): void {
    this.contextFlags.add(flag)
  }

  hasFlag(flag: string): boolean {
    return this.contextFlags.has(flag)
  }

  getFlags(): Set<string> {
    return this.contextFlags
  }

  // ── Session variables ──────────────────────────────────────

  setSessionVar(key: string, value: string): void {
    this.sessionVars.set(key, value)
  }

  getSessionVar(key: string): string | undefined {
    return this.sessionVars.get(key)
  }

  getAllSessionVars(): Map<string, string> {
    return this.sessionVars
  }

  // ── Summarize for AI relay system prompt ───────────────────

  summarize(): string {
    // Build exchange summaries from last 3 exchanges (6 entries)
    const last6 = this.shortTerm.slice(-6)
    const exchangeSummaries: string[] = []

    for (let i = 0; i < last6.length; i += 2) {
      const userEntry = last6[i]
      const assistantEntry = last6[i + 1]

      if (userEntry) {
        const userSnippet = this.truncate(userEntry.content, 60)
        if (assistantEntry) {
          const asstSnippet = this.truncate(assistantEntry.content, 60)
          exchangeSummaries.push(`U: ${userSnippet} | A: ${asstSnippet}`)
        } else {
          exchangeSummaries.push(`U: ${userSnippet}`)
        }
      }
    }

    const contextStr =
      exchangeSummaries.length > 0
        ? exchangeSummaries.join('; ')
        : 'none'

    const varKeys =
      this.sessionVars.size > 0
        ? [...this.sessionVars.keys()].join(', ')
        : 'none'

    const entitiesStr =
      this.entityStack.length > 0
        ? this.entityStack.join(', ')
        : 'none'

    const flagsStr =
      this.contextFlags.size > 0
        ? [...this.contextFlags].join(', ')
        : 'none'

    return `Prior context: ${contextStr}. Stored vars: {${varKeys}}. Entities: [${entitiesStr}]. Flags: [${flagsStr}].`
  }

  private truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen - 1) + '…'
  }

  // ── Access helpers ─────────────────────────────────────────

  getLastEntries(count: number): ContextEntry[] {
    return this.shortTerm.slice(-count)
  }

  // ── Reset ──────────────────────────────────────────────────

  clear(): void {
    this.shortTerm = []
    this.sessionVars.clear()
    this.entityStack = []
    this.contextFlags.clear()
    this.turnCount = 0
  }

  // ── Serialization for sessionStorage persistence ───────────

  serialize(): string {
    return JSON.stringify({
      shortTerm: this.shortTerm,
      sessionVars: [...this.sessionVars.entries()],
      entityStack: this.entityStack,
      contextFlags: [...this.contextFlags],
      turnCount: this.turnCount,
    })
  }

  restore(json: string): void {
    try {
      const data = JSON.parse(json)
      this.shortTerm = Array.isArray(data.shortTerm) ? data.shortTerm : []
      this.sessionVars = Array.isArray(data.sessionVars)
        ? new Map(data.sessionVars)
        : new Map()
      this.entityStack = Array.isArray(data.entityStack)
        ? data.entityStack
        : []
      this.contextFlags = Array.isArray(data.contextFlags)
        ? new Set(data.contextFlags)
        : new Set()
      this.turnCount =
        typeof data.turnCount === 'number' ? data.turnCount : 0
    } catch {
      // Corrupted data — start fresh
      this.clear()
    }
  }
}

/** Singleton instance for app-wide use */
export const contextMemory = new ContextMemory()
