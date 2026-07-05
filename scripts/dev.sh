#!/usr/bin/env bash
set -euo pipefail

# ringo-web は ringo-db への service binding に依存する。
# 両者を同時起動すると、ringo-web の getPlatformProxy() が ringo-db の
# dev registry へのセッション登録より先に接続してしまい、
# 「couldn't find a wrangler dev session for service ringo-db」のまま
# binding を張れずに復帰しなくなる。
# そのため ringo-db を先に起動し、:8788 が応答してから ringo-web を起動する。

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_PORT=8788

DB_PID=""
WEB_PID=""
cleanup() {
  [ -n "$WEB_PID" ] && kill "$WEB_PID" 2>/dev/null || true
  [ -n "$DB_PID" ] && kill "$DB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ringo-db (wrangler dev :8788) を先に起動
( cd "$ROOT/packages/ringo-db" && exec bunx wrangler dev ) &
DB_PID=$!

printf 'ringo-db (:%s) の起動を待機中' "$DB_PORT"
ready=0
for _ in $(seq 1 120); do
  if curl -sf "http://localhost:$DB_PORT/" >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "$DB_PID" 2>/dev/null; then
    echo ''
    echo 'ringo-db の起動に失敗しました' >&2
    exit 1
  fi
  printf '.'
  sleep 0.5
done
if [ "$ready" -ne 1 ]; then
  echo ''
  echo 'ringo-db が起動しませんでした（タイムアウト）' >&2
  exit 1
fi
echo ' -> OK'

# ringo-db の登録完了後に ringo-web (Vite :5173) を起動
( cd "$ROOT/packages/ringo-web" && exec bunx vite ) &
WEB_PID=$!

# どちらかが終了するか、Ctrl+C を受けるまで待つ（trap で両方を停止）
wait
