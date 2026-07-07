import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { createClient } = await import('@libsql/client')
    const client = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    
    // Create tables if they don't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Contact (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Message (
        id TEXT PRIMARY KEY,
        fromUser TEXT NOT NULL,
        toUser TEXT NOT NULL,
        text TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_msg_to_from ON Message(toUser, fromUser)`)
    
    const contacts = await client.execute('SELECT count(*) as c FROM Contact')
    const messages = await client.execute('SELECT count(*) as c FROM Message')
    
    return NextResponse.json({
      status: 'tables created',
      contacts: contacts.rows[0].c,
      messages: messages.rows[0].c,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
