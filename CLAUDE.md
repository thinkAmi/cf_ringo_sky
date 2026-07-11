# CLAUDE.md

Hono + React 製のりんご集計アプリ。Bluesky の投稿からりんご品種を集計し、Cloudflare Workers/Pages + D1 で動作する。

## 構成

- Bun workspaces のモノレポ: `packages/ringo-bsky`（Cronバッチ）, `packages/ringo-db`（D1アクセスWorker）, `packages/ringo-web`（Hono + React / Pages）
- `ringo-web` と `ringo-bsky` は `ringo-db` Worker へのサービスバインディング（`RINGO_DB_WORKER`）に依存し、単独では動かない
- りんご品種の系譜・色の source of truth は `packages/ringo-db/data/varieties.md`（品種マスタ）。D1 は `feeds` テーブルのみを持つ。品種の追加・更新は register-apple-variety スキル、または varieties.md 編集 + `bun test`
- `ringo-db` は main へのマージで Workers Builds により自動デプロイされる（`packages/ringo-db/*` 等の変更時のみビルド。設定値は README「デプロイに関する情報」参照）。手動 `bun run deploy` は緊急時のフォールバック
- 環境構築・起動・データ投入の詳細手順は README の「環境構築（ローカル）」を参照

## 開発フロー

設計が必要な変更（新機能、データ構造・API 契約の変更、移行、複数 PR 規模の作業）は、次のパイプラインで進める。ユーザーがこうした変更を直接依頼してきた場合も、いきなり実装せず、このフローの入口（grill-with-docs）から始めることを提案する:

1. `/grill-with-docs` — 設計対話。決定は docs/adr/ と CONTEXT.md に記録
2. `write-plan` — 確定した設計を docs/YYYY-MM-<topic>-plan.md に落とす
3. `run-plan-step` — 実装セッションが PR 単位で実行（依存更新のみ run-upgrade-step）
4. `audit-plan-step` — コミット承認の前に別セッションで独立監査

小さな修正・バグ修正・単発の変更はこのフローを使わず直接作業してよい。迷ったら 1 を提案する。

## コミット規約

Conventional Commits ベース。全コミットが無条件で同一形式（「計画駆動のときだけ」「自明なら省略」のような条件分岐はない）:

```
type(scope): 日本語の要約（50字目安、句点なし）

なぜ: <きっかけ・動機。diff から読み取れないことを書く>

Co-Authored-By: <AI 作者の申告>
```

- type は7つに限定: `feat` / `fix` / `refactor` / `perf` / `test` / `docs` / `chore`。迷ったら「外から見える挙動が増える・変わるか」で判定（変わる→feat/fix、変わらない→refactor）。破壊的変更は `!` を付ける
- scope: `ringo-db` / `ringo-web` / `ringo-bsky` / `skills` / `docs` / `deps`。横断的な変更は省略可
- 「なぜ:」行は必須。理由は発明せず、上流の成果物（計画ステップの目的・完了報告・ユーザーの依頼文）から転記する
- コミットの手順と自己チェックは commit スキルに従う。push・PR 作成は人間の担当

## 落とし穴

- `/api/total` / `/api/month` が `[]` を返すのは `feeds` テーブルが空のときの仕様でありバグではない（系譜・色は品種マスタが持つため D1 への初期データ投入は不要）。データ投入手順は README 参照
- wrangler は devDependency のバージョンに固定して `bunx wrangler` で実行する。update を促す警告が出てもアップグレードしないこと。`d1` 系コマンドは `packages/ringo-db` で実行する
- `bun install` はリポジトリルートでのみ実行する（入れ子の `bun.lockb` を作らない）
