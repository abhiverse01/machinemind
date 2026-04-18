// ─────────────────────────────────────────────────────────────
// MACHINE MIND — useTheme Hook
// Applies data-theme on <html> and persists preference to localStorage.
// System default via prefers-color-scheme media query.
// Three states: light | dark | system
// ─────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ThemePreference } from '@/lib/types'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  return pref === 'system' ? getSystemTheme() : pref
}

function applyTheme(preference: ThemePreference): void {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(preference)
  document.documentElement.setAttribute('data-theme', resolved)
}

function getInitialPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem('mm-theme') as ThemePreference | null) ?? 'system'
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(getInitialPreference)
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolveTheme(getInitialPreference()))

  // Apply theme on mount and when preference changes
  useEffect(() => {
    applyTheme(preference)
  }, [preference])

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (preference === 'system') {
        setResolved(getSystemTheme())
        applyTheme('system')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference])

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref)
    localStorage.setItem('mm-theme', pref)
    setResolved(resolveTheme(pref))
    applyTheme(pref)
  }, [])

  return { preference, resolved, setPreference }
}
