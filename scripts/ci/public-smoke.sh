#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

PUBLIC_URL="${1:?frontend public URL is required}"
API_PUBLIC_URL="${2:?API public URL is required}"
EXPECTED_CSP_MODE="${3:?expected CSP mode is required: report-only or enforce}"

case "$EXPECTED_CSP_MODE" in
  report-only) EXPECTED_HSTS_MAX_AGE="86400" ;;
  enforce) EXPECTED_HSTS_MAX_AGE="15552000" ;;
  *)
    printf '[public-smoke] ERROR: expected CSP mode must be report-only or enforce: %s\n' "$EXPECTED_CSP_MODE" >&2
    exit 1
    ;;
esac

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

header_value() {
  local file="$1" name="$2"
  awk -v expected="$name" '
    {
      line = $0
      sub(/\r$/, "", line)
      separator = index(line, ":")
      if (separator == 0) next
      field = substr(line, 1, separator - 1)
      if (tolower(field) != tolower(expected)) next
      value = substr(line, separator + 1)
      sub(/^[[:space:]]+/, "", value)
      print value
      exit
    }
  ' "$file"
}

require_header() {
  local file="$1" name="$2" expected="$3" actual
  actual="$(header_value "$file" "$name")"
  if [[ "$actual" != "$expected" ]]; then
    printf '[public-smoke] ERROR: %s is %q, expected %q\n' "$name" "$actual" "$expected" >&2
    return 1
  fi
}

require_security_headers() {
  local file="$1" label="$2" permissions hsts
  require_header "$file" "X-Content-Type-Options" "nosniff"
  require_header "$file" "Referrer-Policy" "strict-origin-when-cross-origin"
  require_header "$file" "X-Frame-Options" "DENY"

  permissions="$(header_value "$file" "Permissions-Policy")"
  for denied in 'camera=()' 'geolocation=()' 'microphone=()' 'payment=()' 'usb=()'; do
    if [[ "$permissions" != *"$denied"* ]]; then
      printf '[public-smoke] ERROR: %s Permissions-Policy does not deny %s: %s\n' "$label" "$denied" "$permissions" >&2
      return 1
    fi
  done

  hsts="$(header_value "$file" "Strict-Transport-Security")"
  if [[ "$hsts" != "max-age=$EXPECTED_HSTS_MAX_AGE" ]]; then
    printf '[public-smoke] ERROR: %s HSTS is %q, expected max-age=%s without domain-wide flags\n' "$label" "$hsts" "$EXPECTED_HSTS_MAX_AGE" >&2
    return 1
  fi
}

require_content_security_policy() {
  local file="$1" policy_name other_name policy script_sources style_sources
  if [[ "$EXPECTED_CSP_MODE" == "enforce" ]]; then
    policy_name="Content-Security-Policy"
    other_name="Content-Security-Policy-Report-Only"
  else
    policy_name="Content-Security-Policy-Report-Only"
    other_name="Content-Security-Policy"
  fi

  policy="$(header_value "$file" "$policy_name")"
  if [[ -z "$policy" ]]; then
    printf '[public-smoke] ERROR: frontend is missing %s\n' "$policy_name" >&2
    return 1
  fi
  if [[ -n "$(header_value "$file" "$other_name")" ]]; then
    printf '[public-smoke] ERROR: frontend unexpectedly returned %s in %s mode\n' "$other_name" "$EXPECTED_CSP_MODE" >&2
    return 1
  fi

  for directive in \
    "default-src 'self'" \
    "script-src-attr 'none'" \
    "connect-src 'self'" \
    "img-src 'self' data: blob:" \
    "font-src 'self' data:" \
    "frame-ancestors 'none'" \
    "base-uri 'self'" \
    "form-action 'self'" \
    "report-uri /api/v1/security/csp-report"; do
    if [[ "$policy" != *"$directive"* ]]; then
      printf '[public-smoke] ERROR: CSP is missing %s\n' "$directive" >&2
      return 1
    fi
  done

  script_sources="$(printf '%s' "$policy" | tr ';' '\n' | sed -n 's/^[[:space:]]*script-src[[:space:]][[:space:]]*/script-src /p')"
  style_sources="$(printf '%s' "$policy" | tr ';' '\n' | sed -n 's/^[[:space:]]*style-src[[:space:]][[:space:]]*/style-src /p')"
  if [[ ! "$script_sources" =~ nonce-[A-Za-z0-9+/_=-]+ ]] || [[ "$script_sources" == *"'unsafe-eval'"* ]] || [[ "$script_sources" == *"'unsafe-inline'"* ]]; then
    printf '[public-smoke] ERROR: unsafe or nonce-free script-src: %s\n' "$script_sources" >&2
    return 1
  fi
  if [[ "$style_sources" != *"'self'"* ]] || [[ ! "$style_sources" =~ nonce-[A-Za-z0-9+/_=-]+ ]] || [[ "$style_sources" == *"'unsafe-inline'"* ]] || [[ "$policy" != *"style-src-elem 'self' 'nonce-"* ]] || [[ "$policy" != *"style-src-attr 'unsafe-inline'"* ]]; then
    printf '[public-smoke] ERROR: CSP style exception is not limited to style attributes\n' >&2
    return 1
  fi
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
require_security_headers "$FRONTEND_HEADERS" "frontend"
require_content_security_policy "$FRONTEND_HEADERS"

request_endpoint "API readiness" "$API_PUBLIC_URL/health/ready" "$API_BODY" "$API_HEADERS"
require_security_headers "$API_HEADERS" "API"
log "public frontend and API smoke checks passed with CSP mode $EXPECTED_CSP_MODE"
