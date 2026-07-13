---
name: run-upgrade-step
description: >-
  依存更新計画(docs/YYYY-MM-dependency-upgrade-plan.md)の1ステップを、
  機械ゲート→完了報告→ユーザー確認→1コミットのプロトコルで実行する。
  「step N を進めて」「計画の次のステップに着手」等で発動する。
  計画の立案は plan-dependency-upgrade の領分。計画外の単発の依存更新は対象外。
---

# run-upgrade-step

計画 doc の1ステップを実行し、ゲート通過を確認してから1コミットにまとめる。
**ユーザーの確認前にコミットしない。**

**定常レーンとの境界（ADR 0006）**: minor/patch の定期更新は Dependabot の週次 PR が担うため、このスキルの対象外。このスキルが扱うのは major 更新・依存の撤去/再導入・方針変更を伴う更新。Dependabot が作った major の個別 PR はマージせず、このスキルの計画の入力として使う（計画完了時に当該 PR は自動クローズされる）。

## 1. 着手前（3つの確認）

1. **計画 doc の該当ステップと運用取り決めを読む**
   （コミット担当・目視担当・ゲート判定方式は計画 doc の Phase 0 記録に従う）
2. **採用版の鮮度を再確認**: `npm view <pkg> time` で経過日数を取り直す。
   計画時と実行時で minimumReleaseAge の判定は変わる（実例: wrangler 4.107 が実行時にブロック）。
   ブロックされたら勝手に決めず AskUserQuestion で3択を提示する:
   直近適格版 / excludes 例外（計画 doc に例外記録を書く） / 解禁まで待つ
3. **対象ファイルの現状を読む**。新 API へ乗り換える場合は、ドキュメントではなく
   **node_modules の型定義・package.json exports で実物確認**してから書き換える
   （実例: @hono/vite-build の exports、dev-server の adapter 移行、tanstackRouter の
   オプション名はすべて型定義から特定して手戻りゼロだった）

## 2. 実装

- 計画に書かれた作業のみ行う。**計画外の変更が必要になったら、黙って進めず報告して承認を得る**
- `bun install` 後に確認: 撤去系なら lockfile から参照が消えたか（`grep <pkg> bun.lock`）、
  `bun install --frozen-lockfile` が通るか

## 3. 機械ゲート（順に実行、素のコマンドで）

```bash
bun run typecheck        # 全パッケージ
bunx biome check .       # 判定は計画 doc の方式（変更ファイルのみ等）に従う
bun run test
(cd packages/ringo-web && bun run build:fe && bun run build:be)
bun run verify           # API ゴールデンスナップショット diff ゼロ
# Workers を触ったステップのみ:
(cd packages/<worker> && bunx wrangler deploy --dry-run)
```

- **exit code をパイプで潰さない**。`cmd | head` は exit code を隠す。
  `cmd >/tmp/out 2>&1; echo $?` の形で正確に取る
- **回避策を焼き込まない原則**: ゲートが想定外の挙動（ハング等）をしたら、回避手順を
  このスキルに追記するのではなく、原因を特定してコード修正 or CLAUDE.md「落とし穴」へ。
  スキルは常に現時点の挙動を前提とする

## 4. ゲートが落ちたとき

- まず**新規エラーか既存エラーかを切り分ける**（既存レッドは触るステップまで放置してよい）
- 破壊的変更の典型パターン（調査の当たりをつける分類。網羅ではない）:
  - CLI フラグ・オプションの削除/改名（例: wrangler 4 の --batch-size、dev-server の plugins→adapter）
  - 型の厳格化（例: hono hc の .json() が any→{}）→ 型共有境界で明示キャスト
  - 深い内部パス import の破壊（例: dist/client/... の ESM 化）→ 公開型へ置換
  - 非推奨化の予告 → tsc が通っても型定義の @deprecated を確認して先回り
- 回避で済ませた場合は**根治候補として計画 doc の先送り表に記録**する

## 5. 破壊的操作の安全規律

- 開発用ローカル状態（D1 の .wrangler/state 等）に触れる検証は**必ず隔離**（--persist-to）。
  共有状態への DELETE/上書きは事前にユーザー確認（実例: 隔離忘れで開発用 feeds を消した事故あり）
- コミット前に生成物の混入チェック:
  `git status --porcelain | grep -iE "dist/|\.wrangler|worker-configuration|timestamp"`

## 6. 完了報告（コミット前・定型フォーマット）

1. **変更内容表**（対象 / Before → After）
2. **ゲート結果表**（5層それぞれの結果）
3. **計画からの逸脱・判断事項**（あれば理由つきで）
4. **踏んだ問題**（既知/未知、回避したなら根治候補と明記）
5. フロント挙動変更ステップなら**目視チェックリスト**を提示:
   3画面表示 / メニュー開閉 / 往復ナビ / ブラウザバック / 直接URL /
   行クリック遷移 / errorComponent（依存サーバ停止時） / モバイル幅 / コンソール警告ゼロ

**→ ユーザーの確認を待つ。確認前にコミットしない。**

## 7. コミット

- 確認後、**ゲートを直前に再実行**してから（報告後に状態が動いている可能性がある）
- 1ステップ = 1コミット・日本語・本文に「何を / なぜ / どう検証したか」
- 完了後、次ステップの概要を提示して終了

## このスキルに書かないもの（境界）

- リポジトリの事実（コマンド定義は package.json、罠は CLAUDE.md、起動順は scripts/dev.sh が持つ）
- 特定バージョン番号・特定バグへの回避手順（腐る知識）
- 計画立案の手順（plan-dependency-upgrade の領分）
