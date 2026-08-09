# LexiGo Project State

## Verification

- Last verified: 2026-08-09 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Verified product `main` before this reconciliation: `3cd07146524724e70647d9fa05eb5907f12597bb`.
- Latest deployed product SHA: `3cd07146524724e70647d9fa05eb5907f12597bb`.
- Latest merged Issue #74 product slice: PR #454, final developer-authored head `adbaf4187247eff3ab9c45c96b8c98de74b18dff`, squash product SHA `3cd07146524724e70647d9fa05eb5907f12597bb`.
- PR #454 immutable-head CI #3127 / run `31320359239`: full product matrix `success`.
- Exact-SHA main CI #3128 / run `31320946429`: final attempt 2 `success`, including immutable API/Web container publication. Attempt 1 had an unrelated nondeterministic iOS WebKit UI-shard failure in existing Dictionary/Lesson Result tests; the exact unchanged SHA/workflow rerun passed without a product patch.
- Deploy Stage #2970 / run `31321881749`: `success` for the same exact product SHA after exact CI-scope validation.
- Deployed images: `ghcr.io/dja-tiger/lexigo-web:3cd07146524724e70647d9fa05eb5907f12597bb` and `ghcr.io/dja-tiger/lexigo-api:3cd07146524724e70647d9fa05eb5907f12597bb`.
- Stage PostgreSQL, Redis, API and Web were healthy. Public frontend root and API readiness returned HTTP 200 on attempt 1. Public smoke passed with CSP mode `report-only`; 12/12 public desktop Chromium/iOS WebKit tests passed, including `/learn` and `/dictionary`.
- Deployment Issue #12 records the same image SHA with deploy, public smoke and public browser states all `success`.
- Security baseline remains Next `16.2.11`, PostCSS `8.5.23`, Nano ID `3.3.18` and Sharp `0.35.3`; PR #454 changed no dependency or lockfile version.
- Issue #74 remains open for residual whole-application live-control inventory/remediation and final physical-device/manual acceptance.
- Unrelated maintenance PRs remain separate work, including Dependabot #304, #403 and #432.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, clean review/thread audit, expected-head squash merge, exact-SHA main CI and exact-image Stage/public validation.
- A green workflow proves only tests actually selected by its effective command/configuration; uncollected source is not acceptance evidence.
- Exact deployment claims require immutable image tags, exact CI-scope validation, healthy services, public endpoint smoke and public browser evidence.
- Pure Agent Docs changes use the fail-closed lightweight classifier and must not deploy Stage.
- One PR contains one atomic slice; product work must not continue through stale Agent Harness state.
- Deploy Stage concurrency belongs only to accepted state-mutating deploy jobs. Skipped workflow-run consumers are not deployment evidence.
- GitHub-hosted/browser setup failures and nondeterministic browser interactions are infrastructure/test-stability evidence only; a rerun counts only when the exact workflow/product SHA remains unchanged and all required validation later succeeds.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile, Scenario Catalog and Scenario Detail use dedicated canonical route-island owners.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; broad compatibility deletion remains prohibited without exact reachability, fallback-exclusive bundle and browser evidence.
- Issue #70 is completed/closed; application entry, compatibility reachability, shared style ownership and architecture contracts remain fail-closed.
- Issue #75 is completed/closed; authenticated PostgreSQL phrase search and URL/filter/history/scroll ownership remain fail-closed.

## Completed Issue #74 slices

- PR #387 connectivity action 44/48px targets — product `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
- PR #389 shared-header profile 44/48px target — `29151758bae0b4220ee48213d0fc49a2290ba20a`.
- PR #391 mobile Lesson Composer disclosure 44/48px targets — `0535f6641b6624b5f07266137942c3c5ae73c167`.
- PR #393 Lesson Composer option-radio 44/48px targets — `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.
- PR #395 shared-header streak 44/48px target — `346b9690ab6029776eeac614f2d26472160af927`.
- PR #397 rem-responsive mobile navigation labels/48px targets — `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.
- PR #402 unfinished-lesson reset/continue 44/48px targets — `ecbd6ac3ec16f77f7d34aca8782d1182bf5db090`.
- PR #405 Home `Открыть прогресс` 44/48px target — `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.
- PR #407 Phrases search-clear 44/48px target — `f36c70d4b21477f2df63500d97c20715bc4b3db3`.
- PR #409 Dictionary search-clear 44/48px target — `65cb8c675e40ed654f5b1779d0ee57e34cf112ec`.
- PR #411 Word Detail Back 44/48px target — `3b8f3c39faee1223e3773935c761eb7903409868`.
- PR #413 Word Detail related-phrase 44/48px targets — `477bccd8f38e648a3ad536dcc58526303297a376`.
- PR #415 Word Detail related-phrase retry 44/48px target — `51e3ee5a6ea63146bdb7eb7d0faa9e351c52f56b`.
- PR #417 Word Detail authoritative true 200% browser zoom/reflow — `5d864970103479863fc74ad76009a33030842420`.
- PRs #419/#421/#423 added Home/Learn/Active Lesson true-browser-zoom sources; PR #426 made their authoritative collection fail-closed and added Phrases true 200% acceptance — product `7c641b2eea330363c80e6c666721a31eb5d60b9c`.
- PR #428 populated Progress 44/48px effective targets — `69dc1fd2e893a932dce9facccaebc5afd5a6d2c1`.
- PR #435 Active Lesson controls 44/48px effective targets — `3ec8b92509d72b3b435779a9ede65adc7222a50a`.
- PR #442 Phrases catalog 44/48px effective targets — `2ee32d075b20dca000f1e10726ba8842b4685434`.
- PR #444 reusable AsyncStatePanel 44/48px effective targets — `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- PR #446 calendar reminder preview/close/weekdays 44/48px targets — `0700fed4f77758bc193b87d30a698ed2217a7dad`.
- PR #448 Dictionary quick filters, panel filters/reset and pagination 44/48px targets — `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.
- PR #450 Phrase Detail back, speech, lesson-configuration, return-to-catalog and visible side-practice 44/48px effective targets — `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- PR #452 guest Dictionary `Слова и термины` / `Рабочие фразы` catalog-kind navigation 44px fine-pointer / 48px coarse-pointer effective targets — `eb10bdefdeec0b1328b0ad885d898e12895e3019`.
- PR #454 shared Learning `Уроки` / `Сценарии` subsection navigation 44px fine-pointer / 48px coarse-pointer effective targets on canonical `/learn` and `/scenarios` — `3cd07146524724e70647d9fa05eb5907f12597bb`.

## Issue #74 permanent evidence rules

- Scroll-sensitive pairwise target geometry must be sampled from one common scroll frame or normalized coordinate system per `.agents/AGENTS.issue-74-scroll-normalized-geometry.md`.
- Browser-owned zoom acceptance must remain explicitly collected by authoritative suites per `.agents/AGENTS.issue-74-browser-zoom-collection.md`.
- Reusable AsyncStatePanel and calendar reminder target owners have explicit desktop/mobile real-hit, non-overlap, focus and callback evidence.
- Dictionary catalog, guest Dictionary catalog-kind navigation, Phrase Detail and shared Learning subsection navigation owners have explicit desktop Chromium, Android Chromium and iOS WebKit real-hit/non-overlap evidence.
- Expanded target layers must preserve accessible names, runtime callbacks, navigation/API semantics and approved painted geometry unless a separate slice explicitly owns paint.
- Guest browser acceptance must isolate persisted authentication state as well as network fixtures; replacing auth routes alone does not create a guest browser context when authenticated cookies remain.

## Dictionary catalog evidence — PR #448

- Final developer head `448faae28f91b39989bc46f8701811d48e68e832`; exact base `80b0a8d3d13f0d7ac12350867eba64f312fe750c`.
- Route-scoped paint-inert ownership covers quick filters, source/status/sort/reset and pagination; existing search-clear/result/mobile-toggle owners were not duplicated.
- Browser acceptance uses border-aware geometry, four-side `elementFromPoint`, common-frame non-overlap, focus and containment.
- CI #3092 and #3093 independently rendered the same intended Linux medium-Light `768x1664`, SHA-256 `3e0215d2af6b4d024fddffd585752d125094b6737d987426b63f620f74577af3`; only evidenced content-addressed metadata changed.
- Immutable-head CI #3095 / `31295450246`, main CI #3096 / `31295869109`, and Stage #2937 / `31296173844` all succeeded.

## Phrase Detail evidence — PR #450

- Final developer head `09417a3fb97f201c2e3431554e2db2618e640fd5`; exact reconciled base `85c3b69350e87cb5ed399f93a418a020ef9170c9` from PR #449.
- The stale Issue literal `Подробнее` was already owned by connectivity PR #387; `Все режимы` is no longer a live runtime literal.
- Canonical `/phrases/:slug` has five live in-scope controls: `К списку фраз`, `Прослушать`, `Настроить урок`, `К другим фразам`, and `Начать практику` when the side panel is visible.
- All five already had >=44px painted height; the missing contract was a route-specific 48px coarse-pointer effective owner.
- `frontend/app/phrase-detail-touch-targets.css` adds only transparent block-axis 44px fine / 48px coarse event ownership. It does not alter painted dimensions, color, borders, typography, focus or callbacks.
- `frontend/e2e/phrase-detail-touch-targets.spec.ts` runs deterministic fixtures in desktop Chromium, Android Chromium and iOS WebKit at 1440/820/390/320 widths with border-aware effective geometry, four-side `elementFromPoint`, common-frame non-overlap, focus and horizontal-containment checks.
- `frontend/components/phrase-detail-touch-target-source.test.ts` locks live selectors, 44px paint ownership, paint-inert declarations, import order and authoritative collection.
- Existing Phrase Detail content-addressed compact/desktop Light/Dark visual baselines remained unchanged; visual regression passed on the immutable PR head and exact merge SHA.
- PR CI #3103 / run `31296902303`, exact-SHA main CI #3104 / run `31297293933`, and Stage #2945 / run `31297652617` all succeeded.

## Guest Dictionary catalog-kind evidence — PR #452

- Final developer head `1539fae217ddc34687021ebbc7e52a35b2a4c5e5`; exact reconciled base `b75d8a4c3a5fbba2be94c091f1e27ab6f9306c86` from PR #451.
- Guest `/dictionary` renders shared `CatalogKindNavigation` buttons `Слова и термины` and `Рабочие фразы`. Canonical paint is 44px above 640px and 48px at <=640px; the residual gap was the missing 48px coarse-pointer effective target on wider layouts.
- `frontend/app/dictionary-catalog-touch-targets.css` now includes `.lx-catalog-kind-navigation button` in the exact-`/dictionary` transparent block-axis 44/48px interaction owner without changing paint, focus or callbacks.
- `frontend/components/dictionary-catalog-touch-target-source.test.ts` locks shared runtime ownership, canonical paint boundaries, route-scoped effective ownership and exact blocking browser collection.
- `frontend/e2e/dictionary-catalog-touch-targets.spec.ts` covers guest 768px fine/coarse plus compact coarse layouts in desktop Chromium, Android Chromium and iOS WebKit with border-aware effective geometry, four-side `elementFromPoint`, non-overlap, focus, `/phrases` navigation and overflow checks.
- CI #3114 exposed a source-proof wording defect and CI #3117 exposed authenticated-cookie leakage into the guest fixture. The final fixture explicitly clears inherited cookies before installing the guest API contract; product session semantics were not weakened.
- Final immutable-head CI #3120 / run `31317896670` succeeded across the full matrix, including both previously failing UI shards. PR comments, submitted reviews and unresolved review threads were empty; expected-head squash merge used exact head `1539fae217ddc34687021ebbc7e52a35b2a4c5e5`.
- Exact-SHA main CI #3121 / run `31318401885` completed successfully and published exact API/Web images.
- Stage #2962 / run `31318829889` validated exact CI scope, deployed exact SHA `eb10bdefdeec0b1328b0ad885d898e12895e3019`, verified healthy services/public HTTP 200 endpoints and passed 12/12 public Chromium/iOS WebKit tests, including `/dictionary`.

## Learning subsection switch evidence — PR #454

- Final developer head `adbaf4187247eff3ab9c45c96b8c98de74b18dff`; exact reconciled base `d202c193928e28366606990683067403802ec55b` from PR #453.
- Inventory explicitly rejected already-compliant nearby controls before selecting this slice: Lesson Result CTA `52px`, Learn primary CTA `54px`, route brand/header navigation `48px`, rail `>=48px`, and mobile navigation `52px`.
- Canonical `/learn` `RouteChrome` and authenticated `/scenarios` `LexigoScenarioCatalogApp` share `Разделы обучения` links `Уроки` / `Сценарии`. Their painted owner is `scenario-catalog.css`: `44px` height and at least `120px` width; the residual gap was only the missing `48px` coarse-pointer effective block-axis target.
- `frontend/app/learning-section-switch-touch-targets.css` adds a transparent, borderless, shadowless `::before` event owner: `44px` fine, `48px` coarse, block-axis expansion only. Painted geometry, focus styling, accessible names and navigation callbacks remain owned by existing presentation/runtime layers.
- `frontend/components/learning-section-switch-touch-target-source.test.ts` locks import order, both canonical runtime owners, canonical 44px paint/120px width, paint-inert expansion and exact blocking UI/a11y collection.
- `frontend/e2e/learning-section-switch-touch-targets.spec.ts` proves `/learn` and `/scenarios` in desktop Chromium, Android Chromium and iOS WebKit using effective geometry, four-side `elementFromPoint`, sibling non-overlap, `aria-current`, focus-visible and overflow checks.
- Immutable-head PR CI #3127 / run `31320359239` completed successfully; visual regression remained green, proving the interaction-only layer did not change the approved painted baseline. PR comments, submitted reviews and unresolved review threads were empty; expected-head squash merge used exact head `adbaf4187247eff3ab9c45c96b8c98de74b18dff`.
- Exact-SHA main CI #3128 / run `31320946429` attempt 1 failed only in existing iOS WebKit Dictionary/Lesson Result browser interactions. Failure diagnostics did not implicate the new Learning switch spec. The unchanged exact SHA/workflow rerun attempt 2 passed, including both UI shards, frontend aggregate and API/Web image publication; no corrective product patch was made.
- Stage #2970 / run `31321881749` validated exact CI scope, deployed exact SHA `3cd07146524724e70647d9fa05eb5907f12597bb`, reported healthy PostgreSQL/Redis/API/Web, returned public frontend/API HTTP 200 on attempt 1 and passed 12/12 public desktop Chromium/iOS WebKit tests.

## Issue #74 acceptance status

Completed automated evidence:

- Delivered target owners from PRs #387, #389, #391, #393, #395, #402, #405, #407, #409, #411, #413, #415, #428, #435, #442, #444, #446, #448, #450, #452 and #454 meet their bounded 44/48px, spacing, focus and callback contracts.
- Canonical mobile navigation scales under root-text enlargement without clipping, ellipsis, target overlap or horizontal overflow.
- Word Detail has authoritative true 200% browser-owned zoom evidence; Home, Learn, Active Lesson and Phrases zoom owners are permanently collected fail-closed.
- Phrases has explicit multi-browser real-hit acceptance for catalog and Phrase Detail controls.
- Progress, Active Lesson, AsyncStatePanel, calendar reminder, Dictionary catalog, guest Dictionary catalog-kind navigation, Phrase Detail and Learning subsection navigation have explicit effective-target regression protection.

Remaining mandatory work:

- Continue residual whole-application live-control inventory across Issue #74 affected screens and remediate only evidenced controls below 44px fine / 48px coarse or with intersecting target geometry.
- Confirm remaining Header, bottom navigation, Home, Learn, Phrases, Dictionary, Lesson and Progress primary/secondary/text/icon controls are either covered by canonical shared owners or explicit bounded regression evidence.
- Perform final manual acceptance on real physical mobile hardware. Playwright emulation, browser zoom, root-font enlargement and Stage smoke do not satisfy this criterion.

Issue #74 stays open until those criteria are proven.

## CI/CD control-plane state

- PR #400 moved `deploy-stage` concurrency to the accepted state-mutating deploy job only; skipped PR/Dependabot/docs-only consumers cannot cancel authoritative deployments. Product SHA `ad45e9ca4b21114dee979495dfb89da3b43eab7f`.

## Current state

- Product PR #454 is merged and fully delivered through immutable-head CI, clean review/thread audit, expected-head squash merge, exact-SHA main CI and exact-image Stage/public validation.
- Product runtime and Stage are validated on exact image SHA `3cd07146524724e70647d9fa05eb5907f12597bb`.
- Docs-only reconciliation uses branch `docs/issue-74-learning-switch-reconcile`; its merge may advance repository `main` but must not replace the deployed product SHA above.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset exactly to canonical templates by this reconciliation.
- Next product work is the residual Issue #74 live-control inventory; only evidenced gaps should create product slices.
- Physical-device acceptance remains a separate final manual gate and is not claimed by automated evidence.
- Dependabot PRs #304, #403 and #432 remain separate maintenance work.

## Remaining roadmap

- Issue #74: complete residual live-control audit/remediation and final real-device acceptance; close only after all mandatory criteria are evidenced.
- Issue #78 CSP implementation and Stage evidence are complete; final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Dependabot PRs #304, #403 and #432 require separate review, immutable-head CI and deployment treatment according to changed scope.
- Other product/design Issues must be selected from live GitHub state and decomposed into atomic slices after Issue #74 is completed or explicitly blocked by the hardware gate.

## Reconciliation evidence

- PR #453 merged as docs SHA `d202c193928e28366606990683067403802ec55b` and became the exact base for product PR #454.
- PR #454 final developer head `adbaf4187247eff3ab9c45c96b8c98de74b18dff` merged to product SHA `3cd07146524724e70647d9fa05eb5907f12597bb`.
- PR #454 immutable-head CI #3127 / `31320359239` completed successfully.
- Exact-SHA main CI #3128 / `31320946429` completed successfully on unchanged-SHA attempt 2 after an unrelated nondeterministic existing iOS WebKit UI-shard failure on attempt 1; exact API/Web images were published.
- Deploy Stage #2970 / `31321881749` validated exact CI scope and completed successfully; Deployment Issue #12 records exact product SHA `3cd07146524724e70647d9fa05eb5907f12597bb` with deploy/public-smoke/public-browser states all `success` and 12/12 public browser tests passed.
- This docs-only reconciliation records the delivery and resets current task state. Its merge is documentation-only and must not replace the deployed product SHA.
- Issue #74 remains open for residual inventory/remediation and physical-device/manual acceptance.
- GitHub CI/Stage are the execution source of truth; the locally downloaded failed Playwright artifact was used only to classify the attempt-1 flake, not as delivery evidence.

## State semantics

This file records the exact product base verified before the current task/documentation slice, latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.