---
status: accepted
date: 2026-07-13
---

# テスト専用 CI は GitHub Actions で行う（デプロイは引き続き Workers Builds）

依存更新 PR（Dependabot）の導入にあたり、PR 時点の機械ゲートが ringo-db（Workers Builds の Build command）にしかなく、ringo-web / ringo-bsky の typecheck・test・build はローカル確認頼みだった。頻繁にメンテナンスしないリポジトリであるため、ローカル確認は忘れる前提で設計する必要があり、全パッケージのゲートを GitHub Actions のテスト専用ワークフロー（単一ジョブ `gate`）として追加し、Ruleset `protect-main` の必須チェックにする。

[ADR 0004](0004-workers-builds-auto-deploy.md) は「GitHub Actions ではなく Workers Builds」を選んだが、あの決定の理由は `CLOUDFLARE_API_TOKEN` を GitHub Secrets に置くことの漏洩リスクであり、**デプロイ**に関するものである。テスト専用 CI はシークレットを一切持たず（`wrangler deploy --dry-run` も認証不要）、0004 の脅威モデルに抵触しない。デプロイの担い手は今後も Workers Builds のまま変えない。

## Considered Options

- **(a) ローカル確認のみ（CI なし）** — 攻撃面・運用物は増えないが、「確認を忘れてもマージできてしまう」構造が残る。本リポジトリのメンテナンス頻度では忘却が既定値になるため却下
- **(b) テスト専用 Actions CI（採用）** — checkout / setup-bun（SHA ピン留め）→ `bun install --frozen-lockfile` → typecheck → test → ringo-web build → ringo-bsky / ringo-db `deploy --dry-run` → dependency-review-action。`permissions: contents: read`、シークレットなし、全 PR で無条件実行（path filter を付けると required check が「実行されないまま required」になる罠があるため）
- **(c) (b) + verify.sh（ゴールデンスナップショット E2E）の CI 実行** — dev サーバ 2 本の起動を伴い CI でのフレーク リスクが未知数。フレークすると依存更新 PR がマージしづらくなり定常レーンの目的を損なう。小規模アプリで revert + 再デプロイで復旧可能なため、E2E はローカル専用ツールのままとし却下

## Consequences

- Actions の有効利用開始に伴い、セキュリティ強化調査（docs/2026-07-github-security-hardening.md）で「該当なし」とした項目が該当ありに変わる。次の設定をセットで有効化する: "Require actions to be pinned to a full-length commit SHA"（未ピン参照は実行拒否されるため、ローカル編集でピン留めが漏れても必須チェックが赤になり構造的に止まる）/ fork PR の実行承認 "Require approval for all external contributors" / Workflow permissions デフォルト read-only
- action の SHA 追随は Dependabot（github-actions エコシステム）が担う。タグ → SHA の変換は pinact 等のツールを導入せず、`gh api repos/<owner>/<repo>/commits/<tag> --jq .sha` ワンライナーで決定論的に行う（README に記載）
- Bun のバージョンは `.bun-version` ファイルを単一ソースとし CI が参照する。Workers Builds ダッシュボードの `BUN_VERSION` との同期は従来どおり README の運用メモに従う手動運用
- CodeQL（Default setup）を有効化し、数回の実行で安定を確認したのち Ruleset に "Require code scanning results" を追加する二段階とする。CodeQL の actions 解析により、この CI ワークフロー自体も検査対象になる
