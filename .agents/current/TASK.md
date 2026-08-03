# Current Task

## Identity

- Issue: #70
- Branch: `style/issue-70-home-css-order-independence`
- Base SHA: `17c801ae3d9a18a1623d723c39a4b81fae3147ef`
- PR: #360 — Draft
- Published head before PR-context reconciliation: `af3489f10de7d7cc527a1017737a0d2622966e34`
- Final head: resolve from live PR after the current-context commits complete

## Objective

Remove the proven compact Home dependence on global CSS import order without changing computed presentation.

`information-architecture.css` and `compact-home.css` previously contained overlapping Home selectors. In the 720–760 px range the compact rule for `.lx-home-next-action .lx-hero-card` had the same specificity as the shared information-architecture rule, so the intended compact value won only because `compact-home.css` was imported later.

The canonical compact Home owner now wins by route-scoped specificity. Root layout loads the compact owner before the shared information-architecture base as an adversarial source-order proof.

## Scope

- Scope every selector in `frontend/app/compact-home.css` under `.lx-routed-app`.
- Move the `compact-home.css` import before `information-architecture.css` in `frontend/app/layout.tsx` while preserving one import of each stylesheet.
- Add a fail-closed source contract that computes specificity for the overlapping Home selectors and proves compact/adaptive precedence independent of source order.
- Preserve the existing production markup, route ownership, declarations, values, media-query boundaries and CSS file inventory.
- Record exact execution evidence in `.agents/current/**`.

## Non-goals

- No production component/runtime TypeScript/TSX, markup, API/backend/database, session, route or Figma change.
- No selector deletion and no declaration-value change.
- No visual snapshot or route-budget ceiling update.
- No broad CSS consolidation, CSS Modules migration, cascade-layer introduction or unrelated selector cleanup.
- No change to the Phrases adversarial order contract or other feature styles.
- No README, architecture, workflow or dependency change.
- Do not close Issue #70 in this slice; the remaining global feature-style acceptance audit continues afterward.

## Allowed paths

- `frontend/app/compact-home.css`
- `frontend/app/layout.tsx`
- `frontend/components/home-css-order-independence.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

Every path not listed above, especially production components, snapshots, `frontend/bundle-budgets.json`, workflows, dependencies, README, architecture and `.agents/PROJECT_STATE.md`.

## Invariants

- Compact Home declaration values and media-query boundaries remain byte-equivalent apart from the `.lx-routed-app` selector prefix.
- `compact-home.css` remains applicable to canonical Home markup because every Home route is rendered below `.lx-routed-app`.
- Compact selectors outrank their shared information-architecture counterparts by specificity even when imported first.
- Adaptive Knowledge Coach Home selectors retain higher specificity than compact selectors and continue to win at their narrower breakpoints.
- `premium-ui.css` remains before the Home owners; `adaptive-knowledge-coach-home.css` remains after both compact and shared Home styles.
- All authoritative Linux visual hashes and route-performance budgets remain unchanged.

## Acceptance criteria

- Final diff contains only the six allowed paths.
- Every selector group in `compact-home.css` is route-scoped and no declaration value changes.
- Layout intentionally imports `compact-home.css` before `information-architecture.css` exactly once each.
- Source contract proves the key compact selectors outrank the shared base and the adaptive owner outranks compact selectors.
- Frontend lint, typecheck, full unit suite, production build, complete browser/accessibility/visual/performance matrix and container gates pass on the final immutable head.
- No snapshot or budget update is used to make CI green.
- Review surface is empty before Ready.
- Expected-head squash merge and exact-SHA main/stage validation complete before reconciliation.

## Rollback

Revert PR #360. No schema, data, API, migration, snapshot or budget rollback is required.
