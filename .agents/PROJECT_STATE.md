# LexiGo Project State

## Verification

- Last verified: 2026-08-03 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `f279bc577704f3f68bf587f4c88b474a62929c02`.
- Latest deployed product SHA: `f279bc577704f3f68bf587f4c88b474a62929c02`.
- Latest completed Issue #70 slice: checkout-level executable proof for the bounded legacy Home hero-decoration CSS family.
- Completion PR: #355.
- PR #355 immutable developer-authored head: `0ed20b621e7b3805498174c0267371cdca0b39df`.
- Authoritative PR CI: #2558 / run `30772507155`, complete success without retry.
- Expected-head squash merge produced product SHA `f279bc577704f3f68bf587f4c88b474a62929c02`.
- Post-merge main CI run `30772832623` repeated the complete product matrix successfully on the exact merge SHA.
- Exact-SHA stage run `30773148243` deployed web/API images tagged `f279bc577704f3f68bf587f4c88b474a62929c02`; deploy, public smoke and all 12 public browser checks succeeded.
- PR #355 comments, reviews and unresolved review threads were empty before merge.
- Draft PR #354 is open from older base `df3cd097cbd159a4d441aea4ce783043dabe36ec`. It must remain Draft and be rebased onto the live post-reconciliation `main` before any further validation or merge.

## Completed foundations

### Platform and delivery

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint/type/unit/build/browser, accessibility, visual, performance and container gates.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.
- Product delivery requires immutable-head PR CI, expected-head squash merge, exact-SHA main CI and exact-SHA stage/public validation.

### Route and runtime ownership

- Home, Learn, Active Lesson, Phrases, Dictionary, Word Detail, Progress, Profile, Scenario Catalog and Scenario Detail use dedicated route-island owners.
- `LexigoBootstrappedApp` remains the session restoration, refresh coordination, account runtime and route-entry owner.
- `ReviewOutboxRuntime` remains the durable review-queue owner.
- Authenticated `/profile` is selected by canonical `LexigoProfileApp`; guest authentication and recovery remain intentionally compatibility-owned by `LexigoPremiumApp.renderProfile()`.
- `renderLibrary()` remains live for product-owned Dictionary History entries.
- `renderLesson()` and unknown/product-route fallback remain live.
- Broad deletion of `LexigoPremiumApp` is prohibited without exact two-sided reachability evidence.

## Issue #70 compatibility and CSS evidence

### Completed route cleanup

- Phrases, Progress, Dictionary, Profile, Scenario, Home and Learn ownership boundaries were established in earlier proof-first slices.
- Only presentation/runtime proven unreachable by exact guest/auth route evidence was removed.
- PR #324 bounded remaining compatibility presentation dispatch to live Library, guest Profile and Lesson behavior.
- PR #328 added production-network evidence that canonical route islands exclude fallback-exclusive JavaScript assets.

### Completed orphan CSS cleanup

- PRs #346/#348 proved and removed the orphaned `lx-resource-notice*` family while preserving live session and async-state owners.
- PRs #350/#352 proved and removed `.lx-themed-home` and `.lx-themed-library` while preserving `.lx-themed-selector`, `.lx-themed-symbol`, `.lx-themed-arrow`, collection-prefixed and accessibility owners.
- These deletion PRs were production-CSS deletion-only and passed unchanged Linux visual regression and route-performance budgets.

### Home hero-decoration proof — PR #355

- Added `frontend/components/home-hero-orphan-source.test.ts` as actual-checkout evidence.
- The contract recursively scans executable TypeScript/TSX under `frontend/app`, `frontend/components` and `frontend/lib`.
- Test/spec files are excluded and source comments are stripped before consumer analysis.
- The following candidates have zero executable TypeScript/TSX consumers and are confined to `frontend/app/premium-ui.css`:
  - `lx-hero-copy` — 5 selector-token occurrences;
  - `lx-glow` — 1 occurrence;
  - `lx-floating-card` — 4 occurrences;
  - `lx-book-base` — 6 occurrences;
  - `lx-orbit` — 3 occurrences.
- Total bounded candidate inventory: 19 selector-token occurrences.
- `.lx-hero-card` and `.lx-hero-art` were explicitly rejected as deletion candidates because canonical `LexigoHomeApp` executes both.
- The contract positively protects canonical `lx-word-preview`, `lx-home-next-action-copy` and `lx-progress-panel` owners.
- Live compatibility `lx-resume-strip` and guest authentication/recovery `lx-auth-card` owners remain protected.
- Existing stylesheet order remains `premium-ui.css` → `compact-home.css` → `adaptive-knowledge-coach-home.css`.
- PR #355 changed no production CSS, runtime, snapshot, route-budget ceiling, dependency, workflow, backend/API, README or architecture file.
- Linux visual regression, accessibility and all route-performance budgets passed unchanged on both the final PR head and exact merge SHA.

## In progress

### Draft PR #354 — compatibility fallback inventory

- PR #354 is a proof-only slice that expands `compatibility-fallback-source.test.ts` to cover all nine dedicated route-island owners and predicates.
- Its intended product path is `frontend/components/compatibility-fallback-source.test.ts`; the remaining paths are `.agents/current/**`.
- It protects exact live premium dispatch for Library, Profile and Lesson, guest Profile through the authenticated-only Profile predicate, and shared Review Outbox/account/session owners.
- It was created concurrently from base `df3cd097cbd159a4d441aea4ce783043dabe36ec` before PR #355 merged.
- Current state: Draft and non-mergeable against live `main` because `.agents/current/**` diverged.
- Required next action after this docs-only reconciliation merges: reconstruct/rebase #354 onto the exact new `main`, preserve only its bounded source-contract change, refresh `.agents/current/**`, then rerun complete immutable-head CI.
- Do not merge, close or broaden #354 based only on its pre-rebase evidence.

## Remaining roadmap

### 1. Finish PR #354 safely

- Re-read its source contract against the exact live bootstrap implementation.
- Rebase/reconstruct from the post-reconciliation `main` without carrying stale task records.
- Keep the final diff limited to `compatibility-fallback-source.test.ts` and `.agents/current/**`.
- Require full CI, clean review surface, expected-head squash merge and exact-SHA stage/public validation.

### 2. Delete only the proven orphaned Home hero decorations

- Start only after PR #354 and its reconciliation are complete.
- Remove only `lx-hero-copy`, `lx-glow`, `lx-floating-card`, `lx-book-base` and `lx-orbit` declarations from `premium-ui.css`.
- Preserve `.lx-hero-card`, `.lx-hero-art`, canonical Home compact/adaptive owners, `lx-resume-strip`, `lx-auth-card` and all unrelated premium declarations.
- Perform computed-cascade, specificity and import-order analysis before deletion.
- Convert the source contract from bounded presence to physical absence.
- Require a deletion-dominant CSS diff, unchanged authoritative Linux visual hashes and unchanged route-performance budgets.

### 3. Final Issue #70 acceptance

- Complete exact consumer search for remaining compatibility owners.
- Reconcile fallback-exclusive asset evidence with current source ownership and route budgets.
- Verify final dead-code inventory, compatibility reachability, global CSS ownership, README acceptance criteria and bundle impact before closing Issue #70.

### 4. Separate maintenance and product roadmap

- Keep dependency upgrades separate from compatibility cleanup.
- Continue #18/#201 personalization and First Use only after approved design states.
- Continue #25 pronunciation/listening after architecture and privacy contracts.
- Continue #203/#205/#133 design parity and moderated usability as separate work.

## Validation pending

- Draft PR #354 must be rebased and revalidated before merge.
- The five Home hero-decoration candidates remain physically present until a separate deletion PR.
- `.lx-hero-card`, `.lx-hero-art`, `lx-word-preview`, `lx-home-next-action-copy`, `lx-progress-panel`, `lx-resume-strip` and `lx-auth-card` remain protected live owners.
- Guest Profile authentication/recovery, Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- Final Issue #70 bundle/dead-code, compatibility reachability, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #355 — `test(frontend): prove legacy Home hero CSS orphaned` → `f279bc577704f3f68bf587f4c88b474a62929c02`.
2. #353 — `docs(agent): reconcile PR 352 themed card deletion` → `df3cd097cbd159a4d441aea4ce783043dabe36ec`.
3. #352 — `style(frontend): remove orphaned themed card selectors` → `b490e9cde0d6a994d6b4ebd3753f4a13e2d56420`.
4. #351 — `docs(agent): reconcile PR 350 themed card proof` → `6e5f66953f1e0dbda7e48b5f98d9bd97e6731ebd`.
5. #350 — `test(frontend): prove legacy themed cards orphaned` → `de1e56fc558e7a7d3fdca155902718034b9f22d2`.

## Evidence

- PR #355 final developer-authored head `0ed20b621e7b3805498174c0267371cdca0b39df` passed authoritative full CI #2558 / run `30772507155` without retry.
- Final PR CI passed the new actual-checkout source contract, frontend lint, typecheck, complete unit suite, production build and dependency audit.
- Backend unit/security/integration, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds succeeded.
- PR #355 discussion contained no comments, reviews or unresolved review threads.
- Expected-head squash merge produced product SHA `f279bc577704f3f68bf587f4c88b474a62929c02`.
- Post-merge main CI run `30772832623` repeated the complete product matrix successfully on that exact merge SHA.
- Stage run `30773148243` validated the exact CI scope, deployed web/API images tagged `f279bc577704f3f68bf587f4c88b474a62929c02`, returned successful public smoke and completed all 12 public browser validations.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
