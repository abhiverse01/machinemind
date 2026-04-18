// ─────────────────────────────────────────────────────────────
// MACHINE MIND — ToolTray Component
// Collapsible tool sidebar: 220px open on desktop, 48px icon-only collapsed/mobile.
// Shows all tools with status indicators.
// Clicking a tool inserts "!toolname " into the input via callback.
// v5.0: Frequency-based sorting — RECENTLY USED, ALL TOOLS, SYSTEM sections.
//       Count badges on recently used tools. diff & boolean icons.
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
  diff: '\u{1F4CA}',
  boolean: '\u{2705}',
}

interface ToolTrayProps {
  isOpen?: boolean
  onToolClick?: (triggerSyntax: string) => void
}

export function ToolTray({ isOpen = true, onToolClick }: ToolTrayProps) {
  const toolStates = useChatStore((s) => s.toolStates)
  const byFrequency = useChatStore((s) => s.getToolsByFrequency)()
  const isMobile = useIsMobile()

  // Tool definitions are static — memoize
  const tools = useMemo(() => listTools(), [])

  // ── v5.0: Split into three sections ──────────────────────────
  const recentNames = useMemo(
    () => new Set(byFrequency.slice(0, 3).map((t) => t.name)),
    [byFrequency],
  )
  const recentCountMap = useMemo(
    () => new Map(byFrequency.map((t) => [t.name, t.count])),
    [byFrequency],
  )

  const recentTools = useMemo(
    () => tools.filter((t) => recentNames.has(t.name)),
    [tools, recentNames],
  )

  const sysinfoTool = useMemo(
    () => tools.find((t) => t.name === 'sysinfo'),
    [tools],
  )

  const allToolsList = useMemo(
    () => tools.filter((t) => !recentNames.has(t.name) && t.name !== 'sysinfo'),
    [tools, recentNames],
  )

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

  // On mobile, always show icon-only rail regardless of isOpen
  // On desktop, isOpen controls full vs icon-only
  const showFullTray = !isMobile && isOpen
  const trayWidth = isMobile ? 48 : isOpen ? 220 : 48

  return (
    <aside
      className="flex h-full shrink-0 flex-col border-r border-[var(--mm-border)] bg-[var(--mm-bg-secondary)] transition-[width] duration-[var(--mm-duration-base)] ease-[var(--mm-ease)]"
      style={{ width: trayWidth }}
      role="complementary"
      aria-label="Tool tray"
    >
      {/* Header */}
      {showFullTray && (
        <div className="border-b border-[var(--mm-border)] px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--mm-text-muted)]">
            Tools
          </h2>
        </div>
      )}

      {/* Tool list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 mm-scrollbar" style={{ scrollbarGutter: 'stable' }}>
        {/* ── Recently used section ──────────────────────────────── */}
        {recentTools.length > 0 && showFullTray && (
          <div className="border-b border-[var(--mm-border)] px-4 py-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--mm-text-muted)]">recent</h3>
          </div>
        )}

        <ul className="flex flex-col gap-0.5 px-1" role="list">
          {recentTools.map((tool) => {
            const status: ToolStatus = toolStates[tool.name] ?? 'idle'
            const callCount = recentCountMap.get(tool.name) ?? 0
            return (
              <li key={`recent-${tool.name}`}>
                {!showFullTray ? (
                  /* Icon-only collapsed / mobile view with count badge */
                  <button
                    type="button"
                    onClick={() => handleToolClick(tool.triggerSyntax)}
                    className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-base transition-colors duration-[var(--mm-duration-fast)] ease-[var(--mm-ease)] hover:bg-[var(--mm-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]"
                    title={`${tool.name}: ${tool.description} (${callCount} uses)`}
                    aria-label={`${tool.name} — ${tool.description} — used ${callCount} times`}
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
                    {/* Count badge */}
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--mm-accent)] px-1 text-[9px] font-bold leading-none text-white">
                      {callCount}
                    </span>
                  </button>
                ) : (
                  /* Full row desktop view with count badge */
                  <div className="relative">
                    <ToolRow
                      name={tool.name}
                      description={tool.description}
                      status={status}
                      onClick={() => handleToolClick(tool.triggerSyntax)}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--mm-accent)] px-1.5 text-[10px] font-bold leading-none text-white">
                      {callCount}
                    </span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {/* ── All tools section ──────────────────────────────────── */}
        {showFullTray && (
          <div className="border-b border-t border-[var(--mm-border)] px-4 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--mm-text-muted)]">all tools</h3>
          </div>
        )}

        <ul className="flex flex-col gap-0.5 px-1" role="list">
          {allToolsList.map((tool) => {
            const status: ToolStatus = toolStates[tool.name] ?? 'idle'
            return (
              <li key={tool.name}>
                {!showFullTray ? (
                  /* Icon-only collapsed / mobile view */
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

        {/* ── System section (pinned at bottom) ──────────────────── */}
        {showFullTray && sysinfoTool && (
          <div className="border-b border-t border-[var(--mm-border)] px-4 py-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--mm-text-muted)]">system</h3>
          </div>
        )}

        {sysinfoTool && (
          <ul className="flex flex-col gap-0.5 px-1" role="list">
            <li key={sysinfoTool.name}>
              {!showFullTray ? (
                /* Icon-only collapsed / mobile view */
                <button
                  type="button"
                  onClick={() => handleToolClick(sysinfoTool.triggerSyntax)}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-base transition-colors duration-[var(--mm-duration-fast)] ease-[var(--mm-ease)] hover:bg-[var(--mm-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]"
                  title={`${sysinfoTool.name}: ${sysinfoTool.description}`}
                  aria-label={`${sysinfoTool.name} — ${sysinfoTool.description}`}
                >
                  <span className="select-none">{TOOL_ICONS[sysinfoTool.name] ?? '\u{1F527}'}</span>
                  {/* Status dot overlay */}
                  <span
                    className={`absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ${
                      (toolStates[sysinfoTool.name] ?? 'idle') === 'idle'
                        ? 'bg-[var(--mm-text-muted)]'
                        : (toolStates[sysinfoTool.name] ?? 'idle') === 'running'
                          ? 'bg-[var(--mm-accent)]'
                          : (toolStates[sysinfoTool.name] ?? 'idle') === 'done'
                            ? 'bg-[var(--mm-success)]'
                            : 'bg-[var(--mm-error)]'
                    }`}
                  />
                  {(toolStates[sysinfoTool.name] ?? 'idle') === 'running' && (
                    <span className="absolute bottom-1 right-1 h-1.5 w-1.5 animate-ping rounded-full bg-[var(--mm-accent)] opacity-75" />
                  )}
                </button>
              ) : (
                /* Full row desktop view */
                <ToolRow
                  name={sysinfoTool.name}
                  description={sysinfoTool.description}
                  status={toolStates[sysinfoTool.name] ?? 'idle'}
                  onClick={() => handleToolClick(sysinfoTool.triggerSyntax)}
                />
              )}
            </li>
          </ul>
        )}
      </div>

      {/* Footer: tool count */}
      {showFullTray && (
        <div className="border-t border-[var(--mm-border)] px-4 py-2">
          <span className="text-[10px] font-mono text-[var(--mm-text-muted)]">
            {tools.length} tools available
          </span>
        </div>
      )}
    </aside>
  )
}
