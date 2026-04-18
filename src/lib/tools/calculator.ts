// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Calculator Tool
// Recursive descent parser. No eval(). Right-assoc exponentiation.
// Operator precedence: ^ > * / % > + -
// ─────────────────────────────────────────────────────────────

import type { ToolResult, MathStep } from '../types'

// ── Token types ──────────────────────────────────────────────
type TokenType =
  | 'NUMBER'
  | 'IDENT'
  | 'OP'
  | 'LPAREN'
  | 'RPAREN'
  | 'BANG'
  | 'PERCENT'
  | 'COMMA'
  | 'EOF'

interface Token {
  type: TokenType
  value: string
  pos: number
}

// ── Tokenizer ────────────────────────────────────────────────
function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < input.length) {
    const ch = input[i]

    // whitespace
    if (/\s/.test(ch)) {
      i++
      continue
    }

    // number literal (integer, decimal, scientific notation)
    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < input.length && /[0-9]/.test(input[i + 1]))) {
      let num = ''
      // integer part
      while (i < input.length && /[0-9]/.test(input[i])) {
        num += input[i++]
      }
      // decimal part
      if (i < input.length && input[i] === '.') {
        num += input[i++]
        while (i < input.length && /[0-9]/.test(input[i])) {
          num += input[i++]
        }
      }
      // scientific notation e.g. 1.5e10, 2E-3
      if (i < input.length && /[eE]/.test(input[i])) {
        num += input[i++]
        if (i < input.length && /[+-]/.test(input[i])) {
          num += input[i++]
        }
        while (i < input.length && /[0-9]/.test(input[i])) {
          num += input[i++]
        }
      }
      tokens.push({ type: 'NUMBER', value: num, pos: i - num.length })
      continue
    }

    // identifier (function names, constants)
    if (/[a-zA-Z_π]/.test(ch)) {
      let ident = ''
      while (i < input.length && /[a-zA-Z_0-9π]/.test(input[i])) {
        ident += input[i++]
      }
      tokens.push({ type: 'IDENT', value: ident, pos: i - ident.length })
      continue
    }

    // single-char tokens
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', pos: i })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', pos: i })
      i++
      continue
    }
    if (ch === '!') {
      tokens.push({ type: 'BANG', value: '!', pos: i })
      i++
      continue
    }
    if (ch === '%') {
      tokens.push({ type: 'PERCENT', value: '%', pos: i })
      i++
      continue
    }
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',', pos: i })
      i++
      continue
    }
    if ('+-*/^'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch, pos: i })
      i++
      continue
    }

    // skip unknown characters
    i++
  }

  tokens.push({ type: 'EOF', value: '', pos: input.length })
  return tokens
}

// ── Constants ────────────────────────────────────────────────
const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  π: Math.PI,
  e: Math.E,
  phi: (1 + Math.sqrt(5)) / 2,
  // golden ratio aliases
  golden: (1 + Math.sqrt(5)) / 2,
  // common math shortcuts
  inf: Infinity,
  infinity: Infinity,
}

// ── Functions ────────────────────────────────────────────────
const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  log: Math.log10,
  log10: Math.log10,
  log2: Math.log2,
  ln: Math.log,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: (x: number) => Math.round(x),
  sign: Math.sign,
  exp: Math.exp,
}

// ── Factorial (integer only, up to 170) ─────────────────────
function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Factorial requires a non-negative integer, got ${n}`)
  }
  if (n > 170) return Infinity
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

// ── Format number for step display ──────────────────────────
function fmt(n: number): string {
  if (Number.isNaN(n)) return 'NaN'
  if (!Number.isFinite(n)) return n > 0 ? 'Infinity' : '-Infinity'
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString()
  if (Math.abs(n) < 1e-10 || Math.abs(n) > 1e15) return n.toExponential(6)
  // round to avoid floating-point noise
  const rounded = parseFloat(n.toPrecision(12))
  return rounded.toString()
}

// ── Recursive Descent Parser ────────────────────────────────
class Parser {
  private tokens: Token[]
  private pos = 0
  readonly steps: MathStep[] = []

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1]!
  }

  private advance(): Token {
    return this.tokens[this.pos++] ?? this.tokens[this.tokens.length - 1]!
  }

  private expect(type: TokenType): Token {
    const t = this.advance()
    if (t.type !== type) {
      throw new Error(
        `Expected ${type}, got ${t.type} ("${t.value}") at position ${t.pos}`
      )
    }
    return t
  }

  private addStep(expression: string, result: number): void {
    this.steps.push({ expression, result })
  }

  /** Check if parser consumed all tokens; returns leftover token or null. */
  leftover(): Token | null {
    const p = this.peek()
    return p.type === 'EOF' ? null : p
  }

  // ── Grammar entry point ───────────────────────────────────

  // expr := term (('+' | '-') term)*
  parse(): number {
    let left = this.term()
    while (
      this.peek().type === 'OP' &&
      (this.peek().value === '+' || this.peek().value === '-')
    ) {
      const op = this.advance().value
      const right = this.term()
      const leftBefore = left
      left = op === '+' ? leftBefore + right : leftBefore - right
      this.addStep(`${fmt(leftBefore)} ${op} ${fmt(right)}`, left)
    }
    return left
  }

  // term := factor (('*' | '/' | '%') factor)*
  // Disambiguates % between modulo (binary) and percentage (postfix):
  //   "10 % 3"  → modulo (next token starts a new factor)
  //   "50%"     → percentage (next token is EOF, ), +, -, etc.)
  private term(): number {
    let left = this.factor()
    while (true) {
      const p = this.peek()
      // explicit * / operators
      if (p.type === 'OP' && '*/'.includes(p.value)) {
        const op = this.advance().value
        const right = this.factor()
        const leftBefore = left
        if (op === '*') {
          left = leftBefore * right
        } else {
          if (right === 0) throw new Error('Division by zero')
          left = leftBefore / right
        }
        this.addStep(`${fmt(leftBefore)} ${op} ${fmt(right)}`, left)
        continue
      }
      // % token: modulo or postfix percentage?
      if (p.type === 'PERCENT') {
        // Look ahead: if the token after % starts a factor, treat as modulo
        const savedPos = this.pos
        this.advance() // consume %
        const nextAfter = this.peek()
        this.pos = savedPos // restore

        const startsFactor =
          nextAfter.type === 'NUMBER' ||
          nextAfter.type === 'IDENT' ||
          nextAfter.type === 'LPAREN' ||
          (nextAfter.type === 'OP' && (nextAfter.value === '-' || nextAfter.value === '+'))

        if (startsFactor) {
          // Binary modulo: left % right
          this.advance() // consume %
          const right = this.factor()
          const leftBefore = left
          if (right === 0) throw new Error('Modulo by zero')
          left = leftBefore % right
          this.addStep(`${fmt(leftBefore)} % ${fmt(right)}`, left)
        } else {
          // Postfix percentage: divide by 100
          this.advance() // consume %
          const leftBefore = left
          left = leftBefore / 100
          this.addStep(`${fmt(leftBefore)}%`, left)
        }
        continue
      }
      break
    }
    return left
  }

  // factor := base ('!' )* ('^' factor)?  — right-associative exponentiation
  private factor(): number {
    let base = this.base()
    // postfix factorial (e.g. 5!, 3!!) applied before exponentiation
    base = this.maybeFactorial(base)

    if (this.peek().type === 'OP' && this.peek().value === '^') {
      this.advance()
      const exp = this.factor() // right-recursive → right-associative
      const baseBefore = base
      base = Math.pow(baseBefore, exp)
      this.addStep(`${fmt(baseBefore)} ^ ${fmt(exp)}`, base)
    }
    return base
  }

  // Handle postfix ! (factorial) — can chain: 5!!
  private maybeFactorial(val: number): number {
    while (this.peek().type === 'BANG') {
      this.advance()
      const before = val
      val = factorial(val)
      this.addStep(`${fmt(before)}!`, val)
    }
    return val
  }

  // base := number | constant | fn '(' expr ')' | '(' expr ')' | '-' base
  private base(): number {
    const p = this.peek()

    // unary minus
    if (p.type === 'OP' && p.value === '-') {
      this.advance()
      return -this.base()
    }

    // unary plus
    if (p.type === 'OP' && p.value === '+') {
      this.advance()
      return this.base()
    }

    // parenthesized expression
    if (p.type === 'LPAREN') {
      this.advance()
      const val = this.parse()
      this.expect('RPAREN')
      return val
    }

    // number literal
    if (p.type === 'NUMBER') {
      const tok = this.advance()
      const num = parseFloat(tok.value)
      if (Number.isNaN(num)) {
        throw new Error(`Invalid number: "${tok.value}"`)
      }
      return num
    }

    // identifier: could be function call or constant
    if (p.type === 'IDENT') {
      const name = this.advance().value.toLowerCase()

      // function call: fn '(' expr ')'
      if (FUNCTIONS[name] && this.peek().type === 'LPAREN') {
        this.advance() // consume '('
        const arg = this.parse()
        this.expect('RPAREN')
        const fn = FUNCTIONS[name]!
        const result = fn(arg)
        this.addStep(`${name}(${fmt(arg)})`, result)
        return result
      }

      // constant lookup
      if (CONSTANTS[name] !== undefined) {
        return CONSTANTS[name]!
      }

      throw new Error(`Unknown identifier: "${name}"`)
    }

    throw new Error(
      `Unexpected token: ${p.type} "${p.value}" at position ${p.pos}`
    )
  }
}

// ── Percentage-of pattern ───────────────────────────────────
// Handles patterns like:
//   "50% of 200" → 100
//   "25% of 80"  → 20
//   "12.5% of 400" → 50
// Also handles "what is X% of Y" after prefix stripping
function parsePercentageOf(input: string): {
  pct: number
  of: number
  result: number
  expression: string
} | null {
  // Match: <number>% of <number>
  const m = input.match(/^([\d.]+)\s*%\s*(?:of)\s+([\d.]+)$/i)
  if (!m) return null
  const pct = parseFloat(m[1]!)
  const of_ = parseFloat(m[2]!)
  if (Number.isNaN(pct) || Number.isNaN(of_)) return null
  const result = (pct / 100) * of_
  return { pct, of: of_, result, expression: `${pct}% of ${of_}` }
}

// ── Prefix stripping ────────────────────────────────────────
// Removes conversational prefixes so the parser receives clean math
const PREFIX_RE =
  /^(?:calculate|compute|evaluate|what\s+is|what's|whats|calc|solve|math)\s+/i

function stripPrefix(input: string): string {
  return input.replace(PREFIX_RE, '').trim()
}

// ── Format final number for display ─────────────────────────
function formatResult(n: number): string {
  if (Number.isNaN(n)) return 'NaN'
  if (!Number.isFinite(n)) return n > 0 ? 'Infinity' : '-Infinity'
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString()
  if (Math.abs(n) < 1e-10 || Math.abs(n) > 1e15) return n.toExponential(6)
  const rounded = parseFloat(n.toPrecision(12))
  return rounded.toString()
}

// ── Format steps as readable strings ────────────────────────
function formatSteps(steps: MathStep[]): string[] {
  return steps.map((s) => `${s.expression} = ${fmt(s.result)}`)
}

// ── Main execute ─────────────────────────────────────────────
export async function execute(input: string): Promise<ToolResult> {
  const t0 = performance.now()

  try {
    let trimmed = input.trim()

    // Strip conversational prefixes
    trimmed = stripPrefix(trimmed)

    if (!trimmed) {
      const execMs = performance.now() - t0
      return {
        status: 'error',
        result: { error: 'Empty expression' },
        displayType: 'error',
        raw: 'Empty expression',
        execMs,
      }
    }

    // ── Special case: "X% of Y" pattern ──────────────────────
    const pctOf = parsePercentageOf(trimmed)
    if (pctOf) {
      const execMs = performance.now() - t0
      const formatted = formatResult(pctOf.result)
      const steps: MathStep[] = [
        {
          expression: pctOf.expression,
          result: pctOf.result,
        },
      ]
      return {
        status: 'ok',
        result: {
          value: pctOf.result,
          steps,
          stepStrings: formatSteps(steps),
          formatted,
        },
        displayType: 'code',
        raw: formatted,
        execMs,
      }
    }

    // ── General expression: tokenize + parse ──────────────────
    const tokens = tokenize(trimmed)
    const parser = new Parser(tokens)
    const value = parser.parse()

    // Ensure we consumed all tokens (except EOF)
    const remaining = parser.leftover()
    if (remaining) {
      throw new Error(
        `Unexpected token after expression: ${remaining.type} "${remaining.value}" at position ${remaining.pos}`
      )
    }

    const steps = parser.steps
    const formatted = formatResult(value)
    const execMs = performance.now() - t0

    return {
      status: 'ok',
      result: {
        value,
        steps,
        stepStrings: formatSteps(steps),
        formatted,
      },
      displayType: 'code',
      raw: formatted,
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
