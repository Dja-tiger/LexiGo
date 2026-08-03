# Current Task Execution

## Active delivery

- Issue: #70.
- Branch: `style/issue-70-home-css-order-independence`.
- Verified base and merge base: `17c801ae3d9a18a1623d723c39a4b81fae3147ef`.
- Draft PR: #360 — `style(frontend): make compact Home CSS order-independent`.
- Published PR head before current-context reconciliation: `af3489f10de7d7cc527a1017737a0d2622966e34`.
- Latest branch commit before this execution update: `615527db73101c86324f4d7512e7bea3d483060c`.
- Final authoritative head: resolve from live PR after this write.

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
- Published Draft PR #360 with exact gap evidence, scope, non-goals, mandatory gates and rollback.

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
- current-task blob after PR linking: `a62f4055238c9e352e687f920c9c587214f9c5b1`.
- current-progress blob after PR publication: `1c3030991243a6b20ad38260f2d347a2b43a0731`.
- Final compare before PR publication reported exactly six allowed paths and zero commits behind.
- `main` remained `17c801ae3d9a18a1623d723c39a4b81fae3147ef` throughout implementation and PR-context reconciliation.

## Validation plan

1. Treat the head created by this execution update as the final developer-authored candidate.
2. Require fail-closed full product CI on that exact head.
3. Inspect source/unit/build, complete browser matrix, accessibility, Linux visual hashes, route-performance budgets, backend and container jobs.
4. Classify and fix any failure at the root cause; no blind retry, timeout inflation, skipped browser, snapshot update or budget increase.
5. Verify PR comments, reviews and unresolved threads.
6. Mark Ready only after full green CI on the final head.
7. Squash merge with the expected head SHA.
8. Validate exact merge SHA in main CI and stage/public deployment.
9. Reconcile Agent Docs separately and continue the remaining Issue #70 feature-style audit.

## Rollback

Revert PR #360. No database, API, migration, snapshot or budget rollback is required.
