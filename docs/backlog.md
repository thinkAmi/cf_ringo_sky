# バックログ

計画(docs/YYYY-MM-*-plan.md)に載せるほどではない、単発の改善課題を記録する。
着手時は該当項目を読んでそのまま作業を始められる粒度で書く。完了したら項目を削除する。

## 存在しない品種の系譜ページに not-found 表示を追加

- **症状**: 未登録の品種名の URL(例: `/genealogies/xxx`)にアクセスすると、汎用エラー
  (「データの取得に失敗しました。時間をおいて再度お試しください。」)が表示される。
  通信エラーではないため、メッセージが実態と合っていない
- **原因**: `/api/genealogies/:name` は未登録品種に対して `[]` を返す(旧 D1 実装から不変)。
  `packages/ringo-web/src/client/routes/genealogies/$appleName.tsx` の
  `const genealogy = data[0]` が undefined になり、`genealogy.apple` の参照で TypeError →
  ルーターの errorComponent が汎用エラーを表示する。品種マスタ移行(2026-07)以前からの既存挙動
- **改修方針**: 「この品種は登録されていません」という専用表示(系譜一覧 `/genealogies` への
  導線つき)にする。loader で data が空のとき TanStack Router の `notFound()` を throw するか、
  コンポーネント側で空チェックする
- **確認**: `bun run typecheck` + 目視(`/genealogies/xxx` と正常ページ `/genealogies/tsugaru`)。
  API に変更はないため verify.sh の baseline には影響しない
- **着手タイミング**: 品種マスタ移行(epic: feature/variety_master)のマージ後
