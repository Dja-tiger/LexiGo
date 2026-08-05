# LexiGo Project State

## Verification

- Last verified: 2026-08-05 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.
- Latest deployed product SHA: `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.
- Latest completed product slice: Issue #74 scalable canonical mobile-navigation labels.
- Completion PR: #397.
- PR #397 immutable developer-authored head: `e1a5c1f6b511dd395395ed1e3dcc96b628edd52a`.
- Authoritative PR CI: #2850 / run `31020375564`, complete success.
- Expected-head squash merge produced product SHA `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.
- Exact-SHA main CI #2851 / run `31021377912` completed successfully with the full product matrix and immutable web/API image publication.
- Exact-image Deploy Stage #2689 / run `31022198395` validated the exact CI scope and deployed SHA `597e1fcf5c707ca07b6b3fb4783352be91d0555b`; both workflow jobs and every deploy, public endpoint smoke, public browser and reporting step completed successfully.
- Issue #12 records `deploy: success`, `public smoke: success` and `public browser: success` for exact image SHA `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.
- Workflow #2689 received overall conclusion `cancelled` only after its successful jobs completed because a later skipped Dependabot-triggered Deploy Stage #2690 entered the shared workflow-level concurrency group. Control-plane defect #398 tracks the race; no product or deployment step failed.
- PR #397 had no comments, reviews or unresolved review threads before merge.
- Issue #74 remains open because remaining live controls, whole-application 200% browser zoom and final physical-device acceptance are separate slices.
- No intersecting product or documentation PR was open when this reconciliation started; Dependabot maintenance remains unrelated.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.
- Exact deployment claims require immutable image tags, scope validation, healthy deployed services, public endpoint smoke and public browser evidence.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.
- One PR contains one atomic slice. Product work does not continue through stale Agent Harness state.
- A workflow-level status anomaly must be recorded separately when all authoritative jobs and steps succeeded; do not erase the anomaly or misrepresent it as a product failure.

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

- The live four-link `.lx-route-nav--mobile` keeps at least 48×48 CSS px targets and now exposes default compact labels of at least 12px.
- Label size uses a rem-responsive floor, permits bounded wrapping and removes clipping/ellipsis.
- Navigation height and route bottom reserve grow together under enlarged root text; reserve remains at least navigation height plus 20px within a bounded 0.1 CSS px browser-serialization tolerance.
- Route targets, accessible names, hrefs, active state, navigation callbacks, history ownership, desktop header and tablet rail remain unchanged.
- Focused proof covers 390px default, 320px narrow and 200% root text in desktop Chromium, Android Chromium and iOS WebKit.
- Compact visual hashes were promoted only after artifact-level review; desktop and unrelated hashes remained unchanged, and a retry-only Dictionary empty-state hash was not promoted.
- Product SHA: `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.

## Issue #74 acceptance status

Completed:

- Global connectivity text actions have guaranteed 44/48px effective targets.
- Shared live header profile and streak buttons have guaranteed 44/48px targets with adjacent-control separation.
- Mobile Lesson Composer disclosure states and all currently rendered option radios have guaranteed 44/48px effective targets with preserved semantics.
- Canonical mobile-navigation labels are readable at default compact width and scale with enlarged root text without clipping, ellipsis, target overlap or horizontal overflow.
- Expanded targets and enlarged labels preserve presentation ownership, keyboard focus, accessible names, runtime callbacks, route navigation and content clearance.
- Hidden/decorative consumers and stale issue wording are excluded from ownership; no live `Все режимы` control exists in the current `/learn` runtime.

Still open:

- Audit and remediate remaining live preview, recommended/manual start, sticky-action, header/icon and route-specific controls not covered by PRs #387, #389, #391, #393, #395 and #397.
- Prove all remaining primary, secondary, text-only and icon controls meet minimum target and spacing contracts across affected routes.
- Verify whole-application 200% browser zoom without clipping, overlap or inaccessible actions; PR #397 proves 200% root-text enlargement only for canonical mobile navigation.
- Complete manual physical-device acceptance before Issue #74 can close.

Issue #74 remains open. PRs #387, #389, #391, #393, #395 and #397 are completed atomic production slices, not full Issue closure.

## Current state

- No product slice is active.
- Product runtime and stage are validated on exact image SHA `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.
- `.agents/current/**` is reset to canonical templates by this documentation reconciliation.
- Control-plane Issue #398 is open for the Deploy Stage concurrency race; it does not invalidate the successful exact-image deployment evidence for PR #397.
- The next Issue #74 slice must begin from live GitHub state and select only a confirmed exposed control or a bounded 200% zoom surface after runtime-visibility, accessibility-tree and computed-style verification.

## Remaining roadmap

- Issue #74: continue separate atomic slices for remaining live touch targets, whole-application 200% zoom and final physical-device acceptance.
- Issue #398: prevent skipped/non-deployable workflow runs from cancelling an authoritative successful Deploy Stage while preserving serial exact-image deployment.
- Issue #78 CSP implementation and stage evidence are complete, but final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices.

## Recent production evidence

1. #397 — `fix(a11y): make mobile navigation labels scalable` → `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.
2. #396 — previous Agent Docs reconciliation → `091b8ffdbf0bb70edbbe963f9fd88e40c3ef848a`.
3. #395 — `fix(a11y): guarantee header streak touch target` → `346b9690ab6029776eeac614f2d26472160af927`.
4. #394 — Agent Docs reconciliation → `e46881b9fc9def630343e3ee69425492bc0aefe7`.
5. #393 — `fix(a11y): guarantee Learn option touch targets` → `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.

## Evidence

- PR #397 immutable head `e1a5c1f6b511dd395395ed1e3dcc96b628edd52a` passed authoritative full CI #2850 / run `31020375564`.
- Frontend lint, TypeScript, unit/source contracts, production build, dependency audit, both UI shards, focused desktop/iOS/Android navigation-label proof, Lesson, Dictionary, iOS PWA, controlled service worker, CSP, visual regression, accessibility, performance, backend unit/security/integration and both container builds succeeded.
- Expected-head squash merge produced `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.
- Exact-SHA main CI #2851 / run `31021377912` completed successfully with the full product gates and immutable web/API image publication.
- Deploy Stage #2689 / run `31022198395` validated exact CI scope and deployed exact SHA; both jobs and all required deployment/public steps succeeded.
- Issue #12 confirms exact deployed images, healthy services, frontend/API HTTP 200 smoke and public browser success.
- Workflow-level cancellation was caused solely by later skipped run #2690 entering the same concurrency group; Issue #398 records the defect and required regression contract.
- GitHub refused Actions retry because run #2689 contains no failed or cancelled job to rerun.
- PR #397 had no comments, reviews or unresolved review threads before merge.
- Issue #74 received a factual completion comment and remains open for remaining acceptance scope.
- Local clone execution was unavailable; no local result is counted as authoritative product evidence.
- Final claims use exact refs, files, Issues, PRs, workflow jobs, deployment records and Issue #12 status.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
