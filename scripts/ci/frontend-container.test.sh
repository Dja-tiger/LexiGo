#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf -- "$TMP_DIR"' EXIT

mkdir -p \
  "$TMP_DIR/bin" \
  "$TMP_DIR/workspace/frontend" \
  "$TMP_DIR/workspace/deploy" \
  "$TMP_DIR/workspace/docs"
printf '# Test repository\n' > "$TMP_DIR/workspace/README.md"
printf '# Test architecture\n' > "$TMP_DIR/workspace/docs/architecture.md"

cat > "$TMP_DIR/bin/docker" <<'DOCKER_STUB'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >> "${DOCKER_CALLS:?}"

if [[ "${1:-}" == "run" && -n "${LOCK_EVENTS:-}" ]]; then
  label="other"
  case " $* " in
    *" shared-a "*) label="shared-a" ;;
    *" shared-b "*) label="shared-b" ;;
    *" shared-hold "*) label="shared-hold" ;;
    *" test:e2e:performance "*) label="performance" ;;
  esac
  printf 'start %s\n' "$label" >> "$LOCK_EVENTS"
  case "$label" in
    shared-a|shared-b|shared-hold)
      sleep 1
      ;;
  esac
  printf 'end %s\n' "$label" >> "$LOCK_EVENTS"
fi
DOCKER_STUB
chmod +x "$TMP_DIR/bin/docker"

COMMON_ENV=(
  "DOCKER_CALLS=$TMP_DIR/docker.calls"
  "LOCK_EVENTS=$TMP_DIR/lock.events"
  "PATH=$TMP_DIR/bin:$PATH"
  "GITHUB_WORKSPACE=$TMP_DIR/workspace"
  "GITHUB_REPOSITORY=Dja-tiger/LexiGo"
  "GITHUB_RUN_ID=123"
  "GITHUB_RUN_ATTEMPT=1"
  "FRONTEND_CI_VOLUME=lexigo-frontend-test"
  "FRONTEND_RESOURCE_LOCK=$TMP_DIR/frontend-resource.lock"
)

env "${COMMON_ENV[@]}" \
  GITHUB_JOB="deploy" \
  FRONTEND_CI_SLOT="stage-public" \
  PUBLIC_URL="https://stage.example.test" \
  EXPECTED_CSP_MODE="report-only" \
  bash "$ROOT_DIR/scripts/ci/frontend-container.sh" shell <<'CONTAINER_SCRIPT'
printf 'container started\n'
CONTAINER_SCRIPT

grep -Fq -- '--env PUBLIC_URL=https://stage.example.test' "$TMP_DIR/docker.calls"
grep -Fq -- '--env EXPECTED_CSP_MODE=report-only' "$TMP_DIR/docker.calls"
grep -Fq -- '--name lexigo-frontend-task-stage-public-123-1' "$TMP_DIR/docker.calls"
grep -Fq -- "--volume $TMP_DIR/workspace/README.md:/repository/README.md:ro" "$TMP_DIR/docker.calls"
grep -Fq -- "--volume $TMP_DIR/workspace/docs:/repository/docs:ro" "$TMP_DIR/docker.calls"

if env "${COMMON_ENV[@]}" \
  GITHUB_JOB="frontend-browser" \
  FRONTEND_CI_SLOT="../shared" \
  bash "$ROOT_DIR/scripts/ci/frontend-container.sh" shell \
    >"$TMP_DIR/invalid-slot.log" 2>&1 <<'CONTAINER_SCRIPT'; then
printf 'container must not start\n'
CONTAINER_SCRIPT
  printf '[frontend-container-test] invalid CI slot was accepted\n' >&2
  exit 1
fi

grep -Fq 'invalid frontend CI slot: ../shared' "$TMP_DIR/invalid-slot.log"

: > "$TMP_DIR/lock.events"
env "${COMMON_ENV[@]}" GITHUB_JOB="shared-a" FRONTEND_CI_SLOT="shared-a" \
  bash "$ROOT_DIR/scripts/ci/frontend-container.sh" exec printf shared-a &
shared_a_pid=$!
env "${COMMON_ENV[@]}" GITHUB_JOB="shared-b" FRONTEND_CI_SLOT="shared-b" \
  bash "$ROOT_DIR/scripts/ci/frontend-container.sh" exec printf shared-b &
shared_b_pid=$!
wait "$shared_a_pid" "$shared_b_pid"

mapfile -t shared_events < "$TMP_DIR/lock.events"
if [[ "${#shared_events[@]}" -ne 4 ]]; then
  printf '[frontend-container-test] unexpected shared lock events: %s\n' "${shared_events[*]}" >&2
  exit 1
fi
if [[ "${shared_events[0]}" != start\ shared-* || "${shared_events[1]}" != start\ shared-* ]]; then
  printf '[frontend-container-test] shared workloads did not overlap: %s\n' "${shared_events[*]}" >&2
  exit 1
fi

: > "$TMP_DIR/lock.events"
env "${COMMON_ENV[@]}" GITHUB_JOB="shared-hold" FRONTEND_CI_SLOT="shared-hold" \
  bash "$ROOT_DIR/scripts/ci/frontend-container.sh" exec printf shared-hold &
shared_pid=$!

for _ in $(seq 1 100); do
  if grep -Fq 'start shared-hold' "$TMP_DIR/lock.events"; then
    break
  fi
  sleep 0.02
done
grep -Fq 'start shared-hold' "$TMP_DIR/lock.events"

env "${COMMON_ENV[@]}" GITHUB_JOB="performance" FRONTEND_CI_SLOT="performance" \
  bash "$ROOT_DIR/scripts/ci/frontend-container.sh" exec npm run test:e2e:performance &
performance_pid=$!
wait "$shared_pid" "$performance_pid"

mapfile -t exclusive_events < "$TMP_DIR/lock.events"
expected_events=(
  "start shared-hold"
  "end shared-hold"
  "start performance"
  "end performance"
)
if [[ "${exclusive_events[*]}" != "${expected_events[*]}" ]]; then
  printf '[frontend-container-test] exclusive performance lock order is invalid: %s\n' "${exclusive_events[*]}" >&2
  exit 1
fi

printf '[frontend-container-test] environment forwarding, read-only docs and resource locks passed\n'
