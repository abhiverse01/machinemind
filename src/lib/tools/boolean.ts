// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Boolean Tool v5.0
// Evaluates yes/no computational questions with proof.
// Primality, perfect powers, divisibility, coprimality,
// range checks, palindromes, anagrams, even/odd, and more.
// ─────────────────────────────────────────────────────────────

import type { ToolResult, BooleanResult } from '../types'

// ── Helper: Greatest Common Divisor (Euclidean algorithm) ─────

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

// ── Helper: Check primality via trial division ────────────────

function checkPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  if (n === 3) return true
  if (n % 3 === 0) return false
  // 6k±1 optimization
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0) return false
    if (n % (i + 2) === 0) return false
  }
  return true
}

// ── Helper: Find the first (smallest) factor > 1 ─────────────

function firstFactor(n: number): number {
  if (n <= 1) return n
  if (n % 2 === 0) return 2
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return i
  }
  return n
}

// ── Helper: Integer nth root ─────────────────────────────────

function integerNthRoot(n: number, k: number): number {
  if (n < 0 && k % 2 === 0) return -1
  const absN = Math.abs(n)
  if (absN === 0) return 0
  if (absN === 1) return 1

  // Newton's method for integer root
  let x = Math.pow(absN, 1 / k)
  // Refine to exact integer
  let lo = Math.floor(x) - 1
  let hi = Math.ceil(x) + 1

  // Binary search for exact root
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const power = Math.pow(mid, k)
    if (power === absN) return mid
    if (power < absN) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return -1 // No exact integer root
}

// ── Helper: Check if a number is a power of 2 ────────────────

function isPowerOf2(n: number): boolean {
  if (!Number.isInteger(n) || n < 1) return false
  return (n & (n - 1)) === 0
}

// ── Helper: Parse a number from text ─────────────────────────

function parseNumber(text: string): number | null {
  const cleaned = text.replace(/,/g, '').trim()
  const n = Number(cleaned)
  if (!Number.isNaN(n) && cleaned !== '') return n
  return null
}

// ── Pattern matchers ─────────────────────────────────────────

/**
 * Try to match the input against known boolean query patterns.
 * Returns a BooleanResult or null if no pattern matches.
 */
function evaluate(input: string): BooleanResult | null {
  const lower = input.toLowerCase().trim()

  // ── Primality: "is N prime?" ──────────────────────────────
  const primeMatch = lower.match(
    /^is\s+([\d,.]+)\s+prime\??$/i
  )
  if (primeMatch) {
    const n = parseNumber(primeMatch[1]!)
    if (n === null || !Number.isInteger(n)) {
      return { value: false, expression: primeMatch[0], proof: `${primeMatch[1]} is not a valid integer` }
    }
    const isPrime = checkPrime(n)
    if (isPrime) {
      return {
        value: true,
        expression: `Is ${n} prime?`,
        proof: `${n} has no divisors other than 1 and itself (verified by trial division up to √${n} ≈ ${Math.floor(Math.sqrt(n))})`,
      }
    } else {
      const factor = firstFactor(n)
      return {
        value: false,
        expression: `Is ${n} prime?`,
        proof: `${n} is divisible by ${factor} (${factor} × ${n / factor} = ${n})`,
      }
    }
  }

  // ── Perfect square: "is N a perfect square?" ─────────────
  const squareMatch = lower.match(
    /^is\s+([\d,.]+)\s+(?:a\s+)?perfect\s+square\??$/i
  )
  if (squareMatch) {
    const n = parseNumber(squareMatch[1]!)
    if (n === null || !Number.isInteger(n) || n < 0) {
      return { value: false, expression: squareMatch[0], proof: `${squareMatch[1]} is not a valid non-negative integer` }
    }
    const root = integerNthRoot(n, 2)
    if (root > 0 && root * root === n) {
      return {
        value: true,
        expression: `Is ${n} a perfect square?`,
        proof: `${n} = ${root}²`,
      }
    } else {
      const floor = Math.floor(Math.sqrt(n))
      return {
        value: false,
        expression: `Is ${n} a perfect square?`,
        proof: `√${n} ≈ ${Math.sqrt(n).toFixed(4)}, between ${floor}²=${floor * floor} and ${floor + 1}²=${(floor + 1) * (floor + 1)}`,
      }
    }
  }

  // ── Perfect cube: "is N a perfect cube?" ──────────────────
  const cubeMatch = lower.match(
    /^is\s+([\d,.]+)\s+(?:a\s+)?perfect\s+cube\??$/i
  )
  if (cubeMatch) {
    const n = parseNumber(cubeMatch[1]!)
    if (n === null || !Number.isInteger(n)) {
      return { value: false, expression: cubeMatch[0], proof: `${cubeMatch[1]} is not a valid integer` }
    }
    const root = integerNthRoot(n, 3)
    if (root > 0 && root * root * root === n) {
      return {
        value: true,
        expression: `Is ${n} a perfect cube?`,
        proof: `${n} = ${root}³`,
      }
    } else {
      const approx = Math.cbrt(n)
      const floor = Math.floor(approx)
      return {
        value: false,
        expression: `Is ${n} a perfect cube?`,
        proof: `∛${n} ≈ ${approx.toFixed(4)}, between ${floor}³=${floor * floor * floor} and ${floor + 1}³=${(floor + 1) * (floor + 1) * (floor + 1)}`,
      }
    }
  }

  // ── Divisibility: "is N divisible by M?" ──────────────────
  const divMatch = lower.match(
    /^is\s+([\d,.]+)\s+divisible\s+by\s+([\d,.]+)\??$/i
  )
  if (divMatch) {
    const n = parseNumber(divMatch[1]!)
    const m = parseNumber(divMatch[2]!)
    if (n === null || m === null) {
      return { value: false, expression: divMatch[0], proof: 'Could not parse numbers' }
    }
    if (m === 0) {
      return { value: false, expression: `Is ${n} divisible by 0?`, proof: 'Division by zero is undefined' }
    }
    const isDivisible = n % m === 0
    if (isDivisible) {
      return {
        value: true,
        expression: `Is ${n} divisible by ${m}?`,
        proof: `${n} ÷ ${m} = ${n / m} (exact)`,
      }
    } else {
      return {
        value: false,
        expression: `Is ${n} divisible by ${m}?`,
        proof: `${n} ÷ ${m} = ${(n / m).toFixed(4)} (remainder ${n % m})`,
      }
    }
  }

  // ── Coprimality: "are N and M coprime?" ───────────────────
  const coprimeMatch = lower.match(
    /^are\s+([\d,.]+)\s+and\s+([\d,.]+)\s+coprime\??$/i
  )
  if (coprimeMatch) {
    const a = parseNumber(coprimeMatch[1]!)
    const b = parseNumber(coprimeMatch[2]!)
    if (a === null || b === null) {
      return { value: false, expression: coprimeMatch[0], proof: 'Could not parse numbers' }
    }
    const g = gcd(a, b)
    if (g === 1) {
      return {
        value: true,
        expression: `Are ${a} and ${b} coprime?`,
        proof: `gcd(${a}, ${b}) = 1, so they share no common factors`,
      }
    } else {
      return {
        value: false,
        expression: `Are ${a} and ${b} coprime?`,
        proof: `gcd(${a}, ${b}) = ${g}, so they share a common factor of ${g}`,
      }
    }
  }

  // ── Range check: "is N in/between M to P?" ───────────────
  const rangeMatch = lower.match(
    /^is\s+([\d,.]+)\s+(?:in|between)\s+([\d,.]+)\s+(?:to|and)\s+([\d,.]+)\??$/i
  )
  if (rangeMatch) {
    const n = parseNumber(rangeMatch[1]!)
    const lo = parseNumber(rangeMatch[2]!)
    const hi = parseNumber(rangeMatch[3]!)
    if (n === null || lo === null || hi === null) {
      return { value: false, expression: rangeMatch[0], proof: 'Could not parse numbers' }
    }
    const minVal = Math.min(lo, hi)
    const maxVal = Math.max(lo, hi)
    const inRange = n >= minVal && n <= maxVal
    if (inRange) {
      return {
        value: true,
        expression: `Is ${n} between ${lo} and ${hi}?`,
        proof: `${n} ∈ [${minVal}, ${maxVal}]`,
      }
    } else {
      return {
        value: false,
        expression: `Is ${n} between ${lo} and ${hi}?`,
        proof: `${n} ∉ [${minVal}, ${maxVal}]`,
      }
    }
  }

  // ── Palindrome: "is X a palindrome?" ──────────────────────
  const palinMatch = lower.match(
    /^is\s+(.+?)\s+(?:a\s+)?palindrome\??$/i
  )
  if (palinMatch) {
    const raw = palinMatch[1]!.trim()
    // Strip quotes if present
    const cleaned = raw.replace(/^["'`]+|["'`]+$/g, '')
    // For palindrome check, ignore case and non-alphanumeric
    const normalized = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '')
    const reversed = normalized.split('').reverse().join('')
    const isPalin = normalized === reversed
    if (isPalin) {
      return {
        value: true,
        expression: `Is "${cleaned}" a palindrome?`,
        proof: `"${normalized}" reads the same forwards and backwards`,
      }
    } else {
      return {
        value: false,
        expression: `Is "${cleaned}" a palindrome?`,
        proof: `"${normalized}" reversed is "${reversed}"`,
      }
    }
  }

  // ── Anagram: "are X and Y anagrams?" ──────────────────────
  const anagramMatch = lower.match(
    /^are\s+(.+?)\s+and\s+(.+?)\s+anagrams\??$/i
  )
  if (anagramMatch) {
    const raw1 = anagramMatch[1]!.trim().replace(/^["'`]+|["'`]+$/g, '')
    const raw2 = anagramMatch[2]!.trim().replace(/^["'`]+|["'`]+$/g, '')
    const norm1 = raw1.toLowerCase().replace(/\s+/g, '').split('').sort().join('')
    const norm2 = raw2.toLowerCase().replace(/\s+/g, '').split('').sort().join('')
    const isAnagram = norm1 === norm2
    if (isAnagram) {
      return {
        value: true,
        expression: `Are "${raw1}" and "${raw2}" anagrams?`,
        proof: `Both sort to the same letter sequence: "${norm1}"`,
      }
    } else {
      return {
        value: false,
        expression: `Are "${raw1}" and "${raw2}" anagrams?`,
        proof: `"${raw1}" sorts to "${norm1}", "${raw2}" sorts to "${norm2}"`,
      }
    }
  }

  // ── String contains: "does X contain Y?" ──────────────────
  const containsMatch = lower.match(
    /^does\s+(.+?)\s+contain\s+(.+?)\??$/i
  )
  if (containsMatch) {
    const raw1 = containsMatch[1]!.trim().replace(/^["'`]+|["'`]+$/g, '')
    const raw2 = containsMatch[2]!.trim().replace(/^["'`]+|["'`]+$/g, '')
    const contains = raw1.toLowerCase().includes(raw2.toLowerCase())
    if (contains) {
      return {
        value: true,
        expression: `Does "${raw1}" contain "${raw2}"?`,
        proof: `"${raw2}" found at position ${raw1.toLowerCase().indexOf(raw2.toLowerCase())}`,
      }
    } else {
      return {
        value: false,
        expression: `Does "${raw1}" contain "${raw2}"?`,
        proof: `"${raw2}" not found in "${raw1}"`,
      }
    }
  }

  // ── Even: "is N even?" ────────────────────────────────────
  const evenMatch = lower.match(
    /^is\s+([\d,.]+)\s+even\??$/i
  )
  if (evenMatch) {
    const n = parseNumber(evenMatch[1]!)
    if (n === null || !Number.isInteger(n)) {
      return { value: false, expression: evenMatch[0], proof: `${evenMatch[1]} is not a valid integer` }
    }
    const isEven = n % 2 === 0
    return {
      value: isEven,
      expression: `Is ${n} even?`,
      proof: isEven
        ? `${n} ÷ 2 = ${n / 2} (no remainder)`
        : `${n} ÷ 2 = ${Math.floor(n / 2)} remainder 1`,
    }
  }

  // ── Odd: "is N odd?" ──────────────────────────────────────
  const oddMatch = lower.match(
    /^is\s+([\d,.]+)\s+odd\??$/i
  )
  if (oddMatch) {
    const n = parseNumber(oddMatch[1]!)
    if (n === null || !Number.isInteger(n)) {
      return { value: false, expression: oddMatch[0], proof: `${oddMatch[1]} is not a valid integer` }
    }
    const isOdd = n % 2 !== 0
    return {
      value: isOdd,
      expression: `Is ${n} odd?`,
      proof: isOdd
        ? `${n} ÷ 2 = ${Math.floor(n / 2)} remainder 1`
        : `${n} ÷ 2 = ${n / 2} (no remainder)`,
    }
  }

  // ── Power of two: "is N a power of 2?" ────────────────────
  const pow2Match = lower.match(
    /^is\s+([\d,.]+)\s+(?:a\s+)?power\s+of\s+2\??$/i
  )
  if (pow2Match) {
    const n = parseNumber(pow2Match[1]!)
    if (n === null || !Number.isInteger(n)) {
      return { value: false, expression: pow2Match[0], proof: `${pow2Match[1]} is not a valid integer` }
    }
    const isPow2 = isPowerOf2(n)
    if (isPow2) {
      const exp = Math.log2(n)
      return {
        value: true,
        expression: `Is ${n} a power of 2?`,
        proof: `${n} = 2^${exp} (binary: ${n.toString(2)})`,
      }
    } else {
      return {
        value: false,
        expression: `Is ${n} a power of 2?`,
        proof: `${n} is not a power of 2 (binary: ${n.toString(2)} — has more than one 1-bit)`,
      }
    }
  }

  // ── No pattern matched ────────────────────────────────────
  return null
}

// ── Main execute ─────────────────────────────────────────────

export async function execute(input: string): Promise<ToolResult> {
  const t0 = performance.now()

  try {
    const trimmed = input.trim()

    if (!trimmed) {
      const execMs = performance.now() - t0
      return {
        status: 'error',
        result: { error: 'Empty boolean input.' },
        displayType: 'error',
        raw: 'Empty boolean input',
        execMs,
      }
    }

    // Strip common prefixes
    const cleaned = trimmed
      .replace(/^(?:!bool|boolean|bool)\s*/i, '')
      .trim()

    const result = evaluate(cleaned)

    if (result === null) {
      const execMs = performance.now() - t0
      return {
        status: 'error',
        result: {
          error:
            'Unsupported boolean query. Supported patterns: ' +
            'is N prime?, is N a perfect square?, is N a perfect cube?, ' +
            'is N divisible by M?, are N and M coprime?, ' +
            'is N in/between M to P?, is X a palindrome?, ' +
            'are X and Y anagrams?, does X contain Y?, ' +
            'is N even?, is N odd?, is N a power of 2?',
        },
        displayType: 'error',
        raw: 'Unsupported boolean query',
        execMs,
      }
    }

    const execMs = performance.now() - t0

    return {
      status: 'ok',
      result,
      displayType: 'text',
      raw: String(result.value),
      execMs,
    }
  } catch (err: unknown) {
    const execMs = performance.now() - t0
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
