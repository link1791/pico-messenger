import { NextRequest, NextResponse } from 'next/server'
import { db, initDb } from '@/lib/db'

// POST /api/send — called by Pico W messenger
// Body: { "to": "username", "from": "username", "text": "message" }
export async function POST(request: NextRequest) {
  try {
    const prisma = await initDb()
    const body = await request.json()
    const { to, from, text } = body

    if (!to || !from || !text) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    // Store the message
    await prisma.message.create({
      data: {
        fromUser: from,
        toUser: to,
        text: String(text).slice(0, 500),
      },
    })

    // Ensure both users exist as contacts
    for (const username of [from, to]) {
      await prisma.contact.upsert({
        where: { username },
        update: {},
        create: { username },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Send error:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}