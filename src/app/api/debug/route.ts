import { NextResponse } from 'next/server'
import { getAllContacts } from '@/lib/turso'

export async function GET() {
  try {
    const env = {
      TURSO_URL: (process.env.TURSO_URL || 'MISSING').substring(0, 40),
      TURSO_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'SET' : 'MISSING',
    }
    
    // Try direct fetch to turso
    const dbUrl = (process.env.TURSO_URL || '').replace('libsql://', 'https://')
    const resp = await fetch(dbUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TURSO_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ statements: [{ q: "SELECT count(*) as c FROM Message" }] }),
    })
    const result = await resp.json()
    
    const contacts = await getAllContacts()
    
    return NextResponse.json({ env, tursoRaw: result, contacts })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
