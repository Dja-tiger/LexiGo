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

Failures: repeated Stage `no space left on device` during host-local `xcaddy build` in runs `32400258209` and `32404719471`; first PR deployment-check run `32415181203` exposed a source-assertion interpolation defect described below.

Root cause: compilation ownership was placed on the deployment host instead of CI; separately, a literal GitHub expression inside a grep assertion was pre-interpolated by Actions.

Fallback: preserve the existing application rollback path; do not introduce daemon-wide prune or weaken checks.

Limitations: GHCR publication and real remote deploy behavior require GitHub Actions/main/Stage validation after merge.

Reusable lesson: expensive immutable infrastructure binaries should be built in bounded CI and consumed as registry artifacts; remote deployment should not silently become a compiler/build host.

### CI debugging

Purpose: distinguish application regression from repeatable deployment-host resource exhaustion and classify the first PR check failure without retry-as-acceptance.

Instruction source: `.agents/SKILLS.md` CI debugging procedure and `.agents/AGENTS.base.md` failure classification rules.

Version or verification date: 2026-08-20.

Inputs: Stage runs `32400258209` and `32404719471`; PR #634 Deployment scripts check run `32415181203`, job `96574592522`.

Files inspected: deployment workflow/job logs, Compose owners, Caddy Dockerfile, remote deployment script, deployment-check source.

Actions performed: correlated both Stage failures with the same host-local build phase; verified application images were pulled before failure; inspected the first PR check log and identified that `grep -Fq 'tags: ${{ env.CADDY_IMAGE }}'` was rendered by Actions as the local test image tag before the shell ran.

Commands or procedures: workflow job/step/log inspection and exact source reads.

Artifacts produced: factual root-cause record in Issue #633/current progress and a literal-safe source assertion.

Result: Stage failure classified as repeatable infrastructure/ownership defect; PR check failure classified as deterministic test-source interpolation defect.

Failures: Deployment scripts check run `32415181203` stopped at `Validate deployment security and readiness invariants`; all preceding syntax/unit/ownership checks were green.

Root cause: GitHub expression evaluation happens before shell quoting, so embedding a literal `${{ ... }}` source needle directly inside `run:` does not preserve that source text.

Fallback: construct the source needle in Python as `'tags: $' + '{{ env.CADDY_IMAGE }}'`; keep the assertion exact rather than deleting or broadening it.

Limitations: final head must rerun the full check; the failed first head is diagnostic evidence only.

Reusable lesson: when a workflow validates another workflow's literal `${{ ... }}` source syntax, construct the needle without a contiguous GitHub-expression token in the validator workflow itself.

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

Failures: first deployment-check head failed only because the validator interpolated the literal workflow expression it was trying to inspect; implementation ownership checks before that point passed.

Root cause: prior architecture coupled deployment and compilation boundaries.

Fallback: if GHCR/package permission or workflow ordering fails, fix that exact CI ownership contract without restoring host compilation or destructive cleanup.

Limitations: the pinned tag is an infrastructure version contract; future Caddy/plugin changes must intentionally advance the tag and all synchronized source contracts.

Reusable lesson: application rollback should not require one infrastructure image per historical application SHA when the infrastructure binary contract is independently versioned and unchanged.
