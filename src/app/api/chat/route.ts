import { NextRequest, NextResponse } from 'next/server'
import { createMessage, getChatHistory, deleteChat } from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const contact = searchParams.get('contact')
    if (!username || !contact) {
      return NextResponse.json({ error: 'missing params' }, { status: 400 })
    }
    const messages = await getChatHistory(username, contact)
    const formatted = messages.map(m => ({
      id: m.id,
      from: m.fromUser,
      to: m.toUser,
      text: m.text,
      ts: m.createdAt,
      direction: m.fromUser === username ? 'out' : 'in',
    }))
    return NextResponse.json({ messages: formatted })
  } catch (error) {
    return NextResponse.json({ error: 'internal error', detail: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, contact, text } = await request.json()
    if (!username || !contact || !text) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }
    await createMessage(username, contact, String(text).slice(0, 500))
    const messages = await getChatHistory(username, contact)
    const formatted = messages.map(m => ({
      id: m.id,
      from: m.fromUser,
      to: m.toUser,
      text: m.text,
      ts: m.createdAt,
      direction: m.fromUser === username ? 'out' : 'in',
    }))
    return NextResponse.json({ messages: formatted })
  } catch (error) {
    return NextResponse.json({ error: 'internal error', detail: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const contact = searchParams.get('contact')
    if (!username || !contact) {
      return NextResponse.json({ error: 'missing params' }, { status: 400 })
    }
    await deleteChat(username, contact)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'internal error', detail: String(error) }, { status: 500 })
  }
}
