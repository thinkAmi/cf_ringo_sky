// 品種マスタ(packages/ringo-db/data/varieties.md)のパーサ兼バリデータ。
// 純関数のみで構成し、リンタとランタイムのパーサを同一コードにする(ADR-0003)。

export type VarietyRow = {
  displayName: string
  yomi: string
  color: string
  /** 系譜を持たない品種は null */
  name: string | null
  /** name が null の場合は必ず null。基本品種は 'unknown' */
  pollen: string | null
  /** name が null の場合は必ず null。基本品種は 'unknown' */
  seed: string | null
}

export type LintError = {
  line: number
  message: string
}

export type ParseResult =
  | { ok: true; rows: VarietyRow[] }
  | { ok: false; errors: LintError[] }

export const HEADER = '| 表示名 | 読み | 色 | name | 花粉親 | 種子親 | 出典 |'
const COLUMN_NAMES = [
  '表示名',
  '読み',
  '色',
  'name',
  '花粉親',
  '種子親',
  '出典',
] as const
const YOMI_PATTERN = /^[ぁ-んー]+$/
const NAME_PATTERN = /^[a-z][a-z0-9_]*$/

// CSS Color Module Level 4 の named color(148語)。小文字で保持し、比較時は小文字化する。
const CSS_NAMED_COLORS = new Set([
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
])

export const isCssNamedColor = (value: string): boolean =>
  CSS_NAMED_COLORS.has(value.toLowerCase())

const splitCells = (line: string): string[] => {
  // 先頭・末尾の `|` を除き、エスケープされていない `|` で分割する
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replaceAll('\\|', '|'))
}

const emptyToNull = (value: string): string | null =>
  value === '' ? null : value

export const parseVarietyMaster = (markdown: string): ParseResult => {
  const lines = markdown.split('\n').filter((line) => line.trim() !== '')
  const errors: LintError[] = []

  if (lines.length === 0 || lines[0] !== HEADER) {
    errors.push({
      line: 1,
      message: `ヘッダ行が不正です: 1行目 (期待値: "${HEADER}")`,
    })
    return { ok: false, errors }
  }

  if (lines.length < 2 || splitCells(lines[1]).length !== 7) {
    errors.push({
      line: 2,
      message: `セル数が不正です: 2行目 (実際のセル数: ${lines.length < 2 ? 0 : splitCells(lines[1]).length})`,
    })
    return { ok: false, errors }
  }

  const dataLines = lines.slice(2)

  // ルール1: 全行セル数が7
  const parsedLines: { line: number; cells: string[] }[] = []
  for (const [i, raw] of dataLines.entries()) {
    const line = i + 3
    const cells = splitCells(raw)
    if (cells.length !== 7) {
      errors.push({
        line,
        message: `セル数が不正です: ${line}行目 (実際のセル数: ${cells.length})`,
      })
      continue
    }
    parsedLines.push({ line, cells })
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  type RawRow = {
    line: number
    displayName: string
    yomi: string
    color: string
    name: string | null
    pollen: string | null
    seed: string | null
  }

  const rawRows: RawRow[] = parsedLines.map(({ line, cells }) => ({
    line,
    displayName: cells[0],
    yomi: cells[1],
    color: cells[2],
    name: emptyToNull(cells[3]),
    pollen: emptyToNull(cells[4]),
    seed: emptyToNull(cells[5]),
  }))

  // ルール2: 表示名は非空・一意
  const displayNameLines = new Map<string, number>()
  for (const row of rawRows) {
    if (row.displayName === '') {
      errors.push({
        line: row.line,
        message: `表示名が空です: ${row.line}行目`,
      })
      continue
    }
    const dup = displayNameLines.get(row.displayName)
    if (dup !== undefined) {
      errors.push({
        line: row.line,
        message: `表示名が重複しています: ${dup}行目, ${row.line}行目 (表示名: ${row.displayName})`,
      })
    } else {
      displayNameLines.set(row.displayName, row.line)
    }
  }

  // ルール3: 読みはひらがな+長音のみ・非空
  for (const row of rawRows) {
    if (row.yomi === '' || !YOMI_PATTERN.test(row.yomi)) {
      errors.push({
        line: row.line,
        message: `読みが不正です: ${row.line}行目 (値: "${row.yomi}")`,
      })
    }
  }

  // ルール4: 色はCSS named colorに存在
  for (const row of rawRows) {
    if (!isCssNamedColor(row.color)) {
      errors.push({
        line: row.line,
        message: `色が不明です: ${row.line}行目 (値: "${row.color}")`,
      })
    }
  }

  // ルール5: nameは空 or ^[a-z][a-z0-9_]*$ ・非空同士で一意
  const nameLines = new Map<string, number>()
  for (const row of rawRows) {
    if (row.name === null) continue
    if (!NAME_PATTERN.test(row.name)) {
      errors.push({
        line: row.line,
        message: `nameが不正です: ${row.line}行目 (値: "${row.name}")`,
      })
      continue
    }
    const dup = nameLines.get(row.name)
    if (dup !== undefined) {
      errors.push({
        line: row.line,
        message: `nameが重複しています: ${dup}行目, ${row.line}行目 (name: ${row.name})`,
      })
    } else {
      nameLines.set(row.name, row.line)
    }
  }

  // ルール6: nameあり行は親セル2つとも必須、nameなし行は親セル空
  for (const row of rawRows) {
    if (row.name !== null) {
      if (row.pollen === null) {
        errors.push({
          line: row.line,
          message: `花粉親が空です(nameあり行): ${row.line}行目`,
        })
      }
      if (row.seed === null) {
        errors.push({
          line: row.line,
          message: `種子親が空です(nameあり行): ${row.line}行目`,
        })
      }
    } else {
      if (row.pollen !== null) {
        errors.push({
          line: row.line,
          message: `花粉親はnameが無い行では空である必要があります: ${row.line}行目`,
        })
      }
      if (row.seed !== null) {
        errors.push({
          line: row.line,
          message: `種子親はnameが無い行では空である必要があります: ${row.line}行目`,
        })
      }
    }
  }

  // ルール7: 参照整合(親は他の行のname or 'unknown')
  const definedNames = new Set(nameLines.keys())
  definedNames.add('unknown')
  for (const row of rawRows) {
    if (row.name === null) continue
    if (row.pollen !== null && !definedNames.has(row.pollen)) {
      errors.push({
        line: row.line,
        message: `花粉親が未定義です: ${row.line}行目 (品種名: ${row.pollen})`,
      })
    }
    if (row.seed !== null && !definedNames.has(row.seed)) {
      errors.push({
        line: row.line,
        message: `種子親が未定義です: ${row.line}行目 (品種名: ${row.seed})`,
      })
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  // ルール8: 循環系譜なし(自分が自分の祖先に現れない)
  const byName = new Map(
    rawRows.filter((r) => r.name !== null).map((r) => [r.name as string, r]),
  )
  for (const row of rawRows) {
    if (row.name === null) continue
    const path: string[] = [row.name]
    // visiting: 現在の探索パス上で訪問済みのnameを保持し、rowを含まない別の循環に
    // 迷い込んだ場合でも無限再帰にならないようにする(rule8はrow自身の祖先探索のみが対象)
    const visiting = new Set<string>([row.name])
    const visit = (current: RawRow | undefined): boolean => {
      if (!current) return false
      for (const parentName of [current.pollen, current.seed]) {
        if (!parentName || parentName === 'unknown') continue
        if (parentName === row.name) {
          path.push(parentName)
          return true
        }
        if (visiting.has(parentName)) continue
        const parent = byName.get(parentName)
        if (parent) {
          visiting.add(parentName)
          path.push(parentName)
          if (visit(parent)) return true
          path.pop()
          visiting.delete(parentName)
        }
      }
      return false
    }
    if (visit(row)) {
      errors.push({
        line: row.line,
        message: `循環系譜が検出されました: ${row.line}行目 (経路: ${path.join(' -> ')})`,
      })
    }
  }

  // ルール9: 読み順ソート
  const sortedByYomi = [...rawRows].sort((a, b) =>
    a.yomi < b.yomi ? -1 : a.yomi > b.yomi ? 1 : 0,
  )
  for (const [i, row] of rawRows.entries()) {
    const expected = sortedByYomi[i]
    if (expected.line !== row.line) {
      errors.push({
        line: row.line,
        message: `読み順ソートが不正です: ${row.line}行目 (期待位置: ${expected.line}行目)`,
      })
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const rows: VarietyRow[] = rawRows.map((r) => ({
    displayName: r.displayName,
    yomi: r.yomi,
    color: r.color,
    name: r.name,
    pollen: r.pollen,
    seed: r.seed,
  }))

  return { ok: true, rows }
}

/** PBTのラウンドトリップ検証・テストフィクスチャ生成用のシリアライザ */
export const toMarkdown = (rows: VarietyRow[]): string => {
  const escapeCell = (value: string) => value.replaceAll('|', '\\|')
  const sep = COLUMN_NAMES.map(() => '---').join('|')
  const lines = rows.map((row) =>
    [
      row.displayName,
      row.yomi,
      row.color,
      row.name ?? '',
      row.pollen ?? '',
      row.seed ?? '',
      '',
    ]
      .map(escapeCell)
      .join(' | '),
  )
  return [HEADER, `| ${sep} |`, ...lines.map((l) => `| ${l} |`)].join('\n')
}
