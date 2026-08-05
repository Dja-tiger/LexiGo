# LexiGo Project State

## Verification

- Last verified: 2026-08-05 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.
- Latest deployed product SHA: `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.
- Latest completed product slice: Issue #74 live mobile Lesson Composer option-radio touch-target contract.
- Completion PR: #393.
- PR #393 immutable developer-authored head: `662976c583bae7f7a270d2842bc2f31e748d9a9c`.
- Authoritative PR CI: #2782 / run `30958611950`, complete success.
- Expected-head squash merge produced product SHA `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.
- Exact-SHA main CI #2783 / run `30959228573` completed successfully with the full product matrix and immutable web/API image publication.
- Exact-image Deploy Stage #2621 / run `30959742951` validated the exact CI scope, deployed SHA `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`, and passed deployment, public endpoint smoke and public browser UI validation.
- PR #393 had no comments, reviews or unresolved review threads before merge.
- No intersecting product or documentation PR remains open; Dependabot PRs #304–#306 remain unrelated maintenance work.

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

### Completed architecture and search ownership

- Issue #70 is completed and closed; application entry, compatibility reachability, shared style ownership and architecture contracts remain fail-closed.
- Issue #75 is completed and closed; authenticated PostgreSQL phrase search and URL/filter/history/scroll ownership remain fail-closed.
- Product SHA `45ba441da5f8faf1248389311461cf2adf787786` completed Issue #70 and product SHA `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c` completed Issue #75; current product SHA preserves both deliveries.

## Completed Issue #74 slices

### PR #387 — connectivity action touch targets

- The live `ReviewOutboxRuntime` connectivity actions expose a 44px fine-pointer / 48px coarse-pointer effective target without changing the painted 40px default or 36px Active Lesson boxes.
- Inline expansion remains zero, preventing horizontal overlap between adjacent actions.
- Desktop Chromium, iOS WebKit and Android Chromium prove the live `Подробнее` role/name, target height, perimeter hits, keyboard focus and compact overflow.
- The intentionally hidden legacy Dictionary bell is excluded from ownership.
- Product SHA: `9ee68f15d623bc7d0e001967b94eff3946b246b3`.

### PR #389 — header profile touch target

- The live `button.lx-avatar[aria-label="Открыть профиль"]` exposes a 44×44 fine-pointer and 48×48 coarse-pointer effective target.
- Existing 44×44 desktop and 42×42 compact painted avatar geometry remains unchanged.
- The exact button-and-accessible-name selector excludes the decorative Profile-page `span.lx-avatar[aria-hidden="true"]`.
- Inline expansion remains symmetric; block-axis expansion is directed downward because compact headers place the avatar at the viewport top boundary.
- Desktop Chromium, Android Chromium and iOS WebKit prove target geometry, all four perimeter hits, reminder separation, focus-visible and compact overflow.
- Visual regression passed without baseline updates.
- Product SHA: `29151758bae0b4220ee48213d0fc49a2290ba20a`.

### PR #391 — mobile Lesson Composer disclosure touch targets

- The live `/learn` collapsed disclosure `Настроить урок` and expanded summary `Ручная настройка` expose a 44px fine-pointer / 48px coarse-pointer effective target.
- `adaptive-lesson-composer.css` remains the approved painted presentation owner; the dedicated interaction owner expands only the transparent event surface.
- Figma evidence remains unchanged: collapsed node `202:81` is 318×42 and expanded node `203:57` is 358×58.
- Component state, accessible names, `aria-expanded`, `aria-controls`, lesson lifecycle, URL/history and visual baselines remain unchanged.
- Desktop Chromium, Android Chromium and iOS WebKit prove fine/coarse target size, perimeter hits, adjacent-control separation, focus-visible, disclosure toggling and compact reflow.
- Product SHA: `0535f6641b6624b5f07266137942c3c5ae73c167`.

### PR #393 — mobile Lesson Composer option touch targets

- Every visible radio in the expanded mobile `/learn` groups `Режим обучения`, `Раздел обучения` and `Размер урока` exposes a minimum 44px fine-pointer and 48px coarse-pointer effective target.
- Direct source options and reusable collection-card radios are included in the same exact ownership contract.
- `adaptive-lesson-composer.css` remains the approved presentation owner; `lesson-composer-option-touch-targets.css` owns only transparent block-axis hit-surface expansion and touch-action semantics.
- Existing painted dimensions, grid, typography and 6px visual spacing remain unchanged; inline hit-surface expansion is zero and target rectangles do not overlap.
- Role/name ownership, `aria-checked`, roving tabindex, keyboard direction, callbacks, preview state, session state and lesson lifecycle remain unchanged.
- A source contract protects exact option maps, reusable collection ownership, import order, interaction-only declarations and blocking UI/accessibility registration.
- Desktop Chromium, Android Chromium and iOS WebKit prove every live radio through the accessibility tree, native-plus-pseudo geometry, all four perimeter hits, pairwise non-overlap, selected focus, alternate selection and compact reflow.
- Visual baselines were not changed.
- Product SHA: `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.

## Issue #74 acceptance status

Completed:

- Global connectivity text actions have guaranteed 44/48px effective targets.
- The shared live header profile button has a guaranteed 44/48px square target across desktop Chromium, Android Chromium and iOS WebKit.
- The two live mobile Lesson Composer disclosure states have guaranteed 44/48px effective targets across the same browser matrix.
- All currently rendered mobile Lesson Composer mode, source and size radio options have guaranteed 44/48px effective targets, non-overlapping hit regions and preserved radio semantics.
- Expanded targets preserve presentation, keyboard focus, accessible names, runtime callbacks and adjacent-control separation.
- Hidden/decorative consumers and stale issue wording are explicitly excluded from ownership; no live `Все режимы` control exists in the current `/learn` runtime.

Still open:

- Audit and remediate the remaining live preview, recommended/manual start, sticky-action, header/icon and route-specific controls that are not covered by PRs #387, #389, #391 and #393.
- Prove all remaining primary, secondary and icon controls meet minimum target and spacing contracts across affected routes.
- Verify mobile navigation labels and target spacing under default and enlarged text.
- Verify 200% browser zoom and system text enlargement without clipping, overlap or inaccessible actions.
- Complete manual physical-device acceptance before Issue #74 can close.

Issue #74 remains open. PRs #387, #389, #391 and #393 are completed atomic production slices, not full Issue closure.

## Current state

- No product slice is active.
- Product runtime and stage are validated on `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.
- This documentation reconciliation resets `.agents/current/**` to canonical templates.
- The next Issue #74 slice must begin from live GitHub state and select only a confirmed exposed control after runtime-visibility, accessibility-tree and computed-style verification.

## Remaining roadmap

- Issue #74: continue with separate atomic slices for remaining live touch targets, mobile-label/enlarged-text evidence, 200% zoom and final physical-device acceptance.
- Issue #78 CSP implementation and stage evidence are complete, but its final acceptance gate remains an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices.

## Recent production evidence

1. #393 — `fix(a11y): guarantee Learn option touch targets` → `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.
2. #392 — `docs(agent): reconcile Issue 74 Learn disclosure slice` → `b42f540f240883cfd4b23ce6e248512ac1f21316`.
3. #391 — `fix(a11y): guarantee Learn disclosure touch targets` → `0535f6641b6624b5f07266137942c3c5ae73c167`.
4. #390 — `docs(agent): reconcile Issue 74 profile target slice` → `6a8c885a6a7950c25cada8374b2d71dcf253b34e`.
5. #389 — `fix(frontend): expand header profile touch target` → `29151758bae0b4220ee48213d0fc49a2290ba20a`.

## Evidence

- PR #393 immutable head `662976c583bae7f7a270d2842bc2f31e748d9a9c` passed authoritative full CI #2782 / run `30958611950`.
- Frontend lint, TypeScript, unit/source contracts, production build, dependency audit, both UI shards, focused desktop/iOS/Android option-target proof, Lesson, Dictionary, iOS PWA, controlled service worker, CSP, visual regression, accessibility, performance, backend unit/security/integration and both container builds succeeded.
- Two superseded CI runs exposed slice-local source-contract defects rather than production defects: whole-file role totals included unrelated radio owners, and a raw `width:` substring matched `max-width`. The final contract uses exact render-map/component evidence and declaration-level CSS checks; production CSS and runtime components were unchanged by those corrections.
- Expected-head squash merge produced `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.
- Exact-SHA main CI #2783 / run `30959228573` completed successfully with the full product gates and immutable web/API image publication.
- Deploy Stage #2621 / run `30959742951` validated the exact CI scope, deployed the exact SHA, and passed deployment, public endpoint smoke and public browser UI validation.
- PR #393 had no comments, reviews or unresolved review threads before merge.
- Local clone execution was unavailable in the current environment; no local result was counted as validation evidence.
- Final claims use exact refs, files, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.