// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Memory Tool
// In-memory session storage (Map) + sessionStorage sync.
// Natural-language parsing for store / recall / forget / list / clear.
// ─────────────────────────────────────────────────────────────

import type { ToolResult } from '../types'

// ── MemoryStore class ────────────────────────────────────────
export class MemoryStore {
  private entries = new Map<string, { key: string; value: string }>()

  constructor() {
    this.loadFromSession()
  }

  /** Load persisted entries from sessionStorage on construction */
  private loadFromSession(): void {
    try {
      if (typeof sessionStorage === 'undefined') return
      const raw = sessionStorage.getItem('machine_mind_memory')
      if (!raw) return
      const items: Array<{ key: string; value: string }> = JSON.parse(raw)
      for (const item of items) {
        this.entries.set(item.key, item)
      }
    } catch {
      // sessionStorage not available or corrupted — start fresh
    }
  }

  /** Sync current Map state to sessionStorage */
  private syncToSession(): void {
    try {
      if (typeof sessionStorage === 'undefined') return
      const items = Array.from(this.entries.values())
      sessionStorage.setItem('machine_mind_memory', JSON.stringify(items))
    } catch {
      // Ignore sessionStorage errors
    }
  }

  /** Store a key-value pair. Saves to Map and sessionStorage. */
  store(key: string, value: string): void {
    this.entries.set(key, { key, value })
    this.syncToSession()
  }

  /** Recall a value by key. Returns null if not found. */
  recall(key: string): string | null {
    const entry = this.entries.get(key)
    return entry ? entry.value : null
  }

  /** Delete a key from both Map and sessionStorage. Returns true if key existed. */
  forget(key: string): boolean {
    const existed = this.entries.has(key)
    if (existed) {
      this.entries.delete(key)
      this.syncToSession()
    }
    return existed
  }

  /** List all stored variables. */
  list(): Array<{ key: string; value: string }> {
    return Array.from(this.entries.values())
  }

  /** Clear all stored variables. */
  clear(): void {
    this.entries.clear()
    this.syncToSession()
  }

  /** Search values for a substring (case-insensitive) and return the matching entry. */
  recallByValue(search: string): { key: string; value: string } | null {
    const lower = search.toLowerCase()
    for (const entry of this.entries.values()) {
      if (entry.value.toLowerCase().includes(lower)) {
        return entry
      }
    }
    return null
  }

  /** Number of stored entries */
  get count(): number {
    return this.entries.size
  }
}

// ── Singleton instance ───────────────────────────────────────
export const memoryStore = new MemoryStore()

// ── Input parsing ────────────────────────────────────────────
type MemoryAction = 'store' | 'recall' | 'recall_value' | 'forget' | 'list' | 'clear'

interface ParsedMemoryInput {
  action: MemoryAction
  key?: string
  value?: string
}

function parseInput(input: string): ParsedMemoryInput {
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()

  // ── Bang-prefix shortcuts ──────────────────────────────────
  // "!remember x as y" → store(y, x) — NOTE: reversed from natural form
  const bangStoreMatch = trimmed.match(/^!remember\s+(.+?)\s+as\s+(\S+)/i)
  if (bangStoreMatch) {
    return { action: 'store', value: bangStoreMatch[1].trim(), key: bangStoreMatch[2] }
  }

  // "!recall x"
  const bangRecallMatch = trimmed.match(/^!recall\s+(\S+)/i)
  if (bangRecallMatch) {
    return { action: 'recall', key: bangRecallMatch[1] }
  }

  // "!forget x"
  const bangForgetMatch = trimmed.match(/^!forget\s+(\S+)/i)
  if (bangForgetMatch) {
    return { action: 'forget', key: bangForgetMatch[1] }
  }

  // ── Natural language patterns ──────────────────────────────

  // "clear memory" / "clear all" / "clear"
  if (/^clear(\s+(memory|all))?$/.test(lower)) {
    return { action: 'clear' }
  }

  // "what do you remember" / "list memory" / "show memory" / "memory list"
  if (/^(what do you remember|list memory|show memory|memory list|show me what you remember)$/i.test(lower)) {
    return { action: 'list' }
  }

  // "remember Paris as my_city"
  const storeAsMatch = trimmed.match(/remember\s+(.+?)\s+as\s+(\w+)/i)
  if (storeAsMatch) {
    return { action: 'store', value: storeAsMatch[1].trim(), key: storeAsMatch[2] }
  }

  // "remember that my_city is Paris"
  const storeIsMatch = trimmed.match(/remember\s+(?:that\s+)?(\w+)\s+(?:is|=)\s+(.+)/i)
  if (storeIsMatch) {
    return { action: 'store', key: storeIsMatch[1], value: storeIsMatch[2].trim() }
  }

  // "forget my_city"
  const forgetMatch = lower.match(/^forget\s+(\w+)/)
  if (forgetMatch) {
    return { action: 'forget', key: forgetMatch[1] }
  }

  // "recall my_city" / "what is my_city" / "what's my_city"
  const recallMatch = lower.match(/^(?:recall|what is|what's)\s+(\w+)/)
  if (recallMatch) {
    return { action: 'recall', key: recallMatch[1] }
  }

  // "what did I call my city" — search values for "city" and return matching key
  const valueSearch = lower.match(/what did i call\s+(.+)/)
  if (valueSearch) {
    return { action: 'recall_value', value: valueSearch[1].trim() }
  }

  // Default: list
  return { action: 'list' }
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const parsed = parseInput(input)

    switch (parsed.action) {
      case 'store': {
        if (!parsed.key || !parsed.value) throw new Error('Missing key or value for store')
        memoryStore.store(parsed.key, parsed.value)
        const execMs = Date.now() - t0
        const raw = `Stored: ${parsed.key} = ${parsed.value}`
        return { status: 'ok', result: { key: parsed.key, value: parsed.value }, displayType: 'text', raw, execMs }
      }

      case 'recall': {
        if (!parsed.key) throw new Error('Missing key for recall')
        const value = memoryStore.recall(parsed.key)
        if (value === null) {
          const execMs = Date.now() - t0
          const msg = `No memory found for key: "${parsed.key}"`
          return { status: 'error', result: { error: msg }, displayType: 'error', raw: msg, execMs }
        }
        const execMs = Date.now() - t0
        const raw = `${parsed.key} = ${value}`
        return { status: 'ok', result: { key: parsed.key, value }, displayType: 'text', raw, execMs }
      }

      case 'recall_value': {
        if (!parsed.value) throw new Error('Missing value for search')
        const entry = memoryStore.recallByValue(parsed.value)
        if (!entry) {
          const execMs = Date.now() - t0
          const msg = `No memory found matching: "${parsed.value}"`
          return { status: 'error', result: { error: msg }, displayType: 'error', raw: msg, execMs }
        }
        const execMs = Date.now() - t0
        const raw = `${entry.key} = ${entry.value}`
        return { status: 'ok', result: entry, displayType: 'text', raw, execMs }
      }

      case 'forget': {
        if (!parsed.key) throw new Error('Missing key for forget')
        const deleted = memoryStore.forget(parsed.key)
        const execMs = Date.now() - t0
        const raw = deleted ? `Forgot: ${parsed.key}` : `Key not found: "${parsed.key}"`
        return { status: 'ok', result: { key: parsed.key, deleted }, displayType: 'text', raw, execMs }
      }

      case 'clear': {
        memoryStore.clear()
        const execMs = Date.now() - t0
        const raw = 'Memory cleared'
        return { status: 'ok', result: { cleared: true }, displayType: 'text', raw, execMs }
      }

      case 'list': {
        const entries = memoryStore.list()
        const execMs = Date.now() - t0
        if (entries.length === 0) {
          const raw = 'Memory is empty'
          return { status: 'ok', result: [], displayType: 'text', raw, execMs }
        }
        const raw = entries.map(e => `${e.key} = ${e.value}`).join('\n')
        return { status: 'ok', result: entries, displayType: 'table', raw, execMs }
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
