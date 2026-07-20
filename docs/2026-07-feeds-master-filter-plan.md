# feeds 集計の品種マスタ絞り込み計画(2026-07)

> ステータス: 計画確定(2026-07-20)。`feature/feeds_master_filter` にコミット1(docs)・コミット2(feat)を実装済み、全機械ゲート緑(2026-07-20)。push・PR 作成・マージは人間の担当で未実施。
>
> 実装フェーズ完了時に、実装セッションはこのステータス行を更新すること(例: 「PR 1 実装済み・コミット承認待ち(日付)」)。更新自体も通常のコミット承認プロトコルに従う。

設計判断の記録: [ADR-0008](adr/0008-feeds-raw-storage-master-filtered-display.md)(フィードは生のまま保存し、集計時に品種マスタの表示名で絞り込む)、用語集: リポジトリルートの `CONTEXT.md`(「フィード」の定義を本件で更新済み)。本計画はこの決定を実行に落としたもの。**実装中に設計判断を変えたくなった場合は、勝手に変えず ADR の更新をユーザーに提案すること。**

## 背景と方針

- Bluesky で `` [リンゴ]`foo` `` のように投稿すると、マスタ未登録の名前 `foo` がそのまま `/api/total`(円グラフ)・`/api/month`(折れ線グラフ)に表示される。これを防ぐ
- 突き合わせは**読み取り時のみ**。ringo-db の集計 RPC(`calculateTotalByName` / `calculateTotalByNameAndMonth`)が SQL 実行後の TS 層で、品種マスタの**表示名と完全一致**しない行を**黙って除外**する
- **変えないもの(不変条件)**:
  - 書き込み側: `ringo-bsky` の抽出・フィルタ(`packages/ringo-bsky/src/feed.ts`)と `insertFeeds`(`packages/ringo-db/src/index.ts`)は一切変更しない。feeds テーブルにはマスタ未登録名も生のまま入り続ける(ADR 0008 の意図的な設計)
  - `feeds` テーブルのスキーマ・migrations
  - 系譜系 RPC(`findGenealogyByName` / `findGenealogies`)ともともとマスタ駆動なので対象外
  - 色のフォールバック経路(`findColorNameOrUndefined` の undefined、`findColorNamePure` の `'red'`、ringo-web の凡例プラグインの `'red'`)。フィルタ導入で理論上デッドパスになるが**多層防御として現状維持**(整理は将来の独立 refactor)
  - 品種マスタ(`packages/ringo-db/data/varieties.md`)とパーサ(`varietyMaster.ts`)
  - RPC の返却 JSON の形(キー構成)。変わるのは「未登録名の行が消えること」と、下記「全滅時の early return」のみ

## 進め方の原則

- **PR は 1 本、コミットは 2 つ**(コミット1 = docs、コミット2 = feat)。各コミットは機械ゲート通過状態であること
- **red → green の順で進める(厳守)**: 先に verify フィクスチャへマスタ未登録名の行を足して `verify.sh` が**失敗する**ことを確認(現行実装では `foo` がスナップショットに現れる = バグの再現)。その後フィルタを実装して**同じ baseline のまま**成功させる。この順序が「フィクスチャが本当にバグを検出している」ことの証明になる
- **実行は run-plan-step スキル、コミット承認前の独立監査は audit-plan-step スキルを使う**
- **実行モデルの目安**: 機械ゲートが厚く(ユニットテスト + red/green のスナップショット照合)、実装の判断余地は小さい。**Sonnet 級で可**

## ブランチ戦略

```
main ──── feature/feeds_master_filter(この計画の実装ブランチ・新規作成)
              └→ main へ PR → 人間がレビュー・マージ → Workers Builds が ringo-db を自動デプロイ
```

- **実装セッションは main から `feature/feeds_master_filter` を新規作成して作業を始める**。子ブランチは作らない
- **前提**: `feature/variety_genealogy` の PR が main にマージ済みであること(2026-07-20 に PR #27 としてマージ済み)
- 次の3ファイルは計画確定時点で未コミットの作業ツリー上に存在する: `CONTEXT.md`(修正・tracked)、`docs/adr/0008-feeds-raw-storage-master-filtered-display.md`(新規・untracked)、本計画ファイル(新規・untracked)。**未コミットの変更はブランチ作成時にそのまま持ち越されるため、main 上にこれらがある状態なら `git switch -c feature/feeds_master_filter` だけでよい**(実装時の実績: PR #27 マージ後、3ファイルは main の作業ツリーに載っていたため stash は不要だった)
- 万一これらが別ブランチの作業ツリーに取り残されていた場合は `git stash push -u -- <3ファイル>` → main へ移動 → ブランチ作成 → `git stash pop` で運ぶ。CONTEXT.md がコンフリクトしたら「確定仕様の転記」にある新しい「フィード」定義になるよう解消する(それ以外の部分は main 側を維持)
- 万一ファイルが作業ツリーに存在しない場合も、本計画の「確定仕様の転記」に全文があるため再作成できる

## 役割分担(実装セッション向け・厳守)

| 作業 | 担当 |
|---|---|
| コード・フィクスチャ・docs の編集、機械ゲート実行(`bun test` / `bun run typecheck` / `bunx biome check` / `verify.sh`)、完了報告 | AI(実装セッション) |
| ローカルコミット | **ユーザーが完了報告と diff を確認・承認した後にのみ** AI が実行(commit スキルのプロトコルに従う) |
| push・PR 作成・PR マージ | 人間 |
| 本番デプロイ | 人間(main マージ後に Workers Builds が自動実行) |

- AI は承認なしにコミットしない。**本番に作用する操作**(push / PR 作成・マージ / `--dry-run` なしの `wrangler deploy`)は指示されても実行せず、人間の作業であることを案内する
- **ローカル・ドライランは AI の担当**: `bun test`、`verify.sh`(ただし本 PR では `--update` 禁止、後述)、ローカル dev サーバー起動は AI が実行してよい

## 確定仕様の転記

### フィルタの契約(ADR 0008 から転記)

- 対象: `calculateTotalByName` と `calculateTotalByNameAndMonth` の SQL 結果行
- 残す行: `name` が品種マスタの**表示名**(varieties.md の1列目)と**完全一致**する行。正規化(トリム・全半角・かな種の吸収)は行わない
- 落とす行: 上記以外すべて。`name` が `null` の行も落とす。落としたことはどこにも出さない(ログ・別エンドポイント・「その他」束ねはしない)
- 照合に使う集合は既存の `colorMap`(表示名 → 色。系譜の有無を問わず**マスタ全行**が入っている。`packages/ringo-db/src/genealogy.ts` の `buildColorMap`)のキー。色引きと同じキー・同じ一致条件に揃えることで「フィルタは通るのに色が引けない」不整合を構造的に防ぐ
- `unknown` はマスタに表示名としての行が存在しない(親カラム専用の番兵)ため、`unknown` と投稿されても自然に落ちる。特別対応は書かない

### 追加する純関数(genealogy.ts)

`packages/ringo-db/src/genealogy.ts` に追加。既存の `findColorNamePure` と同じ「colorMap を引数で受ける純関数」パターンに従う:

```ts
/** 集計行のうち、name が品種マスタの表示名と完全一致する行だけを残す(ADR 0008) */
export const filterRegisteredRowsPure = <T extends { name: string | null }>(
  colorMap: Map<string, string>,
  rows: T[],
): T[] => rows.filter((r) => r.name !== null && colorMap.has(r.name))
```

あわせて genealogy.ts 冒頭コメントの役割記述を更新する。旧文言「系譜解決・色解決の純関数群」を「系譜解決・色解決・マスタ照合の純関数群」に置換(旧文言の grep が 0 件になること)。

`packages/ringo-db/src/varietyData.ts` にモジュールスコープの colorMap を束縛したラッパーを追加:

```ts
/** 集計 RPC 用。マスタ未登録名の行を除外する(ADR 0008) */
export const filterRegisteredRows = <T extends { name: string | null }>(rows: T[]): T[] =>
  filterRegisteredRowsPure(colorMap, rows)
```

### 適用箇所(index.ts)

`packages/ringo-db/src/index.ts` の2メソッド。SQL・GROUP BY・ORDER BY は変更しない:

1. `calculateTotalByName`: `db.select(...)` の結果を `filterRegisteredRows(...)` に通してから、既存の labels / totals / colorNames 組み立てに渡す
2. `calculateTotalByNameAndMonth`: `db.select(...)` の結果を `filterRegisteredRows(...)` に通してから既存のループに渡す。**さらに、フィルタ後が空配列なら early return する**:

```ts
if (total.length === 0) {
  return JSON.stringify({ labels: MONTH_LABELS, datasets: [] })
}
```

- 月ラベル配列(`'1月'`〜`'12月'`)は現在メソッド末尾にインラインで書かれている。early return と末尾の両方で使うため、モジュールスコープ定数 `MONTH_LABELS` に括り出して両方から参照する(値は変更しない)
- **意図的な挙動変更**: 現行実装は結果 0 行のとき `label` なし・全 0・`'red'` のゴミ dataset を 1 件返す(`total[0]?.name` が undefined のまま最後の push が走るため)。この early return により、feeds が空のときもフィルタで全滅したときも `datasets: []` を返すようになる。これはバグ修正として本 PR に含める(完了報告に明記すること)

### CONTEXT.md「フィード」定義(更新済み・転記)

新文言(この通りになっていること):

```
**フィード**:
Bluesky の `[リンゴ]` タグ付き投稿から抽出した「食べた記録」。保存は品種マスタと独立で、未登録の名前も生のまま残る。ただし集計・表示の対象になるのは、マスタの表示名と完全一致する品種のみ。
_Avoid_: 投稿、ポスト（抽出後のレコードを指す場合）
```

旧文言の削除確認: `grep -c "品種の系譜とは独立した集計用データ" CONTEXT.md` が 0 件であること。

### CLAUDE.md「落とし穴」への追記(コミット1に含める)

「落とし穴」セクションの先頭項目(`/api/total` / `/api/month` が `[]` を返す件)の直後に、次の1項目を追加する:

```
- マスタ未登録の品種名(例: Bluesky で `foo` と投稿)が集計に出ないのは仕様でありバグではない(ADR 0008)。feeds テーブルには生のまま残っており、品種をマスタに登録すれば過去の投稿も遡って集計に現れる
```

### verify フィクスチャへの追加行

`verify/feeds_fixture.sql` の INSERT にマスタ未登録名の行と NULL 名の行を追加する(既存行は変更しない):

```sql
  ('foo',    '[リンゴ]`foo`を食べた',    '2024-06-15 10:00:00', 'verify-foo-1'),
  (NULL,     '[リンゴ]名前なし',          '2024-07-01 10:00:00', 'verify-null-1');
```

※ 既存最終行 `('きおう', ...)` の末尾 `;` をカンマに変えて連結する。ファイル冒頭コメントに「`foo` と NULL はマスタ未登録のためスナップショットに現れないのが正(ADR 0008)」の一文を追記する。

**baseline(`verify/baseline/total.json` / `month.json` / `genealogies.json` / `genealogy_tsugaru.json`)は 1 バイトも変わらないことが合格条件。** フィルタが正しければ、フィクスチャに未登録名を足してもスナップショットは従来と同一になる。

### ユニットテスト(genealogy.test.ts に追加)

`filterRegisteredRowsPure` について、手組みの colorMap(例: `new Map([['秋映', 'DarkRed'], ['王林', 'YellowGreen']])`)で最低限次を検証する:

1. 表示名と完全一致する行は残る(入力順が保存される)
2. 未登録名(`foo`)の行は落ちる
3. `name` が `null` の行は落ちる
4. 完全一致のみ: 前後に空白を含む名前(`' 秋映'`)・別表記(ひらがな `あきばえ`)は落ちる
5. 全行落ちた場合は空配列
6. `name` 以外のフィールド(total 等)がそのまま保たれる

## ステップ詳細

### コミット1: docs(ブランチ作成直後)

- 作業: 上記「ブランチ戦略」の手順でブランチを作り、本計画ファイル・ADR 0008・CONTEXT.md 更新・CLAUDE.md 追記をコミットする
- 合格条件(機械):
  - `docs/2026-07-feeds-master-filter-plan.md` と `docs/adr/0008-feeds-raw-storage-master-filtered-display.md` が存在する
  - `grep -c "品種の系譜とは独立した集計用データ" CONTEXT.md` → 0
  - `grep -c "ADR 0008" CLAUDE.md` → 1 以上
- コミットメッセージ例: `docs: feeds 集計のマスタ絞り込み設計を確定し計画に落とす`(なぜ: マスタ未登録名の投稿がグラフに表示されるのを防ぐ設計を ADR 0008 で確定したため)

### コミット2: feat(red → green)

1. **red(実装前・厳守)**: `verify/feeds_fixture.sql` に上記2行を追加し、`./verify/verify.sh` を実行 → **exit 非 0 で失敗し、差分に `foo` が現れる**ことを確認して完了報告に記録する(現行バグの再現証明)。**このとき `--update` を実行してはならない**(未登録名入りのスナップショットが baseline に焼き付き、以後ゲートが偽の緑になる)
2. **green(実装)**: 「確定仕様の転記」どおりに `genealogy.ts` / `varietyData.ts` / `index.ts` を変更し、ユニットテストを追加する
3. 合格条件(機械・すべて満たすこと):
   - `bun test`(リポジトリルート)が緑。追加した `filterRegisteredRowsPure` のテスト 6 観点を含む
   - `bun run typecheck` が緑
   - `bunx biome check packages/ringo-db` が緑
   - `./verify/verify.sh` が exit 0
   - `git status --short verify/baseline/` が空(baseline 無変更)
4. コミットメッセージ例: `feat(ringo-db): 集計結果を品種マスタの表示名で絞り込む`(なぜ: Bluesky で \`foo\` のようなマスタ未登録名を投稿するとグラフに表示されてしまうため。ADR 0008)

## 検証の全体設計

| ゲート | コマンド | 検証内容 | 担当 |
|---|---|---|---|
| 型 | `bun run typecheck` | ジェネリクス含め型が通るか | AI |
| lint | `bunx biome check packages/ringo-db` | コードスタイル | AI |
| ユニットテスト | `bun test` | フィルタ純関数の6観点 + 既存テストの無退行 | AI |
| API スナップショット | `./verify/verify.sh`(--update 禁止) | 未登録名・NULL 名入りフィクスチャで4エンドポイントの出力が**従来の baseline と完全一致** | AI |
| diff の妥当性 | (人間の目視) | 変更が計画の範囲に収まっているか、early return の挙動変更が許容か | 人間(承認時) |

- verify.sh は ringo-db(:8788)と ringo-web(:5173)を起動するため、ポートが空いていること。検証用 D1 は `--persist-to` で開発用と隔離済み(開発データは壊れない)
- **本 PR で baseline 差分が出たら、それは実装の誤り。baseline を直すのではなく実装を直す**

## 不採用・先送り事項(実装者が「改善」として復活させないこと)

- **書き込み時フィルタ(ringo-bsky / insertFeeds での検証)は不採用**(ADR 0008)。「先に投稿 → 後でマスタ登録」の遡及集計を守るため。feeds のゴミ行は意図的に残す
- **名前の正規化(トリム・全半角・かな吸収)は不採用**。色引きと同じ完全一致に揃える。表記ゆれ投稿は「グラフに出ない」ことで投稿者が気づき投稿側で直す運用
- **未登録名の「その他」束ね・除外ログ・観測用エンドポイントは不採用**。必要になったら D1 に直接クエリして差分を見る
- **色フォールバック(`findColorNameOrUndefined` / `'red'`)の整理は先送り**。本 PR ではフィルタ追加に集中し、整理はフィルタ稼働後の独立 refactor とする
- **feeds のゴミ行削除メンテは先送り**(ユーザー判断で将来実施の可能性あり。本 PR では DELETE を一切発行しない)
- **SQL の `WHERE name IN (...)` 方式は不採用**。マスタは D1 に存在せず、バインドパラメータ組み立ての複雑さに見合う実益がない

## 期待される最終状態

- `feature/feeds_master_filter` ブランチにコミット2つ(docs / feat)が積まれ、全機械ゲートが緑
- `verify/feeds_fixture.sql` に未登録名 `foo` と NULL 名の行が存在するのに、`verify/baseline/` は本 PR 開始時点から無変更
- Bluesky で `` [リンゴ]`foo` `` と投稿しても(= feeds に `foo` 行があっても)、円グラフ・折れ線グラフに `foo` が表示されない
- マスタ未登録名しか feeds にない場合、`/api/month` は `datasets: []` を返す(ゴミ dataset が出ない)
- `CONTEXT.md` の「フィード」定義と `CLAUDE.md` の「落とし穴」が新仕様を反映している

## 末尾の導線

- **この計画の実行は run-plan-step スキル**を使う(「PR 1 を進めて」等で起動)
- **コミット承認前の独立監査は audit-plan-step スキル**を使う。特に「red フェーズの失敗記録が完了報告にあるか」「`git status --short verify/baseline/` が空か」「不採用事項(正規化・書き込み時フィルタ等)が紛れ込んでいないか」を照合する
