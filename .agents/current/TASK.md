# Current Task

## Identity

- Issue: #659
- Branch: fix/issue-659-stage-capacity-recovery
- Base SHA: f7edbb9a39e2b0ad26cba365ffca54ffedde54e0
- PR: pending Draft PR creation

## Objective

Recover the Stage deployment after immutable diagnostics proved PostgreSQL cannot create `postmaster.pid` because the Stage filesystem has no free capacity, while preserving all persistent volumes and database data.

## Proven root cause

Stage run `32592663356` / deploy job `97078782932` on exact main SHA `f7edbb9a39e2b0ad26cba365ffca54ffedde54e0` repeatedly reports:

`FATAL: could not write lock file "postmaster.pid": No space left on device`

The same failure occurs during automatic rollback; Redis is healthy and PostgreSQL is not OOM-killed.

## Scope

- run a Stage-only capacity preflight before deployment bundle upload and image pulls;
- inspect the PostgreSQL named-volume filesystem when available, otherwise Docker root/filesystem fallback;
- report free KiB and free inodes before and after cleanup;
- reclaim only old unused `ghcr.io/dja-tiger/lexigo-api` and `ghcr.io/dja-tiger/lexigo-web` image tags;
- always preserve the requested tag, previous rollback tag and every image ID referenced by any Docker container;
- prohibit daemon-wide prune and volume/container/network deletion;
- require at least 262144 KiB and 1024 free inodes after cleanup before deployment continues;
- preserve capacity diagnostics in the deploy log;
- protect the recovery contract with deployment source-contract checks;
- after merge, require exact-main CI and exact-SHA Stage/public validation.

## Non-goals

- no frontend/backend/product behavior changes;
- no PostgreSQL/Redis/Compose image changes;
- no database migration or data mutation;
- no `down -v`, volume deletion/reset or healthcheck weakening;
- no daemon-wide Docker prune;
- no removal of Docker containers or networks;
- no cleanup of unrelated repositories/images.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `scripts/ci/deploy-over-ssh.sh`
- `scripts/ci/public-smoke.test.sh`

## Prohibited paths

- `frontend/**`
- `backend/**`
- `api/**`
- `design/**`
- `deploy/compose/**`
- database migrations or persisted Stage data
- application dependency manifests/lockfiles

## Runtime owners

- `scripts/ci/deploy-over-ssh.sh` — Stage-only host-capacity preflight before bundle upload and remote deployment.
- `scripts/remote-deploy.sh` — existing compose startup, diagnostics and rollback; unchanged in this slice.
- `deploy/compose/docker-compose.stage.yml` — existing service/volume ownership; unchanged.
- `.github/workflows/deploy-stage.yml` — exact-main Stage orchestration; unchanged.

## Invariants

- recovery must be scoped to Stage;
- persistent volumes are inspection-only and never removed;
- requested/rollback/container-referenced images cannot be deleted;
- inventory failures fail closed before image deletion;
- capacity evidence must distinguish byte and inode exhaustion;
- production deployment behavior is unchanged.

## Acceptance criteria

- immutable PR checks validate the recovery and safety contract;
- Stage preflight reclaims only eligible unused LexiGo app image tags;
- PostgreSQL filesystem has sufficient byte/inode headroom after cleanup;
- exact intended main SHA deploys with healthy PostgreSQL/API/web;
- public smoke and public browser checks pass;
- Issue #659 closes only after Stage/public recovery evidence is complete.

## Required checks

- Deployment scripts check;
- full repository CI on final PR head;
- clean review/comment/thread audit;
- exact-main CI after squash merge;
- exact-SHA Stage deploy, public smoke and public browser checks.

## Rollback

Revert the Stage capacity-preflight change. Do not remove/reset the persistent PostgreSQL volume as part of code rollback.
