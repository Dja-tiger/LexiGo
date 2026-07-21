#!/usr/bin/env python3
"""Safely remove expired Docker resources owned by LexiGo CI.

The cleanup is intentionally allow-list based.  It never invokes a daemon-wide
prune command and it refuses to remove resources that cannot be attributed to
this repository and a workflow run.
"""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import re
import shutil
import subprocess
import sys
import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable, Iterator, Sequence


OWNER_LABEL = "com.lexigo.ci"
REPOSITORY_LABEL = "com.lexigo.ci.repository"
RUN_LABEL = "com.lexigo.ci.run"
ATTEMPT_LABEL = "com.lexigo.ci.attempt"
JOB_LABEL = "com.lexigo.ci.job"
KIND_LABEL = "com.lexigo.ci.kind"

REQUIRED_LABELS = (
    OWNER_LABEL,
    REPOSITORY_LABEL,
    RUN_LABEL,
    ATTEMPT_LABEL,
    JOB_LABEL,
    KIND_LABEL,
)

BUILDER_PATTERN = re.compile(
    r"^lexigo-buildx-(?P<run>[0-9]+)-(?P<attempt>[0-9]+)-[a-z0-9][a-z0-9_.-]*$"
)
LEGACY_VOLUME_PATTERNS = (
    re.compile(r"^lexigo-frontend-(?P<run>[0-9]+)-(?P<attempt>[0-9]+)$"),
    re.compile(r"^lexigo-stage-browser-(?P<run>[0-9]+)-(?P<attempt>[0-9]+)$"),
    re.compile(
        r"^buildx_buildkit_lexigo-buildx-(?P<run>[0-9]+)-"
        r"(?P<attempt>[0-9]+)-[a-z0-9][a-z0-9_.-]*[0-9]+_state$"
    ),
)
LEGACY_CONTAINER_PATTERNS = (
    re.compile(
        r"^lexigo-(?:postgres|redis)-(?P<run>[0-9]+)-(?P<attempt>[0-9]+)$"
    ),
    re.compile(
        r"^runner-smoke-(?:postgres|redis)-(?P<run>[0-9]+)-(?P<attempt>[0-9]+)-[123]$"
    ),
    re.compile(
        r"^buildx_buildkit_lexigo-buildx-(?P<run>[0-9]+)-"
        r"(?P<attempt>[0-9]+)-[a-z0-9][a-z0-9_.-]*[0-9]+$"
    ),
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.strip()
    match = re.match(r"^(.*?\.)([0-9]+)(Z|[+-][0-9:]+)$", normalized)
    if match:
        normalized = f"{match.group(1)}{match.group(2)[:6]}{match.group(3)}"
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"

    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def isoformat(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def split_lines(value: str) -> list[str]:
    return [line.strip() for line in value.splitlines() if line.strip()]


def chunks(values: Sequence[str], size: int = 100) -> Iterator[Sequence[str]]:
    for index in range(0, len(values), size):
        yield values[index : index + size]


def full_labels(
    repository: str,
    run_id: str,
    attempt: str,
    job: str,
    kind: str,
) -> dict[str, str]:
    return {
        OWNER_LABEL: "true",
        REPOSITORY_LABEL: repository,
        RUN_LABEL: run_id,
        ATTEMPT_LABEL: attempt,
        JOB_LABEL: job,
        KIND_LABEL: kind,
    }


def legacy_labels(
    name: str,
    repository: str,
    patterns: Iterable[re.Pattern[str]],
    kind: str,
) -> dict[str, str] | None:
    for pattern in patterns:
        match = pattern.fullmatch(name)
        if match:
            return full_labels(
                repository,
                match.group("run"),
                match.group("attempt"),
                "legacy",
                kind,
            )
    return None


@dataclass(frozen=True)
class Resource:
    kind: str
    identifier: str
    name: str
    created_at: datetime | None
    labels: dict[str, str]
    running: bool = False
    references: tuple[str, ...] = ()
    ownership_source: str = "labels"

    @property
    def run_key(self) -> tuple[str, str]:
        return (self.labels.get(RUN_LABEL, ""), self.labels.get(ATTEMPT_LABEL, ""))

    def as_dict(self) -> dict[str, Any]:
        return {
            "kind": self.kind,
            "id": self.identifier,
            "name": self.name,
            "created_at": isoformat(self.created_at),
            "run_id": self.labels.get(RUN_LABEL),
            "run_attempt": self.labels.get(ATTEMPT_LABEL),
            "job": self.labels.get(JOB_LABEL),
            "resource_kind": self.labels.get(KIND_LABEL),
            "running": self.running,
            "references": list(self.references),
            "ownership_source": self.ownership_source,
        }


@dataclass(frozen=True)
class Decision:
    resource: Resource
    action: str
    reason: str

    def as_dict(self) -> dict[str, Any]:
        payload = self.resource.as_dict()
        payload.update({"action": self.action, "reason": self.reason})
        return payload


@dataclass
class CleanupPlan:
    decisions: list[Decision] = field(default_factory=list)

    @property
    def removals(self) -> list[Resource]:
        order = {"builder": 0, "container": 1, "network": 2, "volume": 3, "image": 4}
        resources = [
            decision.resource
            for decision in self.decisions
            if decision.action == "remove"
        ]
        return sorted(resources, key=lambda resource: order.get(resource.kind, 99))

    @property
    def skipped(self) -> list[Decision]:
        return [decision for decision in self.decisions if decision.action == "skip"]


class DockerClient:
    def __init__(self) -> None:
        self.diagnostics: list[str] = []

    def run(self, args: Sequence[str], check: bool = True) -> subprocess.CompletedProcess[str]:
        result = subprocess.run(
            ["docker", *args],
            check=False,
            capture_output=True,
            text=True,
        )
        if check and result.returncode != 0:
            detail = result.stderr.strip() or result.stdout.strip() or "unknown Docker error"
            raise RuntimeError(f"docker {' '.join(args)} failed: {detail}")
        return result

    def inspect(self, kind: str, identifiers: Sequence[str]) -> list[dict[str, Any]]:
        payloads: list[dict[str, Any]] = []
        for batch in chunks(list(identifiers)):
            if not batch:
                continue
            result = self.run([kind, "inspect", *batch], check=False)
            if result.returncode == 0:
                payloads.extend(json.loads(result.stdout))
                continue

            # Resources may disappear while an active job finishes. Fall back
            # to individual inspection so one benign race cannot abort the
            # entire cleanup plan.
            for identifier in batch:
                item_result = self.run([kind, "inspect", identifier], check=False)
                if item_result.returncode == 0:
                    payloads.extend(json.loads(item_result.stdout))
                else:
                    self.diagnostics.append(
                        f"Skipped vanished {kind} resource {identifier} during inventory"
                    )
        return payloads


def _labels(payload: dict[str, Any]) -> dict[str, str]:
    labels = (payload.get("Config") or {}).get("Labels")
    if labels is None:
        labels = payload.get("Labels")
    return {str(key): str(value) for key, value in (labels or {}).items()}


def _owned_or_legacy_labels(
    labels: dict[str, str],
    name: str,
    repository: str,
    legacy_patterns: Iterable[re.Pattern[str]],
    kind: str,
) -> tuple[dict[str, str] | None, str]:
    if labels.get(OWNER_LABEL) == "true" and labels.get(REPOSITORY_LABEL) == repository:
        return labels, "labels"

    adopted = legacy_labels(name, repository, legacy_patterns, kind)
    if adopted is not None:
        return adopted, "legacy-prefix"
    return None, ""


def inventory_resources(client: DockerClient, repository: str) -> list[Resource]:
    resources: list[Resource] = []

    container_ids = split_lines(client.run(["container", "ls", "--all", "--quiet"]).stdout)
    container_payloads = client.inspect("container", container_ids)
    volume_references: dict[str, set[str]] = {}
    network_references: dict[str, set[str]] = {}
    image_references: dict[str, set[str]] = {}

    for payload in container_payloads:
        container_id = str(payload.get("Id", ""))
        name = str(payload.get("Name", "")).lstrip("/")
        labels, source = _owned_or_legacy_labels(
            _labels(payload),
            name,
            repository,
            LEGACY_CONTAINER_PATTERNS,
            "service",
        )
        if labels is not None:
            resources.append(
                Resource(
                    kind="container",
                    identifier=container_id,
                    name=name,
                    created_at=parse_timestamp(str(payload.get("Created", ""))),
                    labels=labels,
                    running=bool(payload.get("State", {}).get("Running")),
                    ownership_source=source,
                )
            )

        for mount in payload.get("Mounts") or []:
            volume_name = mount.get("Name")
            if volume_name:
                volume_references.setdefault(str(volume_name), set()).add(container_id)
        for network_name in (payload.get("NetworkSettings", {}).get("Networks") or {}):
            network_references.setdefault(str(network_name), set()).add(container_id)
        image_id = payload.get("Image")
        if image_id:
            image_references.setdefault(str(image_id), set()).add(container_id)

    volume_names = split_lines(client.run(["volume", "ls", "--quiet"]).stdout)
    for payload in client.inspect("volume", volume_names):
        name = str(payload.get("Name", ""))
        labels, source = _owned_or_legacy_labels(
            _labels(payload),
            name,
            repository,
            LEGACY_VOLUME_PATTERNS,
            "workspace",
        )
        if labels is None:
            continue
        resources.append(
            Resource(
                kind="volume",
                identifier=name,
                name=name,
                created_at=parse_timestamp(str(payload.get("CreatedAt", ""))),
                labels=labels,
                references=tuple(sorted(volume_references.get(name, set()))),
                ownership_source=source,
            )
        )

    network_ids = split_lines(
        client.run(
            ["network", "ls", "--quiet", "--filter", f"label={OWNER_LABEL}=true"]
        ).stdout
    )
    for payload in client.inspect("network", network_ids):
        labels = _labels(payload)
        if labels.get(REPOSITORY_LABEL) != repository:
            continue
        network_id = str(payload.get("Id", ""))
        name = str(payload.get("Name", ""))
        refs = set(network_references.get(name, set()))
        refs.update(str(key) for key in (payload.get("Containers") or {}))
        resources.append(
            Resource(
                kind="network",
                identifier=network_id,
                name=name,
                created_at=parse_timestamp(str(payload.get("Created", ""))),
                labels=labels,
                references=tuple(sorted(refs)),
            )
        )

    image_ids = split_lines(
        client.run(
            ["image", "ls", "--all", "--quiet", "--filter", f"label={OWNER_LABEL}=true"]
        ).stdout
    )
    for payload in client.inspect("image", sorted(set(image_ids))):
        labels = _labels(payload)
        if labels.get(REPOSITORY_LABEL) != repository:
            continue
        image_id = str(payload.get("Id", ""))
        tags = [str(tag) for tag in (payload.get("RepoTags") or []) if tag != "<none>:<none>"]
        name = tags[0] if len(tags) == 1 else image_id
        references = set(image_references.get(image_id, set()))
        if len(tags) != 1:
            references.add("multiple-tags")
        resources.append(
            Resource(
                kind="image",
                identifier=image_id,
                name=name,
                created_at=parse_timestamp(str(payload.get("Created", ""))),
                labels=labels,
                references=tuple(sorted(references)),
            )
        )

    builder_result = client.run(["buildx", "ls", "--format", "{{.Name}}"], check=False)
    if builder_result.returncode != 0:
        client.diagnostics.append(
            "Buildx inventory unavailable: "
            + (builder_result.stderr.strip() or builder_result.stdout.strip())
        )
    else:
        for name in split_lines(builder_result.stdout):
            match = BUILDER_PATTERN.fullmatch(name.rstrip("*"))
            if not match:
                continue
            builder_name = name.rstrip("*")
            buildkit_containers = [
                payload
                for payload in container_payloads
                if str(payload.get("Name", "")).lstrip("/").startswith(
                    f"buildx_buildkit_{builder_name}"
                )
            ]
            created_values = [
                parse_timestamp(str(payload.get("Created", "")))
                for payload in buildkit_containers
            ]
            created_values = [value for value in created_values if value is not None]
            created_at = (
                min(created_values)
                if created_values
                else builder_metadata_mtime(builder_name)
            )
            running = any(
                bool(payload.get("State", {}).get("Running"))
                for payload in buildkit_containers
            )
            resources.append(
                Resource(
                    kind="builder",
                    identifier=builder_name,
                    name=builder_name,
                    created_at=created_at,
                    labels=full_labels(
                        repository,
                        match.group("run"),
                        match.group("attempt"),
                        "container-build",
                        "builder",
                    ),
                    running=running,
                    ownership_source="name-prefix",
                )
            )

    return resources


def builder_metadata_mtime(name: str) -> datetime | None:
    docker_config = Path(os.environ.get("DOCKER_CONFIG", Path.home() / ".docker"))
    path = docker_config / "buildx" / "instances" / name
    try:
        return datetime.fromtimestamp(path.stat().st_mtime, timezone.utc)
    except OSError:
        return None


def plan_cleanup(
    resources: Sequence[Resource],
    repository: str,
    now: datetime,
    retention: timedelta,
    target_run_id: str | None = None,
    target_run_attempt: str | None = None,
    run_id_prefix: str | None = None,
) -> CleanupPlan:
    if (target_run_id is None) != (target_run_attempt is None):
        raise ValueError("target run id and attempt must be supplied together")
    if target_run_id is not None and run_id_prefix is not None:
        raise ValueError("target run and run id prefix are mutually exclusive")

    plan = CleanupPlan()
    active_runs = {
        resource.run_key
        for resource in resources
        if resource.kind == "container"
        and resource.running
        and resource.labels.get(KIND_LABEL) == "lease"
    }

    preliminary: dict[tuple[str, str], Decision] = {}
    for resource in resources:
        key = (resource.kind, resource.identifier)
        labels = resource.labels
        if labels.get(OWNER_LABEL) != "true" or labels.get(REPOSITORY_LABEL) != repository:
            preliminary[key] = Decision(resource, "skip", "foreign-or-unowned")
            continue
        if any(not labels.get(label) for label in REQUIRED_LABELS):
            preliminary[key] = Decision(resource, "skip", "incomplete-ownership")
            continue

        run_id, attempt = resource.run_key
        if target_run_id is not None:
            if (run_id, attempt) != (target_run_id, target_run_attempt):
                preliminary[key] = Decision(resource, "skip", "outside-target-run")
                continue
        else:
            if run_id_prefix is not None and not run_id.startswith(run_id_prefix):
                preliminary[key] = Decision(resource, "skip", "outside-run-prefix")
                continue
            if resource.run_key in active_runs:
                preliminary[key] = Decision(resource, "skip", "active-run-lease")
                continue
            if resource.created_at is None:
                preliminary[key] = Decision(resource, "skip", "unknown-age")
                continue
            if now - resource.created_at < retention:
                preliminary[key] = Decision(resource, "skip", "inside-retention")
                continue

        preliminary[key] = Decision(
            resource,
            "remove",
            "target-run" if target_run_id else "expired",
        )

    removable_containers = {
        decision.resource.identifier
        for decision in preliminary.values()
        if decision.action == "remove" and decision.resource.kind == "container"
    }
    for key, decision in list(preliminary.items()):
        resource = decision.resource
        if decision.action != "remove" or resource.kind not in {"volume", "network", "image"}:
            continue
        external_references = set(resource.references) - removable_containers
        if external_references:
            preliminary[key] = Decision(resource, "skip", "referenced-by-preserved-resource")

    plan.decisions.extend(preliminary.values())
    return plan


def remove_resource(client: DockerClient, resource: Resource) -> None:
    if resource.kind == "container":
        args = ["container", "rm", "--force", resource.identifier]
    elif resource.kind == "builder":
        args = ["buildx", "rm", "--force", resource.name]
    elif resource.kind == "network":
        args = ["network", "rm", resource.identifier]
    elif resource.kind == "volume":
        args = ["volume", "rm", "--force", resource.name]
    elif resource.kind == "image":
        args = ["image", "rm", resource.name]
    else:
        raise ValueError(f"unsupported resource kind: {resource.kind}")

    result = client.run(args, check=False)
    if result.returncode == 0:
        return
    detail = result.stderr.strip() or result.stdout.strip() or "unknown Docker error"
    normalized = detail.lower()
    if "no such" in normalized or "not found" in normalized:
        return
    raise RuntimeError(f"docker {' '.join(args)} failed: {detail}")


def execute_plan(
    client: DockerClient,
    plan: CleanupPlan,
    dry_run: bool,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    removed: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    if dry_run:
        return removed, errors

    for resource in plan.removals:
        try:
            remove_resource(client, resource)
            removed.append(resource.as_dict())
        except Exception as error:  # keep cleaning independent resources
            errors.append({**resource.as_dict(), "error": str(error)})
    return removed, errors


def disk_snapshot(path: Path) -> dict[str, Any]:
    target = path if path.exists() else Path("/")
    usage = shutil.disk_usage(target)
    free_percent = (usage.free / usage.total * 100.0) if usage.total else 0.0
    return {
        "path": str(target),
        "total_bytes": usage.total,
        "used_bytes": usage.used,
        "free_bytes": usage.free,
        "free_percent": round(free_percent, 2),
    }


def disk_status(snapshot: dict[str, Any], warn_percent: float, critical_percent: float) -> str:
    free_percent = float(snapshot["free_percent"])
    if free_percent < critical_percent:
        return "critical"
    if free_percent < warn_percent:
        return "warning"
    return "ok"


def diagnostic_snapshot(client: DockerClient) -> dict[str, Any]:
    try:
        version = client.run(
            ["version", "--format", "{{json .Server.Version}}"], check=False
        )
        system_df = client.run(["system", "df"], check=False)
    except Exception as error:
        client.diagnostics.append(f"Docker diagnostics unavailable: {error}")
        return {
            "docker_server_version": None,
            "docker_system_df": None,
            "warnings": list(client.diagnostics),
        }
    return {
        "docker_server_version": (
            version.stdout.strip().strip('"') if version.returncode == 0 else None
        ),
        "docker_system_df": system_df.stdout.strip() if system_df.returncode == 0 else None,
        "warnings": list(client.diagnostics),
    }


def write_summary(path: Path, summary: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.tmp.{os.getpid()}")
    temporary.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    temporary.replace(path)


def append_github_summary(summary: dict[str, Any]) -> None:
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return
    disk = summary["disk"]["after"]
    lines = [
        "## LexiGo runner resource cleanup",
        "",
        f"- Status: `{summary.get('status', 'unknown')}`",
        f"- Mode: `{summary['mode']}`",
        f"- Planned: `{len(summary['planned'])}`",
        f"- Removed: `{len(summary['removed'])}`",
        f"- Errors: `{len(summary['errors'])}`",
        f"- Free disk: `{disk['free_percent']}%` (`{disk['status']}`)",
        f"- Freed bytes: `{summary['disk']['freed_bytes']}`",
        "",
    ]
    with Path(summary_path).open("a", encoding="utf-8") as handle:
        handle.write("\n".join(lines))


@contextmanager
def cleanup_lock(path: Path, wait_seconds: float) -> Iterator[bool]:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+", encoding="utf-8") as handle:
        deadline = time.monotonic() + wait_seconds
        while True:
            try:
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    yield False
                    return
                time.sleep(min(1.0, remaining))
        try:
            yield True
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", default=os.environ.get("GITHUB_REPOSITORY"))
    parser.add_argument("--retention-hours", type=float, default=24.0)
    parser.add_argument("--target-run-id")
    parser.add_argument("--target-run-attempt")
    parser.add_argument("--run-id-prefix")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--summary-file", type=Path, required=True)
    parser.add_argument("--disk-path", type=Path, default=Path("/var/lib/docker"))
    parser.add_argument("--warn-free-percent", type=float, default=20.0)
    parser.add_argument("--critical-free-percent", type=float, default=10.0)
    parser.add_argument(
        "--lock-file",
        type=Path,
        default=Path("/tmp/lexigo-runner-resource-cleanup.lock"),
    )
    parser.add_argument("--lock-wait-seconds", type=float, default=120.0)
    args = parser.parse_args(argv)

    if not args.repository or "/" not in args.repository:
        parser.error("--repository must be OWNER/REPO")
    if args.retention_hours < 0:
        parser.error("--retention-hours must be non-negative")
    if args.lock_wait_seconds < 0:
        parser.error("--lock-wait-seconds must be non-negative")
    if not 0 <= args.critical_free_percent <= args.warn_free_percent <= 100:
        parser.error("disk thresholds must satisfy 0 <= critical <= warning <= 100")
    if (args.target_run_id is None) != (args.target_run_attempt is None):
        parser.error("--target-run-id and --target-run-attempt must be used together")
    if args.target_run_id and args.run_id_prefix:
        parser.error("target run and run id prefix are mutually exclusive")
    return args


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv if argv is not None else sys.argv[1:])
    started_at = utc_now()
    before = disk_snapshot(args.disk_path)
    summary: dict[str, Any] = {
        "schema_version": 1,
        "repository": args.repository,
        "mode": "dry-run" if args.dry_run else "apply",
        "started_at": isoformat(started_at),
        "retention_hours": args.retention_hours,
        "target_run": (
            {"run_id": args.target_run_id, "run_attempt": args.target_run_attempt}
            if args.target_run_id
            else None
        ),
        "run_id_prefix": args.run_id_prefix,
        "lock_acquired": False,
        "lock_wait_seconds": args.lock_wait_seconds,
        "inventory_count": 0,
        "disk": {"before": before},
        "planned": [],
        "skipped": [],
        "removed": [],
        "errors": [],
        "diagnostics": {},
    }

    client = DockerClient()
    exit_code = 0
    try:
        with cleanup_lock(args.lock_file, args.lock_wait_seconds) as acquired:
            summary["lock_acquired"] = acquired
            if not acquired:
                summary["status"] = "skipped-lock-busy"
                exit_code = 3
            else:
                resources = inventory_resources(client, args.repository)
                plan = plan_cleanup(
                    resources,
                    repository=args.repository,
                    now=started_at,
                    retention=timedelta(hours=args.retention_hours),
                    target_run_id=args.target_run_id,
                    target_run_attempt=args.target_run_attempt,
                    run_id_prefix=args.run_id_prefix,
                )
                summary["inventory_count"] = len(resources)
                summary["planned"] = [resource.as_dict() for resource in plan.removals]
                summary["skipped"] = [decision.as_dict() for decision in plan.skipped]
                removed, errors = execute_plan(client, plan, args.dry_run)
                summary["removed"] = removed
                summary["errors"] = errors
                summary["status"] = "error" if errors else "ok"
                if errors:
                    exit_code = 1
    except Exception as error:
        summary["status"] = "error"
        summary["errors"].append({"error": str(error)})
        exit_code = 1

    after = disk_snapshot(args.disk_path)
    after["status"] = disk_status(
        after,
        warn_percent=args.warn_free_percent,
        critical_percent=args.critical_free_percent,
    )
    summary["disk"]["after"] = after
    summary["disk"]["freed_bytes"] = max(0, after["free_bytes"] - before["free_bytes"])
    summary["disk"]["warn_free_percent"] = args.warn_free_percent
    summary["disk"]["critical_free_percent"] = args.critical_free_percent
    summary["diagnostics"] = diagnostic_snapshot(client)
    finished_at = utc_now()
    summary["finished_at"] = isoformat(finished_at)
    summary["duration_seconds"] = round((finished_at - started_at).total_seconds(), 3)
    summary["counts"] = {
        "inventory": summary["inventory_count"],
        "planned": len(summary["planned"]),
        "skipped": len(summary["skipped"]),
        "removed": len(summary["removed"]),
        "errors": len(summary["errors"]),
    }

    if after["status"] == "critical":
        exit_code = max(exit_code, 2)
    write_summary(args.summary_file, summary)
    append_github_summary(summary)
    print(json.dumps(summary, indent=2, sort_keys=True))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
