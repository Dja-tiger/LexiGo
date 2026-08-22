#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

ENVIRONMENT="${1:?environment is required: stage or prod}"
IMAGE_TAG="${2:?image tag is required}"
REQUESTED_IMAGE_TAG="$IMAGE_TAG"
PUBLIC_URL="${3:?frontend public URL is required}"
API_PUBLIC_URL="${4:?API public URL is required}"
ACME_EMAIL="${5:?ACME email is required}"
GHCR_USER="${6:?GHCR user is required}"
CADDY_IMAGE="ghcr.io/dja-tiger/lexigo-caddy:2.11.4-cloudflare-v0.2.4"
GHCR_TOKEN=""
CLOUDFLARE_API_TOKEN=""
DOCKER_CONFIG_DIR=""
CADDY_ENV_TEMP=""
PREVIOUS_IMAGE_TAG=""
DEPLOY_START_FAILED=0

IFS= read -r GHCR_TOKEN
IFS= read -r CLOUDFLARE_API_TOKEN

cleanup() {
  local status=$?
  trap - EXIT
  unset GHCR_TOKEN CLOUDFLARE_API_TOKEN
  [[ -z "$CADDY_ENV_TEMP" ]] || rm -f -- "$CADDY_ENV_TEMP"
  [[ -z "$DOCKER_CONFIG_DIR" ]] || rm -rf -- "$DOCKER_CONFIG_DIR"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' HUP INT TERM

die() { printf '[remote-deploy] ERROR: %s\n' "$*" >&2; exit 1; }
log() { printf '[remote-deploy] %s\n' "$*"; }

HTTP_READINESS_LIBRARY="$PROJECT_ROOT/deploy/http-readiness.sh"
[[ -r "$HTTP_READINESS_LIBRARY" ]] || die "HTTP readiness library is missing: $HTTP_READINESS_LIBRARY"
# shellcheck source=../deploy/http-readiness.sh
source "$HTTP_READINESS_LIBRARY"

[[ "$(id -u)" -eq 0 ]] || die "remote deployment must run as root"
[[ -n "$GHCR_TOKEN" ]] || die "GHCR token is empty"
[[ -n "$CLOUDFLARE_API_TOKEN" ]] || die "Cloudflare API token is empty"
[[ "$CLOUDFLARE_API_TOKEN" != *$'\n'* ]] || die "Cloudflare API token contains a newline"
[[ "$IMAGE_TAG" =~ ^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$ ]] || die "image tag is not a valid OCI tag"
for origin in "$PUBLIC_URL" "$API_PUBLIC_URL"; do
  [[ "$origin" =~ ^https://[A-Za-z0-9.-]+$ ]] || die "public URLs must be HTTPS origins without paths"
done
[[ "$PUBLIC_URL" != "$API_PUBLIC_URL" ]] || die "frontend and API public URLs must be different"
[[ "$ACME_EMAIL" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]] || die "ACME_EMAIL must be valid"
[[ "$GHCR_USER" =~ ^[A-Za-z0-9][A-Za-z0-9-]{0,38}$ ]] || die "GHCR user contains unsupported characters"

SITE_HOST="${PUBLIC_URL#https://}"
API_HOST="${API_PUBLIC_URL#https://}"

case "$ENVIRONMENT" in
  stage)
    COMPOSE_FILE="deploy/compose/docker-compose.stage.yml"
    APP_ENV_FILE="deploy/env/stage.env"
    CADDY_ENV_FILE="deploy/env/stage.caddy.env"
    POSTGRES_DB="lexigo_stage"
    POSTGRES_USER="lexigo_stage"
    LOG_LEVEL="debug"
    CONTENT_SECURITY_POLICY_MODE="report-only"
    HSTS_MAX_AGE="86400"
    ;;
  prod)
    COMPOSE_FILE="deploy/compose/docker-compose.prod.yml"
    APP_ENV_FILE="deploy/env/prod.env"
    CADDY_ENV_FILE="deploy/env/prod.caddy.env"
    POSTGRES_DB="lexigo_prod"
    POSTGRES_USER="lexigo_prod"
    LOG_LEVEL="info"
    CONTENT_SECURITY_POLICY_MODE="enforce"
    HSTS_MAX_AGE="15552000"
    ;;
  *) die "unsupported environment: $ENVIRONMENT" ;;
esac

if ! command -v docker >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y ca-certificates curl openssl docker.io
fi
if ! docker compose version >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  if ! apt-get install -y docker-compose-v2; then apt-get install -y docker-compose-plugin; fi
fi
for command in curl openssl systemctl; do
  command -v "$command" >/dev/null 2>&1 || die "required command is missing: $command"
done

systemctl enable --now docker
install -d -m 0700 deploy/env /etc/lexigo

upsert_env() {
  local file="$1" key="$2" value="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

if [[ -s "$APP_ENV_FILE" ]]; then
  PREVIOUS_IMAGE_TAG="$(sed -n 's/^IMAGE_TAG=//p' "$APP_ENV_FILE" | tail -n 1)"
  if [[ -n "$PREVIOUS_IMAGE_TAG" && ! "$PREVIOUS_IMAGE_TAG" =~ ^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$ ]]; then
    log "ignoring invalid previous image tag from $APP_ENV_FILE"
    PREVIOUS_IMAGE_TAG=""
  fi
fi

if [[ ! -s "$APP_ENV_FILE" ]]; then
  POSTGRES_PASSWORD="$(openssl rand -hex 32)"
  REDIS_PASSWORD="$(openssl rand -hex 32)"
  JWT_SECRET="$(openssl rand -hex 64)"
  cat > "$APP_ENV_FILE" <<EOF
APP_ENV=$ENVIRONMENT
IMAGE_TAG=$IMAGE_TAG
HTTP_ADDR=:8080
LOG_LEVEL=$LOG_LEVEL
CORS_ALLOWED_ORIGIN=$PUBLIC_URL
POSTGRES_DB=$POSTGRES_DB
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DSN=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/$POSTGRES_DB?sslmode=disable
REDIS_ADDR=redis:6379
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_DB=0
JWT_SECRET=$JWT_SECRET
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=720h
SESSION_COOKIE_SECURE=true
API_INTERNAL_URL=http://api:8080
NEXT_PUBLIC_API_BASE_URL=
CONTENT_SECURITY_POLICY_MODE=$CONTENT_SECURITY_POLICY_MODE
EOF
else
  upsert_env "$APP_ENV_FILE" APP_ENV "$ENVIRONMENT"
  upsert_env "$APP_ENV_FILE" IMAGE_TAG "$IMAGE_TAG"
  upsert_env "$APP_ENV_FILE" LOG_LEVEL "$LOG_LEVEL"
  upsert_env "$APP_ENV_FILE" CORS_ALLOWED_ORIGIN "$PUBLIC_URL"
  upsert_env "$APP_ENV_FILE" SESSION_COOKIE_SECURE "true"
  upsert_env "$APP_ENV_FILE" CONTENT_SECURITY_POLICY_MODE "$CONTENT_SECURITY_POLICY_MODE"
fi
chmod 0600 "$APP_ENV_FILE"

CADDY_ENV_TEMP="$(mktemp deploy/env/.caddy-env.XXXXXX)"
cat > "$CADDY_ENV_TEMP" <<EOF
CADDY_SITE_ADDRESS=$SITE_HOST
CADDY_API_ADDRESS=$API_HOST
ACME_EMAIL=$ACME_EMAIL
CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN
HSTS_MAX_AGE=$HSTS_MAX_AGE
EOF
install -m 0600 "$CADDY_ENV_TEMP" "$CADDY_ENV_FILE"
rm -f -- "$CADDY_ENV_TEMP"
CADDY_ENV_TEMP=""
unset CLOUDFLARE_API_TOKEN

DOCKER_CONFIG_DIR="$(mktemp -d /tmp/lexigo-docker-config.XXXXXX)"
export DOCKER_CONFIG="$DOCKER_CONFIG_DIR"
printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
unset GHCR_TOKEN

export IMAGE_TAG
COMPOSE=(docker compose --env-file "$APP_ENV_FILE" -f "$COMPOSE_FILE")
"${COMPOSE[@]}" pull postgres redis api web caddy
docker run --rm --entrypoint caddy "$CADDY_IMAGE" list-modules | grep -Fxq 'dns.providers.cloudflare'

if ! "${COMPOSE[@]}" up -d --remove-orphans; then
  DEPLOY_START_FAILED=1
else
  "${COMPOSE[@]}" exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

  install -m 0750 deploy/certificate-health.sh /usr/local/sbin/lexigo-certificate-health
  install -m 0644 deploy/systemd/lexigo-certificate-health@.service /etc/systemd/system/
  install -m 0644 deploy/systemd/lexigo-certificate-health@.timer /etc/systemd/system/
  cat > "/etc/lexigo/certificate-health-${ENVIRONMENT}.conf" <<EOF
PROJECT_ROOT=$PROJECT_ROOT
COMPOSE_FILE=$PROJECT_ROOT/$COMPOSE_FILE
APP_ENV_FILE=$PROJECT_ROOT/$APP_ENV_FILE
SITE_HOST=$SITE_HOST
API_HOST=$API_HOST
CERT_RENEW_BEFORE_SECONDS=1814400
EOF
  chmod 0600 "/etc/lexigo/certificate-health-${ENVIRONMENT}.conf"
  systemctl daemon-reload
  systemctl enable --now "lexigo-certificate-health@${ENVIRONMENT}.timer"
fi

check_frontend_endpoint() {
  lexigo_http_response_contains \
    'LexiGo' \
    "https://$SITE_HOST/?lexigo_readiness=$REQUESTED_IMAGE_TAG" \
    --max-time 20 \
    --resolve "$SITE_HOST:443:127.0.0.1"
}

check_api_endpoint() {
  curl --fail --silent --show-error --max-time 20 \
    --resolve "$API_HOST:443:127.0.0.1" \
    "https://$API_HOST/health/ready" >/dev/null
}

wait_for_readiness() {
  local attempt
  for attempt in $(seq 1 60); do
    if check_frontend_endpoint && check_api_endpoint; then
      return 0
    fi
    if (( attempt == 1 || attempt % 10 == 0 )); then
      log "waiting for frontend UI and API readiness ($attempt/60)"
    fi
    sleep 5
  done
  return 1
}

print_http_diagnostic() (
  local label="$1" host="$2" path="$3"
  local body_file headers_file
  body_file="$(mktemp)"
  headers_file="$(mktemp)"
  trap 'rm -f -- "$body_file" "$headers_file"' EXIT

  local status
  status="$(curl \
    --silent \
    --show-error \
    --max-time 15 \
    --resolve "$host:443:127.0.0.1" \
    --output "$body_file" \
    --dump-header "$headers_file" \
    --write-out '%{http_code}' \
    "https://$host$path" || true)"

  log "$label local Caddy probe returned HTTP ${status:-000}"
  sed -n '1,30p' "$headers_file" || true
  head -c 2000 "$body_file" || true
  printf '\n'
)

print_service_state() {
  local service="$1" container_id
  container_id="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null | head -n 1 || true)"
  if [[ -z "$container_id" ]]; then
    log "$service container is not present"
    return 0
  fi

  log "$service container state"
  docker inspect --format \
    'status={{.State.Status}} running={{.State.Running}} restarting={{.State.Restarting}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}} error={{printf "%q" .State.Error}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
    "$container_id" || true
  docker inspect --format \
    '{{if .State.Health}}{{range .State.Health.Log}}{{println .Start "exit=" .ExitCode .Output}}{{end}}{{end}}' \
    "$container_id" 2>/dev/null | tail -n 5 || true
}

print_service_logs() {
  local service="$1"
  log "$service logs (last 120 lines)"
  "${COMPOSE[@]}" logs --no-color --tail=120 "$service" || true
}

print_deployment_diagnostics() {
  "${COMPOSE[@]}" ps || true
  print_service_state postgres
  print_service_state redis
  print_service_state api
  print_service_state web
  print_service_logs postgres
  print_service_logs redis
  print_http_diagnostic "frontend root" "$SITE_HOST" "/?lexigo_diagnostic=$REQUESTED_IMAGE_TAG" || true
  print_http_diagnostic "API readiness" "$API_HOST" "/health/ready" || true
  "${COMPOSE[@]}" logs --no-color --tail=200 caddy api web || true
}

rollback_to_previous_image() {
  if [[ -z "$PREVIOUS_IMAGE_TAG" || "$PREVIOUS_IMAGE_TAG" == "$REQUESTED_IMAGE_TAG" ]]; then
    log "no distinct previous image tag is available for rollback"
    return 1
  fi

  log "deployment of $REQUESTED_IMAGE_TAG failed; rolling back to $PREVIOUS_IMAGE_TAG"
  upsert_env "$APP_ENV_FILE" IMAGE_TAG "$PREVIOUS_IMAGE_TAG"
  export IMAGE_TAG="$PREVIOUS_IMAGE_TAG"

  if ! "${COMPOSE[@]}" pull api web; then
    log "rollback image pull failed"
    print_deployment_diagnostics
    return 1
  fi
  if ! "${COMPOSE[@]}" up -d --remove-orphans; then
    log "rollback compose update failed"
    print_deployment_diagnostics
    return 1
  fi
  if ! wait_for_readiness; then
    log "rollback did not restore healthy frontend and API endpoints"
    print_deployment_diagnostics
    return 1
  fi

  log "rollback restored healthy frontend and API endpoints with image $PREVIOUS_IMAGE_TAG"
  "${COMPOSE[@]}" ps
  return 0
}

if [[ "$DEPLOY_START_FAILED" -eq 1 ]]; then
  log "docker compose failed while starting image $REQUESTED_IMAGE_TAG"
  print_deployment_diagnostics
  if rollback_to_previous_image; then
    die "deployment failed during compose startup; previous image $PREVIOUS_IMAGE_TAG was restored"
  fi
  die "deployment failed during compose startup and automatic rollback could not restore service"
fi

if wait_for_readiness; then
  "${COMPOSE[@]}" ps
  /usr/local/sbin/lexigo-certificate-health "$ENVIRONMENT"
  systemctl list-timers "lexigo-certificate-health@${ENVIRONMENT}.timer" --no-pager
  echo "$ENVIRONMENT deployment has a healthy frontend UI and API at $PUBLIC_URL and $API_PUBLIC_URL"
  exit 0
fi

log "deployment health check failed for image $REQUESTED_IMAGE_TAG"
print_deployment_diagnostics
if rollback_to_previous_image; then
  die "deployment failed; previous image $PREVIOUS_IMAGE_TAG was restored"
fi
die "deployment failed and automatic rollback could not restore service"
