// verify/baseline/ の同期漏れ検出。
// baseline のうち genealogies 系は feeds に依存せず varieties.md だけから導出されるため、
// サーバを起動せずここで突き合わせられる。varieties.md を変更して baseline を再生成し
// 忘れると、次に verify.sh を回すセッションが無関係な差分を踏んで止まるので、その持ち越し
// ズレを bun test の時点で落とす(実例: ゴールドロマン登録時、7d05cdc のシナノドルチェ訂正時)。
// total/month は feeds fixture 依存のためここでは検証できない(verify.sh の担当)。
import { describe, expect, test } from 'bun:test'
import {
  buildVarietyMap,
  findGenealogiesPure,
  findGenealogyByNamePure,
} from './genealogy'
import { parseVarietyMaster } from './varietyMaster'

const HINT =
  'varieties.md と verify/baseline/ がずれています。' +
  'リポジトリルートで ./verify/verify.sh --update を実行し、' +
  '再生成した baseline を varieties.md と同じコミットに含めてください'

const loadVarietyMap = async () => {
  const markdown = await Bun.file(
    `${import.meta.dir}/../data/varieties.md`,
  ).text()
  const parsed = parseVarietyMaster(markdown)
  if (!parsed.ok) throw new Error('varieties.md のパースに失敗')
  return buildVarietyMap(parsed.rows)
}

// BunFile.json() はこの tsconfig の型に無いため text() + JSON.parse で読む
const loadBaseline = async (name: string): Promise<unknown> =>
  JSON.parse(
    await Bun.file(
      `${import.meta.dir}/../../../verify/baseline/${name}.json`,
    ).text(),
  )

// 差分そのものより「何をすれば直るか」が次のセッションに伝わることが重要なので、
// toEqual の diff に手順を添えて投げ直す
const expectSynced = (actual: unknown, expected: unknown) => {
  try {
    expect(actual).toEqual(expected)
  } catch (e) {
    throw new Error(`${HINT}\n\n${(e as Error).message}`)
  }
}

describe('verify baseline の同期', () => {
  test('genealogies が varieties.md と一致する', async () => {
    const map = await loadVarietyMap()
    expectSynced(findGenealogiesPure(map), await loadBaseline('genealogies'))
  })

  test('genealogy_tsugaru が varieties.md と一致する', async () => {
    const map = await loadVarietyMap()
    expectSynced(
      findGenealogyByNamePure(map, 'tsugaru'),
      await loadBaseline('genealogy_tsugaru'),
    )
  })
})
