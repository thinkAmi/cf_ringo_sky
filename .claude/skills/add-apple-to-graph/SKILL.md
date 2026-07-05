---
name: add-apple-to-graph
description: >-
  新しいりんご品種を Ringo Sky のグラフに（正しい色付きで）表示できるようにする。
  packages/ringo-db/src/appleColors.ts に色定義を追加するコード編集のみを行う。
  「新しい品種をグラフに出したい」「りんごを追加してグラフに反映」「品種を追加」等で発動する。
  品種マスタ・親子関係(genealogies)の DB 登録は対象外（別スキル register-apple-variety）。
---

# add-apple-to-graph

新しいりんご品種を Ringo Sky のグラフに表示できるようにするスキル。実体は
`packages/ringo-db/src/appleColors.ts` への色定義の追加（コード編集）のみ。

## スコープ

**やること**
- `packages/ringo-db/src/appleColors.ts` の `appleSet` に品種の色定義を追加する

**やらないこと（実行しない）**
- 品種マスタ / 系統(genealogies) の DB 登録 → 別スキル `register-apple-variety`
- seed 投入・コミット・PR 作成・マージ・pull・デプロイ → **すべて人間が行う**
  （手順はチェックリストとして案内するが、このスキルでは実行しない）

## 前提となるドメイン知識

このアプリの「投稿 → 集計 → グラフ」の流れを踏まえて編集すること。

- **グラフは `feeds.name` をグループ化するだけ**で、`apples` / `genealogies` を JOIN しない
  （`packages/ringo-db/src/index.ts` の `calculateTotalByName` / `calculateTotalByNameAndMonth`）。
  → 品種マスタを登録しなくても、**色定義の追加だけでグラフに反映される**。
- **取り込みは投稿フォーマットだけで決まる。** `[リンゴ]` で始まりバッククォートで囲まれた
  文字列がある投稿を、`matchName()` がバッククォート内文字列**そのまま** `feeds.name` に保存する
  （`packages/ringo-bsky/src/index.ts`）。マスタ・色定義には依存しない。
- **`name` は投稿表記と完全一致が必須。** `appleColors` の `name` は「投稿でバッククォートに
  書く文字列（＝ display_name）」と**厳密一致**したときだけ色が付く。全角/半角・スペース・
  大文字小文字のゆれで色が付かなくなるので、ここを必ず確認する。
- **未登録時の挙動**：円グラフ(/api/total)は色未指定、月別グラフ(/api/month)は `red` に
  フォールバックする（`appleColors.ts` の `findColorName`）。
- **編集位置**：`appleSet`（Set）の末尾、閉じ `])` の直前に要素を追記する。
  ファイル末尾で `export const appleColors = [...appleSet]` としているため、追記だけで反映される。
- **反映対象は `ringo-db` のデプロイのみ**。色は Worker 側で API レスポンスに付与している。
  `ringo-web` の再デプロイ、マイグレーション、seed 投入はいずれも不要。

## 手順

1. **入力を確認する**
   - 品種名（`display_name` ＝ 投稿でバッククォートに書く**正確な表記**）
   - 色（具体的な CSS カラー名、または「赤系」などの系統指定）

2. **色を決める**
   - 具体名の指定があればそれを使う。
   - 「赤系」等の系統指定なら、既存の使用色を確認して被って見分けづらくならない色を選ぶ：
     ```
     grep -oE "color: '[^']+'" packages/ringo-db/src/appleColors.ts | sort | uniq -c
     ```
   - CSS カラー名（`Crimson`, `IndianRed`, `FireBrick` 等）またはカラーコードを使う。

3. **`appleColors.ts` に追記する**
   - `appleSet` の閉じ `])` の直前に、品種ごとに次の形で追加する：
     ```typescript
       {
         name: '<display_name>',
         color: '<色>',
       },
     ```

4. **表記ゆれをセルフチェックする**
   - `name` が「投稿で使う想定の表記」と完全一致しているか確認する。
     ゆれがあれば色が付かないため、ユーザーに表記を確認する。

5. **型チェックで検証する**
   ```
   cd packages/ringo-db && bun run typecheck
   ```

6. **人間向けチェックリストを出力する**（実行はしない）

   グラフ表示だけなので DB 操作（seed 投入）は不要。反映はデプロイのみ：
   ```
   □ 変更をコミット → PR 作成 → main へマージ
   □ git switch main && git pull
   □ cd packages/ringo-db && bun run deploy   （ringo-db のみ）
   □ Bluesky に [リンゴ] `<品種名>` 形式で投稿 → 取り込み後にグラフで色を確認
   ```
