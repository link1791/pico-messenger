import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

// GET /api/chat?username=X&contact=Y
// Returns full message history between two users (for web UI, doesn't delete)
export async function GET(request: NextRequest) {
  try {
    const prisma = await initDb()
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const contact = searchParams.get('contact')

    if (!username || !contact) {
      return NextResponse.json({ error: 'missing params' }, { status: 400 })
    }

    // Get messages both ways
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUser: username, toUser: contact },
          { fromUser: contact, toUser: username },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return NextResponse.json({
      messages: messages.map(m => ({
        id: m.id,
        from: m.fromUser,
        to: m.toUser,
        text: m.text,
        ts: m.createdAt.toISOString(),
        direction: m.fromUser === username ? 'out' : 'in',
      })),
    })
  } catch (error) {
    console.error('Chat history error:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

// POST /api/chat — send a message from the web UI
// Body: { "username": "me", "contact": "them", "text": "hello" }
export async function POST(request: NextRequest) {
  try {
    const prisma = await initDb()
    const body = await request.json()
    const { username, contact, text } = body

    if (!username || !contact || !text) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    await prisma.message.create({
      data: {
        fromUser: username,
        toUser: contact,
        text: String(text).slice(0, 500),
      },
    })

    await prisma.contact.upsert({
      where: { username: contact },
      update: {},
      create: { username: contact },
    })

    await prisma.contact.upsert({
      where: { username },
      update: {},
      create: { username },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Chat send error:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}