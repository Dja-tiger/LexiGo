#!/usr/bin/env python3
"""Regression contract for the active GitHub Actions runner profile."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"
HOSTED_RUNNER = "runs-on: ${{ vars.CI_RUNNER || 'ubuntu-latest' }}"


def require(condition: bool, message: str, violations: list[str]) -> None:
    if not condition:
        violations.append(message)


def main() -> None:
    violations: list[str] = []
    ci = (WORKFLOWS / "ci.yml").read_text(encoding="utf-8")
    require(ci.count(HOSTED_RUNNER) == 9, "ci.yml: expected nine configurable runner jobs", violations)
    require("  change-scope:\n" in ci, "ci.yml: change-scope job is required", violations)
    require("  agent-docs:\n" in ci, "ci.yml: Agent Docs validation job is required", violations)
    require("self-hosted" not in ci, "ci.yml: hard-coded self-hosted labels are forbidden", violations)
    require("max-parallel: 1" not in ci, "ci.yml: hosted matrices must not be serialized", violations)
    require("ci-resource-cleanup:" not in ci, "ci.yml: shared-host cleanup job must be absent", violations)

    storage = (WORKFLOWS / "actions-storage-cleanup.yml").read_text(encoding="utf-8")
    require(storage.count(HOSTED_RUNNER) == 2, "storage cleanup: expected two configurable runner jobs", violations)
    require("self-hosted" not in storage, "storage cleanup must not require Selectel", violations)

    cleanup = (WORKFLOWS / "runner-resource-cleanup.yml").read_text(encoding="utf-8")
    require("schedule:" not in cleanup, "scheduled Selectel cleanup must remain disabled", violations)
    require("workflow_dispatch:" in cleanup, "manual Selectel cleanup entry point is required", violations)

    if violations:
        raise SystemExit("\n".join(violations))
    print("Validated GitHub-hosted CI profile with unrestricted matrices and Agent Docs routing")


if __name__ == "__main__":
    main()
