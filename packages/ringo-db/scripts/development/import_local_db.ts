// @ts-ignore
import { Database } from 'bun:sqlite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { feeds } from '../../db/schema/feeds'

type Tweet = {
  id: number
  name: string
  tweet: string
  tweeted_at: string
  tweet_id: number
}

const main = async () => {
  const fromSqlite = new Database('old_data/ringo_2024_0502.db')
  const fromDb = drizzle(fromSqlite)
  const tweets: Tweet[] = await fromDb.all(
    sql.raw('select * from tweets_tweets'),
  )

  // 環境に応じてファイル名を修正する
  const fileName =
    '2073307253fd76d9e289ad074b54fc751825840a1efddf02aa13a82ecf5305f6.sqlite'
  const toSqlite = new Database(
    `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${fileName}`,
  )
  const toDb = drizzle(toSqlite)

  // biome-ignore lint/complexity/noForEach: <explanation>
  tweets.forEach(async (t) => {
    await toDb.insert(feeds).values({
      name: t.name,
      content: t.tweet,
      createdAt: t.tweeted_at,
      snsId: t.tweet_id.toString(),
    })
  })

  console.log('finished')
}

main()
