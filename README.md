# MACHINE MIND

A full-stack intelligent chat interface built with Next.js 14 (App Router). Operates as a precision rule engine by default and becomes AI-augmented when an Anthropic API key is present. The API key never touches the browser.

## Deploy in 60 Seconds

```bash
# Clone and install
git clone <repo-url> machine-mind
cd machine-mind
npm install

# Set up environment (optional — for AI relay mode)
cp .env.local.example .env.local
# Edit .env.local and add your Anthropic API key

# Deploy to Vercel
vercel --prod
```

## Environment Setup

Create a `.env.local` file in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

- **Without the key**: MACHINE MIND runs in **Rule Engine** mode — all 12 tools and 250+ rules work offline.
- **With the key**: AI Relay mode becomes available — messages route to Claude for AI-powered responses.
- **Security**: The API key lives only in server environment variables. It is NEVER sent to the browser, stored in sessionStorage, or accessible from client-side code.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  CLIENT (Browser)                                   │
│  ┌───────────┐ ┌──────────────┐ ┌────────────────┐ │
│  │ Tool Tray │ │ Chat History │ │  Input Bar     │ │
│  └───────────┘ └──────────────┘ └────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Zustand Store (messages, mode, tool states)    │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │  NLP Pipeline: Tokenize → Classify → Route      │ │
│  └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  NEXT.JS API ROUTES (Edge Runtime)                  │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │ /api/chat│ │/api/tools│ │ /api/validate      │  │
│  │ (SSE)    │ │ (exec)   │ │ (key check)        │  │
│  └────┬─────┘ └──────────┘ └────────────────────┘  │
│       │ API key lives here only                     │
├───────┼─────────────────────────────────────────────┤
│       ▼                                             │
│  ┌──────────────────┐                               │
│  │ Anthropic Claude │  (only if API key is set)     │
│  └──────────────────┘                               │
└─────────────────────────────────────────────────────┘
```

## Tool Reference

| Tool | Trigger Syntax | Example | Output Type |
|------|---------------|---------|-------------|
| Calculator | `!calc <expr>` or math expression | `!calc 2+3*4` or `sqrt(144)` | Code |
| Clock | `!time` or "what time is it" | `!time in JST` | Text |
| Converter | `!convert <val> <unit> to <unit>` | `5km to miles` or `100F to C` | Code |
| Encoder | `!encode <method> <data>` | `!encode base64 hello` | Code |
| Hash | `!hash <text>` or `!uuid` | `!hash hello world` | Code |
| Memory | `!remember`, `!recall`, `!forget` | `!remember Paris as city` | Text |
| Word Tools | `!word <text>` | `!word count hello world` | Code |
| JSON | `!json <text>` | `!json format {"a":1}` | Code |
| Regex | `!regex test /pattern/ text` | `!regex test /\d+/ abc123` | Code |
| Random | `!roll NdM`, `!random`, `!password` | `!roll 2d20` or `!password 16` | Text |
| Color | `!color <hex>` | `!color #ff6600` | Color Swatch |
| System Info | `!help`, `!status`, `!tools` | `!status` | Text |

### Tool Chaining

Use the pipe `|` separator to chain tools. Maximum depth: 5. Cycles are detected and rejected.

```
!calc 2+3 | encoder base64
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Ctrl+K` / `Cmd+K` | Focus input |
| `Ctrl+,` / `Cmd+,` | Toggle settings |
| `Escape` | Close settings / toggle tray |
| `Ctrl+Shift+C` / `Cmd+Shift+C` | Clear session |

## How It Works

### NLP Pipeline

1. **Tokenize**: Input is normalized (contractions expanded, lowercase, operators preserved) and split into tokens.
2. **Classify**: Tokens are matched against 250+ rules sorted by priority. Highest-priority match wins.
3. **Route**: The winning rule either:
   - Invokes a built-in tool (calculator, clock, encoder, etc.)
   - Composes a response from 60+ template variants
   - Routes to the AI relay (if enabled and no tool matched)

### Mode Switching

- **Rule Engine** (default): All processing happens locally. Fast, offline-capable.
- **AI Relay**: Messages are sent to the Anthropic API via server-side Edge Runtime. The API key never leaves the server. If no key is configured, the system silently falls back to the rule engine.

### Context Memory

- Short-term window: last 12 exchanges
- Entity stack: last 5 named entities (pronoun resolution)
- Context flags: track conversation state (greeted, math operation, etc.)
- Session variables: store/recall key-value pairs via the memory tool

## Security

- API key is server-side only (environment variables, never browser-accessible)
- Content Security Policy: `connect-src 'self'` — no direct browser-to-Anthropic calls
- No `eval()` — calculator uses a recursive descent parser
- No `innerHTML` for user content — all rendering uses React interpolation
- TypeScript strict mode enabled
- Edge Runtime for streaming API routes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **State**: Zustand
- **Styling**: CSS Custom Properties + Tailwind CSS
- **Fonts**: Inter + JetBrains Mono (via next/font)
- **AI**: Anthropic Claude (optional, server-side only)

## License

MIT
