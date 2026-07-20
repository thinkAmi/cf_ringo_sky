// 集計 SQL の結果を Chart.js の dataset 形へ整える純関数群。
// 色引きは genealogy.ts の findColorNamePure に委ね、colorMap は
// 呼び出し側(varietyData.ts)がモジュールスコープで束縛する。
import { findColorNamePure } from './genealogy'

/** calculateTotalByNameAndMonth の SQL が返す行(name 昇順・month 昇順) */
export type MonthlyRow = {
  name: string | null
  month: number
  total: number
}

const MONTH_COUNT = 12

/**
 * name ごとに12ヶ月分の系列を1 dataset にまとめる。
 * rows が空(feeds が空、または全行が品種マスタ未登録)なら空配列を返す。
 */
export const buildMonthlyDatasetsPure = (
  colorMap: Map<string, string>,
  rows: MonthlyRow[],
) => {
  if (rows.length === 0) return []

  const datasets = []
  let name = rows[0].name
  let quantities: number[] = new Array(MONTH_COUNT).fill(0)

  const toDataset = (label: string | null, data: number[]) => ({
    label,
    data,
    borderColor: findColorNamePure(colorMap, label),
    backgroundColor: findColorNamePure(colorMap, label),
    tension: 0.1,
  })

  for (const row of rows) {
    if (name !== row.name) {
      datasets.push(toDataset(name, quantities))

      name = row.name
      quantities = new Array(MONTH_COUNT).fill(0)
    }

    quantities[row.month - 1] = row.total
  }

  datasets.push(toDataset(name, quantities))

  return datasets
}
