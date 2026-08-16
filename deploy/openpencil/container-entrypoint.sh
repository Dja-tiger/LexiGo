#!/bin/sh
set -eu

MODE="${1:-}"
DOCUMENT="/workspace/design/openpencil/LexiGo Design System.op"
TOKENS="/workspace/design/openpencil/LexiGo Design Tokens.json"
LOCK_DIR="/state/write.lock"
KEEP="${OPENPENCIL_BACKUP_KEEP:-20}"
MCP_PORT="${OPENPENCIL_MCP_PORT:-33101}"
OWNER="${MODE}-$$-$(date -u +%s)"
CHILD_PID=""

case "$MODE" in
  human|agent) ;;
  *)
    echo "usage: container-entrypoint.sh human|agent" >&2
    exit 64
    ;;
esac

case "$KEEP" in
  ''|*[!0-9]*)
    echo "OPENPENCIL_BACKUP_KEEP must be a positive integer" >&2
    exit 64
    ;;
esac
if [ "$KEEP" -lt 1 ]; then
  echo "OPENPENCIL_BACKUP_KEEP must be at least 1" >&2
  exit 64
fi

case "$MCP_PORT" in
  ''|*[!0-9]*)
    echo "OPENPENCIL_MCP_PORT must be an integer" >&2
    exit 64
    ;;
esac

if [ "$MCP_PORT" -lt 1 ] || [ "$MCP_PORT" -gt 65535 ]; then
  echo "OPENPENCIL_MCP_PORT must be in 1..65535" >&2
  exit 64
fi

for path in "$DOCUMENT" "$TOKENS"; do
  if [ ! -f "$path" ]; then
    echo "required design source missing: $path" >&2
    exit 66
  fi
done

mkdir -p /state /backups

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "OpenPencil writer lock is already held" >&2
  for field in owner mode started_at; do
    if [ -r "$LOCK_DIR/$field" ]; then
      printf '%s=' "$field" >&2
      cat "$LOCK_DIR/$field" >&2 || true
    fi
  done
  exit 73
fi

printf '%s\n' "$OWNER" > "$LOCK_DIR/owner"
printf '%s\n' "$MODE" > "$LOCK_DIR/mode"
date -u +%Y-%m-%dT%H:%M:%SZ > "$LOCK_DIR/started_at"

release_lock() {
  if [ -r "$LOCK_DIR/owner" ] && [ "$(cat "$LOCK_DIR/owner" 2>/dev/null || true)" = "$OWNER" ]; then
    rm -rf "$LOCK_DIR"
  fi
}

forward_signal() {
  if [ -n "$CHILD_PID" ]; then
    kill -TERM "$CHILD_PID" 2>/dev/null || true
  fi
}

trap forward_signal INT TERM HUP
trap release_lock EXIT

STAMP="$(date -u +%Y%m%dT%H%M%SZ)-${MODE}-$$"
BACKUP_DIR="/backups/session-$STAMP"
mkdir "$BACKUP_DIR"
cp -p "$DOCUMENT" "$BACKUP_DIR/LexiGo Design System.op"
cp -p "$TOKENS" "$BACKUP_DIR/LexiGo Design Tokens.json"
(
  cd "$BACKUP_DIR"
  sha256sum "LexiGo Design System.op" "LexiGo Design Tokens.json" > SHA256SUMS
)

while [ "$(find /backups -mindepth 1 -maxdepth 1 -type d -name 'session-*' | wc -l)" -gt "$KEEP" ]; do
  OLDEST="$(find /backups -mindepth 1 -maxdepth 1 -type d -name 'session-*' -printf '%T@ %p\n' | sort -n | head -n 1 | cut -d' ' -f2-)"
  [ -n "$OLDEST" ] || break
  rm -rf "$OLDEST"
done

case "$MODE" in
  human)
    /app/op-host-web-server --serve-web 3100 "$DOCUMENT" --host 0.0.0.0 &
    ;;
  agent)
    /app/op-host-web-server --mcp-http "$MCP_PORT" "$DOCUMENT" &
    ;;
esac
CHILD_PID=$!

set +e
wait "$CHILD_PID"
STATUS=$?
set -e
CHILD_PID=""
exit "$STATUS"
