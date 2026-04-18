// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Tool Registry + Chain Router
// Registers all 12 tools, provides lookup, execution, and
// pipe-chain routing with depth/cycle limits.
// execMs measured with Date.now().
// ─────────────────────────────────────────────────────────────

import type { ToolResult, DisplayType } from '../types'

import { execute as calculatorExec } from './calculator'
import { execute as clockExec } from './clock'
import { execute as converterExec } from './converter'
import { execute as encoderExec } from './encoder'
import { execute as hashExec } from './hash'
import { execute as memoryExec } from './memory'
import { execute as wordtoolsExec } from './wordtools'
import { execute as jsonExec } from './json'
import { execute as regexExec } from './regex'
import { execute as randomExec } from './random'
import { execute as colorExec } from './color'
import { execute as sysinfoExec } from './sysinfo'
import { execute as diffExec } from './diff'
import { execute as booleanExec } from './boolean'

// ── Tool entry interface ─────────────────────────────────────
interface ToolEntry {
  name: string
  description: string
  triggerSyntax: string
  example: string
  outputType: DisplayType
  execute: (input: string) => Promise<ToolResult>
}

// ── Registry ─────────────────────────────────────────────────
const registry = new Map<string, ToolEntry>()

// ── Track primary tool names for listTools ──────────────────
const primaryTools: string[] = []

function register(entry: ToolEntry, aliases: string[] = []): void {
  registry.set(entry.name, entry)
  primaryTools.push(entry.name)
  for (const alias of aliases) {
    registry.set(alias, entry)
  }
}

// ── Register all 12 tools ────────────────────────────────────
register({
  name: 'calculator',
  description: 'Mathematical expressions — arithmetic, functions, constants, percentages, factorials',
  triggerSyntax: 'calc <expr> | <math expression>',
  example: 'calc 2+3*4 or sqrt(144)',
  outputType: 'code',
  execute: calculatorExec,
}, ['math', 'calc'])

register({
  name: 'clock',
  description: 'Time, date, timezone conversion, countdowns, day-of-week',
  triggerSyntax: 'time [in <tz>] | convert <tz> to <tz> | days until <event>',
  example: 'time in JST or days until Christmas',
  outputType: 'text',
  execute: clockExec,
}, ['time'])

register({
  name: 'converter',
  description: 'Unit conversions — length, mass, temperature, speed, data, area, volume',
  triggerSyntax: '<value><unit> to <unit>',
  example: '5km to miles or 100F to C',
  outputType: 'code',
  execute: converterExec,
}, ['convert', 'unit'])

register({
  name: 'encoder',
  description: 'Encode/decode — Base64, URL, Hex, Binary, ROT13, Morse',
  triggerSyntax: 'encode|decode <method> <data> | rot13 <text>',
  example: 'encode base64 hello or decode hex 48656c6c6f',
  outputType: 'code',
  execute: encoderExec,
}, ['encode'])

register({
  name: 'hash',
  description: 'SHA-256 hashing and UUID v4 generation',
  triggerSyntax: 'sha256 <text> | uuid',
  example: 'sha256 hello world or uuid',
  outputType: 'code',
  execute: hashExec,
})

register({
  name: 'memory',
  description: 'Session memory — store, recall, forget, list, clear key-value pairs',
  triggerSyntax: 'remember <value> as <key> | recall <key> | forget <key>',
  example: 'remember Paris as my_city or recall my_city',
  outputType: 'text',
  execute: memoryExec,
})

register({
  name: 'wordtools',
  description: 'Text analysis — word count, char count, Flesch score, palindrome, anagram, letter frequency',
  triggerSyntax: 'word count <text> | palindrome <word> | anagram <w1> <w2>',
  example: 'word count The quick brown fox or is racecar a palindrome',
  outputType: 'code',
  execute: wordtoolsExec,
}, ['word', 'words'])

register({
  name: 'json',
  description: 'JSON tools — parse, format, minify, validate, extract by path, list keys',
  triggerSyntax: 'json format <json> | json validate <json> | json extract <path> <json>',
  example: 'json format {"a":1} or json extract users[0].name {...}',
  outputType: 'code',
  execute: jsonExec,
})

register({
  name: 'regex',
  description: 'Regex testing, explanation, and common pattern library',
  triggerSyntax: 'regex test /<pattern>/ <string> | regex explain /<pattern>/ | regex for <name>',
  example: 'regex test /\\d+/ abc123 or regex for email',
  outputType: 'code',
  execute: regexExec,
})

register({
  name: 'random',
  description: 'Cryptographically secure randomness — dice, coins, integers, passwords, pick, shuffle',
  triggerSyntax: 'roll NdM | flip coin | random N-M | password <len> | pick from <list> | shuffle <list>',
  example: 'roll 2d20 or password 16',
  outputType: 'text',
  execute: randomExec,
})

register({
  name: 'color',
  description: 'Color conversion (HEX/RGB/HSL), palette generation, WCAG contrast ratios',
  triggerSyntax: '<hex> | rgb(r,g,b) | hsl(h,s%,l%) | contrast <c1> on <c2>',
  example: '#ff6600 or contrast #333 on #fff',
  outputType: 'color_swatch',
  execute: colorExec,
})

register({
  name: 'diff',
  description: 'Diff engine — compare texts, JSON, code. Shows added, removed, changed content.',
  triggerSyntax: 'diff <a> vs <b>',
  example: 'diff hello vs hallo',
  outputType: 'code',
  execute: diffExec,
}, ['compare'])

register({
  name: 'boolean',
  description: 'Boolean evaluator — primality, divisibility, range checks, palindrome, anagram, even/odd, power of two',
  triggerSyntax: 'bool <query>',
  example: 'is 17 prime?',
  outputType: 'text',
  execute: booleanExec,
}, ['bool'])

register({
  name: 'sysinfo',
  description: 'System status — mode, turn count, uptime, memory vars, tool statuses',
  triggerSyntax: '!help | !status | !tools | what can you do | system status',
  example: 'system status',
  outputType: 'text',
  execute: sysinfoExec,
}, ['system_status', 'system', 'help'])

// ── Public API ───────────────────────────────────────────────

export function getTool(name: string): ToolEntry | undefined {
  return registry.get(name)
}

export function listTools(): ToolEntry[] {
  return primaryTools.map(name => registry.get(name)!).filter(Boolean)
}

// ── Alias for ToolTray component (same data, different name) ──
export function allTools(): ToolEntry[] {
  return primaryTools.map(name => registry.get(name)!).filter(Boolean)
}

export async function executeTool(name: string, input: string): Promise<ToolResult> {
  const tool = registry.get(name)
  if (!tool) {
    return {
      status: 'error',
      result: { error: `Unknown tool: "${name}". Available: ${Array.from(registry.keys()).join(', ')}` },
      displayType: 'error',
      raw: `Unknown tool: "${name}"`,
      execMs: 0,
    }
  }
  return tool.execute(input)
}

// ── Chain router ─────────────────────────────────────────────
// Format: "calculator 2+3 | encoder base64"
// Runs step 1, feeds result.raw of step N as appended args to step N+1.
// Max depth: 5. Cycle detection: reject if same tool appears twice.

const MAX_CHAIN_DEPTH = 5

interface ChainStep {
  toolName: string
  input: string
}

function parseChain(chain: string): ChainStep[] {
  return chain.split('|').map(segment => {
    const trimmed = segment.trim()
    // First word is tool name, rest is input
    const spaceIdx = trimmed.indexOf(' ')
    if (spaceIdx === -1) {
      return { toolName: trimmed.toLowerCase(), input: '' }
    }
    return {
      toolName: trimmed.slice(0, spaceIdx).toLowerCase(),
      input: trimmed.slice(spaceIdx + 1).trim(),
    }
  })
}

export async function executeChain(chain: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const steps = parseChain(chain)

    if (steps.length === 0) {
      const execMs = Date.now() - t0
      return {
        status: 'error',
        result: { error: 'Empty chain' },
        displayType: 'error',
        raw: 'Empty chain',
        execMs,
      }
    }

    if (steps.length > MAX_CHAIN_DEPTH) {
      const execMs = Date.now() - t0
      const msg = `Chain too deep (max ${MAX_CHAIN_DEPTH} steps, got ${steps.length})`
      return {
        status: 'error',
        result: { error: msg },
        displayType: 'error',
        raw: msg,
        execMs,
      }
    }

    // Cycle detection: no tool can appear twice
    const seenTools = new Set<string>()
    for (const step of steps) {
      if (seenTools.has(step.toolName)) {
        const execMs = Date.now() - t0
        const msg = `Cycle detected: tool "${step.toolName}" appears more than once in chain`
        return {
          status: 'error',
          result: { error: msg },
          displayType: 'error',
          raw: msg,
          execMs,
        }
      }
      seenTools.add(step.toolName)
    }

    // Validate all tools exist
    for (const step of steps) {
      if (!registry.has(step.toolName)) {
        const execMs = Date.now() - t0
        const msg = `Unknown tool in chain: "${step.toolName}"`
        return {
          status: 'error',
          result: { error: msg },
          displayType: 'error',
          raw: msg,
          execMs,
        }
      }
    }

    // Execute chain sequentially
    let lastResult: ToolResult | null = null
    const chainResults: Array<{ tool: string; input: string; result: ToolResult }> = []

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      // For step N+1, append the raw result of step N to the input
      let input = step.input
      if (i > 0 && lastResult) {
        input = input ? `${input} ${lastResult.raw}` : lastResult.raw
      }

      const tool = registry.get(step.toolName)!
      const result = await tool.execute(input)
      chainResults.push({ tool: step.toolName, input, result })

      if (result.status === 'error') {
        const execMs = Date.now() - t0
        const msg = `Chain failed at step ${i + 1} (${step.toolName}): ${result.raw}`
        return {
          status: 'error',
          result: { error: msg, failedStep: i, chainResults },
          displayType: 'error',
          raw: msg,
          execMs,
        }
      }

      lastResult = result
    }

    // Return final result
    const execMs = Date.now() - t0
    if (!lastResult) {
      return {
        status: 'error',
        result: { error: 'Chain produced no result' },
        displayType: 'error',
        raw: 'Chain produced no result',
        execMs,
      }
    }

    // Enhance raw output with chain trace
    const trace = chainResults.map((cr, i) => `${i + 1}. ${cr.tool}: ${cr.input} \u2192 ${cr.result.raw}`).join('\n')
    const raw = `${trace}\n\nFinal: ${lastResult.raw}`

    return {
      status: 'ok',
      result: {
        chain: chainResults.map(cr => ({ tool: cr.tool, input: cr.input, raw: cr.result.raw })),
        finalResult: lastResult.result,
      },
      displayType: lastResult.displayType,
      raw,
      execMs,
    }
  } catch (err: unknown) {
    const execMs = Date.now() - t0
    const message = err instanceof Error ? err.message : String(err)
    return { status: 'error', result: { error: message }, displayType: 'error', raw: message, execMs }
  }
}
