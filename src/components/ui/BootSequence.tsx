// ─────────────────────────────────────────────────────────────
// MACHINE MIND — BootSequence Component
// Terminal-style init animation with per-character typing.
// Skipped if sessionStorage mm_booted is set.
// Blinking cursor stops on first user keydown.
// v4.0: Updated boot lines with gibberish parser, fuzzy matcher,
//       sentiment engine, personality layer.
// ─────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface BootLine {
  text: string
  delay: number
  color?: 'accent' | 'muted'
  blink?: boolean
}

const BOOT_LINES: BootLine[] = [
  { text: '> MACHINE MIND v4.0 — initializing', delay: 0, color: 'accent' },
  { text: '  [████████████░░] gibberish parser ......... armed   (human-grade)', delay: 300 },
  { text: '  [████████████░░] fuzzy matcher ............. online  (typo-tolerant)', delay: 550 },
  { text: '  [█████████████░] rule engine ............... loaded  (300 rules)', delay: 800 },
  { text: '  [█████████████░] tool registry ............. ready   (12 tools)', delay: 1050 },
  { text: '  [██████████████] context memory ............. armed', delay: 1300 },
  { text: '  [██████████████] sentiment engine .......... online', delay: 1500 },
  { text: '  [██████████████] personality layer ......... calibrated', delay: 1700 },
  { text: '', delay: 1900 },
  { text: '> mode: RULE ENGINE', delay: 2000, color: 'accent' },
  { text: '> type anything. i understand humans.', delay: 2100 },
  { text: '> try: "yo whats 5km in miles lol" — or just !help', delay: 2200 },
  { text: '', delay: 2400 },
  { text: '> built by abhishek shah · abhishekshah.vercel.app', delay: 2500, color: 'muted' },
  { text: '', delay: 2600 },
  { text: '_', delay: 2700, blink: true },
]

// Typing speed range per character
const TYPE_MIN_MS = 30
const TYPE_MAX_MS = 90

function randomTypeDelay(): number {
  return TYPE_MIN_MS + Math.random() * (TYPE_MAX_MS - TYPE_MIN_MS)
}

interface BootSequenceProps {
  onComplete?: () => void
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [typedChars, setTypedChars] = useState<number[]>([])
  const [cursorVisible, setCursorVisible] = useState(true)
  const [done, setDone] = useState(false)
  const dismissedRef = useRef(false)

  // Check if boot was already shown this session
  const [alreadyBooted, setAlreadyBooted] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setAlreadyBooted(!!sessionStorage.getItem('mm_booted'))
  }, [])

  // Blinking cursor timer
  useEffect(() => {
    if (done || dismissedRef.current) return
    const interval = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 530)
    return () => clearInterval(interval)
  }, [done])

  // Listen for any keydown to dismiss
  useEffect(() => {
    if (dismissedRef.current) return

    function handleKey() {
      if (dismissedRef.current) return
      dismissedRef.current = true
      setCursorVisible(false)
      setDone(true)
      sessionStorage.setItem('mm_booted', '1')
      onComplete?.()
    }

    window.addEventListener('keydown', handleKey, { once: false })
    return () => window.removeEventListener('keydown', handleKey)
  }, [onComplete])

  // Typing animation sequence
  useEffect(() => {
    if (alreadyBooted === null) return // still checking sessionStorage
    if (alreadyBooted) {
      // Already booted — skip animation
      setDone(true)
      setCursorVisible(false)
      onComplete?.()
      return
    }

    // Reset typed chars for all lines
    setTypedChars(BOOT_LINES.map(() => 0))

    const timeouts: ReturnType<typeof setTimeout>[] = []

    BOOT_LINES.forEach((line, lineIdx) => {
      // Show line after its delay
      const showTimeout = setTimeout(() => {
        setVisibleLines(lineIdx + 1)

        // Type each character
        const chars = line.text.length
        let charAccum = 0

        for (let ci = 0; ci < chars; ci++) {
          charAccum += randomTypeDelay()
          const charTimeout = setTimeout(() => {
            setTypedChars((prev) => {
              const next = [...prev]
              next[lineIdx] = ci + 1
              return next
            })
          }, charAccum)
          timeouts.push(charTimeout)
        }

        // After all chars typed on this line, check if it's the last
        if (lineIdx === BOOT_LINES.length - 1) {
          const finishTimeout = setTimeout(() => {
            if (!dismissedRef.current) {
              sessionStorage.setItem('mm_booted', '1')
              setDone(true)
              onComplete?.()
            }
          }, charAccum + 300)
          timeouts.push(finishTimeout)
        }
      }, line.delay)

      timeouts.push(showTimeout)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [alreadyBooted, onComplete])

  // Already booted — render nothing
  if (alreadyBooted) return null

  // Done (either by natural completion or keypress dismissal) — render nothing
  if (done) return null

  return (
    <div
      className="flex min-h-screen w-full items-start justify-center bg-[var(--mm-bg-primary)] p-6 sm:p-10"
      role="alert"
      aria-live="polite"
      aria-label="MACHINE MIND boot sequence"
    >
      <div className="w-full max-w-2xl font-mono text-sm sm:text-base leading-7">
        {BOOT_LINES.slice(0, visibleLines).map((line, idx) => {
          const isPromptLine = line.text.startsWith('>')
          const visibleText = line.text.slice(0, typedChars[idx] ?? 0)
          const isBlinkLine = line.blink === true

          // Color logic: accent lines, muted lines, or default secondary
          let textColor = 'text-[var(--mm-text-secondary)]'
          if (line.color === 'accent' || isPromptLine) {
            textColor = 'text-[var(--mm-accent)]'
          } else if (line.color === 'muted') {
            textColor = 'text-[var(--mm-text-muted)]'
          }

          return (
            <div key={idx} className="flex">
              <span className={textColor}>
                {visibleText}
              </span>
              {/* Blinking cursor on the blink line */}
              {isBlinkLine && (
                <span
                  className="inline-block w-[0.6em] text-[var(--mm-accent)]"
                  style={{
                    opacity: cursorVisible ? 1 : 0,
                    transition: 'opacity 100ms',
                  }}
                  aria-hidden="true"
                >
                  _
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
