# LexiGo Project State

## Verification

- Last verified: 2026-08-03 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `37f3e0d36fa6a34a63c3ef5c51459ec0af98cbcd`.
- Latest deployed product SHA: `37f3e0d36fa6a34a63c3ef5c51459ec0af98cbcd`.
- Latest completed Issue #70 slice: compact Home CSS source-order independence with route-scoped specificity and an adversarial global import order.
- Completion PR: #360.
- PR #360 immutable developer-authored head: `ea54b29b31030556858558145c611e8e7354fda4`.
- Authoritative PR CI: #2576 / run `30805447497`, complete success without retry.
- Expected-head squash merge produced product SHA `37f3e0d36fa6a34a63c3ef5c51459ec0af98cbcd`.
- Post-merge main CI run `30806079581` repeated the complete product matrix successfully on the exact merge SHA.
- Exact-SHA stage run `30806743687` deployed web/API images tagged `37f3e0d36fa6a34a63c3ef5c51459ec0af98cbcd`; deploy, public smoke and all 12 public browser checks succeeded without retry.
- PR #360 comments, reviews and unresolved review threads were empty before merge.
- No pull request was open when this documentation branch was created.

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

- Final acceptance auditing confirmed that shared and compact Home selectors had equal specificity before PR #360.
- In the 720–760 px range, shared `.lx-home-next-action .lx-hero-card` declared `min-height: 360px` and compact `.lx-home-next-action .lx-hero-card` declared `min-height: 0`; both had specificity `(0, 2, 0)`.
- The intended compact value therefore depended on `compact-home.css` being imported after `information-architecture.css`.
- PR #360 scoped every selector entry in `frontend/app/compact-home.css` below `.lx-routed-app`.
- Exactly 26 compact selector entries are route-scoped.
- No declaration value or responsive boundary changed; the existing `760px` and `390px` media boundaries remain.
- `frontend/app/layout.tsx` now intentionally imports `compact-home.css` before `information-architecture.css` as an adversarial source-order proof.
- The relevant global order is now `premium-ui.css` → `compact-home.css` → `information-architecture.css` → `adaptive-knowledge-coach-home.css`.
- `frontend/components/home-css-order-independence.test.ts` verifies canonical routed-shell ancestry, exact stylesheet imports, selector scoping, media boundaries, absence of `!important`, and computed specificity precedence.
- Shared hero specificity remains `(0, 2, 0)`; compact is `(0, 3, 0)`; adaptive is `(0, 4, 0)`.
- Compact therefore outranks shared independently of source order, while adaptive retains precedence at narrower breakpoints.
- No production component/runtime markup, API/backend/database, session, route, Figma, snapshot, budget ceiling, workflow, dependency, README or architecture path changed.
- Both immutable-head CI and exact-SHA main CI passed unchanged Linux visual regression, accessibility and all route-performance budgets.
- Stage deployed the exact merge SHA and all 12 public desktop/iOS browser checks passed.

## Current Issue #70 acceptance evidence

- `frontend/components/production-app-entry.test.ts` fail-closes the exact production application-root inventory, retired-root absence, canonical layout → routed shell → bootstrap chain and bootstrap-only route-entry imports.
- `frontend/app/global-style-ownership.test.ts` requires `globals.css` to be the sole owner of document `body` and shared `button, input` font inheritance.
- `frontend/e2e/route-bundle-budget.spec.ts` measures all canonical cold routes, derives JavaScript assets exclusive to the live compatibility fallback and requires every canonical route to exclude them.
- `frontend/bundle-budgets.json` owns blocking JavaScript/request ceilings and immutable route baselines.
- README documents the actual production chain, route/runtime ownership and global CSS boundary.
- Phrases and compact Home now have explicit adversarial source-order contracts.

## In progress

- No atomic production slice is active.
- This documentation-only reconciliation records PR #360 delivery and resets the completed task context.
- Issue #70 remains open until the remaining global feature-style source-order audit and final acceptance reconciliation are complete.

## Remaining roadmap

### 1. Continue the final Issue #70 acceptance audit

- Re-read live `main`, Issue #70, open PRs, CI and stage after this reconciliation merges.
- Complete an exact repository-wide inventory of remaining global feature stylesheet overlaps and equal-specificity declaration conflicts.
- Distinguish intentional base/feature layering from accidental source-order dependence using selector, specificity, media-condition and computed-value evidence.
- Add proof contracts before any production CSS modification.
- Preserve current route budgets and visual baselines; do not use snapshot or budget changes to hide cascade regressions.
- Reconcile the final global CSS evidence with app-entry, compatibility reachability, fallback-exclusive asset and README ownership evidence.
- Close Issue #70 only when every acceptance criterion has current fail-closed evidence.
- Any newly proven production change must be a separate bounded slice; do not combine multiple feature owners in one speculative cleanup PR.

### 2. Separate maintenance and product roadmap

- Keep dependency upgrades separate from compatibility cleanup.
- Continue #18/#201 personalization and First Use only after approved design states.
- Continue #25 pronunciation/listening after architecture and privacy contracts.
- Continue #203/#205/#133 design parity and moderated usability as separate work.

## Validation pending

- The remaining global feature-style source-order inventory is not yet complete.
- Guest Profile authentication/recovery, Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- `.lx-hero-card`, `.lx-hero-art`, `.lx-hero-actions`, `lx-word-preview`, `lx-home-next-action-copy`, `lx-progress-panel`, `lx-resume-strip` and `lx-auth-card` remain protected live owners.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #360 — `style(frontend): make compact Home CSS order-independent` → `37f3e0d36fa6a34a63c3ef5c51459ec0af98cbcd`.
2. #359 — `docs(agent): reconcile PR 358 Home hero deletion` → `17c801ae3d9a18a1623d723c39a4b81fae3147ef`.
3. #358 — `style(frontend): remove orphaned Home hero decorations` → `7ef023da70819a5afabfeccbff4d6c34768449f2`.
4. #357 — `docs(agent): reconcile PR 354 fallback inventory` → `16b6c6967e8295767be9877a8e1b4b9d28311290`.
5. #354 — `test(frontend): complete compatibility fallback inventory` → `535cedd42c9bc56a65e093034764cee247cf87c0`.

## Evidence

- PR #360 final developer-authored head `ea54b29b31030556858558145c611e8e7354fda4` passed authoritative full CI #2576 / run `30805447497` without retry.
- Final PR CI passed the new specificity source contract, frontend lint, typecheck, full unit suite, production build and dependency audit.
- Backend unit/security/integration, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds succeeded.
- PR #360 discussion contained no comments, reviews or unresolved review threads.
- Expected-head squash merge produced product SHA `37f3e0d36fa6a34a63c3ef5c51459ec0af98cbcd`.
- Post-merge main CI run `30806079581` repeated the complete product matrix successfully on that exact merge SHA and published web/API images.
- Stage run `30806743687` deployed web/API images tagged `37f3e0d36fa6a34a63c3ef5c51459ec0af98cbcd`, returned successful public smoke and completed all 12 public browser checks without retry.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
