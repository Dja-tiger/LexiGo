# LexiGo Project State

## Verification

- Last verified: 2026-08-04 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`.
- Latest deployed product SHA: `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`.
- Latest completed product slice: Issue #75 authenticated Phrases example-search parity and acceptance evidence.
- Completion PR: #385.
- PR #385 immutable developer-authored head: `3a62b7ecdfc3daddb5e6f4281a6e31d3aefa5d19`.
- Authoritative PR CI: #2714 / run `30915700625`, complete success.
- Expected-head squash merge produced product SHA `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`.
- Exact-SHA main CI run `30916501288` completed successfully with the full product matrix and immutable web/API image publication.
- Exact-image stage run `30917349721` deployed web/API images tagged `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`; deployment, public smoke and public browser validation succeeded, including 12/12 public runtime checks.
- PR #385 had no comments, reviews or unresolved review threads before merge.
- No intersecting product PR remains open. Dependabot PRs #304–#306 remain unrelated maintenance work.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.
- One PR contains one atomic slice. Product work does not continue through stale Agent Harness state.

## Production ownership foundations

### Route and runtime ownership

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile, Scenario Catalog and Scenario Detail use dedicated canonical route-island owners.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `ReviewOutboxRuntime` owns the durable review queue.
- `LexigoPremiumApp` remains a narrow compatibility fallback for guest authentication/recovery, live Library history, Lesson and unknown/product-route fallback states.
- Broad compatibility deletion remains prohibited without exact reachability, fallback-exclusive bundle and browser evidence.

### Issue #70 architecture and global-style ownership

- Issue #70 is completed and closed.
- The production application entry, retired-root absence, compatibility reachability, fallback-exclusive route bundles, shared document-level style ownership and public architecture documentation are fail-closed.
- The reviewed exact-selector inventory remains 71 items: 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- All 21 `requires-proof` items map exactly once to stronger canonical owners and focused source/browser evidence.
- Exact-selector and semantic non-identical-selector ownership roadmaps are exhausted.
- Product SHA `45ba441da5f8faf1248389311461cf2adf787786` completed the Issue #70 runtime work; subsequent product SHA `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c` preserves those contracts.

## Completed Issue #75 delivery

### Existing Phrases product ownership

- `frontend/components/lexigo-phrases-app.tsx` owns guest/authenticated resource requests, URL-backed filters, History synchronization and scroll restoration.
- `frontend/components/phrases-catalog.tsx` owns accessible search, topic controls, result count, clear/reset, empty state and React/data-layer sorting.
- Existing route and UI browser contracts already covered detail Back restoration and the single React sorting toolbar.

### PR #385 — authenticated example-search parity and complete acceptance evidence

- Extended authenticated PostgreSQL catalog search to JSONB phrase examples while preserving existing user, kind, source, topic, status, pagination and case-insensitive search bounds.
- Preserved existing lemma, translation, topic and alias search behavior.
- Added real PostgreSQL integration evidence for English lemma, Russian translation, alias and example queries.
- Added a request-scoped browser fixture that applies exact query, topic, sort and page semantics rather than returning endpoint-wide static data.
- Added a focused desktop Chromium and iOS WebKit journey covering Russian search, English example search, query-plus-topic combination, selected chip/radio state, URL Back/Forward, result count, reset, truthful empty state, detail return and scroll restoration.
- Added `frontend/components/phrases-search-acceptance-source.test.ts` as the fail-closed registry for all seven Issue #75 acceptance owners.
- Registered `frontend/e2e/phrases-search-acceptance.spec.ts` exactly once in authoritative `test:e2e:ui`.
- Did not change Phrases presentation, CSS, API schema, migrations, visual baselines, route budgets, dependencies, lockfiles or deployment workflows.

## Issue #75 acceptance status

1. English and Russian phrase search are covered across authenticated PostgreSQL and browser evidence.
2. Topic controls remain keyboard/screen-reader accessible and expose selected state through the visible chip and semantic radio owner.
3. Query and topic combine with logical AND in requests and filtered results.
4. Filter state is URL-owned and restores through Back/Forward.
5. Result count, clear/reset actions and truthful empty state are covered.
6. Detail open and Back restore filters and scroll position.
7. Sorting remains React/data-layer owned with no DOM-injected toolbar.

All seven Issue #75 acceptance criteria are complete on product SHA `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`.

## Current state

- No Issue #75 product slice remains active.
- Product runtime and stage are validated on `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`.
- This documentation reconciliation resets `.agents/current/**`.
- Issue #75 is closure-ready immediately after this Agent Docs PR merges; closing the GitHub issue does not require a recursive reconciliation PR.

## Remaining roadmap

- Issue #75: none after closure.
- Issue #78 CSP implementation and stage evidence are complete, but its final acceptance gate remains an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices.
- Dependabot PRs #304–#306 remain outside product slices.

## Recent production evidence

1. #385 — `fix(phrases): align authenticated example search` → `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`.
2. #384 — `docs(agent): close Issue 70 delivery state` → `1a2eec84d5886b6e9ab15755feacbcb639440c4e`.
3. #383 — `test(frontend): classify WebKit guard SW cancellation` → `45ba441da5f8faf1248389311461cf2adf787786`.
4. #382 — `test(frontend): close Issue 70 acceptance evidence` → `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`.

## Evidence

- PR #385 immutable head `3a62b7ecdfc3daddb5e6f4281a6e31d3aefa5d19` passed authoritative full CI #2714 / run `30915700625`.
- Frontend lint, TypeScript, unit/source contracts, production build, dependency audit, real PostgreSQL integration, backend unit/security, both UI shards, focused Chromium/iOS Phrases acceptance, Lesson, Dictionary, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance and both container builds succeeded.
- Expected-head squash merge produced `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`.
- Exact-SHA main CI run `30916501288` completed successfully and published immutable images.
- Stage run `30917349721` deployed the exact image; deploy, public smoke and all 12 Chromium/iOS WebKit public runtime checks passed.
- PR #385 had no comments, reviews or unresolved review threads before merge.
- Indexed search remains discovery only; final claims use exact refs, files, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
