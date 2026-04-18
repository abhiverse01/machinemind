// ─────────────────────────────────────────────────────────────
// MACHINE MIND — SettingsPanel Component
// Slide-in drawer from right (320px).
// AI Mode toggle, Theme selector, API Key input, Clear Session, Version string.
// ─────────────────────────────────────────────────────────────

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useChatStore } from '@/store/chat'
import { useTheme } from '@/hooks/useTheme'
import { ThemeToggle } from './ThemeToggle'
import type { ApiValidateResponse } from '@/lib/types'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const mode = useChatStore((s) => s.mode)
  const setMode = useChatStore((s) => s.setMode)
  const clearSession = useChatStore((s) => s.clearSession)
  const { preference, setPreference } = useTheme()

  const [aiKeyValid, setAiKeyValid] = useState<boolean | null>(null)
  const [aiKeyLoading, setAiKeyLoading] = useState(false)
  const [showKeyWarning, setShowKeyWarning] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeySaving, setApiKeySaving] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)

  // Check API key validity when panel opens
  useEffect(() => {
    if (!open) return
    const checkKey = async () => {
      try {
        const res = await fetch('/api/validate')
        const data: ApiValidateResponse = await res.json()
        setAiKeyValid(data.hasKey)
      } catch {
        setAiKeyValid(false)
      }
    }
    checkKey()
  }, [open])

  // Save API key
  const handleSaveApiKey = useCallback(async () => {
    const trimmed = apiKeyInput.trim()
    if (!trimmed) return
    setApiKeySaving(true)
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed }),
      })
      const data: ApiValidateResponse = await res.json()
      if (data.hasKey) {
        setAiKeyValid(true)
        setApiKeySaved(true)
        setApiKeyInput('')
        setShowKeyWarning(false)
        setTimeout(() => setApiKeySaved(false), 3000)
      }
    } catch {
      // Silently fail
    } finally {
      setApiKeySaving(false)
    }
  }, [apiKeyInput])

  // Check API key when toggling AI mode
  const handleAiToggle = useCallback(async () => {
    if (mode === 'ai_relay') {
      // Switching back to rule engine — always allowed
      setMode('rule_engine')
      setShowKeyWarning(false)
      return
    }

    // Trying to switch to AI relay — check if key exists
    setAiKeyLoading(true)
    try {
      const res = await fetch('/api/validate')
      const data: ApiValidateResponse = await res.json()
      setAiKeyValid(data.hasKey)

      if (data.hasKey) {
        setMode('ai_relay')
        setShowKeyWarning(false)
      } else {
        setShowKeyWarning(true)
      }
    } catch {
      setAiKeyValid(false)
      setShowKeyWarning(true)
    } finally {
      setAiKeyLoading(false)
    }
  }, [mode, setMode])

  // Clear session handler
  const handleClearSession = useCallback(() => {
    if (!clearConfirm) {
      setClearConfirm(true)
      return
    }
    clearSession()
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
    }
    setClearConfirm(false)
    onClose()
  }, [clearConfirm, clearSession, onClose])

  // Reset confirm state after 3 seconds
  useEffect(() => {
    if (!clearConfirm) return
    const timeout = setTimeout(() => setClearConfirm(false), 3000)
    return () => clearTimeout(timeout)
  }, [clearConfirm])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-[var(--mm-duration-base)] ease-[var(--mm-ease)]"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-50 flex h-full w-80 flex-col border-l border-[var(--mm-border)] bg-[var(--mm-bg-primary)] will-change-transform"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform var(--mm-duration-base) var(--mm-ease)`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--mm-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--mm-text-primary)]">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--mm-text-muted)] transition-colors duration-[var(--mm-duration-fast)] hover:bg-[var(--mm-bg-tertiary)] hover:text-[var(--mm-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)]"
            aria-label="Close settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* ── AI Mode toggle ─────────────────────────────── */}
          <section>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--mm-text-muted)]">
              AI Mode
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={mode === 'ai_relay'}
                onClick={handleAiToggle}
                disabled={aiKeyLoading}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-[var(--mm-duration-base)] ease-[var(--mm-ease)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor:
                    mode === 'ai_relay'
                      ? 'var(--mm-accent)'
                      : 'var(--mm-bg-tertiary)',
                }}
              >
                <span
                  className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm will-change-transform"
                  style={{
                    transform:
                      mode === 'ai_relay'
                        ? 'translateX(24px)'
                        : 'translateX(4px)',
                    transition:
                      'transform var(--mm-duration-base) var(--mm-ease)',
                  }}
                />
              </button>
              <span className="text-sm text-[var(--mm-text-primary)]">
                {aiKeyLoading
                  ? 'Checking\u2026'
                  : mode === 'ai_relay'
                    ? 'AI Relay'
                    : 'Rule Engine'}
              </span>
            </div>

            {/* API key warning */}
            {showKeyWarning && (
              <div className="mt-3 rounded-md border border-[var(--mm-error)] bg-[var(--mm-bg-secondary)] px-3 py-2.5">
                <p className="text-xs text-[var(--mm-error)] font-medium">
                  Set ANTHROPIC_API_KEY in your environment
                </p>
                <p className="mt-1 text-xs text-[var(--mm-text-muted)]">
                  The AI relay requires an Anthropic API key to function.
                  Add it below or set it in your server environment variables and restart.
                </p>
              </div>
            )}

            {/* Mode description */}
            <p className="mt-2 text-xs text-[var(--mm-text-muted)] leading-relaxed">
              {mode === 'rule_engine'
                ? 'Responds using local rules and tools. Fast, offline-capable.'
                : 'Routes messages to Anthropic Claude for AI-powered responses.'}
            </p>
          </section>

          {/* ── API Key Input ──────────────────────────────── */}
          <section>
            <label
              htmlFor="api-key-input"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--mm-text-muted)]"
            >
              API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                id="api-key-input"
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 rounded-md border border-[var(--mm-border)] bg-[var(--mm-bg-secondary)] px-3 py-2 text-sm text-[var(--mm-text-primary)] placeholder:text-[var(--mm-text-muted)] transition-colors duration-150 focus:border-[var(--mm-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--mm-accent)]"
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
                aria-label="Anthropic API key input"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim() || apiKeySaving}
                className="shrink-0 rounded-md bg-[var(--mm-accent)] px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Save API key"
              >
                {apiKeySaving ? 'Saving\u2026' : 'Save'}
              </button>
            </div>
            {apiKeySaved && (
              <p className="mt-1.5 text-xs text-[var(--mm-success)]">
                API key saved. AI Relay is now available.
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={`inline-block size-2 rounded-full ${
                  aiKeyValid === true
                    ? 'bg-[var(--mm-success)]'
                    : aiKeyValid === false
                      ? 'bg-[var(--mm-error)]'
                      : 'bg-[var(--mm-text-muted)]'
                }`}
              />
              <span className="text-xs text-[var(--mm-text-muted)]">
                {aiKeyValid === true
                  ? 'Key configured'
                  : aiKeyValid === false
                    ? 'No key configured'
                    : 'Checking\u2026'}
              </span>
            </div>
          </section>

          {/* ── Theme selector ─────────────────────────────── */}
          <section>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--mm-text-muted)]">
              Theme
            </label>
            <ThemeToggle
              preference={preference}
              setPreference={setPreference}
            />
          </section>

          {/* ── Clear Session ──────────────────────────────── */}
          <section>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--mm-text-muted)]">
              Session
            </label>
            <button
              type="button"
              onClick={handleClearSession}
              className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--mm-duration-fast)] ease-[var(--mm-ease)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-accent)] ${
                clearConfirm
                  ? 'bg-[var(--mm-error)] text-white hover:opacity-90'
                  : 'border border-[var(--mm-border)] text-[var(--mm-text-secondary)] hover:bg-[var(--mm-bg-tertiary)] hover:text-[var(--mm-text-primary)]'
              }`}
            >
              {clearConfirm ? 'Click again to confirm' : 'Clear Session'}
            </button>
            <p className="mt-1.5 text-xs text-[var(--mm-text-muted)]">
              Clears all messages, tool states, and session storage.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--mm-border)] px-5 py-3">
          <span className="font-mono text-[10px] text-[var(--mm-text-muted)]">
            MACHINE MIND v1.0.0
          </span>
        </div>
      </div>
    </>
  )
}
