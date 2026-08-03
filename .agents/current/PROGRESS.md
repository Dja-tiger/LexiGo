# Current Task Progress

## Status

- Active Issue #70 slice: remove compact Home dependence on global CSS import order.
- Branch: `style/issue-70-home-css-order-independence`.
- Verified base and merge base: `17c801ae3d9a18a1623d723c39a4b81fae3147ef`.
- No pull request is open yet.
- The branch is zero commits behind `main`.

## Acceptance audit findings

- The single production entry is fail-closed in `production-app-entry.test.ts`: exact root inventory, retired-root absence, layout → routed shell → bootstrap → route-island ownership and bootstrap-only entry imports.
- `global-style-ownership.test.ts` proves unique `body` and `button, input` owners in `globals.css`.
- `route-bundle-budget.spec.ts` measures every canonical route and proves that fallback-exclusive JavaScript assets remain absent from every canonical route.
- `bundle-budgets.json` owns current route ceilings; the full performance gate passed on the latest deployed product SHA.
- README documents the actual production chain, route/runtime ownership and global CSS boundary.
- A remaining acceptance gap was confirmed: compact Home and shared information-architecture selectors had equal specificity for overlapping declarations. In the 720–760 px range the compact owner won only because it was imported later.
- Issue #70 therefore remains open; this slice addresses only the proven Home order dependency.

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

## Repository safety

- Every write used the explicit task branch.
- `compact-home.css`, `layout.tsx` and the new source contract were read back from the branch.
- Compare against the exact base reports only the current task file and the three bounded product/test paths before progress reconciliation.
- `main` remained at `17c801ae3d9a18a1623d723c39a4b81fae3147ef` after writes.

## Validation pending

- Publish a Draft PR on the final current-context head.
- Require fail-closed classification and complete product CI.
- Require source contract, lint, typecheck, full unit suite, production build and dependency audit.
- Require complete Chromium/WebKit/Android/iOS, accessibility, service-worker/CSP and recovery gates.
- Require unchanged authoritative Linux visual hashes and unchanged route-performance budgets.
- Require backend and container gates selected by the classifier.
- Verify comments, reviews and unresolved threads before Ready.
- Perform expected-head squash merge, exact-SHA main CI and exact-SHA stage/public validation.
- Reconcile `.agents/PROJECT_STATE.md` separately after product delivery.

## Rollback

Revert the product PR. No schema, data, API, migration, snapshot or route-budget rollback is required.
