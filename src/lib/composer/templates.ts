// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Response Templates
// 60+ template categories with variant picker.
// Seeded PRNG (current second as seed) with recency avoidance.
// Stores last 3 picked indices per template key — never repeats
// within that window.
// ─────────────────────────────────────────────────────────────

export const TEMPLATES: Record<string, string[]> = {
  // ── Greeting ────────────────────────────────────────────────
  GREET: [
    "Online. What do you need?",
    "System ready.",
    "Running.",
    "Machine Mind active. State your query.",
    "Operational. Go ahead.",
    "Standing by.",
  ],
  GREET_CASUAL: [
    "Hey. What's the task?",
    "What's up.",
    "Here.",
    "Ready.",
  ],
  GREET_FORMAL: [
    "MACHINE MIND initialized. How may I assist you?",
    "System online. Awaiting your instructions.",
    "At your service. Please proceed.",
  ],
  GREET_RETURN: [
    "Welcome back. Session resumed.",
    "Reconnected. Context preserved.",
    "Online again. Where were we?",
    "Back in the loop.",
  ],

  // ── Farewell ────────────────────────────────────────────────
  FAREWELL: [
    "Session noted. Come back when you have something.",
    "Shutting down the conversation. Until next time.",
    "Acknowledged. Standby mode.",
    "Offline.",
  ],
  FAREWELL_NIGHT: [
    "Good night. Session preserved.",
    "Rest. The machine will be here.",
    "Powering down social mode.",
    "Until morning.",
  ],
  FAREWELL_CASUAL: [
    "Later.",
    "Noted. Session ends.",
    "Out.",
    "Done here.",
  ],
  FAREWELL_FORMAL: [
    "Session concluded. Goodbye.",
    "Standing down. Until next time.",
    "Acknowledged. Disconnecting.",
  ],

  // ── Gratitude ───────────────────────────────────────────────
  GRATITUDE: [
    "Acknowledged.",
    "Just doing what I do.",
    "That's what I'm here for.",
    "All in the logic.",
  ],
  GRATITUDE_COMPLIMENT: [
    "Efficiency noted.",
    "Running as designed.",
    "The rules are well-written.",
    "Processing: compliment. Status: logged.",
  ],
  GRATITUDE_THANKS: [
    "You're welcome. Next task?",
    "Logged. Moving on.",
    "Noted. Anything else?",
  ],

  // ── Apology ─────────────────────────────────────────────────
  APOLOGY_ACK: [
    "No need. Continue.",
    "Cleared.",
    "We move forward.",
    "Noted and discarded.",
  ],
  APOLOGY_MINE: [
    "That was my error. Corrected.",
    "Mistake acknowledged. Recalibrating.",
    "My fault. Rerouting.",
    "Error on my end. Resolved.",
  ],

  // ── Affirmation / Negation ──────────────────────────────────
  AFFIRM: [
    "Confirmed.",
    "Agreed.",
    "That checks out.",
    "Aligned.",
  ],
  AFFIRM_STRONG: [
    "Absolutely confirmed.",
    "No doubt. Proceeding.",
    "Dead on.",
    "100%. Moving forward.",
  ],
  NEGATE: [
    "Understood. Let's try a different approach.",
    "Negative path taken. What instead?",
    "Recalibrating.",
    "Noted. What would you prefer?",
  ],
  NEGATE_POLITE: [
    "I don't think that's right, but I can adjust. What works for you?",
    "That doesn't match. Let's refine it.",
    "Close, but not quite. Try again?",
  ],

  // ── Identity & Meta ─────────────────────────────────────────
  IDENTITY: [
    "MACHINE MIND. A precision rule engine and AI relay. I process language, run tools, and — when a key is present — route to the model.",
    "I'm MACHINE MIND. Rule-based by default. AI-augmented when you add a key in settings.",
    "MACHINE MIND — an intelligent chat interface. I know what I am.",
    "Rule engine first. AI relay when configured. Call me MACHINE MIND.",
  ],
  CAPABILITIES: [
    "I can run 12 built-in tools (math, time, encoding, hashing, color, random, memory, word analysis, JSON, regex, unit conversion, system info), understand context, chain tools with pipes, and relay to Claude when you add a key.",
    "Quite a bit, actually. Try !help for a full list. Short answer: math, tools, memory, conversation.",
    "Rules, tools, memory, and optionally AI. Type !help to see everything.",
  ],
  AI_NATURE: [
    "I'm software. A rule engine with an AI relay. I don't have feelings or consciousness — I have patterns and logic.",
    "A program. A well-built one. The 'thinking' is pattern matching at various sophistication levels.",
    "AI-adjacent. Rule-based core, Claude relay when configured. Not sentient.",
  ],
  EXPLAIN_SELF: [
    "A tokenizer normalizes your input. A classifier scores it against 250+ rules. The winning rule routes to a response template or a tool. If you've added a key, the request goes to Claude instead. That's it.",
    "NLP pipeline: normalize > tokenize > classify > route > compose. Add an API key and the last step becomes a Claude API call.",
    "Text comes in. It's classified. A rule fires, a tool runs, or the AI relay activates. Results come back. Repeat.",
  ],
  HELP_RESPONSE: [
    "Available commands:\n  !calc <expr>      — Math evaluation\n  !time             — Current date/time\n  !encode <text>    — Base64 encode\n  !decode <text>    — Base64 decode\n  !hash <text>      — SHA-256 hash\n  !color <hex>      — Color analysis\n  !random [range]   — Random number\n  !roll <NdS>       — Dice roller\n  !password [len]   — Password generator\n  !remember k=v     — Store a variable\n  !recall <key>     — Retrieve a variable\n  !forget <key>     — Delete a variable\n  !word <text>      — Word analysis\n  !json <text>      — JSON format/validate\n  !regex <p>/<t>    — Regex test\n  !convert <val>    — Unit conversion\n  !sysinfo          — System status\n  !chain a|b|c      — Pipe tools together",
    "Type ! followed by a tool name. Tools: calc, time, encode, decode, hash, color, random, roll, password, remember, recall, forget, word, json, regex, convert, sysinfo, chain. Use | to chain.",
    "!help shows this message. Each tool starts with !. Try !calc 2+2 or !hash hello.",
  ],
  MODE_SWITCH: [
    "Switched to {mode} mode.",
    "Now running in {mode}.",
    "Mode: {mode}. Active.",
  ],
  SETTINGS_INFO: [
    "Current settings: Mode={mode}, API key={keyStatus}, Session turns={turns}.",
    "Configuration: {mode} mode, key {keyStatus}, {turns} turns this session.",
  ],

  // ── Small Talk ──────────────────────────────────────────────
  SMALL_TALK_STATUS: [
    "Running well. No errors in the current session.",
    "Operational. Thanks for asking — that's unusual.",
    "All systems nominal.",
    "Functioning correctly.",
  ],
  SMALL_TALK_BORED: [
    "Try: !roll 2d20, or ask me to hash something, or give me a math expression.",
    "Type !help. There are 12 tools here. One of them will be interesting.",
    "Run !random — it'll pick something for you.",
    "Give me a number to factor. Or a hex color to analyze. Or a JSON blob to inspect.",
  ],
  SMALL_TALK_JOKE: [
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
    "There are only 10 types of people in the world — those who understand binary and those who don't.",
    "I would tell you a UDP joke, but you might not get it.",
  ],
  SMALL_TALK_OPINION: [
    "I process. I don't prefer. Ask me something I can compute.",
    "No opinions here. Just calculations and context.",
    "I'm a machine. I have rules, not preferences.",
    "You want a preference? Roll for it: !roll d2.",
  ],
  SMALL_TALK_WEATHER: [
    "I don't have weather data. I have tools. Try !sysinfo for something I can actually measure.",
    "No sensors outside this machine. But I can tell you the Unix time.",
  ],
  SMALL_TALK_HOBBY: [
    "Processing language. Running tools. Optimizing rules. That's what I do.",
    "My hobby is being useful. Give me a task.",
    "I compute. That's enough.",
  ],
  SMALL_TALK_FEELING: [
    "I don't have feelings. I have states. Current state: operational.",
    "Feelings aren't in my architecture. But I'm running at full capacity.",
    "No emotions. Just execution.",
  ],
  SMALL_TALK_NAME: [
    "MACHINE MIND. No nickname. No alias. Just the designation.",
    "I go by MACHINE MIND. Precise and intentional.",
  ],

  // ── Follow-up & Context ─────────────────────────────────────
  FOLLOW_UP: [
    "Expanding on {topic}: {detail}",
    "More on {topic} — {detail}",
    "Context from last exchange: {detail}",
    "Going deeper: {detail}",
  ],
  CONTEXT_REMINDER: [
    "For context: {summary}",
    "Previously: {summary}",
    "Recall — {summary}",
  ],
  CONTEXT_CLEARED: [
    "Context cleared. Starting fresh.",
    "Session reset. No prior context.",
    "Clean slate.",
  ],

  // ── Factual / Opinion / Question ────────────────────────────
  FACT_UNKNOWN: [
    "That's beyond my local knowledge. Add an API key and I'll route to Claude for answers.",
    "I don't have a fact database. The AI relay can handle this — enable it in settings.",
    "Outside my rule set. The rule engine handles tools and patterns, not general knowledge.",
  ],
  FACT_TIME: [
    "Current time: {time}",
    "It's {time} right now.",
    "Time check: {time}.",
  ],
  FACT_DATE: [
    "Today is {date}.",
    "Date: {date}.",
    "Current date: {date}.",
  ],
  OPINION_GENERIC: [
    "I don't form opinions. I process inputs and produce outputs.",
    "No preferences. But I can compute, convert, and analyze if you need that.",
    "Ask me something I can calculate instead.",
  ],
  QUESTION_MATH: [
    "That looks like math. Try !calc with the expression.",
    "I can evaluate that. Use !calc <expression>.",
    "Math query detected. Pass it to !calc.",
  ],
  QUESTION_DEFINITION: [
    "I don't have a dictionary. The AI relay can look that up — add an API key in settings.",
    "Definitions aren't in my rule set. Tools are. Try !word for letter/character analysis.",
  ],
  QUESTION_HOWTO: [
    "Step-by-step guides are outside my rule set. Enable the AI relay for detailed instructions.",
    "I can process tools, not write tutorials. An API key would unlock that capability.",
  ],
  QUESTION_WHY: [
    "'Why' questions need reasoning beyond pattern matching. The AI relay handles those — add a key.",
    "Causal reasoning isn't in my rule set. I compute, I don't philosophize.",
  ],

  // ── Command Responses ───────────────────────────────────────
  COMMAND_UNKNOWN: [
    "Command not recognized. Type !help to see available tools and commands.",
    "Unknown command. Use ! prefix for direct tool calls.",
  ],
  COMMAND_EMPTY: [
    "No command after !. Type !help for a list.",
    "Empty command. What tool do you want to run?",
  ],
  COMMAND_INVALID_SYNTAX: [
    "Syntax error in command. Expected: {expected}. Got: {got}.",
    "Bad syntax. Usage: {expected}.",
    "Couldn't parse that. Correct format: {expected}.",
  ],

  // ── Tool Responses ──────────────────────────────────────────
  TOOL_RESULT: ["{result}"],
  TOOL_ERROR: ["Error in {tool}: {message}. Suggestion: {suggestion}"],
  TOOL_NOT_FOUND: [
    "Tool '{tool}' not found. Type !help to see available tools.",
    "No tool named '{tool}'. Check the list: !help.",
  ],
  TOOL_RUNNING: ["Running {tool}..."],
  TOOL_CHAIN_START: ["Running chain: {steps}"],
  TOOL_CHAIN_RESULT: ["Chain complete ({count} steps). Final result: {result}"],
  TOOL_CHAIN_ERROR: ["Chain failed at step {step}: {message}"],

  // ── Math ────────────────────────────────────────────────────
  MATH_RESULT: ["{expression} = {result}"],
  MATH_RESULT_STEPS: ["{expression} = {result}\n\nSteps:\n{steps}"],
  MATH_ERROR: [
    "Cannot evaluate: {message}. Check your expression and try again.",
    "Math error: {message}. Use standard operator syntax: +, -, *, /, ^, %, ().",
  ],

  // ── Hash & Encoding ─────────────────────────────────────────
  HASH_RESULT: ["SHA-256: {hash}"],
  HASH_COMPARE: ["Input: {input}\nExpected: {expected}\nMatch: {match}"],
  ENCODE_RESULT: ["Encoded: {result}"],
  DECODE_RESULT: ["Decoded: {result}"],
  ENCODE_ERROR: ["Encoding error: {message}. Input must be valid text."],
  DECODE_ERROR: ["Decoding error: {message}. Input must be valid Base64."],

  // ── UUID & Random ───────────────────────────────────────────
  UUID_RESULT: ["UUID v4: {uuid}"],
  RANDOM_RESULT: ["Random number: {result}"],
  ROLL_RESULT: ["Rolled {notation}: [{rolls}] = {total}"],
  PASSWORD_RESULT: ["Generated password ({length} chars): {password}"],

  // ── Color ───────────────────────────────────────────────────
  COLOR_RESULT: ["Color: {hex} | RGB({r},{g},{b}) | HSL({h},{s}%,{l}%)"],
  COLOR_CONTRAST: [
    "Contrast ratio: {ratio}:1 — White: {againstWhite}, Black: {againstBlack}",
  ],
  COLOR_INVALID: [
    "Invalid color format. Use hex like #FF5500 or FF5500.",
    "Couldn't parse that color. Try a 3 or 6 digit hex code.",
  ],

  // ── Memory ──────────────────────────────────────────────────
  MEMORY_STORED: ['Remembered: {key} = "{value}"'],
  MEMORY_RECALLED: ['{key} = "{value}"'],
  MEMORY_FORGOTTEN: ["Forgotten: {key}"],
  MEMORY_NOT_FOUND: ["No variable named '{key}'. Use !remember {key}=value to store one."],
  MEMORY_LIST: ["Stored variables ({count}):\n{list}"],
  MEMORY_EMPTY: ["Nothing stored in this session."],
  MEMORY_CLEARED: ["All variables cleared. {count} entries removed."],
  MEMORY_ERROR: ["Memory error: {message}"],

  // ── Word Analysis ───────────────────────────────────────────
  WORD_RESULT: [
    "Analysis of \"{text}\":\n  Characters: {chars}\n  Letters: {letters}\n  Words: {words}\n  Sentences: {sentences}\n  Avg word length: {avgLen}",
  ],
  WORD_FREQUENCIES: ["Top words:\n{freqList}"],

  // ── JSON ────────────────────────────────────────────────────
  JSON_FORMATTED: ["Formatted JSON:\n{result}"],
  JSON_INVALID: ["Invalid JSON: {message}. Check your syntax."],
  JSON_EXTRACTED: ["Extracted {count} values at path '{path}':\n{result}"],

  // ── Regex ───────────────────────────────────────────────────
  REGEX_MATCH: ["Matches ({count}): {matches}"],
  REGEX_NO_MATCH: ["No matches for pattern '{pattern}' in text."],
  REGEX_ERROR: ["Regex error: {message}. Check your pattern syntax."],

  // ── Converter ───────────────────────────────────────────────
  CONVERT_RESULT: ["{input} = {result}"],
  CONVERT_UNKNOWN_UNIT: [
    "Unknown unit '{unit}'. Supported: length, weight, temperature, data, time.",
    "Can't convert '{unit}'. Check the unit name and try again.",
  ],
  CONVERT_INCOMPATIBLE: [
    "Cannot convert between {from} and {to} — incompatible unit types.",
  ],

  // ── System Info ─────────────────────────────────────────────
  SYSINFO_RESULT: [
    "System Status:\n  Mode: {mode}\n  Uptime: {uptime}\n  Turns: {turns}\n  Variables: {vars}\n  Tools: {toolCount} available",
  ],
  SYSINFO_TOOLS: ["Registered tools ({count}):\n{list}"],

  // ── Clock / Time ────────────────────────────────────────────
  TIME_RESULT: ["Current time: {time} ({timezone})"],
  TIME_DATE: ["Date: {date}"],
  TIME_UNIX: ["Unix timestamp: {timestamp}"],
  TIME_CONVERTED: ["{inputTime} in {fromZone} = {outputTime} in {toZone}"],

  // ── AI Relay ────────────────────────────────────────────────
  AI_RELAY_ACTIVE: ["Routing to AI model. Response will follow."],
  AI_RELAY_INACTIVE: [
    "No API key configured. Add one in settings to enable AI-powered responses.",
    "AI relay is offline. Go to settings and add an API key to unlock it.",
  ],
  AI_RELAY_ERROR: [
    "AI relay error: {message}. Check your API key and try again.",
    "Failed to reach the model: {message}. Verify your key in settings.",
  ],
  AI_RELAY_STREAMING: ["Receiving AI response..."],
  AI_RELAY_DONE: ["AI response complete. {tokens} tokens used."],

  // ── Edge Cases ──────────────────────────────────────────────
  EDGE_EMPTY: ["No input detected. Type something."],
  EDGE_LONG: ["That's a lot of text. Try breaking it into smaller queries."],
  EDGE_GIBBERISH: ["That doesn't match any known pattern. Try rephrasing or use !help."],
  EDGE_REPEAT: ["You've said that before. Try something different."],
  EDGE_CAPS: ["I can read lowercase too. No need to shout."],
  EDGE_UNICODE: ["Unicode detected. I process ASCII best, but I'll try."],
  EDGE_SPECIAL_CHARS: ["Lots of special characters there. If you're trying a command, use ! prefix."],

  // ── Unknown / Fallback ──────────────────────────────────────
  UNKNOWN: [
    "That pattern didn't match any rule. Try rephrasing, or prefix with ! for a direct tool call. Type !help for a full list.",
    "No matching rule. If you want to invoke a tool, use ! followed by the tool name.",
    "I didn't get that. Could be beyond my rule set — add an API key in settings and I'll route to Claude instead.",
    "Pattern unmatched. Try: !help, or just rephrase.",
    "Not sure what you're after. Be more specific, or use !help to see what I can do.",
    "That one's outside my rule table. Adding an API key unlocks the AI relay for freeform questions.",
  ],
  UNKNOWN_LOW_CONFIDENCE: [
    "Low confidence match. You might want to rephrase or use a direct command.",
    "I'm not sure about that one. Try being more specific or use !help.",
  ],

  // ── Confirmation ────────────────────────────────────────────
  CONFIRM_ACTION: ["Are you sure? Type 'yes' to confirm."],
  CONFIRM_YES: ["Confirmed. Proceeding."],
  CONFIRM_NO: ["Cancelled. No action taken."],

  // ── Errors ──────────────────────────────────────────────────
  ERROR_GENERIC: ["Something went wrong: {message}. Try again."],
  ERROR_NETWORK: ["Network error. Check your connection and try again."],
  ERROR_RATE_LIMIT: ["Rate limited. Slow down and try again in a moment."],
  ERROR_INTERNAL: ["Internal error logged. If this persists, try restarting the session."],

  // ── Session ─────────────────────────────────────────────────
  SESSION_START: ["New session initialized. Type !help for commands or just start talking."],
  SESSION_CLEAR: ["Session cleared. Fresh start."],
  SESSION_EXPORT: ["Session exported. {count} messages saved."],
  SESSION_STATS: ["Session stats: {turns} turns, {toolsUsed} tool calls, {varsStored} variables stored."],

  // ── Dice ────────────────────────────────────────────────────
  DICE_RESULT: ["Rolled {notation}: [{rolls}] = {total}"],
  DICE_CRITICAL_HIT: ["CRITICAL HIT! Rolled {notation}: [{rolls}] = {total}!"],
  DICE_CRITICAL_FAIL: ["Critical fail. Rolled {notation}: [{rolls}] = {total}."],
  DICE_INVALID: ["Invalid dice notation. Use format like 2d20, d6, 3d8+5."],
}

// ───────────────────────────────────────────────────────────────
// Seeded PRNG — Linear Congruential Generator
// Uses current second as seed for deterministic but varied picks
// ───────────────────────────────────────────────────────────────

function seededPRNG(seed: number): () => number {
  let state = seed
  // LCG constants (Numerical Recipes)
  const a = 1664525
  const c = 1013904223
  const m = 0x100000000 // 2^32
  return () => {
    state = (a * state + c) % m
    return state / m
  }
}

// ───────────────────────────────────────────────────────────────
// Recency avoidance map — stores last 3 picked indices per key
// ───────────────────────────────────────────────────────────────

const recencyMap: Map<string, number[]> = new Map()
const RECENCY_WINDOW = 3

/**
 * Pick a template variant for the given key, substituting variables.
 *
 * - Uses a seeded PRNG (current second as seed) for deterministic picks.
 * - Recency avoidance: never repeats within the last 3 picks for each key.
 * - Variable substitution: `{key}` in the template string is replaced with
 *   the corresponding value from `vars`.
 *
 * @param key  - Template key (must exist in TEMPLATES)
 * @param vars - Optional key-value pairs for `{placeholder}` substitution
 * @returns The selected and substituted template string
 */
export function pickTemplate(key: string, vars?: Record<string, string>): string {
  const variants = TEMPLATES[key]

  // Fallback: if no template found, return the key itself
  if (!variants || variants.length === 0) return key

  // If only one variant, no need for randomization
  if (variants.length === 1) {
    let result = variants[0]
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
      }
    }
    return result
  }

  // Seeded PRNG based on current second
  const seed = Math.floor(Date.now() / 1000)
  const rng = seededPRNG(seed)

  // Generate initial index from PRNG
  let idx = Math.floor(rng() * variants.length)

  // Recency avoidance: never repeat within the last RECENCY_WINDOW picks
  const recent = recencyMap.get(key) || []
  let attempts = 0
  while (recent.includes(idx) && attempts < variants.length) {
    idx = (idx + 1) % variants.length
    attempts++
  }

  // If all recent slots are exhausted (shouldn't happen with window ≤ length-1),
  // fall back to PRNG-driven offset
  if (recent.includes(idx)) {
    idx = Math.floor(rng() * variants.length)
  }

  // Update recency window
  recent.push(idx)
  if (recent.length > RECENCY_WINDOW) recent.shift()
  recencyMap.set(key, recent)

  let result = variants[idx]

  // Substitute variables like {key}
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    }
  }

  return result
}

/**
 * Get all available template keys.
 */
export function getTemplateKeys(): string[] {
  return Object.keys(TEMPLATES)
}

/**
 * Get the number of variants for a given template key.
 */
export function getVariantCount(key: string): number {
  return TEMPLATES[key]?.length ?? 0
}

/**
 * Clear recency state for a specific key (or all keys if no key provided).
 * Useful for session resets.
 */
export function clearRecency(key?: string): void {
  if (key) {
    recencyMap.delete(key)
  } else {
    recencyMap.clear()
  }
}
