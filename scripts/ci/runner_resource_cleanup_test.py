#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone

from runner_resource_cleanup import (
    ATTEMPT_LABEL,
    BUILDER_PATTERN,
    KIND_LABEL,
    RUN_LABEL,
    CleanupPlan,
    Decision,
    Resource,
    disk_status,
    execute_plan,
    full_labels,
    legacy_labels,
    parse_timestamp,
    plan_cleanup,
    LEGACY_VOLUME_PATTERNS,
)


REPOSITORY = "Dja-tiger/LexiGo"
NOW = datetime(2026, 7, 21, 12, 0, tzinfo=timezone.utc)


def resource(
    kind: str,
    name: str,
    *,
    run_id: str = "100",
    attempt: str = "1",
    age_hours: float = 48,
    running: bool = False,
    references: tuple[str, ...] = (),
    repository: str = REPOSITORY,
    resource_kind: str | None = None,
) -> Resource:
    return Resource(
        kind=kind,
        identifier=name,
        name=name,
        created_at=NOW - timedelta(hours=age_hours),
        labels=full_labels(
            repository,
            run_id,
            attempt,
            "test-job",
            resource_kind or kind,
        ),
        running=running,
        references=references,
    )


class FakeDocker:
    def __init__(self) -> None:
        self.calls: list[list[str]] = []

    def run(self, args, check=True):
        self.calls.append(list(args))
        return subprocess.CompletedProcess(["docker", *args], 0, "", "")


class CleanupPlannerTest(unittest.TestCase):
    def test_only_expired_owned_resources_are_removed(self) -> None:
        expired = resource("volume", "expired")
        recent = resource("volume", "recent", age_hours=2)
        foreign = resource("volume", "foreign", repository="another/repo")

        plan = plan_cleanup(
            [expired, recent, foreign], REPOSITORY, NOW, timedelta(hours=24)
        )

        self.assertEqual([item.name for item in plan.removals], ["expired"])
        reasons = {decision.resource.name: decision.reason for decision in plan.skipped}
        self.assertEqual(reasons["recent"], "inside-retention")
        self.assertEqual(reasons["foreign"], "foreign-or-unowned")

    def test_active_lease_protects_every_resource_in_the_run(self) -> None:
        lease = resource(
            "container",
            "lease",
            running=True,
            resource_kind="lease",
        )
        stale_service = resource("container", "service", running=True)
        stale_volume = resource("volume", "workspace")

        plan = plan_cleanup(
            [lease, stale_service, stale_volume],
            REPOSITORY,
            NOW,
            timedelta(hours=0),
        )

        self.assertEqual(plan.removals, [])
        self.assertEqual(
            {decision.reason for decision in plan.skipped}, {"active-run-lease"}
        )

    def test_target_run_removes_exact_attempt_even_if_lease_is_running(self) -> None:
        target_lease = resource(
            "container",
            "target-lease",
            run_id="200",
            attempt="2",
            running=True,
            resource_kind="lease",
            age_hours=0,
        )
        target_volume = resource(
            "volume", "target-volume", run_id="200", attempt="2", age_hours=0
        )
        other_attempt = resource(
            "volume", "other-attempt", run_id="200", attempt="1"
        )

        plan = plan_cleanup(
            [target_lease, target_volume, other_attempt],
            REPOSITORY,
            NOW,
            timedelta(hours=24),
            target_run_id="200",
            target_run_attempt="2",
        )

        self.assertEqual(
            [item.name for item in plan.removals], ["target-lease", "target-volume"]
        )
        self.assertEqual(plan.skipped[0].reason, "outside-target-run")

    def test_run_prefix_scopes_a_retention_cleanup(self) -> None:
        included = resource("volume", "included", run_id="cleanup-smoke-old")
        excluded = resource("volume", "excluded", run_id="regular-run")

        plan = plan_cleanup(
            [included, excluded],
            REPOSITORY,
            NOW,
            timedelta(hours=0),
            run_id_prefix="cleanup-smoke-",
        )

        self.assertEqual([item.name for item in plan.removals], ["included"])
        self.assertEqual(plan.skipped[0].reason, "outside-run-prefix")

    def test_attached_volume_is_removed_only_with_its_container(self) -> None:
        removable_container = resource("container", "container-id")
        removable_volume = resource(
            "volume", "owned-volume", references=("container-id",)
        )
        preserved_volume = resource(
            "volume", "shared-volume", references=("foreign-container",)
        )

        plan = plan_cleanup(
            [removable_container, removable_volume, preserved_volume],
            REPOSITORY,
            NOW,
            timedelta(hours=24),
        )

        self.assertEqual(
            [item.name for item in plan.removals], ["container-id", "owned-volume"]
        )
        self.assertEqual(plan.skipped[0].reason, "referenced-by-preserved-resource")

    def test_dry_run_executes_no_docker_mutations(self) -> None:
        docker = FakeDocker()
        item = resource("volume", "expired")
        plan = CleanupPlan([Decision(item, "remove", "expired")])

        removed, errors = execute_plan(docker, plan, dry_run=True)

        self.assertEqual(docker.calls, [])
        self.assertEqual(removed, [])
        self.assertEqual(errors, [])

    def test_apply_uses_explicit_resource_removal(self) -> None:
        docker = FakeDocker()
        item = resource("volume", "expired")
        plan = CleanupPlan([Decision(item, "remove", "expired")])

        removed, errors = execute_plan(docker, plan, dry_run=False)

        self.assertEqual(docker.calls, [["volume", "rm", "--force", "expired"]])
        self.assertEqual([entry["name"] for entry in removed], ["expired"])
        self.assertEqual(errors, [])

    def test_legacy_frontend_volume_has_strict_synthetic_ownership(self) -> None:
        labels = legacy_labels(
            "lexigo-frontend-12345-2",
            REPOSITORY,
            LEGACY_VOLUME_PATTERNS,
            "workspace",
        )

        self.assertIsNotNone(labels)
        self.assertEqual(labels[RUN_LABEL], "12345")
        self.assertEqual(labels[ATTEMPT_LABEL], "2")
        self.assertEqual(labels[KIND_LABEL], "workspace")
        self.assertIsNone(
            legacy_labels(
                "lexigo-frontend-not-a-run",
                REPOSITORY,
                LEGACY_VOLUME_PATTERNS,
                "workspace",
            )
        )

        buildkit_labels = legacy_labels(
            "buildx_buildkit_lexigo-buildx-12345-2-api0_state",
            REPOSITORY,
            LEGACY_VOLUME_PATTERNS,
            "workspace",
        )
        self.assertIsNotNone(buildkit_labels)
        self.assertEqual(buildkit_labels[RUN_LABEL], "12345")

    def test_builder_prefix_requires_run_attempt_and_component(self) -> None:
        self.assertIsNotNone(BUILDER_PATTERN.fullmatch("lexigo-buildx-123-2-api"))
        self.assertIsNone(BUILDER_PATTERN.fullmatch("other-buildx-123-2-api"))
        self.assertIsNone(BUILDER_PATTERN.fullmatch("lexigo-buildx-current-api"))

    def test_build_cache_uses_independent_retention(self) -> None:
        runtime_volume = resource("volume", "runtime", age_hours=48)
        recent_builder = resource(
            "builder",
            "lexigo-buildx-100-1-api",
            age_hours=48,
            resource_kind="builder",
        )
        expired_builder = resource(
            "builder",
            "lexigo-buildx-101-1-web",
            run_id="101",
            age_hours=200,
            resource_kind="builder",
        )

        plan = plan_cleanup(
            [runtime_volume, recent_builder, expired_builder],
            REPOSITORY,
            NOW,
            timedelta(hours=24),
            build_cache_retention=timedelta(hours=168),
        )

        self.assertEqual(
            [item.name for item in plan.removals],
            ["lexigo-buildx-101-1-web", "runtime"],
        )
        self.assertEqual(plan.skipped[0].reason, "inside-build-cache-retention")

    def test_disk_thresholds_are_machine_readable(self) -> None:
        self.assertEqual(disk_status({"free_percent": 25}, 20, 10), "ok")
        self.assertEqual(disk_status({"free_percent": 15}, 20, 10), "warning")
        self.assertEqual(disk_status({"free_percent": 5}, 20, 10), "critical")

    def test_docker_nanosecond_timestamp_is_parsed_as_utc(self) -> None:
        parsed = parse_timestamp("2026-07-21T12:00:00.123456789Z")

        self.assertEqual(
            parsed,
            datetime(2026, 7, 21, 12, 0, 0, 123456, tzinfo=timezone.utc),
        )

    def test_unknown_age_is_never_removed_by_retention_cleanup(self) -> None:
        unknown = replace(resource("volume", "unknown"), created_at=None)

        plan = plan_cleanup(
            [unknown], REPOSITORY, NOW, timedelta(hours=0)
        )

        self.assertEqual(plan.removals, [])
        self.assertEqual(plan.skipped[0].reason, "unknown-age")


if __name__ == "__main__":
    unittest.main()
