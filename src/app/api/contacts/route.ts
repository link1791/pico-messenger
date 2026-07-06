import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/contacts — called by Pico W messenger
// Returns list of all known usernames (one per line, plain text)
export async function GET() {
  try {
    const contacts = await db.contact.findMany({
      orderBy: { createdAt: 'asc' },
    })

    const lines = contacts.map(c => c.username)
    return new NextResponse(lines.join('\n'), {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    console.error('Contacts error:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}