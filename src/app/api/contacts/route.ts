import { NextResponse } from 'next/server'
import { getAllContacts } from '@/lib/turso'

export async function GET() {
  try {
    const contacts = await getAllContacts()
    return new NextResponse(contacts.join('\n'), { headers: { 'Content-Type': 'text/plain' } })
  } catch (error) {
    console.error('Contacts error:', error)
    return NextResponse.json({ error: 'internal error', detail: String(error) }, { status: 500 })
  }
}
