---
paths:
  - "packages/ringo-db/data/varieties.md"
  - "verify/baseline/*.json"
---

# varieties.md と verify/baseline/ は同じコミットで動かす

`varieties.md` を変更したら、**リポジトリルートで** `./verify/verify.sh --update` を実行し、
再生成した `verify/baseline/` を**同じコミットに含める**。

## なぜ

baseline は品種マスタから導出された API 出力のスナップショットなので、片方だけ変更すると
次に verify.sh を回すセッションが自分の作業と無関係な差分を踏んで止まる。過去に2回起きている。

- ゴールドロマン登録時に baseline が未更新のまま残り、後続の PR 3 セッションが想定外の差分を踏んだ
- 7d05cdc(シナノドルチェの訂正)が varieties.md のみを変更し、次のビスタベラ登録セッションが
  無関係な差分の判断を迫られた

## 機械ゲートとの分担

`verifyBaseline.test.ts` が `bun test` の時点で同期漏れを落とす。ただし検出できるのは
**genealogies 系だけ**で、`total` / `month` は feeds fixture 依存のため対象外。
`bun test` が緑でもこの2つはズレうるので、varieties.md を触ったら `--update` を回す。

## 無関係な差分に遭遇したら

まず持ち越しズレか未知の差分かを切り分ける。

```bash
git log -1 --oneline -- verify/baseline/
git log -1 --oneline -- packages/ringo-db/data/varieties.md
```

baseline の方が古ければ過去コミットの同期漏れ(＝持ち越しズレ)。`--update` に含めてよく、
完了報告で「どのコミット由来の何を同梱したか」を明示する。どちらでもない差分は、
更新せず報告して止まる。
