import { describe, expect, test } from 'bun:test'
import {
  buildColorMap,
  buildVarietyMap,
  findColorNamePure,
  findGenealogiesPure,
  findGenealogyByNamePure,
} from './genealogy'
import type { VarietyRow } from './varietyMaster'

const row = (override: Partial<VarietyRow>): VarietyRow => ({
  displayName: 'x',
  yomi: 'x',
  color: 'Red',
  name: null,
  pollen: null,
  seed: null,
  ...override,
})

describe('findGenealogyByNamePure: 33フィールド検証', () => {
  // 祖先15個(root含む)がすべて異なる名前の人工フィクスチャ。詰め替え取り違えを検出する
  const rows: VarietyRow[] = [
    row({
      displayName: 'Root',
      yomi: 'るーと',
      name: 'root',
      pollen: 'p1',
      seed: 's1',
    }),
    row({
      displayName: 'P1',
      yomi: 'ぴーいち',
      name: 'p1',
      pollen: 'p2',
      seed: 'p3',
    }),
    row({
      displayName: 'S1',
      yomi: 'えすいち',
      name: 's1',
      pollen: 's2',
      seed: 's3',
    }),
    row({
      displayName: 'P2',
      yomi: 'ぴーに',
      name: 'p2',
      pollen: 'p4',
      seed: 'p5',
    }),
    row({
      displayName: 'P3',
      yomi: 'ぴーさん',
      name: 'p3',
      pollen: 'p6',
      seed: 'p7',
    }),
    row({
      displayName: 'S2',
      yomi: 'えすに',
      name: 's2',
      pollen: 's4',
      seed: 's5',
    }),
    row({
      displayName: 'S3',
      yomi: 'えすさん',
      name: 's3',
      pollen: 's6',
      seed: 's7',
    }),
    ...['p4', 'p5', 'p6', 'p7', 's4', 's5', 's6', 's7'].map((n) =>
      row({
        displayName: n.toUpperCase(),
        yomi: n,
        name: n,
        pollen: 'unknown',
        seed: 'unknown',
      }),
    ),
  ]

  test('14祖先すべてが正しい位置に横持ちされる', () => {
    const map = buildVarietyMap(rows)
    const result = findGenealogyByNamePure(map, 'root')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      apple: 'root',
      appleDisplayName: 'Root',
      pollen: 'p1',
      pollenDisplayName: 'P1',
      pollenPollen: 'p2',
      pollenPollenDisplayName: 'P2',
      pollenPollenPollen: 'p4',
      pollenPollenPollenDisplayName: 'P4',
      pollenPollenSeed: 'p5',
      pollenPollenSeedDisplayName: 'P5',
      pollenSeed: 'p3',
      pollenSeedDisplayName: 'P3',
      pollenSeedPollen: 'p6',
      pollenSeedPollenDisplayName: 'P6',
      pollenSeedSeed: 'p7',
      pollenSeedSeedDisplayName: 'P7',
      seed: 's1',
      seedDisplayName: 'S1',
      seedPollen: 's2',
      seedPollenDisplayName: 'S2',
      seedPollenPollen: 's4',
      seedPollenPollenDisplayName: 'S4',
      seedPollenSeed: 's5',
      seedPollenSeedDisplayName: 'S5',
      seedSeed: 's3',
      seedSeedDisplayName: 'S3',
      seedSeedPollen: 's6',
      seedSeedPollenDisplayName: 'S6',
      seedSeedSeed: 's7',
      seedSeedSeedDisplayName: 'S7',
    })
  })

  test('基本品種(親がunknown)は曽祖父母世代もunknownで埋まる', () => {
    const map = buildVarietyMap(rows)
    const result = findGenealogyByNamePure(map, 'p4')
    expect(result).toHaveLength(1)
    expect(result[0].pollen).toBe('unknown')
    expect(result[0].pollenDisplayName).toBe('不明')
    expect(result[0].pollenPollen).toBe('unknown')
    expect(result[0].pollenPollenPollen).toBe('unknown')
  })

  test('品種マスタに存在しないnameは空配列', () => {
    const map = buildVarietyMap(rows)
    expect(findGenealogyByNamePure(map, 'no_such_variety')).toEqual([])
  })
})

describe('findGenealogiesPure', () => {
  test('unknownを除外し、name昇順で返す', () => {
    const rows: VarietyRow[] = [
      row({
        displayName: 'つがる',
        yomi: 'つがる',
        name: 'tsugaru',
        pollen: 'kougyoku',
        seed: 'unknown',
      }),
      row({
        displayName: '紅玉',
        yomi: 'こうぎょく',
        name: 'kougyoku',
        pollen: 'unknown',
        seed: 'unknown',
      }),
    ]
    const map = buildVarietyMap(rows)
    const result = findGenealogiesPure(map)
    expect(result).toEqual([
      {
        appleName: 'kougyoku',
        appleDisplayName: '紅玉',
        pollenName: 'unknown',
        pollenDisplayName: '不明',
        seedName: 'unknown',
        seedDisplayName: '不明',
      },
      {
        appleName: 'tsugaru',
        appleDisplayName: 'つがる',
        pollenName: 'kougyoku',
        pollenDisplayName: '紅玉',
        seedName: 'unknown',
        seedDisplayName: '不明',
      },
    ])
  })

  test('系譜を持たない行(nameなし)は含まれない', () => {
    const rows: VarietyRow[] = [
      row({ displayName: 'シナノゴールド', yomi: 'しなのごーるど' }),
    ]
    const map = buildVarietyMap(rows)
    expect(findGenealogiesPure(map)).toEqual([])
  })
})

describe('findColorNamePure', () => {
  const rows: VarietyRow[] = [row({ displayName: '紅玉', color: 'Maroon' })]
  const colorMap = buildColorMap(rows)

  test('登録済み表示名は対応する色を返す', () => {
    expect(findColorNamePure(colorMap, '紅玉')).toBe('Maroon')
  })

  test('未登録の表示名はredにフォールバックする', () => {
    expect(findColorNamePure(colorMap, '未登録品種')).toBe('red')
  })

  test('nullはredにフォールバックする', () => {
    expect(findColorNamePure(colorMap, null)).toBe('red')
  })
})
