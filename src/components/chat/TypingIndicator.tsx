// ─────────────────────────────────────────────────────────────
// MACHINE MIND — TypingIndicator
// Three-dot staggered pulse animation. Respects prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────

'use client'

export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1 px-3 py-2"
      role="status"
      aria-label="Assistant is typing"
    >
      <span className="sr-only">Thinking…</span>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (prefers-reduced-motion: no-preference) {
              .mm-typing-dot {
                animation: mm-pulse 1.2s var(--mm-ease, cubic-bezier(0.4, 0, 0.2, 1)) infinite;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .mm-typing-dot {
                opacity: 0.5;
              }
            }
            @keyframes mm-pulse {
              0%, 100% {
                transform: scale(0.5);
                opacity: 0.4;
              }
              50% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `,
        }}
      />

      {([0, 1, 2] as const).map((i) => (
        <span
          key={i}
          className="mm-typing-dot inline-block size-2 rounded-full"
          style={{
            backgroundColor: 'var(--mm-accent)',
            willChange: 'transform',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}
