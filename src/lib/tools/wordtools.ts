// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Word Tools
// Word count, char count, sentence count, avg word length,
// Flesch reading ease, syllable counter, palindrome, anagram,
// letter frequency.
// ─────────────────────────────────────────────────────────────

import type { ToolResult } from '../types'

// ── Syllable counter (vowel-group heuristic) ─────────────────
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length === 0) return 0
  if (w.length <= 2) return 1

  // Count vowel groups (consecutive vowels count as one syllable)
  let count = 0
  let prevVowel = false
  for (let i = 0; i < w.length; i++) {
    const isVowel = /[aeiouy]/.test(w[i])
    if (isVowel && !prevVowel) count++
    prevVowel = isVowel
  }

  // Subtract for silent e at end
  if (count > 1 && w.endsWith('e')) {
    // But keep for -le endings after consonant (e.g. "table" = 2)
    if (w.length >= 2 && !/[aeiouy]/.test(w[w.length - 2]) && w[w.length - 2] === 'l') {
      // -le ending after consonant: e is pronounced, keep count
    } else {
      count--
    }
  }

  // Handle -es/-ed endings where e is silent
  if (count > 1 && (w.endsWith('es') || w.endsWith('ed'))) {
    // Keep syllable for words like "brushed", "matches" where -ed/-es is pronounced
    if (!/(?:sh|ch|th|ss|x|z)ed$/.test(w) && !/(?:sh|ch|ss|x|z)es$/.test(w)) {
      count--
    }
  }

  return Math.max(count, 1)
}

// ── Palindrome check ─────────────────────────────────────────
function isPalindrome(text: string): boolean {
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '')
  if (cleaned.length === 0) return false
  return cleaned === cleaned.split('').reverse().join('')
}

// ── Anagram check ────────────────────────────────────────────
function areAnagrams(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z]/g, '').split('').sort().join('')
  return normalize(a) === normalize(b)
}

// ── Letter frequency ─────────────────────────────────────────
function letterFrequency(text: string): Array<{ letter: string; count: number }> {
  const freq = new Map<string, number>()
  for (const ch of text.toLowerCase()) {
    if (/[a-z]/.test(ch)) {
      freq.set(ch, (freq.get(ch) ?? 0) + 1)
    }
  }
  return Array.from(freq.entries())
    .map(([letter, count]) => ({ letter, count }))
    .sort((a, b) => b.count - a.count)
}

// ── Flesch reading ease label ────────────────────────────────
function fleschLabel(score: number): string {
  if (score >= 90) return 'Very Easy'
  if (score >= 80) return 'Easy'
  if (score >= 70) return 'Fairly Easy'
  if (score >= 60) return 'Standard'
  if (score >= 50) return 'Fairly Difficult'
  if (score >= 30) return 'Difficult'
  return 'Very Difficult'
}

// ── Full text analysis ───────────────────────────────────────
interface WordAnalysis {
  wordCount: number
  charCount: number
  charCountNoSpaces: number
  sentenceCount: number
  avgWordLength: number
  syllableCount: number
  avgSyllablesPerWord: number
  fleschReadingEase: number
  letterFrequency: Array<{ letter: string; count: number }>
}

function analyzeText(text: string): WordAnalysis {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  const charCount = text.length
  const charCountNoSpaces = text.replace(/\s/g, '').length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = Math.max(sentences.length, 1)

  const avgWordLength = wordCount > 0
    ? words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, '').length, 0) / wordCount
    : 0

  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0)
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0

  const fleschReadingEase = wordCount > 0 && sentenceCount > 0
    ? 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
    : 0

  const freq = letterFrequency(text)

  return {
    wordCount,
    charCount,
    charCountNoSpaces,
    sentenceCount,
    avgWordLength: parseFloat(avgWordLength.toFixed(2)),
    syllableCount,
    avgSyllablesPerWord: parseFloat(avgSyllablesPerWord.toFixed(2)),
    fleschReadingEase: parseFloat(fleschReadingEase.toFixed(2)),
    letterFrequency: freq,
  }
}

// ── Input parsing ────────────────────────────────────────────
type WordAction =
  | 'analyze'
  | 'wordcount'
  | 'charcount'
  | 'syllablecount'
  | 'readability'
  | 'palindrome'
  | 'anagram'
  | 'letterfreq'

interface ParsedWordInput {
  action: WordAction
  text: string
  text2?: string
}

function parseInput(input: string): ParsedWordInput {
  const trimmed = input.trim()

  // "is racecar a palindrome"
  const palMatch = trimmed.match(/is\s+(.+?)\s+(?:a\s+)?palindrome/i)
  if (palMatch) {
    return { action: 'palindrome', text: palMatch[1] }
  }

  // "palindrome racecar"
  if (/^palindrome\s+/i.test(trimmed)) {
    return { action: 'palindrome', text: trimmed.replace(/^palindrome\s+/i, '') }
  }

  // "anagram listen silent"
  const anaMatch = trimmed.match(/anagram\s+(\S+)\s+(\S+)/i)
  if (anaMatch) {
    return { action: 'anagram', text: anaMatch[1], text2: anaMatch[2] }
  }

  // "readability score of some text..."
  const readMatch = trimmed.match(
    /^(?:readability\s+(?:score\s+)?(?:of\s+)?|flesch\s+(?:score\s+)?(?:of\s+)?)([\s\S]+)$/i
  )
  if (readMatch) {
    return { action: 'readability', text: readMatch[1].trim() }
  }

  // "syllable count beautiful"
  const sylMatch = trimmed.match(/^syllable\s+count\s+([\s\S]+)$/i)
  if (sylMatch) {
    return { action: 'syllablecount', text: sylMatch[1].trim() }
  }

  // "character count hello world"
  const charMatch = trimmed.match(/^char(?:acter)?\s+count\s+([\s\S]+)$/i)
  if (charMatch) {
    return { action: 'charcount', text: charMatch[1].trim() }
  }

  // "word count The quick brown fox"
  const wcMatch = trimmed.match(/^word\s+count\s+([\s\S]+)$/i)
  if (wcMatch) {
    return { action: 'wordcount', text: wcMatch[1].trim() }
  }

  // "letter frequency" / "letterfreq"
  if (/^(?:letter\s*freq(?:uency)?|freq)\s+/i.test(trimmed)) {
    return { action: 'letterfreq', text: trimmed.replace(/^(?:letter\s*freq(?:uency)?|freq)\s+/i, '') }
  }

  // "analyze" / "analysis" / "stats"
  const analyzeMatch = trimmed.match(/^(?:analyze|analysis|stats)\s+([\s\S]+)$/i)
  if (analyzeMatch) {
    return { action: 'analyze', text: analyzeMatch[1].trim() }
  }

  // Default: full analysis
  return { action: 'analyze', text: trimmed }
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = Date.now()

  try {
    const parsed = parseInput(input)

    switch (parsed.action) {
      case 'palindrome': {
        const result = isPalindrome(parsed.text)
        const execMs = Date.now() - t0
        const raw = `"${parsed.text}" is ${result ? '' : 'not '}a palindrome`
        return {
          status: 'ok',
          result: { text: parsed.text, isPalindrome: result },
          displayType: 'text',
          raw,
          execMs,
        }
      }

      case 'anagram': {
        if (!parsed.text2) {
          throw new Error('Need two words for anagram check: "anagram word1 word2"')
        }
        const result = areAnagrams(parsed.text, parsed.text2)
        const execMs = Date.now() - t0
        const raw = `"${parsed.text}" and "${parsed.text2}" are ${result ? '' : 'not '}anagrams`
        return {
          status: 'ok',
          result: { a: parsed.text, b: parsed.text2, areAnagrams: result },
          displayType: 'text',
          raw,
          execMs,
        }
      }

      case 'letterfreq': {
        const freq = letterFrequency(parsed.text)
        const execMs = Date.now() - t0
        const raw = freq.map(f => `${f.letter}: ${f.count}`).join(', ')
        return {
          status: 'ok',
          result: freq,
          displayType: 'table',
          raw,
          execMs,
        }
      }

      case 'wordcount': {
        const words = parsed.text.split(/\s+/).filter(w => w.length > 0)
        const count = words.length
        const execMs = Date.now() - t0
        const raw = `Word count: ${count}`
        return {
          status: 'ok',
          result: { text: parsed.text, wordCount: count },
          displayType: 'text',
          raw,
          execMs,
        }
      }

      case 'charcount': {
        const charCount = parsed.text.length
        const charCountNoSpaces = parsed.text.replace(/\s/g, '').length
        const execMs = Date.now() - t0
        const raw = `Characters: ${charCount} (without spaces: ${charCountNoSpaces})`
        return {
          status: 'ok',
          result: { text: parsed.text, charCount, charCountNoSpaces },
          displayType: 'text',
          raw,
          execMs,
        }
      }

      case 'syllablecount': {
        const words = parsed.text.split(/\s+/).filter(w => w.length > 0)
        const perWord = words.map(w => ({ word: w, syllables: countSyllables(w) }))
        const total = perWord.reduce((sum, w) => sum + w.syllables, 0)
        const execMs = Date.now() - t0
        const raw = perWord.length === 1
          ? `"${parsed.text}" has ${total} syllable${total !== 1 ? 's' : ''}`
          : `Total syllables: ${total}\n${perWord.map(w => `  ${w.word}: ${w.syllables}`).join('\n')}`
        return {
          status: 'ok',
          result: { text: parsed.text, syllableCount: total, perWord },
          displayType: 'text',
          raw,
          execMs,
        }
      }

      case 'readability': {
        const analysis = analyzeText(parsed.text)
        const execMs = Date.now() - t0
        const label = fleschLabel(analysis.fleschReadingEase)
        const raw = [
          `Flesch Reading Ease: ${analysis.fleschReadingEase} (${label})`,
          `Words: ${analysis.wordCount} | Sentences: ${analysis.sentenceCount}`,
          `Syllables: ${analysis.syllableCount} (avg ${analysis.avgSyllablesPerWord}/word)`,
          `Avg word length: ${analysis.avgWordLength}`,
        ].join('\n')
        return {
          status: 'ok',
          result: {
            fleschReadingEase: analysis.fleschReadingEase,
            label,
            wordCount: analysis.wordCount,
            sentenceCount: analysis.sentenceCount,
            syllableCount: analysis.syllableCount,
            avgSyllablesPerWord: analysis.avgSyllablesPerWord,
            avgWordLength: analysis.avgWordLength,
          },
          displayType: 'text',
          raw,
          execMs,
        }
      }

      case 'analyze':
      default: {
        const analysis = analyzeText(parsed.text)
        const execMs = Date.now() - t0
        const label = fleschLabel(analysis.fleschReadingEase)
        const lines = [
          `Words: ${analysis.wordCount}`,
          `Characters: ${analysis.charCount} (no spaces: ${analysis.charCountNoSpaces})`,
          `Sentences: ${analysis.sentenceCount}`,
          `Avg word length: ${analysis.avgWordLength}`,
          `Syllables: ${analysis.syllableCount} (avg: ${analysis.avgSyllablesPerWord}/word)`,
          `Flesch Reading Ease: ${analysis.fleschReadingEase} (${label})`,
        ]
        const raw = lines.join('\n')
        return {
          status: 'ok',
          result: { ...analysis, fleschLabel: label },
          displayType: 'text',
          raw,
          execMs,
        }
      }
    }
  } catch (err: unknown) {
    const execMs = Date.now() - t0
    const message = err instanceof Error ? err.message : String(err)
    return {
      status: 'error',
      result: { error: message },
      displayType: 'error',
      raw: message,
      execMs,
    }
  }
}
