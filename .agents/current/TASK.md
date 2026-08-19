# Current Task

## Identity

- Issue: #624
- Branch: `test/issue-624-webkit-preview-interception`
- Base SHA: `639e177ec7362544e42c7d0b77a5c7432bca8401`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Restore exact-main frontend UI CI by removing the WebKit CORS artifact caused by Playwright fulfillment of the same-origin lesson-preview request.

## Scope

Test-harness-only stabilization of the Issue #617 route-history audit and its source contract.

## Non-goals

No production runtime, backend/API, CSS/design, OpenPencil, Dictionary-state, or navigation-behavior changes.

## Allowed paths

- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `.agents/current/**`

## Prohibited paths

All production runtime owners and unrelated tests/fixtures.

## Runtime owners

None.

## Documentation owners

`.agents/current/**`

## Invariants

- `installQualityGateAPI(context)` remains the canonical preview response owner.
- Preserve Authorization, CSRF, request body, real reload/Back/Forward and strict runtime-error assertions.
- Do not hide failures with retries, sleeps, or weakened assertions.

## Acceptance criteria

- iOS WebKit route-history cases no longer report intercepted preview CORS errors.
- Full exact-head CI is green.
- Exact-main CI after merge is green.

## Required checks

Frontend core/unit/source contract, generic UI shards, aggregate CI, container build according to repository CI routing.

## Risks

Playwright route chaining semantics must still reach the canonical context fixture after page-level normalization.

## Rollback

Revert the test-only squash commit if fallback interception changes request ownership unexpectedly.
