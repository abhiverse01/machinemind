// ─────────────────────────────────────────────────────────────
// MACHINE MIND — InputBar
// Auto-resize textarea + accent send button.
// Enter sends, Shift+Enter for newline. Monospace input.
// v4.0: Rotating placeholder hints every 8s.
// v5.0: Paste detection → doc mode preview card.
//       Stream abort via stop icon or Escape key.
//       detectDocType helper for auto-routing.
// ─────────────────────────────────────────────────────────────

'use client'

import { useCallback, useRef, useState, useEffect, type KeyboardEvent, type FormEvent } from 'react'
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

function detectDocType(text: string): string {
  if (/^\s*[\[{]/.test(text.trim())) return 'JSON inspector'
  if (/^```/.test(text) || text.includes('\n  ')) return 'code analysis'
  if (text.length > 500) return 'word analysis'
  return 'text analysis'
}

export function InputBar() {
  const { send, isStreaming, abort } = useChat()
  const [value, setValue] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [isDocMode, setIsDocMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    setIsDocMode(false)
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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text')
    const lineCount = (pasted.match(/\n/g) ?? []).length
    const looksLikeJson = /^\s*[\[{]/.test(pasted.trim())
    const looksLikeCode = /^```/.test(pasted) || pasted.includes('\n  ') || pasted.includes('\n\t')
    if (pasted.length > 200 || lineCount >= 3 || looksLikeJson || looksLikeCode) {
      setIsDocMode(true)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
      if (e.key === 'Escape' && isStreaming) {
        e.preventDefault()
        abort()
      }
    },
    [handleSend, isStreaming, abort],
  )

  const isEmpty = value.trim().length === 0

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col border-t border-[var(--mm-border)] bg-[var(--mm-bg-primary)] px-4 py-3"
    >
      {/* Doc mode preview card */}
      {isDocMode && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--mm-border)] bg-[var(--mm-bg-secondary)] px-3 py-2 text-xs text-[var(--mm-text-muted)]">
          <span className="text-[var(--mm-accent)]">Document detected</span>
          <span>{value.length} chars</span>
          <span>{(value.match(/\n/g) ?? []).length + 1} lines</span>
          <span>Auto-routing to: {detectDocType(value)}</span>
          <button
            type="button"
            onClick={() => setIsDocMode(false)}
            className="ml-auto text-[var(--mm-text-muted)] hover:text-[var(--mm-text-primary)]"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          rows={1}
          className="
            flex-1 resize-none rounded-xl border border-[var(--mm-border)]
            bg-[var(--mm-bg-secondary)] px-4 py-2.5
            text-sm leading-6 text-[var(--mm-text-primary)]
            placeholder:text-[var(--mm-text-muted)]
            transition-colors duration-150
            focus:border-[var(--mm-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--mm-accent)]
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
          type="button"
          onClick={isStreaming ? abort : handleSend}
          disabled={!isStreaming && isEmpty}
          className={`
            flex size-10 shrink-0 items-center justify-center rounded-xl
            text-white
            transition-all duration-150
            hover:opacity-90
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-40
            ${isStreaming ? 'bg-[var(--mm-error)] focus-visible:ring-[var(--mm-error)]' : 'bg-[var(--mm-accent)] focus-visible:ring-[var(--mm-accent)]'}
          `}
          aria-label={isStreaming ? 'Abort stream' : 'Send message'}
        >
          {isStreaming ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          )}
        </button>
      </div>
    </form>
  )
}
