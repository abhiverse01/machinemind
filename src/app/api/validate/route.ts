// ─────────────────────────────────────────────────────────────
// MACHINE MIND — API Key Validation (POST)
// Checks whether ANTHROPIC_API_KEY is set in environment.
// The key itself is NEVER sent to the client.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'

export async function POST() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY
  return NextResponse.json({ hasKey })
}

export async function GET() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY
  return NextResponse.json({ hasKey })
}
