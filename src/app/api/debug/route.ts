import { NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

export async function GET() {
  try {
    const prisma = await initDb()
    const count = await prisma.contact.count()
    return NextResponse.json({ 
      status: 'ok', 
      dbUrl: (process.env.DATABASE_URL || '').substring(0, 30),
      contactCount: count 
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      detail: String(error),
      dbUrl: (process.env.DATABASE_URL || '').substring(0, 30),
    }, { status: 500 })
  }
}
