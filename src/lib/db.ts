import { PrismaClient } from '@prisma/client'

// Lazy singleton — only connects on first actual query
let _db: PrismaClient | null = null

async function initDb(): Promise<PrismaClient> {
  if (_db) return _db

  const dbUrl = process.env.DATABASE_URL || ''

  if (dbUrl.startsWith('libsql://')) {
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
    const { createClient } = await import('@libsql/client')

    const libsql = createClient({
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })

    _db = new PrismaClient({
      adapter: new PrismaLibSQL(libsql),
      datasources: { db: { url: dbUrl } },
    })
  } else {
    _db = new PrismaClient()
  }

  return _db
}

export { initDb }
