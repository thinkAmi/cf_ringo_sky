// プロパティベーステスト(fast-check)。循環・自己参照・長い鎖・ダイヤモンド型を含む
// ランダムな系譜データに対して、パーサが「正常出力かバリデーションエラーのどちらかに
// 必ず収まり、無限ループしない」こと、およびラウンドトリップの一致を検証する。
import { describe, expect, test } from 'bun:test'
import fc from 'fast-check'
import type { VarietyRow } from './varietyMaster'
import { parseVarietyMaster, toMarkdown } from './varietyMaster'

const YOMI_CHARS = [...'あいうえおかきくけこさしすせそたちつてとなにぬねの']
const yomiArb = fc
  .array(fc.constantFrom(...YOMI_CHARS), { minLength: 1, maxLength: 6 })
  .map((chars) => chars.join(''))

const displayNameArb = fc
  .array(fc.constantFrom('紅', '玉', '林', '香', 'A', 'B', 'C'), {
    minLength: 1,
    maxLength: 5,
  })
  .map((chars) => chars.join(''))

const colorArb = fc.constantFrom(
  'Red',
  'Maroon',
  'Gold',
  'Goldenrod',
  'FireBrick',
  'Crimson',
)

const nameArb = fc
  .stringMatching(/^[a-z][a-z0-9_]{0,8}$/)
  .filter((s) => s !== 'unknown')

/** name(存在する場合)+ pollen/seed(unknown または他のname、あるいは循環を作るため未定義)を含む生ローの配列 */
const rowsArb = fc
  .uniqueArray(
    fc.record({
      displayName: displayNameArb,
      yomi: yomiArb,
      color: colorArb,
      name: nameArb,
    }),
    { selector: (r) => r.name, minLength: 1, maxLength: 8 },
  )
  .chain((base) => {
    const names = base.map((r) => r.name)
    const parentArb = fc.constantFrom('unknown', ...names)
    return fc
      .tuple(...base.map(() => fc.tuple(parentArb, parentArb)))
      .map((parents) =>
        base.map((r, i) => ({
          displayName: r.displayName,
          yomi: r.yomi,
          color: r.color,
          name: r.name as string | null,
          pollen: parents[i][0] as string | null,
          seed: parents[i][1] as string | null,
        })),
      )
  })
  .map((rows) => {
    // 表示名の重複はテストの本題(rule2)ではないため、行番号で一意化する
    return rows.map((r, i) => ({ ...r, displayName: `${r.displayName}${i}` }))
  })

describe('PBT: parseVarietyMaster の頑健性', () => {
  test('循環・自己参照・長い鎖・ダイヤモンド型を含んでも、正常終了かエラーのどちらかに必ず収まる', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        const sorted = [...rows].sort((a, b) =>
          a.yomi < b.yomi ? -1 : a.yomi > b.yomi ? 1 : 0,
        )
        const markdown = toMarkdown(sorted)
        const result = parseVarietyMaster(markdown)
        if (result.ok) {
          expect(Array.isArray(result.rows)).toBe(true)
        } else {
          expect(result.errors.length).toBeGreaterThan(0)
          for (const e of result.errors) {
            expect(typeof e.line).toBe('number')
            expect(typeof e.message).toBe('string')
          }
        }
      }),
      { numRuns: 200 },
    )
  })

  test('ラウンドトリップ: 妥当なレコードは markdown化→再パースで一致する', () => {
    const validRowArb: fc.Arbitrary<VarietyRow> = fc.record({
      displayName: displayNameArb,
      yomi: yomiArb,
      color: colorArb,
      name: fc.constant(null),
      pollen: fc.constant(null),
      seed: fc.constant(null),
    })

    fc.assert(
      fc.property(
        fc
          .uniqueArray(validRowArb, {
            selector: (r) => r.displayName,
            minLength: 1,
            maxLength: 6,
          })
          .map((rows) =>
            rows
              .map((r, i) => ({ ...r, displayName: `${r.displayName}${i}` }))
              .sort((a, b) => (a.yomi < b.yomi ? -1 : a.yomi > b.yomi ? 1 : 0)),
          ),
        (rows) => {
          const markdown = toMarkdown(rows)
          const result = parseVarietyMaster(markdown)
          expect(result.ok).toBe(true)
          if (result.ok) {
            expect(result.rows).toEqual(rows)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})
