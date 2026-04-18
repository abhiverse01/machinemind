// ─────────────────────────────────────────────────────────────
// MACHINE MIND — ToolTray Component
// Collapsible tool sidebar: 220px on desktop, 48px icon-only on mobile.
// Shows all 12 tools with status indicators.
// Clicking a tool inserts "!toolname " into the input via callback.
// ─────────────────────────────────────────────────────────────

'use client'

import { useMemo, useCallback } from 'react'
import { useChatStore } from '@/store/chat'
import { useIsMobile } from '@/hooks/use-mobile'
import { listTools } from '@/lib/tools/registry'
import { ToolRow } from './ToolRow'
import type { ToolStatus } from '@/lib/types'

// Simple emoji icons for each tool — keyed by name
const TOOL_ICONS: Record<string, string> = {
  calculator: '\u{1F522}',
  clock: '\u{23F0}',
  converter: '\u{1F4CF}',
  encoder: '\u{1F510}',
  hash: '\u{1F511}',
  memory: '\u{1F9E0}',
  wordtools: '\u{1F4D6}',
  json: '\u{1F4CB}',
  regex: '\u{1F50D}',
  random: '\u{1F3B2}',
  color: '\u{1F3A8}',
  sysinfo: '\u{1F4BB}',
}

interface ToolTrayProps {
  onToolClick?: (triggerSyntax: string) => void
}

export function ToolTray({ onToolClick }: ToolTrayProps) {
  const toolStates = useChatStore((s) => s.toolStates)
  const isMobile = useIsMobile()

  // Tool definitions are static — memoize
  const tools = useMemo(() => listTools(), [])

  const handleToolClick = useCallback(
    (triggerSyntax: string) => {
      // Extract the first word from triggerSyntax as the tool command
      // e.g. "calc <expr>" → "calc", "time [in <tz>]" → "time"
      const command = triggerSyntax.trim().split(/[\s\[]/)[0]
      if (onToolClick) {
        onToolClick(`!${command} `)
      }
    },
    [onToolClick],
  )

  return (
    <aside
      className="flex h-full shrink-0 flex-col border-r border-[var(--mm-border)] bg-[var(--mm-bg-secondary)] transition-[width] duration-[var(--mm-duration-base)] ease-[var(--mm-ease)]"
      style={{ width: isMobile ? 48 : 220 }}
      role="complementary"
      aria-label="Tool tray"
    >
      {/* Header */}
      {!isMobile && (
        <div className="border-b border-[var(--mm-border)] px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--mm-text-muted)]">
            Tools
          </h2>
        </div>
      )}

      {/* Tool list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2" style={{ scrollbarGutter: 'stable' }}>
        <ul className="flex flex-col gap-0.5 px-1" role="list">
          {tools.map((tool) => {
            const status: ToolStatus = toolStates[tool.name] ?? 'idle'
            return (
              <li key={tool.name}>
                {isMobile ? (
                  /* Icon-only mobile view */
                  <button
                    type="button"
                    onClick={() => handleToolClick(tool.triggerSyntax)}
                    className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-base transition-colors duration-[var(--mm-duration-fast)] ease-[var(--mm-ease)] hover:bg-[var(--mm-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]"
                    title={`${tool.name}: ${tool.description}`}
                    aria-label={`${tool.name} — ${tool.description}`}
                  >
                    <span className="select-none">{TOOL_ICONS[tool.name] ?? '\u{1F527}'}</span>
                    {/* Status dot overlay */}
                    <span
                      className={`absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ${
                        status === 'idle'
                          ? 'bg-[var(--mm-text-muted)]'
                          : status === 'running'
                            ? 'bg-[var(--mm-accent)]'
                            : status === 'done'
                              ? 'bg-[var(--mm-success)]'
                              : 'bg-[var(--mm-error)]'
                      }`}
                    />
                    {status === 'running' && (
                      <span className="absolute bottom-1 right-1 h-1.5 w-1.5 animate-ping rounded-full bg-[var(--mm-accent)] opacity-75" />
                    )}
                  </button>
                ) : (
                  /* Full row desktop view */
                  <ToolRow
                    name={tool.name}
                    description={tool.description}
                    status={status}
                    onClick={() => handleToolClick(tool.triggerSyntax)}
                  />
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Footer: tool count */}
      {!isMobile && (
        <div className="border-t border-[var(--mm-border)] px-4 py-2">
          <span className="text-[10px] font-mono text-[var(--mm-text-muted)]">
            {tools.length} tools available
          </span>
        </div>
      )}
    </aside>
  )
}
