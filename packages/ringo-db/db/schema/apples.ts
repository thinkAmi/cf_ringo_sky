import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const apples = sqliteTable('apples', {
  name: text('name').primaryKey(),
  display_name: text('display_name').unique().notNull(),
})
