# LexiGo Project State

## Verification

- Last verified: 2026-08-03 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `535cedd42c9bc56a65e093034764cee247cf87c0`.
- Latest deployed product SHA: `535cedd42c9bc56a65e093034764cee247cf87c0`.
- Latest completed Issue #70 slice: complete fail-closed source inventory for all dedicated route islands and intentionally live compatibility/shared fallback owners.
- Completion PR: #354.
- PR #354 immutable reconstructed head: `f1a558ebe7fbbd82d464bfb98c0567dae07bd852`.
- Authoritative reconstructed-head PR CI: #2562 / run `30773562331`, complete success without retry.
- Expected-head squash merge produced product SHA `535cedd42c9bc56a65e093034764cee247cf87c0`.
- Post-merge main CI run `30773995539` repeated the complete product matrix successfully on the exact merge SHA.
- Exact-SHA stage run `30774340057` deployed web/API images tagged `535cedd42c9bc56a65e093034764cee247cf87c0`; deploy, public smoke and public browser validation succeeded.
- The public iOS stale-build scenario retried once after a transient service-worker access-control page error; the final stage job conclusion remained `success` and no product change was made.
- PR #354 comments, reviews and unresolved review threads were empty before merge.
- No pull request is open at verification time.

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

- Phrases, Progress, Dictionary, Profile, Scenario, Home and Learn ownership boundaries were established in earlier proof-first slices.
- Only presentation/runtime proven unreachable by exact guest/auth route evidence was removed.
- PR #324 bounded remaining compatibility presentation dispatch to live Library, guest Profile and Lesson behavior.
- PR #328 added production-network evidence that canonical route islands exclude fallback-exclusive JavaScript assets.

### Completed orphan CSS cleanup

- PRs #346/#348 proved and removed the orphaned `lx-resource-notice*` family while preserving live session and async-state owners.
- PRs #350/#352 proved and removed `.lx-themed-home` and `.lx-themed-library` while preserving `.lx-themed-selector`, `.lx-themed-symbol`, `.lx-themed-arrow`, collection-prefixed and accessibility owners.
- These deletion PRs were production-CSS deletion-only and passed unchanged Linux visual regression and route-performance budgets.

### Home hero-decoration proof — PR #355

- `frontend/components/home-hero-orphan-source.test.ts` recursively scans executable TypeScript/TSX under `frontend/app`, `frontend/components` and `frontend/lib`.
- Tests/specs are excluded and source comments are stripped.
- The following candidates have zero executable consumers and are confined to `frontend/app/premium-ui.css`:
  - `lx-hero-copy` — 5 selector-token occurrences;
  - `lx-glow` — 1 occurrence;
  - `lx-floating-card` — 4 occurrences;
  - `lx-book-base` — 6 occurrences;
  - `lx-orbit` — 3 occurrences.
- Total bounded candidate inventory: 19 selector-token occurrences.
- `.lx-hero-card` and `.lx-hero-art` are live canonical Home owners and are not deletion candidates.
- `lx-word-preview`, `lx-home-next-action-copy`, `lx-progress-panel`, compatibility `lx-resume-strip` and guest-auth `lx-auth-card` remain protected.
- Stylesheet order remains `premium-ui.css` → `compact-home.css` → `adaptive-knowledge-coach-home.css`.
- PR #355 changed no production CSS or runtime and passed unchanged visual/accessibility/performance gates.

### Complete fallback inventory — PR #354

- PR #354 was originally created concurrently from obsolete base `df3cd097cbd159a4d441aea4ce783043dabe36ec`.
- Its original head `9916d95b7d6584a05da91393adfaa7743d37d0f4` passed CI #2557 / run `30772233239`, but that CI was retained only as historical evidence after `main` advanced.
- After PR #355 and reconciliation PR #356 completed, PR #354 was reconstructed from exact base `3a6bf7686a2563c2828b9293b9ac381397274710`.
- Only `frontend/components/compatibility-fallback-source.test.ts` and refreshed `.agents/current/**` were reapplied.
- Final source evidence requires all nine dedicated route-island components to render before `LexigoPremiumApp`:
  - Scenario Catalog;
  - Scenario Detail;
  - Home;
  - Learn;
  - Active Lesson;
  - Dictionary/Word Detail;
  - Phrases;
  - Progress;
  - authenticated Profile.
- The contract requires all nine exact island-selection predicates.
- It preserves the exact remaining premium presentation dispatch for Library, Profile and Lesson.
- Guest Profile remains protected through the authenticated-only canonical Profile predicate.
- Unknown/product-route fallback remains protected.
- Review Outbox, email confirmation and account security/email/data panels remain protected as shared bootstrap owners outside route-island selection.
- Canonical Learn CSS consumer evidence remains protected.
- PR #354 changed no production TypeScript/TSX, CSS, API/backend, snapshot, route-budget ceiling, workflow, dependency, README or architecture path.
- Linux visual regression, accessibility and all route-performance budgets passed unchanged on the final reconstructed head and exact merge SHA.

## In progress

- No atomic production slice is active.
- No pull request is open.
- This documentation-only reconciliation records PR #354 delivery and resets the completed current-task context.

## Remaining roadmap

### 1. Delete only the proven orphaned Home hero decorations

- Start from fresh live `main`, Issue #70, open-PR, CI and stage evidence after this reconciliation merges.
- Remove only `lx-hero-copy`, `lx-glow`, `lx-floating-card`, `lx-book-base` and `lx-orbit` declarations from `premium-ui.css`.
- Preserve `.lx-hero-card`, `.lx-hero-art`, canonical Home compact/adaptive owners, `lx-word-preview`, `lx-home-next-action-copy`, `lx-progress-panel`, compatibility `lx-resume-strip`, guest-auth `lx-auth-card` and all unrelated premium declarations.
- Perform computed-cascade, specificity and import-order analysis before deletion.
- Convert `home-hero-orphan-source.test.ts` from bounded presence to physical absence while retaining executable live-owner assertions.
- Require a deletion-dominant production CSS diff, unchanged authoritative Linux visual hashes, unchanged route-performance budgets, full immutable-head CI and exact-SHA stage/public validation.

### 2. Final Issue #70 acceptance

- Complete exact consumer search for any remaining compatibility owners.
- Reconcile fallback-exclusive asset evidence with current source ownership and route budgets.
- Verify final dead-code inventory, compatibility reachability, global CSS ownership, README acceptance criteria and bundle impact before closing Issue #70.

### 3. Separate maintenance and product roadmap

- Keep dependency upgrades separate from compatibility cleanup.
- Continue #18/#201 personalization and First Use only after approved design states.
- Continue #25 pronunciation/listening after architecture and privacy contracts.
- Continue #203/#205/#133 design parity and moderated usability as separate work.

## Validation pending

- The five Home hero-decoration candidates remain physically present until a separate deletion PR.
- `.lx-hero-card`, `.lx-hero-art`, `lx-word-preview`, `lx-home-next-action-copy`, `lx-progress-panel`, `lx-resume-strip` and `lx-auth-card` remain protected live owners.
- Guest Profile authentication/recovery, Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- Final Issue #70 bundle/dead-code, compatibility reachability, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #354 — `test(frontend): complete compatibility fallback inventory` → `535cedd42c9bc56a65e093034764cee247cf87c0`.
2. #356 — `docs(agent): reconcile PR 355 Home hero CSS proof` → `3a6bf7686a2563c2828b9293b9ac381397274710`.
3. #355 — `test(frontend): prove legacy Home hero CSS orphaned` → `f279bc577704f3f68bf587f4c88b474a62929c02`.
4. #353 — `docs(agent): reconcile PR 352 themed card deletion` → `df3cd097cbd159a4d441aea4ce783043dabe36ec`.
5. #352 — `style(frontend): remove orphaned themed card selectors` → `b490e9cde0d6a994d6b4ebd3753f4a13e2d56420`.

## Evidence

- PR #354 final reconstructed head `f1a558ebe7fbbd82d464bfb98c0567dae07bd852` passed authoritative full CI #2562 / run `30773562331` without retry.
- Final PR CI passed the complete fallback source contract, frontend lint, typecheck, full unit suite, production build and dependency audit.
- Backend unit/security/integration, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds succeeded.
- PR #354 discussion contained no comments, reviews or unresolved review threads.
- Expected-head squash merge produced product SHA `535cedd42c9bc56a65e093034764cee247cf87c0`.
- Post-merge main CI run `30773995539` repeated the complete product matrix successfully on that exact merge SHA.
- Stage run `30774340057` validated the exact CI scope, deployed web/API images tagged `535cedd42c9bc56a65e093034764cee247cf87c0`, returned successful public smoke and completed public browser validation with final success.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
