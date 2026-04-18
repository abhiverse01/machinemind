// ─────────────────────────────────────────────────────────────
// MACHINE MIND v5.0 — Conversation State Machine
// Tracks the conversational state across turns:
// FRESH → TOOL_CHAIN → CLARIFYING → EMOTIONAL → DOC_MODE → AI_RELAY
// Priority: DOC_MODE > EMOTIONAL > TOOL_CHAIN > CLARIFYING > FRESH
// ─────────────────────────────────────────────────────────────

import type { ConversationState, StateTransition, Tone } from '../types'

// ── Signal arrays for each state ─────────────────────────────

const TOOL_CHAIN_SIGNALS: RegExp[] = [
  /\b(?:then|after that|next|and then|also|plus|afterwards)\b/i,
  /\b(?:convert|encode|hash|calculate|compute|generate|decode|encrypt)\b/i,
  /\b(?:what(?:'s| is) the|how (?:many|much|far|long|fast|old))\b/i,
  /\b(?:now (?:do|run|execute|tell|show|convert|calculate))\b/i,
  /\b(?:another|more|again|different)\b/i,
  /\b(?:chain|pipeline|sequence)\b/i,
  /\b(?:also|additionally|furthermore|moreover)\b/i,
  /\?\s*$/,                       // ends with question mark
  /^\s*!/,                        // starts with !
  /\b(?:run|execute|use|invoke)\b/i,
]

const CLARIFY_SIGNALS: RegExp[] = [
  /\b(?:what do you mean|I don't understand|confused|unclear|explain)\b/i,
  /\b(?:I meant|I mean|I was (?:asking|saying|looking for))\b/i,
  /\b(?:not that|no,?\s*I (?:meant|want)|that's not what)\b/i,
  /\b(?:clarify|clarification|more detail|elaborate)\b/i,
  /\b(?:can you explain|what exactly|how exactly|be more specific)\b/i,
  /\b(?:huh\?|what\?|sorry\?|pardon\?)\b/i,
  /\b(?:I think you misunderstood|you got (?:that|it) wrong)\b/i,
]

const EMOTIONAL_SIGNALS: RegExp[] = [
  /\b(?:frustrated|annoyed|angry|upset|disappointed|sad|depressed)\b/i,
  /\b(?:I hate|I love|I'm so|this is (?:amazing|terrible|awful|wonderful))\b/i,
  /\b(?:ugh|wtf|omg|stressed|overwhelmed|exhausted)\b/i,
  /\b(?:thank you so much|you're (?:amazing|wonderful|the best|a lifesaver))\b/i,
  /\b(?:I feel|feeling|I'm feeling)\b/i,
  /\b(?:this sucks|this is great|I'm happy|I'm sad)\b/i,
  /!{3,}/,                        // multiple exclamation marks
  /\b(?:vent|rant|complain)\b/i,
]

const DOC_MODE_SIGNALS: RegExp[] = [
  /\b(?:document|docs|documentation|readme|guide|tutorial)\b/i,
  /\b(?:write (?:a |the )?(?:doc|document|guide|tutorial|readme|manual))\b/i,
  /\b(?:create (?:a |the )?(?:doc|document|guide|tutorial|readme|manual))\b/i,
  /\b(?:help me write|help me create|help me draft)\b/i,
  /\b(?:long-form|long form|detailed explanation|comprehensive)\b/i,
  /\b(?:markdown|md file|\.md)\b/i,
  /\b(?:article|blog post|essay|paper|report)\b/i,
  /\b(?:step[- ]by[- ]step|walkthrough)\b/i,
]

// ── Turn decay thresholds ────────────────────────────────────
const TOOL_CHAIN_DECAY_TURNS = 3
const CLARIFYING_DECAY_TURNS = 2
const EMOTIONAL_DECAY_TURNS = 2

// ─────────────────────────────────────────────────────────────
// ConversationStateMachine
// ─────────────────────────────────────────────────────────────

export class ConversationStateMachine {
  private _state: ConversationState = 'FRESH'
  private _turn: number = 0
  private _lastTransitionTurn: number = 0
  private _transitions: StateTransition[] = []

  // ── Main transition method ─────────────────────────────────
  /**
   * Evaluate the current input and potentially transition state.
   * Returns the new (or unchanged) state.
   *
   * Priority order: DOC_MODE > EMOTIONAL > TOOL_CHAIN > CLARIFYING > FRESH
   * AI_RELAY is entered when the mode is externally set to ai_relay.
   */
  transition(input: string, parsedTone: Tone, charCount: number): ConversationState {
    this._turn++

    const lowerInput = input.toLowerCase().trim()

    // ── Check for exit signals ──────────────────────────────
    if (this._state === 'DOC_MODE') {
      // Exit doc mode on explicit exit signals
      if (/\b(?:exit doc|leave doc|stop doc|end doc|done doc|quit doc)\b/i.test(lowerInput)) {
        return this.changeState('FRESH', 'explicit_exit_doc_mode')
      }
    }

    if (this._state === 'EMOTIONAL') {
      if (/\b(?:ok|okay|thanks|alright|got it|I'm fine|I'm good|let's move on|moving on)\b/i.test(lowerInput)) {
        return this.changeState('FRESH', 'emotional_resolved')
      }
    }

    // ── Apply turn decay ────────────────────────────────────
    const turnsSinceTransition = this._turn - this._lastTransitionTurn

    if (this._state === 'CLARIFYING' && turnsSinceTransition > CLARIFYING_DECAY_TURNS) {
      this.changeState('FRESH', 'clarifying_decay')
    }

    if (this._state === 'EMOTIONAL' && turnsSinceTransition > EMOTIONAL_DECAY_TURNS) {
      this.changeState('FRESH', 'emotional_decay')
    }

    if (this._state === 'TOOL_CHAIN' && turnsSinceTransition > TOOL_CHAIN_DECAY_TURNS) {
      this.changeState('FRESH', 'tool_chain_decay')
    }

    // ── Score each candidate state ──────────────────────────
    const docScore = this.scoreSignals(lowerInput, DOC_MODE_SIGNALS)
    const emotionalScore = this.scoreSignals(lowerInput, EMOTIONAL_SIGNALS)
      + (parsedTone === 'frustrated' || parsedTone === 'playful' ? 0.5 : 0)
    const toolScore = this.scoreSignals(lowerInput, TOOL_CHAIN_SIGNALS)
      + (charCount < 30 ? 0.2 : 0)  // short inputs are often tool commands
    const clarifyScore = this.scoreSignals(lowerInput, CLARIFY_SIGNALS)

    // ── Priority-based evaluation ───────────────────────────

    // DOC_MODE has highest priority
    if (docScore >= 1.0) {
      if (this._state !== 'DOC_MODE') {
        return this.changeState('DOC_MODE', 'doc_mode_signals')
      }
      // Already in doc mode — stay
      return this._state
    }

    // EMOTIONAL has second priority
    if (emotionalScore >= 1.0) {
      if (this._state !== 'EMOTIONAL') {
        return this.changeState('EMOTIONAL', 'emotional_signals')
      }
      // Already emotional — stay
      return this._state
    }

    // TOOL_CHAIN — enter if signals detected OR if already in chain and still tool-oriented
    if (toolScore >= 1.0) {
      if (this._state !== 'TOOL_CHAIN') {
        return this.changeState('TOOL_CHAIN', 'tool_chain_signals')
      }
      // Already in tool chain — refresh the transition timer
      this._lastTransitionTurn = this._turn
      return this._state
    }

    // CLARIFYING
    if (clarifyScore >= 1.0) {
      if (this._state !== 'CLARIFYING') {
        return this.changeState('CLARIFYING', 'clarifying_signals')
      }
      // Already clarifying — refresh
      this._lastTransitionTurn = this._turn
      return this._state
    }

    // If in DOC_MODE or EMOTIONAL and no exit/decay, stay
    if (this._state === 'DOC_MODE' || this._state === 'EMOTIONAL') {
      return this._state
    }

    // If in TOOL_CHAIN with no new signals but within decay window, stay
    if (this._state === 'TOOL_CHAIN' && turnsSinceTransition <= TOOL_CHAIN_DECAY_TURNS) {
      return this._state
    }

    // If in CLARIFYING with no new signals but within decay window, stay
    if (this._state === 'CLARIFYING' && turnsSinceTransition <= CLARIFYING_DECAY_TURNS) {
      return this._state
    }

    // Default: FRESH
    if (this._state !== 'FRESH') {
      return this.changeState('FRESH', 'no_matching_signals')
    }

    return this._state
  }

  // ── State getter ───────────────────────────────────────────
  get state(): ConversationState {
    return this._state
  }

  // ── Transition history getter ──────────────────────────────
  get transitions(): ReadonlyArray<StateTransition> {
    return this._transitions
  }

  // ── Turn getter ────────────────────────────────────────────
  get turn(): number {
    return this._turn
  }

  // ── Explicit exit methods ──────────────────────────────────
  exitDocMode(): ConversationState {
    if (this._state === 'DOC_MODE') {
      return this.changeState('FRESH', 'exit_doc_mode')
    }
    return this._state
  }

  exitEmotional(): ConversationState {
    if (this._state === 'EMOTIONAL') {
      return this.changeState('FRESH', 'exit_emotional')
    }
    return this._state
  }

  // ── Force set state (for external mode changes like AI_RELAY) ──
  forceState(state: ConversationState, trigger: string): ConversationState {
    return this.changeState(state, trigger)
  }

  // ── Reset ──────────────────────────────────────────────────
  reset(): void {
    this._state = 'FRESH'
    this._turn = 0
    this._lastTransitionTurn = 0
    this._transitions = []
  }

  // ── Private helpers ────────────────────────────────────────

  private changeState(newState: ConversationState, trigger: string): ConversationState {
    const transition: StateTransition = {
      from: this._state,
      to: newState,
      trigger,
      turn: this._turn,
    }
    this._transitions.push(transition)
    this._state = newState
    this._lastTransitionTurn = this._turn
    return this._state
  }

  private scoreSignals(input: string, patterns: RegExp[]): number {
    let score = 0
    for (const pattern of patterns) {
      pattern.lastIndex = 0
      if (pattern.test(input)) {
        score += 1
      }
    }
    return score
  }
}
