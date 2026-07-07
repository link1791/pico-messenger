// Direct Turso HTTP SQL API — no Prisma, no adapters, no build issues
// Just plain fetch() to Turso's HTTP endpoint.

const DB_URL = process.env.TURSO_URL!.replace('libsql://', 'https://')
const DB_TOKEN = process.env.TURSO_AUTH_TOKEN!

interface SqlResult {
  results?: { columns: string[]; rows: unknown[][] }
  error?: string
}

async function execSql(q: string): Promise<SqlResult[]> {
  const res = await fetch(DB_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ statements: [{ q }] }),
  })
  return res.json()
}

async function execMany(queries: string[]): Promise<SqlResult[]> {
  const res = await fetch(DB_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ statements: queries.map(q => ({ q })) }),
  })
  return res.json()
}

// Generate a simple unique ID (no cuid dependency needed)
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ─── Contacts ────────────────────────────────────────────

export async function getAllContacts(): Promise<string[]> {
  const r = await execSql("SELECT username FROM Contact ORDER BY createdAt ASC")
  const rows = r[0]?.results?.rows || []
  return rows.map(row => row[0] as string)
}

export async function upsertContact(username: string): Promise<void> {
  const id = await getContactId(username)
  if (id) return
  await execSql(`INSERT OR IGNORE INTO Contact (id, username, createdAt) VALUES ('${uid()}', '${esc(username)}', datetime('now'))`)
}

async function getContactId(username: string): Promise<string | null> {
  const r = await execSql(`SELECT id FROM Contact WHERE username = '${esc(username)}'`)
  const rows = r[0]?.results?.rows || []
  return rows.length > 0 ? (rows[0][0] as string) : null
}

// ─── Messages ────────────────────────────────────────────

export interface Message {
  id: string
  fromUser: string
  toUser: string
  text: string
  createdAt: string
}

export async function createMessage(from: string, to: string, text: string): Promise<void> {
  const id = uid()
  await execSql(
    `INSERT INTO Message (id, fromUser, toUser, text, createdAt) VALUES ('${id}', '${esc(from)}', '${esc(to)}', '${esc(text)}', datetime('now'))`
  )
  // Ensure both users exist as contacts
  await upsertContact(from)
  await upsertContact(to)
}

export async function getMessages(user: string, from: string): Promise<Message[]> {
  const r = await execSql(
    `SELECT id, fromUser, toUser, text, createdAt FROM Message WHERE toUser = '${esc(user)}' AND fromUser = '${esc(from)}' ORDER BY createdAt ASC LIMIT 50`
  )
  const rows = r[0]?.results?.rows || []
  return rows.map(row => ({
    id: row[0] as string,
    fromUser: row[1] as string,
    toUser: row[2] as string,
    text: row[3] as string,
    createdAt: row[4] as string,
  }))
}

export async function deleteMessages(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const idList = ids.map(id => `'${esc(id)}'`).join(',')
  await execSql(`DELETE FROM Message WHERE id IN (${idList})`)
}

export async function getChatHistory(user: string, contact: string): Promise<Message[]> {
  const r = await execSql(
    `SELECT id, fromUser, toUser, text, createdAt FROM Message WHERE (toUser = '${esc(user)}' AND fromUser = '${esc(contact)}') OR (toUser = '${esc(contact)}' AND fromUser = '${esc(user)}') ORDER BY createdAt ASC LIMIT 200`
  )
  const rows = r[0]?.results?.rows || []
  return rows.map(row => ({
    id: row[0] as string,
    fromUser: row[1] as string,
    toUser: row[2] as string,
    text: row[3] as string,
    createdAt: row[4] as string,
  }))
}

export async function getConversations(username: string): Promise<{ contact: string; lastText: string; lastTs: string; unread: number }[]> {
  const r = await execSql(
    `SELECT fromUser, toUser, text, createdAt FROM Message WHERE toUser = '${esc(username)}' OR fromUser = '${esc(username)}' ORDER BY createdAt DESC`
  )
  const rows = r[0]?.results?.rows || []
  
  const convos = new Map<string, { lastText: string; lastTs: string; unread: number }>()
  for (const row of rows) {
    const from = row[0] as string
    const to = row[1] as string
    const text = row[2] as string
    const ts = row[3] as string
    const contact = from === username ? to : from
    const isUnread = to === username
    
    if (!convos.has(contact)) {
      convos.set(contact, { lastText: text, lastTs: ts, unread: isUnread ? 1 : 0 })
    } else {
      const c = convos.get(contact)!
      if (!isUnread) c.unread = 0  // if we sent a message, reset unread
    }
  }
  
  return Array.from(convos.entries()).map(([contact, data]) => ({
    contact,
    ...data,
  }))
}

export async function deleteChat(user: string, contact: string): Promise<void> {
  await execSql(
    `DELETE FROM Message WHERE (toUser = '${esc(user)}' AND fromUser = '${esc(contact)}') OR (toUser = '${esc(contact)}' AND fromUser = '${esc(user)}')`
  )
}

// ─── SQL escape ──────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/'/g, "''")
}

