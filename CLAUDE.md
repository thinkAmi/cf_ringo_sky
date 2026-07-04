# CLAUDE.md

Hono + React 製のりんご集計アプリ。Bluesky の投稿からりんご品種を集計し、Cloudflare Workers/Pages + D1 で動作する。

## 構成

- Bun workspaces のモノレポ: `packages/ringo-bsky`（Cronバッチ）, `packages/ringo-db`（D1アクセスWorker）, `packages/ringo-web`（Hono + React / Pages）
- `ringo-web` と `ringo-bsky` は `ringo-db` Worker へのサービスバインディング（`RINGO_DB_WORKER`）に依存し、単独では動かない
- 環境構築・起動・データ投入の詳細手順は README の「環境構築（ローカル）」を参照

## 落とし穴

- `/api/total` / `/api/month` が `[]` を返すのは `feeds` テーブルが空のときの仕様でありバグではない（seed は `apples` / `genealogies` のみ投入）。データ投入手順は README 参照
- wrangler は devDependency のバージョンに固定して `bunx wrangler` で実行する。update を促す警告が出てもアップグレードしないこと。`d1` 系コマンドは `packages/ringo-db` で実行する
- `bun install` はリポジトリルートでのみ実行する（入れ子の `bun.lockb` を作らない）
