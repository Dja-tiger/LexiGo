#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_file="${OPENPENCIL_SOURCE_FILE:-${repo_root}/.tmp/openpencil-ai-import/LexiGo Design System.op}"
variables_file="${OPENPENCIL_VARIABLES_FILE:-${repo_root}/.tmp/openpencil-visual-acceptance/openpencil-variables.json}"
themes_file="${OPENPENCIL_THEMES_FILE:-${repo_root}/.tmp/openpencil-visual-acceptance/openpencil-themes.json}"
output_file="${OPENPENCIL_TOKENIZED_FILE:-${repo_root}/.tmp/openpencil-visual-acceptance/LexiGo Design System.tokenized.op}"
evidence_dir="${OPENPENCIL_TOKEN_MIGRATION_EVIDENCE_DIR:-${repo_root}/.tmp/openpencil-visual-acceptance}"

openpencil_version="${OPENPENCIL_VERSION:-v0.8.2}"
openpencil_asset="op-cli-linux-x86_64.tar.gz"
openpencil_asset_sha256="${OPENPENCIL_ASSET_SHA256:-aeffb1114857e7b810e66cd9ec927fa883dde0cb3ebf0a6ee26891e2888d20a2}"
openpencil_asset_url="https://github.com/ZSeven-W/openpencil/releases/download/${openpencil_version}/${openpencil_asset}"
expected_source_sha256="${OPENPENCIL_SOURCE_SHA256:-ca0f0492e235ebf3b159dd320cc3c4fb61f550f20e2a42f80140f1cfc30a639c}"
expected_variable_count="${OPENPENCIL_EXPECTED_VARIABLE_COUNT:-92}"
expected_theme_axis_count="${OPENPENCIL_EXPECTED_THEME_AXIS_COUNT:-2}"
port="${OPENPENCIL_TOKEN_PORT:-39113}"

sha256_file() { sha256sum "$1" | awk '{print $1}'; }

for required in curl sha256sum tar python3 find cp; do
  command -v "$required" >/dev/null 2>&1 || { echo "Required command is missing: $required" >&2; exit 127; }
done
[[ -x "${OPENPENCIL_DESKTOP_BIN:-}" ]] || {
  echo "OPENPENCIL_DESKTOP_BIN must point to the verified OpenPencil desktop runtime" >&2
  exit 1
}
[[ -s "$source_file" && -s "$variables_file" && -s "$themes_file" ]] || {
  echo "Source .op, variables JSON and themes JSON must all exist" >&2
  exit 1
}

source_sha="$(sha256_file "$source_file")"
[[ "$source_sha" == "$expected_source_sha256" ]] || {
  echo "Source .op SHA-256 mismatch: $source_sha; expected $expected_source_sha256" >&2
  exit 1
}

mkdir -p "$evidence_dir" "$(dirname "$output_file")"
cp "$source_file" "$output_file"
work_dir="$(mktemp -d)"
server_pid=""
op_bin=""

cleanup() {
  if [[ -n "$op_bin" ]]; then "$op_bin" --port "$port" stop >/dev/null 2>&1 || true; fi
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -rf "$work_dir"
}
trap cleanup EXIT

archive="$work_dir/$openpencil_asset"
tool_dir="$work_dir/tool"
mkdir -p "$tool_dir"
curl --fail --location --proto '=https' --tlsv1.2 --retry 3 --retry-delay 2 \
  --output "$archive" "$openpencil_asset_url"
actual_asset_sha="$(sha256_file "$archive")"
[[ "$actual_asset_sha" == "$openpencil_asset_sha256" ]] || {
  echo "OpenPencil CLI archive SHA-256 mismatch" >&2
  exit 1
}
tar -xzf "$archive" -C "$tool_dir"
op_bin="$(find "$tool_dir" -type f -name op -print -quit)"
[[ -n "$op_bin" ]] || { echo "OpenPencil CLI executable not found" >&2; exit 1; }
chmod +x "$op_bin"

"$op_bin" --port "$port" start --headless --file "$output_file" >"$evidence_dir/token-migration-server.log" 2>&1 &
server_pid="$!"
ready=false
for _ in $(seq 1 60); do
  "$op_bin" --port "$port" status >"$evidence_dir/token-migration-status.json" 2>"$evidence_dir/token-migration-status.err" || true
  if python3 - "$evidence_dir/token-migration-status.json" <<'PY'
import json, pathlib, sys
try:
    value = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8'))
except Exception:
    raise SystemExit(1)
raise SystemExit(0 if value.get('running') is True else 1)
PY
  then
    ready=true
    break
  fi
  sleep 0.5
done
[[ "$ready" == true ]] || {
  echo "OpenPencil token migration server did not become ready" >&2
  cat "$evidence_dir/token-migration-server.log" >&2 || true
  exit 1
}

"$op_bin" --port "$port" themes:set "@$themes_file" --replace >"$evidence_dir/token-migration-themes-set.json"
"$op_bin" --port "$port" vars:set "@$variables_file" --replace >"$evidence_dir/token-migration-vars-set.json"
"$op_bin" --port "$port" vars >"$evidence_dir/token-migration-vars-readback.json"
"$op_bin" --port "$port" themes >"$evidence_dir/token-migration-themes-readback.json"
"$op_bin" --port "$port" stop >"$evidence_dir/token-migration-stop.json" 2>&1 || true
if kill -0 "$server_pid" 2>/dev/null; then wait "$server_pid" 2>/dev/null || true; fi
server_pid=""

python3 - "$source_file" "$output_file" "$variables_file" "$themes_file" \
  "$evidence_dir/token-migration-vars-readback.json" "$evidence_dir/token-migration-summary.json" \
  "$expected_variable_count" "$expected_theme_axis_count" <<'PY'
import hashlib
import json
import math
import pathlib
import sys

source_path = pathlib.Path(sys.argv[1])
output_path = pathlib.Path(sys.argv[2])
variables_path = pathlib.Path(sys.argv[3])
themes_path = pathlib.Path(sys.argv[4])
readback_path = pathlib.Path(sys.argv[5])
summary_path = pathlib.Path(sys.argv[6])
expected_variable_count = int(sys.argv[7])
expected_theme_axis_count = int(sys.argv[8])
float_tolerance = 1e-7

source = json.loads(source_path.read_text(encoding='utf-8'))
output = json.loads(output_path.read_text(encoding='utf-8'))
expected_variables = json.loads(variables_path.read_text(encoding='utf-8'))
expected_themes = json.loads(themes_path.read_text(encoding='utf-8'))
readback = json.loads(readback_path.read_text(encoding='utf-8'))

class SemanticDiff(Exception):
    pass

stats = {'numericNormalizationCount': 0, 'maxNumericDrift': 0.0}

def semantic_equal(expected, actual, path='root'):
    if isinstance(expected, bool) or isinstance(actual, bool):
        if expected != actual:
            raise SemanticDiff(f'{path}: {expected!r} != {actual!r}')
        return
    if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
        if not math.isfinite(float(expected)) or not math.isfinite(float(actual)):
            if expected != actual:
                raise SemanticDiff(f'{path}: non-finite numeric mismatch')
            return
        drift = abs(float(expected) - float(actual))
        if drift > float_tolerance:
            raise SemanticDiff(f'{path}: numeric drift {drift} exceeds {float_tolerance}: {expected!r} != {actual!r}')
        if expected != actual:
            stats['numericNormalizationCount'] += 1
            stats['maxNumericDrift'] = max(stats['maxNumericDrift'], drift)
        return
    if type(expected) is not type(actual):
        raise SemanticDiff(f'{path}: type {type(expected).__name__} != {type(actual).__name__}')
    if isinstance(expected, dict):
        if expected.keys() != actual.keys():
            missing = sorted(set(expected) - set(actual))
            extra = sorted(set(actual) - set(expected))
            raise SemanticDiff(f'{path}: key mismatch missing={missing} extra={extra}')
        for key in expected:
            semantic_equal(expected[key], actual[key], f'{path}.{key}')
        return
    if isinstance(expected, list):
        if len(expected) != len(actual):
            raise SemanticDiff(f'{path}: list length {len(expected)} != {len(actual)}')
        for index, (left, right) in enumerate(zip(expected, actual)):
            semantic_equal(left, right, f'{path}[{index}]')
        return
    if expected != actual:
        raise SemanticDiff(f'{path}: {expected!r} != {actual!r}')

try:
    semantic_equal(source.get('pages'), output.get('pages'), 'pages')
    semantic_equal(source.get('children'), output.get('children'), 'children')
except SemanticDiff as exc:
    raise SystemExit(f'Token migration changed canonical design semantics: {exc}')

if source.get('name') != output.get('name') or source.get('version') != output.get('version'):
    raise SystemExit('Token migration changed document identity fields')

try:
    semantic_equal(expected_variables, output.get('variables'), 'persisted.variables')
except SemanticDiff as exc:
    raise SystemExit(f'Persisted OpenPencil variables differ from compiled variables: {exc}')
if output.get('themes') != expected_themes:
    raise SystemExit('Persisted OpenPencil themes differ from compiled themes')
if len(expected_variables) != expected_variable_count:
    raise SystemExit(f'Expected {expected_variable_count} variables, got {len(expected_variables)}')
if len(expected_themes) != expected_theme_axis_count:
    raise SystemExit(f'Expected {expected_theme_axis_count} theme axes, got {len(expected_themes)}')
if int(readback.get('variable_count', -1)) != expected_variable_count:
    raise SystemExit(f'OpenPencil readback variable_count mismatch: {readback!r}')
if int(readback.get('theme_axis_count', -1)) != expected_theme_axis_count:
    raise SystemExit(f'OpenPencil readback theme_axis_count mismatch: {readback!r}')
try:
    semantic_equal(expected_variables, json.loads(readback.get('variables', '{}')), 'readback.variables')
except SemanticDiff as exc:
    raise SystemExit(f'OpenPencil vars readback differs from compiled variables: {exc}')
if json.loads(readback.get('themes', '{}')) != expected_themes:
    raise SystemExit('OpenPencil themes readback differs from compiled themes')

source_raw = source_path.read_bytes()
output_raw = output_path.read_bytes()
if source_raw == output_raw:
    raise SystemExit('Tokenized .op is byte-identical to source despite adding variables/themes')
summary = {
    'sourceSha256': hashlib.sha256(source_raw).hexdigest(),
    'sourceBytes': len(source_raw),
    'tokenizedSha256': hashlib.sha256(output_raw).hexdigest(),
    'tokenizedBytes': len(output_raw),
    'pageTreeUnchanged': True,
    'pageTreeSemanticallyUnchanged': True,
    'numericNormalizationTolerance': float_tolerance,
    'numericNormalizationCount': stats['numericNormalizationCount'],
    'maxNumericDrift': stats['maxNumericDrift'],
    'variableCount': len(expected_variables),
    'themeAxisCount': len(expected_themes),
    'officialApiReadbackMatches': True,
}
summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False, sort_keys=True) + '\n', encoding='utf-8')
PY

printf 'OpenPencil token migration evidence written to %s\n' "$evidence_dir"
