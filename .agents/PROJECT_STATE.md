# LexiGo Project State

## Verification

- Last verified: 2026-08-04 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `e8288ef1c91e948594168aa869bdd5a275d6b3b8`.
- Latest deployed product SHA: `e8288ef1c91e948594168aa869bdd5a275d6b3b8`.
- Latest completed Issue #70 slice: Learn-route Lessons/Scenarios switch placement ownership.
- Completion PR: #372.
- PR #372 immutable developer-authored head: `d8146a29c86c14d7c007f7cae0bc56149cfecdaa`.
- Authoritative PR CI: #2663 / run `30861225052`, complete success after an evidence-based retry of one unrelated iOS WebKit Lesson hydration flake on the same immutable head.
- Expected-head squash merge produced product SHA `e8288ef1c91e948594168aa869bdd5a275d6b3b8`.
- Exact-SHA main CI run `30862151034` completed successfully with the full product matrix and immutable web/API image publication.
- Exact-SHA stage run `30862634205` deployed web/API images tagged `e8288ef1c91e948594168aa869bdd5a275d6b3b8`; deployment, public smoke and all 12 public browser checks succeeded directly.
- PR #372 had no comments, reviews or unresolved review threads before merge.
- No intersecting Issue #70 product PR remains open. Dependabot PRs #304–#306 remain unrelated maintenance work.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, expected-head squash merge, exact-SHA main CI and exact-SHA stage/public validation.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.
- One PR contains one atomic slice. Product work does not continue through stale Agent Harness state.

## Production ownership foundations

### Route and runtime ownership

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile, Scenario Catalog and Scenario Detail use dedicated canonical route-island owners.
- `LexigoBootstrappedApp` remains the session restoration, refresh coordination, account runtime and route-entry owner.
- `ReviewOutboxRuntime` remains the durable review-queue owner.
- `LexigoPremiumApp` remains a narrow compatibility fallback for guest authentication/recovery, live Library history, Lesson and unknown/product-route fallback states.
- Broad compatibility deletion remains prohibited without exact two-sided reachability, fallback-exclusive bundle and browser evidence.

### Issue #70 compatibility and orphan cleanup

- Dedicated route ownership, compatibility reachability and fallback-exclusive bundle evidence are fail-closed.
- Proven orphan families removed in earlier slices include `lx-resource-notice*`, `.lx-themed-home`, `.lx-themed-library` and the retired Home hero-decoration families.
- Current source contracts protect intentionally live shared, account, lesson, guest-auth and compatibility owners.
- Canonical routes exclude fallback-exclusive JavaScript assets under cold-route browser evidence.

### Global CSS evidence

- `frontend/app/global-feature-style-overlap-source.test.ts` derives exact-selector conflicts from the actual root import graph.
- The parser handles selector groups, declarations and nested media/support/container/layer blocks without external dependencies.
- `frontend/app/global-feature-style-overlap-manifest.json` is the reviewed fail-closed inventory; its companion test protects exact totals, owner pairs and classifications.
- The manifest remains at 71 items: 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- Accessibility-layer overrides remain intentional and separately contract-protected.
- Compact Home, Phrases sorting, navigation/mobile shell, routed resource-stack and Learn switch placement have adversarial source-order browser/source contracts.

## Completed navigation and mobile-shell ownership

### PR #364 — computed-cascade baseline

- Established browser-computed ownership at 390, 719, 720, 760, 761 and 1024 px.
- Required exactly one visible primary navigation and no horizontal overflow.

### PR #366 — adaptive navigation source-order independence

- Removed all 21 `premium-ui.css` → `adaptive-navigation.css` shell conflicts and five navigation-shell `mobile-pwa-fixes.css` → `adaptive-navigation.css` conflicts.
- Scoped only adaptive routed shell selectors below `.lx-routed-app` without changing values or breakpoints.
- Reduced the manifest from 107 to 81 items.

### PR #368 — mobile-PWA shell source-order independence

- Removed all ten remaining `premium-ui.css` → `mobile-pwa-fixes.css` exact-selector shell conflicts.
- Deleted mobile header-background and logo declarations already unreachable beneath the stronger routed application-shell owner.
- Preserved live compact fallback/dictionary geometry, avatar dimensions and responsive view spacing.
- Extended Chromium proof to production, routed-shell-first and mobile-first stylesheet orders at all six boundary widths.
- Reduced the parser-derived manifest from 81 to 71 items.

### PR #370 — routed resource-stack tablet width ownership

- Audited Home, Learn, Progress, Dictionary, Active Lesson and compatibility fallback resource-stack renderers; all production renderers remain below `.lx-routed-app`.
- Preserved the compatibility fallback `.lx-resource-stack, .lx-async-state { width: 100%; }` inside the existing 720–1099px media range.
- Added `.lx-routed-app .lx-resource-stack { width: 100%; }` as the stronger canonical production tablet owner.
- Kept `.lx-async-state`, mobile-PWA defaults, declaration values, breakpoints and import order unchanged.
- Extended the existing three-order/six-width Chromium proof to compare `.lx-resource-stack` and `.lx-main-content` bounding widths.
- Below 720px the resource stack retains the 28px total inset; from 720px through 1099px it equals main-content width under every tested stylesheet order.
- The one exact mobile-PWA/adaptive resource-stack conflict remains in the reviewed manifest as `requires-proof`; deterministic production behavior is supplied by stronger routed ownership plus source/browser evidence.
- No visual snapshot/hash, performance budget, tolerance, timeout or backend/runtime contract changed.

### PR #372 — Learn switch placement ownership

- Preserved all eight reviewed Scenario Catalog compatibility fallback conflicts for `.lx-learning-section-switch--learn`.
- Added matching, stronger `.lx-routed-app[data-route-path="/learn"]` owners for global, tablet, desktop, compact and narrow placement without changing declaration values or breakpoints.
- Preserved Scenario Catalog as the shared switch appearance and compatibility-fallback owner.
- Added source contracts for renderer reachability, fallback preservation, routed specificity and unchanged placement values.
- Extended the Chromium computed-cascade matrix to production and two adversarial stylesheet orders at 360, 390, 719, 720, 1024 and 1440 px.
- Corrected the 1440 px test oracle to the actual desktop-header geometry (`headerNav: flex`, rail hidden, header children `align-self: auto`) without changing production CSS.
- Production and adversarial orders now produce identical switch/shell snapshots, exactly one primary navigation and no horizontal overflow.
- The eight switch conflicts remain in the reviewed manifest as `requires-proof`; deterministic behavior is supplied by stronger route ownership and companion source/browser evidence.
- Visual hashes, budgets, tolerances, timeouts, route runtime and Scenario Catalog presentation remain unchanged.

## Current Issue #70 acceptance evidence

- `frontend/components/production-app-entry.test.ts` fail-closes the production application-root inventory, retired-root absence and layout → routed shell → bootstrap chain.
- `frontend/app/global-style-ownership.test.ts` protects the sole document `body` and shared `button, input` font-inheritance owners.
- `frontend/e2e/route-bundle-budget.spec.ts` verifies canonical routes exclude compatibility-fallback-exclusive assets.
- `frontend/bundle-budgets.json` owns blocking JavaScript/request ceilings and immutable route baselines.
- Navigation/mobile-shell source contracts protect canonical routed owners, compatibility fallbacks and six live resource-stack renderer boundaries.
- The Chromium cascade matrix exercises production and adversarial orders across responsive boundaries, including routed Learn switch placement.
- README and architecture documentation describe the actual route/runtime/global-style ownership graph.
- Authoritative Linux visual, accessibility, PWA, CSP, functional browser and performance gates are unchanged and green on the latest deployed product SHA.

## In progress

- No product slice is active during this documentation reconciliation.
- The completed PR #372 task context is being reset.
- Issue #70 remains open because 12 additional exact-selector items require proof or correction, semantic non-identical-selector overlaps remain unaudited and final acceptance reconciliation is incomplete.

## Remaining roadmap

### 1. Adaptive tablet layout — 6 conflicts

- Audit the bounded `premium-ui.css` → `adaptive-layout.css` cluster for `.lx-setup-footer`, `.lx-setup-submit`, `.lx-source-selector` and `.lx-source-selector > button`.
- Preserve the dedicated `adaptive-lesson-composer.css` route owner and prove the live Learn composer remains independent of fallback stylesheet order across 719/720/760/761/767/768/1099/1100 boundaries.
- Do not change approved geometry, breakpoints, snapshots or runtime behavior unless computed evidence proves a production defect.

### 2. Phrases grid — 4 conflicts

- Preserve the extracted Phrases route as canonical `.lx-phrase-grid` owner independently of premium fallback order.

### 3. Account Security width — 1 conflict

- Reconcile account-security global width with routed desktop shell placement using explicit runtime ownership rather than import-order dependence.

### 4. Async State width — 1 conflict

- Reconcile adaptive navigation and `system-states.css` width ownership as an isolated shared-state slice.

### 5. Final Issue #70 acceptance reconciliation

- Audit semantically overlapping selectors that are not textually identical.
- Reconcile exact-selector evidence with app-entry, compatibility reachability, fallback-exclusive bundle, global ownership, visual regression and public architecture documentation.
- Close Issue #70 only when every acceptance criterion has current fail-closed evidence.

## Validation pending

- Remaining exact-selector inventory requiring additional proof/correction: 12 items across four bounded clusters.
- The already proven resource-stack fallback and eight Learn switch fallbacks remain in the 71-item manifest as reviewed `requires-proof` items with current source/browser evidence.
- Semantic non-identical selector overlap is not claimed safe by the exact-selector parser.
- Guest Profile auth/recovery, Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- Dependabot and unrelated product/design work remain outside Issue #70 slices.

## Recent production evidence

1. #372 — `style(frontend): make Learn switch placement order-independent` → `e8288ef1c91e948594168aa869bdd5a275d6b3b8`.
2. #371 — `docs(agent): reconcile PR 370 delivery` → `cc3636872f47c44948d9be5f3aec4784fb2c5a79`.
3. #370 — `style(frontend): prove routed resource stack width ownership` → `740de92a4c6b748d9bcc6232b1c69d1601ca2be4`.
4. #369 — `docs(agent): reconcile PR 368 delivery` → `7c3684a63e415c647f0b1c7a96ac86387f79cafd`.
5. #368 — `style(frontend): make mobile PWA shell order-independent` → `7c4f6b2fa9237080451f0a7ebaa48201e124b53f`.

## Evidence

- PR #372 immutable head `d8146a29c86c14d7c007f7cae0bc56149cfecdaa` passed authoritative full CI #2663 / run `30861225052`.
- Frontend parser/source contracts, lint, TypeScript, unit tests, production build, dependency audit, backend unit/security/integration, both UI shards, Lesson, Dictionary, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance and both container builds succeeded.
- One unrelated Lesson iOS WebKit pre-hydration input race failed on the first attempt; the preceding PR head had passed the same job, the only new diff was a separate cascade-test oracle, trace evidence showed the input reset during hydration, and the isolated same-head retry passed 112 tests with 4 skips.
- Expected-head squash merge produced `e8288ef1c91e948594168aa869bdd5a275d6b3b8`.
- Exact-SHA main CI run `30862151034` completed successfully with the full product matrix and image publication.
- Stage run `30862634205` deployed the exact SHA; deployment, public smoke and all 12 public browser checks succeeded directly.
- Indexed search remains discovery only; final claims use exact refs, files, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
