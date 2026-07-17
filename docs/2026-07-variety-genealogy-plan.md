# 既存品種の系譜登録計画(2026-07)

> ステータス: 計画確定(2026-07-15)。調査完了・実装未着手。登録42件 / 見送り(基本品種)13件 / 先送り38件 / 出典なし19件。
>
> 実装フェーズ完了時に、実装セッションはこのステータス行を更新すること(例: 「PR 1 マージ済み(日付)」)。更新自体も通常のコミット承認プロトコルに従う。

設計判断の記録: [ADR-0001](adr/0001-genealogy-in-markdown.md)(系譜は markdown が source of truth) / [ADR-0003](adr/0003-variety-master-format.md)(品種マスタの形式・lint) / [ADR-0007](adr/0007-bud-sport-inherits-origin-parents.md)(枝変わりは元品種の親を引き継ぐ)、用語集: リポジトリルートの `CONTEXT.md`。本計画はこれらの決定を実行に落としたもの。**実装中に設計判断を変えたくなった場合は、勝手に変えず ADR の更新をユーザーに提案すること。**

## 背景と方針

- 現在 `packages/ringo-db/data/varieties.md` で系譜(花粉親・種子親)を持つのは 17 品種のみ。「系譜図を表示可能なりんご一覧」に出る品種を増やすため、既存品種の系譜を**信頼できる出典付きで**登録する
- **信憑性を最優先する。** 出典が実在する品種だけを登録し、見つからない品種は現状維持(未登録のまま)とする。架空の系譜・出典のでっち上げは厳禁(register-apple-variety スキルの既存境界)
- **今回のスコープ(不変条件): 既存行の `name`・`花粉親`・`種子親`・`出典` セルを埋めるだけ。新規の品種行(祖先品種)は一切追加しない。** 親が品種マスタに未登録の品種は「次ステップ(祖先追加)」として送り、今回は登録しない(下記「先送り」参照)
- 変えないもの: パーサ・バリデータ(`packages/ringo-db/src/varietyMaster.ts`)とそのテスト、色定義・読み(既存行の色・読みは変更しない)、サービスバインディングのメソッド・返却 JSON の形、`feeds` テーブルと集計系 API

## 進め方の原則

- 本計画は grill-with-docs の設計対話で全方針を確定し、全既存品種の調査結果を下記「確定した調査結果テーブル」に転記済み。**実装セッションは Web 調査をやり直さず、テーブルの通りに varieties.md を編集するだけ**(データ変換は機械的作業。判断はこの計画段階で完了している)
- **登録は原則 1 PR にまとめる**(diff レビューは一覧で済む見込み)。ただし本計画完成時点で出典の質に大きなばらつきが判明した場合はユーザーと分割を再検討する
- 各コミットは機械ゲート通過状態であること。コミットの粒度は「関連する系譜のまとまり」で分割してよい(例: 王林系・シナノ系など)。1 PR 内の複数論理コミットは許容
- **実行は run-plan-step スキル、コミット承認前の独立監査は audit-plan-step スキルを使う**
- **実行モデルの目安**: 本 PR は機械ゲート(lint = bun test)と本計画テーブルという二重の照合があり、実装は「テーブル通りにセルを埋める」機械的作業。よって **Sonnet 級で可**。ただし系譜の親名 → snake_case name への変換ミスは lint(参照整合)が捕まえるが、母父の取り違え(花粉親/種子親の入れ替え)は lint を通ってしまうため、実装セッションはテーブルの pollen/seed 列を機械的に転記し、独自判断で入れ替えないこと

## ブランチ戦略

```
main ──── feature/variety_genealogy(この計画・調査結果の登録を行う機能ブランチ)
              └→ main へ PR → 人間がレビュー・マージ → Workers Builds が自動デプロイ
```

- **実装セッションは main から `feature/variety_genealogy` ブランチを新規作成して作業を始める**。子ブランチは作らず、コミットはこのブランチに直接積む
- 本計画ファイル・ADR-0007・CONTEXT.md の更新は、この機能ブランチの最初のコミットに含めて main に入れる(既に作業ツリー上に存在する場合はそれをコミットする)
- main に他の変更が入った場合はこのブランチへ随時 merge して追従する(コンフリクト解消は AI、コミットは承認後)

## 役割分担(実装セッション向け・厳守)

| 作業 | 担当 |
|---|---|
| varieties.md の編集・機械ゲート実行(`bun test`, `verify.sh`)・完了報告 | AI(実装セッション) |
| ローカルコミット | **ユーザーが完了報告と diff を確認・承認した後にのみ** AI が実行(register-apple-variety / run-plan-step と同じ「編集 → 機械ゲート → 完了報告 → ユーザー確認 → コミット」プロトコル) |
| push・PR 作成・PR マージ | 人間 |
| 本番デプロイ | 人間(main マージ後に Workers Builds が自動実行) |

- AI は承認なしにコミットしない。**本番に作用する操作**(push / PR 作成・マージ / `wrangler deploy`(`--dry-run` なし))は指示されても実行せず、人間の作業であることを案内する
- **ローカル・ドライランは AI の担当**: `bun test`、`verify.sh`(--update 含む)、dev サーバー起動は機械ゲートの一部として AI が実行する
- 機械検証できないデータ(系譜の母父の別・出典の妥当性)の人間レビューは、コミット承認時の完了報告・diff 確認の場で行う

## 品種マスタの仕様(確定済み・ADR-0003 から転記)

パス: `packages/ringo-db/data/varieties.md`。GFM テーブル、1品種 = 1行。列は7つ:

```
| 表示名 | 読み | 色 | name | 花粉親 | 種子親 | 出典 |
```

系譜登録に関わるルール(lint = `bun test` が強制。詳細は varietyMaster.ts が正):

- **系譜を登録する行は `name`(snake_case, `^[a-z][a-z0-9_]*$`)・`花粉親`・`種子親` の3セルを埋める。** name は全行で一意
- **花粉親 = 父(花粉提供側)、種子親 = 母(種子/果実を実らせた側)。** セルには「他の行の `name`」または `unknown` のみ書ける(参照整合ルール)
- **基本品種(交配元をたどれない品種)の親は空セルではなく `unknown` を明示する**
- 系譜を持たない(今回登録しない)行は name・花粉親・種子親を空のまま(3セルとも空 or 3セルとも埋める。中間状態は lint が弾く)
- **循環系譜は禁止**(自分が自分の祖先に現れてはいけない)
- 行の並びは読み(ひらがな+長音)の五十音順。**今回は既存行のセルを埋めるだけで行の挿入・移動はないため、並び順は自動的に保たれる**
- 出典セルは自由記述。Web は markdown リンク `[タイトル](URL)`、書籍は書名等のテキスト。セル内の半角 `|` は `\|` にエスケープ、複数出典は ` / ` 区切り(慣例)

### 枝変わり品種の扱い(ADR-0007 から転記)

枝変わり(芽条変異)品種は、**元品種と同じ花粉親・種子親**を設定する(元品種が基本品種なら unknown/unknown を引き継ぐ)。「◯◯の枝変わり」という由来自体は系譜には載らないので、**出典セルに由来コメントを添える**(例: `[出典](URL) / ふじの枝変わり`)。下記テーブルの「枝変わり元」列がこの扱いの対象を示す。

## 出典の採否基準(確定済み)

優先順位順に探し、最初に見つかった信頼できる **1件**を採用する:

1. 公的DB・機関(農水省 品種登録データベース、都道府県の農業試験場・果樹研究所の公式サイト)
2. 学術文献・専門書(品種図鑑、論文)
3. 育成者・生産者の公式発表(JA・育成機関・育成者本人サイト)
4. 二次解説記事。**「青い森の片隅から」(https://malus.sakura.ne.jp/)は書籍化実績のある信頼できる二次情報として採用可。** その他の二次記事は複数の独立情報源で一致する場合のみ

- Wikipedia 単独・出典不明の園芸まとめサイト単独は根拠にしない → その品種は「出典なし」として今回は登録しない

## 確定した調査結果テーブル

> このセクションは grill/write-plan 段階の Web 調査結果。実装セッションはこの表の通りに varieties.md を編集する(再調査不要)。分類の意味:
> - **登録**: 今回 varieties.md に系譜を書き込む(両親が既存マスタ内 name か unknown で表現できる品種)
> - **先送り**: 親が品種マスタに未登録のため、祖先追加を伴う次ステップに送る(今回は編集しない)
> - **出典なし**: 信頼できる出典が見つからず今回は登録しない(現状維持)

**サマリ（既存で系譜未登録の全112品種を調査）**: 登録 **42件** / 見送り(基本品種) **13件** / 先送り(祖先未登録) **38件** / 出典なし **19件**。

方針判断（grill 後の確認で確定）:
- **基本品種(花粉親・種子親とも unknown)は登録しない。** ただし他の登録品種の親として参照される基本品種は例外的に登録する（今回は `スターキング` の1件のみ。`おいらせ` の種子親として必要）
- **カタカナ「インド」はスキップ**（既存の基本品種「印度」(indo)と同一品種の可能性が高く、重複を避ける）
- 出典が単一の小売/種苗業者ページのみ、かつ別説と矛盾する `明秋`・`鏡の私` は出典基準を満たさないため「出典なし」に落とす

### 登録（今回 varieties.md の既存行に name・花粉親・種子親・出典を書き込む・42件）

花粉親=父、種子親=母。親の値は他行の name または `unknown`。備考は機械検証できない事項で、**コミット承認時に人間が確認する**。

| 表示名 | name | 花粉親 | 種子親 | 出典 | 備考(コミット時に人間確認) |
|---|---|---|---|---|---|
| あいかの香り | aikanokaori | unknown | fuji | [あいかの香り 旬の果物百科](https://foodslink.jp/syokuzaihyakka/syun/fruit/apple-Aikanokaori.htm) |  |
| あかぎ | akagi | kougyoku | golden_delicious | [あかぎ りんご大学](https://www.ringodaigaku.com/main/hinshu/a/akagi.html) |  |
| 秋茜 | akiakane | fuji | golden_delicious | [秋茜 旬の果物百科](https://foodslink.jp/syokuzaihyakka/syun/fruit/apple-Akiakane.htm) / 清明の枝変わり | 母父の別は出典に明記なし(記載順); 清明の枝変わり |
| 秋田ゴールド | akita_gold | fuji | golden_delicious | [アキタゴールド りんご大学](https://www.ringodaigaku.com/main/hinshu/a/akitagold.html) |  |
| 秋映 | akibae | tsugaru | senshu | [秋映 旬の果物百科](https://foodslink.jp/syokuzaihyakka/syun/fruit/akibae.htm) |  |
| おいらせ | oirase | tsugaru | starking | [makotononikki おいらせ](https://makotononikki.com/ringo-oirase) | 出典が個人ブログ(家系図系)。可能なら公的出典で裏取り |
| 王林 | ourin | indo | golden_delicious | [王林 りんご大学](https://www.ringodaigaku.com/main/hinshu/o/ourin.html) |  |
| 大夢 | oyume | golden_delicious | fuji | [いわてアグリベンチャーネット 大夢](https://www.pref.iwate.jp/agri/nouken/kouhou/labo/archive/2013-2/13085_apple_oyume.html) | 母父の別は出典に明記なし(記載順) |
| 華宝 | kahou | unknown | shinano_sweet | [華宝 りんご大学](https://www.ringodaigaku.com/main/hinshu/ka/kahou.html) |  |
| きおう | kiou | senshu | ourin | [きおう りんご大学](https://www.ringodaigaku.com/main/hinshu/ki/kiou.html) |  |
| キュート | cute | tsugaru | senshu | [キュート りんご大学](https://www.ringodaigaku.com/main/hinshu/ki/cute.html) |  |
| 金星 | kinsei | kokkou | golden_delicious | [りんごの家系図 makotononikki](https://makotononikki.com/apple-kakeizu) | 出典が個人ブログ。DNA解析で花粉親=国光に疑義あり。要裏取り |
| 紅の夢 | kurenainoyume | unknown | kougyoku | [紅の夢 弘前大学公式](https://nature.hirosaki-u.ac.jp/kurenainoyume/history.html) |  |
| 高徳 | koutoku | unknown | toukou | [高徳 旬の果物百科](https://foodslink.jp/syokuzaihyakka/syun/fruit/apple-Koutoku.htm) |  |
| 昂林 | kourin | delicious | kokkou | [昂林 りんご大学](https://www.ringodaigaku.com/main/hinshu/ko/kourin.html) / フジの枝変わり | フジの枝変わり |
| 秋陽 | shuuyou | senshu | youkou | [りんごの家系図 makotononikki](https://makotononikki.com/apple-kakeizu) | 出典が個人ブログ(JA全農・山形県資料と一致)。可能なら公的出典に差替 |
| 新世界 | shinsekai | akagi | fuji | [新世界 りんご大学](https://www.ringodaigaku.com/main/hinshu/si/sinsekai.html) |  |
| ジャンボ王林 | jumbo_ourin | indo | golden_delicious | [王林(リンゴ) Wikipedia](https://ja.wikipedia.org/wiki/%E7%8E%8B%E6%9E%97_(%E3%83%AA%E3%83%B3%E3%82%B4)) | 出典がWikipedia(果物ナビ・foodslinkが同内容で裏付け)。可能なら二次出典に差替 |
| ジョナゴールド | jonagold | kougyoku | golden_delicious | [ジョナゴールド 旬の果物百科](https://foodslink.jp/syokuzaihyakka/syun/fruit/jyonagold.htm) |  |
| スターキング | starking | unknown | unknown | [スターキング・デリシャス 果物ナビ](https://www.kudamononavi.com/zukan/apple/starking) / デリシャスの枝変わり | 基本品種だが `おいらせ` の親として登録。デリシャスの枝変わり |
| スリムレッド | slim_red | akagi | fuji | [スリムレッド 青い森の片隅から](https://malus.sakura.ne.jp/appls/slimred/slimred.htm) |  |
| すわっこ | suwakko | unknown | sekaiichi | [品種登録DB すわっこ(14316)](https://www.hinshu2.maff.go.jp/vips/cmm/apCMM112.aspx?TOUROKU_NO=14316&LANGUAGE=Japanese) |  |
| 清明 | seimei | fuji | golden_delicious | [清明 りんご大学](https://www.ringodaigaku.com/main/hinshu/se/seimei.html) |  |
| 世界一 | sekaiichi | golden_delicious | delicious | [世界一 果物ナビ](https://www.kudamononavi.com/zukan/apple/sekaiichi) |  |
| 大紅栄 | daikouei | unknown | miki_life | [大紅栄 りんご大学](https://www.ringodaigaku.com/main/hinshu/ta/daikouei.html) |  |
| ニュージョナゴールド | new_jonagold | kougyoku | golden_delicious | [りんご大学 ニュージョナゴールド](https://www.ringodaigaku.com/main/hinshu/ni/newjyonagold.html) / ジョナゴールドの枝変わり | ジョナゴールドの枝変わり |
| ハックナイン | hac9 | tsugaru | fuji | [りんご大学 ハックナイン](https://www.ringodaigaku.com/main/hinshu/ha/hakkunain.html) | SSR鑑定で花粉親未確定の注記あり |
| はるか | haruka | unknown | golden_delicious | [りんご大学 はるか](https://www.ringodaigaku.com/main/hinshu/ha/haruka.html) |  |
| ひめかみ | himekami | kougyoku | fuji | [育成品種紹介 ひめかみ 農研機構](https://www.naro.go.jp/laboratory/nifts/kih/apple_cat/post_8.html) |  |
| 紅将軍 | benishougun | delicious | kokkou | [紅将軍 旬の果物百科](https://foodslink.jp/syokuzaihyakka/syun/fruit/apple-Benisyogun.htm) / やたかの枝変わり | やたか(=早生ふじ=ふじ枝変わり)の枝変わり |
| ほおずり | hoozuri | kougyoku | fuji | [ほおずり 福島県果樹研究所(PDF)](https://www.pref.fukushima.lg.jp/uploaded/attachment/55259.pdf) | 花粉親はDNA解析で紅玉と判明 |
| 北斗 | hokuto | unknown | fuji | [北斗 旬の果物百科](https://foodslink.jp/syokuzaihyakka/syun/fruit/Hokuto.htm) | 登録時は花粉親=陸奥だがDNAで否定・不明に |
| ほのか | honoka | delicious | kokkou | [ほのか(早生ふじ) 旬の果物百科](https://foodslink.jp/syokuzaihyakka/syun/fruit/apple-Honoka.htm) / 弘前ふじの枝変わり | 弘前ふじ(ふじ枝変わり)の枝変わり |
| 美丘 | mioka | unknown | fuji | [青森りんご大図鑑](https://www.aomori-ringo.or.jp/starcut/variety.html) | 花粉親は王林と世界一の混合花粉で単一特定不可→unknown |
| 未希ライフ | miki_life | tsugaru | senshu | [未希ライフ 旬の果物百科](https://foodslink.jp/syokuzaihyakka/syun/fruit/apple-Mikilife.htm) |  |
| 三島ふじ | mishima_fuji | delicious | kokkou | [みしまふじ りんご大学](https://www.ringodaigaku.com/main/hinshu/mi/mishimahuji.html) / ふじの枝変わり | ふじの枝変わり |
| 未来ふじ | mirai_fuji | delicious | kokkou | [ふじ(枝変わり) りんご大学](https://www.ringodaigaku.com/main/hinshu/hu/huji_eda.html) / ふじの枝変わり | ふじの枝変わり |
| 陸奥 | mutsu | indo | golden_delicious | [陸奥 青い森の片隅から](https://malus.sakura.ne.jp/appls/mutu/mutu.htm) |  |
| 名月 | meigetsu | fuji | akagi | [名月(ぐんま名月) りんご大学](https://www.ringodaigaku.com/main/hinshu/ku/gunmameigetu.html) | 正式名ぐんま名月。種子親あかぎは今回同時登録 |
| モーレンズジョナゴレッド | morrens_jonagored | kougyoku | golden_delicious | [モーレンズジョナゴレッド 果物ナビ](https://www.kudamononavi.com/zukan/apple/morrens) / ジョナゴールドの枝変わり | ジョナゴールドの枝変わり |
| 陽光 | youkou | unknown | golden_delicious | [陽光 りんご大学](https://www.ringodaigaku.com/main/hinshu/yo/youkou.html) |  |
| 早生ふじ | wase_fuji | delicious | kokkou | [ふじ(枝変わり) りんご大学](https://www.ringodaigaku.com/main/hinshu/hu/huji_eda.html) / ふじの枝変わり | ふじの枝変わり(早生ふじの総称)。母父はふじと同一 |

**この表への実装上の注意（run-plan-step 向け）**:
- `おいらせ` の種子親 `starking`、`名月` の種子親 `akagi`、`きおう` の種子親 `ourin`、`新世界`/`スリムレッド` の花粉親 `akagi`、`秋陽` の種子親 `youkou`、`すわっこ` の種子親 `sekaiichi`、`大紅栄` の種子親 `miki_life` は、いずれも**同じ PR 内で登録する他品種の name** を参照している。ファイル内の記述順は問わない（パーサは全 name を先に集めてから参照整合を検査する）が、これらの name の綴りが表と一致していないと lint(参照整合)で落ちる
- 枝変わり品種（備考に「◯◯の枝変わり」とある8件）は、花粉親・種子親を**元品種と同じ値**にしてある（ADR-0007）。出典セル末尾に ` / ◯◯の枝変わり` を必ず付ける

### 見送り: 基本品種(unknown/unknown)・13件（今回は編集しない）

出典で「偶発実生・交配親不明」と確認できたが、方針により登録しない。将来 basic 品種も載せる決定をしたら再検討する。

| 表示名 | 参考出典 | 見送り理由 |
|---|---|---|
| アルプス乙女 | [出典](https://www.kudamononavi.com/zukan/apple/alpsotome) | 方針: 基本品種は登録しない |
| Ambrosia | [出典](https://en.wikipedia.org/wiki/Ambrosia_(apple)) | 方針: 基本品種は登録しない(出典もWikipedia単独) |
| 祝 | [出典](https://www.ringodaigaku.com/main/hinshu/i/iwai.html) | 方針: 基本品種は登録しない |
| インド | — | ユーザー判断: 印度(indo)と同一品種の可能性が高く重複回避でスキップ |
| エグレモント・ラセット | [出典](https://en.wikipedia.org/wiki/Egremont_Russet) | 方針: 基本品種は登録しない(出典もWikipedia単独) |
| グラニースミス | [出典](https://www.ringodaigaku.com/main/hinshu/ku/granny-smith.html) | 方針: 基本品種は登録しない |
| 夏乙女 | [出典](https://www.kudamononavi.com/zukan/apple/natsuotome) | 方針: 基本品種は登録しない |
| ブラムリー | [出典](https://foodslink.jp/syokuzaihyakka/syun/fruit/apple-Bramley.htm) | 方針: 基本品種は登録しない |
| Breeze | [出典](https://www.breezeapples.com/) | 方針: 基本品種は登録しない |
| ブレンハイム・オレンジ | [出典](https://www.orangepippin.com/varieties/apples/blenheim-orange) | 方針: 基本品種は登録しない |
| Prince | [出典](https://foodslink.jp/syokuzaihyakka/syun/fruit/apple-Prince.htm) | 方針: 基本品種は登録しない |
| ベル・ド・ボスクープ | [出典](https://www.orangepippin.com/varieties/apples/belle-de-boskoop) | 方針: 基本品種は登録しない |
| ラリタン | [出典](https://www.ringodaigaku.com/main/hinshu/ra/raritan.html) | 方針: 基本品種は登録しない |

### 先送り: 親がマスタ未登録・38件（次ステップで祖先追加を相談）

系譜は判明したが、直接の親が品種マスタに未収録のため今回は登録しない。「未登録の祖先」列が空の行は、親が別の先送り品種（主に `さんさ`）に連鎖依存している。

| 表示名 | 花粉親(調査値) | 種子親(調査値) | 未登録の祖先(次ステップで要追加) | 確信度 |
|---|---|---|---|---|
| envy | ブレイバーン | ロイヤルガラ | ブレイバーン, ロイヤルガラ | medium |
| 炎舞 | フジ | いろどり | いろどり | high |
| 黄香 | プリシラ | つがる | プリシラ | high |
| おぜの紅 | unknown | 盛岡47号 | 盛岡47号 | high |
| オータムドレス | フジ | 来里夢 | 来里夢 | low |
| 北紅 | つがる | リチャードデリシャス | リチャードデリシャス | high |
| きたろう | はつあき | フジ | はつあき | high |
| Queen | スプレンダー | ガラ | スプレンダー, ガラ | low |
| 恋空 | 夏緑 | 67-45 | 夏緑, 67-45 | medium |
| こうたろう | はつあき | ふじ | はつあき | high |
| KORU | Braeburn | フジ | Braeburn | medium |
| 彩香 | 王林 | あかね | あかね | high |
| さんさ | あかね | ガラ | あかね, ガラ | high |
| シナノピッコロ | あかね | ゴールデンデリシャス | あかね | high |
| シナノプッチ | さんさ | つがる | (さんさに連鎖) | high |
| シナノホッペ | ふじ | あかね | あかね | high |
| 真紅 | ふじ | いろどり | いろどり | low |
| Jazz | ロイヤルガラ | ブレイバーン | ロイヤルガラ, ブレイバーン | low |
| 青林 | ふじ | レッドゴールド | レッドゴールド | medium |
| ちなつ | アーリー・ブレイズ | あかね | アーリー・ブレイズ, あかね | medium |
| 千雪 | マヘ7 | 金星 | マヘ7 | medium |
| cheekie | スプレンダー | グラニースミス | スプレンダー, グラニースミス | medium |
| トキ | 紅月 | 王林 | 紅月 | high |
| となみ | unknown | マヘ7 | マヘ7 | medium |
| 夏あかり | 陽光 | さんさ | (さんさに連鎖) | high |
| ピンクレディ | レディウィリアムス | ゴールデンデリシャス | レディウィリアムス | high |
| ファーストレディ | つがる | さんさ | (さんさに連鎖) | high |
| 紅いわて | プリシラ | つがる | プリシラ | medium |
| 紅ロマン | さんさ | シナノレッド | (さんさに連鎖) | medium |
| 星の金貨 | 青り3号 | ふじ | 青り3号 | high |
| 松本錦 | ネロ26 | つがる | ネロ26 | high |
| みよしレッド | unknown | さんさ | (さんさに連鎖) | medium |
| ムーンルージュ | ふじ | いろどり | いろどり | medium |
| もりのかがやき | ガラ | つがる | ガラ | high |
| ルビースイート | fuji | JP114069 | JP114069 | high |
| レッドゴールド | リチャードデリシャス | golden_delicious | リチャードデリシャス | high |
| Rockit | GS-2184 | ロイヤルガラ | GS-2184, ロイヤルガラ | medium |
| ローズパール | ピンクパール | fuji | ピンクパール | high |

**次ステップで追加候補になる未登録祖先（先送り品種数の多い順）**: あかね(5), ロイヤルガラ(3), いろどり(3), ガラ(3), ブレイバーン(2), プリシラ(2), リチャードデリシャス(2), はつあき(2), スプレンダー(2), マヘ7(2), 盛岡47号, 来里夢, 夏緑, 67-45, Braeburn, レッドゴールド, アーリー・ブレイズ, 紅月, レディウィリアムス, 青り3号, ネロ26, JP114069, GS-2184, ピンクパール。`さんさ`(=ガラ×あかね) を追加すると連鎖で5品種が登録可能になる。

### 出典なし・19件（現状維持・今回は編集しない）

| 表示名 | 理由 |
|---|---|
| 甘い夢 | 信頼できる系譜出典なし |
| あまみつき | 情報源が矛盾(枝変わり説とゴールデン×デリシャス説)、裏付け不可 |
| 遠山三系 | 信頼できる出典なし |
| 鏡の私 | 出典が単一の種苗業者ページのみ・公的DB裏付けなし(弱出典) |
| 紅露 | 信頼できる出典なし |
| さとあかり | 系譜を記す信頼できる出典なし |
| サマーチャンス | 信頼できる出典なし |
| サマーランド | 信頼できる出典なし |
| しおりルビー | 信頼できる出典なし |
| 信濃あかり | 長野県公式一覧に該当なし・AI要約は誤混同 |
| しなの姫 | 長野県公式一覧に該当なし |
| 新生 | 信頼できる出典なし |
| スカイルビー | 信頼できる出典なし |
| 超さん太 | りんご品種としての実在を確認できる出典なし |
| 紅しのぶ | 信頼できる出典なし |
| 紅陽光 | 信頼できる出典なし(東光×ふじ説は未確認) |
| 蜜っ娘 | サンふじの販売ブランド名で独立品種でない |
| 明秋 | 出典が単一の小売ページのみ・別説(東光×ふじ)と矛盾(弱出典) |
| 凛夏 | **りんごではなくニホンナシの品種の疑いが濃厚**（農研機構が梨として育成）。行の削除は今回スコープ外のため要別途相談 |

## 検証の全体設計

| ゲート | コマンド | 検証内容 | 担当 |
|---|---|---|---|
| lint(構造・参照整合・循環・ソート) | `bun test` | varieties.md がパーサ規則を満たすか。母父の別は検証できない | AI |
| API スナップショット | `./verify/verify.sh` | 登録が API 出力に正しく反映されるか(下記) | AI |
| 母父の別・出典の妥当性 | (人間の目視) | 花粉親/種子親の取り違えがないか、出典が系譜を裏付けるか | 人間(承認時) |

- **`verify.sh` の baseline は今回の登録で必ず変わる。** 現在 `/api/genealogies` は 17 エントリ。登録した品種数だけエントリが増える(`verify/baseline/genealogies.json`)。また祖先に既存系譜品種を持つ場合は `/api/genealogies/tsugaru` 等の個別系譜も変わりうる
- 差分が**今回の登録内容と一致すること**を `git diff verify/baseline/` で確認したうえで `./verify/verify.sh --update` で baseline を再生成し、**同じ PR のコミットに含める**(次に verify.sh を回すセッションが謎の差分に遭遇しないように)
- 登録と**無関係の差分**が出た場合は、更新せず報告して止まる

## 不採用・先送り事項

- **祖先品種(品種マスタ未収録)の新規行追加は今回やらない。** 系譜を正確に表現する台帳にするため祖先追加自体は将来行う方針(grill Q2 で選択肢A採用)だが、今回は「既存行を埋めるだけ」に区切る。親が未登録の品種は下記テーブルで「先送り」に分類し、次ステップでユーザーと相談して進める
- **親を無理に unknown で埋めることはしない。** 本当は親が分かっているのにマスタ未収録という理由で unknown にすると「系譜を正確に表現する台帳」の方針に反するため。この場合は「先送り」にする
- **枝変わりを第3の関係列として持たせる拡張はしない**(ADR-0007。元品種の親を引き継ぐ + 出典コメントで対応)
- **祖先専用品種に特別な色を割り当てる案は不採用**(grill Q3。今回は祖先を追加しないので該当なし。将来追加時も通常の named color を選ぶ)

### 調査で判明した別課題（今回のスコープ外・要フォロー）

系譜登録とは別に、調査中に見つかったデータ整合の疑義。**行の追加・削除・改名は本計画の対象外**なので、必要ならユーザーと別途相談する:

- **凛夏（りんか）**: りんごではなくニホンナシの品種の疑いが濃厚。品種マスタから削除すべきか要相談
- **インド（カタカナ）**: 既存の基本品種「印度」(indo)と同一品種の可能性が高い重複行。統合・削除すべきか要相談
- **出典が個人ブログ/Wikipedia の登録品種**（`おいらせ`・`秋陽`・`金星`・`ジャンボ王林`）: 系譜自体は他資料と整合するが、より強い出典が見つかれば差し替えたい（ADR-0003 の「より良い根拠が見つかれば差し替えてよい」に沿う）

## 期待される最終状態

- varieties.md の「登録」分類の品種に name・花粉親・種子親・出典が埋まり、`bun test` が緑
- `/api/genealogies` のエントリが 17 + 登録件数 になり、verify baseline が更新済み
- 「出典なし」「先送り」の品種は未登録のまま(現状維持)
- 系譜図 UI「系譜図を表示可能なりんご一覧」に登録品種が現れる

## 末尾の導線

- **この計画の実行は run-plan-step スキル**を使う(「PR 1 を進めて」等で起動)。1品種ずつの単発登録は register-apple-variety スキルの領分だが、本計画は多数の品種を1 PR で扱うため run-plan-step を用いる
- **コミット承認前の独立監査は audit-plan-step スキル**を使う。特に「テーブルの pollen/seed が varieties.md に正しく転記されたか」「baseline 差分が登録内容と一致するか」を機械照合する
