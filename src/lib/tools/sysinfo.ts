// ─────────────────────────────────────────────────────────────
// MACHINE MIND — System Info Tool
// Reports from module-level state. Reads mode, turn count,
// context flags, memory vars, uptime, tool registry status.
// Parse: "!help", "!status", "!tools", "what can you do",
//   "system status"
// execMs measured with Date.now().
// ─────────────────────────────────────────────────────────────

import type { ToolResult, AppMode, ToolStatus } from '../types'

// ── Module-level state interface ─────────────────────────────
export interface SysInfoState {
  mode: 'rule_engine' | 'ai_relay'
  turnCount: number
  contextFlags: string[]
  storedVarsCount: number
  startTime: number
  toolStatuses: Record<string, 'idle' | 'running' | 'done' | 'error'>
}

// ── Module-level state (mutable by the app) ──────────────────
export const sysInfoState: SysInfoState = {
  mode: 'rule_engine',
  turnCount: 0,
  contextFlags: [],
  storedVarsCount: 0,
  startTime: Date.now(),
  toolStatuses: {},
}

// ── Format uptime ────────────────────────────────────────────
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

// ── Input parsing ────────────────────────────────────────────
type SysInfoAction = 'help' | 'status' | 'tools'

function parseInput(input: string): SysInfoAction {
  const lower = input.toLowerCase().trim()

  // "!help" / "what can you do"
  if (
    lower === '!help' ||
    lower === 'help' ||
    lower === 'what can you do' ||
    lower === 'what do you do' ||
    lower === 'help me'
  ) {
    return 'help'
  }

  // "!tools" / "list tools" / "show tools"
  if (
    lower === '!tools' ||
    lower === 'tools' ||
    lower === 'list tools' ||
    lower === 'show tools'
  ) {
    return 'tools'
  }

  // "!status" / "system status" / "status" / "sysinfo" / "system info"
  if (
    lower === '!status' ||
    lower === 'status' ||
    lower === 'system status' ||
    lower === 'sysinfo' ||
    lower === 'system info' ||
    lower === 'system information'
  ) {
    return 'status'
  }

  // Default: status
  return 'status'
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const action = parseInput(input)
    const state = sysInfoState
    const uptimeMs = Date.now() - state.startTime

    if (action === 'help') {
      const execMs = Date.now() - t0
      const raw = [
        'MACHINE MIND — Available Commands',
        '',
        'Tools:',
        '  calculator <expr>      — Math expressions (2+3, sqrt(144))',
        '  clock <query>          — Time, date, timezone, countdown',
        '  converter <val> to <u> — Unit conversions',
        '  encoder <method> <data>— Encode/decode (base64, hex, rot13)',
        '  hash <text>            — SHA-256 hashing, UUID generation',
        '  memory <action> <args> — Session key-value storage',
        '  wordtools <action>     — Word count, palindrome, anagram',
        '  json <action> <data>   — JSON format, validate, extract',
        '  regex <action> <data>  — Regex test, explain, patterns',
        '  random <action>        — Dice, coin, password, pick, shuffle',
        '  color <value>          — Color conversion, palette, contrast',
        '  sysinfo <action>       — System status, tool list, help',
        '',
        'Commands: !help, !status, !tools',
        'Chains: calculator 2+3 | encoder base64',
      ].join('\n')
      return { status: 'ok', result: { type: 'help' }, displayType: 'text', raw, execMs }
    }

    if (action === 'tools') {
      const execMs = Date.now() - t0
      const toolEntries = Object.entries(state.toolStatuses).map(
        ([name, status]) => ({ name, status })
      )
      const raw = [
        'Tool Registry:',
        ...toolEntries.map(t => `  ${t.name}: ${t.status}`),
        toolEntries.length === 0 ? '  (no tools registered)' : '',
      ].filter(Boolean).join('\n')
      return {
        status: 'ok',
        result: toolEntries,
        displayType: 'table',
        raw,
        execMs,
      }
    }

    // action === 'status'
    const execMs = Date.now() - t0
    const toolLines = Object.entries(state.toolStatuses).length > 0
      ? Object.entries(state.toolStatuses).map(([name, status]) => `  ${name}: ${status}`).join('\n')
      : '  calculator · clock · converter · encoder · hash · memory · wordtools · json · regex · random · color · sysinfo'

    const raw = [
      `MODE: ${state.mode.toUpperCase()} | TURNS: ${state.turnCount} | TOOLS: 12 active | UPTIME: ${formatUptime(uptimeMs)}`,
      '',
      'TOOLS: calculator · clock · converter · encoder · hash · memory · wordtools · json · regex · random · color · sysinfo',
      '',
      'KEYBOARDS: Shift+Enter send · Ctrl+\\ tray · Esc settings · Ctrl+K focus · Ctrl+Shift+C clear',
      '',
      'Dev: Abhishek Shah · abhishekshah.vercel.app',
    ].join('\n')

    return {
      status: 'ok',
      result: {
        mode: state.mode,
        turnCount: state.turnCount,
        uptimeMs,
        contextFlags: state.contextFlags,
        storedVarsCount: state.storedVarsCount,
        toolStatuses: state.toolStatuses,
      },
      displayType: 'text',
      raw,
      execMs,
    }
  } catch (err: unknown) {
    const execMs = Date.now() - t0
    const message = err instanceof Error ? err.message : String(err)
    return { status: 'error', result: { error: message }, displayType: 'error', raw: message, execMs }
  }
}
