# Current Task Progress

## 2026-08-13 Europe/Moscow

### Delivered product contract

- Issue #481 Phase 1 product implementation was merged through PR #482.
- Final PR head `b7eb33fd0e7da8b877217b1ec8f2af93b491f8e9` passed immutable-head CI #3366 in full.
- Squash merge SHA is `b62470b0051ca60e2bea177ab08945887107822c`.
- Exact-main CI #3367 / run `31675946620` completed `success`, including backend unit/security/integration, frontend core/browser matrix and exact-SHA API/web image publication.
- GitHub auto-closed #481 from the PR close keyword before Stage acceptance; the issue was reopened immediately and remains open by delivery contract.

### Stage acceptance evidence

- Deploy Stage #3208 / run `31676641895` is bound to exact merge SHA `b62470b0051ca60e2bea177ab08945887107822c`.
- Exact CI scope validation: success.
- Stage deploy: success; containers reported healthy and exact `ghcr.io/dja-tiger/lexigo-{api,web}:b62470b0...` images were running.
- Public frontend/API endpoint smoke: success on first attempt.
- Public Playwright: 11/12 tests passed; one iOS WebKit stale-build recovery test failed on initial attempt and retry.

### Failure

Observed fatal-capture entry:

`pageerror: Cannot load https: /<stage-host>/sw.js?build=b62470b0051ca60e2bea177ab08945887107822c due to access control checks.`

The failure occurs only in `public-ios-webkit` during the guard recovery test. Normal route hydration/scroll checks, Chromium recovery and all other public checks pass.

### Root cause

- `isExpectedWebKitGuardServiceWorkerCancellation()` is intentionally exact and delegates formatting to `normalizeRuntimePageError()`.
- The existing normalizer recognizes the known WebKit split form `https: //host/...` but not the observed `https: /host/...` form.
- Unit coverage currently contains only the two-slash split form.
- The final classifier comparison already requires browser=`webkit`, a non-null guard URL and exact equality to the fully qualified current-build service-worker URL. Therefore canonicalizing one or two slash characters does not require weakening those safety boundaries.
- Because Playwright retry reproduced the same single-slash serialization, the Stage failure is classified as deterministic acceptance-classifier incompatibility rather than transient deployment/network failure.

### Current remediation

- Created branch `fix/issue-481-stage-webkit-sw-cancellation` from exact deployed/main SHA `b62470b0051ca60e2bea177ab08945887107822c`.
- Parallel open PRs are Dependabot-only; no overlap with the two selected frontend library/test paths.
- Allowed product paths are limited to `frontend/lib/public-runtime-errors.ts` and `.test.ts` plus current Agent Docs.

### Next action

Commit this remediation task context atomically, then change the normalizer from a two-slash-only split pattern to one-or-two slash canonicalization and add the exact single-slash regression test. Open a Draft remediation PR, require full immutable-head CI, merge only if clean, then repeat exact-main CI and exact-SHA Stage/public acceptance before closing #481.
