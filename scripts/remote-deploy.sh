#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

ENVIRONMENT="${1:?environment is required: stage or prod}"
IMAGE_TAG="${2:?image tag is required}"
PUBLIC_URL="${3:?public URL is required}"
GHCR_USER="${4:?GHCR user is required}"
GHCR_TOKEN="$(cat)"
DOCKER_CONFIG_DIR=""

cleanup() {
  local status=$?
  trap - EXIT
  unset GHCR_TOKEN
  if [[ -n "$DOCKER_CONFIG_DIR" ]]; then
    rm -rf -- "$DOCKER_CONFIG_DIR"
  fi
  exit "$status"
}

trap cleanup EXIT
trap 'exit 130' HUP INT TERM

if [[ "$(id -u)" -ne 0 ]]; then
  echo "remote deployment must run as root" >&2
  exit 1
fi

[[ -n "$GHCR_TOKEN" ]] || {
  echo "GHCR token is empty" >&2
  exit 1
}

[[ "$IMAGE_TAG" =~ ^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$ ]] || {
  echo "image tag is not a valid OCI tag" >&2
  exit 1
}

[[ "$PUBLIC_URL" == http://* || "$PUBLIC_URL" == https://* ]] || {
  echo "public URL must use http or https" >&2
  exit 1
}

[[ "$PUBLIC_URL" != *$'\n'* && "$PUBLIC_URL" != *"'"* ]] || {
  echo "public URL contains unsupported characters" >&2
  exit 1
}

[[ "$GHCR_USER" =~ ^[A-Za-z0-9][A-Za-z0-9-]{0,38}$ ]] || {
  echo "GHCR user contains unsupported characters" >&2
  exit 1
}

case "$ENVIRONMENT" in
  stage)
    COMPOSE_FILE="deploy/compose/docker-compose.stage.yml"
    ENV_FILE="deploy/env/stage.env"
    POSTGRES_DB="lexigo_stage"
    POSTGRES_USER="lexigo_stage"
    LOG_LEVEL="debug"
    ;;
  prod)
    COMPOSE_FILE="deploy/compose/docker-compose.prod.yml"
    ENV_FILE="deploy/env/prod.env"
    POSTGRES_DB="lexigo_prod"
    POSTGRES_USER="lexigo_prod"
    LOG_LEVEL="info"
    ;;
  *)
    echo "unsupported environment: $ENVIRONMENT" >&2
    exit 2
    ;;
esac

if ! command -v docker >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y ca-certificates curl openssl docker.io
fi

if ! docker compose version >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  if ! apt-get install -y docker-compose-v2; then
    apt-get install -y docker-compose-plugin
  fi
fi

systemctl enable --now docker

install -d -m 700 "$(dirname "$ENV_FILE")"

upsert_env() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

if [[ ! -s "$ENV_FILE" ]]; then
  POSTGRES_PASSWORD="$(openssl rand -hex 32)"
  REDIS_PASSWORD="$(openssl rand -hex 32)"
  JWT_SECRET="$(openssl rand -hex 64)"

  cat > "$ENV_FILE" <<EOF
APP_ENV=$ENVIRONMENT
CADDY_SITE_ADDRESS=$PUBLIC_URL
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
API_INTERNAL_URL=http://api:8080
NEXT_PUBLIC_API_BASE_URL=
EOF
else
  upsert_env APP_ENV "$ENVIRONMENT"
  upsert_env CADDY_SITE_ADDRESS "$PUBLIC_URL"
  upsert_env IMAGE_TAG "$IMAGE_TAG"
  upsert_env LOG_LEVEL "$LOG_LEVEL"
  upsert_env CORS_ALLOWED_ORIGIN "$PUBLIC_URL"
fi

chmod 600 "$ENV_FILE"

DOCKER_CONFIG_DIR="$(mktemp -d /tmp/lexigo-docker-config.XXXXXX)"
export DOCKER_CONFIG="$DOCKER_CONFIG_DIR"

printf '%s' "$GHCR_TOKEN" \
  | docker login ghcr.io -u "$GHCR_USER" --password-stdin
unset GHCR_TOKEN

export IMAGE_TAG
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

"${COMPOSE[@]}" pull
if ! "${COMPOSE[@]}" up -d --remove-orphans; then
  "${COMPOSE[@]}" ps || true
  "${COMPOSE[@]}" logs --tail=200 || true
  exit 1
fi

SITE_HOST="${PUBLIC_URL#*://}"
SITE_HOST="${SITE_HOST%%/*}"

for attempt in $(seq 1 30); do
  if curl -fsS -H "Host: $SITE_HOST" http://127.0.0.1/health/ready >/dev/null; then
    "${COMPOSE[@]}" ps
    echo "$ENVIRONMENT deployment is healthy at $PUBLIC_URL"
    exit 0
  fi
  sleep 5
done

"${COMPOSE[@]}" ps
"${COMPOSE[@]}" logs --tail=200
exit 1
