# Current Task Progress

## Status

- Active Issue #70 slice: remove compact Home dependence on global CSS import order.
- Branch: `style/issue-70-home-css-order-independence`.
- Verified base and merge base: `17c801ae3d9a18a1623d723c39a4b81fae3147ef`.
- Draft PR #360 is open.
- Published PR head before current-context reconciliation: `af3489f10de7d7cc527a1017737a0d2622966e34`.
- Latest branch commit after linking the PR in `TASK.md`: `e70c1024d725e2bcd2cec520f2f588cdd5cf6690`.
- The branch is zero commits behind `main` and contains only the six allowed paths.

## Acceptance audit findings

- The single production entry is fail-closed in `production-app-entry.test.ts`: exact root inventory, retired-root absence, layout → routed shell → bootstrap → route-island ownership and bootstrap-only entry imports.
- `global-style-ownership.test.ts` proves unique `body` and `button, input` owners in `globals.css`.
- `route-bundle-budget.spec.ts` measures every canonical route and proves that fallback-exclusive JavaScript assets remain absent from every canonical route.
- `bundle-budgets.json` owns current route ceilings; the full performance gate passed on the latest deployed product SHA.
- README documents the actual production chain, route/runtime ownership and global CSS boundary.
- A remaining acceptance gap was confirmed: compact Home and shared information-architecture selectors had equal specificity for overlapping declarations. In the 720–760 px range the compact owner won only because it was imported later.
- Issue #70 therefore remains open; PR #360 addresses only the proven Home order dependency.

## Completed implementation

- Scoped every selector group in `frontend/app/compact-home.css` below `.lx-routed-app`.
- Preserved all declaration values and both responsive boundaries (`760px` and `390px`).
- Moved the `compact-home.css` import before `information-architecture.css` as an adversarial order-independence proof.
- Preserved `premium-ui.css` before Home owners and `adaptive-knowledge-coach-home.css` after the compact/shared pair.
- Added `frontend/components/home-css-order-independence.test.ts`.
- The source contract proves:
  - canonical Home is rendered below `.lx-routed-app`;
  - every relevant stylesheet is imported exactly once;
  - all 26 compact selector entries are route-scoped;
  - compact selectors outrank overlapping shared selectors;
  - adaptive selectors retain stronger specificity at narrower breakpoints;
  - shared premium declarations remain protected.
- Draft PR #360 was published with exact scope, gap evidence, non-goals, validation requirements and rollback.

## Repository safety

- Every write used the explicit task branch.
- `compact-home.css`, `layout.tsx`, the new source contract and current-context files were read back from the branch.
- Compare against the exact base reports exactly the six allowed paths and zero commits behind.
- `main` remained at `17c801ae3d9a18a1623d723c39a4b81fae3147ef` through PR publication and current-context reconciliation.

## Validation pending

- Complete authoritative CI on the final current-context head.
- Require source contract, lint, typecheck, full unit suite, production build and dependency audit.
- Require complete Chromium/WebKit/Android/iOS, accessibility, service-worker/CSP and recovery gates.
- Require unchanged authoritative Linux visual hashes and unchanged route-performance budgets.
- Require backend and container gates selected by the classifier.
- Verify comments, reviews and unresolved threads before Ready.
- Perform expected-head squash merge, exact-SHA main CI and exact-SHA stage/public validation.
- Reconcile `.agents/PROJECT_STATE.md` separately after product delivery.

## Rollback

Revert PR #360. No schema, data, API, migration, snapshot or route-budget rollback is required.
