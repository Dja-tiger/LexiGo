#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/http-readiness.sh"

TEMP_DIR="$(mktemp -d)"
PORT_FILE="$TEMP_DIR/port"
SERVER_PID=""

cleanup() {
  local status=$?
  trap - EXIT
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  rm -rf -- "$TEMP_DIR"
  exit "$status"
}
trap cleanup EXIT

python3 - "$PORT_FILE" <<'PY' &
import http.server
import socketserver
import sys
import time

port_file = sys.argv[1]
complete_payload = b"<html><head><title>LexiGo</title></head><body>" + (b"x" * 2_000_000) + b"</body></html>"
truncated_payload = b"<html><head><title>LexiGo</title></head><body>truncated"

class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, _format, *_args):
        return

    def do_GET(self):
        if self.path == "/complete":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(complete_payload)))
            self.end_headers()
            first_chunk = complete_payload[:128]
            self.wfile.write(first_chunk)
            self.wfile.flush()
            time.sleep(0.1)
            for offset in range(len(first_chunk), len(complete_payload), 65536):
                self.wfile.write(complete_payload[offset:offset + 65536])
            self.wfile.flush()
            return

        if self.path == "/truncated":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(truncated_payload) + 4096))
            self.end_headers()
            self.wfile.write(truncated_payload)
            self.wfile.flush()
            self.close_connection = True
            return

        self.send_response(404)
        self.send_header("Content-Length", "0")
        self.end_headers()

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

with Server(("127.0.0.1", 0), Handler) as server:
    with open(port_file, "w", encoding="utf-8") as file:
        file.write(str(server.server_address[1]))
    server.serve_forever()
PY
SERVER_PID=$!

for _ in $(seq 1 100); do
  [[ -s "$PORT_FILE" ]] && break
  sleep 0.05
done
[[ -s "$PORT_FILE" ]] || { echo 'test HTTP server did not start' >&2; exit 1; }
PORT="$(cat "$PORT_FILE")"
BASE_URL="http://127.0.0.1:$PORT"

lexigo_http_response_contains "LexiGo" "$BASE_URL/complete" --max-time 5

if lexigo_http_response_contains "missing-marker" "$BASE_URL/complete" --max-time 5; then
  echo 'probe unexpectedly accepted a response without the expected marker' >&2
  exit 1
fi

if lexigo_http_response_contains "LexiGo" "$BASE_URL/truncated" --max-time 5; then
  echo 'probe unexpectedly accepted an incomplete HTTP response' >&2
  exit 1
fi

printf 'HTTP readiness probe tests passed.\n'
