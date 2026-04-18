// ─────────────────────────────────────────────────────────────
// MACHINE MIND — ToolRow Component
// Single tool row within the tray — name, description, status dot.
// ─────────────────────────────────────────────────────────────

'use client'

import type { ToolStatus } from '@/lib/types'

interface ToolRowProps {
  name: string
  description: string
  status: ToolStatus
  onClick: () => void
}

const STATUS_COLORS: Record<ToolStatus, string> = {
  idle: 'bg-[var(--mm-text-muted)]',
  running: 'bg-[var(--mm-accent)]',
  done: 'bg-[var(--mm-success)]',
  error: 'bg-[var(--mm-error)]',
}

export function ToolRow({ name, description, status, onClick }: ToolRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-[var(--mm-duration-fast)] ease-[var(--mm-ease)] hover:bg-[var(--mm-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]"
      title={`${name}: ${description}`}
    >
      {/* Status dot */}
      <span className="relative flex shrink-0 items-center justify-center">
        <span
          className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[status]}`}
        />
        {status === 'running' && (
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[var(--mm-accent)] opacity-75" />
        )}
      </span>

      {/* Name + description */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--mm-text-primary)]">
          {name}
        </span>
        <span className="block truncate text-xs text-[var(--mm-text-muted)] group-hover:text-[var(--mm-text-secondary)] transition-colors duration-[var(--mm-duration-fast)]">
          {description}
        </span>
      </span>

      {/* Status label (visible on hover) */}
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-0 transition-opacity duration-[var(--mm-duration-fast)] group-hover:opacity-100 ${
          status === 'idle'
            ? 'bg-[var(--mm-bg-tertiary)] text-[var(--mm-text-muted)]'
            : status === 'running'
              ? 'bg-[var(--mm-accent-muted)] text-[var(--mm-accent-text)]'
              : status === 'done'
                ? 'bg-[var(--mm-bg-tertiary)] text-[var(--mm-success)]'
                : 'bg-[var(--mm-bg-tertiary)] text-[var(--mm-error)]'
        }`}
      >
        {status}
      </span>
    </button>
  )
}
