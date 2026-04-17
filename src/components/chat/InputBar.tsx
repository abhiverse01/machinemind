// ─────────────────────────────────────────────────────────────
// MACHINE MIND — InputBar
// Auto-resize textarea + accent send button.
// Enter sends, Shift+Enter for newline. Monospace input.
// ─────────────────────────────────────────────────────────────

'use client'

import { useCallback, useRef, useState, type KeyboardEvent, type FormEvent } from 'react'
import { useChat } from '@/hooks/useChat'

const MAX_HEIGHT = 160
const LINE_HEIGHT = 24

export function InputBar() {
  const { send, isStreaming } = useChat()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, MAX_HEIGHT)
    el.style.height = `${newHeight}px`
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      requestAnimationFrame(adjustHeight)
    },
    [adjustHeight],
  )

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    send(trimmed)
    setValue('')
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    })
  }, [value, isStreaming, send])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      handleSend()
    },
    [handleSend],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const isEmpty = value.trim().length === 0

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-[var(--mm-border)] bg-[var(--mm-bg-primary)] px-4 py-3"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (! for tools)"
        disabled={isStreaming}
        rows={1}
        className="
          flex-1 resize-none rounded-xl border border-[var(--mm-border)]
          bg-[var(--mm-bg-secondary)] px-4 py-2.5
          text-sm leading-6 text-[var(--mm-text-primary)]
          placeholder:text-[var(--mm-text-muted)]
          transition-colors duration-150
          focus:border-[var(--mm-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--mm-accent)]
          disabled:opacity-50
        "
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          maxHeight: `${MAX_HEIGHT}px`,
          lineHeight: `${LINE_HEIGHT}px`,
          overflowY: 'auto',
        }}
        aria-label="Chat message input"
      />

      <button
        type="submit"
        disabled={isEmpty || isStreaming}
        className="
          flex size-10 shrink-0 items-center justify-center rounded-xl
          bg-[var(--mm-accent)] text-white
          transition-all duration-150
          hover:opacity-90
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)] focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-40
        "
        aria-label="Send message"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  )
}
