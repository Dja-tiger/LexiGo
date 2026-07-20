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
printf 'HTTP/2 %s\r\ncontent-type: text/plain\r\n\r\n' "$status" > "$headers_file"

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
  bash "$SCRIPT_DIR/public-smoke.sh" "https://app.example.com" "https://api.example.com"

if PATH="$TEMP_DIR:$PATH" \
  FAKE_CURL_STATUS=502 \
  PUBLIC_SMOKE_ATTEMPTS=1 \
  PUBLIC_SMOKE_DELAY_SECONDS=0 \
  bash "$SCRIPT_DIR/public-smoke.sh" "https://app.example.com" "https://api.example.com"; then
  printf 'public smoke must fail when the frontend returns 502\n' >&2
  exit 1
fi

printf 'public smoke script tests passed\n'
