# LexiGo Project State

## Verification

- Last verified: 2026-08-05 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.
- Latest deployed product SHA: `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.
- Latest completed product slice: Issue #74 canonical Home `Открыть прогресс` touch target.
- Completion PR: #405.
- PR #405 immutable developer-authored head: `c9ca9a0b2bbea8c245738010ada7f0eb5839ca50`.
- Authoritative PR CI: #2871 / run `31032424184`, complete success.
- Expected-head squash merge produced product SHA `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.
- Exact-SHA main CI #2872 / run `31033284674` completed successfully with the full product matrix and immutable web/API image publication.
- Exact-image Deploy Stage #2710 / run `31034016684` validated the exact CI scope, deployed SHA `2ba2c279f0a460dacd8972ac08b8c0e277342a0b` and completed with overall conclusion `success`.
- Issue #12 records `deploy: success`, `public smoke: success` and `public browser: success` for exact image SHA `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`; 12/12 public desktop Chromium and iOS WebKit route checks passed.
- PR #405 had no comments, reviews or unresolved review threads before merge.
- Issue #74 received a factual completion comment and remains open because remaining live controls, whole-application 200% browser zoom and final physical-device acceptance are separate slices.
- Open PRs #304, #305 and #403 are unrelated Dependabot maintenance and do not intersect this Agent Docs reconciliation.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.
- Exact deployment claims require immutable image tags, exact CI-scope validation, healthy deployed services, public endpoint smoke and public browser evidence.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.
- One PR contains one atomic slice. Product work does not continue through stale Agent Harness state.
- Real automatic and manual deploy jobs share `group: deploy-stage` with `cancel-in-progress: true`; only an accepted state-mutating deploy job enters that concurrency group.

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

- Live `ReviewOutboxRuntime` connectivity actions expose a 44px fine-pointer / 48px coarse-pointer effective target without changing their painted boxes.
- Inline expansion remains zero, preventing overlap.
- Desktop Chromium, iOS WebKit and Android Chromium prove role/name, target height, perimeter hits, keyboard focus and compact overflow.
- Product SHA: `9ee68f15d623bc7d0e001967b94eff3946b246b3`.

### PR #389 — header profile touch target

- Live `button.lx-avatar[aria-label="Открыть профиль"]` exposes a 44×44 fine-pointer and 48×48 coarse-pointer effective target.
- Existing painted avatar geometry and decorative Profile-page avatar exclusion remain unchanged.
- Desktop Chromium, Android Chromium and iOS WebKit prove geometry, perimeter hits, reminder separation, focus-visible and compact overflow.
- Product SHA: `29151758bae0b4220ee48213d0fc49a2290ba20a`.

### PR #391 — mobile Lesson Composer disclosure touch targets

- Live `/learn` disclosure states `Настроить урок` and `Ручная настройка` expose 44px fine-pointer / 48px coarse-pointer effective targets.
- Presentation, semantics, lesson lifecycle, URL/history and visual baselines remain unchanged.
- Desktop Chromium, Android Chromium and iOS WebKit prove target size, hits, separation, focus, toggling and compact reflow.
- Product SHA: `0535f6641b6624b5f07266137942c3c5ae73c167`.

### PR #393 — mobile Lesson Composer option touch targets

- Every visible mode, source and size radio in expanded mobile `/learn` exposes a minimum 44px fine-pointer and 48px coarse-pointer effective target.
- Existing layout, typography, radio semantics, callbacks, session and lesson lifecycle remain unchanged.
- Browser proof covers accessibility-tree ownership, native-plus-pseudo geometry, perimeter hits, non-overlap, focus, selection and compact reflow.
- Product SHA: `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.

### PR #395 — shared-header streak touch target

- Every confirmed live shared-header `button.lx-streak` exposes a real minimum 44px fine-pointer and 48px coarse-pointer border box.
- Decorative Dictionary streak is excluded; reminder and profile separation remain preserved.
- Desktop Chromium, Android Chromium and iOS WebKit prove dimensions, perimeter hits, disclosure behavior, focus and compact overflow.
- Product SHA: `346b9690ab6029776eeac614f2d26472160af927`.

### PR #397 — scalable canonical mobile-navigation labels

- The live four-link `.lx-route-nav--mobile` keeps at least 48×48 CSS px targets and exposes default compact labels of at least 12px.
- Label size uses a rem-responsive floor, permits bounded wrapping and removes clipping/ellipsis.
- Navigation height and route bottom reserve grow together under enlarged root text; reserve remains at least navigation height plus 20px within a bounded 0.1 CSS px browser-serialization tolerance.
- Route targets, accessible names, hrefs, active state, navigation callbacks, history ownership, desktop header and tablet rail remain unchanged.
- Focused proof covers 390px default, 320px narrow and 200% root text in desktop Chromium, Android Chromium and iOS WebKit.
- Product SHA: `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.

### PR #402 — Learn unfinished-lesson resume-action touch targets

- The live conditional `/learn` actions `Сбросить` and `Продолжить урок` retain their existing 44px painted button boxes and 10px visual gap.
- A dedicated interaction-only owner guarantees a 48px coarse-pointer effective target through transparent block-axis-only expansion; inline expansion remains zero, so adjacent targets cannot overlap.
- Exact labels, `discardActiveLesson` / `openLesson("lesson_start")` callbacks, focus-visible behavior, lesson lifecycle, navigation, storage and visual baselines remain unchanged.
- A source ownership contract protects selector scope, import order, callback/name ownership, absence of visual declarations and blocking test-command ownership.
- Desktop Chromium, Android Chromium and iOS WebKit prove visual/effective geometry, all four perimeter hits, non-overlap, focus and no horizontal overflow at 390px and 320px.
- Recommended and manual start buttons were not changed because their existing painted minimum is already 54px.
- Product SHA: `ecbd6ac3ec16f77f7d34aca8782d1182bf5db090`.

### PR #405 — canonical Home progress CTA touch target

- The live direct canonical Home action `Открыть прогресс` retains its existing full-width 44px production border box.
- A route-scoped interaction-only owner guarantees a 48px coarse-pointer effective target through transparent block-axis-only expansion; inline expansion remains zero and the target stays below preceding progress content and inside the panel.
- Exact accessible name, `navigate({ view: "progress" })` callback, focus-visible behavior, Home presentation, navigation, session, history, storage and visual baselines remain unchanged.
- Hidden `.lx-home-paths` actions are excluded because canonical Home removes that catalogue from the accessibility tree; the primary next-action CTA is excluded because it already has a 48px production minimum.
- A source ownership contract protects runtime name/callback ownership, selector scope, import order, hidden-consumer exclusion, absence of visual declarations and blocking Home test-command ownership.
- Desktop Chromium, Android Chromium and iOS WebKit prove visual/effective geometry, all four perimeter hits, content/panel separation, focus and no horizontal overflow at 390px and 320px.
- Product SHA: `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.

## Issue #74 acceptance status

Completed:

- Global connectivity text actions have guaranteed 44/48px effective targets.
- Shared live header profile and streak buttons have guaranteed 44/48px targets with adjacent-control separation.
- Mobile Lesson Composer disclosure states and all currently rendered option radios have guaranteed 44/48px effective targets with preserved semantics.
- Conditional unfinished-lesson actions `Сбросить` and `Продолжить урок` have guaranteed 44/48px effective targets without painted growth or overlap.
- Canonical Home `Открыть прогресс` has a guaranteed 44/48px effective target without visual growth or collision with progress content.
- Canonical mobile-navigation labels are readable at default compact width and scale with enlarged root text without clipping, ellipsis, target overlap or horizontal overflow.
- Expanded targets and enlarged labels preserve presentation ownership, keyboard focus, accessible names, runtime callbacks, route navigation and content clearance.
- Hidden/decorative consumers and stale issue wording are excluded from ownership; no live `Все режимы` control exists in the current `/learn` runtime.

Still open:

- Audit and remediate remaining live preview, sticky-action, header/icon and route-specific controls not covered by PRs #387, #389, #391, #393, #395, #397, #402 and #405.
- Prove all remaining primary, secondary, text-only and icon controls meet minimum target and spacing contracts across affected routes.
- Verify whole-application 200% browser zoom without clipping, overlap or inaccessible actions; PR #397 proves 200% root-text enlargement only for canonical mobile navigation.
- Complete manual physical-device acceptance before Issue #74 can close.

Issue #74 remains open. PRs #387, #389, #391, #393, #395, #397, #402 and #405 are completed atomic production slices, not full Issue closure.

## Completed CI/CD control-plane slice

### PR #400 — deploy-job-only stage concurrency

- Workflow-level `concurrency` was removed from `Deploy Stage`.
- The exact CI-scope `scope` job remains unconstrained and fail-closed.
- Only an accepted `deploy` job carries `group: deploy-stage` and `cancel-in-progress: true`.
- Skipped pull-request, Dependabot, docs-only and otherwise non-deployable workflow runs cannot enter deployment concurrency or cancel an authoritative deployment.
- Automatic successful main-push deployments and explicit manual deployments remain serialized through the same group.
- Product SHA: `ad45e9ca4b21114dee979495dfb89da3b43eab7f`.

## Current state

- No product slice is active.
- Product runtime and stage are validated on exact image SHA `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.
- `.agents/current/**` is reset to canonical templates by this documentation reconciliation.
- Issue #74 remains open; its latest completed slice is PR #405.
- The next Issue #74 slice must begin from live GitHub state and select only a confirmed exposed control or a bounded 200% zoom surface after runtime-visibility, accessibility-tree and computed-style verification.
- Dependabot PRs #304, #305 and #403 remain separate maintenance work and must not be merged implicitly into an Issue #74 product slice.

## Remaining roadmap

- Issue #74: continue separate atomic slices for remaining live touch targets, whole-application 200% zoom and final physical-device acceptance.
- Issue #78 CSP implementation and stage evidence are complete, but final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Dependabot PRs #304, #305 and #403 require their own review, immutable-head CI and deployment treatment according to changed scope.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices.

## Recent production evidence

1. #405 — `fix(a11y): expand Home progress action touch target` → `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.
2. #404 — Agent Docs reconciliation → `6563e7e2dbdefe6d42f6cd3c30b747030c6acca5`.
3. #402 — `fix(a11y): expand Learn resume action touch targets` → `ecbd6ac3ec16f77f7d34aca8782d1182bf5db090`.
4. #401 — Agent Docs reconciliation → `78e3c18af88d86fbdfb6ee1f9d1a7dad0f006372`.
5. #400 — `fix(ci): scope stage concurrency to real deploy jobs` → `ad45e9ca4b21114dee979495dfb89da3b43eab7f`.

## Evidence

- PR #405 immutable head `c9ca9a0b2bbea8c245738010ada7f0eb5839ca50` passed authoritative full CI #2871 / run `31032424184`.
- Frontend lint, TypeScript, unit/source contracts, production build, dependency audit, both UI shards, Lesson, Dictionary, iOS PWA, controlled service worker, CSP, visual regression, accessibility, performance, backend unit/security/integration and both container builds succeeded.
- The Home target proof passed in desktop Chromium, Android Chromium and iOS WebKit at 390px and 320px.
- Expected-head squash merge produced `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.
- Exact-SHA main CI #2872 / run `31033284674` completed successfully with the full product gates and immutable web/API image publication.
- Deploy Stage #2710 / run `31034016684` validated the exact CI scope artifact, deployed exact image SHA `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`, verified healthy services and public endpoints, and completed public browser validation successfully.
- Issue #12 confirms exact web/API image tags, healthy containers, HTTP 200 frontend/API smoke and 12/12 public desktop Chromium / iOS WebKit route checks.
- PR #405 had no comments, reviews or unresolved review threads before merge.
- Issue #74 received a factual completion comment and remains open for its remaining acceptance scope.
- Local clone execution was unavailable; no local result is counted as authoritative product evidence.
- Final claims use exact refs, files, Issues, PRs, workflow jobs, deployment records and Issue #12 status.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
