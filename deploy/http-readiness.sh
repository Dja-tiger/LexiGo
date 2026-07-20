#!/usr/bin/env bash

# Downloads the complete HTTP response into a temporary file before inspecting
# its body. This avoids `curl | grep -q`, where grep closes the pipe as soon as
# it finds a match and curl reports a write failure under `set -o pipefail`.
lexigo_http_response_contains() (
  if (( $# < 2 )); then
    printf 'lexigo_http_response_contains requires EXPECTED_TEXT and URL\n' >&2
    return 64
  fi

  local expected_text="$1"
  local url="$2"
  shift 2

  if [[ -z "$expected_text" || ! "$url" =~ ^https?:// ]]; then
    printf 'lexigo_http_response_contains received invalid arguments\n' >&2
    return 64
  fi

  local body_file
  body_file="$(mktemp "${TMPDIR:-/tmp}/lexigo-http-readiness.XXXXXX")" || return 1
  trap 'rm -f -- "$body_file"' EXIT

  if ! curl \
    --fail \
    --silent \
    --show-error \
    --output "$body_file" \
    "$@" \
    "$url"; then
    return 1
  fi

  grep -Fq -- "$expected_text" "$body_file"
)
