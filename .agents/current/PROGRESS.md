# Current Task Progress

## 2026-08-22 19:37 +03

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Incident: Issue #659.
- Base/current `main`: `0b92466b9385503e53f654b77da533caa362c2fb`.
- Exact-main CI after PR #645: run `32584377045` — success.
- Automatic Stage run `32584934165` failed before public smoke/browser.
- Controlled same-SHA rerun of only the failed deploy job reproduced the failure.
- Attempt 2 deploy job: `97060166932`.
- Both requested image `0b92466b9385503e53f654b77da533caa362c2fb` and rollback image `68298977652d737ee267b4cfd5e1a978fb99828c` fail because `lexigo-stage-postgres-1` enters `Restarting (1)` / unhealthy within about one second.
- Redis becomes healthy; API/web never become healthy because PostgreSQL blocks their dependency chain.

### Finding

The current immutable deploy log proves a Stage PostgreSQL/container-start incident but does not contain PostgreSQL process logs. `scripts/remote-deploy.sh::print_deployment_diagnostics` prints compose state, HTTP probes and Caddy/API/web logs only. This destroys useful diagnostic opportunity because rollback recreates the failing Postgres container before the entrypoint failure is captured.

### Root cause

Not yet proven. The reproduced failure is below the LexiGo application layer. The first repair is observability-only so the next exact Stage attempt can expose the real PostgreSQL entrypoint/process error without guessing or deleting the persistent volume.

### Changed files

Planned first diagnostic commit:

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `scripts/remote-deploy.sh`

### Checks passed

- Open PR audit: none before starting #659.
- Duplicate issue search: no existing dedicated Postgres unhealthy incident; #12 remains the deployment status owner.
- Same-SHA rerun reproduced the failure; no product code changed.
- Source audit confirms Stage uses `postgres:18.4-alpine` with persistent `stage_postgres:/var/lib/postgresql` and health check `pg_isready`.
- Proposed diagnostics inspect only container `.State`, never `.Config.Env`.
- Proposed logs are bounded and service-specific.

### Checks failed

- Stage run `32584934165` attempt 1: failure.
- Same run attempt 2 / job `97060166932`: failure at `Deploy stage`.
- Public smoke/browser were skipped because compose startup failed.
- Automatic rollback could not restore service because PostgreSQL remained unhealthy.

### Current branch head

Resolve from live branch after the first diagnostic commit on `fix/issue-659-stage-postgres-diagnostics`.

### Next action

Commit the bounded diagnostic change, run immutable PR CI/deployment-script checks, then use the resulting exact Stage failure evidence to identify and repair the actual PostgreSQL root cause. Keep the PR Draft until Stage is recovered.
