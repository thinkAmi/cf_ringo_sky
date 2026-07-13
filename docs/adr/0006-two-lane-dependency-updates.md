---
status: accepted
date: 2026-07-13
---

# 依存更新は二層レーンで運用し、auto-merge はしない

依存パッケージの更新を、Dependabot による**定常レーン**と、既存の plan-dependency-upgrade / run-upgrade-step スキルによる**計画レーン**の二層に分ける。定常レーンは minor / patch を週次のグループ PR（wrangler のみ単独 PR）にまとめ、人間が CI green を確認してマージする。major は Dependabot に個別 PR を作らせるが**マージせず**、計画レーンを起動する材料（発生時期の可視化）としてのみ使う。計画レーンで更新が完了すると Dependabot の major PR は自動クローズされる。

## Considered Options

- **(a) auto-merge（CI green で自動マージ）** — main へのマージは ringo-db の本番自動デプロイに直結するため、無人での本番反映になる。ゲート（CI + Workers Builds + cooldown 3日）は多重にあるが、現時点では人間の目を残す判断とした。CI 運用が安定したら再検討してよい
- **(b) major を ignore する** — 設定は単純になるが、major の存在が Dependabot の視界から消え、棚卸し（計画レーン）を起動しない限り静かに溜まる。「major がいつ発生したか把握したい」という要求に反するため却下
- **(c) 個別 PR を可視化シグナルとして残す（採用）** — グループを minor/patch のみと定義すれば、グループ外の更新（major・除外した wrangler）は自動的に個別 PR になる。ignore 設定は不要

## Consequences

- **major PR はマージ禁止**という運用ルールが生まれる。開きっぱなしが正常状態であり、放置ではない
- wrangler は開発ツールとして都度更新（ローカル更新含む）の可能性があるためグループから除外し単独 PR とする。ローカルで先に更新すれば Dependabot 側の PR は自動で追随・クローズされる
- cooldown は `default-days: 3` とし、bunfig.toml の `minimumReleaseAge = 259200`（3日）と整合させる。Dependabot は自前でバージョン解決して lockfile を書き換えるため、bunfig の設定だけではサプライチェーン攻撃の緩和にならない（cooldown が必須）。なお github-actions エコシステムは cooldown の SemVer レベル指定に非対応のため default-days のみ使う
- bun は Dependabot security updates（脆弱性の自動修正 PR）に未対応のため、CVE 対応は従来どおり手動（minimumReleaseAgeExcludes + 完全固定 + 時限解除。スキル参照）。Dependabot alerts と CI の dependency-review-action がその検知側を担う
- コミット規約（CLAUDE.md）の「全コミットが無条件で同一形式」は、bot（Dependabot）が作るコミットを含まない「このリポジトリで人間・AI が作成するコミット」を対象とすることに改める。Dependabot のコミットは `commit-message` 設定で `chore(deps): ...` に寄せ、type / scope の慣習とは揃える
- マージ方式は merge commit（既存履歴の慣習と一致）。マージ後、ringo-web / ringo-bsky の即時手動デプロイ義務は課さない（CI がビルド成立を保証済み。小規模アプリで revert + 再デプロイによる復旧が可能）
