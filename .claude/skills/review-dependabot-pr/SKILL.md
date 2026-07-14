---
name: review-dependabot-pr
description: >-
  Dependabot が作成した PR を二層レーン運用(ADR 0006)に従ってレビューし、
  マージ可否の推奨を出す。「Dependabot の PR を確認して」「依存更新の PR をレビューして」
  「この PR マージしていい?」等で発動する。マージの実行は人間の担当で、このスキルは行わない。
  major 更新の実施は plan-dependency-upgrade / run-upgrade-step の領分。
---

# review-dependabot-pr

Dependabot PR の週次レビューを定型化する。前提は [ADR 0006](../../../docs/adr/0006-two-lane-dependency-updates.md)
(二層レーン・auto-merge しない)と [ADR 0005](../../../docs/adr/0005-test-ci-on-github-actions.md)(テスト専用 CI)。
**マージ・auto-merge の有効化・GitHub 設定の変更はしない**(推奨を出すまでがこのスキル)。

## 1. PR の種別判定(最初に必ず)

`gh pr list --author "app/dependabot"` で一覧し、ブランチ名・タイトルで分類する:

| 種別 | 見分け方 | 扱い |
|---|---|---|
| minor/patch グループ | ブランチ `dependabot/bun/minor-patch-*` | レビューしてマージ可否を推奨 |
| wrangler 単独 | ブランチ `dependabot/bun/wrangler-*` | 同上(都度更新可。ローカルで先に更新済みなら PR は自動クローズされる旨を案内) |
| **major 個別** | タイトルのバージョン差が major | **マージ禁止**。レビューせず「計画レーンの起点」と案内し、対応するなら plan-dependency-upgrade の起動を提案 |
| github-actions グループ | ブランチ `dependabot/github_actions/*` | レビューしてマージ可否を推奨(SHA ピン留めが維持されているか確認) |

## 2. 機械ゲートの確認

- **CI `gate`**(required check)と **Workers Builds** のチェックが green か
  (`gh pr checks <番号>` で確認。ルート `bun.lock` は Workers Builds の watch paths 内)
- **`gate` チェック自体が PR に付いていない場合**: required check の導入前に作られた PR で、
  そのままではマージ不能。人間に「PR へ `@dependabot rebase` とコメントして再作成させる」よう依頼する
- red の場合はログを読み、原因が「更新そのものによる破壊」か「無関係なフレーク」かを切り分けて報告する。
  いずれでもマージ推奨は出さない

## 3. 内容レビュー

- PR 本文のリリースノート要約を読み、**挙動変更・非推奨化・エンジン要件の変化**の気配を列挙する
- 気になる変更があれば当該パッケージの changelog を確認し、このリポジトリでの影響
  (使用箇所の grep)を添える
- cooldown 3日を通過した版のみが来る前提だが、CVE 対応で急ぐ場合の例外手順は
  `minimumReleaseAgeExcludes` + 完全固定 + 時限解除(run-upgrade-step スキル参照)

## 4. 推奨の提示(テンプレート)

PR ごとに次を報告する:

1. **種別と対象**: グループ / wrangler / major / actions、含まれるパッケージと版
2. **ゲート結果**: gate / Workers Builds の状態
3. **懸念**: リリースノートから拾った注意点。なければ「なし」と明記
4. **推奨**: 「マージ可(merge commit 方式)」/「保留(理由)」/「マージ禁止(major → 計画レーン)」

## 5. マージ後の案内(推奨に添える)

- ringo-db に影響する更新: main マージで**本番へ自動デプロイ**される(Workers Builds)
- ringo-web / ringo-bsky: 即時デプロイ義務なし(目安: 四半期に一度。README 運用メモ参照)

## してはいけないこと

- PR のマージ・クローズ、auto-merge の有効化(ADR 0006 で不採用)
- major PR を「ついでに」マージすること。開きっぱなしが正常状態
- GitHub Settings / Ruleset の変更(人間の担当)
