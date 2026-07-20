import { describe, expect, test } from 'bun:test'
import { buildMonthlyDatasetsPure, type MonthlyRow } from './aggregation'

const colorMap = new Map([
  ['秋映', 'DarkRed'],
  ['王林', 'YellowGreen'],
])

const zeros = (...pairs: [number, number][]) => {
  const data = new Array(12).fill(0)
  for (const [month, total] of pairs) data[month - 1] = total
  return data
}

describe('buildMonthlyDatasetsPure', () => {
  test('対象が0件なら空配列を返す(ラベルなしのゴミ dataset を作らない)', () => {
    expect(buildMonthlyDatasetsPure(colorMap, [])).toEqual([])
  })

  test('1品種は該当月に値の入った12ヶ月分の系列になる', () => {
    const rows: MonthlyRow[] = [
      { name: '秋映', month: 1, total: 2 },
      { name: '秋映', month: 5, total: 3 },
    ]
    expect(buildMonthlyDatasetsPure(colorMap, rows)).toEqual([
      {
        label: '秋映',
        data: zeros([1, 2], [5, 3]),
        borderColor: 'DarkRed',
        backgroundColor: 'DarkRed',
        tension: 0.1,
      },
    ])
  })

  test('品種が変わると dataset が分かれ、最後の品種も取りこぼさない', () => {
    const rows: MonthlyRow[] = [
      { name: '秋映', month: 1, total: 1 },
      { name: '王林', month: 2, total: 5 },
    ]
    const result = buildMonthlyDatasetsPure(colorMap, rows)
    expect(result).toHaveLength(2)
    expect(result.map((d) => d.label)).toEqual(['秋映', '王林'])
    expect(result[1].data).toEqual(zeros([2, 5]))
  })

  test('各 dataset の data 配列は独立している(同じ配列を使い回さない)', () => {
    const rows: MonthlyRow[] = [
      { name: '秋映', month: 1, total: 1 },
      { name: '王林', month: 1, total: 9 },
    ]
    const result = buildMonthlyDatasetsPure(colorMap, rows)
    expect(result[0].data).not.toBe(result[1].data)
    expect(result[0].data).toEqual(zeros([1, 1]))
  })

  test('colorMap にない名前は red にフォールバックする(既存の色解決の踏襲)', () => {
    const rows: MonthlyRow[] = [{ name: '未登録品種', month: 3, total: 1 }]
    const [dataset] = buildMonthlyDatasetsPure(colorMap, rows)
    expect(dataset.backgroundColor).toBe('red')
    expect(dataset.borderColor).toBe('red')
  })
})
