#!/usr/bin/env python3
"""Classify and validate LexiGo Agent Docs CI scope evidence.

The classifier is intentionally fail-closed: an empty, malformed or unavailable
base/head range is treated as a normal product change, so the complete CI and
stage eligibility gates remain enabled.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Iterable, Sequence

AGENT_DOC_EXACT_PATHS = frozenset({"AGENTS.md", "docs/agent-harness.md"})
AGENT_DOC_DIRECTORY = ".agents"
ZERO_SHA = "0" * 40


@dataclass(frozen=True)
class ScopeResult:
    agent_docs_only: bool
    reason: str
    base_sha: str
    head_sha: str
    changed_paths: tuple[str, ...]

    def as_json(self) -> dict[str, object]:
        return {
            "schema_version": 1,
            "agent_docs_only": self.agent_docs_only,
            "reason": self.reason,
            "base_sha": self.base_sha,
            "head_sha": self.head_sha,
            "changed_paths": list(self.changed_paths),
        }


def is_agent_docs_path(path: str) -> bool:
    """Return True only for the explicitly approved Agent Harness paths."""

    if not path or "\\" in path:
        return False

    candidate = PurePosixPath(path)
    if candidate.is_absolute() or ".." in candidate.parts:
        return False

    normalized = candidate.as_posix()
    if normalized in AGENT_DOC_EXACT_PATHS:
        return True

    return len(candidate.parts) > 1 and candidate.parts[0] == AGENT_DOC_DIRECTORY


def classify_paths(paths: Iterable[str]) -> tuple[bool, tuple[str, ...]]:
    """Classify an already resolved path set.

    Empty changes are deliberately not considered Agent Docs. This preserves the
    complete product gates when Git history cannot prove a meaningful diff.
    """

    normalized = tuple(dict.fromkeys(path for path in paths if path))
    return bool(normalized) and all(is_agent_docs_path(path) for path in normalized), normalized


def _commit_exists(repo: Path, sha: str) -> bool:
    if not sha or sha == ZERO_SHA:
        return False

    process = subprocess.run(
        ["git", "cat-file", "-e", f"{sha}^{{commit}}"],
        cwd=repo,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return process.returncode == 0


def _changed_paths(repo: Path, base_sha: str, head_sha: str) -> tuple[str, ...]:
    process = subprocess.run(
        ["git", "diff", "--name-only", "-z", base_sha, head_sha, "--"],
        cwd=repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if process.returncode != 0:
        message = process.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(message or "git diff failed")

    decoded = process.stdout.decode("utf-8", errors="strict")
    return tuple(path for path in decoded.split("\0") if path)


def classify_change_range(repo: Path, base_sha: str, head_sha: str) -> ScopeResult:
    repo = repo.resolve()
    base_sha = base_sha.strip()
    head_sha = head_sha.strip()

    if not (repo / ".git").exists():
        return ScopeResult(False, "repository_unavailable", base_sha, head_sha, ())
    if not _commit_exists(repo, base_sha):
        return ScopeResult(False, "base_commit_unavailable", base_sha, head_sha, ())
    if not _commit_exists(repo, head_sha):
        return ScopeResult(False, "head_commit_unavailable", base_sha, head_sha, ())

    try:
        paths = _changed_paths(repo, base_sha, head_sha)
    except (RuntimeError, UnicodeDecodeError):
        return ScopeResult(False, "changed_paths_unavailable", base_sha, head_sha, ())

    agent_docs_only, normalized = classify_paths(paths)
    reason = "agent_docs_only" if agent_docs_only else ("empty_change_set" if not normalized else "non_agent_docs_change")
    return ScopeResult(agent_docs_only, reason, base_sha, head_sha, normalized)


def _append_github_output(path: Path, values: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as output:
        for key, value in values.items():
            output.write(f"{key}={value}\n")


def _write_artifact(path: Path, result: ScopeResult) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(result.as_json(), ensure_ascii=True, indent=2, sort_keys=True)
    path.write_text(payload + "\n", encoding="utf-8")


def validate_artifact(path: Path, expected_head_sha: str) -> ScopeResult:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or payload.get("schema_version") != 1:
        raise ValueError("unsupported or missing CI scope schema")

    agent_docs_only = payload.get("agent_docs_only")
    reason = payload.get("reason")
    base_sha = payload.get("base_sha")
    head_sha = payload.get("head_sha")
    changed_paths = payload.get("changed_paths")

    if not isinstance(agent_docs_only, bool):
        raise ValueError("agent_docs_only must be a boolean")
    if not isinstance(reason, str) or not reason:
        raise ValueError("scope reason must be a non-empty string")
    if not isinstance(base_sha, str) or not base_sha:
        raise ValueError("base_sha must be a non-empty string")
    if not isinstance(head_sha, str) or head_sha != expected_head_sha:
        raise ValueError("scope artifact head_sha does not match the completed CI run")
    if not isinstance(changed_paths, list) or not all(isinstance(path, str) for path in changed_paths):
        raise ValueError("changed_paths must be a string list")

    recalculated, normalized = classify_paths(changed_paths)
    if recalculated != agent_docs_only:
        raise ValueError("scope artifact classification does not match its changed paths")
    if agent_docs_only and reason != "agent_docs_only":
        raise ValueError("Agent Docs artifact has an inconsistent reason")
    if not agent_docs_only and reason == "agent_docs_only":
        raise ValueError("non-Agent-Docs artifact has an inconsistent reason")

    return ScopeResult(agent_docs_only, reason, base_sha, head_sha, normalized)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    classify = subparsers.add_parser("classify", help="classify one Git commit range")
    classify.add_argument("--repo", type=Path, default=Path.cwd())
    classify.add_argument("--base-sha", required=True)
    classify.add_argument("--head-sha", required=True)
    classify.add_argument("--github-output", type=Path)
    classify.add_argument("--artifact", type=Path, required=True)

    validate = subparsers.add_parser("validate-artifact", help="validate scope evidence from an exact CI run")
    validate.add_argument("--artifact", type=Path, required=True)
    validate.add_argument("--expected-head-sha", required=True)
    validate.add_argument("--github-output", type=Path, required=True)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(sys.argv[1:] if argv is None else argv)

    if args.command == "classify":
        result = classify_change_range(args.repo, args.base_sha, args.head_sha)
        if args.github_output is not None:
            _append_github_output(
                args.github_output,
                {
                    "agent_docs_only": "true" if result.agent_docs_only else "false",
                    "scope_reason": result.reason,
                    "changed_path_count": str(len(result.changed_paths)),
                },
            )
        _write_artifact(args.artifact, result)
    else:
        result = validate_artifact(args.artifact, args.expected_head_sha.strip())
        _append_github_output(
            args.github_output,
            {
                "agent_docs_only": "true" if result.agent_docs_only else "false",
                "scope_reason": result.reason,
            },
        )

    print(json.dumps(result.as_json(), ensure_ascii=True, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
