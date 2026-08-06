# LexiGo Project State

## Verification

- Last verified: 2026-08-06 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `477bccd8f38e648a3ad536dcc58526303297a376`.
- Latest deployed product SHA: `477bccd8f38e648a3ad536dcc58526303297a376`.
- Latest completed product slice: Issue #74 canonical Word Detail related-phrase touch targets.
- Completion PR: #413.
- PR #413 final developer-authored head: `82d7f8b6b08f1d021d6213231860d657eccf461f`.
- Authoritative PR CI #2917 / run `31080920248` completed successfully across the full 18-job product matrix.
- Initial CI #2913 / run `31079839198` was diagnostic only: all functional target evidence passed, while Visual regression correctly rejected two stale compact content hashes after the intentional 10px to 14px coarse-pointer row-gap change.
- Expected-head squash merge produced product SHA `477bccd8f38e648a3ad536dcc58526303297a376`.
- Exact-SHA main CI #2918 / run `31081699603` completed successfully with the full product matrix and immutable web/API image publication.
- Immutable web image tag: `ghcr.io/dja-tiger/lexigo-web:477bccd8f38e648a3ad536dcc58526303297a376`.
- Immutable API image tag: `ghcr.io/dja-tiger/lexigo-api:477bccd8f38e648a3ad536dcc58526303297a376`.
- Exact-image Deploy Stage #2756 / run `31082355414` validated the exact CI scope, deployed SHA `477bccd8f38e648a3ad536dcc58526303297a376` and completed with overall conclusion `success`.
- Deploy Stage #2756 completed server deployment, public endpoint smoke and public browser UI validation successfully; diagnostics upload was correctly skipped because no failure occurred.
- PR #413 had no submitted reviews, change requests or unresolved review threads before merge.
- Issue #74 received factual completion comment `5201956015` and remains open because remaining live controls, whole-application 200% browser zoom and final physical-device acceptance are separate slices.
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
- Exact labels, callbacks, focus-visible behavior, lesson lifecycle, navigation, storage and visual baselines remain unchanged.
- Source and browser contracts protect selector ownership, non-overlap, focus and compact overflow.
- Product SHA: `ecbd6ac3ec16f77f7d34aca8782d1182bf5db090`.

### PR #405 — canonical Home progress CTA touch target

- The live canonical Home action `Открыть прогресс` retains its existing full-width 44px production border box.
- A route-scoped interaction-only owner guarantees a 48px coarse-pointer effective target without collision with preceding progress content.
- Exact accessible name, callback, focus-visible behavior, Home presentation, navigation, session, history, storage and visual baselines remain unchanged.
- Source and cross-browser contracts protect runtime ownership, geometry, containment and compact overflow.
- Product SHA: `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.

### PR #407 — conditional Phrases search-clear target

- The live `/phrases` button `Очистить поиск` remains a native 36×36 painted control and exposes a 44×44 fine-pointer / 48×48 coarse-pointer effective target.
- Transparent hit slop expands vertically and toward the search field, never toward `Найти`; compact painted separation and rendered-only input clearance are explicit owners.
- Accessible name, callback, search semantics, API behavior, URL/history, focus styling, painted dimensions, desktop layout and empty-search Light/Dark baselines remain unchanged.
- Desktop Chromium, Android Chromium and iOS WebKit prove target geometry, perimeter hits, containment, submit separation, focus, clear behavior and compact overflow.
- Product SHA: `f36c70d4b21477f2df63500d97c20715bc4b3db3`.

### PR #409 — conditional Dictionary search-clear target

- The live authenticated `/dictionary` button `Очистить поиск` remains a native 36×36 painted control inside the existing 48px search field.
- A route-scoped interaction-only owner exposes a symmetric transparent 44×44 fine-pointer / 48×48 coarse-pointer event surface while keeping the complete target inside the field.
- Exact accessible name, conditional rendering, `setSearchInput("")`, URL-backed `{ query: "", page: 1 }` update, focus styling, API, history, catalog presentation and visual baselines remain unchanged.
- A fail-closed source contract protects selector/import ownership, runtime name/callback ownership, absence of visual declarations and blocking UI/accessibility command registration.
- Desktop Chromium, Android Chromium and iOS WebKit prove 44/48px target geometry, all four perimeter hits, search-field containment, painted trailing inset, focus, clear behavior and no horizontal overflow at 1440px, 390px and 320px.
- Product SHA: `65cb8c675e40ed654f5b1779d0ee57e34cf112ec`.

### PR #411 — canonical Word Detail Back touch target

- The live `/words/[id]` native Back action retains its existing 42px painted border box, desktop accessible name `Словарь`, compact name `Слово` and existing `onBack` callback.
- A route-scoped interaction-only owner exposes a transparent 44px fine-pointer / 48px coarse-pointer block-axis event surface; inline expansion remains zero, preventing collision with the adjacent status chip.
- Runtime, API, History, storage, focus styling, typography, spacing, colors and content-addressed Word Detail visual baselines remain unchanged.
- A fail-closed source contract protects selector/import ownership, responsive names, native-button callback ownership, absence of visual declarations and blocking UI/accessibility command registration.
- Desktop Chromium, Android Chromium and iOS WebKit prove the 42px painted box, 44/48px effective height, four perimeter hits, transparent pseudo styles, route-content clearance, status separation, visible focus, URL-backed Dictionary-state restoration and no horizontal overflow at 1440px, 390px and 320px.
- Product SHA: `3b8f3c39faee1223e3773935c761eb7903409868`.

### PR #413 — canonical Word Detail related-phrase touch targets

- Every live canonical `/words/[id]` related-phrase action remains a native button with its exact English accessible name, existing callback and 34px painted pill presentation.
- A route-scoped interaction-only owner guarantees a 44px fine-pointer / 48px coarse-pointer effective block target while preserving zero inline expansion.
- Coarse-pointer wrapped rows reserve a 14px row gap, preventing pairwise overlap between the vertically expanded targets.
- API, session, History, storage, typography, colors, borders, focus presentation and canonical `/phrases/[slug]` handoff remain unchanged.
- A fail-closed source contract protects import/selector ownership, native semantics, existing 34px presentation, canonical slug navigation, absence of visual declarations and blocking UI/accessibility registration.
- Desktop Chromium, Android Chromium and iOS WebKit prove computed effective geometry, four perimeter hits, transparent pseudo styles, pairwise non-overlap, visible focus, canonical phrase navigation and no horizontal overflow at 1440px, 390px and 320px.
- The intentional coarse row separation changes only the compact full-page Word Detail height from 1745px to 1749px. Compact Light SHA-256 is `c0370ebe2bb3e5b14b802889603d00bd9a43d33f63fe67ea87ddcf071e8a6112`; compact Dark SHA-256 is `1587a40a287e26e8806a25ca146051e470f2e0aa3db0a89329ed0af99611c3fb`; desktop baselines remain unchanged.
- Product SHA: `477bccd8f38e648a3ad536dcc58526303297a376`.

## Issue #74 acceptance status

Completed:

- Global connectivity text actions have guaranteed 44/48px effective targets.
- Shared live header profile and streak buttons have guaranteed 44/48px targets with adjacent-control separation.
- Mobile Lesson Composer disclosure states and all currently rendered option radios have guaranteed 44/48px effective targets with preserved semantics.
- Conditional unfinished-lesson actions `Сбросить` and `Продолжить урок` have guaranteed 44/48px effective targets without painted growth or overlap.
- Canonical Home `Открыть прогресс` has a guaranteed 44/48px effective target without visual growth or collision with progress content.
- Conditional Phrases `Очистить поиск` has a guaranteed 44/48px effective target, compact separation from `Найти` and rendered-only input clearance.
- Conditional Dictionary `Очистить поиск` has a guaranteed 44/48px effective target contained inside its 48px search field without painted growth.
- Canonical Word Detail Back has a guaranteed 44/48px effective target without painted growth, status-chip overlap or loss of Dictionary URL state.
- Canonical Word Detail related-phrase actions have guaranteed 44/48px effective targets, zero inline expansion, non-overlapping wrapped rows and preserved 34px painted pills/canonical phrase navigation.
- Canonical mobile-navigation labels are readable at default compact width and scale with enlarged root text without clipping, ellipsis, target overlap or horizontal overflow.
- Expanded targets and enlarged labels preserve presentation ownership, keyboard focus, accessible names, runtime callbacks, route navigation and content clearance.
- Hidden/decorative consumers and stale issue wording are excluded from ownership; no live `Все режимы` control exists in the current `/learn` runtime.

Still open:

- Audit and remediate the conditional related-phrase retry/error action and remaining confirmed live preview, sticky-action, header/icon and route-specific controls not covered by PRs #387, #389, #391, #393, #395, #397, #402, #405, #407, #409, #411 and #413.
- Prove all remaining primary, secondary, text-only and icon controls meet minimum target and spacing contracts across affected routes.
- Verify whole-application 200% browser zoom without clipping, overlap or inaccessible actions; PR #397 proves 200% root-text enlargement only for canonical mobile navigation.
- Complete manual physical-device acceptance before Issue #74 can close.

Issue #74 remains open. PRs #387, #389, #391, #393, #395, #397, #402, #405, #407, #409, #411 and #413 are completed atomic production slices, not full Issue closure.

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
- Product runtime and stage are validated on exact image SHA `477bccd8f38e648a3ad536dcc58526303297a376`.
- `.agents/current/**` is reset to canonical templates by this documentation reconciliation.
- Issue #74 remains open; its latest completed slice is PR #413.
- The next Issue #74 slice must begin from live GitHub state and select only a confirmed exposed control, such as the conditional related-phrase retry/error action, or a bounded 200% zoom surface after runtime-visibility, accessibility-tree and computed-style verification.
- Dependabot PRs #304, #305 and #403 remain separate maintenance work and must not be merged implicitly into an Issue #74 product slice.

## Remaining roadmap

- Issue #74: continue separate atomic slices for remaining live touch targets, whole-application 200% zoom and final physical-device acceptance.
- Issue #78 CSP implementation and stage evidence are complete, but final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Dependabot PRs #304, #305 and #403 require their own review, immutable-head CI and deployment treatment according to changed scope.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices.

## Recent production evidence

1. #413 — `fix(a11y): expand Word Detail related phrase touch targets` → `477bccd8f38e648a3ad536dcc58526303297a376`.
2. #412 — Agent Docs reconciliation → `078f842740bbed27deed92888e8f482cb133f616`.
3. #411 — `fix(a11y): expand Word Detail Back touch target` → `3b8f3c39faee1223e3773935c761eb7903409868`.
4. #410 — Agent Docs reconciliation → `ecbb16dd42cd0567f3a9c760f2ea938aede8bb6b`.
5. #409 — `fix(a11y): expand Dictionary search clear touch target` → `65cb8c675e40ed654f5b1779d0ee57e34cf112ec`.

## Evidence

- PR #413 final developer-authored head `82d7f8b6b08f1d021d6213231860d657eccf461f` passed authoritative full CI #2917 / run `31080920248` across 18 jobs without retry.
- Frontend lint, TypeScript, unit/source contracts, production build, dependency audit, both UI shards, Lesson completion, Dictionary smoke, iOS PWA Dictionary, controlled service worker, content security, visual regression, accessibility, performance, backend unit/security/integration and both container builds succeeded together on the immutable head.
- The related-phrase target proof passed in desktop Chromium, Android Chromium and iOS WebKit at 1440px, 390px and 320px, covering computed target geometry, all four perimeter hits, pairwise non-overlap, focus, canonical destination handoff and horizontal overflow.
- Initial CI #2913 / run `31079839198` correctly rejected only two stale compact Word Detail content hashes after the intentional coarse-pointer row-gap change. The first attempt and retry produced identical 390×1749 Light/Dark outputs; only those exact metadata records were updated with immutable run/head provenance, and both desktop baselines remained unchanged.
- Expected-head squash merge produced `477bccd8f38e648a3ad536dcc58526303297a376`.
- Exact-SHA main CI #2918 / run `31081699603` completed successfully with the full product gates and immutable web/API image publication.
- Deploy Stage #2756 / run `31082355414` validated the exact CI scope artifact, deployed exact image SHA `477bccd8f38e648a3ad536dcc58526303297a376`, verified public endpoints and completed public browser UI validation successfully.
- PR #413 had no submitted reviews, change requests or unresolved review threads before merge.
- Issue #74 received factual completion comment `5201956015` and remains open for its remaining acceptance scope.
- Local clone execution was unavailable because the execution environment could not resolve GitHub; no local result is counted as authoritative product evidence.
- Final claims use exact refs, files, Issues, PRs, workflow jobs, deployment records and immutable content hashes.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.