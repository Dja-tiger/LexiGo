# Current Task Execution

## Active delivery

- Issue: #70.
- Branch: `style/issue-70-home-css-order-independence`.
- Verified base and merge base: `17c801ae3d9a18a1623d723c39a4b81fae3147ef`.
- Latest branch commit before this execution update: `90a868b286cf98a180a0fa370a1232d4c8e19168`.
- Pull request: not opened yet.

## Acceptance audit evidence

- `frontend/components/production-app-entry.test.ts` owns the exact production application-root inventory, retired-root absence, canonical root chain and bootstrap-only route-entry imports.
- `frontend/app/global-style-ownership.test.ts` requires `globals.css` to be the sole owner of document `body` and shared `button, input` font inheritance.
- `frontend/e2e/route-bundle-budget.spec.ts` measures all canonical cold routes, derives JavaScript assets exclusive to the live compatibility fallback and requires every canonical route to exclude those assets.
- `frontend/bundle-budgets.json` provides blocking route JavaScript/request ceilings and immutable baseline evidence.
- README documents the exact layout → routed shell → bootstrap → route island / compatibility fallback chain and global CSS ownership boundary.
- The remaining compact Home gap was proven from source and specificity: shared `.lx-home-next-action .lx-hero-card` and compact `.lx-home-next-action .lx-hero-card` both had specificity `(0, 2, 0)`. Between 720 px and 760 px, compact `min-height: 0` therefore depended on its later import to override shared `min-height: 360px`.

## Applied implementation

- Added `.lx-routed-app` to every selector entry in `frontend/app/compact-home.css`.
- Preserved every declaration value and the `max-width: 760px` / `max-width: 390px` media boundaries.
- Added an ownership comment explaining the Issue #70 source-order contract.
- Moved the compact Home import before `information-architecture.css` in `frontend/app/layout.tsx`.
- Kept `premium-ui.css` before both Home owners and `adaptive-knowledge-coach-home.css` after the compact/shared pair.
- Added `frontend/components/home-css-order-independence.test.ts` with a selector-specificity calculator based on the established Phrases ownership contract.

## Source contract

The new test requires:

- canonical markup below `.lx-routed-app` and Home route-island ownership;
- one import each for premium, compact, shared and adaptive Home styles;
- adversarial order `premium-ui.css` → `compact-home.css` → `information-architecture.css` → `adaptive-knowledge-coach-home.css`;
- exactly 26 route-scoped compact selector entries;
- unchanged compact media boundaries and no `!important` escape hatch;
- compact specificity greater than every overlapping shared selector;
- adaptive specificity greater than compact specificity at narrower breakpoints;
- continued presence of shared premium hero/progress declarations.

## Specificity evidence

- Shared hero selector: `.lx-home-next-action .lx-hero-card` → `(0, 2, 0)`.
- Compact hero selector: `.lx-routed-app .lx-home-next-action .lx-hero-card` → `(0, 3, 0)`.
- Adaptive hero selector: `.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-hero-card` → `(0, 4, 0)`.
- The intended cascade therefore no longer relies on source order: compact outranks shared, and adaptive outranks compact.

## Read-back evidence

- `compact-home.css` blob: `5a89b7d506646410c3543c86a214900fdb64334c`.
- `layout.tsx` blob: `40088737ddcd4b7b5aceccc7d794ca47356ff7d9`.
- source-contract blob: `03ea4e99543f6e1dd08720e66033414f1aa54b9b`.
- current-task blob: `f8e969ef1ea07e85e7653f3a19ed3c61920177db`.
- current-progress blob: `b3869aac411cb225ef0f3406264d4e4268a44a1f`.
- Compare against the exact base was zero commits behind and limited to the intended task/product/test paths before this execution update.
- `main` remained `17c801ae3d9a18a1623d723c39a4b81fae3147ef` throughout implementation.

## Validation plan

1. Publish a Draft PR after the final allowed-path compare.
2. Treat the resulting head as immutable unless CI exposes a classified root cause.
3. Require fail-closed full product CI: frontend source/unit/build, complete browser matrix, accessibility, Linux visual hashes, performance budgets, backend and containers.
4. Reject baseline updates, budget inflation, timeout inflation or skipped browsers as fixes.
5. Audit comments, reviews and unresolved threads.
6. Mark Ready only after full green CI on the final head.
7. Squash merge with the expected head SHA.
8. Validate exact merge SHA in main CI and stage/public deployment.
9. Reconcile Agent Docs separately and continue the remaining Issue #70 feature-style audit.

## Rollback

Revert the product PR. No database, API, migration, snapshot or budget rollback is required.
