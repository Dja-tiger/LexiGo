# LexiGo Project State

## Verification

- Last verified: 2026-08-04 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
- Latest deployed product SHA: `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
- Latest completed product slice: Issue #74 live connectivity action touch-target contract.
- Completion PR: #387.
- PR #387 immutable developer-authored head: `fd0b7ca6c860d0855ee225cf66eb1bc69405e40c`.
- Authoritative PR CI: #2740 / run `30926104141`, complete success.
- Expected-head squash merge produced product SHA `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
- Exact-SHA main CI run `30927084922` completed successfully with the full product matrix and immutable web/API image publication.
- Exact-image stage run `30928015471` deployed web/API images tagged `9ee68f15d623bc7d0e001967b94eff3946b246b3`; deployment, public smoke and public browser validation succeeded, including 12/12 public runtime checks.
- PR #387 had no comments, reviews or unresolved review threads before merge.
- No product or documentation PR remains open at reconciliation start.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.
- One PR contains one atomic slice. Product work does not continue through stale Agent Harness state.

## Production ownership foundations

### Route and runtime ownership

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile, Scenario Catalog and Scenario Detail use dedicated canonical route-island owners.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `ReviewOutboxRuntime` owns the durable review queue and its global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback for guest authentication/recovery, live Library history, Lesson and unknown/product-route fallback states.
- Broad compatibility deletion remains prohibited without exact reachability, fallback-exclusive bundle and browser evidence.

### Issue #70 architecture and global-style ownership

- Issue #70 is completed and closed.
- The production application entry, retired-root absence, compatibility reachability, fallback-exclusive route bundles, shared document-level style ownership and public architecture documentation are fail-closed.
- The reviewed exact-selector inventory remains 71 items: 50 `intentional`, 21 `requires-proof`, 0 `protected`.
- All 21 `requires-proof` items map exactly once to stronger canonical owners and focused source/browser evidence.
- Exact-selector and semantic non-identical-selector ownership roadmaps are exhausted.
- Product SHA `45ba441da5f8faf1248389311461cf2adf787786` completed the Issue #70 runtime work; subsequent product SHA `9ee68f15d623bc7d0e001967b94eff3946b246b3` preserves those contracts.

### Issue #75 Phrases search ownership

- Issue #75 is completed and closed.
- Authenticated PostgreSQL phrase search covers lemma, translation, topic, aliases and JSONB examples while preserving user, kind, source, status, pagination and case-insensitive bounds.
- Phrases URL/filter/history/scroll ownership and all seven acceptance criteria remain fail-closed through PostgreSQL integration, source contracts and focused Chromium/WebKit browser evidence.
- Product SHA `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c` completed Issue #75; current product SHA preserves those contracts.

## Completed Issue #74 slice

### Live owner correction

- The initial branch implementation targeted a legacy Dictionary bell that exists in dormant JSX but is intentionally hidden by `calendar-reminder-entry.css`.
- Superseded CI #2728 / run `30922599313` failed consistently in desktop Chromium, iOS WebKit and Android Chromium because the hidden control was absent from the live accessibility tree.
- Playwright report artifacts `8897981374` and `8897961032` proved the application and Dictionary route were healthy; the failure was classified as stale test plus invalid runtime-owner selection, not a browser flake.
- The corrected slice follows the Issue #74 warning not to bind mobile tests to hidden desktop or legacy controls.

### PR #387 — connectivity action touch targets

- Selected the live `ReviewOutboxRuntime` connectivity actions, beginning with `Подробнее`, which Issue #74 explicitly names as lacking a guaranteed hit area.
- Added `frontend/app/connectivity-touch-targets.css` after canonical `system-states.css`.
- Preserved the existing painted 40px default and 36px Active Lesson button boxes.
- Added a paint-inert block-axis hit surface of 44 CSS px for fine pointers and 48 CSS px for coarse pointers.
- Kept inline hit expansion at zero, preventing horizontal overlap between adjacent actions.
- Added no transform, background, border, shadow, visual baseline or runtime semantic change.
- Preserved `accessibility-focus.css` as the single global keyboard-focus visual owner.
- Added a fail-closed source contract mapping live runtime labels, canonical visible geometry, import order, focus ownership, hidden legacy exclusion and authoritative browser registration.
- Added desktop Chromium, iOS WebKit and Android Chromium proof for exact `Подробнее` role/name lookup, effective target height, top/bottom perimeter hit-testing, keyboard focus and compact-width overflow.
- Visual regression remained byte-stable without baseline updates.

## Issue #74 acceptance status

Completed by PR #387:

- The live global connectivity text actions now expose a 44px fine-pointer / 48px coarse-pointer effective target without changing presentation.
- Expanded hit regions do not overlap horizontally.
- `Подробнее` has a full keyboard-focus and touch rectangle in the tested desktop/mobile browser matrix.
- The hidden legacy Dictionary bell is explicitly excluded from ownership and future source/browser contracts.

Still open:

- Audit and remediate remaining live controls named by Issue #74, including `Все режимы`, preview actions and any remaining exposed header/icon controls.
- Prove all primary, secondary and icon controls meet the minimum target contract across affected routes.
- Verify mobile navigation labels and target spacing under default and enlarged text.
- Verify 200% browser zoom and system text enlargement without clipping, overlap or inaccessible actions.
- Complete manual physical-device acceptance before Issue #74 can close.

Issue #74 remains open. PR #387 is one completed atomic production slice, not full Issue closure.

## Current state

- No product slice is active.
- Product runtime and stage are validated on `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
- This documentation reconciliation resets `.agents/current/**`.
- The next Issue #74 slice must begin from live GitHub state and select only a confirmed exposed control after computed-style and accessibility-tree verification.

## Remaining roadmap

- Issue #74: continue with separate atomic slices for remaining live touch targets, enlarged-text/zoom evidence and final physical-device acceptance.
- Issue #78 CSP implementation and stage evidence are complete, but its final acceptance gate remains an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices.

## Recent production evidence

1. #387 — `fix(frontend): expand connectivity action touch targets` → `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
2. #386 — `docs(agent): reconcile Issue 75 delivery` → `c56485511c752aacd3e2f43cd0d102f229a9c25f`.
3. #385 — `fix(phrases): align authenticated example search` → `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`.
4. #384 — `docs(agent): close Issue 70 delivery state` → `1a2eec84d5886b6e9ab15755feacbcb639440c4e`.

## Evidence

- PR #387 immutable head `fd0b7ca6c860d0855ee225cf66eb1bc69405e40c` passed authoritative full CI #2740 / run `30926104141`.
- Frontend lint, TypeScript, unit/source contracts, production build, dependency audit, both UI shards, focused Chromium/iOS WebKit/Android connectivity target proof, Lesson, Dictionary, iOS PWA, controlled service worker, CSP, visual regression, accessibility, performance, backend unit/security/integration and both container builds succeeded.
- Expected-head squash merge produced `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
- Exact-SHA main CI run `30927084922` completed successfully with the same full product gates and immutable image publication.
- Stage run `30928015471` deployed the exact image; deploy, public smoke and all 12 Chromium/iOS WebKit public runtime checks passed.
- PR #387 had no comments, reviews or unresolved review threads before merge.
- Local clone execution was unavailable because the isolated execution container could not resolve `github.com`; no local result was counted as validation evidence.
- Indexed search remains discovery only; final claims use exact refs, files, Issues, PRs, workflow jobs, artifacts and deployment records.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
