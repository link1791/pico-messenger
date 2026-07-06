import { PrismaClient } from '@prisma/client'

const dbUrl = process.env.DATABASE_URL || ''

async function createDb() {
  if (dbUrl.startsWith('libsql://')) {
    // Turso (production) - use libsql driver adapter
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
    const { createClient } = await import('@libsql/client')

    const libsql = createClient({
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })

    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) })
  }

  // Local SQLite (development)
  return new PrismaClient()
}

let _db: PrismaClient | undefined

export const db: PrismaClient = await createDb()