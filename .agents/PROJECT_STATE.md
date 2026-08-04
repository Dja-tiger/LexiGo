# LexiGo Project State

## Verification

- Last verified: 2026-08-04 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `2cdb35d2c8184ea75d27fcf0e078cf400dfa2eb9`.
- Latest deployed product SHA: `2cdb35d2c8184ea75d27fcf0e078cf400dfa2eb9`.
- Latest completed Issue #70 slice: routed Async State tablet width ownership.
- Completion PR: #380.
- PR #380 immutable developer-authored head: `16428c2a328e005ed1524b1673fc0d1900ee4101`.
- Authoritative PR CI: #2687 / run `30897332385`, complete success.
- Expected-head squash merge produced product SHA `2cdb35d2c8184ea75d27fcf0e078cf400dfa2eb9`.
- Exact-SHA main CI run `30898051599` completed successfully with the full product matrix and immutable web/API image publication.
- Exact-SHA stage run `30898741503` deployed web/API images tagged `2cdb35d2c8184ea75d27fcf0e078cf400dfa2eb9`; deployment, public smoke and public browser validation succeeded, including 12/12 public runtime checks.
- PR #380 had no comments, reviews or unresolved review threads before merge.
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
- Proven orphan families removed in earlier slices include `lx-resource-notice*`, `.lx-themed-home`, `.lx-themed-library` and retired Home hero-decoration families.
- Current source contracts protect intentionally live shared, account, lesson, guest-auth and compatibility owners.
- Canonical routes exclude fallback-exclusive JavaScript assets under cold-route browser evidence.

### Global CSS evidence

- `frontend/app/global-feature-style-overlap-source.test.ts` derives exact-selector conflicts from the actual root import graph.
- The parser handles selector groups, declarations and nested media/support/container/layer blocks without external dependencies.
- `frontend/app/global-feature-style-overlap-manifest.json` is the reviewed fail-closed inventory; its companion test protects exact totals, owner pairs and classifications.
- The manifest remains at 71 items: 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- Accessibility-layer overrides remain intentional and separately contract-protected.
- All 21 reviewed `requires-proof` items now have focused stronger-owner source and adversarial browser evidence: routed resource-stack (1), Learn switch placement (8), adaptive Lesson Composer geometry (6), Phrases result grid (4), Account Security width (1) and routed Async State width (1).
- Compact Home, navigation/mobile shell, routed resource-stack, Learn switch placement, adaptive Lesson Composer tablet geometry, Phrases sorting/grid, Account Security desktop width and Async State tablet width have source-order-independent browser/source contracts.
- The exact-selector correction roadmap is exhausted; final Issue #70 work is limited to a centralized semantic non-identical-selector and acceptance reconciliation.

## Completed navigation and global-style ownership

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
- Extended the existing three-order/six-width Chromium proof to compare `.lx-resource-stack` and `.lx-main-content` bounding widths.
- Below 720px the resource stack retains the 28px total inset; from 720px through 1099px it equals main-content width under every tested stylesheet order.
- No visual snapshot/hash, performance budget, tolerance, timeout or backend/runtime contract changed.

### PR #372 — Learn switch placement ownership

- Preserved all eight reviewed Scenario Catalog compatibility fallback conflicts for `.lx-learning-section-switch--learn`.
- Added matching, stronger `.lx-routed-app[data-route-path="/learn"]` owners for global, tablet, desktop, compact and narrow placement without changing declaration values or breakpoints.
- Preserved Scenario Catalog as the shared switch appearance and compatibility-fallback owner.
- Added source contracts for renderer reachability, fallback preservation, routed specificity and unchanged placement values.
- Extended the Chromium computed-cascade matrix to production and two adversarial stylesheet orders at 360, 390, 719, 720, 1024 and 1440 px.
- Production and adversarial orders produce identical switch/shell snapshots, exactly one primary navigation and no horizontal overflow.
- Visual hashes, budgets, tolerances, timeouts, route runtime and Scenario Catalog presentation remain unchanged.

### PR #374 — adaptive Lesson Composer tablet ownership

- Preserved all six reviewed `premium-ui.css` → `adaptive-layout.css` generic fallback conflicts for `.lx-source-selector`, `.lx-source-selector > button`, `.lx-setup-footer` and `.lx-setup-submit`.
- Confirmed the live `/learn` renderer remains below `.lx-main-content[aria-label="Обучение"]` and is owned by stronger selectors in `adaptive-lesson-composer.css`.
- Added a fail-closed six-item source contract for exact manifest membership, import order, renderer reachability, selector specificity and approved values.
- Added Chromium computed-cascade proof under production and two adversarial stylesheet orders at 719, 720, 760, 761, 767, 768, 1099 and 1100 px.
- Production CSS, declaration values, breakpoints, import order, visual baselines, performance budgets, tolerances, timeouts and runtime behavior were unchanged.

### PR #376 — Phrases result-grid ownership

- Preserved all four reviewed `premium-ui.css` → `phrases.css` fallback conflicts for `.lx-phrase-grid`: `gap` plus global, 1040px and 760px column declarations.
- Added `.lx-app[data-route-client-island="phrases"] .lx-phrase-grid` as the stronger canonical production owner with the existing one-column `minmax(0, 1fr)` geometry and 10px gap.
- Confirmed `PhrasesCatalog` is the sole production renderer and the dual-class result list remains below the dedicated Phrases route island.
- Added source evidence and Chromium computed-cascade proof under production and two adversarial stylesheet orders at 390, 760, 761, 1040, 1041 and 1440 px.
- A first implementation copied `padding: 0` and exposed a real visual regression; the baseline was not changed, the owner was narrowed, and the final browser proof fail-closes `padding-top: 24px`.
- Final visual regression passed against unchanged hashes; route budgets, fallbacks, breakpoints, dependencies, tolerances, timeouts and runtime behavior remain unchanged.

### PR #378 — routed Account Security width ownership

- Preserved the global `account-security.css` width fallback and existing `adaptive-knowledge-coach-home.css` desktop-shell fallback for `.lx-account-security`.
- Confirmed `AccountSecurityPanel` is `/profile`-only, is mounted by `LexigoBootstrappedApp`, and remains beneath the stable `.lx-routed-app` shell.
- Added `.lx-routed-app .lx-account-security` inside the existing 1024px desktop range as the stronger canonical owner with identical rail-aware width, margins and border-box geometry.
- Added source evidence and Chromium computed-cascade proof under production, reversed and repeated-fallback orders at 719, 720, 1023, 1024, 1099, 1100 and 1440 px.
- Mobile/tablet geometry, security/session behavior, visual baselines, budgets, breakpoints, dependencies, tolerances and timeouts remain unchanged.

### PR #380 — routed Async State tablet width ownership

- Preserved the global `system-states.css` bounded width `min(720px, calc(100% - 28px))` and compact `width: 100%` fallback unchanged.
- Confirmed `AsyncStatePanel` renders `.lx-async-state` and live route resource stacks remain below the stable `.lx-routed-app` ancestor.
- Added `.lx-routed-app .lx-async-state { width: 100%; }` inside the existing 720–1099px adaptive-navigation range as the stronger canonical routed owner.
- Added fail-closed source evidence for exact manifest membership, current import order, runtime ancestry, selector specificity, approved fallback values and authoritative browser registration.
- Extended the existing three-order Chromium cascade matrix to include `system-states.css` and explicit 1099/1100px boundary assertions.
- Through 1099px the routed Async State width equals the resource-stack width under production and adversarial stylesheet orders; from 1100px the shared bounded desktop fallback resumes.
- No `!important`, stylesheet reordering, visual snapshot/hash, performance budget, breakpoint, dependency, runtime or API change was introduced.
- The exact Async State item remains in the reviewed manifest as `requires-proof`; deterministic behavior is supplied by the stronger routed owner and companion source/browser evidence.

## Current Issue #70 acceptance evidence

- `frontend/components/production-app-entry.test.ts` fail-closes the production application-root inventory, retired-root absence and layout → routed shell → bootstrap chain.
- `frontend/app/global-style-ownership.test.ts` protects the sole document `body` and shared `button, input` font-inheritance owners.
- `frontend/e2e/route-bundle-budget.spec.ts` verifies canonical routes exclude compatibility-fallback-exclusive assets.
- `frontend/bundle-budgets.json` owns blocking JavaScript/request ceilings and immutable route baselines.
- Focused source contracts map all 21 reviewed `requires-proof` exact conflicts to stronger canonical owners and approved compatibility fallbacks.
- Chromium cascade proofs exercise production and adversarial orders across responsive boundaries for resource-stack and Async State width, Learn switch placement, adaptive Lesson Composer geometry, Phrases grid ownership and Account Security width.
- README and architecture documentation describe the actual route/runtime/global-style ownership graph.
- Authoritative Linux visual, accessibility, PWA, CSP, functional browser and performance gates are unchanged and green on product SHA `2cdb35d2c8184ea75d27fcf0e078cf400dfa2eb9`.

## In progress

- No product slice is active during this documentation reconciliation.
- The completed PR #380 task context is being reset.
- Issue #70 remains open only because semantic non-identical-selector ownership has not yet been centralized in one fail-closed audit and final acceptance reconciliation is incomplete.

## Remaining roadmap

### 1. Final Issue #70 semantic ownership and acceptance reconciliation

- Audit semantically overlapping selectors that are not textually identical.
- Create a central fail-closed mapping of all 21 reviewed `requires-proof` exact fallback items to their stronger non-identical canonical owners and focused source/browser proof families.
- Reconcile exact-selector evidence with application-entry inventory, compatibility reachability, fallback-exclusive bundle evidence, global document ownership, visual regression, performance budgets and public architecture documentation.
- Close Issue #70 only after the central acceptance contract passes full immutable-head CI, expected-head merge, exact-SHA main CI and exact-SHA stage/public validation.

## Validation pending

- Remaining exact-selector inventory requiring proof or correction: zero.
- All 21 reviewed `requires-proof` items have current focused source/browser evidence.
- Semantic non-identical-selector overlap is not yet claimed safe by one central fail-closed registry; this is the only remaining product audit.
- Guest Profile auth/recovery, Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- Dependabot and unrelated product/design work remain outside Issue #70 slices.

## Recent production evidence

1. #380 — `style(frontend): make Async State width order-independent` → `2cdb35d2c8184ea75d27fcf0e078cf400dfa2eb9`.
2. #379 — `docs(agent): reconcile PR 378 delivery` → `76f32fc40a4a07f3ecf92d86bae53c49a4509ed3`.
3. #378 — `style(frontend): make Account Security width order-independent` → `fd5c6b16eb971f60cb218cd94b7afcc485fcb5c0`.
4. #377 — `docs(agent): reconcile PR 376 delivery` → `8b6b2491a49c556d236a60018842cbf8318778ab`.
5. #376 — `style(frontend): make Phrases grid order-independent` → `aec24578f73ace80ea8ef653f7a4c1081066973e`.

## Evidence

- PR #380 immutable head `16428c2a328e005ed1524b1673fc0d1900ee4101` passed authoritative full CI #2687 / run `30897332385`.
- Frontend parser/source contracts, lint, TypeScript, unit tests, production build, dependency audit, backend unit/security/integration, both UI shards, Lesson, Dictionary, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance and both container builds succeeded.
- Expected-head squash merge produced `2cdb35d2c8184ea75d27fcf0e078cf400dfa2eb9`.
- Exact-SHA main CI run `30898051599` completed successfully with the full product matrix and image publication.
- Stage run `30898741503` deployed the exact SHA; deploy, public smoke and public browser succeeded, with 12/12 public runtime checks passing.
- PR #380 had no comments, reviews or unresolved review threads before merge.
- Indexed search remains discovery only; final claims use exact refs, files, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
