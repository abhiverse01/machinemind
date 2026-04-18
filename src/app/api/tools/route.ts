// ─────────────────────────────────────────────────────────────
// MACHINE MIND — Tool Execution Endpoint (POST)
// Routes to appropriate tool in lib/tools/
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tool, input, chain } = body as {
      tool: string
      input: string
      chain?: string
    }

    // Dynamic import to avoid bundling all tools on the client
    const { executeTool, executeChain } = await import('@/lib/tools/registry')

    if (chain) {
      const result = await executeChain(chain)
      return NextResponse.json(result)
    }

    if (!tool) {
      return NextResponse.json(
        { status: 'error', result: 'No tool specified', displayType: 'error', raw: 'No tool specified', execMs: 0 },
        { status: 400 }
      )
    }

    const result = await executeTool(tool, input || '')
    return NextResponse.json(result)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json(
      {
        status: 'error',
        result: errorMsg,
        displayType: 'error',
        raw: errorMsg,
        execMs: 0,
      },
      { status: 500 }
    )
  }
}
