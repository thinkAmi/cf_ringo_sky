// 旧 D1 実装(〜2026-07。再帰CTE)をオラクルとする等価性検証。
// 品種マスタ(varieties.md)を旧スキーマ(apples/genealogies)相当のインメモリ SQLite に
// 投入し、旧 CTE の実行結果と新TS実装(genealogy.ts)の出力が一致することを保証する。
// 系譜解決の仕様を意図的に変更する PR では、このファイルごと削除してよい。
import { Database } from 'bun:sqlite'
import { describe, expect, test } from 'bun:test'
import {
  buildVarietyMap,
  findGenealogiesPure,
  findGenealogyByNamePure,
} from './genealogy'
import { parseVarietyMaster } from './varietyMaster'

const OLD_FIND_GENEALOGY_BY_NAME_SQL = `
    WITH RECURSIVE ancestry AS (
        SELECT
            g.child_name,
            a.display_name as child_display_name,
            g.pollen_name,
            g.seed_name,
            0 AS generation
        FROM genealogies g
                 INNER JOIN apples a
                            ON g.child_name = a.name
        WHERE child_name = ?
        UNION ALL
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
        WHERE a.generation < 3
    )
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
            LEFT JOIN ancestry p ON p.child_name = a.pollen_name AND p.generation = 1
            LEFT JOIN ancestry pp ON pp.child_name = p.pollen_name AND pp.generation = 2
            LEFT JOIN ancestry ps ON ps.child_name = p.seed_name AND ps.generation = 2
            LEFT JOIN ancestry ppp ON ppp.child_name = pp.pollen_name AND ppp.generation = 3
            LEFT JOIN ancestry pps ON pps.child_name = pp.seed_name AND pps.generation = 3
            LEFT JOIN ancestry psp ON psp.child_name = ps.pollen_name AND psp.generation = 3
            LEFT JOIN ancestry pss ON pss.child_name = ps.seed_name AND pss.generation = 3
            LEFT JOIN ancestry s ON s.child_name = a.seed_name AND s.generation = 1
            LEFT JOIN ancestry sp ON sp.child_name = s.pollen_name AND sp.generation = 2
            LEFT JOIN ancestry ss ON ss.child_name = s.seed_name AND ss.generation = 2
            LEFT JOIN ancestry spp ON spp.child_name = sp.pollen_name AND spp.generation = 3
            LEFT JOIN ancestry sps ON sps.child_name = sp.seed_name AND sps.generation = 3
            LEFT JOIN ancestry ssp ON ssp.child_name = ss.pollen_name AND ssp.generation = 3
            LEFT JOIN ancestry sss ON sss.child_name = ss.seed_name AND sss.generation = 3
    WHERE
        a.generation = 0;
`

const OLD_FIND_GENEALOGIES_SQL = `
  SELECT
    a.name AS appleName,
    a.display_name AS appleDisplayName,
    p.name AS pollenName,
    p.display_name AS pollenDisplayName,
    s.name AS seedName,
    s.display_name AS seedDisplayName
  FROM genealogies g
    INNER JOIN apples a ON g.child_name = a.name
    INNER JOIN apples p ON g.pollen_name = p.name
    INNER JOIN apples s ON g.seed_name = s.name
  WHERE g.child_name != 'unknown'
  ORDER BY a.name
`

const setupOldSchema = (
  rows: { name: string; displayName: string; pollen: string; seed: string }[],
) => {
  const db = new Database(':memory:')
  db.run(
    'CREATE TABLE apples (name TEXT PRIMARY KEY, display_name TEXT UNIQUE NOT NULL)',
  )
  db.run(
    'CREATE TABLE genealogies (child_name TEXT NOT NULL, pollen_name TEXT NOT NULL, seed_name TEXT NOT NULL, PRIMARY KEY (child_name, pollen_name, seed_name))',
  )

  const insertApple = db.query(
    'INSERT OR REPLACE INTO apples (name, display_name) VALUES (?, ?)',
  )
  const insertGenealogy = db.query(
    'INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES (?, ?, ?)',
  )

  insertApple.run('unknown', '不明')
  insertGenealogy.run('unknown', 'unknown', 'unknown')

  for (const row of rows) {
    insertApple.run(row.name, row.displayName)
    insertGenealogy.run(row.name, row.pollen, row.seed)
  }

  return db
}

describe('旧D1実装(再帰CTE)との等価性検証', () => {
  test('varieties.md の全系譜品種で findGenealogyByName が一致する', async () => {
    const markdown = await Bun.file(
      `${import.meta.dir}/../data/varieties.md`,
    ).text()
    const parsed = parseVarietyMaster(markdown)
    if (!parsed.ok) throw new Error('varieties.md のパースに失敗')

    const genealogyRows = parsed.rows.filter(
      (r): r is typeof r & { name: string; pollen: string; seed: string } =>
        r.name !== null && r.pollen !== null && r.seed !== null,
    )

    const db = setupOldSchema(genealogyRows)
    const oldQuery = db.query(OLD_FIND_GENEALOGY_BY_NAME_SQL)
    const newMap = buildVarietyMap(parsed.rows)

    for (const row of genealogyRows) {
      const oldResult = oldQuery.all(row.name) as Record<string, string>[]
      const newResult = findGenealogyByNamePure(newMap, row.name)
      expect(newResult).toEqual(oldResult)
    }

    db.close()
  })

  test('varieties.md 全体で findGenealogies が一致する', async () => {
    const markdown = await Bun.file(
      `${import.meta.dir}/../data/varieties.md`,
    ).text()
    const parsed = parseVarietyMaster(markdown)
    if (!parsed.ok) throw new Error('varieties.md のパースに失敗')

    const genealogyRows = parsed.rows.filter(
      (r): r is typeof r & { name: string; pollen: string; seed: string } =>
        r.name !== null && r.pollen !== null && r.seed !== null,
    )

    const db = setupOldSchema(genealogyRows)
    const oldResult = db.query(OLD_FIND_GENEALOGIES_SQL).all() as {
      appleName: string
      appleDisplayName: string
      pollenName: string | null
      pollenDisplayName: string | null
      seedName: string | null
      seedDisplayName: string | null
    }[]
    const newMap = buildVarietyMap(parsed.rows)
    const newResult = findGenealogiesPure(newMap)

    expect(newResult).toEqual(oldResult)
    db.close()
  })
})
