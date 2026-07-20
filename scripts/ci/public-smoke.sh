#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

PUBLIC_URL="${1:?frontend public URL is required}"
API_PUBLIC_URL="${2:?API public URL is required}"

for origin in "$PUBLIC_URL" "$API_PUBLIC_URL"; do
  [[ "$origin" =~ ^https://[A-Za-z0-9.-]+$ ]] || {
    printf '[public-smoke] ERROR: public URLs must be HTTPS origins without paths: %s\n' "$origin" >&2
    exit 1
  }
done
[[ "$PUBLIC_URL" != "$API_PUBLIC_URL" ]] || {
  printf '[public-smoke] ERROR: frontend and API public URLs must be different\n' >&2
  exit 1
}

SMOKE_DIR="$(mktemp -d)"
PROBE_ID="${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}-$(date +%s)"
ATTEMPTS="${PUBLIC_SMOKE_ATTEMPTS:-12}"
DELAY_SECONDS="${PUBLIC_SMOKE_DELAY_SECONDS:-5}"

cleanup() {
  rm -rf -- "$SMOKE_DIR"
}
trap cleanup EXIT

[[ "$ATTEMPTS" =~ ^[1-9][0-9]*$ ]] || {
  printf '[public-smoke] ERROR: PUBLIC_SMOKE_ATTEMPTS must be a positive integer\n' >&2
  exit 1
}
[[ "$DELAY_SECONDS" =~ ^[0-9]+$ ]] || {
  printf '[public-smoke] ERROR: PUBLIC_SMOKE_DELAY_SECONDS must be numeric\n' >&2
  exit 1
}

log() {
  printf '[public-smoke] %s\n' "$*"
}

request_endpoint() {
  local label="$1"
  local url="$2"
  local body_file="$3"
  local headers_file="$4"
  local attempt status
  local separator='?'
  [[ "$url" == *\?* ]] && separator='&'

  for attempt in $(seq 1 "$ATTEMPTS"); do
    : > "$body_file"
    : > "$headers_file"
    status="$(curl \
      --silent \
      --show-error \
      --location \
      --connect-timeout 10 \
      --max-time 20 \
      --output "$body_file" \
      --dump-header "$headers_file" \
      --write-out '%{http_code}' \
      "${url}${separator}lexigo_smoke=${PROBE_ID}" || true)"

    if [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
      log "$label returned HTTP $status on attempt $attempt"
      return 0
    fi

    log "$label returned HTTP ${status:-000} on attempt $attempt/$ATTEMPTS"
    if (( attempt < ATTEMPTS )); then
      sleep "$DELAY_SECONDS"
    fi
  done

  printf '[public-smoke] Last response headers for %s:\n' "$label" >&2
  sed -n '1,40p' "$headers_file" >&2 || true
  printf '[public-smoke] Last response body for %s (first 2000 bytes):\n' "$label" >&2
  head -c 2000 "$body_file" >&2 || true
  printf '\n' >&2
  return 1
}

FRONTEND_BODY="$SMOKE_DIR/frontend.body"
FRONTEND_HEADERS="$SMOKE_DIR/frontend.headers"
API_BODY="$SMOKE_DIR/api.body"
API_HEADERS="$SMOKE_DIR/api.headers"

request_endpoint "frontend root" "$PUBLIC_URL/" "$FRONTEND_BODY" "$FRONTEND_HEADERS"
if ! grep -Fq 'LexiGo' "$FRONTEND_BODY"; then
  printf '[public-smoke] ERROR: frontend root returned 2xx but did not contain the LexiGo application marker\n' >&2
  head -c 2000 "$FRONTEND_BODY" >&2 || true
  printf '\n' >&2
  exit 1
fi

request_endpoint "API readiness" "$API_PUBLIC_URL/health/ready" "$API_BODY" "$API_HEADERS"
log "public frontend and API smoke checks passed"
