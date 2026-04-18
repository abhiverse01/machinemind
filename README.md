# MACHINE MIND

A precision rule engine and AI relay. Full-stack intelligent chat interface built with Next.js 14 (App Router).

## Deploy in 60 Seconds

```bash
git clone <repo> && cd machine-mind
npm install
# Optional: Add Anthropic API key for AI relay mode
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

For Vercel deployment:
```bash
vercel --prod
# Set ANTHROPIC_API_KEY in Vercel environment variables
```

## Environment Setup

Create `.env.local` with:
```
ANTHROPIC_API_KEY=sk-ant-...
```

The API key is **server-side only**. It never touches the browser, session storage, or any client-side code.

## Architecture

```
┌─────────────────────────────────────────────┐
│                  BROWSER                     │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐ │
│  │  React   │  │  Zustand │  │ NLP Engine │ │
│  │   UI     │  │  Store   │  │ + 12 Tools │ │
│  └────┬─────┘  └──────────┘  └────────────┘ │
│       │                                      │
├───────┼──────────────────────────────────────┤
│       │       NEXT.JS API ROUTES             │
│  ┌────▼──────────────────────────────────┐   │
│  │  /api/chat   — Streaming SSE relay    │   │
│  │  /api/tools  — Tool execution         │   │
│  │  /api/validate — Key check (no leak)  │   │
│  └────┬──────────────────────────────────┘   │
│       │                                      │
├───────┼──────────────────────────────────────┤
│       │       EXTERNAL (optional)            │
│  ┌────▼──────────────────────────────────┐   │
│  │        Anthropic Claude API            │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Tool Reference

| Tool | Trigger Syntax | Example | Output Type |
|------|---------------|---------|-------------|
| Calculator | `!calc <expr>` or math expression | `calc 2+3*4` or `sqrt(144)` | code |
| Clock | `!clock` or time query | `time in Tokyo` or `days until Xmas` | text |
| Converter | `!convert` or `<val><unit> to <unit>` | `5km to miles` or `100F to C` | text |
| Encoder | `!encode` or encode/decode keyword | `encode base64 hello` | code |
| Hash | `!hash` or `!uuid` | `sha256 hello` or `uuid` | code |
| Memory | `!remember`, `!recall`, `!forget` | `remember Paris as my_city` | text |
| Word Tools | `!words` or word analysis | `word count The quick brown fox` | text |
| JSON | `!json` or JSON operations | `json format {"a":1}` | code |
| Regex | `!regex` or regex operations | `regex for email` | code |
| Random | `!random`, `!roll` | `roll 2d20` or `flip a coin` | text |
| Color | `!color` or hex/rgb/hsl value | `#ff6600` or `rgb(255,102,0)` | color_swatch |
| System Info | `!help`, `!status`, `!tools` | `!help` | text |

### Tool Chaining

Pipe tools together with `|`:
```
calculator 2+3 | encoder base64
```
Maximum chain depth: 5 steps. Cycles are detected and rejected.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Ctrl/Cmd + ,` | Toggle settings |
| `Ctrl/Cmd + K` | Focus input |
| `Ctrl/Cmd + Shift + C` | Clear session |
| `Escape` | Toggle tool tray |

## How It Works

### NLP Pipeline
1. **Tokenizer** — Expands contractions, normalizes input, extracts entities
2. **Classifier** — Matches against 262 rules (priority-ordered), falls back to weighted keyword scoring
3. **Router** — Routes to response template or tool execution
4. **Composer** — Picks variant from 60+ template categories with recency avoidance

### Mode Switching
- **Rule Engine** (default) — All processing happens locally with rules and tools
- **AI Relay** (when API key present) — Routes to Claude for freeform responses via server-side streaming

### Security
- API key lives in `.env.local` or Vercel environment variables — **never** in the browser
- CSP headers prevent external connections from client-side code
- No `eval()` — math parser is a proper recursive descent implementation
- No `innerHTML` for user content — all rendering uses React's safe interpolation
- Edge Runtime for streaming API route

## Design System

- **Colors**: CSS custom properties with light/dark theme (toggle via settings)
- **Typography**: Inter (UI) + JetBrains Mono (code)
- **Motion**: `cubic-bezier(0.23, 1, 0.32, 1)` — transform + opacity only
- **Layout**: 3-panel responsive (768px breakpoint)

## License

MIT
