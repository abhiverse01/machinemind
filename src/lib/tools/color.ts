// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Color Tool
// HEX/RGB/HSL conversion, palette generation, WCAG contrast.
// Parse: "#ff6600", "rgb(255,102,0)", "hsl(24,100%,50%)",
//   "convert #fff to hsl", "contrast #333 #fff",
//   "palette #6366f1", "complementary #ff0000"
// execMs measured with Date.now().
// ─────────────────────────────────────────────────────────────

import type { ToolResult, ColorInfo, ContrastResult } from '../types'

// ── sRGB gamma helpers ───────────────────────────────────────
function srgbToLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.round(Math.min(255, Math.max(0, s * 255)))
}

// ── Relative luminance (WCAG) ────────────────────────────────
function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

// ── HEX parsing ──────────────────────────────────────────────
function parseHex(hex: string): { r: number; g: number; b: number } {
  let h = hex.trim().replace(/^#/, '')
  // 3-char shorthand: #fff → ffffff
  if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!
  // 4-char with alpha: #ffff → ffffff (ignore alpha)
  if (h.length === 4) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!
  // 8-char with alpha: #ffffffff → strip alpha
  if (h.length === 8) h = h.slice(0, 6)
  if (h.length !== 6) throw new Error(`Invalid hex color: "${hex}"`)
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) throw new Error(`Invalid hex color: "${hex}"`)
  return { r, g, b }
}

// ── RGB → HSL ────────────────────────────────────────────────
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
      case gn: h = ((bn - rn) / d + 2) / 6; break
      case bn: h = ((rn - gn) / d + 4) / 6; break
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

// ── HSL → RGB ────────────────────────────────────────────────
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hn = h / 360, sn = s / 100, ln = l / 100
  if (sn === 0) {
    const v = Math.round(ln * 255)
    return { r: v, g: v, b: v }
  }
  const hue2rgb = (p: number, q: number, t: number): number => {
    let tn = t
    if (tn < 0) tn += 1
    if (tn > 1) tn -= 1
    if (tn < 1 / 6) return p + (q - p) * 6 * tn
    if (tn < 1 / 2) return q
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6
    return p
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  }
}

// ── To hex string ────────────────────────────────────────────
function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0')).join('')
}

// ── Full color info ──────────────────────────────────────────
function getColorInfo(r: number, g: number, b: number): ColorInfo {
  const hsl = rgbToHsl(r, g, b)
  return { hex: toHex(r, g, b), r, g, b, h: hsl.h, s: hsl.s, l: hsl.l }
}

// ── Palette generation ───────────────────────────────────────
function complementary(info: ColorInfo): ColorInfo {
  const rgb = hslToRgb((info.h + 180) % 360, info.s, info.l)
  return getColorInfo(rgb.r, rgb.g, rgb.b)
}

function triadic(info: ColorInfo): ColorInfo[] {
  const rgb1 = hslToRgb((info.h + 120) % 360, info.s, info.l)
  const rgb2 = hslToRgb((info.h + 240) % 360, info.s, info.l)
  return [
    info,
    getColorInfo(rgb1.r, rgb1.g, rgb1.b),
    getColorInfo(rgb2.r, rgb2.g, rgb2.b),
  ]
}

function analogous(info: ColorInfo): ColorInfo[] {
  const rgbMinus = hslToRgb((info.h - 30 + 360) % 360, info.s, info.l)
  const rgbPlus = hslToRgb((info.h + 30) % 360, info.s, info.l)
  return [
    getColorInfo(rgbMinus.r, rgbMinus.g, rgbMinus.b),
    info,
    getColorInfo(rgbPlus.r, rgbPlus.g, rgbPlus.b),
  ]
}

// ── WCAG contrast ratio ──────────────────────────────────────
function contrastRatio(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const l1 = relativeLuminance(r1, g1, b1)
  const l2 = relativeLuminance(r2, g2, b2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function contrastLevel(ratio: number): 'AAA' | 'AA' | 'fail' {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  return 'fail'
}

function getContrastResult(info: ColorInfo): ContrastResult {
  const againstWhite = contrastRatio(info.r, info.g, info.b, 255, 255, 255)
  const againstBlack = contrastRatio(info.r, info.g, info.b, 0, 0, 0)
  return {
    ratio: parseFloat(Math.max(againstWhite, againstBlack).toFixed(2)),
    againstWhite: contrastLevel(againstWhite),
    againstBlack: contrastLevel(againstBlack),
  }
}

// ── Color string parsing ─────────────────────────────────────
function parseRgbString(s: string): { r: number; g: number; b: number } | null {
  const match = s.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
  if (!match) return null
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
}

function parseHslString(s: string): { h: number; s: number; l: number } | null {
  const match = s.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i)
  if (!match) return null
  return { h: parseInt(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) }
}

function parseColorToInfo(s: string): ColorInfo {
  const trimmed = s.trim()
  // Try hex
  if (/^#?[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    const rgb = parseHex(trimmed)
    return getColorInfo(rgb.r, rgb.g, rgb.b)
  }
  // Try rgb()
  const rgb = parseRgbString(trimmed)
  if (rgb) return getColorInfo(rgb.r, rgb.g, rgb.b)
  // Try hsl()
  const hsl = parseHslString(trimmed)
  if (hsl) {
    const rgbFromHsl = hslToRgb(hsl.h, hsl.s, hsl.l)
    return getColorInfo(rgbFromHsl.r, rgbFromHsl.g, rgbFromHsl.b)
  }
  throw new Error(`Cannot parse color: "${trimmed}"`)
}

// ── Input parsing ────────────────────────────────────────────
type ColorAction = 'info' | 'contrast' | 'complementary' | 'triadic' | 'analogous' | 'palette'

interface ParsedColorInput {
  action: ColorAction
  color1: ColorInfo
  color2?: ColorInfo
}

function parseInput(input: string): ParsedColorInput {
  const trimmed = input.trim()

  // "contrast #333 #fff" / "contrast #333 on #fff" / "contrast #333 against #fff"
  const contrastWithOn = trimmed.match(/contrast\s+(.+?)\s+(?:on|against|vs?)\s+(.+)/i)
  if (contrastWithOn) {
    return {
      action: 'contrast',
      color1: parseColorToInfo(contrastWithOn[1]),
      color2: parseColorToInfo(contrastWithOn[2]),
    }
  }

  // "contrast #333 #fff" — two space-separated colors
  const contrastTwoColors = trimmed.match(/contrast\s+(.+?)\s+(#\S+|rgb\s*\([^)]+\)|hsl\s*\([^)]+\))/i)
  if (contrastTwoColors) {
    return {
      action: 'contrast',
      color1: parseColorToInfo(contrastTwoColors[1]),
      color2: parseColorToInfo(contrastTwoColors[2]),
    }
  }

  // "complementary #ff0000"
  const compMatch = trimmed.match(/^complementary\s+(.+)/i)
  if (compMatch) {
    return { action: 'complementary', color1: parseColorToInfo(compMatch[1]) }
  }

  // "triadic #ff0000"
  const triadicMatch = trimmed.match(/^triadic\s+(.+)/i)
  if (triadicMatch) {
    return { action: 'triadic', color1: parseColorToInfo(triadicMatch[1]) }
  }

  // "analogous #ff0000"
  const analogousMatch = trimmed.match(/^analogous\s+(.+)/i)
  if (analogousMatch) {
    return { action: 'analogous', color1: parseColorToInfo(analogousMatch[1]) }
  }

  // "palette #6366f1"
  const paletteMatch = trimmed.match(/^palette\s+(.+)/i)
  if (paletteMatch) {
    return { action: 'palette', color1: parseColorToInfo(paletteMatch[1]) }
  }

  // "convert #fff to hsl" — still returns full info
  if (/^convert\s+/i.test(trimmed)) {
    const colorStr = trimmed.replace(/^convert\s+/i, '').replace(/\s+(?:to|in)\s+\w+$/i, '')
    return { action: 'info', color1: parseColorToInfo(colorStr) }
  }

  // Bare color value: "#ff6600", "rgb(255,102,0)", "hsl(24,100%,50%)"
  return { action: 'info', color1: parseColorToInfo(trimmed) }
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const parsed = parseInput(input)

    // Contrast between two colors
    if (parsed.action === 'contrast' && parsed.color2) {
      const ratio = contrastRatio(
        parsed.color1.r, parsed.color1.g, parsed.color1.b,
        parsed.color2.r, parsed.color2.g, parsed.color2.b,
      )
      const level = contrastLevel(ratio)
      const execMs = Date.now() - t0
      const raw = `Contrast: ${ratio.toFixed(2)}:1 (${level})\n${parsed.color1.hex} on ${parsed.color2.hex}`
      return {
        status: 'ok',
        result: { ratio: parseFloat(ratio.toFixed(2)), level, color1: parsed.color1, color2: parsed.color2 },
        displayType: 'color_swatch',
        raw,
        execMs,
      }
    }

    // Complementary only
    if (parsed.action === 'complementary') {
      const info = parsed.color1
      const comp = complementary(info)
      const contrast = getContrastResult(info)
      const execMs = Date.now() - t0
      const raw = [
        `HEX: ${info.hex}`,
        `RGB: rgb(${info.r}, ${info.g}, ${info.b})`,
        `HSL: hsl(${info.h}, ${info.s}%, ${info.l}%)`,
        `Complementary: ${comp.hex}`,
        `Contrast vs White: ${contrast.againstWhite} | vs Black: ${contrast.againstBlack}`,
      ].join('\n')
      return {
        status: 'ok',
        result: { info, complementary: comp, contrast },
        displayType: 'color_swatch',
        raw,
        execMs,
      }
    }

    // Triadic only
    if (parsed.action === 'triadic') {
      const info = parsed.color1
      const tri = triadic(info)
      const execMs = Date.now() - t0
      const raw = [
        `HEX: ${info.hex}`,
        `RGB: rgb(${info.r}, ${info.g}, ${info.b})`,
        `HSL: hsl(${info.h}, ${info.s}%, ${info.l}%)`,
        `Triadic: ${tri.map(c => c.hex).join(', ')}`,
      ].join('\n')
      return {
        status: 'ok',
        result: { info, triadic: tri },
        displayType: 'color_swatch',
        raw,
        execMs,
      }
    }

    // Analogous only
    if (parsed.action === 'analogous') {
      const info = parsed.color1
      const ana = analogous(info)
      const execMs = Date.now() - t0
      const raw = [
        `HEX: ${info.hex}`,
        `RGB: rgb(${info.r}, ${info.g}, ${info.b})`,
        `HSL: hsl(${info.h}, ${info.s}%, ${info.l}%)`,
        `Analogous: ${ana.map(c => c.hex).join(', ')}`,
      ].join('\n')
      return {
        status: 'ok',
        result: { info, analogous: ana },
        displayType: 'color_swatch',
        raw,
        execMs,
      }
    }

    // Full palette or info
    const info = parsed.color1
    const comp = complementary(info)
    const tri = triadic(info)
    const ana = analogous(info)
    const contrast = getContrastResult(info)
    const execMs = Date.now() - t0

    const raw = [
      `HEX: ${info.hex}`,
      `RGB: rgb(${info.r}, ${info.g}, ${info.b})`,
      `HSL: hsl(${info.h}, ${info.s}%, ${info.l}%)`,
      `Complementary: ${comp.hex}`,
      `Triadic: ${tri.map(c => c.hex).join(', ')}`,
      `Analogous: ${ana.map(c => c.hex).join(', ')}`,
      `Contrast vs White: ${contrast.againstWhite} | vs Black: ${contrast.againstBlack}`,
    ].join('\n')

    return {
      status: 'ok',
      result: { info, complementary: comp, triadic: tri, analogous: ana, contrast },
      displayType: 'color_swatch',
      raw,
      execMs,
    }
  } catch (err: unknown) {
    const execMs = Date.now() - t0
    const message = err instanceof Error ? err.message : String(err)
    return { status: 'error', result: { error: message }, displayType: 'error', raw: message, execMs }
  }
}
