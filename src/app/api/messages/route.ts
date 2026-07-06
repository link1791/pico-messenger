import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/messages?user=X&from=Y — called by Pico W messenger
// Returns undelivered messages from Y to X (or all messages for web UI)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user = searchParams.get('user')
    const from = searchParams.get('from')

    if (!user) {
      return NextResponse.json({ error: 'missing user' }, { status: 400 })
    }

    // If 'from' is specified, return messages from that user to 'user'
    // This is the Pico W protocol
    if (from) {
      const messages = await db.message.findMany({
        where: {
          toUser: user,
          fromUser: from,
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      })

      // Return one JSON object per line (Pico W expects newline-delimited)
      const lines = messages.map(m => {
        const obj: Record<string, string> = { text: m.text, ts: m.createdAt.getTime().toString() }
        return JSON.stringify(obj)
      })

      // Delete delivered messages
      if (messages.length > 0) {
        const ids = messages.map(m => m.id)
        await db.message.deleteMany({ where: { id: { in: ids } } })
      }

      return new NextResponse(lines.join('\n'), {
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    return NextResponse.json({ error: 'missing from' }, { status: 400 })
  } catch (error) {
    console.error('Messages error:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}