#!/usr/bin/env bash
set -euo pipefail

base_url="${LEXIGO_SMOKE_BASE_URL:-http://127.0.0.1:3000}"

chrome=""
for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then
    chrome="$(command -v "$candidate")"
    break
  fi
done

if [[ -z "$chrome" ]]; then
  echo "Chrome/Chromium is required for the dictionary navigation smoke test" >&2
  exit 1
fi

routes=(
  "learn|/learn?source=mixed"
  "learn|/learn?source=noun"
  "learn|/learn?source=verb"
  "learn|/learn?source=adjective"
  "phrases|/phrases"
  "learn|/learn?source=daily-life"
  "learn|/learn?source=travel"
  "learn|/learn?source=data-engineering"
  "learn|/learn?source=backend"
  "dictionary|/dictionary"
)

for entry in "${routes[@]}"; do
  expected="${entry%%|*}"
  path="${entry#*|}"
  url="${base_url}${path}"
  echo "Checking ${url}"

  html="$($chrome \
    --headless=new \
    --no-sandbox \
    --disable-gpu \
    --disable-dev-shm-usage \
    --virtual-time-budget=4000 \
    --dump-dom \
    "$url" 2>/tmp/lexigo-chrome-smoke.log)"

  if grep -Fq "This page couldn’t load" <<<"$html" || grep -Fq "This page couldn't load" <<<"$html"; then
    echo "Browser error page was rendered for ${url}" >&2
    exit 1
  fi

  case "$expected" in
    phrases)
      grep -Eq 'class="(lx-phrase-grid|[^"]*[[:space:]]lx-phrase-grid)([[:space:]][^"]*)?"' <<<"$html" || {
        echo "Phrase catalog did not render for ${url}" >&2
        exit 1
      }
      ;;
    dictionary)
      # Issue #72 makes the canonical Dictionary a public read-only/demo
      # destination. This shell smoke intentionally runs without an API
      # session, so it must prove that the guest Dictionary island and its
      # persistence boundary render instead of the historical auth gate.
      grep -Fq 'data-route-client-island="dictionary"' <<<"$html" || {
        echo "Guest Dictionary route island did not render for ${url}" >&2
        exit 1
      }
      grep -Fq 'id="dictionary-catalog-title">Словарь</h1>' <<<"$html" || {
        echo "Guest Dictionary catalog heading did not render for ${url}" >&2
        exit 1
      }
      grep -Fq 'Демо-режим: слова и карточки доступны для просмотра.' <<<"$html" || {
        echo "Guest Dictionary persistence guidance did not render for ${url}" >&2
        exit 1
      }
      if grep -Fq 'aria-label="Словарь доступен после входа"' <<<"$html"; then
        echo "Historical Dictionary authentication gate rendered for ${url}" >&2
        exit 1
      fi
      ;;
    *)
      grep -Fq 'class="lx-setup-card"' <<<"$html" || {
        echo "Lesson setup did not render for ${url}" >&2
        exit 1
      }
      ;;
  esac
done

echo "All canonical dictionary destinations rendered successfully"
