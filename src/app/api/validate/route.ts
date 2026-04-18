// ─────────────────────────────────────────────────────────────
// MACHINE MIND — API Key Validation (POST)
// Checks whether ANTHROPIC_API_KEY is set in environment.
// Also accepts a key from the client to set at runtime.
// The key itself is NEVER sent back to the client.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

// Module-level store for runtime API key (persists until server restart)
let runtimeApiKey: string | null = null

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { apiKey?: string }
    // If client sends an API key, store it at runtime
    if (body.apiKey && typeof body.apiKey === 'string' && body.apiKey.trim().length > 0) {
      runtimeApiKey = body.apiKey.trim()
      // Also set as environment variable for the Anthropic SDK to pick up
      process.env.ANTHROPIC_API_KEY = runtimeApiKey
    }
  } catch {
    // Body may be empty for a simple check
  }

  const hasKey = !!(process.env.ANTHROPIC_API_KEY || runtimeApiKey)
  return NextResponse.json({ hasKey })
}

export async function GET() {
  const hasKey = !!(process.env.ANTHROPIC_API_KEY || runtimeApiKey)
  return NextResponse.json({ hasKey })
}
