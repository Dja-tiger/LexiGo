#!/usr/bin/env python3
"""Compile lossless native Figma variable evidence into ZSeven OpenPencil tokens.

The native evidence preserves Figma collections, modes and aliases. ZSeven
OpenPencil v0.8.2 has a global variable namespace and no variable-to-variable
alias scalar, so runtime variables use collection-namespaced keys and alias
values are resolved deterministically. The emitted provenance file retains the
original alias graph so AI tooling can preserve/cascade that semantic layer.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from pathlib import Path
from typing import Any

EXPECTED_VARIABLE_COUNT = 92
EXPECTED_COLLECTION_COUNT = 6
EXPECTED_ALIAS_COUNT = 40
TYPE_MAP = {
    "COLOR": "color",
    "FLOAT": "number",
    "STRING": "string",
    "BOOLEAN": "boolean",
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(path: Path, value: Any) -> str:
    encoded = (json.dumps(value, indent=2, ensure_ascii=False, sort_keys=True) + "\n").encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(encoded)
    return sha256_bytes(encoded)


def slugify(value: str) -> str:
    slug = value.strip().lower().replace("&", " and ")
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    if not slug:
        raise ValueError(f"Cannot derive stable collection slug from {value!r}")
    return slug


def rgba_to_hex(value: dict[str, Any]) -> str:
    required = ("r", "g", "b", "a")
    if any(key not in value for key in required):
        raise ValueError(f"COLOR value is missing RGBA fields: {value!r}")
    channels: list[int] = []
    for key in required:
        raw = value[key]
        if not isinstance(raw, (int, float)) or not math.isfinite(float(raw)):
            raise ValueError(f"COLOR channel {key} is not finite: {raw!r}")
        channels.append(max(0, min(255, round(float(raw) * 255))))
    if channels[3] == 255:
        return "#{:02X}{:02X}{:02X}".format(*channels[:3])
    return "#{:02X}{:02X}{:02X}{:02X}".format(*channels)


def scalar_for_type(figma_type: str, value: Any) -> Any:
    if figma_type == "COLOR":
        if not isinstance(value, dict) or "aliasId" in value:
            raise ValueError(f"Resolved COLOR must be an RGBA object, got {value!r}")
        return rgba_to_hex(value)
    if figma_type == "FLOAT":
        if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
            raise ValueError(f"Resolved FLOAT must be finite, got {value!r}")
        return value
    if figma_type == "STRING":
        if not isinstance(value, str):
            raise ValueError(f"Resolved STRING must be text, got {value!r}")
        return value
    if figma_type == "BOOLEAN":
        if not isinstance(value, bool):
            raise ValueError(f"Resolved BOOLEAN must be bool, got {value!r}")
        return value
    raise ValueError(f"Unsupported Figma variable type {figma_type!r}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--native", required=True, type=Path)
    parser.add_argument("--variables-out", required=True, type=Path)
    parser.add_argument("--themes-out", required=True, type=Path)
    parser.add_argument("--provenance-out", required=True, type=Path)
    args = parser.parse_args()

    native_raw = args.native.read_bytes()
    native = json.loads(native_raw)
    summary = native.get("summary", {})
    if summary.get("variableCount") != EXPECTED_VARIABLE_COUNT:
        raise SystemExit(f"Expected {EXPECTED_VARIABLE_COUNT} variables, got {summary.get('variableCount')!r}")
    if summary.get("collectionCount") != EXPECTED_COLLECTION_COUNT:
        raise SystemExit(f"Expected {EXPECTED_COLLECTION_COUNT} collections, got {summary.get('collectionCount')!r}")
    if summary.get("aliasCount") != EXPECTED_ALIAS_COUNT:
        raise SystemExit(f"Expected {EXPECTED_ALIAS_COUNT} aliases, got {summary.get('aliasCount')!r}")
    if summary.get("unresolvedAliasCount") != 0 or summary.get("incompleteModeValueCount") != 0:
        raise SystemExit("Native variable evidence contains unresolved aliases or incomplete mode values")

    collections = native.get("collections")
    if not isinstance(collections, list):
        raise SystemExit("Native variable evidence is missing collections[]")

    collection_by_id: dict[str, dict[str, Any]] = {}
    variable_by_id: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
    key_by_id: dict[str, str] = {}
    seen_keys: set[str] = set()

    for collection in collections:
        collection_id = collection["id"]
        if collection_id in collection_by_id:
            raise SystemExit(f"Duplicate collection id {collection_id}")
        collection_by_id[collection_id] = collection
        prefix = slugify(collection["name"])
        for variable in collection["variables"]:
            variable_id = variable["id"]
            if variable_id in variable_by_id:
                raise SystemExit(f"Duplicate variable id {variable_id}")
            if variable["type"] not in TYPE_MAP:
                raise SystemExit(f"Unsupported type {variable['type']!r} for {variable_id}")
            openpencil_key = f"{prefix}/{variable['name']}"
            if openpencil_key in seen_keys:
                raise SystemExit(f"OpenPencil variable key collision: {openpencil_key}")
            seen_keys.add(openpencil_key)
            variable_by_id[variable_id] = (collection, variable)
            key_by_id[variable_id] = openpencil_key

    if len(variable_by_id) != EXPECTED_VARIABLE_COUNT:
        raise SystemExit(f"Indexed {len(variable_by_id)} variables, expected {EXPECTED_VARIABLE_COUNT}")

    def mode_name(collection: dict[str, Any], mode_id: str) -> str:
        for mode in collection["modes"]:
            if mode["modeId"] == mode_id:
                return mode["name"]
        raise ValueError(f"Unknown mode {mode_id!r} in collection {collection['name']!r}")

    def alias_target_mode(target_collection: dict[str, Any], source_mode_name: str) -> str:
        exact = [m["modeId"] for m in target_collection["modes"] if m["name"] == source_mode_name]
        if len(exact) == 1:
            return exact[0]
        modes = target_collection["modes"]
        if len(modes) == 1:
            return modes[0]["modeId"]
        raise ValueError(
            f"Alias target collection {target_collection['name']!r} has no unambiguous mode "
            f"for source mode {source_mode_name!r}"
        )

    def resolve(variable_id: str, mode_id: str, stack: tuple[str, ...] = ()) -> tuple[Any, list[str]]:
        if variable_id in stack:
            cycle = " -> ".join((*stack, variable_id))
            raise ValueError(f"Variable alias cycle detected: {cycle}")
        collection, variable = variable_by_id[variable_id]
        try:
            value = variable["valuesByMode"][mode_id]
        except KeyError as exc:
            raise ValueError(f"Variable {variable_id} has no value for mode {mode_id}") from exc
        if isinstance(value, dict) and set(value.keys()) == {"aliasId"}:
            target_id = value["aliasId"]
            if target_id not in variable_by_id:
                raise ValueError(f"Variable {variable_id} aliases unknown variable {target_id}")
            target_collection, _ = variable_by_id[target_id]
            target_mode = alias_target_mode(target_collection, mode_name(collection, mode_id))
            resolved, chain = resolve(target_id, target_mode, (*stack, variable_id))
            return resolved, [target_id, *chain]
        return value, []

    themes: dict[str, list[str]] = {}
    runtime_variables: dict[str, dict[str, Any]] = {}
    provenance_collections: list[dict[str, Any]] = []
    alias_edges = 0

    for collection in collections:
        modes = collection["modes"]
        axis_name = collection["name"] if len(modes) > 1 else None
        if axis_name:
            if axis_name in themes:
                raise SystemExit(f"Duplicate theme axis name {axis_name!r}")
            themes[axis_name] = [mode["name"] for mode in modes]

        provenance_variables: list[dict[str, Any]] = []
        for variable in collection["variables"]:
            variable_id = variable["id"]
            openpencil_key = key_by_id[variable_id]
            runtime_type = TYPE_MAP[variable["type"]]
            runtime_values: list[dict[str, Any]] = []
            provenance_modes: dict[str, Any] = {}

            for mode in modes:
                mode_id = mode["modeId"]
                raw_value = variable["valuesByMode"][mode_id]
                resolved_raw, alias_chain_ids = resolve(variable_id, mode_id)
                resolved = scalar_for_type(variable["type"], resolved_raw)
                source: dict[str, Any]
                if isinstance(raw_value, dict) and set(raw_value.keys()) == {"aliasId"}:
                    alias_edges += 1
                    target_id = raw_value["aliasId"]
                    source = {
                        "kind": "alias",
                        "targetFigmaVariableId": target_id,
                        "targetOpenPencilVariable": key_by_id[target_id],
                        "aliasChainFigmaVariableIds": alias_chain_ids,
                        "aliasChainOpenPencilVariables": [key_by_id[item] for item in alias_chain_ids],
                    }
                else:
                    source = {"kind": "literal", "value": raw_value}

                provenance_modes[mode_id] = {
                    "modeName": mode["name"],
                    "source": source,
                    "resolvedOpenPencilValue": resolved,
                }
                if axis_name:
                    runtime_values.append({"value": resolved, "theme": {axis_name: mode["name"]}})

            if axis_name:
                runtime_value: Any = runtime_values
            else:
                only_mode = modes[0]
                resolved_raw, _ = resolve(variable_id, only_mode["modeId"])
                runtime_value = scalar_for_type(variable["type"], resolved_raw)

            runtime_variables[openpencil_key] = {"type": runtime_type, "value": runtime_value}
            provenance_variables.append(
                {
                    "figmaVariableId": variable_id,
                    "figmaName": variable["name"],
                    "figmaType": variable["type"],
                    "openPencilVariable": openpencil_key,
                    "openPencilType": runtime_type,
                    "description": variable.get("description", ""),
                    "hiddenFromPublishing": bool(variable.get("hiddenFromPublishing")),
                    "figmaKey": variable.get("key"),
                    "figmaVersion": variable.get("version"),
                    "valuesByMode": provenance_modes,
                }
            )

        provenance_collections.append(
            {
                "figmaCollectionId": collection["id"],
                "figmaCollectionName": collection["name"],
                "openPencilNamespace": slugify(collection["name"]),
                "defaultModeId": collection["defaultModeId"],
                "themeAxis": axis_name,
                "modes": collection["modes"],
                "variables": provenance_variables,
            }
        )

    if len(runtime_variables) != EXPECTED_VARIABLE_COUNT:
        raise SystemExit(f"Compiled {len(runtime_variables)} runtime variables, expected {EXPECTED_VARIABLE_COUNT}")
    if alias_edges != EXPECTED_ALIAS_COUNT:
        raise SystemExit(f"Compiled {alias_edges} alias edges, expected {EXPECTED_ALIAS_COUNT}")

    variables_sha = write_json(args.variables_out, runtime_variables)
    themes_sha = write_json(args.themes_out, themes)
    provenance = {
        "schemaVersion": 1,
        "source": {
            "nativeEvidenceSha256": sha256_bytes(native_raw),
            "figFileSha256": native["source"]["sha256"],
            "figFileBytes": native["source"]["bytes"],
            "extractor": native["extractor"],
        },
        "target": {
            "editor": "ZSeven-W/openpencil",
            "version": "v0.8.2",
            "globalVariableNaming": "<collection-slug>/<figma-variable-name>",
            "aliasStrategy": "lossless provenance graph + resolved runtime scalar/themed values",
            "limitations": [
                "ZSeven OpenPencil v0.8.2 has no variable-to-variable alias value; alias relationships are preserved in this graph and compiled to resolved runtime values.",
                "The v0.8.2 Figma importer does not preserve imported node-to-variable bindings; existing imported nodes retain concrete visual values.",
            ],
        },
        "summary": {
            "collectionCount": len(collections),
            "variableCount": len(runtime_variables),
            "aliasCount": alias_edges,
            "themeAxisCount": len(themes),
            "typeCounts": summary["typeCounts"],
            "runtimeVariablesSha256": variables_sha,
            "runtimeThemesSha256": themes_sha,
        },
        "themeAxes": themes,
        "collections": provenance_collections,
    }
    provenance_sha = write_json(args.provenance_out, provenance)

    print(
        json.dumps(
            {
                "ok": True,
                "collectionCount": len(collections),
                "variableCount": len(runtime_variables),
                "aliasCount": alias_edges,
                "themeAxisCount": len(themes),
                "variablesSha256": variables_sha,
                "themesSha256": themes_sha,
                "provenanceSha256": provenance_sha,
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
