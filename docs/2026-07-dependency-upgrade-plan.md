# 依存削減 + バージョンアップ計画(2026-07)

> ステータス: 完了(PR #7 マージ済み、2026-07-05)

対象ブランチ: `feature/update_2026_07`(計画確定日: 2026-07-04)

## 背景と方針

- 各ライブラリのバージョンが約2年分古くなっており、メジャーアップデートが多数溜まっている
- サプライチェーン攻撃への懸念から、バージョンアップと同時に依存パッケージ自体を削減する
- 「**先に撤去、後で更新**」の順で進める。撤去対象(MUI・react-query)を先に処理することで、MUI 6→9 の2世代分 codemod 移行を丸ごと回避し、更新対象も減らす
- 挙動の変更(撤去)とバージョンの変更(更新)を別ステップに分け、問題発生時の切り分けを容易にする

## 進め方の原則

- 作業は `feature/update_2026_07` 上で継続し、**1ステップ = 1コミット**(Step 0 と Step 4 のような大きい作業は少数の論理コミットに分割可)。最後に1本の PR でマージ
- **各コミットは機械ゲート通過が条件**: typecheck → biome check → build → API スナップショット diff。これにより `git bisect` とステップ単位の revert が常に機能する
- 各ステップの bun.lock 差分は、そのステップのコミットに含める
- GitHub Actions(CI)は今回のスコープ外(別 issue で検討)
- 自動ブラウザ検証・スクリーンショット保存は行わない。フロント専用ステップ(3・4・9)のみ手動で3画面クリックスルー
- ringo-bsky はローカルに `.dev.vars` を置かない(ローカル実行検証はしない)

## 現状サマリ(計画時点)

| ライブラリ | 現在 | 最新 (2026-07) | 対応 |
|---|---|---|---|
| Bun (mise固定) | 1.1.13 | 1.3.14 | 更新(lockfile もテキスト化) |
| wrangler | 3.83 | 4.107 | 更新 |
| @cloudflare/workers-types | 4.x | 5.x | **撤去**(`wrangler types` 生成へ) |
| Biome | 1.8.1 | 2.5.2 | 更新(oxlint/oxfmt は不採用) |
| drizzle-orm / drizzle-kit | 0.31 / 0.22 | 0.45 / 0.31 | 更新 |
| @atproto/api | 0.12.23 | 0.20.25 | 更新(継続利用) |
| Vite | 5.2 | 8.1 | 更新(v8 で Rolldown 化) |
| @hono/vite-cloudflare-pages | 0.4.1 | 非推奨 | `@hono/vite-build` へ乗り換え |
| React / react-dom | 18.3 | 19.2 | 更新 |
| MUI Material / X DataGrid / emotion | 6.1 / 7.19 / 11.13 | 9.2 / 9.8 / 11.14 | **撤去**(素の HTML + CSS 化) |
| @tanstack/react-query | 5.45 | 5.101 | **撤去**(Router loader に統合) |
| TanStack Router | 1.38 | 1.170 | 更新(パッケージ名変更対応) |
| @tanstack/router-cli / router-devtools | - | - | **撤去**(未使用) |
| concurrently | 8.2 | 10.0 | **撤去**(シェル / bun --filter で代替) |
| TanStack Query 以外の hono / chart.js 等 | - | - | マイナー更新のみ |
| TypeScript | ^5.0 | 6.0.3 | `^5` 系最新に留める(6 は見送り) |

横断的な制約: Vite 8 は Node 20.19+、wrangler 4.107 / @atproto/api 0.20 は Node 22+。@atproto/api 0.20 は ESM 専用。React 19 はどのライブラリからも強制されない。

## ステップ詳細

### Step 0: 検証基盤の整備

- 各パッケージに `"typecheck": "tsc --noEmit"` を追加、root から一括実行できるようにする
- **verify.sh + ゴールデンスナップショット**: ローカル D1 に seed 投入 + `wrangler d1 execute` で feeds にテスト行を投入(seed は apples/genealogies のみで feeds が空だと `/api/total` 等が `[]` を返すため)→ 4エンドポイント(`/api/total` `/api/month` `/api/genealogies` `/api/genealogies/:名前`)を curl → jq 正規化 → baseline 保存。以降の全ステップで diff ゼロを合格条件とする
- ringo-bsky の純粋関数(`matchName` / `filterRingoFeeds` / `filterNewFeeds` / `latestCreatedAt`)を bun 内蔵テストランナーで単体テスト化(依存追加なし)。Step 7 をローカル実行しない分の安全網

### Step 1: 基盤(Bun)

- mise.toml を `bun = "1.3.14"` へ(Node 22 系が使えることも確認)
- `bun.lockb` → テキスト形式 `bun.lock` に移行、`bun install --frozen-lockfile` が通ることを確認
- bunfig.toml に `install.minimumReleaseAge` を設定(公開直後のバージョンを避けるサプライチェーン緩和策)

### Step 2: 依存削減①「消すだけ」系

- `@tanstack/router-cli`(完全未使用)、`@tanstack/router-devtools`(`__root.tsx` の lazy import ごと削除)
- `packages/ringo-web/src/client/routes/genealogies/-hooks/useGenealogyApi.ts`(どこからも import されていないデッドコード)
- `concurrently` → root dev script をシェル `&` + `wait` か `bun run --filter` に変更

### Step 3: 依存削減② react-query 撤去 【フロント専用 → クリックスルー対象】

- 4ルートを「loader が直接 fetch → `Route.useLoaderData()`」に書き換え、`-api/*.ts` は素の fetch 関数に簡素化(hono/client `hc` の型共有は維持)
- `QueryClientProvider` / router context の queryClient を削除、`createRootRoute` に簡素化
- ルーターに `defaultStaleTime`(5分程度)と `errorComponent` を設定(失敗時に undefined で静かに壊れる現挙動をエラー表示に改善)
- 成立根拠: 全クエリがルートと1:1、読み取り専用、Router に loader キャッシュ内蔵。将来 mutation が必要になったら fetch + `useActionState` + `router.invalidate()` で対応し、楽観的更新等が必要になった時点で react-query を再導入する
- 追加確認: 3画面のナビゲーション往復・ブラウザバック・直接 URL アクセス、ringo-db を止めて errorComponent 表示

### Step 4: 依存削減③ MUI 一式撤去 【最大 diff・必ず単独コミット・クリックスルー対象】

- 撤去対象5パッケージ: `@mui/material` `@mui/icons-material` `@mui/x-data-grid` `@emotion/react` `@emotion/styled`
- DataGrid(系譜一覧、ソート・フィルタ未使用)→ 素の `<table>` + 行クリック
- Drawer メニュー → `<dialog>` 要素 + CSS transition(背景クリック・Esc・フォーカス管理はブラウザ標準に委譲)
- Card / Typography / IconButton → div + CSS、☰ はインライン SVG
- 見た目の変化は API diff ではなく**目視で受け入れ判断**(メニュー開閉・行クリック遷移・モバイル幅を機能チェックリストとして確認)

### Step 5: ツールチェーン(wrangler 4 + wrangler types + Biome 2)

- wrangler `^4.107.0` に統一(root / ringo-web の二重定義解消)。v3→v4 の破壊的変更は小(コマンドのローカルモードデフォルト化など)。`wrangler pages dev` は v4 でも健在
- `@cloudflare/workers-types` を削除し `wrangler types` 生成へ(3パッケージ)。バインディング実設定から型が生成されるため `RINGO_DB_WORKER` まわりの `@ts-ignore` 解消も期待
- Biome 1.9 経由で 2.5.2 へ、`biome migrate --write`。**`rules.all: true` 廃止**に伴うルールドメイン再構成 + 新規 lint 指摘の修正(このステップの主工数)
- compatibility_date(2024-06-18)の更新もここで検証

### Step 6: ringo-db(drizzle 更新)

- drizzle-orm `^0.45.2` + drizzle-kit `^0.31.10`(確認済みの正規ペア)。D1/sqlite 用途では破壊的変更は実質なし
- `drizzle-kit up` でスナップショット形式更新、スキーマ第3引数を配列形式へ追従
- 固有チェック: 更新後に `drizzle-kit generate` を実行して**新規マイグレーションが生成されないこと**(スキーマ解釈が変わっていない証拠)+ API diff ゼロ

### Step 7: ringo-bsky(@atproto/api 更新)【ローカル実行検証なし】

- `^0.20.25` へ。`BskyAgent` → `AtpAgent` に置き換え(`login` / `getAuthorFeed` はそのまま使える)
- `@atproto/api/dist/client/...` の深い型 import は 0.20 の ESM 専用化で壊れる可能性が高いため公開型へ置き換え
- 検証: typecheck + `wrangler deploy --dry-run` + Step 0 の単体テストのみ。`.dev.vars` は置かない
- デプロイ後に `wrangler tail` で次回 cron の成功を確認。`LAST_SEARCH_KV` のカーソルは処理成功時のみ前進する設計のため、失敗しても取り込み遅延のみでデータ損失なし。問題時は `wrangler rollback`

### Step 8: ringo-web ビルド基盤(Vite 8 ほか)【計画中最大の技術リスク】

- Vite `^8.1.3`(Rolldown 化。`build.rollupOptions` → `rolldownOptions` へ改名推奨)
- `@hono/vite-cloudflare-pages`(非推奨)→ `@hono/vite-build@^1.11` の cloudflare-pages アダプタへ乗り換え
- `@hono/vite-dev-server` 0.26 へ(Vite 8 対応の公式明言なし → 動作検証を厚めに)
- TanStack Router `^1.170` + `@tanstack/router-vite-plugin` → `@tanstack/router-plugin/vite` へ改名対応。`routeTree.gen.ts` は再生成、`tsr.config.json` の内容は vite プラグインオプションへ移動
- hono / chart.js / react-chartjs-2 のマイナー更新
- 固有チェック: `dist/` 構成 diff(`_worker.js` / `_routes.json` / `static/client.js`)+ `wrangler pages dev dist` で本番相当確認

### Step 9: React 19 【フロント専用 → クリックスルー対象】

- react / react-dom / @types/react / @types/react-dom を 19.2 系へ、`types-react-codemod preset-19` 適用、package.json の peerDependencies を `^19` 対応に
- MUI 撤去済みのため影響範囲は純粋な React API のみ(createRoot + 新 JSX 変換は使用済み、削除された旧 API への依存なし)
- StrictMode のままコンソールエラー・警告ゼロを確認

## 検証の全体設計

| 層 | 手段 | 適用範囲 |
|---|---|---|
| 1. 型 | `tsc --noEmit`(全パッケージ) | 全ステップ |
| 2. lint | `biome check .` | 全ステップ |
| 3. ビルド | ringo-web: `build:fe` + `build:be` / Workers: `wrangler deploy --dry-run` | 全ステップ |
| 4. 実行時 | verify.sh(4 API のゴールデンスナップショット diff) | 全ステップ |
| 5. 目視 | dev サーバーで3画面クリックスルー | Step 3・4・9 のみ |

注意: API diff はバックエンド経路のみを検証する。フロント専用ステップ(3・4・9)では API diff が「画面が壊れていても合格」を出すため、層5の目視を必須とする。

## 不採用・先送り事項

| 項目 | 判断 | 理由 |
|---|---|---|
| oxlint / oxfmt への乗り換え | 不採用 | 小規模リポジトリで速度メリットなし、oxfmt がベータ、Biome→oxc の公式移行パスなし。oxfmt 1.0 到達時に再評価 |
| @atproto/api の fetch 直叩き化 | 不採用 | 公式クライアントのメンテナンスを受ける方を優先 |
| drizzle の生SQL化 | 不採用 | 系譜の3世代自己 JOIN クエリを手書き SQL で保守するのは型安全喪失の痛みが大きい |
| chart.js の置き換え | 不採用 | SVG 手書き代替は工数・保守・アクセシビリティで割に合わない |
| TypeScript 6.0 | 見送り | `^5` 系最新に留める。TS 7(Go 実装)を見据えて後日 |
| GitHub Actions(CI) | 別 issue | typecheck + biome + build の軽い workflow を想定 |
| Cloudflare Pages → Workers 移行 | 将来課題 | Pages は機能凍結状態だが廃止はされていない |
| drizzle 1.0 | 将来課題 | RC 段階のため |

## 期待される最終状態

- 直接依存 約33 → 約23(**10個削減**)。UI 系の巨大な推移依存ツリー(MUI/emotion)が消滅
- 残る依存はすべて 2026-07 時点の最新安定版
- 検証基盤(typecheck / verify.sh / 単体テスト)が整備され、今後の更新作業でも再利用可能
