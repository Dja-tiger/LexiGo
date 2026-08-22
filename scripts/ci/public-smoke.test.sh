#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf -- "$TEMP_DIR"' EXIT

cat > "$TEMP_DIR/curl" <<'FAKE_CURL'
#!/usr/bin/env bash
set -Eeuo pipefail

output_file=""
headers_file=""
url=""
status="${FAKE_CURL_STATUS:-200}"

while (($# > 0)); do
  case "$1" in
    --silent|--show-error|--location)
      shift
      ;;
    --connect-timeout|--max-time|--write-out)
      shift 2
      ;;
    --output)
      output_file="$2"
      shift 2
      ;;
    --dump-header)
      headers_file="$2"
      shift 2
      ;;
    http://*|https://*)
      url="$1"
      shift
      ;;
    *)
      printf 'unexpected fake curl argument: %s\n' "$1" >&2
      exit 2
      ;;
  esac
done

[[ -n "$output_file" && -n "$headers_file" && -n "$url" ]]
{
  printf 'HTTP/2 %s\r\n' "$status"
  printf 'content-type: text/plain\r\n'
  if [[ "${FAKE_OMIT_SECURITY_HEADERS:-0}" != "1" ]]; then
    if [[ "${FAKE_CSP_MODE:-enforce}" == "report-only" ]]; then
      printf 'strict-transport-security: max-age=86400\r\n'
    else
      printf 'strict-transport-security: max-age=15552000\r\n'
    fi
    printf 'x-content-type-options: nosniff\r\n'
    printf 'referrer-policy: strict-origin-when-cross-origin\r\n'
    printf 'permissions-policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()\r\n'
    printf 'x-frame-options: DENY\r\n'
    if [[ "$url" != https://api.example.com/* ]]; then
      policy="default-src 'self'; script-src 'self' 'nonce-c2VjdXJlLW5vbmNl'; script-src-attr 'none'; style-src 'self' 'nonce-c2VjdXJlLW5vbmNl'; style-src-elem 'self' 'nonce-c2VjdXJlLW5vbmNl'; style-src-attr 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; report-uri /api/v1/security/csp-report"
      if [[ "${FAKE_CSP_MODE:-enforce}" == "report-only" ]]; then
        printf 'content-security-policy-report-only: %s\r\n' "$policy"
      else
        printf 'content-security-policy: %s\r\n' "$policy"
      fi
    fi
  fi
  printf '\r\n'
} > "$headers_file"

if [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
  if [[ "$url" == https://api.example.com/* ]]; then
    printf '{"status":"ready"}\n' > "$output_file"
  else
    printf '<!doctype html><html><head><title>LexiGo</title></head><body>LexiGo</body></html>\n' > "$output_file"
  fi
else
  printf 'Bad Gateway\n' > "$output_file"
fi

printf '%s' "$status"
FAKE_CURL
chmod 0755 "$TEMP_DIR/curl"

PATH="$TEMP_DIR:$PATH" \
PUBLIC_SMOKE_ATTEMPTS=1 \
PUBLIC_SMOKE_DELAY_SECONDS=0 \
  bash "$SCRIPT_DIR/public-smoke.sh" "https://app.example.com" "https://api.example.com" enforce

PATH="$TEMP_DIR:$PATH" \
FAKE_CSP_MODE=report-only \
PUBLIC_SMOKE_ATTEMPTS=1 \
PUBLIC_SMOKE_DELAY_SECONDS=0 \
  bash "$SCRIPT_DIR/public-smoke.sh" "https://app.example.com" "https://api.example.com" report-only

if PATH="$TEMP_DIR:$PATH" \
  FAKE_CURL_STATUS=502 \
  PUBLIC_SMOKE_ATTEMPTS=1 \
  PUBLIC_SMOKE_DELAY_SECONDS=0 \
  bash "$SCRIPT_DIR/public-smoke.sh" "https://app.example.com" "https://api.example.com" enforce; then
  printf 'public smoke must fail when the frontend returns 502\n' >&2
  exit 1
fi

if PATH="$TEMP_DIR:$PATH" \
  FAKE_OMIT_SECURITY_HEADERS=1 \
  PUBLIC_SMOKE_ATTEMPTS=1 \
  PUBLIC_SMOKE_DELAY_SECONDS=0 \
  bash "$SCRIPT_DIR/public-smoke.sh" "https://app.example.com" "https://api.example.com" enforce; then
  printf 'public smoke must fail when browser security headers are missing\n' >&2
  exit 1
fi

DEPLOY_OVER_SSH="$SCRIPT_DIR/deploy-over-ssh.sh"
python3 - "$DEPLOY_OVER_SSH" <<'PY'
from pathlib import Path
import re
import sys

source = Path(sys.argv[1]).read_text(encoding="utf-8")
required = [
    'if [[ "$ENVIRONMENT" == "stage" ]]',
    'checking Stage host capacity before bundle upload and image pulls',
    'min_free_kib=262144',
    'min_free_inodes=1024',
    "df -Pk \"$capacity_path\"",
    "df -Pi \"$capacity_path\"",
    "container_ids=\"$(docker ps -aq)\" || die",
    'declare -A referenced_image_ids=()',
    'ghcr.io/dja-tiger/lexigo-api ghcr.io/dja-tiger/lexigo-web',
    'preserving rollback/deploy image',
    'preserving container-referenced image',
    'docker image rm "$image_ref"',
    'capacity gate passed; persistent volumes and containers were not removed',
    'tee -a "$LOG_FILE"',
]
for token in required:
    if token not in source:
        raise SystemExit(f"missing Stage capacity recovery contract: {token}")

forbidden = re.compile(
    r"docker\s+(?:system|image|container|volume|network)\s+prune"
    r"|docker\s+(?:volume|container|network)\s+rm\b"
    r"|docker\s+rm\b"
    r"|down\s+-v\b"
)
match = forbidden.search(source)
if match:
    raise SystemExit(f"destructive or daemon-wide Stage cleanup is prohibited: {match.group(0)}")

capacity_index = source.index('checking Stage host capacity before bundle upload and image pulls')
bundle_index = source.index('log "building deployment bundle"')
if capacity_index >= bundle_index:
    raise SystemExit("Stage capacity recovery must run before bundle upload/extraction")
PY

printf 'public smoke and deployment capacity source-contract tests passed\n'
