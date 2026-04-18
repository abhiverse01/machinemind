// ─────────────────────────────────────────────────────────────
// MACHINE MIND — ChatShell
// Three-panel layout orchestrator: Status bar, Tool tray, Chat.
// Responsive: tray collapses to icon rail on mobile (≤768px).
// ─────────────────────────────────────────────────────────────

'use client'

import { useState, useCallback, useRef } from 'react'
import { useChatStore } from '@/store/chat'
import { useKeyboard } from '@/hooks/useKeyboard'
import { ChatHistory } from './ChatHistory'
import { InputBar } from './InputBar'

// ── Status Bar ──────────────────────────────────────────────

function StatusBar({
  mode,
  onToggleMode,
  onToggleTray,
  trayOpen,
}: {
  mode: string
  onToggleMode: () => void
  onToggleTray: () => void
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

        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--mm-text-primary)]">
          <span className="inline-block size-2 rounded-full bg-[var(--mm-success)]" />
          MACHINE MIND
        </span>
      </div>

      {/* Center: Mode toggle */}
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
        {mode === 'rule_engine' ? 'Rule Engine' : 'AI Relay'}
      </button>

      {/* Right: Settings */}
      <button
        className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--mm-bg-tertiary)]"
        aria-label="Settings"
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

// ── Tool Tray ───────────────────────────────────────────────

const TOOLS = [
  { id: 'calculator', label: 'Math', icon: '∑' },
  { id: 'color', label: 'Color', icon: '◆' },
  { id: 'converter', label: 'Convert', icon: '⇄' },
  { id: 'encoder', label: 'Encode', icon: '{ }' },
  { id: 'hash', label: 'Hash', icon: '#' },
  { id: 'regex', label: 'Regex', icon: '.*' },
  { id: 'random', label: 'Random', icon: '🎲' },
  { id: 'clock', label: 'Clock', icon: '⏱' },
  { id: 'memory', label: 'Memory', icon: '📌' },
  { id: 'json', label: 'JSON', icon: '{}' },
  { id: 'word', label: 'Words', icon: 'Aa' },
  { id: 'sysinfo', label: 'System', icon: '⚙' },
]

function ToolTray({ open, toolStates }: { open: boolean; toolStates: Record<string, string> }) {
  return (
    <aside
      className={`
        shrink-0 overflow-hidden border-r border-[var(--mm-border)] bg-[var(--mm-bg-secondary)]
        transition-[width] duration-200 ease-[var(--mm-ease,cubic-bezier(0.4,0,0.2,1))]
        ${open ? 'w-[220px]' : 'w-12'}
      `}
      aria-label="Tool tray"
    >
      <div className="flex h-full flex-col">
        {/* Tray header */}
        {open && (
          <div className="border-b border-[var(--mm-border)] px-3 py-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--mm-text-muted)]">
              Tools
            </h2>
          </div>
        )}

        {/* Tool list */}
        <nav className="flex-1 overflow-y-auto py-1">
          {TOOLS.map((tool) => {
            const status = toolStates[tool.id]
            const statusColor =
              status === 'running'
                ? 'bg-amber-400'
                : status === 'done'
                  ? 'bg-[var(--mm-success)]'
                  : status === 'error'
                    ? 'bg-[var(--mm-error)]'
                    : 'bg-[var(--mm-text-muted)]'

            return (
              <button
                key={tool.id}
                className={`
                  flex w-full items-center gap-2.5
                  transition-colors duration-100
                  hover:bg-[var(--mm-bg-tertiary)]
                  ${open ? 'px-3 py-2' : 'justify-center px-0 py-2'}
                `}
                title={tool.label}
                aria-label={`${tool.label} tool${status ? ` (${status})` : ''}`}
              >
                <span
                  className={`
                    flex shrink-0 items-center justify-center
                    rounded-md text-[11px] font-bold
                    ${open
                      ? 'size-7 bg-[var(--mm-accent-muted)] text-[var(--mm-accent)]'
                      : 'size-7 text-[var(--mm-text-muted)]'
                    }
                  `}
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {tool.icon}
                </span>

                {open && (
                  <span className="flex flex-1 items-center justify-between">
                    <span className="text-xs font-medium text-[var(--mm-text-secondary)]">
                      {tool.label}
                    </span>
                    <span
                      className={`inline-block size-1.5 rounded-full ${statusColor} ${status === 'running' ? 'animate-pulse' : ''}`}
                    />
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Tray footer */}
        {open && (
          <div className="border-t border-[var(--mm-border)] px-3 py-2">
            <p className="text-[10px] text-[var(--mm-text-muted)]">
              Type{' '}
              <code
                className="rounded bg-[var(--mm-bg-tertiary)] px-1"
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
              >
                !tool
              </code>{' '}
              to invoke
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

// ── Shell (main export) ─────────────────────────────────────

export function ChatShell() {
  const mode = useChatStore((s) => s.mode)
  const setMode = useChatStore((s) => s.setMode)
  const toolStates = useChatStore((s) => s.toolStates)
  const clearSession = useChatStore((s) => s.clearSession)
  const inputBarRef = useRef<HTMLTextAreaElement | null>(null)

  const [trayOpen, setTrayOpen] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768,
  )

  const toggleTray = useCallback(() => setTrayOpen((v) => !v), [])

  const toggleMode = useCallback(() => {
    setMode(mode === 'rule_engine' ? 'ai_relay' : 'rule_engine')
  }, [mode, setMode])

  // Keyboard shortcuts
  useKeyboard({
    onToggleToolTray: toggleTray,
    onClearSession: clearSession,
    onFocusInput: () => inputBarRef.current?.focus(),
  })

  return (
    <div className="flex h-full flex-col bg-[var(--mm-bg-primary)]">
      {/* Status bar — 32px fixed */}
      <StatusBar
        mode={mode}
        onToggleMode={toggleMode}
        onToggleTray={toggleTray}
        trayOpen={trayOpen}
      />

      {/* Main area: tray + chat */}
      <div className="flex min-h-0 flex-1">
        {/* Tool tray */}
        <ToolTray open={trayOpen} toolStates={toolStates} />

        {/* Chat panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ChatHistory />
          <InputBar />
        </div>
      </div>
    </div>
  )
}
