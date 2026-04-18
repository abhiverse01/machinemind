// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Diff Tool v5.0
// Myers diff algorithm O((N+M)D). No external libraries.
// Three modes: char, word, json. Auto-detection.
// ─────────────────────────────────────────────────────────────

import type { ToolResult, DiffOp, DiffSegment, DiffResult } from '../types'

// ── Myers Diff Algorithm ──────────────────────────────────────

/**
 * Full Myers diff implementation with backtracking.
 * Produces a minimal edit script between two sequences.
 * Time complexity: O((N+M)D) where D is the edit distance.
 */
class DiffEngine {
  /**
   * Character-level diff for short strings.
   * Splits both inputs into individual characters.
   */
  static charDiff(original: string, modified: string): DiffResult {
    const a = [...original]
    const b = [...modified]
    const segments = DiffEngine.myersDiff(a, b)
    return DiffEngine.buildResult(segments, 'char')
  }

  /**
   * Word-level diff for prose.
   * Splits on /\S+|\s+/ preserving whitespace tokens.
   */
  static wordDiff(original: string, modified: string): DiffResult {
    const a = original.match(/\S+|\s+/g) ?? []
    const b = modified.match(/\S+|\s+/g) ?? []
    const segments = DiffEngine.myersDiff(a, b)
    return DiffEngine.buildResult(segments, 'word')
  }

  /**
   * Structural JSON diff showing added/removed/changed keys.
   * If either input fails JSON.parse, falls back to wordDiff.
   */
  static jsonDiff(original: string, modified: string): DiffResult {
    let objA: unknown
    let objB: unknown

    try {
      objA = JSON.parse(original)
    } catch {
      return DiffEngine.wordDiff(original, modified)
    }

    try {
      objB = JSON.parse(modified)
    } catch {
      return DiffEngine.wordDiff(original, modified)
    }

    const segments: DiffSegment[] = []
    DiffEngine.structuralDiff(objA, objB, '', segments)

    // If no differences found via structural diff and both are objects,
    // the result is already correct. But if both are primitives or arrays
    // that compared equal, segments might be empty — add equal segment.
    if (segments.length === 0) {
      segments.push({ op: 'equal', value: original })
    }

    return DiffEngine.buildResult(segments, 'json')
  }

  /**
   * Auto-detect diff mode:
   * - JSON if both strings start with [ or {
   * - char if both strings are < 80 characters
   * - word otherwise
   */
  static auto(original: string, modified: string): DiffResult {
    const trimmedA = original.trim()
    const trimmedB = modified.trim()

    // JSON detection: both start with [ or {
    if (/^[\[{]/.test(trimmedA) && /^[\[{]/.test(trimmedB)) {
      return DiffEngine.jsonDiff(original, modified)
    }

    // Char mode for short strings
    if (original.length < 80 && modified.length < 80) {
      return DiffEngine.charDiff(original, modified)
    }

    // Word mode for everything else
    return DiffEngine.wordDiff(original, modified)
  }

  // ── Private: Myers algorithm core ─────────────────────────

  /**
   * Myers diff algorithm producing an edit script.
   * Returns DiffSegments combining consecutive same-op entries.
   */
  private static myersDiff(a: string[], b: string[]): DiffSegment[] {
    const N = a.length
    const M = b.length

    // Edge cases
    if (N === 0 && M === 0) return []
    if (N === 0) return [{ op: 'added', value: b.join('') }]
    if (M === 0) return [{ op: 'removed', value: a.join('') }]

    // If both are identical, return single equal segment
    if (N === M && a.every((v, i) => v === b[i])) {
      return [{ op: 'equal', value: a.join('') }]
    }

    const MAX = N + M
    const V: Record<number, number> = {}
    const trace: Array<Record<number, number>> = []

    V[1] = 0

    for (let d = 0; d <= MAX; d++) {
      // Snapshot current V for backtracking
      const currentV: Record<number, number> = {}
      for (const k in V) {
        currentV[k] = V[k]
      }
      trace.push(currentV)

      for (let k = -d; k <= d; k += 2) {
        let x: number

        // Determine whether to move down or right
        if (k === -d || (k !== d && (V[k - 1] ?? 0) < (V[k + 1] ?? 0))) {
          x = V[k + 1] ?? 0 // Move down (insert from b)
        } else {
          x = (V[k - 1] ?? 0) + 1 // Move right (delete from a)
        }

        let y = x - k

        // Extend diagonal (equal elements)
        while (x < N && y < M && a[x] === b[y]) {
          x++
          y++
        }

        V[k] = x

        // Found the endpoint
        if (x >= N && y >= M) {
          return DiffEngine.backtrack(a, b, trace, d, MAX)
        }
      }
    }

    // Should not reach here, but fallback
    return DiffEngine.backtrack(a, b, trace, MAX, MAX)
  }

  /**
   * Backtrack through the trace to reconstruct the edit script.
   * Walks from the endpoint back to the origin, then reverses.
   */
  private static backtrack(
    a: string[],
    b: string[],
    trace: Array<Record<number, number>>,
    d: number,
    _MAX: number
  ): DiffSegment[] {
    const N = a.length
    const M = b.length
    const ops: Array<{ op: DiffOp; value: string; oldValue?: string }> = []

    let x = N
    let y = M

    for (let step = d; step > 0; step--) {
      const v = trace[step - 1]!
      const k = x - y

      let prevK: number
      let prevX: number

      if (k === -step || (k !== step && (v[k - 1] ?? 0) < (v[k + 1] ?? 0))) {
        prevK = k + 1
        prevX = v[k + 1] ?? 0
      } else {
        prevK = k - 1
        prevX = (v[k - 1] ?? 0) + 1
      }

      const prevY = prevX - prevK

      // Diagonal moves (equal elements)
      while (x > prevX && y > prevY) {
        x--
        y--
        ops.push({ op: 'equal', value: a[x]! })
      }

      if (step > 0) {
        if (x === prevX) {
          // Insert from b (move down)
          y--
          ops.push({ op: 'added', value: b[y]! })
        } else {
          // Delete from a (move right)
          x--
          ops.push({ op: 'removed', value: a[x]! })
        }
      }
    }

    // Handle any remaining diagonal at the beginning
    while (x > 0 && y > 0) {
      x--
      y--
      ops.push({ op: 'equal', value: a[x]! })
    }
    while (y > 0) {
      y--
      ops.push({ op: 'added', value: b[y]! })
    }
    while (x > 0) {
      x--
      ops.push({ op: 'removed', value: a[x]! })
    }

    // Reverse since we backtracked
    ops.reverse()

    // Merge consecutive same-op segments and pair removed→added as changed
    return DiffEngine.mergeSegments(ops)
  }

  /**
   * Merge consecutive segments with the same op.
   * Pair adjacent removed+added segments into 'changed' segments.
   */
  private static mergeSegments(
    ops: Array<{ op: DiffOp; value: string; oldValue?: string }>
  ): DiffSegment[] {
    const result: DiffSegment[] = []

    let i = 0
    while (i < ops.length) {
      // Check for removed followed by added → changed
      if (
        ops[i]!.op === 'removed' &&
        i + 1 < ops.length &&
        ops[i + 1]!.op === 'added'
      ) {
        // Collect consecutive removed
        let removedVal = ops[i]!.value
        let j = i + 1
        while (j < ops.length && ops[j]!.op === 'removed') {
          removedVal += ops[j]!.value
          j++
        }
        // Collect consecutive added
        let addedVal = ''
        while (j < ops.length && ops[j]!.op === 'added') {
          addedVal += ops[j]!.value
          j++
        }
        result.push({ op: 'changed', value: addedVal, oldValue: removedVal })
        i = j
        continue
      }

      // Merge consecutive same-op segments
      const currentOp = ops[i]!.op
      let merged = ops[i]!.value
      let j = i + 1
      while (j < ops.length && ops[j]!.op === currentOp) {
        merged += ops[j]!.value
        j++
      }

      result.push({ op: currentOp, value: merged })
      i = j
    }

    return result
  }

  // ── Private: Structural JSON diff ─────────────────────────

  /**
   * Recursive key comparison for JSON objects.
   * Walks both structures, emitting segments for added/removed/changed keys.
   */
  private static structuralDiff(
    a: unknown,
    b: unknown,
    path: string,
    segments: DiffSegment[]
  ): void {
    const displayPath = path || '(root)'

    // Both null
    if (a === null && b === null) {
      segments.push({ op: 'equal', value: `${displayPath}: null` })
      return
    }

    // One null
    if (a === null || b === null) {
      if (a === null) {
        segments.push({
          op: 'added',
          value: `${displayPath}: ${JSON.stringify(b)}`,
        })
      } else {
        segments.push({
          op: 'removed',
          value: `${displayPath}: ${JSON.stringify(a)}`,
        })
      }
      return
    }

    // Type mismatch
    if (typeof a !== typeof b) {
      segments.push({
        op: 'changed',
        value: `${displayPath}: ${JSON.stringify(b)}`,
        oldValue: `${displayPath}: ${JSON.stringify(a)}`,
      })
      return
    }

    // Both arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      const maxLen = Math.max(a.length, b.length)
      for (let i = 0; i < maxLen; i++) {
        const itemPath = `${path}[${i}]`
        if (i >= a.length) {
          segments.push({
            op: 'added',
            value: `${itemPath}: ${JSON.stringify(b[i])}`,
          })
        } else if (i >= b.length) {
          segments.push({
            op: 'removed',
            value: `${itemPath}: ${JSON.stringify(a[i])}`,
          })
        } else {
          DiffEngine.structuralDiff(a[i], b[i], itemPath, segments)
        }
      }
      return
    }

    // One array, one object (shouldn't happen if types match, but be safe)
    if (Array.isArray(a) !== Array.isArray(b)) {
      segments.push({
        op: 'changed',
        value: `${displayPath}: ${JSON.stringify(b)}`,
        oldValue: `${displayPath}: ${JSON.stringify(a)}`,
      })
      return
    }

    // Both objects (non-null, non-array)
    if (typeof a === 'object' && typeof b === 'object') {
      const objA = a as Record<string, unknown>
      const objB = b as Record<string, unknown>
      const keysA = Object.keys(objA)
      const keysB = Object.keys(objB)
      const allKeys = new Set([...keysA, ...keysB])

      for (const key of allKeys) {
        const keyPath = path ? `${path}.${key}` : key
        const inA = key in objA
        const inB = key in objB

        if (inA && !inB) {
          segments.push({
            op: 'removed',
            value: `${keyPath}: ${JSON.stringify(objA[key])}`,
          })
        } else if (!inA && inB) {
          segments.push({
            op: 'added',
            value: `${keyPath}: ${JSON.stringify(objB[key])}`,
          })
        } else {
          DiffEngine.structuralDiff(objA[key], objB[key], keyPath, segments)
        }
      }
      return
    }

    // Both primitives
    if (a !== b) {
      segments.push({
        op: 'changed',
        value: `${displayPath}: ${JSON.stringify(b)}`,
        oldValue: `${displayPath}: ${JSON.stringify(a)}`,
      })
    } else {
      segments.push({
        op: 'equal',
        value: `${displayPath}: ${JSON.stringify(a)}`,
      })
    }
  }

  // ── Private: Build result with counts and similarity ──────

  /**
   * Compute counts and similarity score from segments.
   * Similarity = equal characters / total characters.
   */
  private static buildResult(segments: DiffSegment[], mode: 'char' | 'word' | 'json'): DiffResult {
    let addedCount = 0
    let removedCount = 0
    let changedCount = 0
    let equalLen = 0
    let totalLen = 0

    for (const seg of segments) {
      switch (seg.op) {
        case 'equal':
          equalLen += seg.value.length
          totalLen += seg.value.length
          break
        case 'added':
          addedCount++
          totalLen += seg.value.length
          break
        case 'removed':
          removedCount++
          totalLen += seg.value.length
          break
        case 'changed':
          changedCount++
          totalLen += (seg.oldValue?.length ?? 0) + seg.value.length
          break
      }
    }

    const similarity = totalLen > 0 ? equalLen / totalLen : 1

    return {
      segments,
      addedCount,
      removedCount,
      changedCount,
      similarity: Math.round(similarity * 10000) / 10000, // 4 decimal places
      mode,
    }
  }
}

// ── Input parsing for execute ────────────────────────────────

interface ParsedDiffInput {
  original: string
  modified: string
  mode: 'char' | 'word' | 'json' | 'auto'
}

/**
 * Parse diff instructions from natural language input.
 * Supports:
 *   "!diff original vs modified"
 *   "!diff char|word|json original vs modified"
 *   "compare A and B"
 *   "diff A vs B"
 *   Plain text with " vs " or " and " separator
 */
function parseDiffInput(input: string): ParsedDiffInput {
  let trimmed = input.trim()

  // Strip common prefixes
  const prefixRe = /^(?:!diff|diff|compare)\s*/i
  const prefixMatch = trimmed.match(prefixRe)
  if (prefixMatch) {
    trimmed = trimmed.slice(prefixMatch[0].length).trim()
  }

  // Check for explicit mode: "char ...", "word ...", "json ..."
  let mode: ParsedDiffInput['mode'] = 'auto'
  const modeRe = /^(char|word|json)\s+/i
  const modeMatch = trimmed.match(modeRe)
  if (modeMatch) {
    mode = modeMatch[1].toLowerCase() as ParsedDiffInput['mode']
    trimmed = trimmed.slice(modeMatch[0].length).trim()
  }

  // Try " vs " separator first (most explicit)
  const vsIdx = trimmed.indexOf(' vs ')
  if (vsIdx !== -1) {
    return {
      original: trimmed.slice(0, vsIdx).trim(),
      modified: trimmed.slice(vsIdx + 4).trim(),
      mode,
    }
  }

  // Try " and " separator
  const andIdx = trimmed.indexOf(' and ')
  if (andIdx !== -1) {
    return {
      original: trimmed.slice(0, andIdx).trim(),
      modified: trimmed.slice(andIdx + 5).trim(),
      mode,
    }
  }

  // Try "|" separator
  const pipeIdx = trimmed.indexOf('|')
  if (pipeIdx !== -1) {
    return {
      original: trimmed.slice(0, pipeIdx).trim(),
      modified: trimmed.slice(pipeIdx + 1).trim(),
      mode,
    }
  }

  // Try "→" or "->" separator
  const arrowIdx = trimmed.indexOf('→')
  if (arrowIdx !== -1) {
    return {
      original: trimmed.slice(0, arrowIdx).trim(),
      modified: trimmed.slice(arrowIdx + 1).trim(),
      mode,
    }
  }
  const arrowIdx2 = trimmed.indexOf('->')
  if (arrowIdx2 !== -1) {
    return {
      original: trimmed.slice(0, arrowIdx2).trim(),
      modified: trimmed.slice(arrowIdx2 + 2).trim(),
      mode,
    }
  }

  // No separator found — treat entire input as comparing against empty
  // or if it looks like it has quotes, extract two quoted strings
  const quotedRe = /["'`]([^"'`]*)["'`]\s+["'`]([^"'`]*)["'`]/
  const quotedMatch = trimmed.match(quotedRe)
  if (quotedMatch) {
    return {
      original: quotedMatch[1]!,
      modified: quotedMatch[2]!,
      mode,
    }
  }

  // Fallback: compare against empty string
  return {
    original: trimmed,
    modified: '',
    mode,
  }
}

// ── Format DiffResult for display ────────────────────────────

function formatDiffResult(result: DiffResult): string {
  const lines: string[] = []
  const opSymbol: Record<DiffOp, string> = {
    equal: ' ',
    added: '+',
    removed: '-',
    changed: '~',
  }

  lines.push(`Mode: ${result.mode}`)
  lines.push(`Similarity: ${(result.similarity * 100).toFixed(2)}%`)
  lines.push(`+${result.addedCount} -${result.removedCount} ~${result.changedCount}`)
  lines.push('---')

  for (const seg of result.segments) {
    const symbol = opSymbol[seg.op]
    if (seg.op === 'changed') {
      lines.push(`${symbol} ${seg.oldValue} → ${seg.value}`)
    } else {
      lines.push(`${symbol} ${seg.value}`)
    }
  }

  return lines.join('\n')
}

// ── Main execute ─────────────────────────────────────────────

export async function execute(input: string): Promise<ToolResult> {
  const t0 = performance.now()

  try {
    const trimmed = input.trim()

    if (!trimmed) {
      const execMs = performance.now() - t0
      return {
        status: 'error',
        result: { error: 'Empty diff input. Usage: diff <original> vs <modified>' },
        displayType: 'error',
        raw: 'Empty diff input',
        execMs,
      }
    }

    const parsed = parseDiffInput(trimmed)

    if (!parsed.original && !parsed.modified) {
      const execMs = performance.now() - t0
      return {
        status: 'error',
        result: { error: 'No content to diff. Provide two strings separated by " vs " or " and "' },
        displayType: 'error',
        raw: 'No content to diff',
        execMs,
      }
    }

    // Select diff method based on mode
    let diffResult: DiffResult

    switch (parsed.mode) {
      case 'char':
        diffResult = DiffEngine.charDiff(parsed.original, parsed.modified)
        break
      case 'word':
        diffResult = DiffEngine.wordDiff(parsed.original, parsed.modified)
        break
      case 'json':
        diffResult = DiffEngine.jsonDiff(parsed.original, parsed.modified)
        break
      case 'auto':
      default:
        diffResult = DiffEngine.auto(parsed.original, parsed.modified)
        break
    }

    const execMs = performance.now() - t0
    const formatted = formatDiffResult(diffResult)

    return {
      status: 'ok',
      result: diffResult,
      displayType: 'text',
      raw: formatted,
      execMs,
    }
  } catch (err: unknown) {
    const execMs = performance.now() - t0
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
