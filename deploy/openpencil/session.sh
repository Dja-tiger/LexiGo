#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy/openpencil"
ENV_FILE="${OPENPENCIL_ENV_FILE:-$DEPLOY_DIR/openpencil.env}"
COMPOSE_FILE="$DEPLOY_DIR/compose.yml"

usage() {
  cat <<'EOF'
Usage:
  bash deploy/openpencil/session.sh preflight human|agent
  bash deploy/openpencil/session.sh start human|agent
  bash deploy/openpencil/session.sh stop
  bash deploy/openpencil/session.sh status
  bash deploy/openpencil/session.sh recover-lock
EOF
}

load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "missing host env file: $ENV_FILE" >&2
    echo "copy deploy/openpencil/openpencil.env.example and chmod 600" >&2
    exit 66
  fi
  # The env file is trusted operator configuration, not repository content.
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "required command not found: $1" >&2
    exit 69
  }
}

require_absolute_dir() {
  local name="$1" value="${!1:-}"
  [[ "$value" == /* ]] || {
    echo "$name must be an absolute host path" >&2
    exit 64
  }
  mkdir -p "$value"
  chmod 700 "$value"
}

preflight() {
  local mode="$1"
  [[ "$mode" == human || "$mode" == agent ]] || {
    echo "mode must be human or agent" >&2
    exit 64
  }

  load_env
  require_command docker
  require_command git
  require_command curl
  docker compose version >/dev/null

  [[ "${OPENPENCIL_IMAGE:-}" == ghcr.io/zseven-w/openpencil-web:v0.8.2@sha256:* ]] || {
    echo "OPENPENCIL_IMAGE must pin accepted v0.8.2 by immutable sha256 digest" >&2
    exit 64
  }

  require_absolute_dir OPENPENCIL_WORKTREE
  require_absolute_dir OPENPENCIL_STATE_DIR
  require_absolute_dir OPENPENCIL_BACKUP_DIR

  git -C "$OPENPENCIL_WORKTREE" rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
    echo "OPENPENCIL_WORKTREE is not a Git worktree" >&2
    exit 65
  }
  local branch
  branch="$(git -C "$OPENPENCIL_WORKTREE" branch --show-current)"
  [[ -n "$branch" && "$branch" != main ]] || {
    echo "design worktree must be on an explicit non-main branch" >&2
    exit 65
  }

  local document="$OPENPENCIL_WORKTREE/design/openpencil/LexiGo Design System.op"
  local tokens="$OPENPENCIL_WORKTREE/design/openpencil/LexiGo Design Tokens.json"
  [[ -f "$document" && -f "$tokens" ]] || {
    echo "promoted OpenPencil source pair is missing from design worktree" >&2
    exit 66
  }

  [[ "${OPENPENCIL_BACKUP_KEEP:-20}" =~ ^[1-9][0-9]*$ ]] || {
    echo "OPENPENCIL_BACKUP_KEEP must be at least 1" >&2
    exit 64
  }

  if [[ "$mode" == human ]]; then
    [[ "${OPENPENCIL_WEB_ALLOWED_ORIGINS:-}" == "https://${OPENPENCIL_SITE_ADDRESS:-}" ]] || {
      echo "OPENPENCIL_WEB_ALLOWED_ORIGINS must exactly equal https://OPENPENCIL_SITE_ADDRESS" >&2
      exit 64
    }
    [[ "${CLOUDFLARE_API_TOKEN:-}" != "" && "${CLOUDFLARE_API_TOKEN:-}" != REPLACE_ON_HOST && "${CLOUDFLARE_API_TOKEN:-}" != REQUIRED_ON_HOST ]] || {
      echo "CLOUDFLARE_API_TOKEN must be set only in the host env file" >&2
      exit 64
    }
    [[ -n "${OPENPENCIL_BASIC_AUTH_USER:-}" && "${OPENPENCIL_BASIC_AUTH_USER:-}" != REQUIRED_ON_HOST ]] || {
      echo "OPENPENCIL_BASIC_AUTH_USER is required" >&2
      exit 64
    }
    [[ "${OPENPENCIL_BASIC_AUTH_HASH:-}" == '$2'* ]] || {
      echo "OPENPENCIL_BASIC_AUTH_HASH must be a Caddy bcrypt hash" >&2
      exit 64
    }
  fi

  compose --profile human --profile agent config >/dev/null
}

running_writer() {
  compose --profile human --profile agent ps --services --status running 2>/dev/null | grep -E '^(web|mcp)$' || true
}

wait_http() {
  local url="$1" attempts="${2:-60}"
  for ((i = 1; i <= attempts; i++)); do
    if curl --fail --silent --show-error --max-time 2 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "readiness timeout: $url" >&2
  return 1
}

wait_mcp() {
  local port="${OPENPENCIL_MCP_PORT:-33101}" payload
  payload='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"lexigo-operator","version":"1"}}}'
  for ((i = 1; i <= 60; i++)); do
    if curl --fail --silent --show-error --max-time 2 \
      -H 'Content-Type: application/json' \
      --data "$payload" "http://127.0.0.1:${port}/mcp" | grep -q '"result"'; then
      return 0
    fi
    sleep 1
  done
  echo "MCP readiness timeout on 127.0.0.1:${port}" >&2
  return 1
}

start_mode() {
  local mode="$1"
  preflight "$mode"
  local active
  active="$(running_writer)"
  if [[ -n "$active" ]]; then
    echo "another OpenPencil writer is already running: $active" >&2
    exit 73
  fi

  if [[ "$mode" == human ]]; then
    compose --profile human up -d web caddy
    wait_http "http://127.0.0.1:${OPENPENCIL_WEB_LOOPBACK_PORT:-33100}/"
    echo "human editor started; use https://${OPENPENCIL_SITE_ADDRESS} through Caddy authentication"
  else
    compose --profile agent up -d mcp
    wait_mcp
    echo "agent MCP started on host loopback http://127.0.0.1:${OPENPENCIL_MCP_PORT:-33101}/mcp"
  fi
}

stop_all() {
  load_env
  compose --profile human --profile agent down --remove-orphans
}

status_all() {
  load_env
  compose --profile human --profile agent ps
  if [[ -d "${OPENPENCIL_STATE_DIR}/write.lock" ]]; then
    echo "writer lock:"
    for field in owner mode started_at; do
      [[ -r "${OPENPENCIL_STATE_DIR}/write.lock/$field" ]] && printf '  %s=%s\n' "$field" "$(cat "${OPENPENCIL_STATE_DIR}/write.lock/$field")"
    done
  else
    echo "writer lock: free"
  fi
}

recover_lock() {
  load_env
  require_absolute_dir OPENPENCIL_STATE_DIR
  local active
  active="$(running_writer)"
  if [[ -n "$active" ]]; then
    echo "refusing stale-lock recovery while writer is running: $active" >&2
    exit 73
  fi
  rm -rf "${OPENPENCIL_STATE_DIR}/write.lock"
  echo "stale writer lock removed"
}

COMMAND="${1:-}"
case "$COMMAND" in
  preflight)
    [[ $# -eq 2 ]] || { usage; exit 64; }
    preflight "$2"
    ;;
  start)
    [[ $# -eq 2 ]] || { usage; exit 64; }
    start_mode "$2"
    ;;
  stop)
    [[ $# -eq 1 ]] || { usage; exit 64; }
    stop_all
    ;;
  status)
    [[ $# -eq 1 ]] || { usage; exit 64; }
    status_all
    ;;
  recover-lock)
    [[ $# -eq 1 ]] || { usage; exit 64; }
    recover_lock
    ;;
  *)
    usage
    exit 64
    ;;
esac
