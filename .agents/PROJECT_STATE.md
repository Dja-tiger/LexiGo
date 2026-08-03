# LexiGo Project State

## Verification

- Last verified: 2026-08-04 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `7c4f6b2fa9237080451f0a7ebaa48201e124b53f`.
- Latest deployed product SHA: `7c4f6b2fa9237080451f0a7ebaa48201e124b53f`.
- Latest completed Issue #70 slice: mobile-PWA shell source-order independence.
- Completion PR: #368.
- PR #368 immutable developer-authored head: `fae8734a6f63b428f3db095b54ceec39534d3a6c`.
- Authoritative PR CI: #2641 / run `30853203248`, complete success.
- Expected-head squash merge produced product SHA `7c4f6b2fa9237080451f0a7ebaa48201e124b53f`.
- Exact-SHA main CI run `30853894366` completed successfully on the merge SHA.
- Exact-SHA stage run `30854579569` deployed web/API images tagged `7c4f6b2fa9237080451f0a7ebaa48201e124b53f`; deploy, public smoke and all 12 public browser checks succeeded.
- PR #368 had no comments, reviews or unresolved review threads before merge.
- No intersecting Issue #70 product PR remains open. Existing Dependabot PRs #304–#306 are separate maintenance work.

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
- Proven orphan families removed in earlier slices include `lx-resource-notice*`, `.lx-themed-home`, `.lx-themed-library` and the five retired Home hero-decoration families.
- Current source contracts protect intentionally live shared, account, lesson, guest-auth and compatibility owners.
- Canonical routes exclude fallback-exclusive JavaScript assets under cold-route browser evidence.

### Global CSS evidence

- `frontend/app/global-feature-style-overlap-source.test.ts` derives exact-selector conflicts from the actual root import graph.
- The parser handles selector groups, declarations and nested media/support/container/layer blocks without external dependencies.
- `frontend/app/global-feature-style-overlap-manifest.json` is the reviewed fail-closed inventory; its companion test protects exact totals, owner pairs and classifications.
- Accessibility-layer overrides remain intentional and separately contract-protected.
- Compact Home, Phrases sorting and navigation/mobile shell have adversarial source-order browser/source contracts.

## Completed navigation and mobile-shell ownership

### PR #364 — computed-cascade baseline

- Established browser-computed ownership at 390, 719, 720, 760, 761 and 1024 px.
- Required exactly one visible primary navigation and no horizontal overflow.
- Bounded premium, mobile-PWA and adaptive-navigation conflicts before correction.

### PR #366 — adaptive navigation source-order independence

- Removed all 21 `premium-ui.css` → `adaptive-navigation.css` shell conflicts and five navigation-shell `mobile-pwa-fixes.css` → `adaptive-navigation.css` conflicts.
- Scoped only adaptive routed shell selectors below `.lx-routed-app` without changing values or breakpoints.
- Preserved `.lx-resource-stack`, `.lx-async-state` and premium/mobile visual ownership as separate slices.
- Reduced the manifest from 107 to 81 items.

### PR #368 — mobile-PWA shell source-order independence

- Removed all ten remaining `premium-ui.css` → `mobile-pwa-fixes.css` exact-selector shell conflicts.
- Deleted mobile header-background and logo declarations already unreachable beneath the stronger routed application-shell chrome owner.
- Preserved live compact fallback/dictionary geometry, avatar dimensions and responsive view spacing.
- Preserved `adaptive-navigation.css` as tablet geometry owner and `adaptive-knowledge-coach-home.css` as routed shell chrome owner.
- Extended Chromium proof to production, routed-shell-first and mobile-first stylesheet orders at all six boundary widths.
- No declaration value, approved breakpoint, visual snapshot/hash, tolerance, timeout or route budget changed.
- The parser-derived manifest now contains exactly 71 items: 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- There are zero remaining `premium-ui.css` → `mobile-pwa-fixes.css`, `premium-ui.css` → `adaptive-navigation.css` or `mobile-pwa-fixes.css` → routed-shell-chrome exact-selector conflicts.

## Current Issue #70 acceptance evidence

- `frontend/components/production-app-entry.test.ts` fail-closes the production application-root inventory, retired-root absence and layout → routed shell → bootstrap chain.
- `frontend/app/global-style-ownership.test.ts` protects the sole document `body` and shared `button, input` font-inheritance owners.
- `frontend/e2e/route-bundle-budget.spec.ts` verifies canonical routes exclude compatibility-fallback-exclusive assets.
- `frontend/bundle-budgets.json` owns blocking JavaScript/request ceilings and immutable route baselines.
- README and architecture documentation describe the actual route/runtime/global-style ownership graph.
- Authoritative Linux visual, accessibility, PWA, CSP, functional browser and performance gates are unchanged and green on the latest deployed product SHA.

## In progress

- No product slice is active during this documentation reconciliation.
- The completed PR #368 task context is being reset.
- Issue #70 remains open because 21 exact-selector conflicts still require proof or correction, semantic non-identical-selector overlaps remain unaudited and the final acceptance reconciliation is incomplete.

## Remaining roadmap

### 1. Resource-stack width owner — 1 conflict

- Resolve only `.lx-resource-stack | width` between `mobile-pwa-fixes.css` and `adaptive-navigation.css`.
- Audit all live route/session renderers.
- Preserve compact/global width behavior and make tablet `width: 100%` independent of root import order through canonical routed ancestry.
- Do not combine `.lx-async-state` or unrelated adaptive-layout declarations.

### 2. Scenario Catalog / Learning section switch — 8 conflicts

- Establish one canonical placement owner for the Learn/Scenarios switch at desktop, tablet, compact and narrow widths.
- Preserve approved pixels and route accessibility; do not mix Scenario cards or navigation chrome.

### 3. Adaptive tablet layout — 6 conflicts

- Resolve the bounded `premium-ui.css` → `adaptive-layout.css` cluster with computed-cascade and visual evidence.

### 4. Phrases grid — 4 conflicts

- Preserve the extracted Phrases route as canonical grid owner independently of premium fallback order.

### 5. Account Security width — 1 conflict

- Reconcile account-security global width with routed desktop shell placement without changing confirmation/security semantics.

### 6. Async State width — 1 conflict

- Reconcile adaptive navigation and `system-states.css` width ownership as an isolated shared-state slice.

### 7. Final Issue #70 acceptance reconciliation

- Audit semantically overlapping selectors that are not textually identical.
- Reconcile exact-selector evidence with app-entry, compatibility reachability, fallback-exclusive bundle, global ownership, visual regression and public architecture documentation.
- Close Issue #70 only when every acceptance criterion has current fail-closed evidence.

## Validation pending

- Remaining exact-selector inventory: 21 `requires-proof` items across six bounded clusters.
- Semantic non-identical selector overlap is not claimed safe by the exact-selector parser.
- Guest Profile auth/recovery, Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- Dependabot and unrelated product/design work remain outside Issue #70 slices.

## Recent production evidence

1. #368 — `style(frontend): make mobile PWA shell order-independent` → `7c4f6b2fa9237080451f0a7ebaa48201e124b53f`.
2. #367 — `docs(agent): reconcile PR 366 delivery` → `1030ef2decd970251846650371c18ed8ff9f0ba1`.
3. #366 — `style(frontend): make adaptive navigation order-independent` → `924a50af5ff5e6d9748d0a48fa43b104c09c8e05`.
4. #365 — `docs(agent): reconcile PR 364 cascade evidence` → `e72e88c697ae74dc3dbdb65ed20ce640baee243d`.
5. #364 — `test(frontend): prove navigation mobile cascade owners` → `7b1b18eb6ba42513ca4a10b86961b9318650fbe9`.

## Evidence

- PR #368 immutable head `fae8734a6f63b428f3db095b54ceec39534d3a6c` passed authoritative full CI #2641 / run `30853203248`.
- Frontend core, backend unit/security/integration, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds succeeded.
- Expected-head squash merge produced `7c4f6b2fa9237080451f0a7ebaa48201e124b53f`.
- Exact-SHA main CI run `30853894366` completed successfully with the same full product matrix.
- Stage run `30854579569` deployed exact web/API images; deploy, public smoke and 12 public desktop Chromium/iOS WebKit checks succeeded.
- Indexed search remains discovery only; final claims use exact refs, files, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.