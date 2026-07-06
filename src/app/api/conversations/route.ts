import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

// GET /api/conversations?username=X
// Returns all contacts that have messages with X, plus their last message
export async function GET(request: NextRequest) {
  try {
    const prisma = await initDb()
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'missing username' }, { status: 400 })
    }

    // Get all messages involving this user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUser: username },
          { toUser: username },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Group by the other user, keeping the latest message per contact
    const convos = new Map<string, { contact: string; lastText: string; lastTs: string; unread: number }>()

    for (const m of messages) {
      const contact = m.fromUser === username ? m.toUser : m.fromUser
      if (!convos.has(contact)) {
        convos.set(contact, {
          contact,
          lastText: m.text,
          lastTs: m.createdAt.toISOString(),
          unread: m.toUser === username ? 1 : 0,
        })
      } else {
        const existing = convos.get(contact)!
        // Count unread (messages to this user from others)
        if (m.toUser === username) {
          existing.unread += 1
        }
      }
    }

    return NextResponse.json({ conversations: Array.from(convos.values()) })
  } catch (error) {
    console.error('Conversations error:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}