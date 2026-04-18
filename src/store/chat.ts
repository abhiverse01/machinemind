// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Zustand Store
// Single source of truth for all UI state.
// No prop drilling. No local state for shared concerns.
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand'
import type { Message, AppMode, ToolStatus, ChatStore } from '@/lib/types'

export const useChatStore = create<ChatStore>((set) => ({
  messages: [] as Message[],
  mode: 'rule_engine' as AppMode,
  isStreaming: false,
  toolStates: {} as Record<string, ToolStatus>,
  contextSummary: '',

  addMessage: (msg: Message) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  updateLastMessage: (token: string) =>
    set((state) => {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + token }
      }
      return { messages: msgs }
    }),

  setMode: (mode: AppMode) => set({ mode }),

  setStreaming: (v: boolean) => set({ isStreaming: v }),

  setToolStatus: (tool: string, status: ToolStatus) =>
    set((state) => ({
      toolStates: { ...state.toolStates, [tool]: status },
    })),

  setContextSummary: (s: string) => set({ contextSummary: s }),

  clearSession: () =>
    set({
      messages: [],
      toolStates: {},
      contextSummary: '',
      isStreaming: false,
    }),
}))
