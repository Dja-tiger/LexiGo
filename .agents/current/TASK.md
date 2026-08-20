# Current Task

## Identity

- Issue: #626
- Branch: `test/issue-626-webkit-preview-cors-fixture`
- Base SHA: `b40bbbfde951797ba712e63b9d940fbdb30d9694`
- Head SHA: resolve from live branch ref after each write
- PR: #627

## Objective

Restore deterministic exact-main frontend UI CI by making the Issue #617 route-history audit wait for Learn's debounced lesson preview to reach a stable semantic completion state before initiating another navigation.

## Scope

Test-harness-only lifecycle stabilization of Learn readiness in the route-history acceptance, plus fail-closed regression coverage and Agent Harness evidence.

## Non-goals

No production runtime, backend/API semantics, CSS/design, OpenPencil/Figma, navigation implementation, dependency, visual-baseline, canonical API fixture, or deployment changes.

## Allowed paths

- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/current/**`

## Prohibited paths

All production runtime/backend/CSS owners, canonical `frontend/e2e/support/quality-gates.ts`, dependencies, visual baselines and unrelated tests/fixtures.

## Runtime owners

None. This slice changes only Playwright acceptance lifecycle/readiness.

## Documentation owners

- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/current/**`

## Invariants

- `installQualityGateAPI(context)` remains the sole response owner for lesson preview in the route-history audit and stays byte-identical to `main`.
- No page-level preview route, fallback chain, Fetch wrapper or CORS shim is introduced.
- Authorization, CSRF, preview request body, real reload/Back/Forward and strict runtime-error assertions remain unchanged.
- Learn readiness must use the existing responsive user-visible contract: `Начать урок` on desktop and `Начать рекомендуемый урок` on compact layouts, enabled only after the matching preview resolves.
- Do not hide failures with retries, sleeps, timeout inflation, runtime-error filtering or weakened assertions.

## Acceptance criteria

- Learn is not considered semantically ready until its responsive start CTA is enabled.
- Desktop Chromium and compact iOS WebKit use the correct layout-specific CTA.
- iOS WebKit Learn/Profile route-history journeys no longer emit preview access-control pageerrors during reload/transit/Back-Forward.
- Full exact-head CI is green without retry-dependent acceptance.
- Exact-main CI after merge is green before Dependabot PRs continue.

## Required checks

Source/unit contract, frontend core quality, generic UI shard 2 with iOS WebKit route-history coverage, remaining required CI aggregate and container routing.

## Risks

Waiting for the wrong layout CTA would create a desktop/compact false timeout. The acceptance therefore resolves the CTA name from the actual viewport and waits on enabled state rather than elapsed time.

## Rollback

Revert the test-only squash commit if exact-head trace evidence disproves semantic preview readiness as the cancellation boundary; keep production code and canonical fixture untouched.
