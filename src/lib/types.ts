// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Shared TypeScript Types v5.0
// Zero `any`. Every function is typed. Strict mode compliant.
// ─────────────────────────────────────────────────────────────

export type Role = 'user' | 'assistant' | 'system'

export type DisplayType = 'text' | 'code' | 'table' | 'color_swatch' | 'error' | 'list'

export type ToolStatus = 'idle' | 'running' | 'done' | 'error'

export type AppMode = 'rule_engine' | 'ai_relay'

export type Tone = 'frustrated' | 'curious' | 'playful' | 'urgent' | 'neutral'

export type HedgeLevel = 0 | 1 | 2 | 3

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
  | 'EMOTIONAL'
  | 'CONFUSION'
  | 'REPAIR'
  | 'PRESENCE'
  | 'WORD'
  | 'JSON'
  | 'BOOLEAN'
  | 'DIFF'
  | 'DOC_MODE'
  | 'UNKNOWN'

export interface ParsedInput {
  raw: string
  cleaned: string
  originalIntent: string
  corrections: Array<{ original: string; corrected: string }>
  tone: Tone
  hedgeLevel: HedgeLevel
  confidence: number
  emojiIntents: string[]
  wasCorrected: boolean
}

export interface ClassifiedIntent {
  intent: IntentCategory
  confidence: number
  matchedRuleId: string | null
  toolHint: string | null
  parsedInput: ParsedInput
}

export interface Message {
  id: string
  role: Role
  content: string
  displayType: DisplayType
  toolName?: string
  execMs?: number
  tokens?: number
  timestamp: number
  tone?: Tone
}

export interface ToolResult {
  status: 'ok' | 'error'
  result: unknown
  displayType: DisplayType
  raw: string
  execMs: number
  witInjection?: string
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

export interface ChainStep {
  toolName: string
  args: string
  result?: ToolResult
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
  // ── Core state ──────────────────────────────────────────────
  messages: Message[]
  mode: AppMode
  isStreaming: boolean
  toolStates: Record<string, ToolStatus>
  contextSummary: string

  // ── v5.0 additions ─────────────────────────────────────────
  workingMemory: unknown // WorkingMemory instance from lib/nlp/workingMemory
  stateMachine: unknown // ConversationStateMachine instance from lib/nlp/stateMachine
  toolCallFrequency: Map<string, number>
  conversationState: ConversationState
  implicitFacts: Map<string, string>
  docModeContent: string | null
  abortController: AbortController | null

  // ── Actions ────────────────────────────────────────────────
  addMessage: (msg: Message) => void
  updateLastMessage: (token: string) => void
  setMode: (mode: AppMode) => void
  setStreaming: (v: boolean) => void
  setToolStatus: (tool: string, status: ToolStatus) => void
  setContextSummary: (s: string) => void
  clearSession: () => void
  writeWorkingMemory: (toolName: string, result: ToolResult, turn: number) => void
  incrementToolFrequency: (toolName: string) => void
  getToolsByFrequency: () => Array<{ name: string; count: number }>
  addImplicitFact: (key: string, value: string) => void
  setDocModeContent: (content: string | null) => void
  setAbortController: (ac: AbortController | null) => void
  abortStream: () => void
  updateConversationState: (input: string, tone: string, charCount: number) => void
  setConversationState: (state: ConversationState) => void
}

export interface ApiChatRequest {
  messages: Array<{ role: Role; content: string }>
  context: string
  toolResults?: string
  tone?: Tone
  parsedInput?: ParsedInput
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

// ─────────────────────────────────────────────────────────────
// v5.0 — Conversation State Machine
// ─────────────────────────────────────────────────────────────

export type ConversationState = 'FRESH' | 'TOOL_CHAIN' | 'CLARIFYING' | 'EMOTIONAL' | 'DOC_MODE' | 'AI_RELAY'

export interface StateTransition {
  from: ConversationState
  to: ConversationState
  trigger: string
  turn: number
}

// ─────────────────────────────────────────────────────────────
// v5.0 — Working Memory Registers
// ─────────────────────────────────────────────────────────────

export interface WorkingMemoryRegisters {
  lastNumber:    { value: number;  expression: string;    tool: string; turn: number } | null
  lastString:    { value: string;  source: string;        tool: string; turn: number } | null
  lastColor:     { hex: string;    rgb: [number,number,number]; hsl: [number,number,number]; turn: number } | null
  lastJSON:      { value: unknown; raw: string;           depth: number; turn: number } | null
  lastList:      { items: string[]; source: string;       turn: number } | null
  lastBool:      { value: boolean; expression: string;    turn: number } | null
  lastDiff:      { original: string; modified: string;    type: 'char'|'word'|'json'; turn: number } | null
  lastUnit:      { value: number; unit: string; converted: number; toUnit: string; turn: number } | null
  lastEncoded:   { value: string; encoding: string;       original: string; turn: number } | null
  lastHash:      { value: string; algorithm: string;      input: string; turn: number } | null
  lastRandom:    { value: unknown; type: string;          turn: number } | null
  recentTool:    string | null
  recentTopic:   string | null
}

// ─────────────────────────────────────────────────────────────
// v5.0 — Value Extraction
// ─────────────────────────────────────────────────────────────

export interface ExtractedValues {
  numbers: Array<{ value: number; raw: string; position: number }>
  strings: Array<{ value: string; delimiter: 'quote'|'colon'|'implicit'; position: number }>
  emails: string[]
  urls: string[]
  units: Array<{ value: number; unit: string; position: number }>
  colors: Array<{ value: string; format: 'hex'|'rgb'|'hsl'|'name'; position: number }>
  dates: string[]
  ipAddresses: string[]
}

// ─────────────────────────────────────────────────────────────
// v5.0 — Implicit Facts
// ─────────────────────────────────────────────────────────────

export interface ImplicitFact {
  key: string
  value: string
  confidence: number
  pattern: string
  confirmation: string
}

// ─────────────────────────────────────────────────────────────
// v5.0 — Diff & Boolean
// ─────────────────────────────────────────────────────────────

export type DiffOp = 'equal' | 'added' | 'removed' | 'changed'

export interface DiffSegment {
  op: DiffOp
  value: string
  oldValue?: string
}

export interface DiffResult {
  segments: DiffSegment[]
  addedCount: number
  removedCount: number
  changedCount: number
  similarity: number
  mode: 'char' | 'word' | 'json'
}

export interface BooleanResult {
  value: boolean
  expression: string
  proof?: string
}

// ─────────────────────────────────────────────────────────────
// v5.0 — Working Memory Resolve Result
// ─────────────────────────────────────────────────────────────

export interface WMResolveResult {
  resolved: string
  register: string
  value: unknown
}
