// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Shared TypeScript Types
// Zero `any`. Every function is typed. Strict mode compliant.
// ─────────────────────────────────────────────────────────────

export type Role = 'user' | 'assistant' | 'system'

export type DisplayType = 'text' | 'code' | 'table' | 'color_swatch' | 'error'

export type ToolStatus = 'idle' | 'running' | 'done' | 'error'

export type AppMode = 'rule_engine' | 'ai_relay'

export type IntentCategory =
  | 'GREETING'
  | 'FAREWELL'
  | 'GRATITUDE'
  | 'APOLOGY'
  | 'AFFIRMATION'
  | 'NEGATION'
  | 'QUESTION_FACTUAL'
  | 'QUESTION_OPINION'
  | 'QUESTION_META'
  | 'COMMAND'
  | 'MATH'
  | 'TIME'
  | 'CONVERT'
  | 'ENCODE'
  | 'HASH'
  | 'COLOR'
  | 'REGEX'
  | 'RANDOM'
  | 'MEMORY_STORE'
  | 'MEMORY_RECALL'
  | 'SYSTEM_STATUS'
  | 'CHAIN_TOOL'
  | 'FOLLOW_UP'
  | 'SMALL_TALK'
  | 'WORD'
  | 'JSON'
  | 'UNKNOWN'

export interface Message {
  id: string
  role: Role
  content: string
  displayType: DisplayType
  toolName?: string
  execMs?: number
  tokens?: number
  timestamp: number
}

export interface ToolResult {
  status: 'ok' | 'error'
  result: unknown
  displayType: DisplayType
  raw: string
  execMs: number
}

export interface ClassifiedIntent {
  intent: IntentCategory
  confidence: number
  matchedRuleId: string | null
  toolHint: string | null
}

export interface Rule {
  id: string
  priority: number
  patterns: RegExp[]
  contextRequired: string | null
  response: string
  setsContext: string | null
  tool: string | null
}

export interface TokenTag {
  token: string
  pos: 'noun' | 'verb' | 'adj' | 'number' | 'punct' | 'unknown'
}

export interface ExtractedEntities {
  dates: string[]
  numbers: number[]
  quoted: string[]
  urls: string[]
}

export interface ToolDefinition {
  name: string
  description: string
  triggerSyntax: string
  example: string
  outputType: DisplayType
  execute: (input: string) => Promise<ToolResult>
}

export interface ContextEntry {
  role: Role
  content: string
  meta: Record<string, unknown>
}

export interface ColorInfo {
  hex: string
  r: number
  g: number
  b: number
  h: number
  s: number
  l: number
}

export interface ContrastResult {
  ratio: number
  againstWhite: 'AAA' | 'AA' | 'fail'
  againstBlack: 'AAA' | 'AA' | 'fail'
}

export interface MathStep {
  expression: string
  result: number
}

export interface DiceResult {
  rolls: number[]
  total: number
  notation: string
}

export interface PasswordOptions {
  length: number
  lowercase: boolean
  uppercase: boolean
  digits: boolean
  symbols: boolean
}

export interface MemoryEntry {
  key: string
  value: string
  storedAt: number
}

export interface SysInfo {
  mode: AppMode
  turnCount: number
  contextFlags: string[]
  storedVars: number
  uptimeMs: number
  tools: Array<{ name: string; status: ToolStatus }>
}

export interface ChatStore {
  messages: Message[]
  mode: AppMode
  isStreaming: boolean
  toolStates: Record<string, ToolStatus>
  contextSummary: string
  addMessage: (msg: Message) => void
  updateLastMessage: (token: string) => void
  setMode: (mode: AppMode) => void
  setStreaming: (v: boolean) => void
  setToolStatus: (tool: string, status: ToolStatus) => void
  setContextSummary: (s: string) => void
  clearSession: () => void
}

export interface ApiChatRequest {
  messages: Array<{ role: Role; content: string }>
  context: string
  toolResults?: string
}

export interface ApiChatFallback {
  fallback: true
}

export interface ApiChatStreamToken {
  token: string
}

export interface ApiChatStreamDone {
  done: true
  usage: { input_tokens: number; output_tokens: number }
}

export type ApiChatStreamEvent = ApiChatStreamToken | ApiChatStreamDone

export interface ApiToolsRequest {
  tool: string
  input: string
  chain?: string
}

export interface ApiValidateResponse {
  hasKey: boolean
}

export type ThemePreference = 'light' | 'dark' | 'system'
