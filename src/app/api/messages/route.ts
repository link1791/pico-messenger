import { NextRequest, NextResponse } from 'next/server'
import { getMessages, deleteMessages } from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user = searchParams.get('user')
    const from = searchParams.get('from')
    if (!user || !from) {
      return NextResponse.json({ error: 'missing user or from' }, { status: 400 })
    }
    const messages = await getMessages(user, from)
    const lines = messages.map(m => JSON.stringify({ text: m.text, ts: m.createdAt }))
    // Delete delivered messages
    if (messages.length > 0) {
      await deleteMessages(messages.map(m => m.id))
    }
    return new NextResponse(lines.join('\n'), { headers: { 'Content-Type': 'text/plain' } })
  } catch (error) {
    console.error('Messages error:', error)
    return NextResponse.json({ error: 'internal error', detail: String(error) }, { status: 500 })
  }
}
