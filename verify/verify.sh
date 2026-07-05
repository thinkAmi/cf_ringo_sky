#!/usr/bin/env bash
set -euo pipefail

# 4つの読み取り API のゴールデンスナップショット検証。
#
# 使い方:
#   ./verify/verify.sh            # baseline と比較（差分があれば exit 1）
#   ./verify/verify.sh --update   # baseline を再生成
#
# ローカル D1 に seed + 決定的な feeds（feeds_fixture.sql）を投入し、
# ringo-db（:8788）と ringo-web（Vite :5173）を起動して 4 エンドポイントを
# curl、jq でキーソート正規化して baseline と突き合わせる。
# 依存する service binding のため、両サーバの起動が前提となる。
#
# 重要: D1 の状態は開発用（既定の .wrangler/state）とは別の専用ディレクトリ
# （--persist-to）に隔離する。これにより検証が開発用の feeds データを
# 破壊しない。snapshot の D1 読み取りは service binding 経由で ringo-db の
# wrangler dev が担うため、その dev と D1 セットアップに同じ persist を渡せば足りる。

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERIFY_DIR="$ROOT/verify"
BASELINE_DIR="$VERIFY_DIR/baseline"
DB_DIR="$ROOT/packages/ringo-db"
WEB_DIR="$ROOT/packages/ringo-web"
WEB_URL="http://localhost:5173"
LOG_DIR="${TMPDIR:-/tmp}"
# 開発用と分離した検証専用の D1 状態ディレクトリ（repo 外）
VERIFY_STATE="$LOG_DIR/ringo-verify-state"

UPDATE=0
[ "${1:-}" = "--update" ] && UPDATE=1

# name|path の順で検証するエンドポイント
ENDPOINTS=(
  "total|/api/total"
  "month|/api/month"
  "genealogies|/api/genealogies"
  "genealogy_tsugaru|/api/genealogies/tsugaru"
)

DB_PID=""
WEB_PID=""
cleanup() {
  [ -n "$WEB_PID" ] && kill "$WEB_PID" 2>/dev/null || true
  [ -n "$DB_PID" ] && kill "$DB_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT

mkdir -p "$BASELINE_DIR"

echo "==> 検証専用 D1 を初期化（migrations + seed + feeds fixture / 隔離状態）"
(
  cd "$DB_DIR"
  bunx wrangler d1 migrations apply ringodb --local --persist-to "$VERIFY_STATE"
  bunx wrangler d1 execute ringodb --local --persist-to "$VERIFY_STATE" --file=seed/apples_and_genealogies.sql
  bunx wrangler d1 execute ringodb --local --persist-to "$VERIFY_STATE" --file="$VERIFY_DIR/feeds_fixture.sql"
) >"$LOG_DIR/ringo-verify-db-setup.log" 2>&1

echo "==> ringo-db を起動（wrangler dev :8788 / 隔離状態）"
( cd "$DB_DIR" && exec bunx wrangler dev --persist-to "$VERIFY_STATE" ) >"$LOG_DIR/ringo-verify-db.log" 2>&1 &
DB_PID=$!

# ringo-web を先に起動すると getPlatformProxy が ringo-db の dev registry 登録より
# 先に接続し binding を張れないため、ringo-db が :8788 で応答してから起動する。
echo "==> ringo-db の起動待ち"
for _ in $(seq 1 60); do
  if curl -sf "http://localhost:8788/" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$DB_PID" 2>/dev/null; then
    echo "ERROR: ringo-db の起動に失敗しました。ログ: $LOG_DIR/ringo-verify-db.log" >&2
    exit 1
  fi
  sleep 1
done

echo "==> ringo-web を起動（Vite :5173）"
( cd "$WEB_DIR" && exec bunx vite ) >"$LOG_DIR/ringo-verify-web.log" 2>&1 &
WEB_PID=$!

echo "==> サーバの起動待ち（最大 90 秒）"
ready=0
for _ in $(seq 1 90); do
  if curl -sf "$WEB_URL/api/genealogies" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "ERROR: サーバが起動しませんでした。ログを確認してください:" >&2
  echo "  $LOG_DIR/ringo-verify-db.log" >&2
  echo "  $LOG_DIR/ringo-verify-web.log" >&2
  exit 1
fi

status=0
for entry in "${ENDPOINTS[@]}"; do
  name="${entry%%|*}"
  path="${entry#*|}"

  if ! raw="$(curl -sf "$WEB_URL$path")"; then
    echo "  ERROR: $name の取得に失敗しました（$path）" >&2
    status=1
    continue
  fi
  actual="$(printf '%s' "$raw" | jq -S .)"
  baseline_file="$BASELINE_DIR/$name.json"

  if [ "$UPDATE" -eq 1 ]; then
    printf '%s\n' "$actual" >"$baseline_file"
    echo "  updated: $name"
    continue
  fi

  if [ ! -f "$baseline_file" ]; then
    echo "  MISSING baseline: $name（先に --update を実行してください）" >&2
    status=1
    continue
  fi
  if diff -u "$baseline_file" <(printf '%s\n' "$actual"); then
    echo "  OK: $name"
  else
    echo "  DIFF: $name" >&2
    status=1
  fi
done

if [ "$UPDATE" -eq 1 ]; then
  echo "==> baseline を再生成しました: $BASELINE_DIR"
elif [ "$status" -eq 0 ]; then
  echo "==> すべての API がベースラインと一致しました"
else
  echo "==> ベースラインとの差分が検出されました" >&2
fi
exit "$status"
