# CLAUDE.md

Hono + React 製のりんご集計アプリ。Bluesky の投稿からりんご品種を集計し、Cloudflare Workers/Pages + D1 で動作する。

## 構成

- Bun workspaces のモノレポ: `packages/ringo-bsky`（Cronバッチ）, `packages/ringo-db`（D1アクセスWorker）, `packages/ringo-web`（Hono + React / Pages）
- `ringo-web` と `ringo-bsky` は `ringo-db` Worker へのサービスバインディング（`RINGO_DB_WORKER`）に依存し、単独では動かない
- 環境構築・起動・データ投入の詳細手順は README の「環境構築（ローカル）」を参照

## 開発フロー

設計が必要な変更（新機能、データ構造・API 契約の変更、移行、複数 PR 規模の作業）は、次のパイプラインで進める。ユーザーがこうした変更を直接依頼してきた場合も、いきなり実装せず、このフローの入口（grill-with-docs）から始めることを提案する:

1. `/grill-with-docs` — 設計対話。決定は docs/adr/ と CONTEXT.md に記録
2. `write-plan` — 確定した設計を docs/YYYY-MM-<topic>-plan.md に落とす
3. `run-plan-step` — 実装セッションが PR 単位で実行（依存更新のみ run-upgrade-step）
4. `audit-plan-step` — コミット承認の前に別セッションで独立監査

小さな修正・バグ修正・単発の変更はこのフローを使わず直接作業してよい。迷ったら 1 を提案する。

## 落とし穴

- `/api/total` / `/api/month` が `[]` を返すのは `feeds` テーブルが空のときの仕様でありバグではない（seed は `apples` / `genealogies` のみ投入）。データ投入手順は README 参照
- wrangler は devDependency のバージョンに固定して `bunx wrangler` で実行する。update を促す警告が出てもアップグレードしないこと。`d1` 系コマンドは `packages/ringo-db` で実行する
- `bun install` はリポジトリルートでのみ実行する（入れ子の `bun.lockb` を作らない）
