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

    _db = new PrismaClient({ adapter: new PrismaLibSQL(libsql) })
  } else {
    _db = new PrismaClient()
  }

  return _db
}

// Sync export for backward compat — returns a proxy that
// lazily initializes on first property access
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    // Allow instanceof checks
    if (prop === Symbol.toStringTag) return 'PrismaClient'
    if (prop === 'then' || prop === 'catch') return undefined

    // Sync access to already-initialized client
    if (_db) return Reflect.get(_db, prop, receiver)

    // Not yet initialized — throw a helpful error
    throw new Error(
      'Database not initialized. Call initDb() first in an async context.'
    )
  },
})

export { initDb }