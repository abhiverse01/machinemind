// ─────────────────────────────────────────────────────────────
// MACHINE MIND — useKeyboard Hook
// Global keyboard shortcut bindings
// ─────────────────────────────────────────────────────────────

'use client'

import { useEffect } from 'react'

interface KeyboardBindings {
  onToggleSettings?: () => void
  onClearSession?: () => void
  onFocusInput?: () => void
  onToggleToolTray?: () => void
}

export function useKeyboard(bindings: KeyboardBindings) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+, or Cmd+, → Toggle settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        bindings.onToggleSettings?.()
        return
      }

      // Ctrl+Shift+C or Cmd+Shift+C → Clear session
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        bindings.onClearSession?.()
        return
      }

      // Ctrl+K or Cmd+K → Focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        bindings.onFocusInput?.()
        return
      }

      // Escape → Close settings / toggle tray
      if (e.key === 'Escape') {
        bindings.onToggleToolTray?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bindings])
}
