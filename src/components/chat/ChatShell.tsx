// ─────────────────────────────────────────────────────────────
// MACHINE MIND — ChatShell
// Three-panel layout orchestrator: Status bar, Tool tray, Chat.
// Responsive: tray collapses to icon rail on mobile (<=768px).
// Integrates: SettingsPanel, BootSequence, ToolTray, StatusBar.
// DevCredit is rendered unconditionally — permanent attribution.
// ─────────────────────────────────────────────────────────────

'use client'

import { useState, useCallback } from 'react'
import { useChatStore } from '@/store/chat'
import { useKeyboard } from '@/hooks/useKeyboard'
import { contextMemory } from '@/lib/memory/context'

import { ChatHistory } from './ChatHistory'
import { InputBar } from './InputBar'
import { ToolTray } from '@/components/tools/ToolTray'
import { StatusBar } from '@/components/ui/StatusBar'
import { SettingsPanel } from '@/components/ui/SettingsPanel'
import { BootSequence } from '@/components/ui/BootSequence'
import { DevCredit } from '@/components/ui/DevCredit'

export function ChatShell() {
  const mode = useChatStore((s) => s.mode)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const setMode = useChatStore((s) => s.setMode)
  const clearSession = useChatStore((s) => s.clearSession)

  const [trayOpen, setTrayOpen] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768,
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Check sessionStorage synchronously to avoid flash of boot screen
  const [booting, setBooting] = useState(() =>
    typeof window === 'undefined' || !sessionStorage.getItem('mm_booted')
  )
  const toggleTray = useCallback(() => setTrayOpen((v) => !v), [])

  const toggleMode = useCallback(() => {
    if (mode === 'rule_engine') {
      setSettingsOpen(true)
      return
    }
    setMode('rule_engine')
  }, [mode, setMode])

  // Handle tool click from ToolTray
  const handleToolClick = useCallback((_triggerSyntax: string) => {
    // Tool clicks are handled by InputBar internally in v5.0
  }, [])

  // Keyboard shortcuts
  useKeyboard({
    onToggleToolTray: toggleTray,
    onClearSession: clearSession,
    onFocusInput: () => {},
    onToggleSettings: () => setSettingsOpen((v) => !v),
  })

  if (booting) {
    return (
      <BootSequence
        onComplete={() => setBooting(false)}
      />
    )
  }

  return (
    <div className="flex h-full flex-col bg-[var(--mm-bg-primary)]">
      {/* Status bar — 32px fixed */}
      <StatusBar
        mode={mode}
        isStreaming={isStreaming}
        onToggleMode={toggleMode}
        onToggleTray={toggleTray}
        onOpenSettings={() => setSettingsOpen(true)}
        trayOpen={trayOpen}
        turnCount={contextMemory.turnCount}
      />

      {/* Main area: tray + chat */}
      <div className="flex min-h-0 flex-1">
        {/* Tool tray */}
        <ToolTray
          isOpen={trayOpen}
          onToolClick={handleToolClick}
        />

        {/* Chat panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ChatHistory />
          <InputBar />
        </div>
      </div>

      {/* Settings panel drawer */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Developer attribution — always rendered, non-dismissable */}
      <DevCredit />
    </div>
  )
}
