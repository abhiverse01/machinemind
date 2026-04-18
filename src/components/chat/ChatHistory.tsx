// ─────────────────────────────────────────────────────────────
// MACHINE MIND — ChatHistory
// Message list with smooth auto-scroll.
// Shows TypingIndicator while streaming.
// ─────────────────────────────────────────────────────────────

'use client'

import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chat'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

export function ChatHistory() {
  const messages = useChatStore((s) => s.messages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change or streaming state changes
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [messages, isStreaming])

  // Empty state
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <div
          className="flex size-14 items-center justify-center rounded-2xl bg-[var(--mm-accent-muted)]"
          aria-hidden="true"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--mm-accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-sm text-[var(--mm-text-muted)]">
          Start a conversation with MACHINE MIND
        </p>
        <p className="text-xs text-[var(--mm-text-muted)]">
          Type{' '}
          <code
            className="rounded bg-[var(--mm-bg-tertiary)] px-1.5 py-0.5"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            !help
          </code>{' '}
          to see available tools
        </p>
      </div>
    )
  }

  return (
    <div
      className="
        mm-scrollbar flex-1 overflow-y-auto
      "
    >
      <div className="flex flex-col gap-4 px-4 py-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-[var(--mm-bg-secondary)]">
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-px" aria-hidden="true" />
      </div>


    </div>
  )
}
