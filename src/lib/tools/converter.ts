// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Converter Tool
// All conversion factors hardcoded. No network calls.
// Parse natural language: "5km to miles", "100F to C"
// ─────────────────────────────────────────────────────────────

import type { ToolResult } from '../types'

// ── Unit definitions: all relative to a base unit per category ─
// Length base = meters
const LENGTH: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  inch: 0.0254,
  ft: 0.3048,
  foot: 0.3048,
  feet: 0.3048,
  yd: 0.9144,
  yard: 0.9144,
  mi: 1609.344,
  mile: 1609.344,
  miles: 1609.344,
  nmi: 1852,
  'nautical mile': 1852,
}

// Mass base = kilograms
const MASS: Record<string, number> = {
  mg: 0.000001,
  g: 0.001,
  kg: 1,
  t: 1000,
  tonne: 1000,
  oz: 0.0283495,
  lb: 0.453592,
  pound: 0.453592,
  pounds: 0.453592,
  st: 6.35029,
  stone: 6.35029,
}

// Speed base = m/s
const SPEED: Record<string, number> = {
  mph: 0.44704,
  kph: 0.277778,
  'km/h': 0.277778,
  'kmh': 0.277778,
  'm/s': 1,
  knots: 0.514444,
  knot: 0.514444,
}

// Data base = byte
const DATA: Record<string, number> = {
  bit: 0.125,
  b: 0.125,
  byte: 1,
  B: 1,
  kb: 1000,
  KB: 1000,
  mb: 1000000,
  MB: 1000000,
  gb: 1e9,
  GB: 1e9,
  tb: 1e12,
  TB: 1e12,
  pb: 1e15,
  PB: 1e15,
  kib: 1024,
  KiB: 1024,
  mib: 1048576,
  MiB: 1048576,
  gib: 1073741824,
  GiB: 1073741824,
  tib: 1099511627776,
  TiB: 1099511627776,
  pib: 1125899906842624,
  PiB: 1125899906842624,
}

// Area base = m²
const AREA: Record<string, number> = {
  sqm: 1,
  'm2': 1,
  'm²': 1,
  sqkm: 1e6,
  'km2': 1e6,
  'km²': 1e6,
  sqft: 0.092903,
  'ft2': 0.092903,
  'ft²': 0.092903,
  'sq ft': 0.092903,
  'sq foot': 0.092903,
  'sq feet': 0.092903,
  acre: 4046.86,
  acres: 4046.86,
  ha: 10000,
  hectare: 10000,
  hectares: 10000,
}

// Volume base = liters
const VOLUME: Record<string, number> = {
  ml: 0.001,
  l: 1,
  liter: 1,
  liters: 1,
  litre: 1,
  litres: 1,
  floz: 0.0295735,
  'fl oz': 0.0295735,
  cup: 0.236588,
  cups: 0.236588,
  pt: 0.473176,
  pint: 0.473176,
  pints: 0.473176,
  qt: 0.946353,
  quart: 0.946353,
  quarts: 0.946353,
  gal: 3.78541,
  gallon: 3.78541,
  gallons: 3.78541,
}

type Category = 'length' | 'mass' | 'speed' | 'data' | 'area' | 'volume'

const CATEGORIES: Record<Category, Record<string, number>> = {
  length: LENGTH,
  mass: MASS,
  speed: SPEED,
  data: DATA,
  area: AREA,
  volume: VOLUME,
}

function findUnit(unit: string): { category: Category; factor: number } | null {
  const normalized = unit.trim()
  // Try exact match first
  for (const [cat, units] of Object.entries(CATEGORIES)) {
    if (units[normalized] !== undefined) {
      return { category: cat as Category, factor: units[normalized] }
    }
  }
  // Try lowercase
  const lower = normalized.toLowerCase()
  for (const [cat, units] of Object.entries(CATEGORIES)) {
    if (units[lower] !== undefined) {
      return { category: cat as Category, factor: units[lower] }
    }
  }
  return null
}

// ── Temperature conversion (formulas, not factors) ────────────
function convertTemp(value: number, from: string, to: string): number {
  const normalize = (u: string): string => u.trim().toUpperCase().replace('°', '')

  const f = normalize(from)
  const t = normalize(to)

  // Convert to Celsius first
  let celsius: number
  if (f === 'C' || f === 'CELSIUS') celsius = value
  else if (f === 'F' || f === 'FAHRENHEIT') celsius = (value - 32) * 5 / 9
  else if (f === 'K' || f === 'KELVIN') celsius = value - 273.15
  else throw new Error(`Unknown temperature unit: "${from}"`)

  // Convert from Celsius to target
  if (t === 'C' || t === 'CELSIUS') return celsius
  if (t === 'F' || t === 'FAHRENHEIT') return celsius * 9 / 5 + 32
  if (t === 'K' || t === 'KELVIN') return celsius + 273.15
  throw new Error(`Unknown temperature unit: "${to}"`)
}

function isTempUnit(u: string): boolean {
  const up = u.trim().toUpperCase().replace('°', '')
  return ['C', 'F', 'K', 'CELSIUS', 'FAHRENHEIT', 'KELVIN'].includes(up)
}

// ── Input parser ─────────────────────────────────────────────
interface ParseResult {
  value: number
  fromUnit: string
  toUnit: string
}

function parseConversion(input: string): ParseResult {
  let s = input.trim()

  // Strip leading "convert" or "how many"
  s = s.replace(/^convert\s+/i, '')
  // "how many meters in 5 miles" → reverse: 5 miles to meters
  const howManyMatch = s.match(/^how\s+many\s+([\w°²/]+(?:\s+\w+)?)\s+in\s+([\d,.]+)\s*([\w°²/]+(?:\s+\w+)?)$/i)
  if (howManyMatch) {
    const value = parseFloat(howManyMatch[2].replace(/,/g, ''))
    if (isNaN(value)) throw new Error(`Invalid number: "${howManyMatch[2]}"`)
    return {
      value,
      fromUnit: howManyMatch[3].trim(),
      toUnit: howManyMatch[1].trim(),
    }
  }

  // Pattern: <number><unit> (to|in|->|→) <unit> (no space between number and unit)
  // e.g. "5km to miles", "100F to C"
  const match1 = s.match(/^([\d,.]+)\s*([\w°²/]+(?:\s+\w+)?)\s*(?:to|in|->|→)\s*([\w°²/]+(?:\s+\w+)?)$/i)
  if (match1) {
    const value = parseFloat(match1[1].replace(/,/g, ''))
    if (isNaN(value)) throw new Error(`Invalid number: "${match1[1]}"`)
    return { value, fromUnit: match1[2].trim(), toUnit: match1[3].trim() }
  }

  throw new Error('Could not parse conversion. Use format: "5km to miles", "100F to C", or "how many meters in 5 miles"')
}

// ── Smart number formatting ──────────────────────────────────
function smartFormat(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString('en-US')
  if (Math.abs(n) < 0.001 || Math.abs(n) > 1e9) return n.toExponential(4)
  return parseFloat(n.toPrecision(8)).toString()
}

// ── Format unit name nicely ──────────────────────────────────
function formatUnitName(unit: string): string {
  const lower = unit.toLowerCase().trim()
  const nameMap: Record<string, string> = {
    'c': '°C', 'f': '°F', 'k': 'K',
    'celsius': '°C', 'fahrenheit': '°F', 'kelvin': 'K',
    'mm': 'mm', 'cm': 'cm', 'm': 'm', 'km': 'km',
    'in': 'in', 'inch': 'in', 'ft': 'ft', 'foot': 'ft', 'feet': 'ft',
    'yd': 'yd', 'yard': 'yd', 'mi': 'mi', 'mile': 'mi', 'miles': 'mi',
    'nmi': 'nmi', 'nautical mile': 'nmi',
    'mg': 'mg', 'g': 'g', 'kg': 'kg', 't': 'tonne', 'tonne': 'tonne',
    'oz': 'oz', 'lb': 'lb', 'pound': 'lb', 'pounds': 'lb',
    'st': 'st', 'stone': 'st',
    'mph': 'mph', 'kph': 'kph', 'km/h': 'km/h', 'kmh': 'km/h',
    'm/s': 'm/s', 'knots': 'knots', 'knot': 'knots',
    'b': 'bits', 'bit': 'bits', 'byte': 'bytes', 'b_upper': 'B',
    'kb': 'KB', 'mb': 'MB', 'gb': 'GB', 'tb': 'TB', 'pb': 'PB',
    'kib': 'KiB', 'mib': 'MiB', 'gib': 'GiB', 'tib': 'TiB', 'pib': 'PiB',
    'sqm': 'm²', 'm2': 'm²', 'm²': 'm²',
    'sqkm': 'km²', 'km2': 'km²', 'km²': 'km²',
    'sqft': 'ft²', 'ft2': 'ft²', 'ft²': 'ft²',
    'sq ft': 'ft²', 'sq foot': 'ft²', 'sq feet': 'ft²',
    'acre': 'acres', 'acres': 'acres',
    'ha': 'ha', 'hectare': 'ha', 'hectares': 'ha',
    'ml': 'mL', 'l': 'L', 'liter': 'L', 'liters': 'L', 'litre': 'L', 'litres': 'L',
    'floz': 'fl oz', 'fl oz': 'fl oz',
    'cup': 'cups', 'cups': 'cups',
    'pt': 'pt', 'pint': 'pt', 'pints': 'pt',
    'qt': 'qt', 'quart': 'qt', 'quarts': 'qt',
    'gal': 'gal', 'gallon': 'gal', 'gallons': 'gal',
  }
  return nameMap[lower] ?? lower
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const { value, fromUnit, toUnit } = parseConversion(input)
    let resultValue: number
    let category: string

    if (isTempUnit(fromUnit) && isTempUnit(toUnit)) {
      resultValue = convertTemp(value, fromUnit, toUnit)
      category = 'temperature'
    } else {
      const from = findUnit(fromUnit)
      const to = findUnit(toUnit)
      if (!from) throw new Error(`Unknown unit: "${fromUnit}"`)
      if (!to) throw new Error(`Unknown unit: "${toUnit}"`)
      if (from.category !== to.category) {
        throw new Error(`Cannot convert between ${from.category} and ${to.category}`)
      }
      category = from.category
      // Convert: value in fromUnit → base → toUnit
      const baseValue = value * from.factor
      resultValue = baseValue / to.factor
    }

    const formatted = smartFormat(resultValue)
    const fromLabel = formatUnitName(fromUnit)
    const toLabel = formatUnitName(toUnit)
    const result = `${value} ${fromLabel} = ${formatted} ${toLabel}`
    const execMs = Date.now() - t0

    return {
      status: 'ok',
      result: { value: resultValue, from: fromUnit, to: toUnit, category, formatted },
      displayType: 'text',
      raw: result,
      execMs,
    }
  } catch (err: unknown) {
    const execMs = Date.now() - t0
    const message = err instanceof Error ? err.message : String(err)
    return { status: 'error', result: { error: message }, displayType: 'error', raw: message, execMs }
  }
}
