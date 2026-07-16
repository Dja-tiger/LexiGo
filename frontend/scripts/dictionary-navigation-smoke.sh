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
  "learn|/?view=learn&source=mixed"
  "learn|/?view=learn&source=noun"
  "learn|/?view=learn&source=verb"
  "learn|/?view=learn&source=adjective"
  "phrases|/?view=phrases"
  "learn|/?view=learn&source=daily-life"
  "learn|/?view=learn&source=travel"
  "learn|/?view=learn&source=data-engineering"
  "learn|/?view=learn&source=backend"
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

  if [[ "$expected" == "phrases" ]]; then
    grep -Fq 'class="lx-phrase-grid"' <<<"$html" || {
      echo "Phrase catalog did not render for ${url}" >&2
      exit 1
    }
  else
    grep -Fq 'class="lx-setup-card"' <<<"$html" || {
      echo "Lesson setup did not render for ${url}" >&2
      exit 1
    }
  fi
done

echo "All dictionary destinations rendered successfully"
