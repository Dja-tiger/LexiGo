# LexiGo Project State

## Verification

- Last verified: 2026-08-03 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `8c342e219f4d274a89189534deae20c3499e5c9e`.
- Latest deployed product SHA: `8c342e219f4d274a89189534deae20c3499e5c9e`.
- Latest completed Issue #70 slice: fail-closed repository-wide exact-selector global feature CSS overlap inventory and reviewed classification.
- Completion PR: #362.
- PR #362 immutable developer-authored head: `442f7c1cfb3c8bf67346eb026207de565e611f9e`.
- Authoritative PR CI: #2591 / run `30809820372`, complete success without retry.
- Expected-head squash merge produced product SHA `8c342e219f4d274a89189534deae20c3499e5c9e`.
- Post-merge main CI run `30810594048` repeated the complete product matrix successfully on the exact merge SHA.
- Exact-SHA stage run `30811188594` deployed web/API images tagged `8c342e219f4d274a89189534deae20c3499e5c9e`; deploy, public smoke and all 12 public browser checks succeeded without retry.
- PR #362 comments, reviews and unresolved review threads were empty before merge.
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
- The source contract fails closed on executable or CSS reintroduction and protects `.lx-hero-card`, `.lx-hero-card::before`, `.lx-hero-art`, `.lx-hero-actions`, `lx-word-preview`, `lx-home-next-action-copy`, `lx-progress-panel`, `lx-resume-strip` and `lx-auth-card`.
- These cleanup PRs passed unchanged authoritative Linux visual hashes and route-performance budgets.

### Compact Home source-order independence — PR #360

- Shared and compact Home hero selectors previously had equal specificity `(0, 2, 0)` and competing `min-height` values in the 720–760 px range.
- PR #360 scoped all 26 compact Home selector entries below `.lx-routed-app`, producing compact specificity `(0, 3, 0)` while adaptive specificity remains `(0, 4, 0)`.
- `compact-home.css` is intentionally imported before `information-architecture.css` as an adversarial order-independence proof.
- Declaration values, `760px` / `390px` media boundaries, visual baselines and route-performance budgets remained unchanged.
- `frontend/components/home-css-order-independence.test.ts` fail-closes routed-shell ancestry, exact imports, selector scoping, media boundaries, absence of `!important` and compact/shared/adaptive precedence.

### Global exact-selector overlap inventory — PR #362

- `frontend/app/global-feature-style-overlap-source.test.ts` derives the CSS inventory from the actual imports in `frontend/app/layout.tsx`.
- Its dependency-free parser handles comments, quoted values, selector groups, declarations and nested `@media`, `@supports`, `@container` and `@layer` blocks.
- Keyframes, same-file layering and selectors outside `.lx-*` feature ownership are excluded.
- A candidate requires different files, identical normalized selector/property, equal `!important` priority, different normalized values and overlapping recognized media conditions.
- Deterministic conflict IDs contain selector, property, priority, source files, condition stacks and exact values.
- `frontend/app/global-feature-style-overlap-manifest.json` contains the complete reviewed ordered manifest and is parsed from `unknown` with explicit runtime validation.
- Ordered actual IDs must exactly equal ordered manifest IDs; additions, removals or mutations fail the source contract.
- `frontend/app/global-feature-style-overlap-manifest.test.ts` independently requires 107 unique items, exact classification totals, the exact 12 stylesheet pairs and exact pair counts; unknown pairs, mixed classifications, malformed entries and empty evidence fail closed.

Reviewed inventory:

- Total exact-selector/property conflicts: 107.
- `intentional`: 50.
- `requires-proof`: 57.
- `protected`: 0 in this exact-selector inventory.

Intentional accessibility-layer groups:

- Scenario Lessons base → accessibility: 40.
- Lesson Composer base → accessibility: 5.
- Progress Evidence base → accessibility: 4.
- Knowledge Coach route-rail target size: 1.

Remaining `requires-proof` groups:

- `premium-ui.css` → `adaptive-navigation.css`: 21.
- `premium-ui.css` → `mobile-pwa-fixes.css`: 10.
- `scenario-catalog.css` → `learning-section-switch.css`: 8.
- `mobile-pwa-fixes.css` → `adaptive-navigation.css`: 6.
- `premium-ui.css` → `adaptive-layout.css`: 6.
- `premium-ui.css` → `phrases.css` for unscoped `.lx-phrase-grid`: 4.
- `account-security.css` → `adaptive-knowledge-coach-home.css`: 1.
- `adaptive-navigation.css` → `system-states.css`: 1.

- The existing Phrases CSS ownership contract protects route-scoped catalog-sort selectors, not the unscoped `.lx-phrase-grid`; those four items remain `requires-proof`.
- PR #362 changed no production CSS, component/runtime, route, API/backend/database, snapshot, budget, workflow, dependency, README or architecture path.
- Immutable-head PR CI and exact-SHA main CI both passed the complete browser/accessibility/visual/performance matrix without snapshot or budget changes.
- Stage deployed the exact merge SHA and all 12 public desktop Chromium/iOS WebKit checks passed.

## Current Issue #70 acceptance evidence

- `frontend/components/production-app-entry.test.ts` fail-closes the exact production application-root inventory, retired-root absence, canonical layout → routed shell → bootstrap chain and bootstrap-only route-entry imports.
- `frontend/app/global-style-ownership.test.ts` requires `globals.css` to be the sole owner of document `body` and shared `button, input` font inheritance.
- `frontend/e2e/route-bundle-budget.spec.ts` measures all canonical cold routes, derives JavaScript assets exclusive to the live compatibility fallback and requires every canonical route to exclude them.
- `frontend/bundle-budgets.json` owns blocking JavaScript/request ceilings and immutable route baselines.
- README documents the actual production chain, route/runtime ownership and global CSS boundary.
- Phrases catalog-sort and compact Home have explicit adversarial source-order contracts.
- The exact-selector overlap inventory now provides a fail-closed bounded map of the remaining feature-style ownership surface.

## In progress

- No atomic production slice is active.
- This documentation-only reconciliation records PR #362 delivery and resets the completed task context.
- Issue #70 remains open because 57 exact-selector conflicts still require bounded computed-cascade proof or correction, and semantically overlapping non-identical selectors remain a later acceptance boundary.

## Remaining roadmap

### 1. Navigation/mobile-shell ownership

- Re-read live `main`, Issue #70, open PRs, CI and stage after this reconciliation merges.
- Start one bounded proof-first slice for the navigation/mobile-shell cluster only.
- Measure computed values and ownership at compact widths, 719px, 720px, 760px and representative tablet widths.
- Cover the exact overlap among `premium-ui.css`, `mobile-pwa-fixes.css` and `adaptive-navigation.css`.
- Establish canonical ownership independently of source order before deleting, moving or changing any declaration.
- Preserve all authoritative Linux visual hashes, accessibility results and route-performance budgets.
- Do not combine Learning switch, Phrases grid, adaptive layout, account-security or async-state corrections in this slice.

### 2. Remaining exact-selector clusters

Handle each as a separate proof-first atomic slice after navigation/mobile-shell delivery:

- Scenario Catalog / Learning section switch.
- Phrases grid.
- Adaptive tablet layout.
- Account Security width.
- Async State width.

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

- Fifty-seven exact-selector conflicts remain `requires-proof` and are intentionally not corrected by PR #362.
- Semantically overlapping but textually different selectors are not claimed safe by the exact-selector inventory.
- Guest Profile authentication/recovery, Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- `.lx-hero-card`, `.lx-hero-art`, `.lx-hero-actions`, `lx-word-preview`, `lx-home-next-action-copy`, `lx-progress-panel`, `lx-resume-strip` and `lx-auth-card` remain protected live owners.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #362 — `test(frontend): inventory global CSS source-order conflicts` → `8c342e219f4d274a89189534deae20c3499e5c9e`.
2. #361 — `docs(agent): reconcile PR 360 Home CSS order independence` → `708403160cb35c1e155c5e3eabd2e5078e4826c4`.
3. #360 — `style(frontend): make compact Home CSS order-independent` → `37f3e0d36fa6a34a63c3ef5c51459ec0af98cbcd`.
4. #359 — `docs(agent): reconcile PR 358 Home hero deletion` → `17c801ae3d9a18a1623d723c39a4b81fae3147ef`.
5. #358 — `style(frontend): remove orphaned Home hero decorations` → `7ef023da70819a5afabfeccbff4d6c34768449f2`.

## Evidence

- PR #362 final developer-authored head `442f7c1cfb3c8bf67346eb026207de565e611f9e` passed authoritative full CI #2591 / run `30809820372` without retry.
- Final PR CI passed the exact 107-ID source contract, the 50/57/0 classification contract, frontend lint, typecheck, full unit suite, production build and dependency audit.
- Backend unit/security/integration, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds succeeded.
- PR #362 discussion contained no comments, reviews or unresolved review threads.
- Expected-head squash merge produced product SHA `8c342e219f4d274a89189534deae20c3499e5c9e`.
- Post-merge main CI run `30810594048` repeated the complete product matrix successfully on that exact merge SHA and published web/API images.
- Stage run `30811188594` deployed web/API images tagged `8c342e219f4d274a89189534deae20c3499e5c9e`, returned successful public smoke and completed all 12 public browser checks without retry.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
