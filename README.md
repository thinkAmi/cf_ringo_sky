# Ringo Sky

以下の機能を持った、Honoアプリです。

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

　  
# ブログ記事

- [Cloudflare Pages・Workers + Hono + React + Chart.js で食べたリンゴの割合をグラフ化してみた - メモ的な思考的な](https://thinkami.hatenablog.com/entry/2024/07/09/235549)

　
# 過去に作った似たようなもの

- Python版
    - [thinkAmi/dj_ringo_tabetter: [リンゴ]付きでつぶやいたツイートを集計する。](https://github.com/thinkAmi/dj_ringo_tabetter)
- Ruby版
    - [thinkAmi/ringo-tabetter · GitHub](https://github.com/thinkAmi/ringo-tabetter)
- C#版
    - [thinkAmi/RingoTabetter · GitHub](https://github.com/thinkAmi/RingoTabetter)
    - [thinkAmi/RingoTabetterApi · GitHub](https://github.com/thinkAmi/RingoTabetterApi)