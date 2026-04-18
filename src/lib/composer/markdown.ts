// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Safe Markdown Parser
// Converts markdown into structured tokens for React rendering.
// NO innerHTML. NO dangerouslySetInnerHTML.
// Uses textContent / createTextNode semantics — all content is
// treated as plain text; only structure is parsed.
// ─────────────────────────────────────────────────────────────

export interface MarkdownToken {
  type:
    | 'text'
    | 'code'
    | 'code_block'
    | 'bold'
    | 'italic'
    | 'bold_italic'
    | 'strikethrough'
    | 'link'
    | 'heading'
    | 'list_item'
    | 'ordered_list_item'
    | 'line_break'
    | 'hr'
    | 'paragraph'
    | 'blockquote'
  content: string
  language?: string   // for code blocks
  href?: string       // for links
  level?: number      // for headings (1-6)
  children?: MarkdownToken[]
  order?: number      // for ordered list items
}

// ───────────────────────────────────────────────────────────────
// Inline pattern matchers (order matters — more specific first)
// ───────────────────────────────────────────────────────────────

interface InlineMatch {
  type: 'bold_italic' | 'bold' | 'italic' | 'strikethrough' | 'code' | 'link'
  start: number
  end: number
  content: string
  href?: string
}

const INLINE_PATTERNS: Array<{
  pattern: RegExp
  type: InlineMatch['type']
  extract: (match: RegExpMatchArray) => { content: string; href?: string }
}> = [
  // Bold+italic: ***text*** or ___text___
  {
    pattern: /\*{3}(.+?)\*{3}|_{3}(.+?)_{3}/,
    type: 'bold_italic',
    extract: (m) => ({ content: m[1] || m[2] }),
  },
  // Bold: **text** or __text__
  {
    pattern: /\*{2}(.+?)\*{2}|_{2}(.+?)_{2}/,
    type: 'bold',
    extract: (m) => ({ content: m[1] || m[2] }),
  },
  // Italic: *text* or _text_ (not preceded/followed by * or _)
  {
    pattern: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/,
    type: 'italic',
    extract: (m) => ({ content: m[1] || m[2] }),
  },
  // Strikethrough: ~~text~~
  {
    pattern: /~~(.+?)~~/,
    type: 'strikethrough',
    extract: (m) => ({ content: m[1] }),
  },
  // Inline code: `text`
  {
    pattern: /`(.+?)`/,
    type: 'code',
    extract: (m) => ({ content: m[1] }),
  },
  // Link: [text](url)
  {
    pattern: /\[([^\]]+)\]\(([^)]+)\)/,
    type: 'link',
    extract: (m) => ({ content: m[1], href: m[2] }),
  },
]

/**
 * Find the first inline match in a string starting from a given position.
 */
function findFirstInlineMatch(text: string, fromIndex: number): InlineMatch | null {
  let best: InlineMatch | null = null

  for (const { pattern, type, extract } of INLINE_PATTERNS) {
    // Search from fromIndex onward
    const searchStr = text.slice(fromIndex)
    const match = searchStr.match(pattern)
    if (!match) continue

    // match.index is relative to searchStr
    const absStart = fromIndex + (match.index ?? 0)
    const absEnd = absStart + match[0].length

    // Skip if the match starts with a backslash (escaped)
    if (absStart > 0 && text[absStart - 1] === '\\') continue

    // Skip code patterns inside code blocks (already handled)
    if (type === 'code' && best && best.type === 'code') continue

    // Pick the earliest match; if tied, prefer the more specific type
    if (!best || absStart < best.start) {
      const { content, href } = extract(match)
      best = { type, start: absStart, end: absEnd, content, href }
    }
  }

  return best
}

/**
 * Parse inline markdown (bold, italic, code, links, etc.) into tokens.
 * This recursively handles nested inline elements.
 */
function parseInline(text: string): MarkdownToken[] {
  const tokens: MarkdownToken[] = []
  let pos = 0

  while (pos < text.length) {
    const match = findFirstInlineMatch(text, pos)

    if (!match) {
      // No more inline matches — emit remaining text
      if (pos < text.length) {
        tokens.push({ type: 'text', content: text.slice(pos) })
      }
      break
    }

    // Emit text before the match
    if (match.start > pos) {
      tokens.push({ type: 'text', content: text.slice(pos, match.start) })
    }

    // Emit the matched token with recursively parsed children
    const children = parseInline(match.content)

    if (match.type === 'link') {
      tokens.push({
        type: 'link',
        content: match.content,
        href: match.href,
        children,
      })
    } else if (match.type === 'code') {
      // Code doesn't have further inline parsing
      tokens.push({
        type: 'code',
        content: match.content,
      })
    } else {
      tokens.push({
        type: match.type,
        content: match.content,
        children,
      })
    }

    pos = match.end
  }

  return tokens
}

// ───────────────────────────────────────────────────────────────
// Block-level parser
// ───────────────────────────────────────────────────────────────

/**
 * Parse a full markdown string into a list of structured tokens.
 *
 * Supports:
 * - **bold**, *italic*, ***bold+italic***
 * - `inline code`
 * - ```language ... ``` fenced code blocks
 * - [links](url)
 * - # Heading 1 through ###### Heading 6
 * - - Unordered list items
 * - 1. Ordered list items
 * - > Blockquotes
 * - --- Horizontal rules
 * - \n Line breaks
 * - ~~strikethrough~~
 */
export function parseMarkdown(text: string): MarkdownToken[] {
  const tokens: MarkdownToken[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Fenced code block ──────────────────────────────────
    const fencedMatch = line.match(/^```(\w*)/)
    if (fencedMatch) {
      const language = fencedMatch[1] || undefined
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      // Skip closing ```
      if (i < lines.length) i++
      tokens.push({
        type: 'code_block',
        content: codeLines.join('\n'),
        language,
      })
      continue
    }

    // ── Horizontal rule ────────────────────────────────────
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      tokens.push({ type: 'hr', content: '' })
      i++
      continue
    }

    // ── Heading ────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const content = headingMatch[2].trim()
      tokens.push({
        type: 'heading',
        content,
        level,
        children: parseInline(content),
      })
      i++
      continue
    }

    // ── Blockquote ─────────────────────────────────────────
    const blockquoteMatch = line.match(/^>\s?(.*)$/)
    if (blockquoteMatch) {
      const quoteLines: string[] = [blockquoteMatch[1]]
      i++
      while (i < lines.length && /^>\s?(.*)$/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      const quoteText = quoteLines.join('\n')
      tokens.push({
        type: 'blockquote',
        content: quoteText,
        children: parseInline(quoteText),
      })
      continue
    }

    // ── Unordered list item ────────────────────────────────
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/)
    if (ulMatch) {
      const content = ulMatch[1].trim()
      tokens.push({
        type: 'list_item',
        content,
        children: parseInline(content),
      })
      i++
      continue
    }

    // ── Ordered list item ──────────────────────────────────
    const olMatch = line.match(/^[\s]*(\d+)\.\s+(.+)$/)
    if (olMatch) {
      const order = parseInt(olMatch[1], 10)
      const content = olMatch[2].trim()
      tokens.push({
        type: 'ordered_list_item',
        content,
        order,
        children: parseInline(content),
      })
      i++
      continue
    }

    // ── Empty line → line break ────────────────────────────
    if (line.trim() === '') {
      tokens.push({ type: 'line_break', content: '' })
      i++
      continue
    }

    // ── Paragraph (collect consecutive non-special lines) ──
    const paraLines: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].match(/^```/) &&
      !lines[i].match(/^(-{3,}|\*{3,}|_{3,})\s*$/) &&
      !lines[i].match(/^>\s?/) &&
      !lines[i].match(/^[\s]*[-*+]\s+/) &&
      !lines[i].match(/^[\s]*\d+\.\s+/)
    ) {
      paraLines.push(lines[i])
      i++
    }
    const paraText = paraLines.join('\n')
    tokens.push({
      type: 'paragraph',
      content: paraText,
      children: parseInline(paraText),
    })
  }

  return tokens
}

// ───────────────────────────────────────────────────────────────
// Plain text renderer — converts tokens back to raw text
// ───────────────────────────────────────────────────────────────

/**
 * Convert parsed markdown tokens back to plain text.
 * Strips all formatting, leaving only the raw content.
 */
export function renderMarkdownToText(tokens: MarkdownToken[]): string {
  const parts: string[] = []

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        parts.push(token.content)
        break

      case 'bold':
      case 'italic':
      case 'bold_italic':
      case 'strikethrough':
        if (token.children && token.children.length > 0) {
          parts.push(renderMarkdownToText(token.children))
        } else {
          parts.push(token.content)
        }
        break

      case 'code':
        parts.push(token.content)
        break

      case 'code_block':
        parts.push(token.content)
        break

      case 'link':
        if (token.children && token.children.length > 0) {
          parts.push(renderMarkdownToText(token.children))
        } else {
          parts.push(token.content)
        }
        if (token.href) {
          parts.push(` (${token.href})`)
        }
        break

      case 'heading':
        if (token.children && token.children.length > 0) {
          parts.push(renderMarkdownToText(token.children))
        } else {
          parts.push(token.content)
        }
        parts.push('\n')
        break

      case 'list_item':
      case 'ordered_list_item':
        if (token.children && token.children.length > 0) {
          parts.push(renderMarkdownToText(token.children))
        } else {
          parts.push(token.content)
        }
        parts.push('\n')
        break

      case 'paragraph':
        if (token.children && token.children.length > 0) {
          parts.push(renderMarkdownToText(token.children))
        } else {
          parts.push(token.content)
        }
        break

      case 'blockquote':
        if (token.children && token.children.length > 0) {
          parts.push(renderMarkdownToText(token.children))
        } else {
          parts.push(token.content)
        }
        break

      case 'line_break':
        parts.push('\n')
        break

      case 'hr':
        parts.push('---')
        break

      default:
        parts.push(token.content)
    }
  }

  return parts.join('')
}

// ───────────────────────────────────────────────────────────────
// Utility: extract plain text from raw markdown string
// ───────────────────────────────────────────────────────────────

/**
 * Convenience function: parse markdown and return plain text.
 * Useful for generating accessible labels, tooltips, or search indices.
 */
export function markdownToPlainText(text: string): string {
  return renderMarkdownToText(parseMarkdown(text))
}

// ───────────────────────────────────────────────────────────────
// Utility: extract all links from parsed tokens
// ───────────────────────────────────────────────────────────────

export interface ExtractedLink {
  text: string
  href: string
}

/**
 * Extract all links from parsed markdown tokens.
 */
export function extractLinks(tokens: MarkdownToken[]): ExtractedLink[] {
  const links: ExtractedLink[] = []

  for (const token of tokens) {
    if (token.type === 'link' && token.href) {
      links.push({
        text: token.children ? renderMarkdownToText(token.children) : token.content,
        href: token.href,
      })
    }
    if (token.children) {
      links.push(...extractLinks(token.children))
    }
  }

  return links
}

// ───────────────────────────────────────────────────────────────
// Utility: extract all code blocks from parsed tokens
// ───────────────────────────────────────────────────────────────

export interface ExtractedCodeBlock {
  code: string
  language?: string
}

/**
 * Extract all fenced code blocks from parsed markdown tokens.
 */
export function extractCodeBlocks(tokens: MarkdownToken[]): ExtractedCodeBlock[] {
  const blocks: ExtractedCodeBlock[] = []

  for (const token of tokens) {
    if (token.type === 'code_block') {
      blocks.push({ code: token.content, language: token.language })
    }
    // Code blocks don't have children, but future-proof
    if (token.children) {
      blocks.push(...extractCodeBlocks(token.children))
    }
  }

  return blocks
}
