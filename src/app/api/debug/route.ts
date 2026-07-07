import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || 'NOT SET'
    const token = process.env.TURSO_AUTH_TOKEN ? 'SET' : 'NOT SET'
    
    // Test libsql directly
    const { createClient } = await import('@libsql/client')
    const client = createClient({
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    
    const result = await client.execute('SELECT 1 as test')
    
    return NextResponse.json({
      env: { dbUrl: dbUrl.substring(0, 40), token },
      libsql: { ok: true, result: result.rows },
    })
  } catch (error) {
    return NextResponse.json({
      env: { 
        dbUrl: (process.env.DATABASE_URL || 'NOT SET').substring(0, 40), 
        token: process.env.TURSO_AUTH_TOKEN ? 'SET' : 'NOT SET' 
      },
      error: String(error),
    }, { status: 500 })
  }
}
