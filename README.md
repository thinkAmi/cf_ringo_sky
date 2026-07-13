# Ringo Sky

以下の機能を持った、Hono + Reactアプリです。

- Blueskyの指定したユーザに対して、`[リンゴ]`で始まるツイートに含まれるリンゴ名を集計し、データベースへと保存
- データベースに保存されている集計情報をJSONの形で返すAPI
- JSON APIの結果をChart.jsでグラフ表示

  
Blueskyの投稿は、先頭に`[リンゴ]`があり、品種名を `` ` ``(バッククォート)で囲んであるものが対象となります。以下がその例です。

```
[リンゴ]今日は `シナノゴールド` を食べた。シャリシャリしていておいしかった。
```

  
また、Cloudflare Pages と Workers へデプロイしてあります。  
https://ringosky.thinkami.dev/

　
# 開発環境

- macOS (以前は WSL2 Ubuntu 22.04.1 LTS)
- Bun 1.3.14 ([mise](https://mise.jdx.dev/) で管理: `mise.toml`)
- wrangler はリポジトリの devDependency を使うため、`bunx wrangler` で実行する（グローバルインストールは不要）


　  
# 環境構築（ローカル）

## 前提ツールの導入

Bun のバージョンは mise で管理しています。

```
mise install
```

　  
## 依存パッケージのインストール

Bun workspaces のモノレポのため、リポジトリルートで1回だけ実行します。各パッケージ内での install は不要です（入れ子の `bun.lockb` を作らないこと）。

```
bun install
```

　  
## Cloudflareへの認証

本番の D1 や KV を操作する場合、およびデプロイする場合に必要です（ローカル開発のみなら不要）。

```
bunx wrangler login
bunx wrangler whoami
```

　  
## ローカルD1の初期化

D1 のバインディングは `packages/ringo-db/wrangler.toml` に定義されているため、必ず `packages/ringo-db` で実行します。リポジトリルートで実行すると `Couldn't find a D1 DB` エラーになります。

```
cd packages/ringo-db
bunx wrangler d1 migrations apply ringodb --local
```

　  
## 起動

リポジトリルートで実行すると、先に `ringo-db` (port 8788) が起動し、その応答を待ってから `ringo-web` (Vite, port 5173) が起動します。

```
bun run dev
```

なお、`ringo-web` は `ringo-db` へのサービスバインディングに依存しているため、単独では動作しません。両者を同時起動すると `ringo-web` のプロキシが `ringo-db` の dev セッション登録より先に接続してしまい binding を張れないため、`bun run dev`（`scripts/dev.sh`）は起動順を制御しています。

　  
## 動作確認URL

| URL | 内容 |
|---|---|
| http://localhost:5173/ | 品種別集計グラフ |
| http://localhost:5173/month | 月別集計グラフ |
| http://localhost:5173/genealogies | りんご系譜図の一覧 |
| http://localhost:5173/api/total | 品種別集計API |
| http://localhost:5173/api/month | 月別集計API |
| http://localhost:5173/api/genealogies | 系譜図一覧API |

系譜・色は品種マスタ（`packages/ringo-db/data/varieties.md`）が source of truth のため、D1 への初期データ投入は不要です。一方、初期状態では `feeds` テーブルが空のため `/api/total` と `/api/month` が `[]` を返し、集計グラフが表示されませんが、これは異常ではありません。グラフを確認するには、次の「feedsデータの投入」を行います。

　  
## 品種の追加

りんご品種の追加・更新は `register-apple-variety` スキル、または `packages/ringo-db/data/varieties.md` を直接編集して `bun test` を通すことで行います。D1 への seed 投入は不要です。本番への反映は main ブランチへのマージで自動デプロイされます（「デプロイに関する情報」参照）。

　  
## feedsデータの投入

いずれかの方法で `feeds` テーブルにデータを投入します。動作確認だけなら方法1が手軽です。

### 方法1: 本番D1からデータを取り込む(推奨)

本番の `feeds` テーブルのデータのみをダンプし、ローカルD1へ流し込みます。

```
cd packages/ringo-db
bunx wrangler d1 export ringodb --remote --table=feeds --no-schema --output=./prod_feeds.sql
bunx wrangler d1 execute ringodb --local --file=./prod_feeds.sql
bunx wrangler d1 execute ringodb --local --command "SELECT count(*) FROM feeds"
```

- `--no-schema` を付けないと `CREATE TABLE` が出力され、ローカルの既存テーブルと衝突します
- export 実行中は本番D1が他のリクエストをブロックするため、アクセスの少ない時間帯に実行します
- 取り込んだ `prod_feeds.sql` は不要になったら削除します

　  
### 方法2: ringo-bsky でBlueskyから取り込む

`ringo-bsky` は Cron で動くバッチ Worker で、以下のシークレットが必要です。

| 変数 | 内容 |
|---|---|
| `IDENTIFIER` | Bluesky のハンドル（ログインと取得対象アカウントの両方に使用） |
| `APP_PASSWORD` | Bluesky のアプリパスワード |

ローカルでは `packages/ringo-bsky/.dev.vars` に設定します（gitignore済み）。本番へは `bunx wrangler secret put` で登録します。

```
IDENTIFIER=your-handle.bsky.social
APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

`ringo-db` と `ringo-bsky` を同時に起動し、スケジュール実行を手動でトリガーします。

```
# ターミナル1
cd packages/ringo-db && bun run dev:db

# ターミナル2
cd packages/ringo-bsky && bun run dev:job

# ターミナル3
curl "http://localhost:8789/__scheduled"
```

取り込みが成功すると、`feeds` テーブルに投稿が追加され、KV (`LAST_SEARCH_KV`) に最終取得時刻が保存されます。2回目以降は前回時刻より新しい投稿のみが取り込み対象になります。


　  
# 検証

型チェック・単体テスト・API のゴールデンスナップショット検証をコマンドで実行できます。いずれもリポジトリルートで実行します。

　  
## 型チェック

全パッケージの `tsc --noEmit` をまとめて実行します。

```
bun run typecheck
```

　  
## 単体テスト

`ringo-bsky` の純粋関数（`matchName` / `filterNewFeeds` / `filterRingoFeeds` / `latestCreatedAt`）を Bun 内蔵のテストランナーで検証します。

```
bun run test
```

　  
## API のゴールデンスナップショット検証

`verify/verify.sh` は、検証用のローカル D1 に seed と決定的な feeds データ（`verify/feeds_fixture.sql`）を投入し、`ringo-db` と `ringo-web` を起動して4つの API（`/api/total` `/api/month` `/api/genealogies` `/api/genealogies/:name`）を取得、`verify/baseline/` のスナップショットと突き合わせます。差分があれば失敗（exit 1）します。

```
bun run verify              # baseline と比較
./verify/verify.sh --update # baseline を再生成
```

- `jq` が必要です。
- 検証用の D1 状態は `--persist-to` で開発用（`.wrangler/state`）と隔離しているため、実行しても開発用の `feeds` データは変更されません。

　  
# 開発フロー

設計が必要な変更（新機能、データ構造・API 契約の変更、移行、複数 PR 規模の作業）は、Claude Code のスキルで構成された次のパイプラインで進めます。設計は高性能モデルとの対話で確定し、実装は計画ファイルを介して別セッション（Sonnet など）に引き継ぐ運用です。

```
/grill-with-docs ──→ write-plan ──→ run-plan-step ⇄ audit-plan-step
   設計対話            計画ファイル化      PR 単位の実装        独立監査
   (docs/adr/ と       (docs/YYYY-MM-     (機械ゲート→報告→    (承認前に別セッションで
    CONTEXT.md に記録)   <topic>-plan.md)    承認→1コミット)      ゲート再実行・照合)
```

- 各スキルの詳細は `.claude/skills/<name>/SKILL.md` を参照
- 依存パッケージの更新は専用の `plan-dependency-upgrade` / `run-upgrade-step` を使う
- 小さな修正・バグ修正・単発の変更はパイプライン不要。迷ったら `/grill-with-docs` から

　  
# ライセンス
MIT

　  
# デプロイに関する情報
## ringo-db ディレクトリ

D1を使っているCloudflare Workers `ringo-db` のデプロイ関連の作業です。

　  
### マイグレーションファイルの生成

```
bun drizzle-kit generate
```

　  
### マイグレーションの適用

ローカルの場合

```
bunx wrangler d1 migrations apply ringodb --local
```

本番環境の場合

```
bunx wrangler d1 migrations apply ringodb --remote
```

　  
### デプロイ

main ブランチへのマージで、Workers Builds により自動デプロイされます。
main 以外のブランチへの push では `wrangler versions upload`（本番昇格なしのバージョンアップロード）が実行されます。
watch paths に一致しない変更（`ringo-web` / `ringo-bsky` のみの変更など）ではビルド自体がスキップされます。

Workers Builds の設定（Cloudflare ダッシュボード > Workers & Pages > ringo-db > Settings > Build）:

| 項目 | 設定値 |
|---|---|
| 本番ブランチ | `main` |
| Root directory | （空 = リポジトリルート） |
| Build command | `bun install && cd packages/ringo-db && bun run test && bun run typecheck` |
| Deploy command | `cd packages/ringo-db && bun run deploy` |
| Non-production branch deploy command | `cd packages/ringo-db && bunx wrangler versions upload` |
| Build watch paths (include) | `packages/ringo-db/*`, `package.json`, `bun.lock` |
| Build variables | `BUN_VERSION=1.3.14` |

Build command が `bun test`（varieties.md のバリデーション含む）と `typecheck` を通すため、これらに失敗する変更は本番へデプロイされません。

運用メモ:

- 手元の Bun をアップグレードしたら、ダッシュボードの `BUN_VERSION` と上の表も追随して更新します
- main へのマージが本番反映に直結するため、GitHub Ruleset `protect-main`（PR 必須・force push 禁止）で main への直 push を禁止しています。緊急時は GitHub の Settings > Rules > Rulesets で Enforcement を一時的に Disabled にできます
- 採用の経緯（GitHub Actions 方式との比較）は `docs/adr/0004-workers-builds-auto-deploy.md` を参照

緊急時など、手動でデプロイする場合（フォールバック）:

```
bun run deploy
```

　  
### CI（GitHub Actions）

- CI はテスト専用（シークレットなし）で、全 PR と main push で実行されます。デプロイは従来どおり Workers Builds です（[ADR 0005](docs/adr/0005-test-ci-on-github-actions.md)）
- ワークフローが使う action は full-length SHA でピン留めします。タグ → SHA の変換ワンライナー: `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`（例: `gh api repos/actions/checkout/commits/v4 --jq .sha`）。追随は Dependabot が行います
- Bun のバージョンは `.bun-version` が単一ソースです。更新時は Workers Builds ダッシュボードの `BUN_VERSION` とこの README の表も追随させます
- ringo-web / ringo-bsky はマージ後の即時デプロイ義務はありません。目安として四半期に一度程度はデプロイして差分を小さく保ちます

　  
## ringo-web ディレクトリ

Cloudflare Pages `ringo-web` のデプロイ関連の作業です。

### デプロイの種類

デプロイするときのブランチにより、デプロイの種類が異なります。

- main
  - 本番環境向け
- main 以外
  - Preview環境向け 

　  
### デプロイ

フロントエンド・バックエンドそれぞれをビルドしてから、デプロイします。

#### フロントエンドのビルド

```
bun run build:fe
```

　  
#### バックエンドのビルド

```
bun run build:be
```

　  
#### デプロイ

```
bun run deploy
```

　  

# ブログ記事

- [Cloudflare Pages・Workers + Hono + React + Chart.js で食べたリンゴの割合をグラフ化してみた - メモ的な思考的な](https://thinkami.hatenablog.com/entry/2024/07/09/235549)
- [Cloudflare Pages + TanStack Router + TanStack Query + CSS Grid Layout で、りんごの系譜図を作ってみた - メモ的な思考的な](https://thinkami.hatenablog.com/entry/2024/10/27/170944)

　
# 過去に作った似たようなもの

- Python版
    - [thinkAmi/dj_ringo_tabetter: [リンゴ]付きでつぶやいたツイートを集計する。](https://github.com/thinkAmi/dj_ringo_tabetter)
- Ruby版
    - [thinkAmi/ringo-tabetter · GitHub](https://github.com/thinkAmi/ringo-tabetter)
- C#版
    - [thinkAmi/RingoTabetter · GitHub](https://github.com/thinkAmi/RingoTabetter)
    - [thinkAmi/RingoTabetterApi · GitHub](https://github.com/thinkAmi/RingoTabetterApi)