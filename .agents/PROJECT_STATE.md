# LexiGo Project State

## Verification

- Last verified: 2026-08-03 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `7b1b18eb6ba42513ca4a10b86961b9318650fbe9`.
- Latest deployed product SHA: `7b1b18eb6ba42513ca4a10b86961b9318650fbe9`.
- Latest completed Issue #70 slice: fail-closed navigation/mobile-shell computed-cascade evidence.
- Completion PR: #364.
- PR #364 immutable developer-authored head: `0e2144a8b262ea74ae758c57cbc8052dcb407ce9`.
- Authoritative PR CI: #2602 / run `30814091000`, complete success without retry.
- Expected-head squash merge produced product SHA `7b1b18eb6ba42513ca4a10b86961b9318650fbe9`.
- Exact-SHA main CI run `30814893312` completed successfully on the merge SHA.
- Exact-SHA stage run `30815582586` deployed web/API images tagged `7b1b18eb6ba42513ca4a10b86961b9318650fbe9`; deploy, public smoke and all 12 public browser checks succeeded without retry.
- PR #364 comments, reviews and unresolved review threads were empty before merge.
- The only open pull requests when this documentation branch was created were parallel Dependabot maintenance PRs #304, #305 and #306; they were not modified or mixed into Issue #70.

## Completed foundations

### Platform and delivery

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint/type/unit/build/browser, accessibility, visual, performance and container gates.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.
- Product delivery requires immutable-head PR CI, expected-head squash merge, exact-SHA main CI and exact-SHA stage/public validation.

### Route and runtime ownership

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile, Scenario Catalog and Scenario Detail use dedicated route-island owners.
- `LexigoBootstrappedApp` remains the session restoration, refresh coordination, account runtime and route-entry owner.
- `ReviewOutboxRuntime` remains the durable review-queue owner.
- Authenticated `/profile` is selected by canonical `LexigoProfileApp`; guest authentication and recovery remain intentionally compatibility-owned by `LexigoPremiumApp.renderProfile()`.
- `renderLibrary()` remains live for product-owned Dictionary History entries.
- `renderLesson()` and unknown/product-route fallback remain live.
- Broad deletion of `LexigoPremiumApp` is prohibited without new exact two-sided reachability evidence.

## Issue #70 compatibility and CSS evidence

### Completed compatibility route cleanup

- Phrases, Progress, Dictionary, Profile, Scenario, Home and Learn ownership boundaries were established in proof-first slices.
- Only presentation/runtime proven unreachable by exact guest/auth route evidence was removed.
- PR #324 bounded remaining compatibility presentation dispatch to live Library, guest Profile and Lesson behavior.
- PR #328 added production-network evidence that canonical route islands exclude fallback-exclusive JavaScript assets.
- PR #354 completed the fail-closed source inventory for all nine dedicated route islands and intentionally live compatibility/shared owners.
- Guest Profile, Library, Lesson, unknown/product-route fallback, Review Outbox, email confirmation and account security/email/data owners remain protected.

### Completed orphan CSS cleanup

- PRs #346/#348 proved and removed the orphaned `lx-resource-notice*` family while preserving live session and async-state owners.
- PRs #350/#352 proved and removed `.lx-themed-home` and `.lx-themed-library` while preserving `.lx-themed-selector`, `.lx-themed-symbol`, `.lx-themed-arrow`, collection-prefixed and accessibility owners.
- PRs #355/#358 proved and removed the five orphaned Home hero-decoration families: `lx-hero-copy`, `lx-glow`, `lx-floating-card`, `lx-book-base` and `lx-orbit`.
- The Home hero production CSS diff was deletion-only: 94 lines removed, covering the complete 19-token bounded inventory.
- The source contract protects live Home, Lesson and guest-auth owners and fails closed on executable or CSS reintroduction.
- These cleanup PRs passed unchanged authoritative Linux visual hashes and route-performance budgets.

### Compact Home source-order independence — PR #360

- Shared and compact Home hero selectors previously had equal specificity `(0, 2, 0)` and competing `min-height` values in the 720–760 px range.
- PR #360 scoped all 26 compact Home selector entries below `.lx-routed-app`, producing compact specificity `(0, 3, 0)` while adaptive specificity remains `(0, 4, 0)`.
- `compact-home.css` is intentionally imported before `information-architecture.css` as an adversarial order-independence proof.
- Declaration values, `760px` / `390px` media boundaries, visual baselines and route-performance budgets remained unchanged.
- `frontend/components/home-css-order-independence.test.ts` fail-closes routed-shell ancestry, exact imports, selector scoping, media boundaries, absence of `!important` and compact/shared/adaptive precedence.

### Global exact-selector overlap inventory — PR #362

- `frontend/app/global-feature-style-overlap-source.test.ts` derives the CSS inventory from actual imports in `frontend/app/layout.tsx`.
- The dependency-free parser handles comments, quoted values, selector groups, declarations and nested `@media`, `@supports`, `@container` and `@layer` blocks.
- Candidate conflicts require different files, identical normalized selector/property, equal `!important` priority, different normalized values and overlapping recognized media conditions.
- `frontend/app/global-feature-style-overlap-manifest.json` contains the complete reviewed ordered manifest and is parsed from `unknown` with explicit runtime validation.
- `frontend/app/global-feature-style-overlap-manifest.test.ts` independently requires 107 unique items, exact classification totals, the exact 12 stylesheet pairs and exact pair counts.
- Initial classification was 50 `intentional`, 57 `requires-proof` and 0 `protected`.
- Intentional accessibility-layer groups are Scenario Lessons base → accessibility 40, Lesson Composer base → accessibility 5, Progress Evidence base → accessibility 4 and Knowledge Coach route-rail target size 1.

### Navigation/mobile-shell computed-cascade evidence — PR #364

- The proof slice covered exactly 37 unresolved manifest items across:
  - `premium-ui.css` → `adaptive-navigation.css`: 21;
  - `premium-ui.css` → `mobile-pwa-fixes.css`: 10;
  - `mobile-pwa-fixes.css` → `adaptive-navigation.css`: 6.
- Production root import order remains premium → mobile PWA → adaptive navigation.
- Mobile PWA fixes apply through 760px.
- Adaptive compact navigation applies through 719px.
- Adaptive tablet navigation applies from 720px through 1099px.
- The exact 720–760 px overlap currently computes a hybrid owner:
  - adaptive navigation owns header geometry, alignment and rail mode because it is later in the cascade;
  - mobile PWA fixes own header background, logo/avatar dimensions and view top padding because no later adaptive declaration replaces those properties.
- At 761px mobile PWA rules stop applying; premium visual values remain under adaptive tablet geometry.
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts` fail-closes the exact 37-item manifest boundary, pair counts, import order, media boundaries, declaration inventory, test-script routing and production-equivalent viewport metadata.
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts` loads the actual production CSS owners and asserts computed values at 390, 719, 720, 760, 761 and 1024 px.
- Browser evidence requires exactly one visible primary navigation and no horizontal overflow at every measured width.
- The initial candidate failed only because the isolated Android Chromium fixture omitted the production viewport meta tag and therefore retained an approximately 980px layout viewport. The fixture was corrected without changing production CSS or weakening expected computed values.
- PR #364 changed no production CSS, component/runtime, route, API/backend/database, snapshot, budget, workflow, dependency, README or architecture path.
- Immutable-head PR CI, exact-SHA main CI and exact-SHA stage/public validation all passed without snapshot, budget, timeout or dependency changes.

## Current Issue #70 acceptance evidence

- `frontend/components/production-app-entry.test.ts` fail-closes the exact production application-root inventory, retired-root absence, canonical layout → routed shell → bootstrap chain and bootstrap-only route-entry imports.
- `frontend/app/global-style-ownership.test.ts` requires `globals.css` to be the sole owner of document `body` and shared `button, input` font inheritance.
- `frontend/e2e/route-bundle-budget.spec.ts` measures all canonical cold routes, derives JavaScript assets exclusive to the live compatibility fallback and requires every canonical route to exclude them.
- `frontend/bundle-budgets.json` owns blocking JavaScript/request ceilings and immutable route baselines.
- README documents the actual production chain, route/runtime ownership and global CSS boundary.
- Phrases catalog-sort and compact Home have explicit adversarial source-order contracts.
- The exact-selector overlap inventory provides a fail-closed bounded map of the remaining feature-style ownership surface.
- Navigation/mobile-shell behavior is now measured at every critical compact/tablet boundary, but current hybrid ownership has not yet been corrected or intentionally consolidated.

## In progress

- No atomic production slice is active.
- This documentation-only reconciliation records PR #364 delivery and resets the completed task context.
- Issue #70 remains open because the navigation/mobile-shell cluster still requires one bounded production ownership correction, other exact-selector clusters remain, and semantically overlapping non-identical selectors remain a later acceptance boundary.

## Remaining roadmap

### 1. Navigation/mobile-shell production correction

- Re-read live `main`, Issue #70, open PRs, CI and stage after this reconciliation merges.
- Select exactly one bounded correction for the navigation/mobile-shell cluster only.
- Use PR #364 browser evidence to choose the canonical owner independently of accidental source order.
- Candidate mechanisms may include media-boundary separation, route-scoped specificity, declaration migration or owner consolidation; select one only after current source and computed values are audited.
- Preserve the approved computed presentation unless an explicit design change is separately approved.
- Require unchanged authoritative Linux visual hashes, accessibility results and route-performance budgets for a pure ownership correction.
- Do not combine Learning switch, Phrases grid, adaptive layout, account-security or async-state corrections.

### 2. Remaining exact-selector clusters

Handle each as a separate proof-first atomic slice after navigation/mobile-shell delivery:

- Scenario Catalog / Learning section switch: 8 conflicts.
- Adaptive tablet layout: 6 conflicts.
- Phrases grid: 4 conflicts.
- Account Security width: 1 conflict.
- Async State width: 1 conflict.

### 3. Final Issue #70 acceptance reconciliation

- Audit semantically overlapping selectors that are not textually identical.
- Reconcile global feature-style evidence with app-entry, compatibility reachability, fallback-exclusive bundle, global ownership, visual regression and README evidence.
- Close Issue #70 only when every acceptance criterion has current fail-closed evidence.

### 4. Separate maintenance and product roadmap

- Keep Dependabot and dependency upgrades separate from compatibility/CSS cleanup.
- Continue #18/#201 personalization and First Use only after approved design states.
- Continue #25 pronunciation/listening after architecture and privacy contracts.
- Continue #203/#205/#133 design parity and moderated usability as separate work.

## Validation pending

- The 37 navigation/mobile-shell exact-selector conflicts are now proven at source and computed-browser level but are not yet corrected or reclassified as intentionally owned.
- Twenty additional exact-selector conflicts remain outside the navigation/mobile-shell cluster.
- Semantically overlapping but textually different selectors are not claimed safe by the exact-selector inventory.
- Guest Profile authentication/recovery, Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #364 — `test(frontend): prove navigation mobile cascade owners` → `7b1b18eb6ba42513ca4a10b86961b9318650fbe9`.
2. #363 — `docs(agent): reconcile PR 362 CSS overlap inventory` → `626b6f637f517253aea87faf12223e4e43bfc1e0`.
3. #362 — `test(frontend): inventory global CSS source-order conflicts` → `8c342e219f4d274a89189534deae20c3499e5c9e`.
4. #361 — `docs(agent): reconcile PR 360 Home CSS order independence` → `708403160cb35c1e155c5e3eabd2e5078e4826c4`.
5. #360 — `style(frontend): make compact Home CSS order-independent` → `37f3e0d36fa6a34a63c3ef5c51459ec0af98cbcd`.

## Evidence

- PR #364 final developer-authored head `0e2144a8b262ea74ae758c57cbc8052dcb407ce9` passed authoritative full CI #2602 / run `30814091000` without retry.
- Final PR CI passed the exact 37-item source contract, frontend lint, typecheck, full unit suite, production build and dependency audit.
- Backend unit/security/integration, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds succeeded.
- PR #364 discussion contained no comments, reviews or unresolved review threads.
- Expected-head squash merge produced product SHA `7b1b18eb6ba42513ca4a10b86961b9318650fbe9`.
- Exact-SHA main CI run `30814893312` completed successfully on that merge SHA.
- Stage run `30815582586` deployed web/API images tagged `7b1b18eb6ba42513ca4a10b86961b9318650fbe9`, returned successful public smoke and completed all 12 public desktop Chromium/iOS WebKit checks without retry.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow evidence and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
