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

- WSL2 Ubuntu 22.04.1 LTS


　  
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
wrangler d1 migrations apply ringodb --local
```

本番環境の場合

```
wrangler d1 migrations apply ringodb --remote
```

　  

### 初期データ(seed)の投入

ローカルの場合

```
wrangler d1 execute ringodb --local --file=seed/apples_and_genealogies.sql --batch-size=1
```

本番環境の場合

```
wrangler d1 execute ringodb --remote --file=seed/apples_and_genealogies.sql --batch-size=1
```

　  
### デプロイ

```
bun run deploy
```

　  
## ringo-web ディレクトリ

Cloudflare Pages `ringo-db` のデプロイ関連の作業です。

### デプロイの種類

デプロイするときのブランチにより、デプロイの種類が異なります。

- main
  - 本番環境向け
- main 以外
  - Preview環境向け 

　  
### デプロイ

ビルド時にハングすることから、3ステップでデプロイします。

#### フロントエンドのビルド

`built in` と表示されたらキャンセルします。

```
bun run build:fe

...
✓ built in 4.74s
```

　  
#### バックエンドのビルド

バックエンドも、 `built in` と表示されたらキャンセルします。

```
bun run build:be

...
✓ built in 205ms
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