import { NextRequest, NextResponse } from 'next/server'
import { createMessage } from '@/lib/turso'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, from, text } = body
    if (!to || !from || !text) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }
    await createMessage(from, to, String(text).slice(0, 500))
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Send error:', error)
    return NextResponse.json({ error: 'internal error', detail: String(error) }, { status: 500 })
  }
}
