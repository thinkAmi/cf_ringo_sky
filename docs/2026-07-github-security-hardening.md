# GitHub リポジトリのセキュリティ強化(2026-07)

> ステータス: 調査・決定 完了(2026-07-13)。実行は `docs/reference/github-repo-security-checklist.md` に基づき人間が GitHub Settings で行う

参照した記事:

- [Cloudflare Pages・Workers リポジトリのセキュリティ強化 - thinkami](https://thinkami.hatenablog.com/entry/2026/02/22/183653)
- [リポジトリを保護するためのクイック スタート - GitHub Docs](https://docs.github.com/ja/code-security/getting-started/quickstart-for-securing-your-repository)
- [GitHub OSS セキュリティ強化 - shibayu36](https://blog.shibayu36.org/entry/2026/02/16/173000)
- [GitHub サプライチェーン攻撃防止 - lufia](https://blog.lufia.org/entry/2025/10/12/172307)

## スコープ

このリポジトリは public、GitHub Actions はテスト専用 CI のみ使用・デプロイには不使用（[ADR 0005](adr/0005-test-ci-on-github-actions.md)。デプロイは Cloudflare Workers Builds、[ADR 0004](adr/0004-workers-builds-auto-deploy.md) 参照）。タグ・リリース運用なし（`git tag` 0件）。

今回は **GitHub リポジトリ設定（Settings 画面でのスイッチ ON が中心）のみ**を対象とし、アプリケーションコードの変更を伴うもの（公開 API の入力バリデーション・認証・CORS、コミット署名の強化）は対象外とした。理由: 前者は低コスト・低リスクで即座に効果があり、後者は設計判断を要するため別セッションで扱う方が適切。

## 調査結果: 対応済み

| 項目 | 状態 | 根拠 |
|---|---|---|
| main ブランチ保護 | GitHub Ruleset `protect-main`(PR必須・force push禁止・削除禁止, Enforcement: Active) | [README.md](../README.md) デプロイに関する情報, [ADR 0004](adr/0004-workers-builds-auto-deploy.md) |
| Dependabot alerts | 有効(`gh api repos/thinkAmi/cf_ringo_sky/vulnerability-alerts` → 204) | GitHub API 確認済み |
| デプロイトークン漏洩リスクの構造的排除 | **デプロイには** GitHub Actions を使わず Workers Builds を採用（テスト専用 CI は Actions だがシークレットを持たない）。`CLOUDFLARE_API_TOKEN` を GitHub Secrets に置く必要自体がない | [ADR 0004](adr/0004-workers-builds-auto-deploy.md) |
| サプライチェーン攻撃緩和(cooldown 相当) | `bunfig.toml` の `minimumReleaseAge = 259200`(3日) | `bunfig.toml` |
| シークレット管理 | `.dev.vars` は各パッケージの `.gitignore` で除外。本番は `wrangler secret put` | `packages/*/.gitignore`, README.md |
| SQL インジェクション対策 | D1 アクセスは全て Drizzle ORM のプレースホルダ化クエリ。系譜計算は D1 CTE から TS 内木探索へ移行済み | `packages/ringo-db/src/index.ts` |
| 書き込み API の非公開化 | `insertFeeds` は HTTP 非公開、WorkerEntrypoint(RPC) 経由のみ | `packages/ringo-db/src/index.ts` |

## 調査結果: 未対応だった項目とこのセッションでの決定

GitHub API で実測(2026-07-13時点、`gh api repos/thinkAmi/cf_ringo_sky --jq '.security_and_analysis'` 等):

| 項目 | 調査時点の状態 | 決定 |
|---|---|---|
| Dependabot version updates | `.github/dependabot.yml` 不在 | **導入する**。`package-ecosystem: bun`、`directory: /`、`schedule.interval: weekly`、cooldown default-days: 3 で揃える。理由: weekly は実行頻度の選択。クールダウンは cooldown オプションで設定し `minimumReleaseAge` 3日と整合させる（interval はクールダウンの代替にはならない）。bun エコシステムは Version Updates が GA 済み([GitHub Changelog](https://github.blog/changelog/2025-02-13-dependabot-version-updates-now-support-the-bun-package-manager-ga/))だが、Security Updates は本記事執筆時点で bun 未対応の可能性がある(下記) |
| Dependabot security updates | 無効(`dependabot_security_updates.status: disabled`) | **有効化する**(人間が実行)。bun の自動修正 PR 対応は将来拡張待ちだが、有効化しておくこと自体に不利益はない |
| Secret scanning | 無効 | **有効化する**(人間が実行) |
| Secret scanning push protection | 無効 | **有効化する**(人間が実行)。誤検知時のブロックより漏洩防止を優先 |
| Code scanning(CodeQL) | 未設定("no analysis found") | **Default setup で有効化する**(人間が実行)。ワークフローファイルの保守が不要なため Default setup を選ぶ |
| Private vulnerability reporting | 無効 | **有効化する**(人間が実行) |
| SECURITY.md | 不在 | **今回は見送り**。個人アプリのため、Private vulnerability reporting の有効化で報告経路は確保できると判断。外部コントリビューションを積極的に受ける段階になったら再検討 |

## 対象外と判断した項目

- **Tag Rulesets・Release immutability**: タグ・リリースを運用していないため該当なし
- **コミット署名の強化(SSH鍵)**: アプリケーションコード側の変更ではないが運用習慣の変更を伴うため、今回のスコープ(GitHub 設定)からは除外。別セッションで検討
- **Secret scanning の任意オプション(non-provider patterns / validity checks)**: 誤検知増とのトレードオフを考慮し、意識的に見送り(見落としではない)。必要になったら再検討

## その後の決定（2026-07-13）

テスト専用 CI（[ADR 0005](adr/0005-test-ci-on-github-actions.md)）の導入により、上記「対象外と判断した項目」から除いた Actions 関連2項目（SHA 固定強制・外部コントリビューター承認）は該当ありに転じ、ADR 0005 の3設定セットとして有効化する: "Require actions to be pinned to a full-length commit SHA" / fork PR "Require approval for all external contributors" / Workflow permissions を read-only に。あわせて [ADR 0006](adr/0006-two-lane-dependency-updates.md) で依存更新の二層レーン運用を決定した。

追加(2026-07-14): `allowed_actions: selected` を有効化した(GitHub 製 action + `oven-sh/setup-bun@*` のみ許可、verified creators の一括許可は off)。SHA 固定強制が「参照先のすり替え」を防ぐのに対し、こちらは「未承認 action の持ち込み」自体を実行時に拒否する補完関係にある。AI がワークフローに action を追加するケースも実行前に止まる。同日、Ruleset `protect-main` に required status check `gate` と "Require code scanning results"(CodeQL) も追加済み。

## 実行手順

`docs/reference/github-repo-security-checklist.md` の「有効化する項目」2〜7 を参照し、人間が GitHub Settings で実行する（項目1の Dependabot alerts は対応済み）。`.github/dependabot.yml` は本計画（docs/2026-07-dependabot-and-ci-plan.md）で確定版に置換済み。

## 今後の検討事項(別セッション)

- 公開 API(`/api/total` `/api/month` `/api/genealogies` 等)への入力バリデーション(zod 等)・認証・CORS の要否
- コミット署名の強化(ED25519 SSH鍵)
- CodeQL 安定後の Require code scanning results 追加
