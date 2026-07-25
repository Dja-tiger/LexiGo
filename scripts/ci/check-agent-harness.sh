#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

failures=0

fail() {
  printf 'agent-harness: ERROR: %s\n' "$*" >&2
  failures=$((failures + 1))
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || fail "required file is missing: $path"
}

require_text() {
  local path="$1"
  local text="$2"
  if [[ ! -f "$path" ]] || ! grep -Fq -- "$text" "$path"; then
    fail "$path must contain: $text"
  fi
}

required_files=(
  AGENTS.md
  .agents/AGENTS.md
  .agents/SKILLS.md
  .agents/PROJECT_STATE.md
  .agents/current/TASK.md
  .agents/current/PROGRESS.md
  .agents/current/EXECUTION.md
  .agents/templates/TASK.template.md
  .agents/templates/PROGRESS.template.md
  .agents/templates/EXECUTION.template.md
  .agents/lessons/frontend.md
  .agents/lessons/backend.md
  .agents/lessons/ci.md
  .agents/lessons/accessibility.md
  .agents/lessons/pwa.md
  docs/agent-harness.md
  README.md
  .github/pull_request_template.md
)

for path in "${required_files[@]}"; do
  require_file "$path"
done

require_text AGENTS.md ".agents/AGENTS.md"
require_text .agents/AGENTS.md "SKILLS.md"
require_text .agents/AGENTS.md "PROJECT_STATE.md"
require_text .agents/AGENTS.md "current/TASK.md"
require_text .agents/AGENTS.md "current/PROGRESS.md"
require_text .agents/AGENTS.md "current/EXECUTION.md"
require_text README.md "docs/agent-harness.md"

for checklist in \
  'Прочитан корневой `AGENTS.md`.' \
  'Проверен актуальный `main`.' \
  'Один PR содержит один atomic slice.' \
  'Diff не вышел за allowed paths.' \
  'Полный required CI прошёл.' \
  'Secrets отсутствуют.' \
  '`PROJECT_STATE.md` будет обновлён после merge.' \
  '`EXECUTION.md` отражает фактически применённые skills.' \
  'Current task context будет очищен после merge.'
do
  require_text .github/pull_request_template.md "$checklist"
done

secret_pattern='(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|[A-Za-z0-9+/]{40,}={0,2}[[:space:]]*(#.*)?$)'
if grep -ERIn --exclude='check-agent-harness.sh' "$secret_pattern" \
  .agents/current .agents/templates 2>/dev/null; then
  fail "obvious secret-like content found in .agents/current or .agents/templates"
fi

# Validate local Markdown links for repository-relative paths without external dependencies.
while IFS= read -r markdown; do
  base_dir="$(dirname "$markdown")"
  while IFS= read -r target; do
    target="${target%%#*}"
    [[ -z "$target" ]] && continue
    case "$target" in
      http://*|https://*|mailto:*|\#*) continue ;;
    esac
    decoded="${target//%20/ }"
    if [[ "$decoded" == /* ]]; then
      candidate=".$decoded"
    else
      candidate="$base_dir/$decoded"
    fi
    if [[ ! -e "$candidate" ]]; then
      fail "broken relative link in $markdown: $target"
    fi
  done < <(grep -oE '\[[^]]+\]\(([^)]+)\)' "$markdown" \
    | sed -E 's/.*\]\(([^)]+)\).*/\1/' || true)
done < <(find AGENTS.md README.md .agents docs/agent-harness.md \
  -type f -name '*.md' -print 2>/dev/null | sort)

if (( failures > 0 )); then
  printf 'agent-harness: %d contract violation(s)\n' "$failures" >&2
  exit 1
fi

printf 'agent-harness: contract passed\n'
