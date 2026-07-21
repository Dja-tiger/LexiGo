#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf -- "$TMP_DIR"' EXIT

mkdir -p "$TMP_DIR/bin" "$TMP_DIR/workspace/frontend" "$TMP_DIR/workspace/deploy"

cat > "$TMP_DIR/bin/docker" <<'DOCKER_STUB'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >> "${DOCKER_CALLS:?}"
DOCKER_STUB
chmod +x "$TMP_DIR/bin/docker"

DOCKER_CALLS="$TMP_DIR/docker.calls" \
PATH="$TMP_DIR/bin:$PATH" \
GITHUB_WORKSPACE="$TMP_DIR/workspace" \
GITHUB_REPOSITORY="Dja-tiger/LexiGo" \
GITHUB_RUN_ID="123" \
GITHUB_RUN_ATTEMPT="1" \
GITHUB_JOB="deploy" \
FRONTEND_CI_VOLUME="lexigo-frontend-test" \
PUBLIC_URL="https://stage.example.test" \
EXPECTED_CSP_MODE="report-only" \
bash "$ROOT_DIR/scripts/ci/frontend-container.sh" shell <<'CONTAINER_SCRIPT'
printf 'container started\n'
CONTAINER_SCRIPT

grep -Fq -- '--env PUBLIC_URL=https://stage.example.test' "$TMP_DIR/docker.calls"
grep -Fq -- '--env EXPECTED_CSP_MODE=report-only' "$TMP_DIR/docker.calls"

printf '[frontend-container-test] public browser environment forwarding passed\n'
