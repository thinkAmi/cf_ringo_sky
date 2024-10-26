import { WorkerEntrypoint } from 'cloudflare:workers'
import { aliasedTable, desc, eq, ne, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { apples } from '../db/schema/apples'
import { feeds } from '../db/schema/feeds'
import { genealogies } from '../db/schema/genealogies'
import { appleColors, findColorName } from './appleColors'

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
      return appleColors.find((a) => a.name === r.name)?.color
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

  async findGenealogyByName(appleName: string) {
    const db = drizzle(this.env.DB)

    const result = await db.all(sql`
        WITH RECURSIVE ancestry AS (
            -- 最初に、検索したいりんごの情報を取得
            SELECT
                g.child_name,
                a.display_name as child_display_name,
                g.pollen_name,
                g.seed_name,
                0 AS generation
            FROM genealogies g
                     INNER JOIN apples a
                                ON g.child_name = a.name
            WHERE child_name = ${appleName}
            UNION ALL
            -- 再帰的に、いわゆる父母や祖父母や曽祖父母を取得
            SELECT
                g.child_name as child_name,
                apples.display_name as child_display_name,
                g.pollen_name as pollen_name,
                g.seed_name as seed_name,
                a.generation + 1
            FROM genealogies g
                     INNER JOIN ancestry a
                                ON g.child_name = a.pollen_name OR g.child_name = a.seed_name
                     INNER JOIN apples
                                ON g.child_name = apples.name
            WHERE a.generation < 3 -- いわゆる曽祖父母まで取得する
        )
        -- 結果を横持ちで表示(重複して取得できてしまうので、DISTINCTが必要)
        SELECT DISTINCT
            a.child_name AS "apple",
            a.child_display_name AS "appleDisplayName",
            p.child_name AS "pollen",
            p.child_display_name AS "pollenDisplayName",
            pp.child_name AS "pollenPollen",
            pp.child_display_name AS "pollenPollenDisplayName",
            ppp.child_name AS "pollenPollenPollen",
            ppp.child_display_name AS "pollenPollenPollenDisplayName",
            pps.child_name AS "pollenPollenSeed",
            pps.child_display_name AS "pollenPollenSeedDisplayName",
            ps.child_name AS "pollenSeed",
            ps.child_display_name AS "pollenSeedDisplayName",
            psp.child_name AS "pollenSeedPollen",
            psp.child_display_name AS "pollenSeedPollenDisplayName",
            pss.child_name AS "pollenSeedSeed",
            pss.child_display_name AS "pollenSeedSeedDisplayName",
            s.child_name AS "seed",
            s.child_display_name AS "seedDisplayName",
            sp.child_name AS "seedPollen",
            sp.child_display_name AS "seedPollenDisplayName",
            spp.child_name AS "seedPollenPollen",
            spp.child_display_name AS "seedPollenPollenDisplayName",
            sps.child_name AS "seedPollenSeed",
            sps.child_display_name AS "seedPollenSeedDisplayName",
            ss.child_name AS "seedSeed",
            ss.child_display_name AS "seedSeedDisplayName",
            ssp.child_name AS "seedSeedPollen",
            ssp.child_display_name AS "seedSeedPollenDisplayName",
            sss.child_name AS "seedSeedSeed",
            sss.child_display_name AS "seedSeedSeedDisplayName"
        FROM
            ancestry a
                -- 花粉親系
                -- 花粉親を結合
                LEFT JOIN ancestry p
                          ON p.child_name = a.pollen_name AND p.generation = 1
                -- 花粉親の花粉親を結合
                LEFT JOIN ancestry pp
                          ON pp.child_name = p.pollen_name AND pp.generation = 2
                -- 花粉親の種子親を結合
                LEFT JOIN ancestry ps
                          ON ps.child_name = p.seed_name AND ps.generation = 2
                -- 花粉親の花粉親の花粉親を結合
                LEFT JOIN ancestry ppp
                          ON ppp.child_name = pp.pollen_name AND ppp.generation = 3
                -- 花粉親の花粉親の種子親を結合
                LEFT JOIN ancestry pps
                          ON pps.child_name = pp.seed_name AND pps.generation = 3
                -- 花粉親の種子親の花粉親を結合
                LEFT JOIN ancestry psp
                          ON psp.child_name = ps.pollen_name AND psp.generation = 3
                -- 花粉親の種子親の種子親を結合
                LEFT JOIN ancestry pss
                          ON pss.child_name = ps.seed_name AND pss.generation = 3
                -- 種子親系
                -- 種子親を結合
                LEFT JOIN ancestry s
                          ON s.child_name = a.seed_name AND s.generation = 1
                -- 種子親の花粉親を結合
                LEFT JOIN ancestry sp
                          ON sp.child_name = s.pollen_name AND sp.generation = 2
                -- 種子親の種子親を結合
                LEFT JOIN ancestry ss
                          ON ss.child_name = s.seed_name AND ss.generation = 2
                -- 種子親の花粉親の花粉親を結合
                LEFT JOIN ancestry spp
                          ON spp.child_name = sp.pollen_name AND spp.generation = 3
                -- 種子親の花粉親の種子親を結合
                LEFT JOIN ancestry sps
                          ON sps.child_name = sp.seed_name AND sps.generation = 3
                -- 種子親の種子親の花粉親を結合
                LEFT JOIN ancestry ssp
                          ON ssp.child_name = ss.pollen_name AND ssp.generation = 3
                -- 種子親の種子親の種子親を結合
                LEFT JOIN ancestry sss
                          ON sss.child_name = ss.seed_name AND sss.generation = 3
        WHERE
            a.generation = 0;
`)
    return JSON.stringify(result)
  }

  async findGenealogies() {
    const db = drizzle(this.env.DB)

    const pollens = aliasedTable(apples, 'pollens')
    const seeds = aliasedTable(apples, 'seeds')

    const result = await db
      .select({
        appleName: apples.name,
        appleDisplayName: apples.display_name,
        pollenName: pollens.name,
        pollenDisplayName: pollens.display_name,
        seedName: seeds.name,
        seedDisplayName: seeds.display_name,
      })
      .from(genealogies)
      .innerJoin(apples, eq(genealogies.child_name, apples.name))
      .innerJoin(pollens, eq(genealogies.pollen_name, pollens.name))
      .innerJoin(seeds, eq(genealogies.seed_name, seeds.name))
      .where(ne(genealogies.child_name, 'unknown'))
      .orderBy(apples.name)

    return JSON.stringify(result)
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
