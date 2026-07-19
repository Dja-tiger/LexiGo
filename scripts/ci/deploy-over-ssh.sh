#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
umask 077

ENVIRONMENT="${1:?environment is required: stage or prod}"
IMAGE_TAG="${2:?image tag is required}"

RUNNER_TEMP="${RUNNER_TEMP:?RUNNER_TEMP is required}"
GITHUB_RUN_ID="${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"
GITHUB_RUN_ATTEMPT="${GITHUB_RUN_ATTEMPT:?GITHUB_RUN_ATTEMPT is required}"
SSH_KEY="${SSH_KEY:?SSH_KEY is required}"
DEPLOY_KNOWN_HOSTS="${DEPLOY_KNOWN_HOSTS:?DEPLOY_KNOWN_HOSTS is required}"
DEPLOY_HOST="${DEPLOY_HOST:?DEPLOY_HOST is required}"
DEPLOY_USER="${DEPLOY_USER:?DEPLOY_USER is required}"
DEPLOY_PATH="${DEPLOY_PATH:?DEPLOY_PATH is required}"
PUBLIC_URL="${PUBLIC_URL:?PUBLIC_URL is required}"
API_PUBLIC_URL="${API_PUBLIC_URL:?API_PUBLIC_URL is required}"
ACME_EMAIL="${ACME_EMAIL:?ACME_EMAIL is required}"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
GHCR_USER="${GHCR_USER:?GHCR_USER is required}"
GHCR_TOKEN="${GHCR_TOKEN:?GHCR_TOKEN is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RUN_DIR="$RUNNER_TEMP/lexigo-deploy-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
KNOWN_HOSTS_FILE="$RUN_DIR/known_hosts"
ARCHIVE_FILE="$RUN_DIR/lexigo-deploy.tgz"
AGENT_SOCKET="$RUN_DIR/agent.sock"
LOG_FILE="$RUNNER_TEMP/lexigo-${ENVIRONMENT}-deploy.log"
REMOTE_ARCHIVE="/tmp/lexigo-deploy-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}.tgz"
TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
SSH_AGENT_PID=""

log() { printf '[deploy] %s\n' "$*"; }
die() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

cleanup() {
  local status=$?
  trap - EXIT
  unset SSH_KEY DEPLOY_KNOWN_HOSTS GHCR_TOKEN CLOUDFLARE_API_TOKEN
  if [[ -n "$SSH_AGENT_PID" ]]; then
    ssh-agent -k >/dev/null 2>&1 || kill "$SSH_AGENT_PID" >/dev/null 2>&1 || true
  fi
  rm -rf -- "$RUN_DIR"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' HUP INT TERM

case "$ENVIRONMENT" in stage|prod) ;; *) die "unsupported environment: $ENVIRONMENT" ;; esac
[[ "$IMAGE_TAG" =~ ^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$ ]] || die "image tag is not a valid OCI tag"
[[ "$DEPLOY_HOST" =~ ^[A-Za-z0-9.-]+$ ]] || die "DEPLOY_HOST contains unsupported characters"
[[ "$DEPLOY_USER" =~ ^[A-Za-z_][A-Za-z0-9_.-]*$ ]] || die "DEPLOY_USER contains unsupported characters"
[[ "$DEPLOY_PATH" =~ ^/opt(/[A-Za-z0-9._-]+)+$ ]] || die "DEPLOY_PATH must be a normalized path below /opt"
for origin in "$PUBLIC_URL" "$API_PUBLIC_URL"; do
  [[ "$origin" =~ ^https://[A-Za-z0-9.-]+$ ]] || die "public URLs must be HTTPS origins without paths"
done
[[ "$PUBLIC_URL" != "$API_PUBLIC_URL" ]] || die "frontend and API public URLs must be different"
[[ "$ACME_EMAIL" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]] || die "ACME_EMAIL must be valid"
[[ "$CLOUDFLARE_API_TOKEN" != *$'\n'* ]] || die "Cloudflare token contains a newline"
[[ "$GHCR_USER" =~ ^[A-Za-z0-9][A-Za-z0-9-]{0,38}$ ]] || die "GHCR_USER contains unsupported characters"
[[ -d "$PROJECT_ROOT/deploy" ]] || die "deploy directory is missing"
[[ -f "$PROJECT_ROOT/scripts/remote-deploy.sh" ]] || die "remote deployment script is missing"

rm -rf -- "$RUN_DIR"
install -d -m 0700 "$RUN_DIR"
: > "$LOG_FILE"
chmod 0600 "$LOG_FILE"
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$KNOWN_HOSTS_FILE"
chmod 0600 "$KNOWN_HOSTS_FILE"
unset DEPLOY_KNOWN_HOSTS

export SSH_AUTH_SOCK="$AGENT_SOCKET"
export SSH_ASKPASS_REQUIRE=never
eval "$(ssh-agent -a "$AGENT_SOCKET" -t 1800 -s)" >/dev/null
printf '%s\n' "$SSH_KEY" | ssh-add - >/dev/null
unset SSH_KEY
ssh-add -l >/dev/null

SSH_OPTIONS=(
  -o BatchMode=yes
  -o "IdentityAgent=$SSH_AUTH_SOCK"
  -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=$KNOWN_HOSTS_FILE"
  -o ConnectTimeout=15
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=3
)

log "building deployment bundle"
tar -C "$PROJECT_ROOT" -czf "$ARCHIVE_FILE" deploy scripts/remote-deploy.sh
log "uploading deployment bundle"
scp "${SSH_OPTIONS[@]}" "$ARCHIVE_FILE" "$TARGET:$REMOTE_ARCHIVE"
log "extracting deployment bundle"
ssh "${SSH_OPTIONS[@]}" "$TARGET" \
  "set -Eeuo pipefail; trap 'rm -f \"$REMOTE_ARCHIVE\"' EXIT; install -d -m 755 '$DEPLOY_PATH'; tar -xzf '$REMOTE_ARCHIVE' -C '$DEPLOY_PATH'"

log "deploying $ENVIRONMENT image $IMAGE_TAG to $PUBLIC_URL and $API_PUBLIC_URL"
set -o pipefail
printf '%s\n%s\n' "$GHCR_TOKEN" "$CLOUDFLARE_API_TOKEN" \
  | ssh "${SSH_OPTIONS[@]}" "$TARGET" \
      "bash '$DEPLOY_PATH/scripts/remote-deploy.sh' '$ENVIRONMENT' '$IMAGE_TAG' '$PUBLIC_URL' '$API_PUBLIC_URL' '$ACME_EMAIL' '$GHCR_USER'" \
      2>&1 \
  | tee "$LOG_FILE"
unset GHCR_TOKEN CLOUDFLARE_API_TOKEN
log "$ENVIRONMENT deployment completed"
