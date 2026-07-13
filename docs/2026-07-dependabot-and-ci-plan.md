# 依存更新の二層レーン化 + テスト専用 CI 導入 計画（2026-07）

> **ステータス: ステップ3まで完了。** ステップ完了ごとに実装セッションがこの行を「ステップ N まで完了」に更新する（この更新もコミット承認プロトコルに従い、当該ステップのコミットに含める）。

## 背景と方針

依存パッケージの更新を Dependabot による定常レーン（minor/patch）と、既存スキル（plan-dependency-upgrade / run-upgrade-step）による計画レーン（major・撤去・方針変更）の二層に分ける。あわせて、PR 時点の機械ゲートを全パッケージに広げるため、テスト専用の GitHub Actions CI を導入する。

設計決定は以下に記録済み。**実装中に設計を変えたくなったら、勝手に変えず ADR の更新を提案して人間の判断を仰ぐこと**:

- [ADR 0005: テスト専用 CI は GitHub Actions で行う](adr/0005-test-ci-on-github-actions.md)
- [ADR 0006: 依存更新は二層レーンで運用し、auto-merge はしない](adr/0006-two-lane-dependency-updates.md)

**不変条件（この計画で変えないもの）:**

- デプロイの担い手は Workers Builds のまま（[ADR 0004](adr/0004-workers-builds-auto-deploy.md)）。CI はテスト専用で、シークレットを一切持たない
- verify.sh（ゴールデンスナップショット E2E）はローカル専用ツールのまま。CI に組み込まない
- auto-merge は導入しない。マージは常に人間
- bunfig.toml の `minimumReleaseAge = 259200` は維持

## 進め方の原則

- **PR 2本構成**(ステップ1 = PR #18 として単独マージ済み / ステップ2・3 = `feature/test_ci` ブランチの PR)。各 PR 内はステップ = コミットで分割する
- 各コミットは単独でローカルゲート（後述）を通過した状態にする
- 本番に作用する操作は一切行わない。**禁止の線引きは「本番に作用するか」**: `wrangler deploy`（--dry-run なし）・`wrangler secret put`・`d1 --remote` 系・`gh api` による GitHub 設定の変更（Settings / Ruleset / CodeQL の操作は人間の担当）は禁止。`wrangler deploy --dry-run`・`gh api` による読み取りは機械ゲートとして許可
- `bun install` はリポジトリルートでのみ実行する（CLAUDE.md の落とし穴）

## ブランチ戦略

- ステップ1: main から子ブランチ **`feature/dependabot_and_ci`** を作成し、この計画ファイル・ADR 0005 / 0006・dependabot.yml をコミットして PR #18 として単独マージ済み
- ステップ2・3: main から子ブランチ **`feature/test_ci`** を作成し、残りのコミットをそこに積む
- マージ先はいずれも main（人間が PR を作成・マージ）

## 役割分担

| 作業 | 主語 |
|---|---|
| ファイル編集・ローカルゲート実行・SHA解決（gh api 読み取り） | AI（実装セッション） |
| コミット（commit スキル使用）とその承認 | AI が作成、人間が事前承認 |
| push・PR 作成・マージ | 人間 |
| GitHub Settings 操作（後述「マージ後の人間作業」） | 人間 |
| Ruleset への required check 追加・CodeQL 有効化 | 人間 |

## 確定仕様の転記

### `.github/dependabot.yml`（既存の未コミットファイルを以下で全置換）

```yaml
version: 2
updates:
  - package-ecosystem: "bun"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 3
    open-pull-requests-limit: 10
    commit-message:
      prefix: "chore"
      include: "scope"
    groups:
      minor-patch:
        update-types: ["minor", "patch"]
        exclude-patterns: ["wrangler"]
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 3
    commit-message:
      prefix: "chore"
      include: "scope"
    groups:
      actions:
        update-types: ["major", "minor", "patch"]
```

意図（レビュー時の照合用）: bun 側はグループが minor/patch のみのため、**major と wrangler はグループ外 = 自動的に個別 PR** になる。ignore 設定は使わない。github-actions 側は SemVer レベルの cooldown 非対応のため default-days のみ。

### `.bun-version`（新規・リポジトリルート）

```
1.3.14
```

README「デプロイに関する情報」の Workers Builds 表の `BUN_VERSION=1.3.14` と一致していること。将来 Bun を上げるときは両方を更新する（README 運用メモに追記済みの想定）。

### `.github/workflows/ci.yml`（新規）

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<SHA> # <tag>
      - uses: oven-sh/setup-bun@<SHA> # <tag>
        with:
          bun-version-file: .bun-version
      - name: Dependency Review
        if: github.event_name == 'pull_request'
        uses: actions/dependency-review-action@<SHA> # <tag>
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run test
      - name: Build ringo-web
        working-directory: packages/ringo-web
        run: bun run build:fe && bun run build:be
      - name: Dry-run deploy ringo-db
        working-directory: packages/ringo-db
        run: bunx wrangler deploy --dry-run
      - name: Dry-run deploy ringo-bsky
        working-directory: packages/ringo-bsky
        run: bunx wrangler deploy --dry-run
```

**SHA の解決手順（手書き転記禁止・以下で機械的に取得）:**

1. 各 action の最新安定タグを `gh api repos/<owner>/<repo>/releases/latest --jq .tag_name` で取得
2. `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha` で full-length SHA に解決
3. `<SHA>` を置換し、コメントにタグ名を残す（Dependabot が以後の追随でこの形式を保つ）

対象: `actions/checkout` / `oven-sh/setup-bun` / `actions/dependency-review-action`

注意: `dependency-review-action` は PR コンテキストが必須のため `if: github.event_name == 'pull_request'` を外さないこと（外すと main push で必ず落ちる）。

### CLAUDE.md の変更（2箇所）

**(1) コミット規約の適用範囲。** 「全コミットが無条件で同一形式（…）」の直後に以下を追記:

> 対象はこのリポジトリで人間・AI が作成するコミット。bot（Dependabot 等）が作るコミットは対象外（`chore(deps): ...` 形式に設定済み）

**(2) 開発フロー節の末尾に依存更新レーンの段落を追記:**

> 依存更新は二層レーンで運用する（ADR 0006）: minor/patch は Dependabot の週次 PR（人間が CI green を確認してマージ）、major は Dependabot が個別 PR を作るが**マージ禁止**で、plan-dependency-upgrade を起動する材料としてのみ使う。wrangler は単独 PR（都度更新可）。

### README の変更（「デプロイに関する情報」の運用メモ付近に追記）

以下の内容を含む「CI（GitHub Actions）」小節を追加する:

- CI はテスト専用（シークレットなし）で、全 PR と main push で実行される。デプロイは従来どおり Workers Builds（ADR 0005）
- ワークフローが使う action は full-length SHA でピン留めする。タグ → SHA の変換ワンライナー: `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`（例: `gh api repos/actions/checkout/commits/v4 --jq .sha`）。追随は Dependabot が行う
- Bun のバージョンは `.bun-version` が単一ソース。更新時は Workers Builds ダッシュボードの `BUN_VERSION` とこの README の表も追随させる
- ringo-web / ringo-bsky はマージ後の即時デプロイ義務なし。目安として四半期に一度程度はデプロイして差分を小さく保つ

### docs/2026-07-github-security-hardening.md の変更

- 「対象外と判断した項目」の Actions 関連 2 項目（SHA 固定強制・外部コントリビューター承認）を削除し、「その後の決定（2026-07-13）」節を追加: テスト専用 CI の導入により該当ありに転じ、ADR 0005 の3設定セットとして有効化する旨 + ADR 0005 / 0006 へのリンク
- 未対応表の Dependabot version updates 行に cooldown 決定を反映（「weekly で揃える」→「cooldown default-days: 3 で揃える」）
- 「今後の検討事項」に「CodeQL 安定後の Require code scanning results 追加」を追記
- スコープ節の「GitHub Actions 不使用」を「GitHub Actions はテスト専用 CI のみ使用・デプロイには不使用（ADR 0005）」に改める
- 対応済み表の「GitHub Actions を使わず Workers Builds を採用」を「**デプロイには** GitHub Actions を使わず Workers Builds を採用（テスト専用 CI は Actions だがシークレットを持たない）」に改める
- CodeQL 行の選定理由「GitHub Actions を使わない構成のため」を「ワークフローファイルの保守が不要なため Default setup を選ぶ」に改める
- 実行手順の「1〜7」を「2〜7（項目1の Dependabot alerts は対応済み）」に改め、「このセッションでファイルとして追加済み」を「本計画（docs/2026-07-dependabot-and-ci-plan.md）で確定版に置換済み」に改める

### docs/reference/github-repo-security-checklist.md の変更

- 項目3（Dependabot version updates）のサンプル yaml に `cooldown: default-days: <クールダウン日数>` を追加し、判断基準の「interval をクールダウンと揃える」記述を「cooldown オプションで直接設定する（interval は頻度であってクールダウンではない）」に改める
- 「Actions 関連の対象外項目」節の冒頭に「Actions を使い始めた場合はこれらが該当ありに転じる」ことと、有効化すべき3点（SHA 固定強制 / 外部コントリビューター承認 / Workflow permissions read-only）+ dependency-review-action の利用を追記
- 前提の blockquote「GitHub Actions を使わない構成を想定している」を「GitHub Actions を使わない構成を基本とし、使う場合の追加項目は『Actions 関連の対象外項目』節に記す」に改める（前提文と本文の食い違い防止）

### スキル2本への境界追記

`.claude/skills/plan-dependency-upgrade/SKILL.md` と `.claude/skills/run-upgrade-step/SKILL.md` の冒頭付近に以下の1段落を追記（文言は両方同一でよい）:

> **定常レーンとの境界（ADR 0006）**: minor/patch の定期更新は Dependabot の週次 PR が担うため、このスキルの対象外。このスキルが扱うのは major 更新・依存の撤去/再導入・方針変更を伴う更新。Dependabot が作った major の個別 PR はマージせず、このスキルの計画の入力として使う（計画完了時に当該 PR は自動クローズされる）。

## ステップ詳細

### ステップ1: 計画・ADR・dependabot.yml のコミット

- 作業: この計画ファイル、ADR 0005 / 0006（作成済み）、dependabot.yml（上記仕様で全置換）をコミット
- 合格条件（機械的）:
  - `.github/dependabot.yml` の内容が本計画の転記ブロックと完全一致（diff なし）
  - ADR 2本が docs/adr/ に存在し、リンク切れがない（`grep -o '\[.*\](.*\.md)'` で参照先の実在を確認）
- コミット: `chore(deps): Dependabot による定常レーンを導入` + なぜ: ADR 0006 の決定の転記

### ステップ2: CI ワークフローと .bun-version のコミット

- 作業: `.github/workflows/ci.yml`（SHA 解決込み）と `.bun-version` を作成
- 合格条件（機械的・すべてローカルで実行して exit 0 を確認）:
  - `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha` の出力が ci.yml 内の各 SHA と一致（3 action すべて）
  - ルートで `bun install --frozen-lockfile` → `bun run typecheck` → `bun run test`
  - `packages/ringo-web` で `bun run build:fe && bun run build:be`
  - `packages/ringo-db` と `packages/ringo-bsky` で `bunx wrangler deploy --dry-run`
  - `.bun-version` の内容が README の `BUN_VERSION` 表記と一致
- コミット: `chore: テスト専用 CI(GitHub Actions)を導入` + なぜ: ADR 0005 の決定の転記

### ステップ3: ドキュメント・スキルの更新コミット

- 作業: CLAUDE.md / README / security-hardening doc / チェックリスト / スキル2本を「確定仕様の転記」節のとおり更新
- 合格条件: 転記ブロックがある箇所は一字一句一致。要約指定の箇所（README の CI 小節など）は本計画に列挙した要素がすべて含まれていること（自己申告でなく、要素ごとに該当行を提示して人間が確認）
- コミット: `docs: 依存更新の二層レーンと CI 導入をドキュメントに反映` + なぜ: ADR 0005/0006 決定の周知・運用手順の明文化

## 検証の全体設計

| 層 | 適用範囲 | ゲート |
|---|---|---|
| YAML/設定の正しさ | dependabot.yml, ci.yml | 計画転記との diff ゼロ + SHA の gh api 照合 |
| 型 | 全パッケージ | `bun run typecheck` |
| テスト | ringo-db, ringo-bsky | `bun run test`（ringo-web に test がないのは現状仕様） |
| ビルド | ringo-web | `build:fe` + `build:be` |
| デプロイ構成 | ringo-db, ringo-bsky | `wrangler deploy --dry-run` |
| 実行時 | なし（本計画はアプリコードに触れない） | — |
| 目視 | ドキュメント類 | 人間のコミット承認時レビュー |

CI 自体の動作確認は push 後にしかできないため、**PR 上で CI が green になることの確認は人間の担当**（マージ前チェックの一部）。

## 不採用・先送り事項（実装者が「改善」として復活させないこと）

- **auto-merge**: 却下（ADR 0006）。CI 安定後に人間が再検討する
- **verify.sh の CI 実行（verify-e2e ジョブ）**: フレークによるマージ阻害リスクで却下（ADR 0005）
- **major の ignore 設定**: 発生時期の可視性を優先し却下（ADR 0006）
- **pinact / pinact-action**: gh api ワンライナー + Dependabot 追随で代替（ADR 0005）
- **biome を CI に追加**: 既存のどの機械ゲートにも lint はないため対象外。やるなら別の取り組み
- **CI の path filter**: required check が「実行されないまま required」になる罠のため付けない
- **SECURITY.md**: セキュリティ強化調査（2026-07）で見送り済み
- **CodeQL の有効化・Ruleset 変更を AI が gh api で行うこと**: 人間の担当

## マージ後の人間作業（この順で・実装セッションの対象外）

1. PR をマージ（merge commit 方式）
2. Settings: "Require actions to be pinned to a full-length commit SHA" / fork PR "Require approval for all external contributors" / Workflow permissions を read-only に
3. Settings > Code security: CodeQL Default setup を有効化（このとき actions 解析も対象に含める）
4. 適当な PR（次回の Dependabot PR でよい）で CI `gate` チェックが認識されたら、Ruleset `protect-main` の required status checks に `gate` を追加
5. CodeQL が数回安定して走ったら、Ruleset に "Require code scanning results" を追加
6. あわせてセキュリティ強化チェックリストの残項目（Secret scanning / Push protection / Private vulnerability reporting）も未実施なら実施

## 期待される最終状態

- 週次で「minor/patch グループ PR」「wrangler 単独 PR」「（発生時のみ）major の個別 PR」が届き、人間が CI green を確認してマージするだけで定常更新が回る
- major PR は開きっぱなしが正常状態で、計画レーン起動の材料になる
- 全 PR で gate（typecheck / test / build / dry-run / dependency-review）が必須チェックとして走る
- ドキュメント（CLAUDE.md / README / ADR / チェックリスト / スキル）が運用と一致している

## 実行モデルの推奨

全ステップとも仕様は本計画に転記済みで裁量が小さく、ステップ1・2は機械ゲートが厚い。**Sonnet で実行可**。ステップ3（散文の転記・要約）も本計画からの転記が基本のため Sonnet 可だが、文言に迷ったら創作せず本計画の文面をそのまま使うこと。

---

実行は **run-plan-step**（「ステップ N を進めて」で起動）、コミット前の独立監査は **audit-plan-step** を使う。
