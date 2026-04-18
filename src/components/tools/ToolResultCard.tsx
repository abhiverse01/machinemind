// ─────────────────────────────────────────────────────────────
// MACHINE MIND — ToolResultCard Component
// Typed result renderer for tool results shown inline in chat.
// Renders differently based on displayType:
//   text | code | table | color_swatch | error
// ─────────────────────────────────────────────────────────────

'use client'

import type { ToolResult, DisplayType, ColorInfo } from '@/lib/types'

interface ToolResultCardProps {
  toolName: string
  result: ToolResult
}

// ── Text renderer ───────────────────────────────────────────
function TextBlock({ content }: { content: string }) {
  return (
    <div className="whitespace-pre-wrap break-words text-sm text-[var(--mm-text-primary)] leading-relaxed">
      {content}
    </div>
  )
}

// ── Code block renderer ─────────────────────────────────────
function CodeBlock({ content }: { content: string }) {
  return (
    <div className="overflow-x-auto rounded-md bg-[var(--mm-bg-tertiary)] p-4">
      <pre className="font-mono text-sm text-[var(--mm-text-primary)] leading-relaxed whitespace-pre-wrap break-words">
        <code>{content}</code>
      </pre>
    </div>
  )
}

// ── Table renderer ──────────────────────────────────────────
function TableBlock({ data }: { data: unknown }) {
  // Expect array of objects or array of arrays
  let headers: string[] = []
  let rows: string[][] = []

  if (Array.isArray(data) && data.length > 0) {
    if (Array.isArray(data[0])) {
      // First row is header, rest are data
      headers = (data[0] as unknown[]).map(String)
      rows = data.slice(1).map((row: unknown) =>
        (row as unknown[]).map(String),
      )
    } else if (typeof data[0] === 'object' && data[0] !== null) {
      // Array of objects — keys are headers
      headers = Object.keys(data[0] as Record<string, unknown>)
      rows = data.map((obj: unknown) =>
        headers.map((h) => String((obj as Record<string, unknown>)[h] ?? '')),
      )
    }
  }

  if (headers.length === 0) {
    return <TextBlock content={JSON.stringify(data, null, 2)} />
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[var(--mm-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--mm-border)] bg-[var(--mm-bg-tertiary)]">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold text-[var(--mm-text-secondary)] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-[var(--mm-border)] last:border-0"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2 text-[var(--mm-text-primary)] whitespace-nowrap"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Color swatch renderer ───────────────────────────────────
function ColorSwatch({ data }: { data: unknown }) {
  // Expect ColorInfo or similar
  const info = data as Partial<ColorInfo> | null
  const hex = info?.hex ?? '#000000'
  const r = info?.r ?? 0
  const g = info?.g ?? 0
  const b = info?.b ?? 0
  const h = info?.h ?? 0
  const s = info?.s ?? 0
  const l = info?.l ?? 0

  return (
    <div className="flex items-center gap-4 rounded-md border border-[var(--mm-border)] bg-[var(--mm-bg-secondary)] p-4">
      {/* Color square */}
      <div
        className="h-14 w-14 shrink-0 rounded-lg border border-[var(--mm-border)] shadow-sm"
        style={{ backgroundColor: hex }}
        aria-label={`Color swatch: ${hex}`}
      />
      {/* Text info */}
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <p className="font-mono font-semibold text-[var(--mm-text-primary)]">
          {hex}
        </p>
        <p className="font-mono text-xs text-[var(--mm-text-secondary)]">
          RGB({r}, {g}, {b})
        </p>
        <p className="font-mono text-xs text-[var(--mm-text-secondary)]">
          HSL({h}, {s}%, {l}%)
        </p>
      </div>
    </div>
  )
}

// ── List renderer ───────────────────────────────────────────
function ListBlock({ data }: { data: unknown }) {
  const items = Array.isArray(data) ? data : [data]
  return (
    <ul className="space-y-1 text-sm text-[var(--mm-text-primary)]">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--mm-accent)]" />
          <span className="whitespace-pre-wrap break-words">{String(item)}</span>
        </li>
      ))}
    </ul>
  )
}

// ── Error card renderer ─────────────────────────────────────
function ErrorCard({ content, data }: { content: string; data: unknown }) {
  const errorMessage =
    (data as { error?: string } | null)?.error ?? content

  return (
    <div className="rounded-md border border-[var(--mm-error)] bg-[var(--mm-bg-secondary)] p-4">
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <span className="mt-0.5 text-[var(--mm-error)]" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--mm-error)]">Error</p>
          <p className="mt-1 text-sm text-[var(--mm-text-secondary)] whitespace-pre-wrap break-words">
            {errorMessage}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main renderer ───────────────────────────────────────────
const RENDERERS: Record<
  DisplayType,
  (content: string, data: unknown) => React.JSX.Element
> = {
  text: (content) => <TextBlock content={content} />,
  code: (content) => <CodeBlock content={content} />,
  table: (_content, data) => <TableBlock data={data} />,
  color_swatch: (_content, data) => <ColorSwatch data={data} />,
  error: (content, data) => <ErrorCard content={content} data={data} />,
  list: (_content, data) => <ListBlock data={data} />,
}

export function ToolResultCard({ toolName, result }: ToolResultCardProps) {
  const { displayType, raw, result: data, execMs } = result
  const renderer = RENDERERS[displayType] ?? RENDERERS.text

  return (
    <div className="my-2 rounded-lg border border-[var(--mm-border)] bg-[var(--mm-bg-secondary)] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-[var(--mm-border)] px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--mm-accent-text)]">
          {toolName}
        </span>
        {execMs > 0 && (
          <span className="font-mono text-[10px] text-[var(--mm-text-muted)]">
            {execMs}ms
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        {renderer(raw, data)}
      </div>
    </div>
  )
}
