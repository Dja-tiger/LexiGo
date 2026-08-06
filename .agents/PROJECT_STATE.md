# LexiGo Project State

## Verification

- Last verified: 2026-08-06 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation reconciliation: `5d864970103479863fc74ad76009a33030842420`.
- Latest deployed product SHA: `5d864970103479863fc74ad76009a33030842420`.
- Latest completed product slice: Issue #74 canonical Word Detail true 200% browser-zoom audit.
- Completion PR: #417.
- PR #417 final developer-authored head: `e317e3035fa99c364a2978d4e8ca2e7ce8f64286`.
- Authoritative PR CI #2937 / run `31094168794` completed successfully on the exact final head across every required product gate.
- Expected-head squash merge produced product SHA `5d864970103479863fc74ad76009a33030842420`.
- Exact-SHA main CI #2938 / run `31094844407` completed successfully with the full product matrix and immutable web/API image publication.
- Immutable web image tag: `ghcr.io/dja-tiger/lexigo-web:5d864970103479863fc74ad76009a33030842420`.
- Immutable API image tag: `ghcr.io/dja-tiger/lexigo-api:5d864970103479863fc74ad76009a33030842420`.
- Exact-image Deploy Stage #2776 / run `31095545938` validated the exact CI scope artifact, deployed SHA `5d864970103479863fc74ad76009a33030842420` and completed with overall conclusion `success`.
- Issue #12 records `deploy: success`, `public smoke: success` and `public browser: success` for the exact image.
- PR #417 had no issue comments, submitted reviews, inline review comments, requested changes or unresolved review threads before merge.
- Issue #74 received factual completion comment `5203801703` and remains open because physical-device acceptance, remaining controls and additional route-bounded 200% browser-zoom audits are separate slices.
- Open PRs #304, #305 and #403 are unrelated Dependabot maintenance and do not intersect this Agent Docs reconciliation.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, review audit, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.
- Exact deployment claims require immutable image tags, exact CI-scope validation, healthy deployed services, public endpoint smoke and public browser evidence.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.
- One PR contains one atomic slice. Product work does not continue through stale Agent Harness state.
- Automatic and manual deploy jobs share `group: deploy-stage` with `cancel-in-progress: true`; only an accepted state-mutating deploy job enters that concurrency group.
- Skipped workflow-run consumers, including Dependabot-triggered consumers, are not deployment evidence and cannot replace correlation to the authoritative main CI run.

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

- Live `ReviewOutboxRuntime` connectivity actions expose 44px fine-pointer / 48px coarse-pointer effective targets without changing painted boxes or inline separation.
- Product SHA: `9ee68f15d623bc7d0e001967b94eff3946b246b3`.

### PR #389 — header profile touch target

- Live `button.lx-avatar[aria-label="Открыть профиль"]` exposes 44×44 fine-pointer / 48×48 coarse-pointer effective geometry while decorative Profile-page avatars remain excluded.
- Product SHA: `29151758bae0b4220ee48213d0fc49a2290ba20a`.

### PR #391 — mobile Lesson Composer disclosure touch targets

- Live `/learn` disclosure states `Настроить урок` and `Ручная настройка` expose 44px fine-pointer / 48px coarse-pointer effective targets with unchanged lesson lifecycle and navigation.
- Product SHA: `0535f6641b6624b5f07266137942c3c5ae73c167`.

### PR #393 — mobile Lesson Composer option touch targets

- Every visible mode, source and size radio in expanded mobile `/learn` exposes minimum 44px fine-pointer / 48px coarse-pointer effective targets with preserved native semantics and selection callbacks.
- Product SHA: `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.

### PR #395 — shared-header streak touch target

- Every confirmed live shared-header `button.lx-streak` exposes a minimum 44px fine-pointer / 48px coarse-pointer target; decorative Dictionary streak remains excluded.
- Product SHA: `346b9690ab6029776eeac614f2d26472160af927`.

### PR #397 — scalable canonical mobile-navigation labels

- The live four-link mobile navigation keeps at least 48×48 targets and readable rem-responsive labels under compact widths and 200% root-text enlargement without clipping or reserve mismatch.
- This slice proves root-text enlargement for mobile navigation, not whole-application browser zoom.
- Product SHA: `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.

### PR #402 — Learn unfinished-lesson resume actions

- Conditional `/learn` actions `Сбросить` and `Продолжить урок` retain their 44px painted boxes and gain 48px coarse-pointer block-axis event surfaces without overlap.
- Product SHA: `ecbd6ac3ec16f77f7d34aca8782d1182bf5db090`.

### PR #405 — canonical Home progress CTA

- Canonical Home `Открыть прогресс` retains its full-width 44px presentation and exposes a 48px coarse-pointer target without collision with preceding progress content.
- Product SHA: `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.

### PR #407 — conditional Phrases search-clear target

- `/phrases` `Очистить поиск` remains a native 36×36 control and exposes a 44×44 fine-pointer / 48×48 coarse-pointer target with compact separation from `Найти`.
- Product SHA: `f36c70d4b21477f2df63500d97c20715bc4b3db3`.

### PR #409 — conditional Dictionary search-clear target

- Authenticated `/dictionary` `Очистить поиск` remains a native 36×36 control inside the 48px search field and exposes a contained 44×44 / 48×48 transparent event surface.
- Product SHA: `65cb8c675e40ed654f5b1779d0ee57e34cf112ec`.

### PR #411 — canonical Word Detail Back target

- `/words/[id]` Back retains its 42px painted box, responsive accessible names and Dictionary-state restoration while exposing a 44px fine-pointer / 48px coarse-pointer block target.
- Product SHA: `3b8f3c39faee1223e3773935c761eb7903409868`.

### PR #413 — canonical Word Detail related-phrase targets

- Every related-phrase pill remains a native 34px painted button with canonical phrase navigation and gains a 44px fine-pointer / 48px coarse-pointer effective target.
- Coarse wrapped rows reserve sufficient separation to prevent expanded-target overlap; compact Light/Dark visual metadata was updated only for the deterministic 4px page-height delta.
- Product SHA: `477bccd8f38e648a3ad536dcc58526303297a376`.

### PR #415 — conditional Word Detail related-phrase retry target

- The retryable related-phrase error state keeps a native `Повторить` button with the exact accessible name, existing `relatedRetry` state owner and the same semantic phrase lookup.
- The painted button remains 36px high; a route-scoped interaction-only owner exposes a 44px fine-pointer / 48px coarse-pointer block target with zero inline expansion.
- Desktop Chromium, Android Chromium and iOS WebKit prove the native-button/pseudo-element union geometry, four perimeter hit points, error-message non-overlap, visible focus, same-request recovery and no horizontal overflow at 1440px, 390px and 320px.
- Runtime, API, History, session, storage and `frontend/app/word-detail.css` presentation ownership remain unchanged.
- Product SHA: `51e3ee5a6ea63146bdb7eb7d0faa9e351c52f56b`.

### PR #417 — canonical Word Detail true 200% browser zoom

- A test-only Manifest V3 controller launches in a dedicated persistent Chromium context and owns browser zoom through `chrome.tabs.setZoom(tabId, 2)`.
- The target tab is selected by exact canonical URL and the audit fails closed when ownership is ambiguous or the extension service worker is unavailable.
- Browser-owned zoom is proved independently through `chrome.tabs.getZoom()` and CDP `Page.getLayoutMetrics().cssVisualViewport.zoom`; root font size remains unchanged and the CSS viewport contracts to the expected width.
- Canonical Word Detail proves single-column responsive reflow, a de-sticky knowledge panel, horizontal containment, non-overlap, document-order placement, visible keyboard focus, enabled route actions and no runtime errors.
- Existing 200% root-text coverage and all content-addressed visual hashes remain unchanged.
- Product CSS, runtime, API, session, History, storage, Service Worker, dependency and workflow owners remain unchanged because the existing presentation already satisfies the browser-zoom contract.
- Product SHA: `5d864970103479863fc74ad76009a33030842420`.

## Issue #74 acceptance status

Completed:

- Global connectivity text actions have guaranteed 44/48px effective targets.
- Shared live header profile and streak buttons have guaranteed 44/48px targets with adjacent-control separation.
- Mobile Lesson Composer disclosure states and visible option radios have guaranteed 44/48px effective targets with preserved semantics.
- Conditional unfinished-lesson actions have guaranteed 44/48px effective targets without painted growth or overlap.
- Canonical Home progress CTA has a guaranteed 44/48px effective target.
- Conditional Phrases and Dictionary search-clear controls have guaranteed 44/48px targets with route-specific containment and adjacent-control separation.
- Canonical Word Detail Back, related-phrase pills and conditional related-phrase retry action have guaranteed 44/48px effective targets with preserved navigation/retry behavior.
- Canonical mobile-navigation labels are readable at compact width and scale with enlarged root text without clipping, ellipsis, target overlap or horizontal overflow.
- Canonical Word Detail has permanent automated Chromium evidence for true 200% browser-owned zoom, responsive reflow, de-sticky content, action accessibility and zero horizontal overflow.
- Expanded targets preserve keyboard focus, accessible names, runtime callbacks, route navigation, API semantics and content clearance.
- Hidden/decorative consumers and stale issue wording are excluded from ownership; no live `Все режимы` control exists in the current `/learn` runtime.

Still open:

- Audit and remediate remaining confirmed live preview, sticky-action, header/icon and route-specific controls not covered by PRs #387, #389, #391, #393, #395, #397, #402, #405, #407, #409, #411, #413, #415 and #417.
- Prove all remaining primary, secondary, text-only and icon controls meet minimum target and spacing contracts across affected routes.
- Continue whole-application 200% browser-zoom acceptance through separate bounded route slices; PR #417 proves only canonical Word Detail and PR #397 proves root-text enlargement for canonical mobile navigation.
- Complete final physical-device acceptance before Issue #74 can close.

Issue #74 remains open. The listed PRs are completed atomic production slices, not full Issue closure.

## Completed CI/CD control-plane slice

### PR #400 — deploy-job-only stage concurrency

- Workflow-level concurrency was removed from `Deploy Stage`.
- The exact CI-scope job remains unconstrained and fail-closed.
- Only an accepted state-mutating deploy job carries `group: deploy-stage` and `cancel-in-progress: true`.
- Skipped pull-request, Dependabot, docs-only and otherwise non-deployable workflow runs cannot cancel an authoritative deployment.
- Product SHA: `ad45e9ca4b21114dee979495dfb89da3b43eab7f`.

## Current state

- No product slice is active.
- Product runtime and stage are validated on exact image SHA `5d864970103479863fc74ad76009a33030842420`.
- `.agents/current/**` is reset to canonical templates by this documentation reconciliation.
- Issue #74 remains open; its latest completed slice is PR #417.
- Canonical `/words/[id]` now has permanent fail-closed true 200% Chromium browser-zoom evidence; no product CSS remediation was required.
- The next Issue #74 slice must start from live GitHub state and select one remaining route/control acceptance boundary rather than extending PR #417.
- Dependabot PRs #304, #305 and #403 remain separate maintenance work and must not be merged implicitly into Issue #74.

## Remaining roadmap

- Issue #74: continue atomic route-bounded 200% browser-zoom slices, audit remaining live controls and complete final physical-device acceptance.
- Issue #78 CSP implementation and stage evidence are complete, but final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Dependabot PRs #304, #305 and #403 require separate review, immutable-head CI and deployment treatment according to changed scope.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices.

## Recent production evidence

1. #417 — `test(a11y): audit Word Detail at true 200% browser zoom` → `5d864970103479863fc74ad76009a33030842420`.
2. #416 — Agent Docs reconciliation → `5e2b3e59ac0b34c3e4572bca8a97c656f7e234fb`.
3. #415 — `fix(a11y): expand Word Detail related-phrase retry touch target` → `51e3ee5a6ea63146bdb7eb7d0faa9e351c52f56b`.
4. #414 — Agent Docs reconciliation → `f4de7ead2851065d8bb0df083ac3203bc7828d9e`.
5. #413 — `fix(a11y): expand Word Detail related phrase touch targets` → `477bccd8f38e648a3ad536dcc58526303297a376`.

## Evidence

- PR #417 final developer-authored head `e317e3035fa99c364a2978d4e8ca2e7ce8f64286` passed authoritative CI #2937 / run `31094168794` across every required product gate.
- Frontend lint, TypeScript, unit/source contracts, production build, dependency audit, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled Service Worker, content security, visual regression, accessibility, performance, backend unit/security/integration and both container builds succeeded together on the immutable head.
- The Visual regression gate loaded the local Manifest V3 extension in pinned Playwright Chromium, applied browser-owned factor `2`, verified both extension and CDP zoom telemetry, and proved canonical Word Detail reflow/containment/focus without changing product CSS.
- Expected-head squash merge produced `5d864970103479863fc74ad76009a33030842420`.
- Exact-SHA main CI #2938 / run `31094844407` completed successfully with all 18 jobs, the full product gates and immutable image publication.
- Deploy Stage #2776 / run `31095545938` validated the exact CI scope artifact, deployed exact image SHA `5d864970103479863fc74ad76009a33030842420`, verified public endpoints and completed public browser validation successfully.
- PR #417 had no issue comments, submitted reviews, inline review comments, requested changes or unresolved review threads before merge.
- Issue #74 received factual completion comment `5203801703` and remains open for remaining acceptance scope.
- Local clone execution was unavailable because the isolated execution environment could not resolve `github.com`; no local result is counted as authoritative product evidence.
- Final claims use exact refs, files, Issues, PRs, workflow jobs, deployment records and immutable image tags.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
