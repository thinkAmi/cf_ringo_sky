type Apple = {
  name: string
  color: string
}

export const findColorName = (name: string | null) =>
  appleColors.find((a) => a.name === name)?.color ?? 'red'

const appleSet: Set<Apple> = new Set([
  {
    name: 'あいかの香り',
    color: 'Crimson',
  },
  {
    name: '秋映',
    color: 'DarkRed',
  },
  {
    name: '王林',
    color: 'YellowGreen',
  },
  {
    name: 'きおう',
    color: 'DarkOrange',
  },
  {
    name: 'グラニースミス',
    color: 'Green',
  },
  {
    name: 'ゴールデンデリシャス',
    color: 'DarkOrange',
  },
  {
    name: '紅玉',
    color: 'Maroon',
  },
  {
    name: 'こうたろう',
    color: 'LightSalmon',
  },
  {
    name: 'さんさ',
    color: 'LightSalmon',
  },
  {
    name: 'シナノゴールド',
    color: 'Gold',
  },
  {
    name: 'シナノスイート',
    color: 'LightCoral',
  },
  {
    name: 'シナノドルチェ',
    color: 'AntiqueWhite',
  },
  {
    name: 'シナノピッコロ',
    color: 'LightSalmon',
  },
  {
    name: 'シナノレッド',
    color: 'LightSalmon',
  },
  {
    name: 'ジョナゴールド',
    color: 'LightSalmon',
  },
  {
    name: '新世界',
    color: 'LightSalmon',
  },
  {
    name: '清明',
    color: 'LightSalmon',
  },
  {
    name: '世界一',
    color: 'LightSalmon',
  },
  {
    name: '千秋',
    color: 'LightSalmon',
  },
  {
    name: 'つがる',
    color: 'Brown',
  },
  {
    name: 'トキ',
    color: 'Yellow',
  },
  {
    name: 'ピンクレディ',
    color: 'Pink',
  },
  {
    name: 'フジ',
    color: 'Red',
  },
  {
    name: '北斗',
    color: 'LightSalmon',
  },
  {
    name: '名月',
    color: 'Orange',
  },
  {
    name: '陽光',
    color: 'LightSalmon',
  },
  {
    name: '早生ふじ',
    color: 'LightSalmon',
  },
  {
    name: 'アルプス乙女',
    color: 'LightSalmon',
  },
  {
    name: 'Jazz',
    color: 'Coral',
  },
  {
    name: 'envy',
    color: 'Tomato',
  },
  {
    name: '祝',
    color: 'SpringGreen',
  },
  {
    name: '夏あかり',
    color: 'MistyRose',
  },
  {
    name: '凛夏',
    color: 'LavenderBlush',
  },
  {
    name: 'みよしレッド',
    color: 'Orchid',
  },
  {
    name: 'おいらせ',
    color: 'MediumVioletred',
  },
  {
    name: '北紅',
    color: 'Maroon',
  },
  {
    name: '陸奥',
    color: 'LemonChiffon',
  },
  {
    name: '高徳',
    color: 'AntiueWhite',
  },
  {
    name: 'スリムレッド',
    color: 'SeaShell',
  },
  {
    name: 'インド',
    color: 'AliceBlue',
  },
  {
    name: '国光',
    color: 'FireBrick',
  },
  {
    name: 'ちなつ',
    color: 'Papayawhip',
  },
  {
    name: '恋空',
    color: 'Rosybrown',
  },
  {
    name: 'ラリタン',
    color: 'OldLace',
  },
  {
    name: '夏乙女',
    color: 'CornSilk',
  },
  {
    name: 'ファーストレディ',
    color: 'MistyRose',
  },
  {
    name: 'サマーチャンス',
    color: 'BlanchedAlmond',
  },
  {
    name: 'スカイルビー',
    color: 'Lavender',
  },
  {
    name: 'オータムドレス',
    color: 'DarkMagenta',
  },
  {
    name: '紅しのぶ',
    color: 'MediumVioletred',
  },
  {
    name: 'ブラムリー',
    color: 'Lime',
  },
  {
    name: '鏡の私',
    color: 'Chartreuse',
  },
  {
    name: 'あかぎ',
    color: 'AntiqueWhite',
  },
  {
    name: 'ほのか',
    color: 'LightPink',
  },
  {
    name: 'もりのかがやき',
    color: 'PaleGoldenrod',
  },
  {
    name: '星の金貨',
    color: 'Goldenrod',
  },
  {
    name: 'はるか',
    color: 'LightYellow',
  },
  {
    name: '秋田ゴールド',
    color: 'Goldenrod',
  },
  {
    name: '松本錦',
    color: 'Orchid',
  },
  {
    name: '紅露',
    color: 'FloralWhite',
  },
  {
    name: 'シナノプッチ',
    color: 'OldLace',
  },
  {
    name: 'ひめかみ',
    color: 'IndianRed',
  },
  {
    name: '超さん太',
    color: 'FireBrick',
  },
  {
    name: '紅陽光',
    color: 'FireBrick',
  },
  {
    name: '新生',
    color: 'DarkSalmon',
  },
  {
    name: '秋陽',
    color: 'Crimson',
  },
  {
    name: '昂林',
    color: 'MistyRose',
  },
  {
    name: '蜜っ娘',
    color: 'CornSilk',
  },
  {
    name: 'デリシャス',
    color: 'LightSalmon',
  },
  {
    name: 'スターキング',
    color: 'Crimson',
  },
  {
    name: 'レッドゴールド',
    color: 'Red',
  },
  {
    name: 'さとあかり',
    color: 'LightSalmon',
  },
  {
    name: '大紅栄',
    color: 'FireBrick',
  },
  {
    name: 'ほおずり',
    color: 'Brown',
  },
  {
    name: 'となみ',
    color: 'Brown',
  },
  {
    name: 'しなの姫',
    color: 'Crimson',
  },
  {
    name: '未来ふじ',
    color: 'LightSalmon',
  },
  {
    name: '三島ふじ',
    color: 'LightSalmon',
  },
  {
    name: '美丘',
    color: 'MistyRose',
  },
  {
    name: '未希ライフ',
    color: 'LightSalmon',
  },
  {
    name: '紅ロマン',
    color: 'FireBrick',
  },
  {
    name: 'ジャンボ王林',
    color: 'YellowGreen',
  },
  {
    name: 'シナノプッチ',
    color: 'LightSalmon',
  },
  {
    name: '金星',
    color: 'Palegoldenrod',
  },
  {
    name: 'ハックナイン',
    color: 'LightSalmon',
  },
  {
    name: '信濃あかり',
    color: 'Crimson',
  },
  {
    name: 'シナノホッペ',
    color: 'FireBrick',
  },
  {
    name: '青林',
    color: 'PaleGoldenrod',
  },
  {
    name: 'Rockit',
    color: 'FireBrick',
  },
  {
    name: 'Queen',
    color: 'LightSalmon',
  },
  {
    name: 'ムーンルージュ',
    color: 'Palegoldenrod',
  },
  {
    name: 'さとあかり',
    color: 'LightSalmon',
  },
  {
    name: 'Breeze',
    color: 'Brown',
  },
  {
    name: 'シナノリップ',
    color: 'FireBrick',
  },
  {
    name: 'すわっこ',
    color: 'FireBrick',
  },
  {
    name: '千雪',
    color: 'MediumVioletred',
  },
  {
    name: '真紅',
    color: 'FireBrick',
  },
  {
    name: '炎舞',
    color: 'FireBrick',
  },
  {
    name: '甘い夢',
    color: 'FireBrick',
  },
  {
    name: 'cheekie',
    color: 'MediumVioletred',
  },
  {
    name: '奥州ロマン',
    color: 'FireBrick',
  },
  {
    name: '秋茜',
    color: 'FireBrick',
  },
  {
    name: 'おぜの紅',
    color: 'FireBrick',
  },
  {
    name: '華宝',
    color: 'FireBrick',
  },
  {
    name: 'キュート',
    color: 'Palegoldenrod',
  },
  {
    name: '紅の夢',
    color: 'FireBrick',
  },
  {
    name: 'Prince',
    color: 'Brown',
  },
  {
    name: 'ニュージョナゴールド',
    color: 'LightSalmon',
  },
  {
    name: 'ローズパール',
    color: 'Pink',
  },
  {
    name: 'ベル・ド・ボスクープ',
    color: 'OliveDrab',
  },
  {
    name: 'エグレモント・ラセット',
    color: 'Tan',
  },
  {
    name: 'ブレンハイム・オレンジ',
    color: 'DarkSeaGreen',
  },
  {
    name: 'サマーランド',
    color: 'LightCoral',
  },
  {
    name: 'ルビースイート',
    color: 'Pink',
  },
  {
    name: 'モーレンズジョナゴレッド',
    color: 'FireBrick',
  },
  {
    name: '黄香',
    color: 'Goldenrod',
  },
  {
    name: '紅将軍',
    color: 'FireBrick',
  },
  {
    name: '大夢',
    color: 'FireBrick',
  },
  {
    name: 'あまみつき',
    color: 'Goldenrod',
  },
  {
    name: '明秋',
    color: 'FireBrick',
  },
  {
    name: '彩香',
    color: 'FireBrick',
  },
  {
    name: 'しおりルビー',
    color: 'FireBrick',
  },
  {
    name: '紅いわて',
    color: 'FireBrick',
  },
  {
    name: 'きたろう',
    color: 'Goldenrod',
  },
  {
    name: '遠山三系',
    color: 'FireBrick',
  },
])

export const appleColors = [...appleSet]
