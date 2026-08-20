# Current Task

## Identity

- Issue: #630
- Branch: `test/issue-630-semantic-route-independent-tab`
- Base SHA: `651a35541061cd9d667e440a1a57fffa4cf5cb56`
- Head SHA: resolve from live branch ref after each write
- PR: pending publication

## Objective

Restore deterministic exact-main navigation CI by removing Chromium native middle-click/background-tab lifecycle from the semantic route acceptance while preserving LexiGo-owned contracts.

## Scope

Test-contract-only stabilization of `frontend/e2e/app-router-routes.spec.ts` plus current Agent Harness evidence.

## Non-goals

No production routing/UI/backend/API fixture/dependency/CSS/design/visual-baseline/runtime-error changes. No weakening of semantic href, independent route loadability, or browser Back/Forward assertions.

## Allowed paths

- `frontend/e2e/app-router-routes.spec.ts`
- `.agents/current/**`

## Invariants

- `/learn` remains a real semantic anchor href.
- An independent browser-context page must load the asserted `/learn` href and render the Learn heading.
- Primary-page navigation plus real Back/Forward sequence remains unchanged.
- No `button: "middle"` or `context.waitForEvent("page")` dependency remains in this acceptance.
- Desktop Chromium continues to own this bounded semantic-route/history coverage.

## Acceptance criteria

- Exact-head full CI is green, including generic UI shard 1 where the failure reproduced, shard 2 and both container builds.
- Review/thread audit is clean and `main` is fresh before expected-head squash merge.
- Exact-main CI after merge is green before Agent Docs reconciliation or Dependabot PR #622 proceeds.
