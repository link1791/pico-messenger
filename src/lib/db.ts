import { PrismaClient } from '@prisma/client'

const dbUrl = process.env.DATABASE_URL || ''

let db: PrismaClient

if (dbUrl.startsWith('libsql://')) {
  // Turso (production) - use libsql driver adapter
  const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
  const { createClient } = await import('@libsql/client')

  const libsql = createClient({
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  db = new PrismaClient({ adapter: new PrismaLibSQL(libsql) })
} else {
  // Local SQLite (development)
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
  }

  db =
    globalForPrisma.prisma ??
    new PrismaClient({ log: ['query'] })

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
}

export { db }