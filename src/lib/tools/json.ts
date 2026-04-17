// ─────────────────────────────────────────────────────────────
// MACHINE MIND — JSON Tool
// Parse, validate, pretty-print, minify, dot-path extraction,
// key listing.
// ─────────────────────────────────────────────────────────────

import type { ToolResult } from '../types'

// ── Parse with helpful error reporting ───────────────────────
interface ParseResult {
  valid: boolean
  parsed: unknown
  error?: string
  line?: number
  column?: number
}

function parseJSON(input: string): ParseResult {
  try {
    const parsed = JSON.parse(input)
    return { valid: true, parsed }
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      // Try to extract position from error message
      // V8 format: "Unexpected token ... at position 5"
      // SpiderMonkey format: "JSON.parse: expected ',' or '}' after property value ... at line 3 column 5"
      let line: number | undefined
      let column: number | undefined

      const posMatch = err.message.match(/position\s+(\d+)/i)
      if (posMatch) {
        const pos = parseInt(posMatch[1])
        const before = input.slice(0, pos)
        line = (before.match(/\n/g) ?? []).length + 1
        column = pos - before.lastIndexOf('\n')
      }

      const lineColMatch = err.message.match(/line\s+(\d+)\s+column\s+(\d+)/i)
      if (lineColMatch && line === undefined) {
        line = parseInt(lineColMatch[1])
        column = parseInt(lineColMatch[2])
      }

      return { valid: false, parsed: null, error: err.message, line, column }
    }
    return { valid: false, parsed: null, error: String(err) }
  }
}

// ── Dot-path extraction ──────────────────────────────────────
// Handles paths like "users[0].name", "data.items[2].value"
function extractPath(obj: unknown, path: string): unknown {
  // Split "users[0].name" into ["users", "[0]", "name"]
  const segments: string[] = []
  let current = ''
  for (let i = 0; i < path.length; i++) {
    const ch = path[i]
    if (ch === '.') {
      if (current) segments.push(current)
      current = ''
      continue
    }
    if (ch === '[') {
      if (current) segments.push(current)
      current = '['
      continue
    }
    if (ch === ']') {
      current += ']'
      segments.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current) segments.push(current)

  // Traverse each segment
  let value: unknown = obj
  for (const segment of segments) {
    if (value === null || value === undefined) {
      throw new Error(`Cannot access "${segment}" on ${value === null ? 'null' : 'undefined'}`)
    }

    // Bracket notation: "[0]"
    const bracketMatch = segment.match(/^\[(\d+)\]$/)
    if (bracketMatch) {
      const idx = parseInt(bracketMatch[1])
      if (Array.isArray(value)) {
        if (idx < 0 || idx >= value.length) {
          throw new Error(`Index out of bounds: [${idx}] (array length: ${value.length})`)
        }
        value = value[idx]
      } else {
        throw new Error(`Cannot use bracket index [${idx}] on non-array value`)
      }
      continue
    }

    // Dot notation: "name"
    if (typeof value === 'object' && !Array.isArray(value)) {
      value = (value as Record<string, unknown>)[segment]
    } else if (Array.isArray(value)) {
      // If segment is a number string on an array, try index
      const idx = parseInt(segment)
      if (!isNaN(idx) && idx >= 0 && idx < value.length) {
        value = value[idx]
      } else {
        throw new Error(`Cannot access property "${segment}" on array`)
      }
    } else {
      throw new Error(`Cannot access "${segment}" on ${typeof value}`)
    }
  }

  return value
}

// ── Key listing ──────────────────────────────────────────────
// Lists all keys at each level with dot-path notation
function listKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || obj === undefined || typeof obj !== 'object') return []

  const keys: string[] = []

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      const path = prefix ? `${prefix}[${i}]` : `[${i}]`
      keys.push(path)
      keys.push(...listKeys(item, path))
    })
  } else {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${k}` : k
      keys.push(path)
      keys.push(...listKeys(v, path))
    }
  }

  return keys
}

// ── Input parsing ────────────────────────────────────────────
type JsonAction = 'parse' | 'format' | 'minify' | 'validate' | 'extract' | 'keys'

interface ParsedJsonInput {
  action: JsonAction
  json: string
  path?: string
}

function parseInput(input: string): ParsedJsonInput {
  const trimmed = input.trim()

  // "json parse {...}" / "json format {...}" / "json minify {...}"
  // "json validate {...}" / "json keys {...}" / "json get path {...}"
  const cmdMatch = trimmed.match(
    /^json\s+(parse|format|pretty|pretty-print|minify|validate|extract|get|keys)\s+([\s\S]*)$/i
  )
  if (cmdMatch) {
    let action = cmdMatch[1].toLowerCase()
    if (action === 'pretty' || action === 'pretty-print') action = 'format'
    if (action === 'get') action = 'extract'

    const rest = cmdMatch[2].trim()

    if (action === 'extract') {
      // "json get users[0].name {...}" or "json extract users[0].name {...}"
      const pathMatch = rest.match(/^([\w.[\]]+)\s+([\s\S]*)$/)
      if (pathMatch) {
        return { action: 'extract', json: pathMatch[2].trim(), path: pathMatch[1] }
      }
      throw new Error('Need a path for extraction. Use: "json get path.to.key {...}"')
    }

    return { action: action as JsonAction, json: rest }
  }

  // Standalone commands without "json" prefix
  // "format {...}" / "minify {...}" / "validate {...}" / "keys {...}"
  const simpleCmdMatch = trimmed.match(
    /^(format|pretty|pretty-print|minify|validate|extract|get|keys)\s+([\s\S]*)$/i
  )
  if (simpleCmdMatch) {
    let action = simpleCmdMatch[1].toLowerCase()
    if (action === 'pretty' || action === 'pretty-print') action = 'format'
    if (action === 'get') action = 'extract'

    const rest = simpleCmdMatch[2].trim()

    if (action === 'extract') {
      const pathMatch = rest.match(/^([\w.[\]]+)\s+([\s\S]*)$/)
      if (pathMatch) {
        return { action: 'extract', json: pathMatch[2].trim(), path: pathMatch[1] }
      }
      throw new Error('Need a path for extraction. Use: "get path.to.key {...}"')
    }

    return { action: action as JsonAction, json: rest }
  }

  // Auto-detect: if it starts with { or [, parse/format it
  if (/^[[{]/.test(trimmed)) {
    return { action: 'format', json: trimmed }
  }

  // Default: treat as format
  return { action: 'format', json: trimmed }
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const parsed = parseInput(input)

    switch (parsed.action) {
      case 'validate': {
        const result = parseJSON(parsed.json)
        const execMs = Date.now() - t0
        if (result.valid) {
          const raw = '✓ Valid JSON'
          return {
            status: 'ok',
            result: { valid: true },
            displayType: 'text',
            raw,
            execMs,
          }
        }
        let detail = `✗ Invalid JSON: ${result.error}`
        if (result.line !== undefined && result.column !== undefined) {
          detail += ` (line ${result.line}, column ${result.column})`
        }
        return {
          status: 'ok',
          result: { valid: false, error: result.error, line: result.line, column: result.column },
          displayType: 'text',
          raw: detail,
          execMs,
        }
      }

      case 'parse':
      case 'format': {
        const result = parseJSON(parsed.json)
        if (!result.valid) {
          const execMs = Date.now() - t0
          let detail = `Parse error: ${result.error}`
          if (result.line !== undefined && result.column !== undefined) {
            detail += ` (line ${result.line}, column ${result.column})`
          }
          return {
            status: 'error',
            result: { error: detail },
            displayType: 'error',
            raw: detail,
            execMs,
          }
        }
        const formatted = JSON.stringify(result.parsed, null, 2)
        const execMs = Date.now() - t0
        return {
          status: 'ok',
          result: result.parsed,
          displayType: 'code',
          raw: formatted,
          execMs,
        }
      }

      case 'minify': {
        const result = parseJSON(parsed.json)
        if (!result.valid) {
          const execMs = Date.now() - t0
          let detail = `Parse error: ${result.error}`
          if (result.line !== undefined && result.column !== undefined) {
            detail += ` (line ${result.line}, column ${result.column})`
          }
          return {
            status: 'error',
            result: { error: detail },
            displayType: 'error',
            raw: detail,
            execMs,
          }
        }
        const minified = JSON.stringify(result.parsed)
        const execMs = Date.now() - t0
        const saved = parsed.json.length - minified.length
        const raw = `${minified}\n\n(${minified.length} chars, saved ${saved > 0 ? saved : 0})`
        return {
          status: 'ok',
          result: { minified, originalSize: parsed.json.length, minifiedSize: minified.length, saved: Math.max(saved, 0) },
          displayType: 'code',
          raw,
          execMs,
        }
      }

      case 'extract': {
        if (!parsed.path) {
          throw new Error('No path specified. Use: "json get path.to.key {...}"')
        }
        const result = parseJSON(parsed.json)
        if (!result.valid) {
          const execMs = Date.now() - t0
          let detail = `Parse error: ${result.error}`
          if (result.line !== undefined && result.column !== undefined) {
            detail += ` (line ${result.line}, column ${result.column})`
          }
          return {
            status: 'error',
            result: { error: detail },
            displayType: 'error',
            raw: detail,
            execMs,
          }
        }
        const extracted = extractPath(result.parsed, parsed.path)
        const execMs = Date.now() - t0
        const raw = typeof extracted === 'object' && extracted !== null
          ? JSON.stringify(extracted, null, 2)
          : String(extracted)
        return {
          status: 'ok',
          result: { path: parsed.path, value: extracted },
          displayType: 'code',
          raw,
          execMs,
        }
      }

      case 'keys': {
        const result = parseJSON(parsed.json)
        if (!result.valid) {
          const execMs = Date.now() - t0
          let detail = `Parse error: ${result.error}`
          if (result.line !== undefined && result.column !== undefined) {
            detail += ` (line ${result.line}, column ${result.column})`
          }
          return {
            status: 'error',
            result: { error: detail },
            displayType: 'error',
            raw: detail,
            execMs,
          }
        }
        const keys = listKeys(result.parsed)
        const execMs = Date.now() - t0
        const raw = keys.join('\n')
        return {
          status: 'ok',
          result: { keys },
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
