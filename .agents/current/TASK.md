# Current Task

## Identity

- Issue: #659
- Branch: fix/issue-659-stage-postgres-diagnostics
- Base SHA: 0b92466b9385503e53f654b77da533caa362c2fb
- Head SHA: resolve from live branch ref
- PR: resolve after opening Draft PR

## Objective

Recover the Stage deployment blocked by a reproducible PostgreSQL startup failure and make the deploy failure path preserve bounded, secret-safe database diagnostics before rollback/recreation.

## Scope

- reproduce and classify the exact Stage failure from run `32584934165`;
- add bounded PostgreSQL/Redis container state and logs to `scripts/remote-deploy.sh` diagnostics;
- collect diagnostics before automatic rollback and again if rollback fails;
- preserve current app-image rollback behavior;
- use the new immutable Stage evidence to identify the actual PostgreSQL root cause;
- apply only an evidence-backed non-destructive recovery;
- restore exact-SHA Stage, public smoke and public browser checks;
- add regression protection for the final deploy diagnostics/recovery contract.

## Non-goals

- no learning/UI/runtime feature changes;
- no weakening PostgreSQL health checks;
- no `down -v`, volume deletion, database reset, blind image downgrade/upgrade or destructive recovery without evidence;
- no environment/secret dumping;
- no repeated deploy reruns without new evidence.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `scripts/remote-deploy.sh`
- deployment test/source-contract files only if required by the proven fix

## Prohibited paths

- `frontend/**`
- `backend/**`
- `api/**`
- `design/**`
- application dependency manifests/lockfiles
- database migrations or persisted Stage data unless a separate evidence-backed recovery proves they are the root cause

## Runtime owners

- `scripts/remote-deploy.sh` — target-host compose startup, readiness diagnostics and rollback.
- `deploy/compose/docker-compose.stage.yml` — Stage PostgreSQL/Redis/API/web/Caddy service ownership.
- `.github/workflows/deploy-stage.yml` — exact-main Stage orchestration.

## Documentation owners

- Issue #659, deployment status #12 and `.agents/current/**`.

## Invariants

- exact-main application CI success remains independent from Stage host health;
- diagnostics must not print container environment or secrets;
- persistent database volumes are never removed as a diagnostic shortcut;
- rollback must retain its previous-image contract;
- a reproducible infrastructure/database failure is fixed separately from PR #645 visual evidence.

## Acceptance criteria

- PostgreSQL process/health failure is visible in immutable deploy evidence;
- Stage database is recovered without blind volume destruction;
- intended immutable app SHA deploys with healthy postgres/api/web;
- public smoke and public browser suite pass;
- failure diagnostics remain bounded and actionable;
- final immutable-head CI and review/thread audit are clean.

## Required checks

- deployment scripts check;
- full repository CI on final head;
- exact-main CI after merge;
- exact-SHA Stage deploy/public smoke/public browser.

## Risks

- insufficient diagnostics can force another blind deploy attempt;
- destructive recovery could lose Stage data;
- dumping `docker inspect` wholesale could expose environment secrets, so only `.State` fields are allowed.

## Rollback

Revert the deploy-diagnostics/recovery change. Do not mutate or remove the persistent Stage PostgreSQL volume as part of code rollback.
