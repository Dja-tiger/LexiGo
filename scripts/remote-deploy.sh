#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

ENVIRONMENT="${1:?environment is required: stage or prod}"
IMAGE_TAG="${2:?image tag is required}"
PUBLIC_URL="${3:?frontend public URL is required}"
API_PUBLIC_URL="${4:?API public URL is required}"
ACME_EMAIL="${5:?ACME email is required}"
GHCR_USER="${6:?GHCR user is required}"
GHCR_TOKEN=""
CLOUDFLARE_API_TOKEN=""
DOCKER_CONFIG_DIR=""
CADDY_ENV_TEMP=""

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
    ;;
  prod)
    COMPOSE_FILE="deploy/compose/docker-compose.prod.yml"
    APP_ENV_FILE="deploy/env/prod.env"
    CADDY_ENV_FILE="deploy/env/prod.caddy.env"
    POSTGRES_DB="lexigo_prod"
    POSTGRES_USER="lexigo_prod"
    LOG_LEVEL="info"
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
EOF
else
  upsert_env "$APP_ENV_FILE" APP_ENV "$ENVIRONMENT"
  upsert_env "$APP_ENV_FILE" IMAGE_TAG "$IMAGE_TAG"
  upsert_env "$APP_ENV_FILE" LOG_LEVEL "$LOG_LEVEL"
  upsert_env "$APP_ENV_FILE" CORS_ALLOWED_ORIGIN "$PUBLIC_URL"
  upsert_env "$APP_ENV_FILE" SESSION_COOKIE_SECURE "true"
fi
chmod 0600 "$APP_ENV_FILE"

CADDY_ENV_TEMP="$(mktemp deploy/env/.caddy-env.XXXXXX)"
cat > "$CADDY_ENV_TEMP" <<EOF
CADDY_SITE_ADDRESS=$SITE_HOST
CADDY_API_ADDRESS=$API_HOST
ACME_EMAIL=$ACME_EMAIL
CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN
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
"${COMPOSE[@]}" pull postgres redis api web
"${COMPOSE[@]}" build --pull caddy
docker run --rm --entrypoint caddy lexigo-caddy:2.11.4-cloudflare list-modules | grep -Fxq 'dns.providers.cloudflare'

if ! "${COMPOSE[@]}" up -d --remove-orphans; then
  "${COMPOSE[@]}" ps || true
  "${COMPOSE[@]}" logs --tail=200 || true
  exit 1
fi
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

check_endpoint() {
  local host="$1"
  curl --fail --silent --show-error --max-time 20 \
    --resolve "$host:443:127.0.0.1" "https://$host/health/ready" >/dev/null
}
for attempt in $(seq 1 60); do
  if check_endpoint "$SITE_HOST" && check_endpoint "$API_HOST"; then
    "${COMPOSE[@]}" ps
    /usr/local/sbin/lexigo-certificate-health "$ENVIRONMENT"
    systemctl list-timers "lexigo-certificate-health@${ENVIRONMENT}.timer" --no-pager
    echo "$ENVIRONMENT deployment is healthy at $PUBLIC_URL and $API_PUBLIC_URL"
    exit 0
  fi
  sleep 5
done

"${COMPOSE[@]}" ps
"${COMPOSE[@]}" logs --tail=200 caddy api web
exit 1
