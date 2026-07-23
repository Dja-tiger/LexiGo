#!/usr/bin/env python3
"""Reclaim repository-scoped GitHub Actions artifact and cache storage."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Protocol

API_VERSION = "2022-11-28"
DEFAULT_API_URL = "https://api.github.com"


class CleanupClient(Protocol):
    def list_artifacts(self) -> list[dict[str, Any]]: ...

    def list_caches(self) -> list[dict[str, Any]]: ...

    def delete_artifact(self, artifact_id: int) -> None: ...

    def delete_cache(self, cache_id: int) -> None: ...


@dataclass(frozen=True)
class CleanupPolicy:
    artifact_retention_days: int
    cache_retention_days: int
    delete_all_caches: bool
    dry_run: bool


class GitHubActionsClient:
    def __init__(self, repository: str, token: str, api_url: str = DEFAULT_API_URL) -> None:
        if repository.count("/") != 1:
            raise ValueError("repository must use owner/name format")
        if not token:
            raise ValueError("ACTIONS_STORAGE_TOKEN is required")
        self.repository = repository
        self.token = token
        self.api_url = api_url.rstrip("/")

    def _request(self, method: str, path: str) -> dict[str, Any] | None:
        url = f"{self.api_url}{path}"
        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.token}",
            "User-Agent": "lexigo-actions-storage-cleanup",
            "X-GitHub-Api-Version": API_VERSION,
        }
        request = urllib.request.Request(url, headers=headers, method=method)

        for attempt in range(1, 4):
            try:
                with urllib.request.urlopen(request, timeout=60) as response:
                    payload = response.read()
                    return json.loads(payload) if payload else None
            except urllib.error.HTTPError as error:
                if error.code == 404 and method == "DELETE":
                    return None
                retryable = error.code in {429, 500, 502, 503, 504}
                if retryable and attempt < 3:
                    time.sleep(attempt * 2)
                    continue
                detail = error.read().decode("utf-8", errors="replace")
                raise RuntimeError(f"GitHub API {method} {path} failed with {error.code}: {detail}") from error
            except urllib.error.URLError as error:
                if attempt < 3:
                    time.sleep(attempt * 2)
                    continue
                raise RuntimeError(f"GitHub API {method} {path} failed: {error.reason}") from error

        raise RuntimeError(f"GitHub API {method} {path} failed after retries")

    def _list_paginated(self, path: str, field: str) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        page = 1
        while True:
            separator = "&" if "?" in path else "?"
            payload = self._request("GET", f"{path}{separator}per_page=100&page={page}") or {}
            page_items = payload.get(field, [])
            if not isinstance(page_items, list):
                raise RuntimeError(f"GitHub API response field {field!r} is not a list")
            items.extend(page_items)
            if len(page_items) < 100:
                return items
            page += 1

    def list_artifacts(self) -> list[dict[str, Any]]:
        return self._list_paginated(
            f"/repos/{self.repository}/actions/artifacts",
            "artifacts",
        )

    def list_caches(self) -> list[dict[str, Any]]:
        return self._list_paginated(
            f"/repos/{self.repository}/actions/caches",
            "actions_caches",
        )

    def delete_artifact(self, artifact_id: int) -> None:
        self._request("DELETE", f"/repos/{self.repository}/actions/artifacts/{artifact_id}")

    def delete_cache(self, cache_id: int) -> None:
        self._request("DELETE", f"/repos/{self.repository}/actions/caches/{cache_id}")


def parse_github_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def select_artifact_candidates(
    artifacts: list[dict[str, Any]],
    *,
    cutoff: datetime,
) -> list[dict[str, Any]]:
    candidates = []
    for artifact in artifacts:
        created_at = parse_github_timestamp(str(artifact["created_at"]))
        if artifact.get("expired") is True or created_at < cutoff:
            candidates.append(artifact)
    return candidates


def select_cache_candidates(
    caches: list[dict[str, Any]],
    *,
    cutoff: datetime,
    delete_all: bool,
) -> list[dict[str, Any]]:
    if delete_all:
        return list(caches)

    candidates = []
    for cache in caches:
        last_accessed = parse_github_timestamp(
            str(cache.get("last_accessed_at") or cache["created_at"]),
        )
        if last_accessed < cutoff:
            candidates.append(cache)
    return candidates


def total_bytes(items: list[dict[str, Any]]) -> int:
    return sum(int(item.get("size_in_bytes") or 0) for item in items)


def cleanup_storage(
    client: CleanupClient,
    policy: CleanupPolicy,
    *,
    now: datetime | None = None,
) -> dict[str, Any]:
    current_time = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    artifact_cutoff = current_time - timedelta(days=policy.artifact_retention_days)
    cache_cutoff = current_time - timedelta(days=policy.cache_retention_days)

    artifacts = client.list_artifacts()
    caches = client.list_caches()
    artifact_candidates = select_artifact_candidates(artifacts, cutoff=artifact_cutoff)
    cache_candidates = select_cache_candidates(
        caches,
        cutoff=cache_cutoff,
        delete_all=policy.delete_all_caches,
    )

    errors: list[str] = []
    deleted_artifacts = 0
    deleted_caches = 0

    if not policy.dry_run:
        for artifact in artifact_candidates:
            try:
                client.delete_artifact(int(artifact["id"]))
                deleted_artifacts += 1
            except Exception as error:  # noqa: BLE001 - report all API failures together
                errors.append(f"artifact {artifact.get('id')}: {error}")

        for cache in cache_candidates:
            try:
                client.delete_cache(int(cache["id"]))
                deleted_caches += 1
            except Exception as error:  # noqa: BLE001 - report all API failures together
                errors.append(f"cache {cache.get('id')}: {error}")

    return {
        "generatedAt": current_time.isoformat(),
        "dryRun": policy.dry_run,
        "policy": {
            "artifactRetentionDays": policy.artifact_retention_days,
            "cacheRetentionDays": policy.cache_retention_days,
            "deleteAllCaches": policy.delete_all_caches,
        },
        "inventory": {
            "artifactCount": len(artifacts),
            "artifactBytes": total_bytes(artifacts),
            "cacheCount": len(caches),
            "cacheBytes": total_bytes(caches),
        },
        "candidates": {
            "artifactCount": len(artifact_candidates),
            "artifactBytes": total_bytes(artifact_candidates),
            "cacheCount": len(cache_candidates),
            "cacheBytes": total_bytes(cache_candidates),
        },
        "deleted": {
            "artifactCount": deleted_artifacts,
            "cacheCount": deleted_caches,
            "estimatedBytes": 0 if policy.dry_run else (
                total_bytes(artifact_candidates) + total_bytes(cache_candidates)
            ),
        },
        "errors": errors,
    }


def format_bytes(value: int) -> str:
    units = ["B", "KiB", "MiB", "GiB", "TiB"]
    amount = float(value)
    for unit in units:
        if amount < 1024 or unit == units[-1]:
            return f"{amount:.1f} {unit}"
        amount /= 1024
    return f"{value} B"


def render_markdown(summary: dict[str, Any]) -> str:
    inventory = summary["inventory"]
    candidates = summary["candidates"]
    deleted = summary["deleted"]
    mode = "dry-run" if summary["dryRun"] else "apply"
    lines = [
        "## GitHub Actions storage cleanup",
        "",
        f"Mode: **{mode}**",
        "",
        "| Resource | Inventory | Selected | Deleted |",
        "| --- | ---: | ---: | ---: |",
        (
            f"| Artifacts | {inventory['artifactCount']} "
            f"({format_bytes(inventory['artifactBytes'])}) | "
            f"{candidates['artifactCount']} ({format_bytes(candidates['artifactBytes'])}) | "
            f"{deleted['artifactCount']} |"
        ),
        (
            f"| Actions caches | {inventory['cacheCount']} "
            f"({format_bytes(inventory['cacheBytes'])}) | "
            f"{candidates['cacheCount']} ({format_bytes(candidates['cacheBytes'])}) | "
            f"{deleted['cacheCount']} |"
        ),
        "",
        f"Estimated reclaimed storage: **{format_bytes(deleted['estimatedBytes'])}**.",
    ]
    if summary["errors"]:
        lines.extend(["", "### Errors", ""])
        lines.extend(f"- {error}" for error in summary["errors"])
    return "\n".join(lines) + "\n"


def positive_or_zero(value: str) -> int:
    parsed = int(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("value must be zero or greater")
    return parsed


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", required=True, help="Repository in owner/name format")
    parser.add_argument(
        "--artifact-retention-days",
        type=positive_or_zero,
        default=3,
        help="Delete artifacts older than this number of days",
    )
    parser.add_argument(
        "--cache-retention-days",
        type=positive_or_zero,
        default=0,
        help="Delete caches not accessed within this number of days",
    )
    parser.add_argument(
        "--delete-all-caches",
        action="store_true",
        help="Delete every repository Actions cache regardless of age",
    )
    parser.add_argument("--dry-run", action="store_true", help="List candidates without deleting them")
    parser.add_argument("--summary-file", type=Path)
    parser.add_argument("--github-step-summary", type=Path)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    token = os.environ.get("ACTIONS_STORAGE_TOKEN", "")
    client = GitHubActionsClient(args.repository, token)
    policy = CleanupPolicy(
        artifact_retention_days=args.artifact_retention_days,
        cache_retention_days=args.cache_retention_days,
        delete_all_caches=args.delete_all_caches,
        dry_run=args.dry_run,
    )
    summary = cleanup_storage(client, policy)
    rendered_json = json.dumps(summary, indent=2, sort_keys=True) + "\n"
    print(rendered_json, end="")

    if args.summary_file:
        args.summary_file.parent.mkdir(parents=True, exist_ok=True)
        args.summary_file.write_text(rendered_json, encoding="utf-8")
    if args.github_step_summary:
        args.github_step_summary.parent.mkdir(parents=True, exist_ok=True)
        with args.github_step_summary.open("a", encoding="utf-8") as handle:
            handle.write(render_markdown(summary))

    return 1 if summary["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
