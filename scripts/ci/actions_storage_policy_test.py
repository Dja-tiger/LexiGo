#!/usr/bin/env python3
"""Regression checks for bounded GitHub Actions storage usage."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW_DIR = ROOT / ".github" / "workflows"


def step_block(lines: list[str], uses_index: int) -> list[str]:
    uses_indent = len(lines[uses_index]) - len(lines[uses_index].lstrip())
    step_indent = max(uses_indent - 2, 0)
    end = uses_index + 1
    while end < len(lines):
        stripped = lines[end].lstrip()
        indent = len(lines[end]) - len(stripped)
        if indent == step_indent and stripped.startswith("- "):
            break
        end += 1
    return lines[uses_index:end]


def main() -> None:
    paths = sorted(WORKFLOW_DIR.glob("*.yml"))
    violations: list[str] = []
    upload_count = 0

    for path in paths:
        text = path.read_text(encoding="utf-8")
        lines = text.splitlines()
        if "type=gha" in text:
            violations.append(f"{path}: GitHub Actions cache import/export is prohibited")

        for index, line in enumerate(lines):
            if line.strip() != "uses: actions/upload-artifact@v7":
                continue
            upload_count += 1
            block = step_block(lines, index)
            if not any(item.strip() == "continue-on-error: true" for item in block):
                violations.append(f"{path}:{index + 1}: artifact upload must be non-blocking")
            retention = [item for item in block if item.strip().startswith("retention-days:")]
            if len(retention) != 1:
                violations.append(f"{path}:{index + 1}: define exactly one retention-days value")
                continue
            days = int(retention[0].split(":", 1)[1].strip())
            if days > 3:
                violations.append(f"{path}:{index + 1}: retention-days {days} exceeds 3")

    ci = (WORKFLOW_DIR / "ci.yml").read_text(encoding="utf-8")
    condition = "if: failure() && matrix.suite == 'ui-runtime' && steps.performance.outcome != 'skipped'"
    if condition not in ci:
        violations.append("ci.yml: successful performance runs must not upload an artifact")

    cleanup = (WORKFLOW_DIR / "actions-storage-cleanup.yml").read_text(encoding="utf-8")
    if "lexigo-actions-storage-cleanup-${{ github.event_name }}-${{ github.run_id }}" not in cleanup:
        violations.append("cleanup workflow needs a unique concurrency group")
    if "[actions-storage-emergency]" not in cleanup:
        violations.append("cleanup workflow emergency marker is missing")

    if upload_count < 1:
        violations.append("No upload-artifact steps found")
    if violations:
        raise SystemExit("
".join(violations))
    print(f"Validated {upload_count} bounded artifact upload steps across {len(paths)} workflows")


if __name__ == "__main__":
    main()
