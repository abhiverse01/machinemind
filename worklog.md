---
Task ID: 1
Agent: main
Task: Fix all TypeScript compilation errors and bugs in MACHINE MIND v4.0

Work Log:
- Fixed sentiment.ts: Replaced unicode escape sequences with literal emoji characters and added `/u` flag to regex pattern
- Fixed personality.ts: Resolved TS2367 comparison error by casting `rules.prefixes` to `{ prefixes?: readonly string[] }`
- Fixed useChat.ts: Replaced `ReturnType<typeof useChatStore>` with explicit `StoreApi = ChatStore` type alias
- Fixed ToolResultCard.tsx: Added missing `list` display type renderer (ListBlock component)
- Fixed chat/route.ts: Rewrote Anthropic SDK dynamic import with proper typing; installed @anthropic-ai/sdk package
- Fixed tokenizer.ts: Corrected dead-code bug in single-quote entity extraction (quoted.push was unconditional)
- Fixed rules.ts: Corrected REGX_005 tool assignment from 'json' to 'regex' (copy-paste bug)
- Fixed rules.ts: Added 6 additional rules (SMTK_010-012, GREET_008-010) to reach 300+ spec requirement
- Fixed rules.ts: Updated header comment from "314 rules" to "300+ rules"
- Fixed clock.ts: Added comprehensive city→IANA timezone mapping (50+ cities) to resolve timezone resolution failures
- Fixed sysinfo.ts: Updated status output to match spec format (MODE/TURNS/TOOLS/UPTIME + keyboard shortcuts + dev credit)
- Created StatusBar.tsx: Extracted inline StatusBar from ChatShell into proper component with turn count support
- Updated ChatShell.tsx: Now imports and uses the extracted StatusBar component, passes turnCount from contextMemory
- Created public/favicon.svg: Simple monochrome "M" logo with accent border
- Created .env.local.example: ANTHROPIC_API_KEY placeholder with documentation

Stage Summary:
- All TypeScript compilation errors resolved (0 errors from `tsc --noEmit`)
- ESLint passes clean
- Dev server starts and returns HTTP 200
- All 12 tools verified working via API (calculator, clock, converter, encoder, hash, random, color, etc.)
- Chat API fallback correctly returns { fallback: true } when no API key
- API validate endpoint correctly reports { hasKey: false }
