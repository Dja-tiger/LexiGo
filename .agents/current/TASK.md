# Current Task

## Identity

- Issue: #481 `[Medium][Learning][#25 Phase 1] Persist listening as a distinct objective review mode`
- Parent: #25
- Delivery remediation branch: `fix/issue-481-stage-webkit-sw-cancellation`
- Base / currently deployed SHA: `b62470b0051ca60e2bea177ab08945887107822c`
- Product PR #482: merged successfully.
- Product exact-main CI #3367 / run `31675946620`: success.
- Stage #3208 / run `31676641895`: deploy success, public endpoints success, public browser failure.

## Objective

Unblock the final #481 public Stage acceptance by making the public-runtime error classifier recognize the WebKit 1.61.1 single-slash serialization of the already-known benign guard service-worker cancellation, while preserving fail-closed exact URL matching.

## Root cause

During the stale-build recovery test, iOS WebKit emitted the expected guard service-worker cancellation as:

`Cannot load https: /<stage-host>/sw.js?build=<exact-sha> due to access control checks.`

`normalizeRuntimePageError()` currently normalizes only the `https: //host/...` split-protocol form. The classifier therefore recorded the single-slash form as a fatal page error even though it was for the exact current-build guard `sw.js` URL. The Playwright retry reproduced the same diagnostic, so this is not treated as a transient deploy failure.

## Scope

- Normalize one- or two-slash WebKit HTTP(S) split-protocol diagnostics to canonical `https://...` / `http://...` form.
- Add a regression unit case for the exact single-slash Stage diagnostic shape.
- Preserve the existing guardrails: only WebKit, only while a guard service-worker URL is registered, and only when the fully normalized diagnostic exactly equals the exact expected current-build service-worker URL.
- Re-run full PR CI, merge through a separate remediation PR, then require exact-main CI and exact-SHA Stage/public acceptance before closing #481.

## Allowed paths

- `.agents/current/**`
- `frontend/lib/public-runtime-errors.ts`
- `frontend/lib/public-runtime-errors.test.ts`

## Prohibited paths

- listening/product runtime and API contracts delivered by #482
- service-worker registration/update runtime
- build-version guard runtime
- public smoke test assertions outside the classifier helper
- Playwright configuration/version
- deployment scripts/workflows, secrets, CSP configuration
- any unrelated UI/backend code

## Invariants

- Real service-worker load failures must remain visible.
- Chromium diagnostics must never be suppressed by this WebKit exception.
- A different build SHA, path, host, API URL or missing guard URL must remain a failure.
- The fix must not broaden matching beyond the existing exact final diagnostic equality.
- The Stage image currently running `b62470b0...` is healthy by deploy readiness and public endpoint smoke; only the browser classifier gate is blocked.
- Issue #481 remains open until a later exact-SHA Stage run passes public browser acceptance.

## Acceptance criteria

- `normalizeRuntimePageError()` canonicalizes both `https: //host/...` and `https: /host/...` WebKit split diagnostics.
- `isExpectedWebKitGuardServiceWorkerCancellation()` returns true for the observed exact current-build single-slash cancellation.
- Existing negative cases remain false.
- Focused unit tests pass.
- Full immutable-head PR CI passes.
- Remediation merge exact-main CI passes and publishes immutable images.
- Exact-SHA Stage deploy, public endpoint smoke and public Chromium+iOS WebKit acceptance pass.

## Rollback

Revert only the remediation PR. This hotfix changes diagnostic normalization/classification only; it does not alter persisted data, service-worker behavior, listening semantics or deployment configuration.
