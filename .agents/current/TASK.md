# Current Task

## Identity

- Issue: #628
- Branch: `test/issue-628-phrase-new-tab-stability`
- Base SHA: `b63b6a88b49faf6114870f39e6b7473a28ca1e9d`
- Head SHA: resolve from live branch ref after each write
- PR: pending

## Objective

Restore deterministic exact-main UI CI by removing duplicate native middle-click/background-tab lifecycle dependence from the backend phrase independent-tab contract while preserving real native new-tab coverage elsewhere.

## Scope

Test-only stabilization of the backend phrase new-tab acceptance in `frontend/e2e/app-router-routes.spec.ts`, plus current Agent Harness evidence.

## Non-goals

No production runtime, routing implementation, backend/API semantics, CSS/design, dependencies, visual baselines, canonical API fixture ownership or deployment changes.

## Allowed paths

- `frontend/e2e/app-router-routes.spec.ts`
- `.agents/current/**`

## Prohibited paths

All production runtime/backend/CSS owners, dependencies, visual baselines, canonical fixtures and unrelated tests.

## Invariants

- The phrase result remains a semantic anchor with the exact filtered backend phrase `href`.
- The phrase-specific test must prove the target route loads in an independent tab without target-tab catalog/progress/word-catalog warm-up.
- `installAuthenticatedAPI(context)` remains the sole API response owner for this spec.
- Existing `semantic route links support a real new tab and browser Back/Forward` native middle-click coverage stays unchanged.
- Do not hide the failure with retries, sleeps or timeout inflation.

## Acceptance criteria

- The phrase-specific test no longer waits on native middle-click `context.page` creation or background-tab lifecycle.
- An explicit independent context page navigates to the asserted semantic `href`, reaches the exact filtered URL and renders `Keep the route stable`.
- Target-tab request evidence confirms no `/api/v1/catalog/metadata`, `/api/v1/progress` or `/api/v1/words?...` warm-up is required.
- Full exact-head CI is green without retry-dependent acceptance.
- Review/thread audit and fresh-main check pass before squash merge.
- Exact-main CI after merge is green before Dependabot PR #622 proceeds.

## Required checks

Frontend core quality, both generic UI shards, remaining browser groups, backend gates, frontend aggregate and both container builds.

## Rollback

Revert the test-only squash commit if exact-head evidence shows explicit independent-tab navigation no longer represents the backend phrase deep-link contract; keep production code untouched.
