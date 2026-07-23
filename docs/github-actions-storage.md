# GitHub Actions storage policy

LexiGo uses self-hosted runners, but GitHub-hosted Actions storage is still consumed by repository artifacts and caches. The largest storage source is the BuildKit cache exported through `type=gha`; browser and diagnostic artifacts are comparatively small but accumulate across frequent CI runs.

## Automated cleanup

`.github/workflows/actions-storage-cleanup.yml` owns repository-scoped cleanup.

It runs:

- after every completed `CI` workflow;
- once per day;
- immediately when the cleanup implementation is merged to `main`;
- manually through `workflow_dispatch`.

The automatic policy is intentionally strict for the current 0.5 GB account allowance:

- delete every GitHub Actions cache after CI completes;
- retain artifacts created during the last 3 days;
- delete expired artifacts regardless of creation time;
- never delete workflow runs, logs, releases, packages, GHCR images or repository data.

Removing Actions caches is safe. A later build recreates them when needed. On the persistent self-hosted host, Docker base layers and other runner-local resources continue to follow the separate bounded runner cleanup policy.

## Manual emergency cleanup

Use **Actions → Actions storage cleanup → Run workflow**.

For a preview, keep:

- `mode`: `dry-run`;
- `artifact_retention_days`: `3`;
- `delete_all_caches`: enabled.

To free the maximum repository Actions storage:

- set `mode` to `apply`;
- set `artifact_retention_days` to `0`;
- keep `delete_all_caches` enabled.

A zero-day artifact retention deletes all artifacts visible when the cleanup starts. This does not delete workflow logs or source code.

## Validation and reporting

`scripts/ci/actions_storage_cleanup.py` uses only Python's standard library and GitHub's repository Actions APIs. The workflow runs `scripts/ci/actions_storage_cleanup_test.py` before any apply operation.

Every run writes a job summary with:

- artifact and cache inventory counts;
- selected resource counts;
- selected storage volume;
- deleted resource counts;
- estimated reclaimed bytes;
- API errors, if any.

GitHub billing dashboards may take several hours to reflect deleted storage. The API deletion itself is immediate.

## Follow-up optimization

The cleanup workflow prevents persistent accumulation. A separate CI optimization should remove or replace the `type=gha` BuildKit export so the cache is not uploaded before being reclaimed. That change should be measured independently because it can affect container build duration.
