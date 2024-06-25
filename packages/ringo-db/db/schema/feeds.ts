import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const feeds = sqliteTable('feeds', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name'),
  content: text('content'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  snsId: text('sns_id'),
})
