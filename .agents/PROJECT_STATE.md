# LexiGo Project State

## Verification

- Last verified: 2026-08-04 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `45ba441da5f8faf1248389311461cf2adf787786`.
- Latest deployed product SHA: `45ba441da5f8faf1248389311461cf2adf787786`.
- Latest completed Issue #70 product slice: public iOS WebKit stale-build guard service-worker cancellation classification.
- Completion PR: #383.
- PR #383 immutable developer-authored head: `1bbaa4c9833d5c89b01734a1c39ce91d1518ff0c`.
- Authoritative PR CI: #2710 / run `30905026802`, complete success.
- Expected-head squash merge produced product SHA `45ba441da5f8faf1248389311461cf2adf787786`.
- Exact-SHA main CI run `30905789665` completed successfully with the full product matrix and immutable web/API image publication.
- Exact-SHA stage run `30906428881` deployed web/API images tagged `45ba441da5f8faf1248389311461cf2adf787786`; deployment, public smoke and public browser validation succeeded, including 12/12 public runtime checks.
- PR #383 had no comments, reviews or unresolved review threads before merge.
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
- Proven orphan families removed in earlier slices include `lx-resource-notice*`, `.lx-themed-home`, `.lx-themed-library`, retired Home hero-decoration families and the unreachable Phrases compatibility runtime family.
- Current source contracts protect intentionally live shared, account, lesson, guest-auth and compatibility owners.
- Canonical routes exclude fallback-exclusive JavaScript assets under cold-route browser evidence.

### Global CSS ownership

- `frontend/app/global-feature-style-overlap-source.test.ts` derives exact-selector conflicts from the actual root import graph.
- `frontend/app/global-feature-style-overlap-manifest.json` remains the reviewed fail-closed inventory: 71 items, 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- All 21 `requires-proof` items map exactly once to focused stronger-owner source and adversarial browser evidence:
  - routed resource stack: 1;
  - routed Async State: 1;
  - Learn switch placement: 8;
  - adaptive Lesson Composer: 6;
  - Phrases result grid: 4;
  - Account Security width: 1.
- Compact Home, navigation/mobile shell, routed resource stack, Async State, Learn switch, Lesson Composer, Phrases grid and Account Security ownership are source-order independent.
- Accessibility-layer overrides remain intentional and separately contract-protected.
- The exact-selector and semantic non-identical-selector ownership roadmaps are exhausted.

## Completed Issue #70 delivery

### Global-style and compatibility slices

- PR #364 established the computed-cascade baseline across responsive boundaries.
- PR #366 removed adaptive-navigation exact conflicts under the routed shell.
- PR #368 removed remaining mobile-PWA shell exact conflicts and reduced the manifest to 71 items.
- PR #370 established routed resource-stack tablet ownership.
- PR #372 established source-order-independent Learn switch placement.
- PR #374 established adaptive Lesson Composer tablet ownership.
- PR #376 established Phrases result-grid ownership without accepting a visual regression.
- PR #378 established routed Account Security desktop width ownership.
- PR #380 established routed Async State tablet width ownership.

### PR #382 — centralized semantic ownership and acceptance evidence

- Restored `frontend/components/architecture-documentation-contract.test.ts`, the executable contract named by README and `docs/architecture.md`.
- Parsed the reviewed 71-item manifest and required exact totals: 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- Mapped all 21 `requires-proof` items exactly once across six delivered stronger-owner families.
- Required each family’s production owner, focused source contract and adversarial computed-cascade browser proof.
- Required all four unique browser proof suites in both authoritative UI commands.
- Connected all seven Issue #70 acceptance criteria to executable application-entry, retired-root, global-style, route-bundle, budget, visual, performance and public-documentation evidence.
- Added read-only README/docs mounts to the isolated frontend unit workspace and fail-closed deployment-script coverage for those mounts.
- Immutable head `764c0180263c80dd633bc8d475fb16828884e939` passed CI #2702 / run `30901349450`.
- Deployment scripts check run `30901349427` passed.
- Expected-head squash merge produced `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`.
- Exact-SHA main CI run `30902346811` passed and published immutable images.
- Stage run `30903056155` deployed the exact image and passed public smoke, but public iOS WebKit validation exposed the final browser-diagnostic classification blocker.

### PR #383 — public WebKit guard recovery evidence

- Classified only the exact iOS WebKit current-build service-worker cancellation emitted during an explicitly active stale-build recovery window.
- Normalized WebKit’s split `Error.name` / `Error.message` representation before exact URL comparison.
- Kept Chromium, inactive recovery, another build, another origin and API/path diagnostics fatal.
- Added pre-merge Vitest evidence for all classifier boundaries.
- Strengthened the public recovery contract by requiring the exact current-build service-worker registration and absence of service-worker error UI.
- Preserved build marker, recovery marker, stale-cache cleanup, route/query/hash and CSP assertions.
- Did not change production service-worker/build-guard runtime, retries, timeouts, dependencies, visual baselines, budgets or deployment workflows.
- Immutable head `1bbaa4c9833d5c89b01734a1c39ce91d1518ff0c` passed CI #2710 / run `30905026802`.
- Expected-head squash merge produced `45ba441da5f8faf1248389311461cf2adf787786`.
- Exact-SHA main CI run `30905789665` passed and published immutable images.
- Stage run `30906428881` deployed the exact image; deploy, public smoke and public browser validation succeeded with 12/12 checks.

## Issue #70 acceptance status

1. Production application entry has one canonical root; retired duplicate roots and unreachable version families are absent or protected by exact compatibility reachability evidence.
2. Canonical route bundles exclude fallback-exclusive JavaScript assets.
3. Shared document-level global style ownership is centralized and executable.
4. All 71 exact-selector overlaps are reviewed; all 21 `requires-proof` entries have exact stronger-owner mappings and source/browser evidence.
5. Semantic non-identical-selector overlaps are centralized in one fail-closed registry.
6. Linux visual, accessibility, PWA, CSP, functional browser and performance gates remain green with unchanged approved baselines and budgets.
7. README and architecture documentation describe the production ownership graph and are validated inside isolated CI.

All seven acceptance criteria are complete on product SHA `45ba441da5f8faf1248389311461cf2adf787786`.

## Current state

- No Issue #70 product slice is active.
- No exact-selector or semantic ownership backlog remains.
- Product runtime and stage are validated on `45ba441da5f8faf1248389311461cf2adf787786`.
- This documentation reconciliation resets `.agents/current/**`.
- Issue #70 is closure-ready immediately after this Agent Docs PR merges; closing the GitHub issue does not require a recursive reconciliation PR.

## Remaining roadmap

- Issue #70: none after closure.
- Guest Profile auth/recovery, Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live and are not cleanup candidates without new reachability evidence.
- Dictionary product-history compatibility remains intentionally live.
- Dependabot and unrelated product/design work remain outside Issue #70.

## Recent production evidence

1. #383 — `test(frontend): classify WebKit guard SW cancellation` → `45ba441da5f8faf1248389311461cf2adf787786`.
2. #382 — `test(frontend): close Issue 70 acceptance evidence` → `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`.
3. #381 — `docs(agent): reconcile PR 380 delivery` → `ec1295c5458f280998c08aaef53a9e68d3c4fc86`.
4. #380 — `style(frontend): make Async State width order-independent` → `2cdb35d2c8184ea75d27fcf0e078cf400dfa2eb9`.
5. #379 — `docs(agent): reconcile PR 378 delivery` → `76f32fc40a4a07f3ecf92d86bae53c49a4509ed3`.

## Evidence

- PR #382 immutable head `764c0180263c80dd633bc8d475fb16828884e939`: CI `30901349450`, deployment scripts check `30901349427`, merge `35b9f8bc48e90cbb29ab65c9f2ec90c498be5767`, main CI `30902346811`, stage diagnostic run `30903056155`.
- PR #383 immutable head `1bbaa4c9833d5c89b01734a1c39ce91d1518ff0c`: CI `30905026802`, merge `45ba441da5f8faf1248389311461cf2adf787786`, main CI `30905789665`, stage `30906428881`.
- Frontend lint, TypeScript, unit/source contracts, production build, dependency audit, backend unit/security/integration, both UI shards, Lesson, Dictionary, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance and both container builds passed.
- Exact-image stage validation passed deployment, public smoke and all 12 Chromium/iOS WebKit public runtime checks.
- PR #383 had no comments, reviews or unresolved review threads before merge.
- Indexed search remains discovery only; final claims use exact refs, files, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
