// ─────────────────────────────────────────────────────────────
// MACHINE MIND — StatusBar Component
// Mode pill, pulsing dot, gear, token count.
// Extracted from ChatShell for reusability.
// ─────────────────────────────────────────────────────────────

'use client'

interface StatusBarProps {
  mode: string
  isStreaming: boolean
  onToggleMode: () => void
  onToggleTray: () => void
  onOpenSettings: () => void
  trayOpen: boolean
  turnCount?: number
}

export function StatusBar({
  mode,
  isStreaming,
  onToggleMode,
  onToggleTray,
  onOpenSettings,
  trayOpen,
  turnCount,
}: StatusBarProps) {
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

        <span
          className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--mm-text-primary)]"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          {/* Pulsing dot — green idle, fast-pulse when streaming */}
          <span
            className={`inline-block size-2 rounded-full bg-[var(--mm-success)] ${
              isStreaming ? 'mm-animate-streaming' : 'mm-animate-status-dot'
            }`}
            style={{ willChange: 'transform' }}
          />
          MACHINE MIND
        </span>
      </div>

      {/* Center: Mode pill + turn count */}
      <div className="flex items-center gap-2">
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
        {turnCount !== undefined && turnCount > 0 && (
          <span className="font-mono text-[10px] text-[var(--mm-text-muted)]">
            {turnCount} turns
          </span>
        )}
      </div>

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
