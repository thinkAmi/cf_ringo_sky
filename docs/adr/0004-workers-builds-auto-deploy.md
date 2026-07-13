---
status: accepted
date: 2026-07-11
---

# ringo-db は main マージ時に Workers Builds で自動デプロイする

品種マスタ（varieties.md）が ringo-db Worker にバンドルされる構成（ADR 0001）になった結果、品種の追加・更新を本番に出す唯一の手段が Worker のデプロイになった。従来の手動デプロイ（人間が main を pull して `bun run deploy`）はマージと本番反映が乖離し、実行忘れや手元環境への依存が残るため、main へのマージで自動デプロイする。CI 基盤には GitHub Actions ではなく、Cloudflare ネイティブの Workers Builds（GitHub App による Git 連携）を採用する。

## Considered Options

- **(a) 手動デプロイを継続する** — 仕組みの追加コストはゼロだが、マージ済み・未デプロイという中間状態が常態化し、品種登録フローの最終段が人間の記憶に依存する
- **(b) GitHub Actions + wrangler-action** — デプロイ前の品質ゲートを最も柔軟に組めるが、`CLOUDFLARE_API_TOKEN` を GitHub Secrets に保存する必要がある。このトークンは漏洩するとアカウント内の全 Worker（ringo-db / ringo-web / ringo-bsky）を書き換えられ、悪意あるコードのデプロイを通じて D1 の feeds データや Worker secrets（Bluesky 認証情報）へ間接到達できる。トークンの最小権限化・TTL・ローテーション・Environment 保護といった緩和策の運用負担が個人リポジトリには重い
- **(c) Workers Builds（採用）** — 認証の向きが逆（Cloudflare 側の GitHub App がリポジトリを read）のため、GitHub 側に Cloudflare のトークンが一切存在せず、(b) の漏洩リスクが構造的に発生しない。GitHub App の権限はこのリポジトリのみに限定できる。Build watch paths で ringo-db 関連の変更時のみビルドでき、モノレポでも不要なデプロイが走らない

## Consequences

- main へのマージが本番反映に直結するため、GitHub Ruleset `protect-main`（PR 必須・force push 禁止・Enforcement: Active）で main への直 push を禁止した。緊急時は Ruleset を一時的に Disabled にすれば直 push できる
- Build command の `bun test`（varieties.md バリデーション含む）と `typecheck` がデプロイ前の機械ゲートになり、通らない変更は本番に出ない。ビルドが失敗しても本番 Worker は直前の状態のまま残る
- main 以外のブランチへの push は `wrangler versions upload`（本番昇格なし）になる
- ビルド設定は Cloudflare ダッシュボードにのみ存在しコード管理できないため、設定値を README「デプロイに関する情報」に記録し、ダッシュボードを変更したら README も追随させる
- 手動 `bun run deploy` は緊急時のフォールバックとして残る
