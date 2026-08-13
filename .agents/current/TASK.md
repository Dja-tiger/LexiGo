# Current Task

## Identity

- Issue: #481 `[Medium][Learning][#25 Phase 1] Persist listening as a distinct objective review mode`
- Parent: #25
- Delivery remediation PR: #483 `fix(pwa): normalize WebKit guard cancellation URL`
- Branch: `fix/issue-481-stage-webkit-sw-cancellation`
- Base / currently deployed product SHA: `b62470b0051ca60e2bea177ab08945887107822c`
- Remediation code/test head before final reconciliation: `9b8b356cdf2d6101d89fc9c3388605e480c168f8`
- Final head: the atomic Agent Docs reconciliation commit containing this file; resolve from live branch and do not write after it.

## Objective

Unblock the final #481 Stage/public acceptance by recognizing the WebKit 1.61.1 single-slash serialization of the already-known benign guard service-worker cancellation, without weakening the exact failure classifier or changing service-worker/runtime behavior.

## Root cause

Stage #3208 on exact product SHA `b62470b0...` deployed successfully and public frontend/API smoke passed. Public iOS WebKit stale-build recovery emitted:

`Cannot load https: /<stage-host>/sw.js?build=b62470b0051ca60e2bea177ab08945887107822c due to access control checks.`

The normalizer accepted only the existing `https: //host/...` split-protocol form. Because the single-slash form was not canonicalized, the exact current-build guard URL comparison never matched and a benign cancellation was classified as fatal. Playwright retry reproduced the same diagnostic, so this was not treated as transient deployment failure.

## Implemented remediation

- `normalizeRuntimePageError()` canonicalizes one **or** two slashes after split `http:`/`https:` diagnostics using `\/{1,2}`.
- Unit coverage reproduces the exact single-slash WebKit shape.
- Existing classifier guards remain unchanged: WebKit only, non-null guard service-worker URL, and exact equality of the fully normalized diagnostic to the exact current-build service-worker URL.
- Existing negative tests still cover Chromium, missing guard URL, wrong build, wrong path and wrong host.

## Allowed final diff

- `.agents/current/**`
- `frontend/lib/public-runtime-errors.ts`
- `frontend/lib/public-runtime-errors.test.ts`

## Prohibited scope

- listening/backend/API product contract delivered by #482
- service-worker registration/update runtime
- build-version guard runtime
- Playwright retry/tolerance or public-smoke assertions
- deployment/CI workflows, secrets, CSP
- visual baselines or system-state UI
- unrelated UI/backend code

## Invariants

- Real service-worker load failures remain visible.
- Chromium diagnostics are never suppressed by this WebKit exception.
- Different build SHA/path/host/API URL or missing guard URL remains fatal.
- The classifier remains exact after normalization.
- No visual baseline is changed for the unrelated runner-dependent focus-visible visual flake observed in CI #3368 attempt 1.
- Issue #481 remains open until a later exact-SHA Stage run passes deploy, public endpoint and public Chromium+iOS WebKit acceptance.
- After this final Agent Docs reconciliation commit, the remediation branch is frozen until merge.

## Pre-freeze verification

- PR #483 changed exactly 5 files: three current Agent Docs plus the normalizer and its unit test.
- CI #3368 / run `31677368540` on code/test head `9b8b356c...` finished `success` on attempt 2.
- Frontend core, backend unit/security/integration, all browser groups, Frontend quality and both container builds are green.
- The focused new single-slash regression passed in frontend unit tests.
- Visual Regression attempt 1 failed only `compact Dictionary empty light` because a programmatically focused pre-existing empty panel rendered with its `:focus-visible` ring on that runner. The hotfix did not touch UI/CSS/visual fixtures; the same Visual Regression job was rerun on the identical SHA and passed without code or baseline changes. No baseline was promoted.

## Remaining delivery gates

1. Run one fresh full immutable-head PR CI on the final reconciliation SHA.
2. Verify live `main`, compare scope and review threads/reviews.
3. Mark PR #483 Ready without changing head.
4. Squash merge with expected-head protection.
5. Require exact-merge `main` CI success and immutable image publication.
6. Require exact-SHA Stage deploy, public frontend/API smoke and public Chromium+iOS WebKit acceptance.
7. Only then update/close #481 as completed; parent #25 remains open.
8. Perform separate Agent Docs post-merge reconciliation/reset before starting the next product slice.

## Rollback

Revert only PR #483. It changes diagnostic normalization/classification only and has no persisted-data, listening, service-worker-runtime or deployment side effects.
