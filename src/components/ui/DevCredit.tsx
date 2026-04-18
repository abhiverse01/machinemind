// ─────────────────────────────────────────────────────────────
// MACHINE MIND — DevCredit
// Permanent bottom-left attribution. Always visible. Not dismissible.
// ─────────────────────────────────────────────────────────────

'use client'

export function DevCredit() {
  return (
    <a
      href="https://abhishekshah.vercel.app"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abhishek Shah — developer portfolio"
      className="dev-credit"
      role="contentinfo"
    >
      <span className="dev-credit__dot" aria-hidden="true" />
      <span className="dev-credit__text">
        Abhishek Shah · abhishekshah.vercel.app
      </span>
    </a>
  )
}
