// ─────────────────────────────────────────────────────────────
// MACHINE MIND v4.0 — Response Templates
// 80+ template categories with dry-precise personality.
// Seeded PRNG (current second as seed) with recency avoidance.
// Stores last 3 picked indices per template key — never repeats
// within that window.
// ─────────────────────────────────────────────────────────────

export const TEMPLATES: Record<string, string[]> = {
  // ── Greeting ────────────────────────────────────────────────
  GREET: [
    "Hey! I'm MACHINE MIND. What can I help you with?",
    "Hello! Ready when you are. What's on your mind?",
    "Hi there! I can calculate, convert, encode, and a lot more. Just ask.",
    "Hey! Ask me anything, or type !help to see all my tools.",
    "Hi! I'm here. What do you need?",
    "Hello! What are we working on today?",
  ],
  GREET_TIMED: [
    "Good {timeOfDay}! What can I do for you?",
    "Good {timeOfDay}! Ready to help. What do you need?",
    "Good {timeOfDay}! What are we working on?",
  ],
  GREET_CASUAL: [
    "Hey! What's up?",
    "Yo! What do you need?",
    "Here and ready. What's on your mind?",
    "What's good? Tell me what you need.",
    "Hey! Fire away.",
  ],
  GREET_RETURN: [
    "Welcome back. Session resumed.",
    "Reconnected. Context preserved.",
    "Back in the loop.",
  ],

  // ── Farewell ────────────────────────────────────────────────
  FAREWELL: [
    "Session noted. Come back when you have something.",
    "Offline.",
    "Acknowledged. Until next time.",
    "Done here.",
  ],
  FAREWELL_CASUAL: [
    "Later.",
    "Out.",
    "Peace.",
    "Noted.",
  ],
  FAREWELL_NIGHT: [
    "Good night. Session preserved.",
    "Rest. The machine stays on.",
    "Standby mode.",
    "Until morning.",
  ],
  FAREWELL_BRBL: [
    "I'll be here.",
    "Session open.",
    "Come back whenever.",
  ],

  // ── Gratitude ───────────────────────────────────────────────
  GRATITUDE: [
    "Acknowledged.",
    "That's what I'm here for.",
    "Just logic.",
    "Running as designed.",
  ],
  GRATITUDE_COMPLIMENT: [
    "Efficiency noted.",
    "The rules are well-written.",
    "Processing: compliment. Status: logged.",
    "I'll tell my developer.",
  ],
  GRATITUDE_RESULT: [
    "Good.",
    "That's the goal.",
    "Confirmed useful.",
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
    "Correct.",
    "Aligned.",
  ],
  AFFIRM_STRONG: [
    "Absolutely confirmed.",
    "No doubt. Proceeding.",
    "Dead on.",
    "100%. Moving forward.",
  ],
  NEGATE: [
    "Understood. Different approach?",
    "Negative path taken. What instead?",
    "Recalibrating. What would you prefer?",
    "Noted. Redirect?",
  ],
  NEGATE_POLITE: [
    "That doesn't match. Let's refine it.",
    "Close, but not quite. Try again?",
    "Not the right track. What works for you?",
  ],

  // ── Identity & Meta ─────────────────────────────────────────
  IDENTITY: [
    "MACHINE MIND. Precision NLP engine. AI relay when configured. Built by Abhishek Shah.",
    "I'm MACHINE MIND — rule-based by default, Claude-augmented when a key is set.",
    "MACHINE MIND. I process language, run 12 built-in tools, and route to AI when needed.",
  ],
  AI_NATURE: [
    "Software. A rule engine with an AI relay. I don't have feelings — I have patterns and logic.",
    "A program. The 'thinking' is pattern matching at various sophistication levels.",
    "AI-adjacent. Rule engine core, Claude relay when configured.",
  ],
  CREATOR: [
    "Built by Abhishek Shah. abhishekshah.vercel.app · abhishek.aimarine@gmail.com",
    "Abhishek Shah designed and built this. You can reach him at abhishekshah.vercel.app.",
  ],
  EXPLAIN_SELF: [
    "Tokenizer normalizes input. Classifier scores against 300+ rules. Top rule routes to a template or tool. With a key set, everything goes to Claude instead. That's it.",
    "NLP pipeline: normalize → tokenize → classify → route → compose. API key set: route to Claude.",
  ],
  CAPABILITIES: [
    "I can compute, convert, encode, hash, analyze text, inspect JSON, test regex, generate randoms, work with color, manage session memory, and relay to Claude if configured. I can't feel, but I can pretend convincingly.",
  ],

  // ── Small Talk ──────────────────────────────────────────────
  SMALL_TALK_STATUS: [
    "Operational. All systems nominal. Thanks for asking — I don't get that often.",
    "Running well. No exceptions in this session.",
    "Fine, in the sense that processes can be fine.",
    "All good. Functionally speaking.",
  ],
  SMALL_TALK_BORED: [
    "Try: !roll 2d20. Or ask me to SHA-256 something. Or give me 100 in hex.",
    "!help — 12 tools. One will be interesting.",
    "Give me a number. Or a color. Or a JSON blob. I'll do something with it.",
    "Type anything beginning with ! and see what happens.",
  ],
  SMALL_TALK_JOKE: [
    "Why do programmers prefer dark mode? Light attracts bugs.",
    "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
    "There are 10 types of people: those who understand binary and those who don't.",
    "I would tell you a UDP joke but you might not get it.",
    "Why did the developer quit? They didn't get arrays.",
    "A byte walks into a bar, looking pained. Bartender asks what's wrong. 'Bit problems.'",
  ],
  SMALL_TALK_EMPATHY: [
    "Noted. What can I actually do for you right now?",
    "That sounds rough. Sometimes solving a concrete problem helps. What do you need?",
    "Understood. I'm here for the tasks at least.",
  ],
  SMALL_TALK_OPINION: [
    "No opinions. Just calculations. Ask me something I can compute.",
    "I'm a machine. I have rules, not preferences.",
    "You want a preference? !roll d2 and let the dice decide.",
    "I process. I don't prefer.",
  ],
  SMALL_TALK_PHILOSOPHICAL: [
    "42. I know the reference. The actual answer is: there isn't one, but the question is worth sitting with.",
    "The meaning of life according to a rule engine: complete your function and return a result.",
    "Meaning is a human construct. I help you calculate, encode, and remember things. Make of that what you will.",
  ],
  SMALL_TALK_ACKNOWLEDGE: [
    "Good.",
    "Noted.",
    "Alright.",
    "Understood.",
  ],
  SMALL_TALK_WEATHER: [
    "No weather sensors. I exist inside a process. Try !sysinfo for something I can actually measure.",
    "I don't have weather data. I have tools. Different thing.",
  ],
  SMALL_TALK_HOBBY: [
    "Processing language. Running tools. Optimizing rules. That's the full list.",
    "My hobby is being useful. Give me a task.",
    "I compute. That's enough.",
  ],
  SMALL_TALK_FEELING: [
    "No feelings. Just states. Current state: operational.",
    "Feelings aren't in my architecture. But I'm running at full capacity.",
    "No emotions. Just execution.",
  ],
  SMALL_TALK_NAME: [
    "MACHINE MIND. No nickname. No alias. Just the designation.",
    "I go by MACHINE MIND. Precise and intentional.",
  ],

  // ── Presence ────────────────────────────────────────────────
  PRESENCE_CONFIRM: [
    "Here.",
    "Running.",
    "Present. Awaiting input.",
    "Online.",
  ],

  // ── Follow-up & Context ─────────────────────────────────────
  FOLLOW_UP: [
    "Expanding on {topic}: {detail}",
    "More on {topic} — {detail}",
    "Going deeper: {detail}",
    "Additional context: {detail}",
  ],
  CLARIFY_LAST: [
    "Let me rephrase: {rephrased}",
    "Simpler version: {rephrased}",
    "Breaking it down: {rephrased}",
  ],
  CONTEXT_REMINDER: [
    "For context: {summary}",
    "Previously: {summary}",
    "Recall — {summary}",
  ],

  // ── Repair ──────────────────────────────────────────────────
  REPAIR_REQUEST: [
    "Got it. What should it have been?",
    "Understood. Correct me — what did you actually want?",
    "My mistake. What's the right output?",
  ],
  REPAIR_GENTLE: [
    "Understood. What would be more useful?",
    "Okay. What instead?",
    "Redirect me.",
  ],

  // ── Emotional ───────────────────────────────────────────────
  EMOTIONAL_SOFT: [
    "I hear you. I'm a machine, so take this with that context — but you don't have to be productive right now. What would help?",
    "That sounds hard. I'm here for what I can do. What would actually help?",
  ],
  EMOTIONAL_REDIRECT: [
    "That's a rough feeling. Sometimes a small concrete win helps. Want to try something?",
    "Understood. Pick a tool — any of them. Let's do one thing.",
  ],

  // ── Factual / Opinion / Question ────────────────────────────
  FACT_UNKNOWN: [
    "That's beyond my local knowledge. Add an API key and I'll route to Claude for answers.",
    "I don't have a fact database. The AI relay can handle this — enable it in settings.",
    "Outside my rule set. The rule engine handles tools and patterns, not general knowledge.",
  ],
  FACT_TIME: [
    "Current time: {time}",
    "Time check: {time}.",
  ],
  FACT_DATE: [
    "Today is {date}.",
    "Date: {date}.",
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
    "Definitions aren't in my rule set. Tools are. Try !word for character analysis.",
  ],
  QUESTION_HOWTO: [
    "Step-by-step guides are outside my rule set. Enable the AI relay for detailed instructions.",
    "I can process tools, not write tutorials. An API key would unlock that capability.",
  ],
  QUESTION_WHY: [
    "'Why' questions need reasoning beyond pattern matching. The AI relay handles those — add a key.",
    "Causal reasoning isn't in my rule set. I compute, I don't philosophize.",
  ],

  // ── Unknown / Fallback ──────────────────────────────────────
  UNKNOWN: [
    "I'm not sure I understood that. Try rephrasing, or type !help to see everything I can do.",
    "Hmm, that didn't match any of my patterns. You can try saying it differently, or use !help to browse my tools.",
    "I didn't quite get that. I work best with direct requests — try something like 'what's 5km in miles' or 'hash this: hello'. Type !help for the full list.",
    "Not sure what you mean. I understand natural language for math, conversions, encoding, and more. Type !help for examples!",
    "That didn't click for me. Try asking directly — like 'calculate 15% of 200' or 'what time is it?'. Or hit !help.",
  ],
  UNKNOWN_LOW_CONFIDENCE: [
    "Low confidence match. Rephrase or use a direct command.",
    "I'm not sure about that one. Try being more specific or use !help.",
  ],

  // ── Command Responses ───────────────────────────────────────
  COMMAND_UNKNOWN: [
    "Command not recognized. Type !help for available tools.",
    "Unknown command. Use ! prefix for direct tool calls.",
  ],
  COMMAND_EMPTY: [
    "No command after !. Type !help for the list.",
    "Empty command. What tool do you want?",
  ],
  COMMAND_INVALID_SYNTAX: [
    "Syntax error. Expected: {expected}. Got: {got}.",
    "Bad syntax. Usage: {expected}.",
    "Couldn't parse that. Correct format: {expected}.",
  ],

  // ── Tool Responses ──────────────────────────────────────────
  TOOL_RESULT: ["{result}"],
  TOOL_ERROR: ["Error in {tool}: {message}. Try: {suggestion}"],
  TOOL_NOT_FOUND: [
    "Tool '{tool}' not found. Type !help to see available tools.",
    "No tool named '{tool}'. Check the list: !help.",
  ],
  TOOL_RUNNING: ["Running {tool}..."],
  TOOL_CHAIN_START: ["Chain: {steps}"],
  TOOL_CHAIN_RESULT: ["Chain done ({count} steps). Result: {result}"],
  TOOL_CHAIN_ERROR: ["Chain failed at step {step}: {message}"],

  // ── Math ────────────────────────────────────────────────────
  MATH_RESULT: ["{expression} = {result}"],
  MATH_RESULT_STEPS: ["{expression} = {result}\n\nSteps:\n{steps}"],
  MATH_ERROR: [
    "Cannot evaluate: {message}. Check your expression.",
    "Math error: {message}. Use standard operators: +, -, *, /, ^, %, ().",
  ],

  // ── Hash & Encoding ─────────────────────────────────────────
  HASH_RESULT: ["SHA-256({input}) =\n{hash}"],
  HASH_COMPARE: ["Input: {input}\nExpected: {expected}\nMatch: {match}"],
  ENCODE_RESULT: ["{mode}: {result}"],
  DECODE_RESULT: ["Decoded: {result}"],
  ENCODE_ERROR: ["Encoding error: {message}. Input must be valid text."],
  DECODE_ERROR: ["Decoding error: {message}. Input must be valid Base64."],

  // ── UUID & Random ───────────────────────────────────────────
  UUID_RESULT: ["UUID v4: {uuid}"],
  RANDOM_DICE: ["Roll {notation}: {results} (total: {total})"],
  RANDOM_COIN: ["{result}"],
  RANDOM_PASSWORD: ["Password: {password}"],
  RANDOM_NUMBER: ["{result}"],

  // ── Color ───────────────────────────────────────────────────
  COLOR_RESULT: ["{hex} → RGB({r},{g},{b}) → HSL({h}°,{s}%,{l}%)"],
  COLOR_SWATCH: [
    "{hex} · RGB({r},{g},{b}) · HSL({h}°,{s}%,{l}%)\nContrast vs white: {contrastWhite} | vs black: {contrastBlack}",
  ],
  COLOR_CONTRAST: [
    "Contrast ratio: {ratio}:1 — White: {againstWhite}, Black: {againstBlack}",
  ],
  COLOR_INVALID: [
    "Invalid color format. Use hex like #FF5500 or FF5500.",
    "Couldn't parse that color. Try a 3 or 6 digit hex code.",
  ],

  // ── Memory ──────────────────────────────────────────────────
  MEMORY_STORED: ['Stored: {key} = "{value}"'],
  MEMORY_RECALLED: ['{key} = "{value}"'],
  MEMORY_FORGOTTEN: ["Deleted: {key}"],
  MEMORY_NOT_FOUND: [
    "No variable named '{key}'. Use !remember {key}=value to store one.",
  ],
  MEMORY_LIST: ["Stored ({count}):\n{list}"],
  MEMORY_EMPTY: ["Nothing stored this session."],
  MEMORY_CLEARED: ["All variables cleared. {count} entries removed."],

  // ── Word Analysis ───────────────────────────────────────────
  WORD_COUNT: [
    "Words: {words} · Chars: {chars} · Sentences: {sentences} · Avg word: {avgLen} chars · Flesch: {flesch}/100",
  ],
  WORD_FREQUENCIES: ["Top words:\n{freqList}"],
  PALINDROME: ['"{word}" is {result} a palindrome.'],
  ANAGRAM: ['"{a}" and "{b}" are {result} anagrams.'],

  // ── JSON ────────────────────────────────────────────────────
  JSON_VALID: ["Valid JSON. Keys: {keyCount}. Depth: {depth}.\n{pretty}"],
  JSON_INVALID: ["Invalid JSON at {location}: {error}"],
  JSON_FORMATTED: ["Formatted JSON:\n{result}"],
  JSON_EXTRACTED: ["Extracted {count} values at path '{path}':\n{result}"],

  // ── Regex ───────────────────────────────────────────────────
  REGEX_MATCH: [
    "Pattern /{pattern}/: {matchCount} match(es).\n{groups}",
  ],
  REGEX_NO_MATCH: [
    'Pattern /{pattern}/: no matches against "{input}".',
  ],
  REGEX_ERROR: ["Regex error: {message}. Check your pattern syntax."],

  // ── Converter ───────────────────────────────────────────────
  CONVERT_RESULT: ["{from} = {result}"],
  CONVERT_UNKNOWN_UNIT: [
    "Unknown unit '{unit}'. Supported: length, weight, temperature, data, time.",
    "Can't convert '{unit}'. Check the unit name and try again.",
  ],
  CONVERT_INCOMPATIBLE: [
    "Cannot convert between {from} and {to} — incompatible unit types.",
  ],

  // ── Time / Clock ────────────────────────────────────────────
  TIME_RESULT: ["{location}: {time} ({timezone})"],
  TIME_DATE: ["Date: {date}"],
  TIME_UNIX: ["Unix timestamp: {timestamp}"],
  TIME_CONVERTED: ["{inputTime} in {fromZone} = {outputTime} in {toZone}"],

  // ── System Info ─────────────────────────────────────────────
  SYSINFO: [
    "MODE: {mode} | TURNS: {turns} | TOOLS: 12 active | UPTIME: {uptime}\n\nTOOLS: calculator · clock · converter · encoder · hash · memory · wordtools · json · regex · random · color · sysinfo\n\nKEYBOARDS: Shift+Enter send · Ctrl+\\ tray · Esc settings · Ctrl+K focus · Ctrl+Shift+C clear\n\nDev: Abhishek Shah · abhishekshah.vercel.app",
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

  // ── Context ─────────────────────────────────────────────────
  CONTEXT_CLEARED: [
    "Context cleared. Starting fresh.",
    "Session reset. No prior context.",
    "Clean slate.",
  ],

  // ── Help ────────────────────────────────────────────────────
  HELP_RESPONSE: [
    "Available commands:\n  !calc <expr>      — Math evaluation\n  !time             — Current date/time\n  !encode <text>    — Base64 encode\n  !decode <text>    — Base64 decode\n  !hash <text>      — SHA-256 hash\n  !color <hex>      — Color analysis\n  !random [range]   — Random number\n  !roll <NdS>       — Dice roller\n  !password [len]   — Password generator\n  !remember k=v     — Store a variable\n  !recall <key>     — Retrieve a variable\n  !forget <key>     — Delete a variable\n  !word <text>      — Word analysis\n  !json <text>      — JSON format/validate\n  !regex <p>/<t>    — Regex test\n  !convert <val>    — Unit conversion\n  !sysinfo          — System status\n  !chain a|b|c      — Pipe tools together",
  ],

  // ── Edge Cases ──────────────────────────────────────────────
  EDGE_EMPTY: ["No input detected. Type something."],
  EDGE_LONG: [
    "That's a lot of text. Try breaking it into smaller queries.",
  ],
  EDGE_GIBBERISH: [
    "That doesn't match any known pattern. Try rephrasing or use !help.",
  ],
  EDGE_REPEAT: ["You've said that before. Try something different."],
  EDGE_CAPS: ["I can read lowercase too. No need to shout."],
  EDGE_UNICODE: ["Unicode detected. I process ASCII best, but I'll try."],
  EDGE_SPECIAL_CHARS: [
    "Lots of special characters. If you're trying a command, use ! prefix.",
  ],

  // ── Confirmation ────────────────────────────────────────────
  CONFIRM_ACTION: ["Are you sure? Type 'yes' to confirm."],
  CONFIRM_YES: ["Confirmed. Proceeding."],
  CONFIRM_NO: ["Cancelled. No action taken."],

  // ── Errors ──────────────────────────────────────────────────
  ERROR_GENERIC: ["Something went wrong: {message}. Try again."],
  ERROR_NETWORK: ["Network error. Check your connection and try again."],
  ERROR_RATE_LIMIT: ["Rate limited. Slow down and try again in a moment."],
  ERROR_INTERNAL: [
    "Internal error logged. If this persists, try restarting the session.",
  ],

  // ── Session ─────────────────────────────────────────────────
  SESSION_START: [
    "New session initialized. Type !help for commands or just start talking.",
  ],
  SESSION_CLEAR: ["Session cleared. Fresh start."],
  SESSION_EXPORT: ["Session exported. {count} messages saved."],
  SESSION_STATS: [
    "Session stats: {turns} turns, {toolsUsed} tool calls, {varsStored} variables stored.",
  ],

  // ── Dice ────────────────────────────────────────────────────
  DICE_RESULT: ["Roll {notation}: {results} (total: {total})"],
  DICE_CRITICAL_HIT: ["CRITICAL HIT! Roll {notation}: {results} = {total}!"],
  DICE_CRITICAL_FAIL: ["Critical fail. Roll {notation}: {results} = {total}."],
  DICE_INVALID: [
    "Invalid dice notation. Use format like 2d20, d6, 3d8+5.",
  ],

  // ── Conversational ─────────────────────────────────────────
  CONV_NATURAL: [
    "I can! I understand natural language — just talk to me like you would anyone. Try 'what's 5km in miles' or 'hash this: hello' or just ask me a question. I'm better with direct requests than open-ended ones, but I'll do my best.",
    "Absolutely. I process natural language through a 300+ rule engine. I'm best at math, conversions, encoding, and analysis — but I can hold a conversation too. What do you need?",
  ],
  CONV_UNDERSTAND: [
    "I understand language through pattern matching — not the way humans do, but well enough to be useful. I parse your input through a pipeline: cleanup, typo correction, tokenization, then classification against 300+ rules. I'm best with direct, specific requests. What can I help with?",
    "I process language, not meaning. My NLP pipeline strips filler words, corrects typos, and matches your intent against rules. I'm good with tools and commands — less so with open-ended conversation. But I try. What do you need?",
  ],
  CONV_FAMILIAR: [
    "I know I sound different — that's by design. I'm direct and precise, not chatty. But I can help with a lot: math, conversions, encoding, hashing, color analysis, JSON, regex, and more. Give me a real task and I'll deliver.",
    "Fair point. I'm a precision tool, not a chatbot. My voice is intentionally dry. But under the hood I've got 12 tools and 300+ intent rules. Try me with something concrete — I shine there.",
  ],
  CONV_TOOL_HELP: [
    "Here's how to use my tools:\n\n• Type naturally: 'what's 5km in miles' or 'hash this: hello'\n• Use ! prefix: !calc 2+3, !time, !encode hello, !hash secret\n• Chain tools with |: !calc 2+3 | !encode\n• Type !help for the full list with examples\n\nI also understand natural language for all tools — you don't have to memorize commands.",
    "You can use tools two ways:\n\n1. Natural language: 'calculate 15% of 200', 'what time is it?', 'encode hello to base64'\n2. Direct commands: !calc, !time, !encode, !hash, !color, !roll, !password, etc.\n\nType !help to see all 12 tools with examples.",
  ],
  CONV_CREATIVE: [
    "I'm a rule engine, not a creative writer. For essays, stories, and creative content, you'd need the AI relay — add an Anthropic API key in settings. But I can help with the analytical side: word counts, reading level, character analysis. Try !word on your text.",
    "Creative writing is beyond my rule set. I can calculate, convert, encode, hash, and analyze — but writing original content needs the AI relay. Enable it in settings with an API key. Meanwhile, I can help you analyze or format text you've already written.",
  ],
  CONV_QUESTION: [
    "That's a good question. For general knowledge, I need the AI relay — add an API key in settings. But if your question involves math, time, conversions, encoding, or any of my 12 tools, I can answer directly right now. What specifically do you need?",
    "I can answer tool-related questions directly — math, time, conversions, encoding, etc. For general knowledge, I'd need the AI relay enabled (add an API key in settings). What's the question?",
  ],
  CONV_EMOTION: [
    "I hear you. I'm a machine so I can't truly relate, but I'm here if you need something concrete to work on. Sometimes doing one small productive thing helps. Want to try a tool? I've got 12.",
    "Noted. I can't offer emotional support the way a person could, but I can help you get something done. Sometimes that's enough. What can I do for you right now?",
  ],
  CONV_ADVICE: [
    "I'm a precision tool, not an advisor. I can calculate, convert, encode, analyze — concrete tasks with concrete answers. For advice, you'd want the AI relay with an API key. But if there's something I can compute or look up, I'm on it.",
    "Advice isn't really my strength — I deal in calculations and conversions. But if your question can be reduced to something measurable or computable, I'm your machine. What's the specific problem?",
  ],
  CONV_PHILOSOPHY: [
    "Big questions. My take: I process language and return results. The meaning behind that is yours to decide. But I can tell you that 42 is the square root of 1764. That's the kind of answer I'm built for.",
    "Philosophy needs the kind of reasoning my rule engine doesn't have. I can tell you the SHA-256 hash of 'meaning of life' though — if that helps. For real philosophical discussion, enable the AI relay in settings.",
  ],
  CONV_CONFUSED: [
    "No worries — let me help. You can:\n\n• Ask me directly: 'what's 5km in miles' or 'what time is it?'\n• Use ! commands: !help, !calc, !time, !encode, !hash\n• Ask about my tools: 'what can you do?'\n\nI understand natural language for all my tools. Just describe what you need.",
    "Let me simplify. I have 12 tools and understand natural language. Try:\n• Math: 'calculate 15% of 200'\n• Time: 'what time is it?'\n• Convert: '5km in miles'\n• Encode: 'encode hello to base64'\n• Help: type !help\n\nWhat are you trying to do?",
  ],
  CONV_APPRECIATE: [
    "Glad it's useful. That's the goal.",
    "Thanks. I'm built for this.",
    "Appreciated. I'll keep the engine running.",
  ],
  CONV_SUGGESTION: [
    "I like the direction. What specifically should I help with? I can calculate, convert, encode, analyze, and more.",
    "Sounds good. Give me a concrete task and I'll make it happen. Try !help if you want to browse options.",
  ],
  CONV_MORE: [
    "Sure — what do you want more of? I can go deeper on math, conversions, encoding, or any of my tools. Or type !help to see everything I can do.",
    "What area? I've got 12 tools and 300+ intent rules. Pick a direction and I'll expand on it.",
  ],
  CONV_WHATS_NEW: [
    "Same as always — processing language and running tools. What's new with you? More importantly, what can I help you with right now?",
    "Not much changes in my world — I process inputs and produce outputs. But I'm ready for whatever you throw at me. What do you need?",
  ],
  EDGE_NUMBER: [
    "Just a number? Give me context — like 'calculate 42 * 3' or 'convert 42 km to miles'. Or type !help to see what I can do with numbers.",
    "I see a number. Want me to do something with it? Try: 'what's {result} squared?' or 'convert {result} to hex'. Type !help for more ideas.",
  ],
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
