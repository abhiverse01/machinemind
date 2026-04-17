// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Clock Tool
// Intl.DateTimeFormat + Intl.RelativeTimeFormat. Pure computation.
// No external API calls.
// ─────────────────────────────────────────────────────────────

import type { ToolResult } from '../types'

// ── Timezone abbreviation → IANA mapping ─────────────────────
const TZ_MAP: Record<string, string> = {
  UTC: 'UTC',
  GMT: 'UTC',
  EST: 'America/New_York',
  EDT: 'America/New_York',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  JST: 'Asia/Tokyo',
  AEST: 'Australia/Sydney',
  AEDT: 'Australia/Sydney',
  IST: 'Asia/Kolkata',
  CET: 'Europe/Paris',
  CEST: 'Europe/Paris',
  EET: 'Europe/Helsinki',
  EEST: 'Europe/Helsinki',
  BST: 'Europe/London',
  NZST: 'Pacific/Auckland',
  NZDT: 'Pacific/Auckland',
  HKT: 'Asia/Hong_Kong',
  SGT: 'Asia/Singapore',
  KST: 'Asia/Seoul',
  WET: 'Europe/Lisbon',
  AKST: 'America/Anchorage',
  AKDT: 'America/Anchorage',
  HST: 'Pacific/Honolulu',
  AST: 'America/Puerto_Rico',
  GST: 'Asia/Dubai',
  MSK: 'Europe/Moscow',
  BRST: 'America/Sao_Paulo',
  BRT: 'America/Sao_Paulo',
}

function resolveTimezone(tz: string): string {
  const trimmed = tz.trim()
  const upper = trimmed.toUpperCase().replace(/\s+/g, '')

  // Direct IANA name? (e.g. "America/New_York", "Asia/Tokyo")
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed })
    return trimmed
  } catch {
    // not a valid IANA, continue
  }

  // Abbreviation mapping
  if (TZ_MAP[upper]) return TZ_MAP[upper]

  // GMT/UTC offset format: GMT+5:30, GMT-8, UTC+8, UTC+5:30
  const offsetMatch = upper.match(/^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/)
  if (offsetMatch) {
    const sign = offsetMatch[1] === '+' ? '-' : '+' // IANA Etc/ uses opposite sign
    const h = offsetMatch[2].padStart(2, '0')
    const m = (offsetMatch[3] ?? '00').padStart(2, '0')
    if (m === '00') {
      return `Etc/GMT${sign}${h}`
    }
    return `Etc/GMT${sign}${h}:${m}`
  }

  throw new Error(`Unknown timezone: "${trimmed}"`)
}

// ── Format helpers ───────────────────────────────────────────
function formatFull(tz?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }
  if (tz) options.timeZone = resolveTimezone(tz)
  return new Intl.DateTimeFormat('en-US', options).format(new Date())
}

function formatTimeOnly(tz?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }
  if (tz) options.timeZone = resolveTimezone(tz)
  return new Intl.DateTimeFormat('en-US', options).format(new Date())
}

function formatDateOnly(tz?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  if (tz) options.timeZone = resolveTimezone(tz)
  return new Intl.DateTimeFormat('en-US', options).format(new Date())
}

function formatISO(tz?: string): string {
  if (tz) {
    const resolved = resolveTimezone(tz)
    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: resolved,
    }).formatToParts(new Date())
    const get = (t: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === t)?.value ?? '00'
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
  }
  return new Date().toISOString()
}

// ── Timezone conversion ──────────────────────────────────────
function convertTimezone(fromTz: string, toTz: string): string {
  const fromResolved = resolveTimezone(fromTz)
  const toResolved = resolveTimezone(toTz)
  const now = new Date()

  const fromStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
    timeZone: fromResolved,
  }).format(now)

  const toStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
    timeZone: toResolved,
  }).format(now)

  return `${fromStr}\n  →  ${toStr}`
}

// ── Relative time ────────────────────────────────────────────
function relativeTime(target: Date): string {
  const now = Date.now()
  const diff = target.getTime() - now
  const absDiff = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
    { unit: 'year', ms: 365.25 * 24 * 60 * 60 * 1000 },
    { unit: 'month', ms: 30.44 * 24 * 60 * 60 * 1000 },
    { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
    { unit: 'day', ms: 24 * 60 * 60 * 1000 },
    { unit: 'hour', ms: 60 * 60 * 1000 },
    { unit: 'minute', ms: 60 * 1000 },
    { unit: 'second', ms: 1000 },
  ]

  for (const { unit, ms } of units) {
    if (absDiff >= ms) {
      const val = Math.round(diff / ms)
      return rtf.format(val, unit)
    }
  }
  return rtf.format(0, 'second')
}

// ── Countdown parser ─────────────────────────────────────────
function parseCountdown(input: string): { target: Date; label: string } | null {
  const now = new Date()
  const year = now.getFullYear()
  const lower = input.toLowerCase()

  // "days until Xmas/Christmas"
  const xmasMatch = lower.match(/(?:days?|hours?|minutes?)\s+until\s+(christmas|xmas)/)
  if (xmasMatch) {
    let xmas = new Date(year, 11, 25)
    if (xmas.getTime() <= now.getTime()) xmas = new Date(year + 1, 11, 25)
    return { target: xmas, label: 'Christmas' }
  }

  // "hours until midnight"
  const midnightMatch = lower.match(/(?:hours?|minutes?)\s+until\s+midnight/)
  if (midnightMatch) {
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    return { target: midnight, label: 'midnight' }
  }

  // "how many days until 2025-12-25" / "days until 2025-12-25"
  const isoMatch = lower.match(/(?:how\s+many\s+)?(?:days?|hours?|minutes?)\s+until\s+(\d{4}-\d{1,2}-\d{1,2})/)
  if (isoMatch) {
    const d = new Date(isoMatch[1])
    if (!isNaN(d.getTime())) return { target: d, label: isoMatch[1] }
  }

  // "days until <month> <day>" e.g. "days until July 4", "days until July 4, 2025"
  const monthDayMatch = lower.match(/(?:how\s+many\s+)?(?:days?|hours?|minutes?)\s+until\s+(\w+)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?/)
  if (monthDayMatch) {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
    const mi = months.indexOf(monthDayMatch[1].toLowerCase().slice(0, 3))
    if (mi >= 0) {
      const day = parseInt(monthDayMatch[2])
      const yr = monthDayMatch[3] ? parseInt(monthDayMatch[3]) : year
      let d = new Date(yr, mi, day)
      if (!monthDayMatch[3] && d.getTime() <= now.getTime()) d = new Date(year + 1, mi, day)
      return { target: d, label: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
    }
  }

  // Generic "days until <date string>"
  const dateMatch = lower.match(/(?:how\s+many\s+)?(?:days?|hours?|minutes?)\s+until\s+(.+)/)
  if (dateMatch) {
    const parsed = new Date(dateMatch[1])
    if (!isNaN(parsed.getTime())) {
      return { target: parsed, label: dateMatch[1].trim() }
    }
  }

  return null
}

// ── Day of week ──────────────────────────────────────────────
function dayOfWeek(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) throw new Error(`Invalid date: "${dateStr}"`)
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(d)
  const fullDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(d)
  return `${fullDate} is a ${dayName}`
}

// ── Unix timestamp conversion ────────────────────────────────
function unixTimestamp(input: string): string {
  const lower = input.toLowerCase().trim()

  // "convert 1700000000 to date" or "1700000000 to date"
  const toDateMatch = lower.match(/(?:convert\s+)?(\d{9,10})\s+to\s+date/)
  if (toDateMatch) {
    const ts = parseInt(toDateMatch[1])
    const d = new Date(ts * 1000)
    if (isNaN(d.getTime())) throw new Error(`Invalid unix timestamp: ${ts}`)
    const formatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
    }).format(d)
    return `Unix ${ts} → ${formatted}\nISO: ${d.toISOString()}`
  }

  // "convert <date> to unix" / "unix for 2025-01-01"
  const fromDateMatch = lower.match(/(?:convert\s+)?(\d{4}-\d{1,2}-\d{1,2}(?:[T ]\d{1,2}:\d{1,2}(?::\d{1,2})?)?)\s+to\s+unix/)
  if (fromDateMatch) {
    const d = new Date(fromDateMatch[1])
    if (isNaN(d.getTime())) throw new Error(`Invalid date: "${fromDateMatch[1]}"`)
    return `${fromDateMatch[1]} → Unix timestamp: ${Math.floor(d.getTime() / 1000)}`
  }

  // Just "unix timestamp" / "unix" → current unix timestamp
  const now = new Date()
  return `Current Unix timestamp: ${Math.floor(now.getTime() / 1000)}\nISO: ${now.toISOString()}`
}

// ── Extract timezone from input ──────────────────────────────
function extractTimezone(input: string): string | null {
  // "time in Tokyo", "time in JST", "time in GMT+5:30"
  const inMatch = input.match(/(?:time|date|clock)\s+in\s+(.+?)$/i)
  if (inMatch) return inMatch[1].trim()

  // "what time is it in Tokyo"
  const itInMatch = input.match(/what\s+time\s+is\s+it\s+(?:in\s+)?(.+?)$/i)
  if (itInMatch) return itInMatch[1].trim()

  // "Tokyo time"
  const cityTime = input.match(/^(\w[\w\s]*?)\s+time$/i)
  if (cityTime) return cityTime[1].trim()

  return null
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()
  const lower = input.toLowerCase().trim()

  try {
    // ── Timezone conversion: "convert EST to JST" / "time EST to JST" ──
    const convertMatch = lower.match(/(?:convert|time)\s+(\S+)\s+to\s+(\S+?)$/)
    if (convertMatch && !lower.includes('until')) {
      const fromTz = convertMatch[1].trim()
      const toTz = convertMatch[2].trim()
      // Only treat as timezone conversion if both look like timezone identifiers
      const looksLikeTz = (s: string): boolean => {
        if (TZ_MAP[s.toUpperCase()]) return true
        if (/^(GMT|UTC)[+-]?\d/i.test(s)) return true
        if (s.includes('/')) return true // IANA like America/New_York
        // Common city names
        const cities = ['tokyo','london','paris','new york','sydney','dubai','berlin','moscow',
                        'mumbai','delhi','singapore','hong kong','seoul','auckland','chicago',
                        'denver','los angeles','honolulu','toronto','vancouver','beijing',
                        'bangkok','cairo','istanbul','sao paulo']
        return cities.includes(s.toLowerCase())
      }
      if (looksLikeTz(fromTz) && looksLikeTz(toTz)) {
        const result = convertTimezone(fromTz, toTz)
        const execMs = Date.now() - t0
        return { status: 'ok', result, displayType: 'text', raw: result, execMs }
      }
    }

    // ── "time in <tz>" / "date in <tz>" / "what time is it in <tz>" ──
    const tz = extractTimezone(lower)
    if (tz) {
      const isDateOnly = /\bdate\b/.test(lower)
      const result = isDateOnly ? formatDateOnly(tz) : formatFull(tz)
      const execMs = Date.now() - t0
      return { status: 'ok', result, displayType: 'text', raw: result, execMs }
    }

    // ── Unix timestamp operations ──
    if (/\bunix\b/.test(lower)) {
      const result = unixTimestamp(input)
      const execMs = Date.now() - t0
      return { status: 'ok', result, displayType: 'text', raw: result, execMs }
    }

    // ── "convert <timestamp> to date" (without the word "unix") ──
    const tsToDateMatch = lower.match(/convert\s+(\d{9,10})\s+to\s+date/)
    if (tsToDateMatch) {
      const ts = parseInt(tsToDateMatch[1])
      const d = new Date(ts * 1000)
      if (!isNaN(d.getTime())) {
        const formatted = new Intl.DateTimeFormat('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
        }).format(d)
        const result = `Unix ${ts} → ${formatted}\nISO: ${d.toISOString()}`
        const execMs = Date.now() - t0
        return { status: 'ok', result, displayType: 'text', raw: result, execMs }
      }
    }

    // ── "what time is it" / "current time" / "now" / "time" ──
    if (/^(what time|current time|time now|now|time|what time is it|tell me the time)$/.test(lower)) {
      const result = formatFull()
      const execMs = Date.now() - t0
      return { status: 'ok', result, displayType: 'text', raw: result, execMs }
    }

    // ── "what date" / "today" / "current date" / "date" ──
    if (/^(what date|today|current date|date|what day is it|what is today|what is the date)$/.test(lower)) {
      const result = formatDateOnly()
      const execMs = Date.now() - t0
      return { status: 'ok', result, displayType: 'text', raw: result, execMs }
    }

    // ── ISO format ──
    if (/^iso|iso format|iso 8601/.test(lower)) {
      const result = formatISO()
      const execMs = Date.now() - t0
      return { status: 'ok', result, displayType: 'text', raw: result, execMs }
    }

    // ── "what day is 2025-07-04" / "day of week for <date>" ──
    const dayMatch = lower.match(/(?:what\s+day\s+(?:is|was)\s+|day\s+of\s+week\s+(?:for\s+)?)(.+)/)
    if (dayMatch) {
      const result = dayOfWeek(dayMatch[1].trim())
      const execMs = Date.now() - t0
      return { status: 'ok', result, displayType: 'text', raw: result, execMs }
    }

    // ── Countdown ──
    if (/\buntil\b/.test(lower)) {
      const cd = parseCountdown(input)
      if (cd) {
        const relStr = relativeTime(cd.target)
        const diffMs = cd.target.getTime() - Date.now()
        const isNegative = diffMs < 0
        const absDiff = Math.abs(diffMs)
        const days = Math.floor(absDiff / 86400000)
        const hours = Math.floor((absDiff % 86400000) / 3600000)
        const minutes = Math.floor((absDiff % 3600000) / 60000)
        const direction = isNegative ? 'ago' : 'remaining'
        const result = [
          `${relStr}`,
          `${days}d ${hours}h ${minutes}m ${direction}`,
          `Target: ${cd.target.toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })} (${cd.label})`,
        ].join('\n')
        const execMs = Date.now() - t0
        return { status: 'ok', result, displayType: 'text', raw: result, execMs }
      }
    }

    // ── Default: show full current time ──
    const now = new Date()
    const result = [
      formatFull(),
      `ISO: ${now.toISOString()}`,
      `Unix: ${Math.floor(now.getTime() / 1000)}`,
    ].join('\n')
    const execMs = Date.now() - t0
    return { status: 'ok', result, displayType: 'text', raw: result, execMs }

  } catch (err: unknown) {
    const execMs = Date.now() - t0
    const message = err instanceof Error ? err.message : String(err)
    return { status: 'error', result: { error: message }, displayType: 'error', raw: message, execMs }
  }
}
