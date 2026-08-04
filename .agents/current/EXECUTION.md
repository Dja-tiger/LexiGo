# Current Task Execution

## Task

- Branch: `agent/issue-70-public-webkit-sw-guard`
- Base SHA: `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`
- Head SHA: resolve from live branch ref
- PR: #383

## Skills used

### GitHub workflow and artifact diagnostics

Purpose:

Classify the exact-image stage failure from primary evidence before changing code or retrying.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.base.md`
- `.agents/AGENTS.tool-selection.md`
- `.agents/SKILLS.md`
- `docs/agent-harness.md`

Version or verification date:

2026-08-04 live `main` and stage records.

Inputs:

Product SHA `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`, main CI run `30902346811`, failed stage run `30903056155`, job `91971692028`, artifact `8889938105`, previous stage run `30892205056` and job `91936700171`.

Files inspected:

Issue #12 deployment body, stage workflow, public runtime test, build-version guard, service-worker registration/update owners, local recovery test and both extracted error contexts.

Actions performed:

- Confirmed deploy and public smoke succeeded on the exact image.
- Downloaded the artifact and inspected initial/retry failure contexts.
- Compared the failed run with a previous successful run containing the same WebKit diagnostic.
- Verified build marker, stale cache, recovery storage, route and CSP invariants all recovered.
- Created an isolated branch from the exact main SHA without a blind rerun.

Commands or procedures:

Exact-ref reads, workflow job/log retrieval, artifact digest verification/download, ZIP inspection and cross-run comparison.

Artifacts produced:

A classified post-merge blocker record and isolated Draft PR #383.

Result:

The blocker is a reproducible iOS WebKit lifecycle cancellation diagnostic, not failed deployment or failed application recovery.

Failures:

Stage public browser validation failed after the initial attempt and one Playwright retry.

Root cause:

The public test treated every page error as fatal and lacked recovery-scoped current-build service-worker classification.

Fallback:

Do not weaken retries or suppress generic access-control errors. Encode the exact category and strengthen replacement-worker assertions.

Limitations:

Authoritative CI and exact-image stage remain the execution sources of truth.

Reusable lesson:

Compare artifacts and runtime invariants before labelling a browser error transient. A benign lifecycle diagnostic may be exempted only together with proof that the replacement resource is healthy.

### Fail-closed public runtime classifier

Purpose:

Ignore only the known WebKit current-build service-worker cancellation during stale-build recovery while keeping real failures visible.

Instruction source:

- `frontend/e2e/build-version-recovery.spec.ts`
- `frontend/e2e/public-runtime-smoke.spec.ts`
- `frontend/lib/build-version-guard.ts`
- `frontend/components/service-worker-registration.tsx`
- `frontend/lib/service-worker-update.ts`

Version or verification date:

2026-08-04 product SHA `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`.

Inputs:

Observed split WebKit diagnostic, browser name, active recovery state and exact current-build service-worker URL.

Files inspected:

Public/local recovery tests and service-worker/build-version owners.

Actions performed:

- Added `frontend/lib/public-runtime-errors.ts` with pure diagnostic normalization and exact classification.
- Added Vitest coverage for split/full diagnostics and adversarial browser/state/build/origin/path boundaries.
- Integrated the classifier into the public Playwright test only during the recovery window.
- Kept crashes, non-exact page errors, fatal console errors and CSP violations fatal.
- Required the exact current-build service-worker registration and no service-worker error UI after recovery.
- Removed the inline public-spec boundary test so the stage matrix remains 12 tests.
- Read all functional writes back from the branch.

Commands or procedures:

Pure exact-string classification, Vitest boundary testing, state-scoped Playwright integration and service-worker registration polling.

Artifacts produced:

- `frontend/lib/public-runtime-errors.ts`
- `frontend/lib/public-runtime-errors.test.ts`
- updated `frontend/e2e/public-runtime-smoke.spec.ts`
- current Agent Harness records

Result:

The classification logic now executes before merge in Vitest, while the real public recovery remains the post-merge exact-image gate.

Failures:

CI #2704 started on an earlier head before the unit module was added and is intentionally superseded.

Root cause:

The public Playwright config is stage-only; inline classifier assertions would otherwise first execute after merge.

Fallback:

Treat only CI on the newest immutable head as authoritative.

Limitations:

The exemption covers only the exact same-origin current-build `sw.js` cancellation during active recovery. Every other diagnostic remains a failure.

Reusable lesson:

Stage-only browser logic should expose pure classification boundaries to the pre-merge unit gate, while keeping the real environment assertion in stage validation.
