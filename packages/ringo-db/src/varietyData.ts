// モジュールスコープで品種マスタ(varieties.md)をパースし、Map化して公開する。
// wrangler.toml の [[rules]] (type = "Text", globs = ["**/*.md"]) によって
// varieties.md はビルド時に文字列としてバンドルされる。
import varietiesMarkdown from '../data/varieties.md'
import {
  buildColorMap,
  buildVarietyMap,
  findColorNamePure,
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

export const findColorName = (name: string | null) =>
  findColorNamePure(colorMap, name)

/**
 * calculateTotalByName 用。旧実装(appleColors.find(...)?.color)はフォールバックせず
 * undefined を返していたため、その挙動をそのまま踏襲する(findColorName は 'red' にフォールバックする)。
 */
export const findColorNameOrUndefined = (
  name: string | null,
): string | undefined => (name !== null ? colorMap.get(name) : undefined)

export const findGenealogyByName = (appleName: string) =>
  JSON.stringify(findGenealogyByNamePure(varietyMap, appleName))

export const findGenealogies = () =>
  JSON.stringify(findGenealogiesPure(varietyMap))
