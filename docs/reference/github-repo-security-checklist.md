# GitHub リポジトリ セキュリティ設定チェックリスト

> 特定リポジトリに依存しない汎用チェックリスト。個人の public リポジトリで、GitHub Actions を使わない構成を基本とし、使う場合の追加項目は「Actions 関連の対象外項目」節に記す。private リポジトリでは一部項目に GitHub Advanced Security のライセンスが必要になる場合がある。

対象は GitHub の Settings 画面で完結する「有効化するだけ」の項目のみ。アプリケーションコードの変更（入力バリデーション・認証・CORS・コミット署名など）は対象外。

## 前提確認

- [ ] リポジトリが public か private かを確認する（`gh api repos/<owner>/<repo> --jq '{private, visibility}'`）。private の場合、Secret scanning・CodeQL 等の一部機能は Advanced Security ライセンスが必要
- [ ] GitHub Actions を使っているか確認する（`.github/workflows/` の有無）。使っていなければ「Actions 関連の対象外項目」セクションはそのままでよい

## 有効化する項目

各項目は Settings > Code security（旧 Advanced Security）から操作する。

### 1. Dependabot alerts
依存パッケージの既知の脆弱性を検知して通知する。土台となる機能で、以下の Security updates もこれが前提。
- 設定場所: Settings > Code security > Dependabot alerts > Enable
- 判断基準: 無効化する理由はほぼない。常時 ON 推奨

### 2. Dependabot security updates
検知した脆弱性に対する自動修正 PR を作成する。
- 設定場所: Settings > Code security > Dependabot security updates > Enable
- 判断基準: 使用中のパッケージマネージャがサポート対象か事前確認する（例: bun は Version updates のみ対応で、Security updates は本記事執筆時点で未対応というケースがある。都度 GitHub Changelog で確認）

### 3. Dependabot version updates
`.github/dependabot.yml` を作成し、依存パッケージを定期的に最新化する PR を作成する。
- 設定場所: リポジトリに `.github/dependabot.yml` を追加（Settings 側の操作ではなくファイル追加）
- 判断基準:
  - `package-ecosystem` が使用中のパッケージマネージャに対応しているか確認する。対応可否は**ロックファイルの形式まで**確認する（例: bun はテキスト形式 `bun.lock` が前提で、旧バイナリ形式 `bun.lockb` のままでは動かない）
  - 更新頻度（`schedule.interval`）は頻度であってクールダウンではない。サプライチェーン攻撃緩和のためのクールダウンは cooldown オプションで直接設定する（例: Bun の `minimumReleaseAge`、npm の類似設定と揃える）
  - サンプル:
    ```yaml
    version: 2
    updates:
      - package-ecosystem: "<npm|bun|pip|...>"
        directory: "/"
        schedule:
          interval: "weekly"
        cooldown:
          default-days: <クールダウン日数>
    ```

### 4. Secret scanning
リポジトリ内のコミット履歴からシークレット（APIキー・トークン等）のパターンを検知する。
- 設定場所: Settings > Code security > Secret scanning > Enable
- 判断基準: public リポジトリなら無料。無効化する理由はほぼない

### 5. Secret scanning push protection
シークレットらしき文字列を含むプッシュそのものをブロックする。
- 設定場所: Settings > Code security > Secret scanning > Push protection > Enable
- 判断基準: 誤検知時は正当なプッシュもブロックされる（バイパス可能）。誤検知の運用コストより漏洩防止のメリットが大きいと判断するなら有効化する

### 6. Code scanning（CodeQL）
静的解析で脆弱性パターンを検知する。
- 設定場所: Settings > Code security > Code scanning > Set up > Default
- 判断基準: GitHub Actions を使わない構成なら **Default setup** を選ぶ（GitHub 管理下で実行され、`.github/workflows/` にファイルを追加する必要がない）。Advanced setup は Actions ワークフローを自分で書く場合のみ
- 注意: Default setup も GitHub Actions の基盤上で動くため、**リポジトリの Actions 機能自体は有効**である必要がある（ワークフローファイルが不要というだけ）。Actions 機能を無効化しているリポジトリでは使えない

### 7. Private vulnerability reporting
Issue を公開せずに脆弱性を非公開で報告してもらう窓口を有効化する。
- 設定場所: Settings > Code security > Private vulnerability reporting > Enable
- 判断基準: 無効化する理由はほぼない。有効化しておけば、公開 Issue への脆弱性投稿を避けられる

## 有効化を検討するが、状況次第で見送ってよい項目

### 8. SECURITY.md
脆弱性の報告方法を明文化するファイル。
- 判断基準: Private vulnerability reporting を有効化していれば、GitHub の UI（Security タブ）からある程度自明に報告できるため、個人の小規模リポジトリでは省略しても実害は小さい。外部からのコントリビューションを積極的に受けるリポジトリでは用意する

### 9. ブランチ保護（Rulesets）
`main` への直接 push・force push・削除を禁止する。
- 判断基準: 自動デプロイや CI がマージをトリガーにしている場合は特に重要。すでに導入済みなら対象外

CI がある場合は、同じルールセットに以下の3段を検討する:

#### 9a. CI の必須チェック化（Require status checks to pass）
- 設定場所: Rulesets の該当ルールセット > Require status checks to pass > チェック名を選択
- 判断基準: CI があるなら基本 on。チェック名は**一度実行されるまで選択肢に出ない**ため、「CI 導入 → 一度実行 → 必須化」の順で行う
- 注意: 必須化の前から開いている PR には当該チェックが存在せず、マージ不能になる。再実行が必要（Dependabot PR なら `@dependabot rebase` とコメント、通常の PR なら rebase や空 push）

#### 9b. Require branches to be up to date（strict チェック）
- 判断基準: on にすると「個別には green だが組み合わせると壊れる」マージを防げるが、PR を連続マージするたびに「ベース更新 → CI 再実行待ち」が直列に発生する。マージ頻度が高い・CI が速い・複数人開発なら on。低頻度の個人リポジトリで、main への push でも CI が走る構成（壊れれば直後に検知できる）なら off も妥当

#### 9c. Require code scanning results
- 判断基準: CodeQL（項目6）を有効化して数回安定して走った後に追加する。有効化直後に入れるとチェック未認識でマージ不能になり得る（9a と同じ段取りの罠）

## Actions 関連の対象外項目（GitHub Actions を使わない場合）

Actions を使い始めた場合はこれらが該当ありに転じる。有効化すべき3点: Actions を full-length commit SHA に固定させる設定 / 外部コントリビューターの PR に対する CI 実行承認必須化 / Workflow permissions を read-only に。あわせて dependency-review-action の利用も検討する。

さらに `allowed_actions: selected`（Settings > Actions > General > Actions permissions で「GitHub 製 + 明示的に許可した action のみ」に制限）も検討する。SHA 固定強制が「参照先の**すり替え**」を防ぐのに対し、こちらは「未承認 action の**持ち込み**」自体を実行時に拒否する補完関係にある（正しくピン留めされた悪意ある action も止まる）。新しい action を使うときに許可リストへの追加が必要になる摩擦はあるが、action が少なく固定的なリポジトリでは低コスト。

以下は GitHub Actions のワークフローファイルを前提とした施策のため、Actions を使わない構成（例: Cloudflare Workers Builds のようなネイティブ Git 連携でデプロイする構成）では該当しない。Actions を導入した時点で再検討する。

- Actions を full-length commit SHA に固定させる設定（"Require actions to be pinned to a full-length commit SHA"）
- 外部コントリビューターの PR に対する CI 実行承認必須化（"Require approval for all external contributors"）
- コミット署名の義務化（`gpg.format ssh` 等でのコミット署名）— Actions 有無に関わらず検討可能だが、運用コストが個人リポジトリには重いため任意

## タグ・リリースを運用していない場合の対象外項目

- Tag Rulesets（バージョンタグの保護）
- Release immutability（公開済み Release の改変防止）

`git tag` が0件など、タグ・リリースの運用自体がなければ該当しない。運用を始めた時点で再検討する。

## 付録: 設定の実測検証コマンド

UI のトグル名と API のフィールド名は微妙に異なる。「設定したつもり」を防ぐため、設定後に `gh api` で読み取って検証する:

```bash
# Secret scanning / Push protection / Dependabot security updates
gh api repos/<owner>/<repo> --jq '.security_and_analysis'
# Dependabot alerts(204 なら有効)
gh api repos/<owner>/<repo>/vulnerability-alerts -i | head -1
# Private vulnerability reporting
gh api repos/<owner>/<repo>/private-vulnerability-reporting
# Actions 全般(sha_pinning_required / allowed_actions)
gh api repos/<owner>/<repo>/actions/permissions
# allowed_actions: selected の許可リスト
gh api repos/<owner>/<repo>/actions/permissions/selected-actions
# Workflow permissions(read-only か)
gh api repos/<owner>/<repo>/actions/permissions/workflow
# fork PR の実行承認ポリシー
gh api repos/<owner>/<repo>/actions/permissions/fork-pr-contributor-approval
# CodeQL Default setup の状態
gh api repos/<owner>/<repo>/code-scanning/default-setup
# Ruleset の全ルール(required checks / code scanning 要件を含む)
gh api repos/<owner>/<repo>/rulesets --jq '.[] | {id, name}'  # id を確認してから
gh api repos/<owner>/<repo>/rulesets/<id> --jq '{enforcement, rules: [.rules[] | {type, parameters}]}'
```

## 参考ドキュメント

- [リポジトリを保護するためのクイック スタート - GitHub Docs](https://docs.github.com/ja/code-security/getting-started/quickstart-for-securing-your-repository)
