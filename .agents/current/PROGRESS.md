# Current Task Progress

## 2026-08-22 22:20 +03

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Active incident: Issue #659.
- Live base/main at slice start: `f7edbb9a39e2b0ad26cba365ffca54ffedde54e0`.
- Open PR audit before branch creation: none.
- Stage status owner #12: failure on exact image SHA `f7edbb9a39e2b0ad26cba365ffca54ffedde54e0`, run `32592663356`.
- Exact-main CI preceding that Stage run: success.
- Immutable deploy job `97078782932` proves PostgreSQL repeatedly exits with `FATAL: could not write lock file "postmaster.pid": No space left on device`.
- PostgreSQL state is restarting/unhealthy with exit 1 and `oom=false`.
- Redis is healthy; API/web do not start because PostgreSQL blocks the dependency chain.
- Automatic rollback to `68298977652d737ee267b4cfd5e1a978fb99828c` reproduces the same PostgreSQL disk-capacity failure.

### Classification

- Failure category: Stage infrastructure / filesystem-capacity incident.
- Not an application-image regression.
- Not a PostgreSQL data-layout/version diagnosis.
- Not OOM.
- No destructive database recovery is justified.

### Recovery implementation

Branch: `fix/issue-659-stage-capacity-recovery` from exact base `f7edbb9a39e2b0ad26cba365ffca54ffedde54e0`.

Changed deployment behavior is Stage-only:

- capacity preflight executes over SSH before bundle upload/extraction and before GHCR image pulls;
- filesystem target prefers the Stage PostgreSQL Compose volume mountpoint and falls back to Docker root or `/`;
- diagnostics record `df -Pk`, `df -Pi` and `docker system df`;
- Docker container inventory is fail-closed;
- cleanup considers only `ghcr.io/dja-tiger/lexigo-api` and `ghcr.io/dja-tiger/lexigo-web` tags;
- requested tag, previous rollback tag and every container-referenced image ID are preserved;
- only eligible old unused image tags are removed with `docker image rm`;
- no `prune`, volume removal, container removal or network removal is used;
- deployment continues only with at least 262144 KiB and 1024 free inodes;
- capacity output is appended to the deployment log.

### Regression protection

`scripts/ci/public-smoke.test.sh` now includes deployment source-contract checks requiring:

- Stage-only ownership;
- byte + inode capacity gates;
- exact LexiGo API/web repository allow-list;
- requested/previous/container-reference preservation;
- preflight ordering before deployment bundle upload;
- persistent log capture;
- rejection of daemon-wide prune, volume/container/network deletion and `down -v`.

### Current changed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md` pending update
- `scripts/ci/deploy-over-ssh.sh`
- `scripts/ci/public-smoke.test.sh`

### Validation pending

- Deployment scripts check on Draft PR head.
- Full CI on immutable PR head.
- Review/comment/thread audit.
- Squash merge with expected-head guard.
- Exact-main CI.
- Automatic Stage run proving actual freed KiB/inodes and PostgreSQL recovery.
- Public smoke/browser success.

### Next action

Finalize current execution record, compare branch against live main, open Draft PR for the atomic recovery slice and use immutable CI evidence before any merge.
