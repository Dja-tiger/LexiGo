# LexiGo Project State

## Verification

- Last verified: 2026-08-04 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `fd5c6b16eb971f60cb218cd94b7afcc485fcb5c0`.
- Latest deployed product SHA: `fd5c6b16eb971f60cb218cd94b7afcc485fcb5c0`.
- Latest completed Issue #70 slice: routed Account Security desktop width ownership.
- Completion PR: #378.
- PR #378 immutable developer-authored head: `f78843b8e9e5bda4165a67d9c8fdceb4a8a88e2a`.
- Authoritative PR CI: #2683 / run `30890799578`, complete success.
- Expected-head squash merge produced product SHA `fd5c6b16eb971f60cb218cd94b7afcc485fcb5c0`.
- Exact-SHA main CI run `30891539487` completed successfully with the full product matrix and immutable web/API image publication.
- Exact-SHA stage run `30892205056` deployed web/API images tagged `fd5c6b16eb971f60cb218cd94b7afcc485fcb5c0`; deployment and public smoke succeeded. Public browser validation concluded successfully after one transient iOS WebKit service-worker access-control error passed on retry.
- PR #378 had no comments, reviews or unresolved review threads before merge.
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
- Compact Home, Phrases sorting/grid, navigation/mobile shell, routed resource-stack, Learn switch placement, adaptive Lesson Composer tablet geometry and Account Security desktop width have adversarial source-order browser/source contracts.

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
- Production and adversarial orders produce identical switch/shell snapshots, exactly one primary navigation and no horizontal overflow.
- The eight switch conflicts remain in the reviewed manifest as `requires-proof`; deterministic behavior is supplied by stronger route ownership and companion source/browser evidence.
- Visual hashes, budgets, tolerances, timeouts, route runtime and Scenario Catalog presentation remain unchanged.

### PR #374 — adaptive Lesson Composer tablet ownership

- Preserved all six reviewed `premium-ui.css` → `adaptive-layout.css` generic fallback conflicts for `.lx-source-selector`, `.lx-source-selector > button`, `.lx-setup-footer` and `.lx-setup-submit`.
- Confirmed the live `/learn` renderer remains below `.lx-main-content[aria-label="Обучение"]` and is owned by the stronger selectors in `adaptive-lesson-composer.css`.
- Added a fail-closed six-item source contract for exact manifest membership, import order, renderer reachability, selector specificity and approved values.
- Added Chromium computed-cascade proof under production and two adversarial stylesheet orders at 719, 720, 760, 761, 767, 768, 1099 and 1100 px.
- Through 767px the canonical source selector/footer remain one column and submit remains grid; from 768px the selector remains three columns, buttons retain `auto minmax(0, 1fr)`, footer remains `display: contents` and submit remains grid.
- Production CSS, declaration values, breakpoints, import order, visual baselines, performance budgets, tolerances, timeouts and runtime behavior were unchanged.
- The six exact conflicts remain in the reviewed manifest as `requires-proof`; deterministic behavior is supplied by the stronger non-identical route owner and companion source/browser evidence.

### PR #376 — Phrases result-grid ownership

- Preserved all four reviewed `premium-ui.css` → `phrases.css` fallback conflicts for `.lx-phrase-grid`: `gap` plus the global, 1040px and 760px column declarations.
- Added `.lx-app[data-route-client-island="phrases"] .lx-phrase-grid` as the stronger canonical production owner with the existing one-column `minmax(0, 1fr)` geometry and 10px gap.
- Confirmed `PhrasesCatalog` is the sole production renderer and the dual-class result list remains below the dedicated Phrases route island.
- Added source evidence for exact manifest membership, fallback preservation, renderer reachability, selector specificity and authoritative command registration.
- Added Chromium computed-cascade proof under production and two adversarial stylesheet orders at 390, 760, 761, 1040, 1041 and 1440 px.
- The first implementation copied `padding: 0` from the unscoped group and deterministically removed the existing 24px result spacing in four Phrases catalog visual baselines. The baseline was not changed; the owner was narrowed to grid/gap/margin properties and the browser proof now fail-closes `padding-top: 24px`.
- Final visual regression passed against the unchanged content-addressed hashes; route budgets, fallbacks, breakpoints, dependencies, tolerances, timeouts and runtime behavior remain unchanged.
- The four exact conflicts remain in the reviewed manifest as `requires-proof`; deterministic behavior is supplied by the stronger route-island owner and companion source/browser evidence.

### PR #378 — routed Account Security width ownership

- Preserved the global `account-security.css` width fallback and the existing `adaptive-knowledge-coach-home.css` desktop-shell fallback for `.lx-account-security`.
- Confirmed `AccountSecurityPanel` is `/profile`-only, is mounted by `LexigoBootstrappedApp`, and remains a sibling of `.lx-app` beneath the stable `.lx-routed-app` shell.
- Added `.lx-routed-app .lx-account-security` inside the existing 1024px desktop range as the stronger canonical owner with identical rail-aware width, margins and border-box geometry.
- Added source evidence for exact manifest membership, both fallback owners, import order, runtime ancestry, specificity and approved values.
- Added Chromium computed-cascade proof under production, reversed and repeated-fallback orders at 719, 720, 1023, 1024, 1099, 1100 and 1440 px.
- Mobile and tablet geometry, security/session behavior, visual baselines, budgets, breakpoints, dependencies, tolerances and timeouts remain unchanged.
- The exact Account Security conflict remains in the reviewed manifest as `requires-proof`; deterministic behavior is supplied by the stronger routed owner and companion source/browser evidence.

## Current Issue #70 acceptance evidence

- `frontend/components/production-app-entry.test.ts` fail-closes the production application-root inventory, retired-root absence and layout → routed shell → bootstrap chain.
- `frontend/app/global-style-ownership.test.ts` protects the sole document `body` and shared `button, input` font-inheritance owners.
- `frontend/e2e/route-bundle-budget.spec.ts` verifies canonical routes exclude compatibility-fallback-exclusive assets.
- `frontend/bundle-budgets.json` owns blocking JavaScript/request ceilings and immutable route baselines.
- Navigation/mobile-shell source contracts protect canonical routed owners, compatibility fallbacks and live resource-stack renderer boundaries.
- The Chromium cascade matrix exercises production and adversarial orders across responsive boundaries, including Learn switch placement, adaptive Lesson Composer geometry, Phrases grid ownership and Account Security width.
- README and architecture documentation describe the actual route/runtime/global-style ownership graph.
- Authoritative Linux visual, accessibility, PWA, CSP, functional browser and performance gates are unchanged and green on the latest deployed product SHA.

## In progress

- No product slice is active during this documentation reconciliation.
- The completed PR #378 task context is being reset.
- Issue #70 remains open because one exact-selector item requires proof or correction, semantic non-identical-selector overlaps remain unaudited and final acceptance reconciliation is incomplete.

## Remaining roadmap

### 1. Async State width — 1 conflict

- Reconcile adaptive navigation and `system-states.css` width ownership as an isolated shared-state slice.
- Preserve shared compact/fallback state geometry while giving routed tablet states an explicit canonical owner.

### 2. Final Issue #70 acceptance reconciliation

- Audit semantically overlapping selectors that are not textually identical.
- Reconcile exact-selector evidence with app-entry, compatibility reachability, fallback-exclusive bundle, global ownership, visual regression and public architecture documentation.
- Close Issue #70 only when every acceptance criterion has current fail-closed evidence.

## Validation pending

- Remaining exact-selector inventory requiring additional proof/correction: one `.lx-async-state` width item.
- The already proven resource-stack, Learn switch, adaptive Lesson Composer, Phrases grid and Account Security fallbacks remain in the 71-item manifest as reviewed `requires-proof` items with current source/browser evidence.
- Semantic non-identical selector overlap is not claimed safe by the exact-selector parser.
- Guest Profile auth/recovery, Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- Dependabot and unrelated product/design work remain outside Issue #70 slices.

## Recent production evidence

1. #378 — `style(frontend): make Account Security width order-independent` → `fd5c6b16eb971f60cb218cd94b7afcc485fcb5c0`.
2. #377 — `docs(agent): reconcile PR 376 delivery` → `8b6b2491a49c556d236a60018842cbf8318778ab`.
3. #376 — `style(frontend): make Phrases grid order-independent` → `aec24578f73ace80ea8ef653f7a4c1081066973e`.
4. #375 — `docs(agent): reconcile PR 374 delivery` → `c51b1d0ff41ec9cc3dfcfdfd1f7a8b1304937fb4`.
5. #374 — `test(frontend): prove adaptive layout ownership` → `a26c4bc90d094e1a3eed4be4e4257537d5c90617`.

## Evidence

- PR #378 immutable head `f78843b8e9e5bda4165a67d9c8fdceb4a8a88e2a` passed authoritative full CI #2683 / run `30890799578`.
- Frontend parser/source contracts, lint, TypeScript, unit tests, production build, dependency audit, backend unit/security/integration, both UI shards, Lesson, Dictionary, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance and both container builds succeeded.
- Expected-head squash merge produced `fd5c6b16eb971f60cb218cd94b7afcc485fcb5c0`.
- Exact-SHA main CI run `30891539487` completed successfully with the full product matrix and image publication.
- Stage run `30892205056` deployed the exact SHA; deploy and public smoke succeeded. Public browser validation concluded successfully after one transient iOS WebKit service-worker access-control page error passed on retry.
- Indexed search remains discovery only; final claims use exact refs, files, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
