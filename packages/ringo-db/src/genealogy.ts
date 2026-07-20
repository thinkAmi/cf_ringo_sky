// varietyMaster.ts がパースした VarietyRow[] を使った系譜解決・色解決・マスタ照合の純関数群。
// 旧 D1 実装(再帰CTE)の代替。呼び出し側(varietyData.ts)がモジュールスコープで
// 品種マスタをパースして Map 化し、ここへ渡す。
import type { VarietyRow } from './varietyMaster'

export type VarietyNode = {
  name: string
  displayName: string
  pollen: string | null
  seed: string | null
}

export type VarietyMap = Map<string, VarietyNode>

const UNKNOWN: VarietyNode = {
  name: 'unknown',
  displayName: '不明',
  pollen: 'unknown',
  seed: 'unknown',
}

/** 系譜を持つ行(name あり)のみを snake_case name キーの Map にする。unknown を内部合成する */
export const buildVarietyMap = (rows: VarietyRow[]): VarietyMap => {
  const map: VarietyMap = new Map()
  for (const row of rows) {
    if (row.name === null) continue
    map.set(row.name, {
      name: row.name,
      displayName: row.displayName,
      pollen: row.pollen,
      seed: row.seed,
    })
  }
  map.set('unknown', UNKNOWN)
  return map
}

/** 表示名 → 色 の Map(系譜の有無を問わず全行が対象) */
export const buildColorMap = (rows: VarietyRow[]): Map<string, string> => {
  const map = new Map<string, string>()
  for (const row of rows) {
    map.set(row.displayName, row.color)
  }
  return map
}

export const findColorNamePure = (
  colorMap: Map<string, string>,
  name: string | null,
): string => (name !== null ? colorMap.get(name) : undefined) ?? 'red'

/**
 * 集計行のうち、name が品種マスタの表示名と完全一致する行だけを残す(ADR 0008)。
 * 照合キーは色引き(findColorNamePure)と同じ colorMap のキーで、正規化はしない。
 */
export const filterRegisteredRowsPure = <T extends { name: string | null }>(
  colorMap: Map<string, string>,
  rows: T[],
): T[] => rows.filter((r) => r.name !== null && colorMap.has(r.name))

type AncestorPair = { apple: string; appleDisplayName: string }

const toPair = (node: VarietyNode | undefined): AncestorPair => ({
  apple: node?.name ?? '',
  appleDisplayName: node?.displayName ?? '',
})

const parentOf = (
  map: VarietyMap,
  node: VarietyNode | undefined,
  side: 'pollen' | 'seed',
) => (node ? map.get(node[side] ?? '') : undefined)

/**
 * 旧 SQL(再帰CTE)の SELECT 列と同じ33フィールドの横持ちオブジェクトを1件返す。
 * 対象の name が品種マスタに存在しない場合は空配列を返す(旧実装が0行を返す挙動と同じ)。
 */
export const findGenealogyByNamePure = (
  map: VarietyMap,
  appleName: string,
): Record<string, string>[] => {
  const root = map.get(appleName)
  if (!root) return []

  const pollen = parentOf(map, root, 'pollen')
  const seed = parentOf(map, root, 'seed')
  const pollenPollen = parentOf(map, pollen, 'pollen')
  const pollenSeed = parentOf(map, pollen, 'seed')
  const seedPollen = parentOf(map, seed, 'pollen')
  const seedSeed = parentOf(map, seed, 'seed')
  const pollenPollenPollen = parentOf(map, pollenPollen, 'pollen')
  const pollenPollenSeed = parentOf(map, pollenPollen, 'seed')
  const pollenSeedPollen = parentOf(map, pollenSeed, 'pollen')
  const pollenSeedSeed = parentOf(map, pollenSeed, 'seed')
  const seedPollenPollen = parentOf(map, seedPollen, 'pollen')
  const seedPollenSeed = parentOf(map, seedPollen, 'seed')
  const seedSeedPollen = parentOf(map, seedSeed, 'pollen')
  const seedSeedSeed = parentOf(map, seedSeed, 'seed')

  const rootPair = toPair(root)
  return [
    {
      apple: rootPair.apple,
      appleDisplayName: rootPair.appleDisplayName,
      pollen: toPair(pollen).apple,
      pollenDisplayName: toPair(pollen).appleDisplayName,
      pollenPollen: toPair(pollenPollen).apple,
      pollenPollenDisplayName: toPair(pollenPollen).appleDisplayName,
      pollenPollenPollen: toPair(pollenPollenPollen).apple,
      pollenPollenPollenDisplayName:
        toPair(pollenPollenPollen).appleDisplayName,
      pollenPollenSeed: toPair(pollenPollenSeed).apple,
      pollenPollenSeedDisplayName: toPair(pollenPollenSeed).appleDisplayName,
      pollenSeed: toPair(pollenSeed).apple,
      pollenSeedDisplayName: toPair(pollenSeed).appleDisplayName,
      pollenSeedPollen: toPair(pollenSeedPollen).apple,
      pollenSeedPollenDisplayName: toPair(pollenSeedPollen).appleDisplayName,
      pollenSeedSeed: toPair(pollenSeedSeed).apple,
      pollenSeedSeedDisplayName: toPair(pollenSeedSeed).appleDisplayName,
      seed: toPair(seed).apple,
      seedDisplayName: toPair(seed).appleDisplayName,
      seedPollen: toPair(seedPollen).apple,
      seedPollenDisplayName: toPair(seedPollen).appleDisplayName,
      seedPollenPollen: toPair(seedPollenPollen).apple,
      seedPollenPollenDisplayName: toPair(seedPollenPollen).appleDisplayName,
      seedPollenSeed: toPair(seedPollenSeed).apple,
      seedPollenSeedDisplayName: toPair(seedPollenSeed).appleDisplayName,
      seedSeed: toPair(seedSeed).apple,
      seedSeedDisplayName: toPair(seedSeed).appleDisplayName,
      seedSeedPollen: toPair(seedSeedPollen).apple,
      seedSeedPollenDisplayName: toPair(seedSeedPollen).appleDisplayName,
      seedSeedSeed: toPair(seedSeedSeed).apple,
      seedSeedSeedDisplayName: toPair(seedSeedSeed).appleDisplayName,
    },
  ]
}

/** unknown を除いた全系譜を name 昇順で返す(旧 orderBy(apples.name) と同一の並び) */
export const findGenealogiesPure = (map: VarietyMap) => {
  const rows = [...map.values()].filter((node) => node.name !== 'unknown')
  rows.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

  return rows.map((node) => {
    const pollen = map.get(node.pollen ?? '')
    const seed = map.get(node.seed ?? '')
    return {
      appleName: node.name,
      appleDisplayName: node.displayName,
      pollenName: pollen?.name ?? null,
      pollenDisplayName: pollen?.displayName ?? null,
      seedName: seed?.name ?? null,
      seedDisplayName: seed?.displayName ?? null,
    }
  })
}
