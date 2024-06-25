import type { Config } from 'drizzle-kit'

export default {
  dialect: 'sqlite',
  schema: './db/schema/*',
  out: './migrations',
} satisfies Config
