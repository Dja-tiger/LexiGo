#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_file="${OPENPENCIL_SOURCE_FILE:-${repo_root}/design/figma/LexiGo Design System.fig}"
evidence_dir="${OPENPENCIL_EVIDENCE_DIR:-${repo_root}/.tmp/openpencil-ai-import}"

openpencil_version="${OPENPENCIL_VERSION:-v0.8.2}"
openpencil_asset="op-cli-linux-x86_64.tar.gz"
openpencil_asset_sha256="${OPENPENCIL_ASSET_SHA256:-aeffb1114857e7b810e66cd9ec927fa883dde0cb3ebf0a6ee26891e2888d20a2}"
openpencil_asset_url="https://github.com/ZSeven-W/openpencil/releases/download/${openpencil_version}/${openpencil_asset}"

expected_source_sha256="${OPENPENCIL_SOURCE_SHA256:-cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423}"
expected_source_size="${OPENPENCIL_SOURCE_SIZE:-1191055}"

sha256_file() {
  sha256sum "$1" | awk '{print $1}'
}

file_size() {
  wc -c < "$1" | tr -d '[:space:]'
}

require_source_identity() {
  local phase="$1"
  local actual_sha actual_size
  actual_sha="$(sha256_file "$source_file")"
  actual_size="$(file_size "$source_file")"

  if [[ "$actual_sha" != "$expected_source_sha256" ]]; then
    echo "${phase}: unexpected source SHA-256 ${actual_sha}; expected ${expected_source_sha256}" >&2
    return 1
  fi
  if [[ "$actual_size" != "$expected_source_size" ]]; then
    echo "${phase}: unexpected source size ${actual_size}; expected ${expected_source_size}" >&2
    return 1
  fi
}

for required in curl sha256sum tar python3 find; do
  if ! command -v "$required" >/dev/null 2>&1; then
    echo "Required command is missing: ${required}" >&2
    exit 127
  fi
done

if [[ ! -f "$source_file" ]]; then
  echo "Native Figma source not found: ${source_file}" >&2
  exit 1
fi

if head -n 1 "$source_file" | grep -Fqx 'version https://git-lfs.github.com/spec/v1'; then
  echo "Git LFS pointer detected instead of native .fig payload. Checkout/pull LFS objects first." >&2
  exit 1
fi

rm -rf "$evidence_dir"
mkdir -p "$evidence_dir"
require_source_identity "before import"

work_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$work_dir"
}
trap cleanup EXIT

tool_dir="$work_dir/tool"
import_dir="$work_dir/import"
archive_path="$work_dir/$openpencil_asset"
mkdir -p "$tool_dir" "$import_dir"

curl --fail --location --proto '=https' --tlsv1.2 \
  --retry 3 --retry-delay 2 \
  --output "$archive_path" \
  "$openpencil_asset_url"

actual_asset_sha="$(sha256_file "$archive_path")"
if [[ "$actual_asset_sha" != "$openpencil_asset_sha256" ]]; then
  echo "OpenPencil CLI archive SHA-256 mismatch: ${actual_asset_sha}; expected ${openpencil_asset_sha256}" >&2
  exit 1
fi

tar -xzf "$archive_path" -C "$tool_dir"
op_bin="$(find "$tool_dir" -type f -name op -print -quit)"
if [[ -z "$op_bin" ]]; then
  echo "OpenPencil CLI executable 'op' not found in ${openpencil_asset}" >&2
  exit 1
fi
chmod +x "$op_bin"

{
  printf 'release=%s\n' "$openpencil_version"
  printf 'asset=%s\n' "$openpencil_asset"
  printf 'asset_sha256=%s\n' "$actual_asset_sha"
  printf 'asset_url=%s\n' "$openpencil_asset_url"
} > "$evidence_dir/toolchain.txt"

"$op_bin" --help > "$evidence_dir/op-help.txt"

import_source="$import_dir/LexiGo Design System.fig"
generated_op="$import_dir/LexiGo Design System.op"
cp "$source_file" "$import_source"

"$op_bin" import:figma "$import_source" --out "$generated_op" \
  > "$evidence_dir/import-result.json"

if [[ ! -s "$generated_op" ]]; then
  echo "OpenPencil import did not produce a non-empty .op document" >&2
  exit 1
fi

python3 - \
  "$evidence_dir/import-result.json" \
  "$generated_op" \
  "$evidence_dir/document-summary.json" <<'PY'
import hashlib
import json
import pathlib
import sys

result_path = pathlib.Path(sys.argv[1])
document_path = pathlib.Path(sys.argv[2])
summary_path = pathlib.Path(sys.argv[3])

with result_path.open("r", encoding="utf-8") as fh:
    result = json.load(fh)

if result.get("ok") is not True:
    raise SystemExit(f"OpenPencil import did not report ok=true: {result!r}")

page_count = result.get("pageCount")
node_count = result.get("nodeCount")
if not isinstance(page_count, int) or page_count < 1:
    raise SystemExit(f"OpenPencil reported invalid pageCount: {page_count!r}")
if not isinstance(node_count, int) or node_count < 1:
    raise SystemExit(f"OpenPencil reported invalid nodeCount: {node_count!r}")

with document_path.open("r", encoding="utf-8") as fh:
    document = json.load(fh)

if not isinstance(document, dict):
    raise SystemExit("Generated .op root must be a JSON object")

pages = document.get("pages")
if isinstance(pages, list) and pages:
    roots = [child for page in pages if isinstance(page, dict) for child in page.get("children", [])]
    structural_page_count = len(pages)
else:
    roots = document.get("children", [])
    structural_page_count = 1 if isinstance(roots, list) and roots else 0

if not isinstance(roots, list) or not roots:
    raise SystemExit("Generated .op contains no root design nodes")


def count_nodes(nodes):
    total = 0
    stack = list(nodes)
    while stack:
        node = stack.pop()
        if not isinstance(node, dict):
            continue
        total += 1
        children = node.get("children")
        if isinstance(children, list):
            stack.extend(children)
    return total

recursive_node_count = count_nodes(roots)
if recursive_node_count < 1:
    raise SystemExit("Generated .op recursive node count is zero")

raw = document_path.read_bytes()
summary = {
    "import": result,
    "document": {
        "formatVersion": document.get("formatVersion"),
        "structuralPageCount": structural_page_count,
        "recursiveNodeCount": recursive_node_count,
        "topLevelKeys": sorted(document.keys()),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "size": len(raw),
    },
}
summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY

cp "$generated_op" "$evidence_dir/LexiGo Design System.op"

source_sha_after="$(sha256_file "$source_file")"
source_size_after="$(file_size "$source_file")"
require_source_identity "after import"

cat > "$evidence_dir/source-identity.json" <<EOF
{
  "path": "design/figma/LexiGo Design System.fig",
  "sha256": "${source_sha_after}",
  "size": ${source_size_after},
  "unchanged": true
}
EOF

printf 'ZSeven OpenPencil %s import evidence written to %s\n' \
  "$openpencil_version" "$evidence_dir"
