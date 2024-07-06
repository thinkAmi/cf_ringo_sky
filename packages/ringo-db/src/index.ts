import { WorkerEntrypoint } from 'cloudflare:workers'
import { desc, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { feeds } from '../db/schema/feeds'
import { apples, findColorName } from './apples'

interface Env {
  DB: D1Database
}

export class DatabaseWorkerEntrypoint extends WorkerEntrypoint<Env> {
  async calculateTotalByName() {
    // this.env で WorkerEntrypoint のenvを参照できる
    const db = drizzle(this.env.DB)

    const results = await db
      .select({
        name: feeds.name,
        total: sql<number>`cast(count(${feeds.id}) as int)`,
      })
      .from(feeds)
      .groupBy(feeds.name)
      .orderBy(desc(sql<number>`cast(count(${feeds.id}) as int)`))

    const labels = results.map((r) => r.name) ?? []
    const totals = results.map((r) => r.total) ?? []
    const colorNames = results.map((r) => {
      return apples.find((a) => a.name === r.name)?.color
    })

    const r = {
      labels: labels,
      datasets: [
        {
          label: '食べた数',
          data: totals,
          backgroundColor: colorNames,
          borderColor: colorNames,
          borderWidth: 1,
        },
      ],
    }

    return JSON.stringify(r)
  }

  async calculateTotalByNameAndMonth() {
    const db = drizzle(this.env.DB)

    const total = await db
      .select({
        name: feeds.name,
        month: sql<number>`cast(strftime('%m', ${feeds.createdAt}) as int)`,
        total: sql<number>`cast(count(${feeds.id}) as int)`,
      })
      .from(feeds)
      .groupBy(
        feeds.name,
        sql<number>`cast(strftime('%m', ${feeds.createdAt}) as int)`,
      )
      .orderBy(
        feeds.name,
        sql<number>`cast(strftime('%m', ${feeds.createdAt}) as int)`,
      )

    const datasets = []
    const defaultAttributes = {
      tension: 0.1,
    }
    let name = total[0]?.name as string
    let quantities = new Array(12).fill(0)

    for (const t of total) {
      if (name !== t.name) {
        datasets.push({
          label: name,
          data: quantities,
          borderColor: findColorName(name),
          backgroundColor: findColorName(name),
          ...defaultAttributes,
        })

        name = t.name as string
        quantities = new Array(12).fill(0)
      }

      quantities[t.month - 1] = t.total
    }

    datasets.push({
      label: name,
      data: quantities,
      borderColor: findColorName(name),
      backgroundColor: findColorName(name),
      ...defaultAttributes,
    })

    const r = {
      labels: [
        '1月',
        '2月',
        '3月',
        '4月',
        '5月',
        '6月',
        '7月',
        '8月',
        '9月',
        '10月',
        '11月',
        '12月',
      ],
      datasets: datasets,
    }

    return JSON.stringify(r)
  }

  async insertFeeds(ringoFeeds: string) {
    // JSON文字列でわたってくるので、オブジェクトにする
    const r = JSON.parse(ringoFeeds)
    const v = r.map((fields) => {
      // 属性名は、db/schema/feeds.ts で定義した名前にすること
      return {
        name: fields.name,
        content: fields.text,
        createdAt: formatDateTime(fields.createdAt),
        snsId: fields.cid,
      }
    })

    const db = drizzle(this.env.DB)

    // Drizzle ORMの batch API を使ってトランザクションっぽく更新する
    // https://orm.drizzle.team/docs/batch-api
    await db.batch([db.insert(feeds).values(v)])
  }
}

const formatDateTime = (iso8601DateTime: string) => {
  const d = new Date(iso8601DateTime)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export default {
  async fetch(_req, _env, _ctx): Promise<Response> {
    return new Response('Hello')
  },
}
