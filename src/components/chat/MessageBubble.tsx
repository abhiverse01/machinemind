// ─────────────────────────────────────────────────────────────
// MACHINE MIND — MessageBubble
// Renders a single chat message with role-based styling,
// display-type variants, metadata badges, and hover timestamp.
// ─────────────────────────────────────────────────────────────

'use client'

import { useState } from 'react'
import type { Message } from '@/lib/types'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div
      className={`group flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`
          relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5
          transition-colors duration-150
          ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}
          ${message.displayType === 'error'
            ? 'border border-[var(--mm-error)]/30 bg-[var(--mm-error)]/5'
            : isUser
              ? 'bg-[var(--mm-accent-muted)] text-[var(--mm-accent)]'
              : 'bg-[var(--mm-bg-secondary)] text-[var(--mm-text-primary)]'
          }
        `}
      >
        {/* Tool name badge */}
        {message.toolName && (
          <span
            className="mb-1.5 inline-block rounded-full bg-[var(--mm-accent-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--mm-accent)]"
          >
            {message.toolName}
          </span>
        )}

        {/* Content */}
        <MessageContent content={message.content} displayType={message.displayType} />

        {/* Metadata row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {message.execMs != null && (
            <span className="text-[10px] font-medium text-[var(--mm-text-muted)]">
              {message.execMs}ms
            </span>
          )}
          {message.tokens != null && (
            <span className="text-[10px] font-medium text-[var(--mm-text-muted)]">
              {message.tokens} tokens
            </span>
          )}
        </div>

        {/* Timestamp — visible on hover */}
        {hovered && (
          <span
            className={`
              absolute top-0.5 text-[10px] text-[var(--mm-text-muted)]
              transition-opacity duration-200
              ${isUser ? '-left-[70px]' : '-right-[70px]'}
            `}
          >
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Display type renderers ──────────────────────────────────

function MessageContent({
  content,
  displayType,
}: {
  content: string
  displayType: Message['displayType']
}) {
  switch (displayType) {
    case 'code':
      return (
        <pre
          className="overflow-x-auto rounded-lg bg-[var(--mm-bg-tertiary)] p-3 text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          <code>{content}</code>
        </pre>
      )

    case 'color_swatch':
      return <ColorSwatchContent content={content} />

    case 'error':
      return (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-[var(--mm-error)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </span>
          <span className="text-sm text-[var(--mm-error)]">{content}</span>
        </div>
      )

    case 'table':
      return <TableContent content={content} />

    case 'text':
    default:
      return (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      )
  }
}

// ── Color swatch renderer ───────────────────────────────────

function ColorSwatchContent({ content }: { content: string }) {
  const hexMatch = content.match(/#[0-9a-fA-F]{3,8}/)
  const hex = hexMatch?.[0] ?? '#888888'

  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 shrink-0 rounded-lg border border-[var(--mm-border)]"
        style={{ backgroundColor: hex }}
        aria-label={`Color swatch: ${hex}`}
      />
      <span className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {content}
      </span>
    </div>
  )
}

// ── Table renderer ──────────────────────────────────────────

function TableContent({ content }: { content: string }) {
  const rows = content
    .trim()
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) =>
      line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0),
    )
    .filter((row) => row.length > 0)

  if (rows.length === 0) {
    return <p className="text-sm">{content}</p>
  }

  const header = rows[0]
  const body = rows.slice(1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--mm-border)]">
            {header.map((cell, i) => (
              <th
                key={i}
                className="px-3 py-1.5 font-semibold text-[var(--mm-text-secondary)]"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-[var(--mm-border)] last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5">
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

// ── Time formatter ──────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}
