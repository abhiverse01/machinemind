// ─────────────────────────────────────────────────────────────
// MACHINE MIND — InputBar
// Auto-resize textarea + accent send button.
// Enter sends, Shift+Enter for newline. Monospace input.
// v4.0: Rotating placeholder hints every 8s.
// ─────────────────────────────────────────────────────────────

'use client'

import { forwardRef, useCallback, useRef, useState, useEffect, type KeyboardEvent, type FormEvent } from 'react'
import { useChat } from '@/hooks/useChat'

const MAX_HEIGHT = 160
const LINE_HEIGHT = 24

const PLACEHOLDERS = [
  'type anything. i understand humans.',
  'try: "whats 5km in miles"',
  'try: "yo hash this: hello world"',
  'try: !roll 2d6',
  'try: "encode hey to base64"',
  'try: "remember that mykey is abc123"',
]

export const InputBar = forwardRef<HTMLTextAreaElement>(function InputBar(_props, forwardedRef) {
  const { send, isStreaming } = useChat()
  const [value, setValue] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const internalRef = useRef<HTMLTextAreaElement>(null)

  // Combine forwarded ref with internal ref
  const setRefs = useCallback(
    (el: HTMLTextAreaElement | null) => {
      internalRef.current = el
      if (typeof forwardedRef === 'function') {
        forwardedRef(el)
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
      }
    },
    [forwardedRef],
  )

  // Use internalRef for all operations
  const textareaRef = internalRef

  // Rotate placeholder every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

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
        ref={setRefs}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDERS[placeholderIdx]}
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
})
