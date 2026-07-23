#!/usr/bin/env python3
"""Unit tests for the repository Actions storage cleanup planner."""

from __future__ import annotations

import unittest
from datetime import datetime, timezone
from typing import Any

from actions_storage_cleanup import (
    CleanupPolicy,
    cleanup_storage,
    format_bytes,
    parse_github_timestamp,
    select_artifact_candidates,
    select_cache_candidates,
)

NOW = datetime(2026, 7, 23, 16, 0, tzinfo=timezone.utc)


class FakeClient:
    def __init__(self) -> None:
        self.artifacts: list[dict[str, Any]] = [
            {
                "id": 1,
                "name": "recent-performance",
                "size_in_bytes": 1_500,
                "created_at": "2026-07-22T16:00:00Z",
                "expired": False,
            },
            {
                "id": 2,
                "name": "old-playwright-report",
                "size_in_bytes": 20_000_000,
                "created_at": "2026-07-18T15:59:59Z",
                "expired": False,
            },
            {
                "id": 3,
                "name": "expired-report",
                "size_in_bytes": 4_000,
                "created_at": "2026-07-23T15:00:00Z",
                "expired": True,
            },
        ]
        self.caches: list[dict[str, Any]] = [
            {
                "id": 10,
                "key": "buildkit-web",
                "ref": "refs/heads/main",
                "size_in_bytes": 350_000_000,
                "created_at": "2026-07-22T10:00:00Z",
                "last_accessed_at": "2026-07-23T15:30:00Z",
            },
            {
                "id": 11,
                "key": "buildkit-api",
                "ref": "refs/heads/main",
                "size_in_bytes": 260_000_000,
                "created_at": "2026-07-15T10:00:00Z",
                "last_accessed_at": "2026-07-20T10:00:00Z",
            },
        ]
        self.deleted_artifact_ids: list[int] = []
        self.deleted_cache_ids: list[int] = []

    def list_artifacts(self) -> list[dict[str, Any]]:
        return list(self.artifacts)

    def list_caches(self) -> list[dict[str, Any]]:
        return list(self.caches)

    def delete_artifact(self, artifact_id: int) -> None:
        self.deleted_artifact_ids.append(artifact_id)

    def delete_cache(self, cache_id: int) -> None:
        self.deleted_cache_ids.append(cache_id)


class TimestampTests(unittest.TestCase):
    def test_parses_github_utc_timestamp(self) -> None:
        parsed = parse_github_timestamp("2026-07-23T15:30:00Z")
        self.assertEqual(parsed, datetime(2026, 7, 23, 15, 30, tzinfo=timezone.utc))


class CandidateSelectionTests(unittest.TestCase):
    def test_selects_old_or_expired_artifacts(self) -> None:
        client = FakeClient()
        candidates = select_artifact_candidates(
            client.artifacts,
            cutoff=datetime(2026, 7, 20, 16, 0, tzinfo=timezone.utc),
        )
        self.assertEqual([candidate["id"] for candidate in candidates], [2, 3])

    def test_selects_every_cache_when_policy_disables_cache_retention(self) -> None:
        client = FakeClient()
        candidates = select_cache_candidates(
            client.caches,
            cutoff=NOW,
            delete_all=True,
        )
        self.assertEqual([candidate["id"] for candidate in candidates], [10, 11])

    def test_selects_only_stale_caches_when_retention_is_enabled(self) -> None:
        client = FakeClient()
        candidates = select_cache_candidates(
            client.caches,
            cutoff=datetime(2026, 7, 22, 16, 0, tzinfo=timezone.utc),
            delete_all=False,
        )
        self.assertEqual([candidate["id"] for candidate in candidates], [11])


class CleanupExecutionTests(unittest.TestCase):
    def test_dry_run_never_deletes_resources(self) -> None:
        client = FakeClient()
        summary = cleanup_storage(
            client,
            CleanupPolicy(
                artifact_retention_days=3,
                cache_retention_days=0,
                delete_all_caches=True,
                dry_run=True,
            ),
            now=NOW,
        )

        self.assertEqual(client.deleted_artifact_ids, [])
        self.assertEqual(client.deleted_cache_ids, [])
        self.assertEqual(summary["candidates"]["artifactCount"], 2)
        self.assertEqual(summary["candidates"]["cacheCount"], 2)
        self.assertEqual(summary["deleted"]["estimatedBytes"], 0)

    def test_apply_deletes_selected_artifacts_and_all_caches(self) -> None:
        client = FakeClient()
        summary = cleanup_storage(
            client,
            CleanupPolicy(
                artifact_retention_days=3,
                cache_retention_days=0,
                delete_all_caches=True,
                dry_run=False,
            ),
            now=NOW,
        )

        self.assertEqual(client.deleted_artifact_ids, [2, 3])
        self.assertEqual(client.deleted_cache_ids, [10, 11])
        self.assertEqual(summary["deleted"]["artifactCount"], 2)
        self.assertEqual(summary["deleted"]["cacheCount"], 2)
        self.assertEqual(summary["deleted"]["estimatedBytes"], 630_004_000)
        self.assertEqual(summary["errors"], [])


class FormattingTests(unittest.TestCase):
    def test_formats_binary_storage_units(self) -> None:
        self.assertEqual(format_bytes(0), "0.0 B")
        self.assertEqual(format_bytes(1024), "1.0 KiB")
        self.assertEqual(format_bytes(1024 * 1024), "1.0 MiB")


if __name__ == "__main__":
    unittest.main()
