// ─────────────────────────────────────────────────────────────
// MACHINE MIND — ChatShell
// Three-panel layout orchestrator: Status bar, Tool tray, Chat.
// Responsive: tray collapses to icon rail on mobile (<=768px).
// Integrates: SettingsPanel, BootSequence, ToolTray, StatusBar.
// ─────────────────────────────────────────────────────────────

'use client'

import { useState, useCallback, useRef } from 'react'
import { useChatStore } from '@/store/chat'
import { useKeyboard } from '@/hooks/useKeyboard'

import { ChatHistory } from './ChatHistory'
import { InputBar } from './InputBar'
import { ToolTray } from '@/components/tools/ToolTray'
import { SettingsPanel } from '@/components/ui/SettingsPanel'
import { BootSequence } from '@/components/ui/BootSequence'

// ── Status Bar ──────────────────────────────────────────────

function StatusBar({
  mode,
  isStreaming,
  onToggleMode,
  onToggleTray,
  onOpenSettings,
  trayOpen,
}: {
  mode: string
  isStreaming: boolean
  onToggleMode: () => void
  onToggleTray: () => void
  onOpenSettings: () => void
  trayOpen: boolean
}) {
  return (
    <header
      className="
        flex h-8 shrink-0 items-center justify-between
        border-b border-[var(--mm-border)] bg-[var(--mm-bg-primary)] px-3
      "
    >
      {/* Left: Menu toggle + Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTray}
          className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--mm-bg-tertiary)]"
          aria-label={trayOpen ? 'Collapse tool tray' : 'Expand tool tray'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--mm-text-secondary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--mm-text-primary)]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
          {/* Pulsing dot — indigo idle, fast-pulse when streaming */}
          <span
            className={`inline-block size-2 rounded-full bg-[var(--mm-success)] ${isStreaming ? 'mm-animate-streaming' : 'mm-animate-status-dot'}`}
            style={{ willChange: 'transform' }}
          />
          MACHINE MIND
        </span>
      </div>

      {/* Center: Mode pill */}
      <button
        onClick={onToggleMode}
        className="
          rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest
          transition-colors duration-150
          bg-[var(--mm-accent-muted)] text-[var(--mm-accent)]
          hover:opacity-80
        "
        aria-label={`Switch mode (current: ${mode})`}
      >
        {mode === 'rule_engine' ? 'Rule Engine' : 'AI Relay Active'}
      </button>

      {/* Right: Gear icon → opens SettingsPanel */}
      <button
        onClick={onOpenSettings}
        className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--mm-bg-tertiary)]"
        aria-label="Open settings"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--mm-text-secondary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </header>
  )
}

// ── Shell (main export) ─────────────────────────────────────

export function ChatShell() {
  const mode = useChatStore((s) => s.mode)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const setMode = useChatStore((s) => s.setMode)
  const clearSession = useChatStore((s) => s.clearSession)

  const [trayOpen, setTrayOpen] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768,
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Check sessionStorage synchronously to avoid flash of boot screen
  const [booting, setBooting] = useState(() =>
    typeof window === 'undefined' || !sessionStorage.getItem('mm_booted')
  )
  const inputBarRef = useRef<HTMLTextAreaElement | null>(null)

  const toggleTray = useCallback(() => setTrayOpen((v) => !v), [])

  const toggleMode = useCallback(() => {
    // If switching to AI relay, check if key exists first
    if (mode === 'rule_engine') {
      // Open settings to let user enable AI mode through the proper channel
      setSettingsOpen(true)
      return
    }
    setMode('rule_engine')
  }, [mode, setMode])

  // Keyboard shortcuts
  useKeyboard({
    onToggleToolTray: toggleTray,
    onClearSession: clearSession,
    onFocusInput: () => inputBarRef.current?.focus(),
    onToggleSettings: () => setSettingsOpen((v) => !v),
  })

  if (booting) {
    return (
      <BootSequence
        onComplete={() => setBooting(false)}
      />
    )
  }

  return (
    <div className="flex h-full flex-col bg-[var(--mm-bg-primary)]">
      {/* Status bar — 32px fixed */}
      <StatusBar
        mode={mode}
        isStreaming={isStreaming}
        onToggleMode={toggleMode}
        onToggleTray={toggleTray}
        onOpenSettings={() => setSettingsOpen(true)}
        trayOpen={trayOpen}
      />

      {/* Main area: tray + chat */}
      <div className="flex min-h-0 flex-1">
        {/* Tool tray */}
        <ToolTray />

        {/* Chat panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ChatHistory />
          <InputBar />
        </div>
      </div>

      {/* Settings panel drawer */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
