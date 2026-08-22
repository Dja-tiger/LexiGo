# Current Task Execution

## Task

- Issue: #659
- Branch: `fix/issue-659-stage-postgres-diagnostics`
- Base SHA: `0b92466b9385503e53f654b77da533caa362c2fb`
- Head SHA: resolve from live branch ref
- PR: resolve after opening Draft PR

## Skills used

### GitHub repository operations

Purpose: diagnose and recover a reproducible Stage PostgreSQL startup incident without conflating it with the already-merged First Use visual-evidence change.

Instruction source: root Agent Harness, current repository deploy scripts/workflows, Issue #12 deployment status and immutable GitHub Actions evidence.

Verification date: 2026-08-22.

Inputs: `main=0b92466b9385503e53f654b77da533caa362c2fb`; exact-main CI `32584377045`; failed Stage run `32584934165`; reproduced attempt-2 deploy job `97060166932`; previous healthy app image `68298977652d737ee267b4cfd5e1a978fb99828c`.

Files inspected: `scripts/ci/deploy-over-ssh.sh`, `scripts/remote-deploy.sh`, `deploy/compose/docker-compose.stage.yml`, `.github/workflows/deploy-scripts-check.yml`, current Agent Harness task files.

Actions performed: verified no open PR before starting the incident; reproduced the same failure with a controlled failed-job rerun; read the exact rerun log; proved PostgreSQL becomes unhealthy before API/web startup and also prevents rollback; created Issue #659; prepared a bounded, secret-safe diagnostic patch that emits selected container State fields plus last 120 Postgres/Redis log lines before rollback.

Commands or procedures: GitHub connector branch/issue/file/workflow operations; no direct Stage SSH and no destructive database action.

Artifacts produced: Issue #659 and first diagnostic commit/PR to be created from this task state.

Result: PostgreSQL root cause is not yet known because current deploy tooling omits the failing service logs. Observability patch prepared; recovery intentionally deferred until evidence exists.

Failures: Stage run `32584934165` failed twice on exact SHA. Both attempts show `lexigo-stage-postgres-1` unhealthy / `Restarting (1)`; rollback to `682989...` fails for the same reason.

Root cause: pending PostgreSQL logs. Product/runtime causation is currently unsupported because PR #645 changed only Agent Harness files and the visual test owner, while exact-main CI passed.

Fallback: if diagnostics-only main deployment still cannot reveal Postgres logs, extend only the deployment incident tooling with a dedicated bounded remote diagnostic action; do not weaken health checks or delete the persistent volume.

Limitations: GitHub Actions can observe only what the remote deploy script emits. The connected GitHub tool does not provide arbitrary direct SSH access to the Stage host.

Reusable lesson: when rollback recreates a failed dependency, capture bounded service-specific logs and safe state before rollback. Compose status and reverse-proxy 502s are not enough to diagnose a database entrypoint failure.
