# Current Task

## Identity

- Issue: #70
- Branch: `style/issue-70-remove-resource-notice-selectors`
- Base SHA: `e5978d3af77e6c5e14e22ee189d72c32d7b79461`
- PR: pending

## Objective

Delete only the eight `.lx-resource-notice*` selector tokens that PR #346 proved have zero executable production TypeScript/TSX consumers, while preserving every live `.lx-session-notice`, `.lx-resource-stack` and canonical `.lx-async-state` declaration and behavior.

## Scope

- Remove the standalone `.lx-resource-notice` block and its child typography/layout rules from `mobile-pwa-fixes.css`.
- Reduce grouped button, offline/timeout and malformed rules to their live `.lx-session-notice` selectors without changing declaration values.
- Convert `resource-notice-orphan-source.test.ts` from presence inventory to exact physical-absence assertions.
- Preserve the checkout-level zero-consumer scan, canonical async-state owner assertions, live resource-stack/session-shell assertions and import-order contract.
- Record exact diff and CI evidence in `.agents/current/**`.

## Non-goals

- No change to `.lx-session-notice` declarations, values, specificity or responsive positioning.
- No change to `.lx-resource-stack`, `system-states.css`, `.lx-async-state`, layout import order or production TS/TSX runtime.
- No visual baseline, route-budget, API, backend, migration, workflow, dependency, README, architecture or Figma change.
- No broad cleanup of neighboring PWA/header/speaking styles.
- No claim that Issue #70 is complete.

## Allowed paths

- `frontend/app/mobile-pwa-fixes.css`
- `frontend/components/resource-notice-orphan-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

Every path not listed above, especially:

- `frontend/app/system-states.css`
- `frontend/app/layout.tsx`
- production TypeScript/TSX
- snapshots and route-budget ceilings
- workflows, dependencies, backend/API and public documentation

## Owners and boundaries

- `.lx-session-notice`: live bootstrap/session presentation owner in `mobile-pwa-fixes.css`.
- `.lx-resource-stack`: live route-island layout owner.
- `AsyncResourceNotice` → `AsyncStatePanel` → `.lx-async-state`: canonical resource-error presentation.
- `.lx-resource-notice*`: proven orphan family to delete in this slice.

## Invariants

- The deletion must be CSS deletion-dominant.
- All `.lx-resource-notice` occurrences must become physically absent from production CSS.
- `.lx-session-notice button`, `.lx-session-notice.offline`, `.lx-session-notice.timeout` and `.lx-session-notice.malformed` must retain the same declaration bodies.
- `.lx-resource-stack` and canonical async-state behavior remain unchanged.
- No reachable DOM, session, PWA, accessibility, visual or navigation behavior changes.
- The source contract must fail closed if the legacy selector family is reintroduced.

## Acceptance criteria

- `mobile-pwa-fixes.css` contains zero `.lx-resource-notice` tokens.
- The source contract still proves zero executable production consumers and now requires physical CSS absence.
- All live `.lx-session-notice` selector bodies and values remain present exactly once.
- Final diff is restricted to the five allowed paths and production CSS contains deletions with only minimal selector-line additions required to preserve live grouped owners.
- Full immutable-head CI passes, including unchanged Linux visual snapshots and performance budgets.
- Comments, reviews and unresolved review threads are empty before Ready.
- Expected-head squash merge succeeds.
- Exact merge SHA passes post-merge main CI and exact-SHA stage/public validation before reconciliation.

## Required checks

- Updated resource-notice source contract.
- Frontend lint, typecheck, complete unit suite, production build and dependency audit.
- Backend unit/security/integration.
- Full browser matrix, accessibility, CSP, controlled service worker, iOS PWA, Linux visual regression and performance budgets.
- Web and API container builds.

## Risks

- Deleting grouped `.lx-session-notice` declarations together with the orphan selectors.
- Accidentally changing declaration values or selector specificity while splitting grouped rules.
- Weakening the proof rather than converting it to an absence contract.
- Touching live `.lx-resource-stack` or canonical async-state owners.

## Rollback

Revert the product PR. The canonical async-state runtime is independent of the removed orphan CSS family.
