import { describe, expect, test } from 'bun:test'
import { HEADER, parseVarietyMaster } from './varietyMaster'

const SEP = '|---|---|---|---|---|---|---|'

// 読み順(昇順): こうぎょく < ごーるでんでりしゃす < しなのごーるど < つがる
const KOUGYOKU =
  '| 紅玉 | こうぎょく | Maroon | kougyoku | unknown | unknown | |'
const GOLDEN =
  '| ゴールデンデリシャス | ごーるでんでりしゃす | DarkOrange | golden_delicious | unknown | unknown | |'
const SHINANO_GOLD = '| シナノゴールド | しなのごーるど | Gold |  |  |  | |'
const TSUGARU =
  '| つがる | つがる | Goldenrod | tsugaru | kougyoku | golden_delicious | |'

const build = (rows: string[]) => [HEADER, SEP, ...rows].join('\n')

describe('parseVarietyMaster: 正常系', () => {
  test('妥当な品種マスタは ok:true で全行を返す', () => {
    const result = parseVarietyMaster(
      build([KOUGYOKU, GOLDEN, SHINANO_GOLD, TSUGARU]),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(result.rows).toHaveLength(4)
    expect(result.rows[0]).toEqual({
      displayName: '紅玉',
      yomi: 'こうぎょく',
      color: 'Maroon',
      name: 'kougyoku',
      pollen: 'unknown',
      seed: 'unknown',
    })
    expect(result.rows[2]).toEqual({
      displayName: 'シナノゴールド',
      yomi: 'しなのごーるど',
      color: 'Gold',
      name: null,
      pollen: null,
      seed: null,
    })
  })
})

describe('ルール1: ヘッダ行・セル数', () => {
  test('ヘッダ行が不一致だとエラー', () => {
    const badHeader = '| 表示名 | 読み | 色 | name | 花粉親 | 種子親 | 引用 |'
    const result = parseVarietyMaster([badHeader, SEP, KOUGYOKU].join('\n'))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      { line: 1, message: `ヘッダ行が不正です: 1行目 (期待値: "${HEADER}")` },
    ])
  })

  test('データ行のセル数が7でないとエラー', () => {
    const badRow =
      '| 紅玉 | こうぎょく | Maroon | kougyoku | unknown | unknown |'
    const result = parseVarietyMaster(build([badRow, GOLDEN]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      { line: 3, message: 'セル数が不正です: 3行目 (実際のセル数: 6)' },
    ])
  })
})

describe('ルール2: 表示名', () => {
  test('表示名が空だとエラー', () => {
    const badRow = '|  | こうぎょく | Maroon |  |  |  | |'
    const result = parseVarietyMaster(build([badRow]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      { line: 3, message: '表示名が空です: 3行目' },
    ])
  })

  test('表示名が重複するとエラー', () => {
    const rowA = '| 紅玉 | こうぎょく | Maroon |  |  |  | |'
    const rowB = '| 紅玉 | ごーるでんでりしゃす | DarkOrange |  |  |  | |'
    const result = parseVarietyMaster(build([rowA, rowB]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      {
        line: 4,
        message: '表示名が重複しています: 3行目, 4行目 (表示名: 紅玉)',
      },
    ])
  })
})

describe('ルール3: 読み', () => {
  test('ひらがな+長音以外を含むとエラー', () => {
    const badRow = '| シナノゴールド | しなのごーるど1 | Gold |  |  |  | |'
    const result = parseVarietyMaster(build([badRow]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      { line: 3, message: '読みが不正です: 3行目 (値: "しなのごーるど1")' },
    ])
  })
})

describe('ルール4: 色', () => {
  test('CSS named color に存在しないとエラー', () => {
    const badRow = '| つがる | つがる | NotAColor |  |  |  | |'
    const result = parseVarietyMaster(build([badRow]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      { line: 3, message: '色が不明です: 3行目 (値: "NotAColor")' },
    ])
  })
})

describe('ルール5: name', () => {
  test('nameが形式違反だとエラー', () => {
    const badRow =
      '| 紅玉 | こうぎょく | Maroon | Kougyoku | unknown | unknown | |'
    const result = parseVarietyMaster(build([badRow]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      { line: 3, message: 'nameが不正です: 3行目 (値: "Kougyoku")' },
    ])
  })

  test('nameが重複するとエラー', () => {
    const rowA = '| 紅玉 | こうぎょく | Maroon | foo | unknown | unknown | |'
    const rowB = '| つがる | つがる | Goldenrod | foo | unknown | unknown | |'
    const result = parseVarietyMaster(build([rowA, rowB]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      { line: 4, message: 'nameが重複しています: 3行目, 4行目 (name: foo)' },
    ])
  })
})

describe('ルール6: 親セルの必須性', () => {
  test('nameあり行で花粉親が空だとエラー', () => {
    const badRow = '| 紅玉 | こうぎょく | Maroon | kougyoku |  | unknown | |'
    const result = parseVarietyMaster(build([badRow]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      { line: 3, message: '花粉親が空です(nameあり行): 3行目' },
    ])
  })

  test('nameあり行で種子親が空だとエラー', () => {
    const badRow = '| 紅玉 | こうぎょく | Maroon | kougyoku | unknown |  | |'
    const result = parseVarietyMaster(build([badRow]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      { line: 3, message: '種子親が空です(nameあり行): 3行目' },
    ])
  })

  test('nameなし行で花粉親が非空だとエラー', () => {
    const badRow =
      '| シナノゴールド | しなのごーるど | Gold |  | unknown |  | |'
    const result = parseVarietyMaster(build([badRow]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      {
        line: 3,
        message: '花粉親はnameが無い行では空である必要があります: 3行目',
      },
    ])
  })

  test('nameなし行で種子親が非空だとエラー', () => {
    const badRow =
      '| シナノゴールド | しなのごーるど | Gold |  |  | unknown | |'
    const result = parseVarietyMaster(build([badRow]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      {
        line: 3,
        message: '種子親はnameが無い行では空である必要があります: 3行目',
      },
    ])
  })
})

describe('ルール7: 参照整合', () => {
  test('花粉親が他の行のnameとして存在しないとエラー', () => {
    const badRow =
      '| 紅玉 | こうぎょく | Maroon | kougyoku | no_such_variety | unknown | |'
    const result = parseVarietyMaster(build([badRow]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      {
        line: 3,
        message: '花粉親が未定義です: 3行目 (品種名: no_such_variety)',
      },
    ])
  })

  test('種子親が他の行のnameとして存在しないとエラー', () => {
    const badRow =
      '| 紅玉 | こうぎょく | Maroon | kougyoku | unknown | no_such_variety | |'
    const result = parseVarietyMaster(build([badRow]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      {
        line: 3,
        message: '種子親が未定義です: 3行目 (品種名: no_such_variety)',
      },
    ])
  })
})

describe('ルール8: 循環系譜', () => {
  test('自分が自分の祖先に現れるとエラー', () => {
    const rowA = '| A | あ | Red | a | b | unknown | |'
    const rowB = '| B | い | Blue | b | a | unknown | |'
    const result = parseVarietyMaster(build([rowA, rowB]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toHaveLength(2)
    expect(result.errors[0]).toEqual({
      line: 3,
      message: '循環系譜が検出されました: 3行目 (経路: a -> b -> a)',
    })
    expect(result.errors[1]).toEqual({
      line: 4,
      message: '循環系譜が検出されました: 4行目 (経路: b -> a -> b)',
    })
  })
})

describe('ルール9: 読み順ソート', () => {
  test('読み順が崩れているとエラー', () => {
    // 系譜のない色のみの行同士で比較(参照整合に影響させないため)
    // 読み「つがる」は「しなのごーるど」より後に来るべきだが、ここでは先に置く
    const tsugaruColorOnly = '| つがる | つがる | Goldenrod |  |  |  | |'
    const result = parseVarietyMaster(build([tsugaruColorOnly, SHINANO_GOLD]))
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('unreachable')
    expect(result.errors).toEqual([
      { line: 3, message: '読み順ソートが不正です: 3行目 (期待位置: 4行目)' },
      { line: 4, message: '読み順ソートが不正です: 4行目 (期待位置: 3行目)' },
    ])
  })
})

describe('実物ゲート', () => {
  test('リポジトリの varieties.md 自体が全ルールを通過する', async () => {
    const markdown = await Bun.file(
      `${import.meta.dir}/../data/varieties.md`,
    ).text()
    const result = parseVarietyMaster(markdown)
    if (!result.ok) {
      throw new Error(
        `varieties.md の検証に失敗: ${JSON.stringify(result.errors, null, 2)}`,
      )
    }
    expect(result.ok).toBe(true)
  })
})
