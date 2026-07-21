# Self-hosted runner Docker resource lifecycle

## Goal

LexiGo CI must reclaim its temporary Docker resources without changing resources
owned by another repository or by an active workflow job. Global cleanup commands
such as `docker system prune`, `docker volume prune`, and
`docker buildx rm --all-inactive` are prohibited on the shared runner host.

The cleanup entrypoint is `scripts/ci/runner_resource_cleanup.py`. It inventories
the Docker daemon, builds an allow-listed removal plan, writes a JSON summary, and
then removes each selected resource explicitly.

## Ownership contract

Every temporary container, network, volume, and image created by a workflow has
all of these labels:

| Label | Meaning |
| --- | --- |
| `com.lexigo.ci=true` | LexiGo CI owns the resource. |
| `com.lexigo.ci.repository` | GitHub `owner/repository`. |
| `com.lexigo.ci.run` | GitHub workflow run ID. |
| `com.lexigo.ci.attempt` | Attempt within the workflow run. |
| `com.lexigo.ci.job` | Job that created the resource. |
| `com.lexigo.ci.kind` | `lease`, `service`, `workspace`, `task`, `image`, or another specific role. |

Resource names also start with `lexigo-` and include the run ID and attempt.
Buildx does not expose arbitrary Docker ownership labels through the setup action,
so its equivalent ownership boundary is the strict builder name
`lexigo-buildx-<run>-<attempt>-<component>`.
BuildKit daemon containers and state volumes derived from that exact builder
prefix are also recognized, so a missing Buildx metadata entry cannot strand its
cache indefinitely.

The cleaner also recognizes the historical volume names
`lexigo-frontend-<run>-<attempt>` and
`lexigo-stage-browser-<run>-<attempt>`. This compatibility rule is a strict full
name match; arbitrary unlabeled volumes are never adopted or removed.

## Active-job protection

Each Docker-using job starts a small, bounded `kind=lease` container before it
creates reclaimable resources. The lease lasts slightly longer than the job
timeout and is removed by an `if: always()` cleanup step. A retention cleanup
skips every resource with the same run ID and attempt as a running lease.

The lease is intentionally bounded. If a runner process dies before GitHub can
run post-job cleanup, the lease eventually exits; the daily retention sweep can
then reclaim the old job resources. An ordinary cleanup keeps resources younger
than 24 hours even if no lease is visible, which is longer than every LexiGo
self-hosted job timeout.

The final `ci-resource-cleanup` job is different: its `needs` dependency covers
all Docker-producing CI jobs, so it may target the exact completed run and
attempt without applying the retention window. Volumes or networks referenced by
a preserved container and images referenced by a preserved container remain
protected.

## Scheduled and manual cleanup

`.github/workflows/runner-resource-cleanup.yml` runs every day at 02:17 UTC.
Scheduled runs apply the 24-hour retention policy. A workflow concurrency group
and a host-level file lock prevent two cleaners from mutating the shared daemon
at the same time.

Manual dispatch defaults to `dry-run`. Review its `runner-cleanup-*` JSON artifact
before dispatching `apply`. The summary includes:

- every planned, skipped, removed, and failed resource;
- the ownership source and workflow run identity;
- free bytes and free-disk percentage before and after cleanup;
- Docker disk-usage diagnostics;
- an `ok`, `warning`, or `critical` disk state.

The default warning threshold is 20% free disk and the critical threshold is
10%. A critical post-cleanup state exits with status 2 so GitHub Actions raises a
visible failure while still uploading the JSON artifact.

## Validation smoke

`.github/workflows/self-hosted-runner-smoke.yml` requires three distinct runners
to be active concurrently. It starts isolated PostgreSQL and Redis services on
all three, then runs an apply cleanup against controlled fixtures. The smoke
asserts that:

1. an expired owned fixture is removed;
2. a fixture protected by a running lease remains;
3. all three runners' leases and service containers remain healthy during the
   cleanup.

## Emergency procedure

1. Check the GitHub Actions page and wait for, cancel, or otherwise drain active
   LexiGo jobs. Do not infer inactivity only from `docker ps`.
2. Confirm the host and disk pressure:

   ```bash
   df -h / /var/lib/docker
   docker system df
   docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Labels}}'
   ```

3. From a clean checkout of `main`, generate a dry-run plan:

   ```bash
   python3 scripts/ci/runner_resource_cleanup.py \
     --repository Dja-tiger/LexiGo \
     --retention-hours 24 \
     --dry-run \
     --summary-file /tmp/lexigo-runner-cleanup.json
   ```

4. Inspect `/tmp/lexigo-runner-cleanup.json`. Every planned entry must identify
   this repository, a run ID, an attempt, and either label or strict-prefix
   ownership. Investigate every `active-run-lease` and
   `referenced-by-preserved-resource` skip instead of overriding it.
5. Apply the exact same policy only after the plan is understood:

   ```bash
   python3 scripts/ci/runner_resource_cleanup.py \
     --repository Dja-tiger/LexiGo \
     --retention-hours 24 \
     --summary-file /tmp/lexigo-runner-cleanup-applied.json
   ```

6. Re-run `df -h / /var/lib/docker` and `docker system df`, preserve both JSON
   summaries with the incident record, and rerun the self-hosted runner smoke.

If the safe cleaner cannot reclaim enough space, stop and identify the remaining
owner before deleting anything. Never replace the procedure with an unfiltered
prune command, even during an incident.
