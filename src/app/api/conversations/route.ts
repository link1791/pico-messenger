import { NextRequest, NextResponse } from 'next/server'
import { getConversations } from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    if (!username) {
      return NextResponse.json({ error: 'missing username' }, { status: 400 })
    }
    const conversations = await getConversations(username)
    return NextResponse.json({ conversations })
  } catch (error) {
    return NextResponse.json({ error: 'internal error', detail: String(error) }, { status: 500 })
  }
}
