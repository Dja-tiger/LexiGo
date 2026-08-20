# Current Task Execution

## Task

- Branch: `fix/stage-caddy-prebuilt-image`
- Base SHA: `42e4a6ad82f5ae33e8e9c1c54e8fdb21ea266907`
- Head SHA: resolve from live branch ref after this final context write
- PR: #634

## Skills used

### GitHub repository operations

Purpose: keep the deployment repair isolated from protected `main` and preserve immutable delivery evidence.

Instruction source: `AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.tool-selection.md`, `.agents/SKILLS.md`, `docs/agent-harness.md`.

Version or verification date: repository rules read from exact base `42e4a6ad82f5ae33e8e9c1c54e8fdb21ea266907` on 2026-08-20.

Inputs: live main, Issue #633, Draft PR #634, branch `fix/stage-caddy-prebuilt-image`, Stage status Issue #12, failed Stage jobs/logs.

Files inspected: Agent Harness normative files; both deployment Compose files; `deploy/caddy/Dockerfile`; `scripts/remote-deploy.sh`; `scripts/ci/deploy-over-ssh.sh`; CI and deployment-check workflows; README/architecture.

Actions performed: verified branch starts at exact main, classified Stage failures, changed only allow-listed deployment/tooling/current-context paths, opened Draft PR #634, and read changed owners back after writes.

Commands or procedures: GitHub connector exact-ref reads, workflow job/log inspection, branch compare, explicit branch file updates, PR creation.

Artifacts produced: registry-only Compose ownership, remote pull/module verification, main-CI Caddy publication gate, deployment source contracts, task records, Draft PR #634.

Result: implementation authored; final immutable-head CI is pending.

Failures: repeated Stage `no space left on device` during host-local `xcaddy build` in runs `32400258209` and `32404719471`; first two PR deployment-check heads exposed validator defects described below.

Root cause: compilation ownership was placed on the deployment host instead of CI; separately, workflow source validation had one GitHub-expression interpolation defect and one pre-existing placeholder false positive.

Fallback: preserve the existing application rollback path; do not introduce daemon-wide prune or weaken checks.

Limitations: GHCR publication and real remote deploy behavior require GitHub Actions/main/Stage validation after merge.

Reusable lesson: expensive immutable infrastructure binaries should be built in bounded CI and consumed as registry artifacts; remote deployment should not silently become a compiler/build host.

### CI debugging

Purpose: distinguish application regression from repeatable deployment-host resource exhaustion and classify PR validation failures without retry-as-acceptance.

Instruction source: `.agents/SKILLS.md` CI debugging procedure and `.agents/AGENTS.base.md` failure classification rules.

Version or verification date: 2026-08-20.

Inputs: Stage runs `32400258209` and `32404719471`; PR #634 Deployment scripts check runs `32415181203` and `32415432178`.

Files inspected: deployment workflow/job logs, Compose owners, Caddy Dockerfile, remote deployment script, deployment-check source, intentional OpenPencil environment placeholder.

Actions performed: correlated both Stage failures with the same host-local build phase; verified application images were pulled before failure; inspected PR check logs and repaired only deterministic validator defects.

Commands or procedures: workflow job/step/log inspection and exact source reads.

Artifacts produced: factual root-cause records in current progress and literal-safe/exact-placeholder source assertions.

Result: Stage failure classified as repeatable infrastructure/ownership defect; PR check failures classified as deterministic validator defects rather than deployment implementation failures.

Failures:
- Run `32415181203`, job `96574592522`: GitHub Actions pre-interpolated the literal `${{ env.CADDY_IMAGE }}` source needle inside a grep assertion.
- Run `32415432178`, job `96575385947`: after all new Caddy ownership assertions passed, the existing broad token-like scan matched the documented placeholder `deploy/openpencil/openpencil.env.example:<line>:CLOUDFLARE_API_TOKEN=REPLACE_ON_HOST`.

Root cause:
- GitHub expression evaluation happens before shell quoting, so embedding a literal `${{ ... }}` source needle directly inside `run:` does not preserve that source text.
- The historical secret-like scan did not distinguish the repository-owned replacement placeholder from an actual committed token-like value.

Fallback:
- Construct the Caddy source needle in Python as `'tags: $' + '{{ env.CADDY_IMAGE }}'`; keep the assertion exact.
- Require the OpenPencil placeholder exactly and exempt only the exact `<file>:<line>:CLOUDFLARE_API_TOKEN=REPLACE_ON_HOST` match; fail on every other token-like match.

Limitations: final head must rerun the full check; failed earlier heads are diagnostic evidence only.

Reusable lesson: workflow validators must account for Actions expression preprocessing, and secret scanners should use narrowly documented placeholder exceptions rather than broad file exclusions.

### Deployment ownership repair

Purpose: make Caddy an independently versioned deployment dependency rather than an app-SHA rollback dependency or remote build product.

Instruction source: Issue #633 acceptance criteria, deployment workflows/source contracts, Agent Harness atomic-slice rules.

Version or verification date: 2026-08-20.

Inputs: exact Caddy `2.11.4`, plugin `caddy-dns/cloudflare@v0.2.4`, existing GHCR/App CI conventions.

Files inspected: `.github/workflows/ci.yml`, `.github/workflows/deploy-scripts-check.yml`, stage/prod Compose, remote deploy, Caddy Dockerfile.

Actions performed: selected canonical image `ghcr.io/dja-tiger/lexigo-caddy:2.11.4-cloudflare-v0.2.4`; removed Compose `build:` owners; changed remote deploy to pull/verify Caddy; added main-only image availability/publication after app container builds; retained PR-side bounded custom Caddy build/module/Caddyfile validation; added fail-closed source assertions.

Commands or procedures: source-owner audit, exact tag synchronization, bounded Buildx ownership, registry pull/module verification.

Artifacts produced: deployment workflow/source changes on PR #634.

Result: source implementation complete; final CI/Stage proof pending.

Failures: earlier deployment-check heads failed only in validator logic after prerequisite syntax/unit/ownership checks; the second run confirmed all new Caddy ownership assertions before the placeholder scan.

Root cause: prior architecture coupled deployment and compilation boundaries.

Fallback: if GHCR/package permission or workflow ordering fails, fix that exact CI ownership contract without restoring host compilation or destructive cleanup.

Limitations: the pinned tag is an infrastructure version contract; future Caddy/plugin changes must intentionally advance the tag and all synchronized source contracts.

Reusable lesson: application rollback should not require one infrastructure image per historical application SHA when the infrastructure binary contract is independently versioned and unchanged.
