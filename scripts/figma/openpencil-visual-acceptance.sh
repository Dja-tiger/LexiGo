#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
candidate_file="${OPENPENCIL_CANDIDATE_FILE:-${repo_root}/.tmp/openpencil-ai-import/LexiGo Design System.op}"
map_file="${OPENPENCIL_SCREEN_MAP:-${repo_root}/docs/figma/openpencil-screen-map.json}"
evidence_dir="${OPENPENCIL_VISUAL_EVIDENCE_DIR:-${repo_root}/.tmp/openpencil-visual-acceptance}"

openpencil_version="${OPENPENCIL_VERSION:-v0.8.2}"
openpencil_asset="op-cli-linux-x86_64.tar.gz"
openpencil_asset_sha256="${OPENPENCIL_ASSET_SHA256:-aeffb1114857e7b810e66cd9ec927fa883dde0cb3ebf0a6ee26891e2888d20a2}"
openpencil_asset_url="https://github.com/ZSeven-W/openpencil/releases/download/${openpencil_version}/${openpencil_asset}"
expected_candidate_sha256="${OPENPENCIL_CANDIDATE_SHA256:-ca0f0492e235ebf3b159dd320cc3c4fb61f550f20e2a42f80140f1cfc30a639c}"
expected_candidate_size="${OPENPENCIL_CANDIDATE_SIZE:-2309061}"
port="${OPENPENCIL_PORT:-39112}"

sha256_file() {
  sha256sum "$1" | awk '{print $1}'
}

file_size() {
  wc -c < "$1" | tr -d '[:space:]'
}

for required in curl sha256sum tar python3 find; do
  command -v "$required" >/dev/null 2>&1 || {
    echo "Required command is missing: ${required}" >&2
    exit 127
  }
done

[[ -s "$candidate_file" ]] || {
  echo "Candidate .op is missing or empty: ${candidate_file}" >&2
  exit 1
}
[[ -s "$map_file" ]] || {
  echo "OpenPencil screen map is missing or empty: ${map_file}" >&2
  exit 1
}

candidate_sha="$(sha256_file "$candidate_file")"
candidate_size="$(file_size "$candidate_file")"
[[ "$candidate_sha" == "$expected_candidate_sha256" ]] || {
  echo "Candidate .op SHA-256 mismatch: ${candidate_sha}; expected ${expected_candidate_sha256}" >&2
  exit 1
}
[[ "$candidate_size" == "$expected_candidate_size" ]] || {
  echo "Candidate .op size mismatch: ${candidate_size}; expected ${expected_candidate_size}" >&2
  exit 1
}

rm -rf "$evidence_dir"
mkdir -p "$evidence_dir/renders" "$evidence_dir/nodes"

work_dir="$(mktemp -d)"
server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -rf "$work_dir"
}
trap cleanup EXIT

tool_dir="$work_dir/tool"
archive_path="$work_dir/$openpencil_asset"
mkdir -p "$tool_dir"

curl --fail --location --proto '=https' --tlsv1.2 \
  --retry 3 --retry-delay 2 \
  --output "$archive_path" \
  "$openpencil_asset_url"

actual_asset_sha="$(sha256_file "$archive_path")"
[[ "$actual_asset_sha" == "$openpencil_asset_sha256" ]] || {
  echo "OpenPencil CLI archive SHA-256 mismatch: ${actual_asset_sha}; expected ${openpencil_asset_sha256}" >&2
  exit 1
}

tar -xzf "$archive_path" -C "$tool_dir"
op_bin="$(find "$tool_dir" -type f -name op -print -quit)"
[[ -n "$op_bin" ]] || {
  echo "OpenPencil CLI executable 'op' not found" >&2
  exit 1
}
chmod +x "$op_bin"

cat > "$evidence_dir/toolchain.json" <<EOF
{
  "release": "${openpencil_version}",
  "asset": "${openpencil_asset}",
  "assetSha256": "${actual_asset_sha}",
  "candidateSha256": "${candidate_sha}",
  "candidateSize": ${candidate_size}
}
EOF

python3 - "$candidate_file" "$map_file" "$evidence_dir/structural-acceptance.json" <<'PY'
import collections
import hashlib
import json
import pathlib
import sys

candidate_path = pathlib.Path(sys.argv[1])
map_path = pathlib.Path(sys.argv[2])
out_path = pathlib.Path(sys.argv[3])

document = json.loads(candidate_path.read_text(encoding="utf-8"))
screen_map = json.loads(map_path.read_text(encoding="utf-8"))

pages = document.get("pages")
if not isinstance(pages, list) or len(pages) != 23:
    raise SystemExit(f"Expected exactly 23 imported pages, got {len(pages) if isinstance(pages, list) else type(pages).__name__}")

page_by_id = {}
node_by_id = {}
node_page = {}
type_counts = collections.Counter()
reusable_nodes = []

for page in pages:
    if not isinstance(page, dict) or not isinstance(page.get("id"), str):
        raise SystemExit("Every imported page must have a string id")
    page_by_id[page["id"]] = page
    stack = list(page.get("children") or [])
    while stack:
        node = stack.pop()
        if not isinstance(node, dict):
            continue
        node_id = node.get("id")
        if isinstance(node_id, str):
            if node_id in node_by_id:
                raise SystemExit(f"Duplicate OpenPencil node id: {node_id}")
            node_by_id[node_id] = node
            node_page[node_id] = page["id"]
        type_counts[str(node.get("type"))] += 1
        if node.get("reusable") is True:
            reusable_nodes.append(node_id)
        children = node.get("children")
        if isinstance(children, list):
            stack.extend(children)

validated = []
for entry in screen_map.get("screens", []):
    node_id = entry["openPencilNode"]
    node = node_by_id.get(node_id)
    if node is None:
        raise SystemExit(f"Mapped OpenPencil node is missing: {node_id} ({entry['key']})")
    if node_page[node_id] != entry["pageId"]:
        raise SystemExit(f"Mapped node {node_id} is on {node_page[node_id]}, expected {entry['pageId']}")
    page = page_by_id.get(entry["pageId"])
    if not page or page.get("name") != entry["pageName"]:
        raise SystemExit(f"Mapped page mismatch for {entry['key']}")
    if node.get("name") != entry["name"]:
        raise SystemExit(f"Mapped node name mismatch for {entry['key']}: {node.get('name')!r}")
    if float(node.get("width")) != float(entry["width"]) or float(node.get("height")) != float(entry["height"]):
        raise SystemExit(f"Mapped geometry mismatch for {entry['key']}: {node.get('width')}x{node.get('height')}")
    if node.get("type") != "frame":
        raise SystemExit(f"Mapped canonical screen is not a frame: {entry['key']} -> {node.get('type')!r}")
    validated.append({
        "key": entry["key"],
        "legacyFigmaNode": entry["legacyFigmaNode"],
        "openPencilNode": node_id,
        "pageId": entry["pageId"],
        "name": node.get("name"),
        "width": node.get("width"),
        "height": node.get("height"),
        "render": bool(entry.get("render")),
    })

for key, page_spec in screen_map.get("pages", {}).items():
    page = page_by_id.get(page_spec["pageId"])
    root = node_by_id.get(page_spec["rootId"])
    if not page or page.get("name") != page_spec["pageName"]:
        raise SystemExit(f"Design-system page mismatch: {key}")
    if root is None or node_page[page_spec["rootId"]] != page_spec["pageId"]:
        raise SystemExit(f"Design-system root mismatch: {key}")

probe = screen_map["editabilityProbe"]
probe_node = node_by_id.get(probe["textNode"])
if not probe_node or probe_node.get("type") != "text":
    raise SystemExit("Editability probe text node is missing")
if probe_node.get("name") != probe["name"] or probe_node.get("content") != probe["originalContent"]:
    raise SystemExit("Editability probe text identity/content drifted")

raw = candidate_path.read_bytes()
summary = {
    "candidate": {
        "sha256": hashlib.sha256(raw).hexdigest(),
        "size": len(raw),
        "pageCount": len(pages),
        "recursiveNodeCount": len(node_by_id),
    },
    "nodeTypes": dict(sorted(type_counts.items())),
    "reusableNodeCount": len(reusable_nodes),
    "reusableNodeSample": [x for x in reusable_nodes if x][:20],
    "jsonVariableStorePresent": any(key in document for key in ("variables", "variableCollections", "themes")),
    "validatedScreenCount": len(validated),
    "renderScreenCount": sum(1 for item in validated if item["render"]),
    "screens": validated,
    "editabilityProbe": probe,
}
out_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY

"$op_bin" --port "$port" start --headless --file "$candidate_file" \
  > "$evidence_dir/headless-server.log" 2>&1 &
server_pid="$!"

ready=false
for _ in $(seq 1 40); do
  if "$op_bin" --port "$port" status > "$evidence_dir/status.json" 2> "$evidence_dir/status.err"; then
    ready=true
    break
  fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "OpenPencil headless server exited before becoming ready" >&2
    cat "$evidence_dir/headless-server.log" >&2 || true
    exit 1
  fi
  sleep 0.5
done
[[ "$ready" == true ]] || {
  echo "OpenPencil headless server did not become ready" >&2
  cat "$evidence_dir/status.err" >&2 || true
  exit 1
}

"$op_bin" --port "$port" vars > "$evidence_dir/variables.json"
"$op_bin" --port "$port" page list > "$evidence_dir/pages.json"

python3 - "$map_file" <<'PY' > "$work_dir/render-list.tsv"
import json
import pathlib
import sys

spec = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
for item in spec["screens"]:
    if item.get("render"):
        print("\t".join([item["key"], item["openPencilNode"], str(item["width"]), str(item["height"])]))
PY

while IFS=$'\t' read -r key node_id expected_width expected_height; do
  [[ -n "$key" ]] || continue
  safe_name="${key//\//_}"
  output="$evidence_dir/renders/${safe_name}.png"
  "$op_bin" --port "$port" export --item "$node_id" --output "$output" --format png --scale 1 \
    > "$evidence_dir/nodes/${safe_name}.export.json"
  "$op_bin" --port "$port" get --id "$node_id" --depth 1 \
    > "$evidence_dir/nodes/${safe_name}.node.json"
done < "$work_dir/render-list.tsv"

python3 - "$evidence_dir" "$map_file" "$evidence_dir/render-manifest.json" <<'PY'
import hashlib
import json
import pathlib
import struct
import sys

evidence_dir = pathlib.Path(sys.argv[1])
spec = json.loads(pathlib.Path(sys.argv[2]).read_text(encoding="utf-8"))
out_path = pathlib.Path(sys.argv[3])

expected = {item["key"]: item for item in spec["screens"] if item.get("render")}
entries = []
for key, item in expected.items():
    path = evidence_dir / "renders" / f"{key.replace('/', '_')}.png"
    raw = path.read_bytes()
    if raw[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit(f"Not a PNG: {path}")
    if raw[12:16] != b"IHDR":
        raise SystemExit(f"PNG missing IHDR: {path}")
    width, height = struct.unpack(">II", raw[16:24])
    if width != item["width"] or height != item["height"]:
        raise SystemExit(f"Unexpected PNG dimensions for {key}: {width}x{height}, expected {item['width']}x{item['height']}")
    entries.append({
        "key": key,
        "legacyFigmaNode": item["legacyFigmaNode"],
        "openPencilNode": item["openPencilNode"],
        "width": width,
        "height": height,
        "bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "path": str(path.relative_to(evidence_dir)),
    })

out_path.write_text(json.dumps({"renders": entries}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY

# Preserve the canonical candidate hash before any editability probe.
[[ "$(sha256_file "$candidate_file")" == "$expected_candidate_sha256" ]] || {
  echo "Candidate changed during read/render acceptance" >&2
  exit 1
}

# Stop the read-only acceptance server before opening a disposable editable copy.
"$op_bin" --port "$port" stop > "$evidence_dir/stop-readonly.json" 2>&1 || true
if kill -0 "$server_pid" 2>/dev/null; then
  wait "$server_pid" 2>/dev/null || true
fi
server_pid=""

edit_file="$work_dir/editability.op"
cp "$candidate_file" "$edit_file"
probe_page="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["editabilityProbe"]["pageId"])' "$map_file")"
probe_node="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["editabilityProbe"]["textNode"])' "$map_file")"
probe_content="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["editabilityProbe"]["probeContent"])' "$map_file")"

"$op_bin" --port "$port" start --headless --file "$edit_file" \
  > "$evidence_dir/editability-server.log" 2>&1 &
server_pid="$!"
ready=false
for _ in $(seq 1 40); do
  if "$op_bin" --port "$port" status >/dev/null 2>&1; then ready=true; break; fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "OpenPencil editability server exited before becoming ready" >&2
    cat "$evidence_dir/editability-server.log" >&2 || true
    exit 1
  fi
  sleep 0.5
done
[[ "$ready" == true ]] || { echo "OpenPencil editability server did not become ready" >&2; exit 1; }

probe_patch="$work_dir/probe-patch.json"
python3 - "$probe_content" "$probe_patch" <<'PY'
import json
import pathlib
import sys
pathlib.Path(sys.argv[2]).write_text(json.dumps({"content": sys.argv[1]}, ensure_ascii=False), encoding="utf-8")
PY

"$op_bin" --port "$port" update "$probe_node" "@$probe_patch" --page "$probe_page" \
  > "$evidence_dir/editability-update.json"
"$op_bin" --port "$port" get --id "$probe_node" --depth 0 --page "$probe_page" \
  > "$evidence_dir/editability-readback.json"
"$op_bin" --port "$port" stop > "$evidence_dir/stop-editability.json" 2>&1 || true
if kill -0 "$server_pid" 2>/dev/null; then
  wait "$server_pid" 2>/dev/null || true
fi
server_pid=""

python3 - "$evidence_dir/editability-readback.json" "$probe_content" "$edit_file" "$candidate_file" "$evidence_dir/editability-summary.json" <<'PY'
import hashlib
import json
import pathlib
import sys

readback_path = pathlib.Path(sys.argv[1])
probe_content = sys.argv[2]
edit_path = pathlib.Path(sys.argv[3])
candidate_path = pathlib.Path(sys.argv[4])
out_path = pathlib.Path(sys.argv[5])

raw_readback = readback_path.read_text(encoding="utf-8")
try:
    readback = json.loads(raw_readback)
except json.JSONDecodeError as exc:
    raise SystemExit(f"Editability readback is not JSON: {exc}")

# The CLI may wrap the node in a result envelope; search recursively for the patched content.
def contains_content(value):
    if isinstance(value, dict):
        if value.get("content") == probe_content:
            return True
        return any(contains_content(v) for v in value.values())
    if isinstance(value, list):
        return any(contains_content(v) for v in value)
    return False

if not contains_content(readback):
    raise SystemExit("Editability readback does not contain the patched text content")

candidate_raw = candidate_path.read_bytes()
edit_raw = edit_path.read_bytes()
if edit_raw == candidate_raw:
    raise SystemExit("Editable copy did not persist a file-level change")

summary = {
    "readbackContainsPatchedContent": True,
    "candidateSha256AfterProbe": hashlib.sha256(candidate_raw).hexdigest(),
    "editableCopySha256": hashlib.sha256(edit_raw).hexdigest(),
    "editableCopyChanged": True,
}
out_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY

[[ "$(sha256_file "$candidate_file")" == "$expected_candidate_sha256" ]] || {
  echo "Canonical candidate changed after isolated editability probe" >&2
  exit 1
}

python3 - "$evidence_dir/structural-acceptance.json" "$evidence_dir/variables.json" "$evidence_dir/render-manifest.json" "$evidence_dir/editability-summary.json" "$evidence_dir/acceptance-summary.json" <<'PY'
import json
import pathlib
import sys

structural = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
variables_raw = pathlib.Path(sys.argv[2]).read_text(encoding="utf-8")
renders = json.loads(pathlib.Path(sys.argv[3]).read_text(encoding="utf-8"))
editability = json.loads(pathlib.Path(sys.argv[4]).read_text(encoding="utf-8"))

def variable_count(value):
    if isinstance(value, list):
        return len(value)
    if isinstance(value, dict):
        for key in ("variables", "items"):
            if isinstance(value.get(key), list):
                return len(value[key])
        # Generic MCP envelopes are counted only when they expose a concrete list.
    return 0

try:
    variables_value = json.loads(variables_raw)
except json.JSONDecodeError:
    variables_value = None

summary = {
    "candidateIdentityValid": True,
    "pageCount": structural["candidate"]["pageCount"],
    "recursiveNodeCount": structural["candidate"]["recursiveNodeCount"],
    "validatedScreenCount": structural["validatedScreenCount"],
    "renderedScreenCount": len(renders["renders"]),
    "reusableNodeCount": structural["reusableNodeCount"],
    "jsonVariableStorePresent": structural["jsonVariableStorePresent"],
    "openPencilVariableCount": variable_count(variables_value),
    "editabilityProbePassed": bool(editability.get("readbackContainsPatchedContent") and editability.get("editableCopyChanged")),
    "manualVisualReviewRequired": True,
    "promotionReady": False,
    "semanticWarnings": [],
}
if not summary["jsonVariableStorePresent"] and summary["openPencilVariableCount"] == 0:
    summary["semanticWarnings"].append("Figma variable/token linkage is not represented by an imported OpenPencil variable store; visual styles are present as concrete node values.")
pathlib.Path(sys.argv[5]).write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY

printf 'OpenPencil visual acceptance evidence written to %s\n' "$evidence_dir"
