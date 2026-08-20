# Current Task

## Identity

- Issue: #626
- Branch: `test/issue-626-webkit-preview-cors-fixture`
- Base SHA: `b40bbbfde951797ba712e63b9d940fbdb30d9694`
- Head SHA: resolve from live branch ref after each write
- PR: pending

## Objective

Restore deterministic exact-main frontend UI CI by keeping WebKit-compatible CORS response metadata on the canonical context-owned lesson-preview fixture.

## Scope

Test-harness-only stabilization of `POST /api/v1/lessons/preview` in the canonical `installQualityGateAPI(context)` fixture, plus fail-closed regression coverage and Agent Harness evidence.

## Non-goals

No production runtime, backend/API semantics, CSS/design, OpenPencil/Figma, navigation behavior, dependency, visual-baseline, or deployment changes.

## Allowed paths

- `frontend/e2e/support/quality-gates.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/current/**`

## Prohibited paths

All production runtime/backend/CSS owners, route-history product behavior, dependencies, visual baselines and unrelated tests/fixtures.

## Runtime owners

None. This slice changes only Playwright test-fixture response metadata.

## Documentation owners

- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/current/**`

## Invariants

- `installQualityGateAPI(context)` remains the sole response owner for lesson preview in the route-history audit.
- `frontend/e2e/route-history-parity.spec.ts` must not reintroduce a page-level preview route, fallback chain, Fetch wrapper or CORS shim.
- Authorization, CSRF, preview request body, real reload/Back/Forward and strict runtime-error assertions remain unchanged.
- CORS response metadata must be derived from the intercepted request origin and attached by the actual canonical fulfillment owner.
- Do not hide failures with retries, sleeps, timeout inflation or weakened assertions.

## Acceptance criteria

- Canonical preview fulfillment includes browser-faithful `Access-Control-Allow-Origin` and credential metadata when WebKit sends an `Origin` header.
- Existing preview payload semantics remain unchanged.
- iOS WebKit `learn` Light/Dark route-history cases no longer emit the preview access-control pageerror.
- Full exact-head CI is green without retry-dependent acceptance.
- Exact-main CI after merge is green before Dependabot PRs continue.

## Required checks

Source/unit contract, frontend core quality, generic UI shard 2 with iOS WebKit route-history coverage, remaining required CI aggregate and container routing.

## Risks

A broad CORS shim could hide unrelated fixture errors. The fix therefore applies only to canonical lesson-preview fulfillment and reflects the request origin rather than using a wildcard.

## Rollback

Revert the test-only squash commit if exact-head WebKit evidence disproves canonical-response metadata as the root cause; keep production code untouched and return to the captured trace for the next transport-level hypothesis.
