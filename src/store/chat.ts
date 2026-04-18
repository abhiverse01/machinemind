// ─────────────────────────────────────────────────────────────
// MACHINE MIND v5.0 — Zustand Store
// Single source of truth for all UI state.
// No prop drilling. No local state for shared concerns.
// v5.0: WorkingMemory, ConversationStateMachine, tool frequency,
//       implicit facts, doc mode, abort controller.
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand'
import type { Message, AppMode, ToolStatus, ToolResult, ConversationState } from '@/lib/types'
import { WorkingMemory } from '@/lib/nlp/workingMemory'
import { ConversationStateMachine } from '@/lib/nlp/stateMachine'

interface ChatStore {
  // ── Core state ──────────────────────────────────────────────
  messages: Message[]
  mode: AppMode
  isStreaming: boolean
  toolStates: Record<string, ToolStatus>
  contextSummary: string

  // ── v5.0 additions ─────────────────────────────────────────
  workingMemory: WorkingMemory
  stateMachine: ConversationStateMachine
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
  writeWorkingMemory: (toolName: string, result: ToolResult, topic?: string) => void
  incrementToolFrequency: (toolName: string) => void
  getToolsByFrequency: () => Array<{ name: string; count: number }>
  addImplicitFact: (key: string, value: string) => void
  setDocModeContent: (content: string | null) => void
  setAbortController: (ac: AbortController | null) => void
  abortStream: () => void
  updateConversationState: (input: string, tone: string, charCount: number) => void
  setConversationState: (state: ConversationState) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  mode: 'rule_engine',
  isStreaming: false,
  toolStates: {},
  contextSummary: '',
  workingMemory: new WorkingMemory(),
  stateMachine: new ConversationStateMachine(),
  toolCallFrequency: new Map(),
  conversationState: 'FRESH',
  implicitFacts: new Map(),
  docModeContent: null,
  abortController: null,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  updateLastMessage: (token) => set((s) => {
    const msgs = [...s.messages]
    const last = msgs[msgs.length - 1]
    if (last && last.role === 'assistant') {
      msgs[msgs.length - 1] = { ...last, content: last.content + token }
    }
    return { messages: msgs }
  }),

  setMode: (mode) => set({ mode }),
  setStreaming: (v) => set({ isStreaming: v }),

  setToolStatus: (tool, status) => set((s) => ({
    toolStates: { ...s.toolStates, [tool]: status },
  })),

  setContextSummary: (s) => set({ contextSummary: s }),

  clearSession: () => {
    const state = get()
    state.workingMemory.clear()
    state.stateMachine.reset()
    return set({
      messages: [],
      toolStates: {},
      contextSummary: '',
      isStreaming: false,
      docModeContent: null,
      conversationState: 'FRESH',
      implicitFacts: new Map(),
      toolCallFrequency: new Map(),
      abortController: null,
    })
  },

  writeWorkingMemory: (toolName, result, turn) => {
    get().workingMemory.write(toolName, result, turn)
    set({}) // trigger re-render
  },

  incrementToolFrequency: (toolName) => set((s) => {
    const freq = new Map(s.toolCallFrequency)
    freq.set(toolName, (freq.get(toolName) ?? 0) + 1)
    return { toolCallFrequency: freq }
  }),

  getToolsByFrequency: () => {
    const freq = get().toolCallFrequency
    return [...freq.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  },

  addImplicitFact: (key, value) => set((s) => {
    const facts = new Map(s.implicitFacts)
    facts.set(key, value)
    return { implicitFacts: facts }
  }),

  setDocModeContent: (content) => set({ docModeContent: content }),

  setAbortController: (ac) => set({ abortController: ac }),

  abortStream: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
      set({ abortController: null, isStreaming: false })
    }
  },

  updateConversationState: (input, tone, charCount) => {
    const state = get()
    const newState = state.stateMachine.transition(input, tone as import('@/lib/types').Tone, charCount)
    set({ conversationState: newState })
  },

  setConversationState: (state) => set({ conversationState: state }),
}))
