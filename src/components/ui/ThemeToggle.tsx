// ─────────────────────────────────────────────────────────────
// MACHINE MIND — ThemeToggle Component
// Light / Dark / System theme toggle with three icon buttons.
// Compact design — fits in the status bar.
// ─────────────────────────────────────────────────────────────

'use client'

import type { ThemePreference } from '@/lib/types'

interface ThemeToggleProps {
  preference: ThemePreference
  setPreference: (pref: ThemePreference) => void
}

const OPTIONS: Array<{
  value: ThemePreference
  label: string
  icon: React.JSX.Element
}> = [
  {
    value: 'light',
    label: 'Light theme',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 1.5V3M8 13V14.5M14.5 8H13M3 8H1.5M12.6 3.4L11.5 4.5M4.5 11.5L3.4 12.6M12.6 12.6L11.5 11.5M4.5 4.5L3.4 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark theme',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M13.5 9.5A6 6 0 016.5 2.5 6 6 0 1013.5 9.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'System theme',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 14.5H10.5M8 12V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function ThemeToggle({ preference, setPreference }: ThemeToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg bg-[var(--mm-bg-tertiary)] p-1"
      role="radiogroup"
      aria-label="Theme preference"
    >
      {OPTIONS.map(({ value, label, icon }) => {
        const isActive = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={`relative flex h-8 w-8 items-center justify-center rounded-md transition-all duration-[var(--mm-duration-fast)] ease-[var(--mm-ease)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)] ${
              isActive
                ? 'bg-[var(--mm-accent-muted)] text-[var(--mm-accent-text)] shadow-sm'
                : 'text-[var(--mm-text-muted)] hover:text-[var(--mm-text-secondary)] hover:bg-[var(--mm-bg-secondary)]'
            }`}
          >
            {icon}
          </button>
        )
      })}
    </div>
  )
}
