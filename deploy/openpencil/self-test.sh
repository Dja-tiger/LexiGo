#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy/openpencil"
COMPOSE_FILE="$DEPLOY_DIR/compose.yml"
SOURCE_OP="$ROOT_DIR/design/openpencil/LexiGo Design System.op"
SOURCE_TOKENS="$ROOT_DIR/design/openpencil/LexiGo Design Tokens.json"
SCREEN_MAP="$ROOT_DIR/docs/figma/openpencil-screen-map.json"
EVIDENCE_DIR="$ROOT_DIR/.tmp/openpencil-self-host"
readarray -t ACTIVE_IDENTITY < <(python3 - "$SCREEN_MAP" <<'PY'
import json
import pathlib
import sys
source = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))["source"]
print(source["activeOpSha256"])
print(source["activeOpSize"])
PY
)
EXPECTED_OP_SHA="${ACTIVE_IDENTITY[0]}"
EXPECTED_OP_SIZE="${ACTIVE_IDENTITY[1]}"
EXPECTED_TOKEN_SHA="e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c"

: "${OPENPENCIL_IMAGE:?set OPENPENCIL_IMAGE to the resolved immutable v0.8.2 image}"
[[ "$OPENPENCIL_IMAGE" == ghcr.io/zseven-w/openpencil-web:v0.8.2@sha256:* ]] || {
  echo "runtime smoke requires immutable v0.8.2 image" >&2
  exit 64
}
command -v ss >/dev/null 2>&1 || {
  echo "ss is required to prove loopback-only MCP binding" >&2
  exit 69
}

mkdir -p "$EVIDENCE_DIR"
TMP_ROOT="$(mktemp -d)"
export OPENPENCIL_COMPOSE_PROJECT="${OPENPENCIL_COMPOSE_PROJECT:-lexigo-openpencil-ci-$$}"
export OPENPENCIL_WORKTREE="$TMP_ROOT/worktree"
export OPENPENCIL_STATE_DIR="$TMP_ROOT/state"
export OPENPENCIL_BACKUP_DIR="$TMP_ROOT/backups"
export OPENPENCIL_UID="$(id -u)"
export OPENPENCIL_GID="$(id -g)"
export OPENPENCIL_BACKUP_KEEP=2
export OPENPENCIL_WEB_LOOPBACK_PORT="${OPENPENCIL_WEB_LOOPBACK_PORT:-43100}"
export OPENPENCIL_MCP_PORT="${OPENPENCIL_MCP_PORT:-43101}"
export OPENPENCIL_WEB_ALLOWED_ORIGINS=https://design.example.test
export OPENPENCIL_SITE_ADDRESS=design.example.test

mkdir -p "$OPENPENCIL_WORKTREE/design/openpencil" "$OPENPENCIL_STATE_DIR" "$OPENPENCIL_BACKUP_DIR"
cp "$SOURCE_OP" "$OPENPENCIL_WORKTREE/design/openpencil/LexiGo Design System.op"
cp "$SOURCE_TOKENS" "$OPENPENCIL_WORKTREE/design/openpencil/LexiGo Design Tokens.json"

compose() {
  docker compose -p "$OPENPENCIL_COMPOSE_PROJECT" -f "$COMPOSE_FILE" "$@"
}

cleanup() {
  compose --profile human --profile agent ps -a > "$EVIDENCE_DIR/compose-ps.txt" 2>&1 || true
  compose --profile human --profile agent logs --no-color > "$EVIDENCE_DIR/compose.log" 2>&1 || true
  compose --profile human --profile agent down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

phase() {
  printf 'phase=%s\n' "$1"
}

assert_source_identity() {
  local op_sha op_size token_sha
  op_sha="$(sha256sum "$SOURCE_OP" | awk '{print $1}')"
  op_size="$(wc -c < "$SOURCE_OP" | tr -d '[:space:]')"
  token_sha="$(sha256sum "$SOURCE_TOKENS" | awk '{print $1}')"
  [[ "$op_sha" == "$EXPECTED_OP_SHA" ]] || {
    echo "canonical .op SHA drift: $op_sha" >&2
    exit 1
  }
  [[ "$op_size" == "$EXPECTED_OP_SIZE" ]] || {
    echo "canonical .op size drift: $op_size" >&2
    exit 1
  }
  [[ "$token_sha" == "$EXPECTED_TOKEN_SHA" ]] || {
    echo "canonical token SHA drift: $token_sha" >&2
    exit 1
  }
}

wait_url() {
  local url="$1"
  for _ in $(seq 1 60); do
    if curl --fail --silent --show-error --max-time 2 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "readiness timeout: $url" >&2
  return 1
}

wait_mcp() {
  local payload
  payload='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"lexigo-self-test","version":"1"}}}'
  for _ in $(seq 1 60); do
    if curl --fail --silent --show-error --max-time 2 -H 'Content-Type: application/json' --data "$payload" "http://127.0.0.1:${OPENPENCIL_MCP_PORT}/mcp" | grep -q '"result"'; then
      return 0
    fi
    sleep 1
  done
  echo "MCP readiness timeout" >&2
  return 1
}

phase static
assert_source_identity
bash -n "$DEPLOY_DIR/session.sh"
sh -n "$DEPLOY_DIR/container-entrypoint.sh"

grep -Fq '127.0.0.1:${OPENPENCIL_WEB_LOOPBACK_PORT:-33100}:3100' "$COMPOSE_FILE"
grep -Fq 'network_mode: host' "$COMPOSE_FILE"
if sed -n '/^  mcp:/,/^  caddy:/p' "$COMPOSE_FILE" | grep -Eq '^[[:space:]]+ports:'; then
  echo "MCP service must not publish Docker ports" >&2
  exit 1
fi
grep -Fq 'OPENPENCIL_PERSIST_WEB_CREDENTIALS_SERVER: "false"' "$COMPOSE_FILE"
grep -Fq 'basic_auth {' "$DEPLOY_DIR/Caddyfile"
! grep -Eq '(/mcp|reverse_proxy[[:space:]]+mcp)' "$DEPLOY_DIR/Caddyfile"
! grep -R -n -E 'openpencil|OpenPencil' "$ROOT_DIR/deploy/compose/docker-compose.stage.yml" "$ROOT_DIR/deploy/compose/docker-compose.prod.yml" "$ROOT_DIR/deploy/Caddyfile"

phase compose-config
compose --profile human --profile agent config > "$EVIDENCE_DIR/compose-config.yml"

phase human-start
compose --profile human up -d web
wait_url "http://127.0.0.1:${OPENPENCIL_WEB_LOOPBACK_PORT}/"
[[ "$(cat "$OPENPENCIL_STATE_DIR/write.lock/mode")" == human ]]
compose port web 3100 | grep -Eq "^127\\.0\\.0\\.1:${OPENPENCIL_WEB_LOOPBACK_PORT}$"
[[ "$(find "$OPENPENCIL_BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name 'session-*' | wc -l)" -eq 1 ]]
find "$OPENPENCIL_BACKUP_DIR" -mindepth 1 -maxdepth 1 -type f -name SHA256SUMS -exec sh -c 'cd "$(dirname "$1")" && sha256sum -c SHA256SUMS' _ {} \;

phase lock-conflict
compose --profile agent up -d mcp
sleep 2
if compose --profile human --profile agent ps --services --status running | grep -qx mcp; then
  echo "MCP writer started while human lock was held" >&2
  exit 1
fi
compose logs mcp 2>&1 | grep -Fq 'OpenPencil writer lock is already held'
compose rm -sf mcp >/dev/null
compose stop web >/dev/null
compose rm -sf web >/dev/null
[[ ! -d "$OPENPENCIL_STATE_DIR/write.lock" ]]

phase agent-start
compose --profile agent up -d mcp
wait_mcp
[[ "$(cat "$OPENPENCIL_STATE_DIR/write.lock/mode")" == agent ]]
ss -H -ltn | grep -Eq "127\\.0\\.0\\.1:${OPENPENCIL_MCP_PORT}[[:space:]]"
! ss -H -ltn | grep -Eq "(0\\.0\\.0\\.0|\\[::\\]|\\*):${OPENPENCIL_MCP_PORT}[[:space:]]"

phase mcp-contract
OPENPENCIL_MCP_PORT="$OPENPENCIL_MCP_PORT" python3 - <<'PY'
import json
import os
import re
import urllib.request

url = f"http://127.0.0.1:{os.environ['OPENPENCIL_MCP_PORT']}/mcp"
next_id = 10


def rpc(method, params):
    global next_id
    next_id += 1
    body = json.dumps({"jsonrpc": "2.0", "id": next_id, "method": method, "params": params}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as response:
        payload = json.loads(response.read().decode())
    if "error" in payload:
        raise AssertionError(payload["error"])
    return payload


def tool(name, arguments=None):
    payload = rpc("tools/call", {"name": name, "arguments": arguments or {}})
    result = payload.get("result", {})
    content = result.get("content", [])
    if not content:
        raise AssertionError(f"{name}: missing MCP content: {payload}")
    text = content[0].get("text", "")
    if result.get("isError"):
        raise AssertionError(f"{name}: {text}")
    try:
        decoded = json.loads(text)
    except Exception:
        decoded = text
    return text, decoded


def variable_count(value):
    if isinstance(value, list):
        return len(value)
    if isinstance(value, dict):
        for key in ("count", "variable_count", "variableCount"):
            if key in value:
                try:
                    return int(value[key])
                except (TypeError, ValueError):
                    pass
        if "variables" in value:
            return variable_count(value["variables"])
        for nested in value.values():
            count = variable_count(nested)
            if count is not None:
                return count
    if isinstance(value, str):
        try:
            return variable_count(json.loads(value))
        except Exception:
            match = re.search(r'(?:variable_count|variableCount|count)[^0-9]{0,8}(92)\b', value)
            if match:
                return int(match.group(1))
    return None

node_text, _ = tool("get_node", {"node_id": "fig_2287"})
assert "Home / Mobile / Dark" in node_text, node_text

variables_text, variables_value = tool("list_variables")
count = variable_count(variables_value)
assert count == 92, f"expected 92 variables, got {count}: {variables_text[:2000]}"

pages_text, pages_value = tool("list_pages")
assert isinstance(pages_value, dict), pages_text
pages = pages_value.get("pages")
assert isinstance(pages, list) and len(pages) == 23, pages_text
probe_index = next((index for index, page in enumerate(pages) if page.get("id") == "figma-page-21"), None)
assert probe_index is not None, pages_text
tool("set_active_page", {"index": probe_index})

probe_text, _ = tool("find_node_by_name", {"name": "Mobile Route Label"})
assert "fig_6879" in probe_text, probe_text

before_text, _ = tool("read_nodes", {"nodeIds": ["fig_6879"], "depth": 0})
assert "ОБУЧЕНИЕ" in before_text, before_text

tool("set_node_text", {"node_id": "fig_6879", "text": "ОБУЧЕНИЕ · MCP SMOKE"})
mutated_text, _ = tool("read_nodes", {"nodeIds": ["fig_6879"], "depth": 0})
assert "ОБУЧЕНИЕ · MCP SMOKE" in mutated_text, mutated_text

tool("set_node_text", {"node_id": "fig_6879", "text": "ОБУЧЕНИЕ"})
restored_text, _ = tool("read_nodes", {"nodeIds": ["fig_6879"], "depth": 0})
assert "ОБУЧЕНИЕ" in restored_text and "MCP SMOKE" not in restored_text, restored_text

print(json.dumps({"homeNode": "fig_2287", "variables": count, "pageCount": len(pages), "probePage": "figma-page-21", "probeNode": "fig_6879", "writeProbe": "restored"}, ensure_ascii=False))
PY

compose stop mcp >/dev/null
compose rm -sf mcp >/dev/null
[[ ! -d "$OPENPENCIL_STATE_DIR/write.lock" ]]

phase backup-rotation
compose --profile human up -d web
wait_url "http://127.0.0.1:${OPENPENCIL_WEB_LOOPBACK_PORT}/"
compose stop web >/dev/null
compose rm -sf web >/dev/null
[[ "$(find "$OPENPENCIL_BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name 'session-*' | wc -l)" -eq 2 ]]

phase stale-lock-recovery
mkdir "$OPENPENCIL_STATE_DIR/write.lock"
printf 'stale-test\n' > "$OPENPENCIL_STATE_DIR/write.lock/owner"
ENV_FILE="$TMP_ROOT/openpencil.env"
cat > "$ENV_FILE" <<EOF
OPENPENCIL_IMAGE='$OPENPENCIL_IMAGE'
OPENPENCIL_WORKTREE='$OPENPENCIL_WORKTREE'
OPENPENCIL_STATE_DIR='$OPENPENCIL_STATE_DIR'
OPENPENCIL_BACKUP_DIR='$OPENPENCIL_BACKUP_DIR'
OPENPENCIL_UID='$OPENPENCIL_UID'
OPENPENCIL_GID='$OPENPENCIL_GID'
OPENPENCIL_BACKUP_KEEP='$OPENPENCIL_BACKUP_KEEP'
OPENPENCIL_WEB_LOOPBACK_PORT='$OPENPENCIL_WEB_LOOPBACK_PORT'
OPENPENCIL_MCP_PORT='$OPENPENCIL_MCP_PORT'
EOF
OPENPENCIL_ENV_FILE="$ENV_FILE" bash "$DEPLOY_DIR/session.sh" recover-lock
[[ ! -d "$OPENPENCIL_STATE_DIR/write.lock" ]]

phase final-source-identity
assert_source_identity
printf 'OpenPencil self-host smoke passed: web loopback, MCP loopback/read/write, lock, backup, recovery.\n'
