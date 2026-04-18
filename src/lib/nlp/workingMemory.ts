// ─────────────────────────────────────────────────────────────
// MACHINE MIND v5.0 — Working Memory
// Core reasoning primitive: typed result registers + pronoun resolution.
// Writes after every tool execution; resolves "that", "it", "this", etc.
// ─────────────────────────────────────────────────────────────

import type { ToolResult, WorkingMemoryRegisters, WMResolveResult } from '../types'

// ── Reference patterns for pronoun / demonstrative resolution ──
interface ReferencePattern {
  pattern: RegExp
  typeHint: string | null   // e.g. 'number', 'color', 'string', etc.
  label: string
}

const REFERENCE_PATTERNS: ReferencePattern[] = [
  // Type-hinted references
  { pattern: /\bthat number\b/i,                    typeHint: 'number',  label: 'that number' },
  { pattern: /\bthis number\b/i,                    typeHint: 'number',  label: 'this number' },
  { pattern: /\bthe number\b/i,                     typeHint: 'number',  label: 'the number' },
  { pattern: /\bthat string\b/i,                    typeHint: 'string',  label: 'that string' },
  { pattern: /\bthis string\b/i,                    typeHint: 'string',  label: 'this string' },
  { pattern: /\bthe string\b/i,                     typeHint: 'string',  label: 'the string' },
  { pattern: /\bthat color\b/i,                     typeHint: 'color',   label: 'that color' },
  { pattern: /\bthis color\b/i,                     typeHint: 'color',   label: 'this color' },
  { pattern: /\bthe color\b/i,                      typeHint: 'color',   label: 'the color' },
  { pattern: /\bthat list\b/i,                      typeHint: 'list',    label: 'that list' },
  { pattern: /\bthis list\b/i,                      typeHint: 'list',    label: 'this list' },
  { pattern: /\bthe list\b/i,                       typeHint: 'list',    label: 'the list' },
  { pattern: /\bthat json\b/i,                      typeHint: 'json',    label: 'that json' },
  { pattern: /\bthis json\b/i,                      typeHint: 'json',    label: 'this json' },
  { pattern: /\bthe json\b/i,                       typeHint: 'json',    label: 'the json' },
  { pattern: /\bthat hash\b/i,                      typeHint: 'hash',    label: 'that hash' },
  { pattern: /\bthis hash\b/i,                      typeHint: 'hash',    label: 'this hash' },
  { pattern: /\bthe hash\b/i,                       typeHint: 'hash',    label: 'the hash' },
  { pattern: /\bthat boolean\b/i,                   typeHint: 'bool',    label: 'that boolean' },
  { pattern: /\bthis boolean\b/i,                   typeHint: 'bool',    label: 'this boolean' },
  { pattern: /\bthe boolean\b/i,                    typeHint: 'bool',    label: 'the boolean' },
  { pattern: /\bthat diff\b/i,                      typeHint: 'diff',    label: 'that diff' },
  { pattern: /\bthis diff\b/i,                      typeHint: 'diff',    label: 'this diff' },
  { pattern: /\bthe diff\b/i,                       typeHint: 'diff',    label: 'the diff' },
  { pattern: /\bthat unit\b/i,                      typeHint: 'unit',    label: 'that unit' },
  { pattern: /\bthis unit\b/i,                      typeHint: 'unit',    label: 'this unit' },
  { pattern: /\bthe unit\b/i,                       typeHint: 'unit',    label: 'the unit' },
  { pattern: /\bthat encoded value\b/i,             typeHint: 'encoded', label: 'that encoded value' },
  { pattern: /\bthis encoded value\b/i,             typeHint: 'encoded', label: 'this encoded value' },
  { pattern: /\bthat encoding\b/i,                  typeHint: 'encoded', label: 'that encoding' },
  { pattern: /\bthis encoding\b/i,                  typeHint: 'encoded', label: 'this encoding' },
  { pattern: /\bthat random\b/i,                    typeHint: 'random',  label: 'that random' },
  { pattern: /\bthis random\b/i,                    typeHint: 'random',  label: 'this random' },

  // Bare pronouns / demonstratives (no type hint)
  { pattern: /\bthat result\b/i,                    typeHint: null,      label: 'that result' },
  { pattern: /\bthis result\b/i,                    typeHint: null,      label: 'this result' },
  { pattern: /\bthat value\b/i,                     typeHint: null,      label: 'that value' },
  { pattern: /\bthis value\b/i,                     typeHint: null,      label: 'this value' },
  { pattern: /\bthat\b/i,                           typeHint: null,      label: 'that' },
  { pattern: /\bthis\b/i,                           typeHint: null,      label: 'this' },
  { pattern: /\bit\b/i,                             typeHint: null,      label: 'it' },
  { pattern: /\bthe result\b/i,                     typeHint: null,      label: 'the result' },
  { pattern: /\bthe value\b/i,                      typeHint: null,      label: 'the value' },
  { pattern: /\bthe previous\b/i,                   typeHint: null,      label: 'the previous' },
  { pattern: /\bthe output\b/i,                     typeHint: null,      label: 'the output' },
  { pattern: /\bthe answer\b/i,                     typeHint: null,      label: 'the answer' },
]

// ── Map type hint to register accessor keys ──────────────────
const TYPED_REFERENCE_MAP: Record<string, keyof WorkingMemoryRegisters> = {
  number:  'lastNumber',
  string:  'lastString',
  color:   'lastColor',
  json:    'lastJSON',
  list:    'lastList',
  bool:    'lastBool',
  diff:    'lastDiff',
  unit:    'lastUnit',
  encoded: 'lastEncoded',
  hash:    'lastHash',
  random:  'lastRandom',
}

// ── Map tool name prefix to register ─────────────────────────
const TOOL_REGISTER_MAP: Record<string, keyof WorkingMemoryRegisters> = {
  calculator: 'lastNumber',
  math:       'lastNumber',
  convert:    'lastUnit',
  encoder:    'lastEncoded',
  hash:       'lastHash',
  color:      'lastColor',
  random:     'lastRandom',
  regex:      'lastString',
  word:       'lastString',
  json:       'lastJSON',
  memory:     'lastString',
  clock:      'lastString',
}

// ── Fallback resolution order when no type hint ──────────────
const FALLBACK_ORDER: Array<keyof WorkingMemoryRegisters> = [
  'lastNumber',
  'lastString',
  'lastColor',
  'lastJSON',
  'lastList',
  'lastBool',
  'lastDiff',
  'lastUnit',
  'lastEncoded',
  'lastHash',
  'lastRandom',
]

// ── Empty register factory ───────────────────────────────────
function emptyRegisters(): WorkingMemoryRegisters {
  return {
    lastNumber:  null,
    lastString:  null,
    lastColor:   null,
    lastJSON:    null,
    lastList:    null,
    lastBool:    null,
    lastDiff:    null,
    lastUnit:    null,
    lastEncoded: null,
    lastHash:    null,
    lastRandom:  null,
    recentTool:  null,
    recentTopic: null,
  }
}

// ── Color helpers ────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h
  const num = parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function tryExtractColor(value: unknown): { hex: string; rgb: [number, number, number]; hsl: [number, number, number] } | null {
  if (typeof value === 'string') {
    // Hex color
    const hexMatch = value.match(/^#?([0-9a-fA-F]{3,8})$/)
    if (hexMatch) {
      const hex = hexMatch[1].length <= 4 ? `#${hexMatch[1]}` : `#${hexMatch[1]}`
      const rgb = hexToRgb(hex.startsWith('#') ? hex : `#${hex}`)
      const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2])
      return { hex: hex.startsWith('#') ? hex : `#${hex}`, rgb, hsl }
    }
    // rgb() color
    const rgbMatch = value.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10)
      const g = parseInt(rgbMatch[2], 10)
      const b = parseInt(rgbMatch[3], 10)
      const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
      const hsl = rgbToHsl(r, g, b)
      return { hex, rgb: [r, g, b], hsl }
    }
  }
  return null
}

function tryExtractNumber(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = parseFloat(value)
    if (!isNaN(n)) return n
  }
  return null
}

function tryExtractString(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (value !== null && value !== undefined) return String(value)
  return null
}

function tryExtractBool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    if (lower === 'true' || lower === 'yes' || lower === '1') return true
    if (lower === 'false' || lower === 'no' || lower === '0') return false
  }
  return null
}

function jsonDepth(obj: unknown, current: number = 0): number {
  if (obj === null || typeof obj !== 'object') return current
  let maxDepth = current
  if (Array.isArray(obj)) {
    for (const item of obj) {
      maxDepth = Math.max(maxDepth, jsonDepth(item, current + 1))
    }
  } else {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      maxDepth = Math.max(maxDepth, jsonDepth(val, current + 1))
    }
  }
  return maxDepth
}

// ─────────────────────────────────────────────────────────────
// WorkingMemory class
// ─────────────────────────────────────────────────────────────

export class WorkingMemory {
  private registers: WorkingMemoryRegisters = emptyRegisters()
  private turn: number = 0
  private history: StateTransitionLike[] = []

  // ── Write: update registers after a tool execution ──────────
  write(toolName: string, result: ToolResult, topic?: string): void {
    this.turn++
    const t = this.turn

    // Update recent tool/topic
    this.registers.recentTool = toolName
    if (topic) this.registers.recentTopic = topic

    const raw = result.raw
    const val = result.result

    // Try number
    const num = tryExtractNumber(val)
    if (num !== null) {
      this.registers.lastNumber = { value: num, expression: raw, tool: toolName, turn: t }
    }

    // Try color
    const color = tryExtractColor(val)
    if (color) {
      this.registers.lastColor = { hex: color.hex, rgb: color.rgb, hsl: color.hsl, turn: t }
    }

    // Try boolean
    const bool = tryExtractBool(val)
    if (bool !== null) {
      this.registers.lastBool = { value: bool, expression: raw, turn: t }
    }

    // Try string (always set for non-null results)
    const str = tryExtractString(val)
    if (str !== null && str.length > 0) {
      this.registers.lastString = { value: str, source: raw, tool: toolName, turn: t }
    }

    // Try JSON (object/array results)
    if (typeof val === 'object' && val !== null) {
      const rawStr = typeof raw === 'string' ? raw : JSON.stringify(val)
      this.registers.lastJSON = { value: val, raw: rawStr, depth: jsonDepth(val), turn: t }

      // If it's an array of strings, store as lastList
      if (Array.isArray(val)) {
        const items = val.map(item => String(item))
        this.registers.lastList = { items, source: rawStr, turn: t }
      }
    }

    // Tool-specific register writes
    const toolLower = toolName.toLowerCase()

    // Calculator / math → lastNumber
    if (toolLower.includes('calc') || toolLower.includes('math')) {
      if (num !== null) {
        this.registers.lastNumber = { value: num, expression: raw, tool: toolName, turn: t }
      }
    }

    // Converter → lastUnit
    if (toolLower.includes('convert')) {
      if (num !== null && typeof val === 'object' && val !== null) {
        const obj = val as Record<string, unknown>
        this.registers.lastUnit = {
          value: num,
          unit: typeof obj.from === 'string' ? obj.from : '',
          converted: typeof obj.to === 'number' ? obj.to : num,
          toUnit: typeof obj.toUnit === 'string' ? obj.toUnit : '',
          turn: t,
        }
      }
    }

    // Encoder → lastEncoded
    if (toolLower.includes('encod')) {
      const original = typeof val === 'object' && val !== null && typeof (val as Record<string, unknown>).original === 'string'
        ? (val as Record<string, unknown>).original as string
        : ''
      this.registers.lastEncoded = {
        value: str ?? '',
        encoding: toolLower.includes('base64') ? 'base64'
                : toolLower.includes('url') ? 'url'
                : toolLower.includes('html') ? 'html'
                : toolLower.includes('hex') ? 'hex'
                : 'unknown',
        original,
        turn: t,
      }
    }

    // Hash → lastHash
    if (toolLower.includes('hash')) {
      this.registers.lastHash = {
        value: str ?? '',
        algorithm: toolLower.includes('md5') ? 'md5'
                 : toolLower.includes('sha1') ? 'sha1'
                 : toolLower.includes('sha256') ? 'sha256'
                 : toolLower.includes('sha512') ? 'sha512'
                 : 'unknown',
        input: typeof val === 'object' && val !== null && typeof (val as Record<string, unknown>).input === 'string'
          ? (val as Record<string, unknown>).input as string
          : raw,
        turn: t,
      }
    }

    // Random → lastRandom
    if (toolLower.includes('random') || toolLower.includes('dice') || toolLower.includes('coin') || toolLower.includes('pick')) {
      this.registers.lastRandom = {
        value: val,
        type: toolLower.includes('dice') ? 'dice'
            : toolLower.includes('coin') ? 'coin'
            : toolLower.includes('pick') ? 'pick'
            : toolLower.includes('uuid') ? 'uuid'
            : toolLower.includes('password') ? 'password'
            : 'random',
        turn: t,
      }
    }

    // Diff → lastDiff
    if (toolLower.includes('diff')) {
      if (typeof val === 'object' && val !== null) {
        const obj = val as Record<string, unknown>
        this.registers.lastDiff = {
          original: typeof obj.original === 'string' ? obj.original : '',
          modified: typeof obj.modified === 'string' ? obj.modified : '',
          type: obj.mode === 'char' ? 'char' : obj.mode === 'word' ? 'word' : 'json',
          turn: t,
        }
      }
    }
  }

  // ── Resolve: find the referent of a pronoun/demonstrative ──
  resolve(input: string): WMResolveResult | null {
    for (const ref of REFERENCE_PATTERNS) {
      ref.pattern.lastIndex = 0
      if (!ref.pattern.test(input)) continue

      // Type-hinted resolution
      if (ref.typeHint !== null) {
        const registerKey = TYPED_REFERENCE_MAP[ref.typeHint]
        if (registerKey) {
          const regVal = this.registers[registerKey]
          if (regVal !== null) {
            return {
              resolved: String(this.extractRegisterValue(regVal)),
              register: registerKey,
              value: regVal,
            }
          }
        }
      }

      // Recent-tool-guided resolution
      if (this.registers.recentTool) {
        const toolKey = this.findRegisterByTool(this.registers.recentTool)
        if (toolKey) {
          const regVal = this.registers[toolKey]
          if (regVal !== null) {
            return {
              resolved: String(this.extractRegisterValue(regVal)),
              register: toolKey,
              value: regVal,
            }
          }
        }
      }

      // Fallback resolution order
      for (const key of FALLBACK_ORDER) {
        const regVal = this.registers[key]
        if (regVal !== null) {
          return {
            resolved: String(this.extractRegisterValue(regVal)),
            register: key,
            value: regVal,
          }
        }
      }
    }

    return null
  }

  // ── Get a specific register ─────────────────────────────────
  get<K extends keyof WorkingMemoryRegisters>(key: K): WorkingMemoryRegisters[K] {
    return this.registers[key]
  }

  // ── Get all registers (read-only copy) ──────────────────────
  getAll(): Readonly<WorkingMemoryRegisters> {
    return { ...this.registers }
  }

  // ── Serialize for persistence ───────────────────────────────
  serialize(): string {
    return JSON.stringify({ registers: this.registers, turn: this.turn })
  }

  // ── Restore from serialized state ───────────────────────────
  restore(serialized: string): void {
    try {
      const parsed = JSON.parse(serialized) as { registers: WorkingMemoryRegisters; turn: number }
      if (parsed.registers && typeof parsed.turn === 'number') {
        this.registers = parsed.registers
        this.turn = parsed.turn
      }
    } catch {
      // Invalid serialized state — keep current state
    }
  }

  // ── Clear all registers ─────────────────────────────────────
  clear(): void {
    this.registers = emptyRegisters()
    this.turn = 0
    this.history = []
  }

  // ── Get current turn count ──────────────────────────────────
  getTurn(): number {
    return this.turn
  }

  // ── Private helpers ─────────────────────────────────────────

  private findRegisterByTool(toolName: string): keyof WorkingMemoryRegisters | null {
    const lower = toolName.toLowerCase()
    for (const [prefix, regKey] of Object.entries(TOOL_REGISTER_MAP)) {
      if (lower.includes(prefix)) return regKey
    }
    return null
  }

  private extractRegisterValue(reg: WorkingMemoryRegisters[keyof WorkingMemoryRegisters]): unknown {
    if (reg === null) return null
    if (typeof reg === 'string') return reg
    if (typeof reg === 'object' && reg !== null) {
      const obj = reg as Record<string, unknown>
      if ('value' in obj) return obj.value
      if ('hex' in obj) return obj.hex
      if ('items' in obj) return obj.items
    }
    return reg
  }
}

// ── Internal type for transition history ──────────────────────
interface StateTransitionLike {
  from: string
  to: string
  trigger: string
  turn: number
}
