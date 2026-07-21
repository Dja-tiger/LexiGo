#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

COMMAND="${1:-}"
PLAYWRIGHT_IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.61.1-noble}"
FRONTEND_CI_VOLUME="${FRONTEND_CI_VOLUME:?FRONTEND_CI_VOLUME is required}"
GITHUB_WORKSPACE="${GITHUB_WORKSPACE:?GITHUB_WORKSPACE is required}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
GITHUB_RUN_ID="${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"
GITHUB_RUN_ATTEMPT="${GITHUB_RUN_ATTEMPT:?GITHUB_RUN_ATTEMPT is required}"
GITHUB_JOB="${GITHUB_JOB:?GITHUB_JOB is required}"
FRONTEND_CI_SLOT="${FRONTEND_CI_SLOT:-$GITHUB_JOB}"
APP_BUILD_ID="${APP_BUILD_ID:-local}"
PUBLIC_URL="${PUBLIC_URL:-}"
EXPECTED_CSP_MODE="${EXPECTED_CSP_MODE:-}"
NEXT_PUBLIC_RUM_SAMPLE_RATE="${NEXT_PUBLIC_RUM_SAMPLE_RATE:-0.1}"
SOURCE_DIR="${GITHUB_WORKSPACE}/frontend"
DEPLOY_DIR="${GITHUB_WORKSPACE}/deploy"
WORK_DIR="/workspace"
ARTIFACT_DIR="${SOURCE_DIR}/ci-artifacts"
LEASE_CONTAINER="lexigo-frontend-lease-${FRONTEND_CI_SLOT}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
TASK_CONTAINER="lexigo-frontend-task-${FRONTEND_CI_SLOT}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
COPY_CONTAINER="lexigo-frontend-copy-${FRONTEND_CI_SLOT}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
EXTRACT_CONTAINER="lexigo-frontend-extract-${FRONTEND_CI_SLOT}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
OWNERSHIP_LABELS=(
  --label "com.lexigo.ci=true"
  --label "com.lexigo.ci.repository=${GITHUB_REPOSITORY}"
  --label "com.lexigo.ci.run=${GITHUB_RUN_ID}"
  --label "com.lexigo.ci.attempt=${GITHUB_RUN_ATTEMPT}"
  --label "com.lexigo.ci.job=${GITHUB_JOB}"
)

log() {
  printf '[frontend-ci] %s\n' "$*"
}

die() {
  printf '[frontend-ci] ERROR: %s\n' "$*" >&2
  exit 1
}

[[ "$FRONTEND_CI_VOLUME" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]+$ ]] || \
  die "invalid Docker volume name: $FRONTEND_CI_VOLUME"

[[ "$FRONTEND_CI_SLOT" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]+$ ]] || \
  die "invalid frontend CI slot: $FRONTEND_CI_SLOT"

for container_name in \
  "$LEASE_CONTAINER" \
  "$TASK_CONTAINER" \
  "$COPY_CONTAINER" \
  "$EXTRACT_CONTAINER"; do
  [[ "$container_name" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]+$ ]] || \
    die "invalid Docker container name: $container_name"
done

[[ -d "$SOURCE_DIR" ]] || \
  die "frontend source directory does not exist: $SOURCE_DIR"

[[ -d "$DEPLOY_DIR" ]] || \
  die "deploy directory does not exist: $DEPLOY_DIR"

container_run() {
  docker rm --force "$TASK_CONTAINER" >/dev/null 2>&1 || true
  docker run \
    --rm \
    --init \
    --name "$TASK_CONTAINER" \
    "${OWNERSHIP_LABELS[@]}" \
    --label "com.lexigo.ci.kind=task" \
    --ipc=host \
    --env CI=true \
    --env APP_BUILD_ID="$APP_BUILD_ID" \
    --env PUBLIC_URL="$PUBLIC_URL" \
    --env EXPECTED_CSP_MODE="$EXPECTED_CSP_MODE" \
    --env NEXT_PUBLIC_RUM_SAMPLE_RATE="$NEXT_PUBLIC_RUM_SAMPLE_RATE" \
    --env PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    --volume "$FRONTEND_CI_VOLUME:$WORK_DIR" \
    --volume "$DEPLOY_DIR:/deploy:ro" \
    --workdir "$WORK_DIR" \
    "$PLAYWRIGHT_IMAGE" \
    "$@"
}

prepare() {
  log "preparing isolated Docker volume $FRONTEND_CI_VOLUME"

  docker rm --force \
    "$LEASE_CONTAINER" \
    "$TASK_CONTAINER" \
    "$COPY_CONTAINER" \
    "$EXTRACT_CONTAINER" \
    >/dev/null 2>&1 || true
  docker volume rm --force "$FRONTEND_CI_VOLUME" >/dev/null 2>&1 || true
  docker volume create \
    "${OWNERSHIP_LABELS[@]}" \
    --label "com.lexigo.ci.kind=workspace" \
    "$FRONTEND_CI_VOLUME" >/dev/null

  docker run \
    --rm \
    --init \
    --name "$COPY_CONTAINER" \
    "${OWNERSHIP_LABELS[@]}" \
    --label "com.lexigo.ci.kind=copy" \
    --volume "$SOURCE_DIR:/source:ro" \
    --volume "$FRONTEND_CI_VOLUME:$WORK_DIR" \
    "$PLAYWRIGHT_IMAGE" \
    bash -Eeuo pipefail -c 'cp -a /source/. /workspace/'

  docker run \
    --detach \
    --rm \
    --name "$LEASE_CONTAINER" \
    "${OWNERSHIP_LABELS[@]}" \
    --label "com.lexigo.ci.kind=lease" \
    --volume "$FRONTEND_CI_VOLUME:$WORK_DIR" \
    --entrypoint sleep \
    "$PLAYWRIGHT_IMAGE" \
    3900 >/dev/null
}

execute() {
  shift
  (($# > 0)) || die "exec requires a command"

  if [[ "$#" -eq 3 && "$1" == "npm" && "$2" == "run" && "$3" == "test" ]]; then
    container_run bash -Eeuo pipefail -c '
      node --version
      npm --version
      npm run test 2>&1 | tee vitest.log
    '
    return
  fi

  if [[ "$#" -eq 3 && "$1" == "npm" && "$2" == "run" && "$3" == "typecheck" ]]; then
    container_run bash -Eeuo pipefail -c '
      set -o pipefail
      npm run typecheck 2>&1 | tee typecheck.log
    '
    return
  fi

  container_run "$@"
}

execute_shell() {
  local script
  script="$(cat)"
  [[ -n "$script" ]] || die "shell requires a script on stdin"

  container_run bash -Eeuo pipefail -c "$script"
}

extract_artifacts() {
  log "extracting frontend diagnostics and visual baselines"

  rm -rf -- "$ARTIFACT_DIR"
  mkdir -p "$ARTIFACT_DIR"

  docker run \
    --rm \
    --name "$EXTRACT_CONTAINER" \
    "${OWNERSHIP_LABELS[@]}" \
    --label "com.lexigo.ci.kind=extract" \
    --volume "$FRONTEND_CI_VOLUME:$WORK_DIR:ro" \
    --workdir "$WORK_DIR" \
    "$PLAYWRIGHT_IMAGE" \
    bash -Eeuo pipefail -c '
      paths=()
      for path in \
        eslint.log \
        typecheck.log \
        vitest.log \
        next-start.log \
        playwright-report \
        test-results \
        e2e/visual-regression.spec.ts-snapshots; do
        if [[ -e "$path" ]]; then
          paths+=("$path")
        fi
      done

      if ((${#paths[@]} == 0)); then
        tar -cf - --files-from /dev/null
      else
        tar -cf - "${paths[@]}"
      fi
    ' \
    | tar -C "$ARTIFACT_DIR" -xf -
}

cleanup() {
  log "removing isolated Docker volume $FRONTEND_CI_VOLUME"
  docker rm --force \
    "$LEASE_CONTAINER" \
    "$TASK_CONTAINER" \
    "$COPY_CONTAINER" \
    "$EXTRACT_CONTAINER" \
    >/dev/null 2>&1 || true
  docker volume rm --force "$FRONTEND_CI_VOLUME" >/dev/null 2>&1 || true
}

case "$COMMAND" in
  prepare)
    prepare
    ;;
  exec)
    execute "$@"
    ;;
  shell)
    execute_shell
    ;;
  extract)
    extract_artifacts
    ;;
  cleanup)
    cleanup
    ;;
  *)
    die "usage: $0 {prepare|exec COMMAND...|shell|extract|cleanup}"
    ;;
esac
