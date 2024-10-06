import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { apples } from './apples'

export const genealogies = sqliteTable(
  'genealogies',
  {
    child_name: text('child_name')
      .notNull()
      .references(() => apples.name),
    pollen_name: text('pollen_name')
      .notNull()
      .references(() => apples.name),
    seed_name: text('seed_name')
      .notNull()
      .references(() => apples.name),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.child_name, table.pollen_name, table.seed_name],
      }),
    }
  },
)
