// モジュールスコープで品種マスタ(varieties.md)をパースし、Map化して公開する。
// wrangler.toml の [[rules]] (type = "Text", globs = ["**/*.md"]) によって
// varieties.md はビルド時に文字列としてバンドルされる。
import varietiesMarkdown from '../data/varieties.md'
import { buildMonthlyDatasetsPure, type MonthlyRow } from './aggregation'
import {
  buildColorMap,
  buildVarietyMap,
  filterRegisteredRowsPure,
  findGenealogiesPure,
  findGenealogyByNamePure,
} from './genealogy'
import { parseVarietyMaster } from './varietyMaster'

const parsed = parseVarietyMaster(varietiesMarkdown)
if (!parsed.ok) {
  throw new Error(
    `varieties.md のバリデーションに失敗しました: ${parsed.errors.map((e) => e.message).join(' / ')}`,
  )
}

const varietyMap = buildVarietyMap(parsed.rows)
const colorMap = buildColorMap(parsed.rows)

/**
 * calculateTotalByName 用。旧実装(appleColors.find(...)?.color)はフォールバックせず
 * undefined を返していたため、その挙動をそのまま踏襲する(findColorNamePure は 'red' に
 * フォールバックするが、こちらは未登録名に色を付けない)。
 */
export const findColorNameOrUndefined = (
  name: string | null,
): string | undefined => (name !== null ? colorMap.get(name) : undefined)

/** 集計 RPC 用。品種マスタに表示名がない行(未登録の品種名・NULL)を除外する(ADR 0008) */
export const filterRegisteredRows = <T extends { name: string | null }>(
  rows: T[],
): T[] => filterRegisteredRowsPure(colorMap, rows)

/** calculateTotalByNameAndMonth 用。月別集計行をグラフの dataset 形に整える */
export const buildMonthlyDatasets = (rows: MonthlyRow[]) =>
  buildMonthlyDatasetsPure(colorMap, rows)

export const findGenealogyByName = (appleName: string) =>
  JSON.stringify(findGenealogyByNamePure(varietyMap, appleName))

export const findGenealogies = () =>
  JSON.stringify(findGenealogiesPure(varietyMap))
