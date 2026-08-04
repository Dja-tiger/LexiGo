# Current Task Execution

## Task

- Branch: `agent/issue-70-public-webkit-sw-guard`
- Base SHA: `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`
- Head SHA: resolve from live branch ref
- PR: pending

## Skills used

### GitHub repository and workflow diagnostics

Purpose:

Classify the exact-image stage failure from primary workflow evidence before deciding whether a retry or code/test change was justified.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.base.md`
- `.agents/AGENTS.tool-selection.md`
- `.agents/SKILLS.md`
- `docs/agent-harness.md`

Version or verification date:

2026-08-04 live `main` and stage deployment records.

Inputs:

Product SHA `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`, main CI run `30902346811`, stage run `30903056155`, failed job `91971692028`, diagnostics artifact `8889938105`, previous stage run `30892205056` and job `91936700171`.

Files inspected:

Issue #12 deployment body, stage workflow, public runtime test, build-version guard, service-worker registration/update owners, local build-version recovery test and extracted public-browser error contexts.

Actions performed:

- Confirmed exact-image deployment and public smoke succeeded.
- Downloaded and extracted the stage public-browser diagnostics artifact.
- Inspected both initial and retry error contexts.
- Compared the failed run with a previous successful run containing the same WebKit diagnostic.
- Verified successful recovery invariants and isolated the failure to page-error classification.
- Created an isolated branch from the exact main SHA without retrying blindly.

Commands or procedures:

GitHub exact-ref reads, workflow job/log retrieval, artifact digest verification/download, ZIP inspection and cross-run diagnostic comparison.

Artifacts produced:

A classified failure record and isolated blocker branch.

Result:

The failure is a reproducible iOS WebKit guard-cancellation diagnostic, not evidence of failed deployment, route recovery, CSP enforcement or stale-state cleanup.

Failures:

Stage run `30903056155` failed public browser validation after both the initial attempt and Playwright retry.

Root cause:

The public test treated all page errors as fatal and lacked the narrow guard-recovery classification already present in local browser coverage.

Fallback:

Do not weaken retries or ignore generic access-control errors. Add exact recovery-scoped classification and stronger post-recovery service-worker assertions.

Limitations:

Direct local package execution is unavailable; authoritative CI and exact-image stage validation remain the execution sources of truth.

Reusable lesson:

A repeated browser diagnostic should not be dismissed as transient solely because a prior retry passed. Compare artifacts and runtime invariants first, then encode the narrow known cancellation while strengthening the success condition it could otherwise hide.

### Fail-closed public WebKit guard classification

Purpose:

Prevent a known benign service-worker cancellation from blocking exact-image validation without masking a real service-worker or application failure.

Instruction source:

- `frontend/e2e/build-version-recovery.spec.ts`
- `frontend/e2e/public-runtime-smoke.spec.ts`
- `frontend/lib/build-version-guard.ts`
- `frontend/components/service-worker-registration.tsx`
- `frontend/lib/service-worker-update.ts`

Version or verification date:

2026-08-04 product SHA `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`.

Inputs:

Observed WebKit split diagnostic, current build ID, exact same-origin service-worker URL and stale-build recovery state.

Files inspected:

- `frontend/e2e/public-runtime-smoke.spec.ts`
- `frontend/e2e/build-version-recovery.spec.ts`
- `frontend/lib/build-version-guard.ts`
- `frontend/lib/service-worker-update.ts`
- `frontend/components/service-worker-registration.tsx`

Actions performed:

- Normalized WebKit's split page-error name/message representation.
- Added an exact matcher requiring WebKit, an active recovery window and the expected current-build service-worker URL.
- Added adversarial assertions for browser, state, build and path boundaries.
- Activated the matcher only immediately before stale-build reload and disabled it after recovery validation.
- Required the recovered context to expose the exact current-build service-worker registration.
- Required service-worker error presentation to remain absent.
- Preserved all unrelated crashes, page errors, console failures and CSP violations as fatal.

Commands or procedures:

Exact diagnostic normalization, state-scoped comparison and post-recovery registration polling.

Artifacts produced:

Updated `frontend/e2e/public-runtime-smoke.spec.ts` and current Agent Harness records.

Result:

Prepared for authoritative CI with no production runtime, workflow, retry, timeout, dependency, baseline or budget change.

Failures:

No branch CI has executed yet.

Root cause:

Not applicable before CI publication.

Fallback:

If authoritative browser evidence shows registration is not restored, remove the exemption and fix the production service-worker lifecycle instead.

Limitations:

The exemption intentionally covers only the exact current-build service-worker cancellation during stale-build recovery; other WebKit access-control diagnostics remain failures.

Reusable lesson:

When a browser reports cancellation caused by deliberate lifecycle cleanup, pair the narrow diagnostic exception with a stronger assertion that the replacement resource is actually registered and healthy.
