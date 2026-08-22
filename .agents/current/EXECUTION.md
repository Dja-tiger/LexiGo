# Current Task Execution

## Task

- Issue: #659
- Branch: `fix/issue-659-stage-capacity-recovery`
- Base SHA: `f7edbb9a39e2b0ad26cba365ffca54ffedde54e0`
- PR: pending Draft PR creation

## Skills used

### GitHub repository operations

Purpose: continue the open Stage PostgreSQL incident after #660 made the failing dependency observable and immutable evidence proved host filesystem exhaustion.

Instruction source: root Agent Harness, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.tool-selection.md`, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, current task files, `docs/agent-harness.md`, Issue #659, deployment status #12 and exact GitHub Actions logs.

Verification date: 2026-08-22.

Inputs: `main=f7edbb9a39e2b0ad26cba365ffca54ffedde54e0`; no open PRs at slice start; failed exact-SHA Stage run `32592663356`; deploy job `97078782932`; previous rollback app image `68298977652d737ee267b4cfd5e1a978fb99828c`.

Proven root cause: PostgreSQL repeatedly reports `FATAL: could not write lock file "postmaster.pid": No space left on device`; state is exit 1/restarting/unhealthy and not OOM. Redis remains healthy and rollback reproduces the same database-start failure.

Files inspected: `scripts/ci/deploy-over-ssh.sh`, `scripts/remote-deploy.sh`, `deploy/compose/docker-compose.stage.yml`, `.github/workflows/deploy-scripts-check.yml`, `scripts/ci/public-smoke.test.sh`, Agent Harness rules/current state and live Issue/deployment evidence.

Actions performed:

- re-verified live main, Stage failure and absence of open PRs;
- created `fix/issue-659-stage-capacity-recovery` from exact main;
- added a Stage-only SSH capacity preflight before deployment bundle upload and image pulls;
- made capacity discovery prefer the PostgreSQL named-volume mountpoint, with Docker-root/filesystem fallback;
- added byte/inode diagnostics before and after cleanup;
- restricted cleanup to old unused LexiGo API/web image tags;
- protected requested, previous rollback and every container-referenced image ID;
- made container/image inventory fail closed;
- prohibited broad prune and volume/container/network deletion by implementation and source contract;
- required 262144 KiB and 1024 free inodes before continuing;
- appended capacity evidence to the existing deployment log;
- extended the already-executed public-smoke test owner with a deployment capacity source contract so the normal Deployment scripts check exercises the safety invariants.

Changed paths:

- `scripts/ci/deploy-over-ssh.sh`
- `scripts/ci/public-smoke.test.sh`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

Restrictions preserved:

- no direct write to `main`;
- no `docker system/image/container/volume/network prune`;
- no `docker volume rm`, container/network removal or `down -v`;
- no frontend/backend/API/design/Compose/database-data changes;
- no secret/environment dump;
- no PostgreSQL healthcheck weakening or image-version guess.

Validation pending: Draft PR, Deployment scripts check, full immutable-head CI, review/thread audit, expected-head squash merge, exact-main CI and automatic Stage/public validation.

Fallback: if targeted old LexiGo app-image cleanup cannot restore the minimum capacity gate, fail before deployment and preserve the capacity evidence. Do not broaden automatically to unrelated images, containers, volumes or host files; use the resulting byte/inode inventory for a separately justified action.

Reusable lesson candidate: a deploy pipeline that can fail because the target filesystem is full needs its capacity recovery before bundle upload/image pull, must distinguish bytes from inodes, and must preserve rollback/current/container-referenced artifacts while refusing broad cleanup.

## Handoff

Compare the branch with live main, open a Draft PR, run the normal deployment-script and full CI gates, then merge only on the final unchanged head. Issue #659 remains open until exact-main Stage, public smoke and public browser checks are healthy.
