# LexiGo Project State

## Verification

- Last verified: 2026-08-09 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Verified product `main` before this reconciliation: `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- Latest deployed product SHA: `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- Latest merged Issue #74 product slice: PR #450, final developer-authored head `09417a3fb97f201c2e3431554e2db2618e640fd5`, squash product SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- PR #450 immutable-head CI #3103 / run `31296902303`: full product matrix `success`.
- Exact-SHA main CI #3104 / run `31297293933`: full product matrix `success`, including immutable API/Web container publication.
- Deploy Stage #2945 / run `31297652617`: `success` for the same exact product SHA after exact CI-scope validation.
- Deployed images: `ghcr.io/dja-tiger/lexigo-web:dcc03d589a660fff6bd56872a53e5b7f3560d09a` and `ghcr.io/dja-tiger/lexigo-api:dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- Stage PostgreSQL, Redis, API and Web were healthy. Public frontend and API readiness returned HTTP 200 on attempt 1. Public smoke passed with CSP mode `report-only`; 12/12 public desktop Chromium/iOS WebKit tests passed.
- Deployment Issue #12 records the same image SHA with deploy, public smoke and public browser states all `success`.
- Security baseline remains Next `16.2.11`, PostCSS `8.5.23`, Nano ID `3.3.18` and Sharp `0.35.3`; PR #450 changed no dependency or lockfile version.
- Issue #74 remains open for residual whole-application live-control inventory/remediation and final physical-device/manual acceptance.
- Unrelated maintenance PRs at the product-slice pre-flight: Dependabot #304, #403 and #432.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, clean review/thread audit, expected-head squash merge, exact-SHA main CI and exact-image Stage/public validation.
- A green workflow proves only tests actually selected by its effective command/configuration; uncollected source is not acceptance evidence.
- Exact deployment claims require immutable image tags, exact CI-scope validation, healthy services, public endpoint smoke and public browser evidence.
- Pure Agent Docs changes use the fail-closed lightweight classifier and must not deploy Stage.
- One PR contains one atomic slice; product work must not continue through stale Agent Harness state.
- Deploy Stage concurrency belongs only to accepted state-mutating deploy jobs. Skipped workflow-run consumers are not deployment evidence.
- GitHub-hosted setup failures before checkout are infrastructure evidence only; a rerun counts only when the exact workflow/product SHA remains unchanged and all required validation later succeeds.

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

## Issue #74 permanent evidence rules

- Scroll-sensitive pairwise target geometry must be sampled from one common scroll frame or normalized coordinate system per `.agents/AGENTS.issue-74-scroll-normalized-geometry.md`.
- Browser-owned zoom acceptance must remain explicitly collected by authoritative suites per `.agents/AGENTS.issue-74-browser-zoom-collection.md`.
- Reusable AsyncStatePanel and calendar reminder target owners have explicit desktop/mobile real-hit, non-overlap, focus and callback evidence.
- Dictionary catalog and Phrase Detail owners have explicit desktop Chromium, Android Chromium and iOS WebKit real-hit/non-overlap evidence.
- Expanded target layers must preserve accessible names, runtime callbacks, navigation/API semantics and approved painted geometry unless a separate slice explicitly owns paint.

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
- `layout.tsx` changed by one import. `package.json` changed only by one collection entry in each blocking UI/a11y command. Lockfile, dependencies, runtime components, canonical `phrases.css`, workflows and visual baseline metadata were untouched.
- `frontend/e2e/phrase-detail-touch-targets.spec.ts` runs deterministic fixtures in desktop Chromium, Android Chromium and iOS WebKit at 1440/820/390/320 widths with border-aware effective geometry, four-side `elementFromPoint`, common-frame non-overlap, focus and horizontal-containment checks.
- Below 768px the side-practice aside is intentionally hidden and is asserted hidden rather than synthetically exposed.
- `frontend/components/phrase-detail-touch-target-source.test.ts` locks live selectors, 44px paint ownership, paint-inert declarations, import order and authoritative collection.
- Existing Phrase Detail content-addressed compact/desktop Light/Dark visual baselines remained unchanged; visual regression passed on the immutable PR head and exact merge SHA.
- Fail-closed diff audit showed exactly eight allowed paths and no prohibited runtime/visual/dependency/workflow drift.
- PR CI #3103 / run `31296902303` completed successfully across the full product matrix. Review submissions, PR comments and unresolved review threads were empty. Expected-head squash merge used exact head `09417a3fb97f201c2e3431554e2db2618e640fd5`.
- Exact-SHA main CI #3104 / run `31297293933` completed successfully and published exact API/Web images.
- Stage #2945 / run `31297652617` validated exact CI scope, deployed exact SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a`, verified healthy services/public HTTP 200 endpoints and passed 12/12 public Chromium/iOS WebKit tests.

## Issue #74 acceptance status

Completed automated evidence:

- Delivered target owners from PRs #387, #389, #391, #393, #395, #402, #405, #407, #409, #411, #413, #415, #428, #435, #442, #444, #446, #448 and #450 meet their bounded 44/48px, spacing, focus and callback contracts.
- Canonical mobile navigation scales under root-text enlargement without clipping, ellipsis, target overlap or horizontal overflow.
- Word Detail has authoritative true 200% browser-owned zoom evidence; Home, Learn, Active Lesson and Phrases zoom owners are permanently collected fail-closed.
- Phrases now has explicit multi-browser real-hit acceptance for catalog and Phrase Detail controls.
- Progress, Active Lesson, AsyncStatePanel, calendar reminder, Dictionary catalog and Phrase Detail have explicit effective-target regression protection.

Remaining mandatory work:

- Continue residual whole-application live-control inventory across Issue #74 affected screens and remediate only evidenced controls below 44px fine / 48px coarse or with intersecting target geometry.
- Confirm remaining Header, bottom navigation, Home, Learn, Phrases, Dictionary, Lesson and Progress primary/secondary/text/icon controls are either covered by canonical shared owners or explicit bounded regression evidence.
- Perform final manual acceptance on real physical mobile hardware. Playwright emulation, browser zoom, root-font enlargement and Stage smoke do not satisfy this criterion.

Issue #74 stays open until those criteria are proven.

## CI/CD control-plane state

- PR #400 moved `deploy-stage` concurrency to the accepted state-mutating deploy job only; skipped PR/Dependabot/docs-only consumers cannot cancel authoritative deployments. Product SHA `ad45e9ca4b21114dee979495dfb89da3b43eab7f`.

## Current state

- Product PR #450 is merged and fully delivered through immutable-head CI, clean review/thread audit, expected-head squash merge, exact-SHA main CI and exact-image Stage/public validation.
- Product runtime and Stage are validated on exact image SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- Docs-only reconciliation is PR #451 from branch `docs/issue-74-phrase-detail-reconcile`; its merge may advance repository `main` but must not replace the deployed product SHA above.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset exactly to canonical templates.
- Next product work is the residual Issue #74 live-control inventory; only evidenced gaps should create product slices.
- Physical-device acceptance remains a separate final manual gate and is not claimed by automated evidence.
- Dependabot PRs #304, #403 and #432 remain separate maintenance work.

## Remaining roadmap

- Issue #74: complete residual live-control audit/remediation and final real-device acceptance; close only after all mandatory criteria are evidenced.
- Issue #78 CSP implementation and Stage evidence are complete; final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Dependabot PRs #304, #403 and #432 require separate review, immutable-head CI and deployment treatment according to changed scope.
- Other product/design Issues must be selected from live GitHub state and decomposed into atomic slices after Issue #74 is completed or explicitly blocked by the hardware gate.

## Reconciliation evidence

- PR #449 merged as docs SHA `85c3b69350e87cb5ed399f93a418a020ef9170c9` and became the exact base for product PR #450.
- PR #450 final developer head `09417a3fb97f201c2e3431554e2db2618e640fd5` merged to product SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- PR #450 immutable-head CI #3103 / `31296902303`, exact-SHA main CI #3104 / `31297293933`, and Stage #2945 / `31297652617` all completed successfully.
- Deployment Issue #12 records exact product SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a` with deploy/public-smoke/public-browser states all `success`.
- Docs-only reconciliation PR #451 records this delivery and resets current task state. Its merge is documentation-only and must not replace the deployed product SHA.
- Issue #74 remains open for residual inventory/remediation and physical-device/manual acceptance.
- GitHub CI/Stage are the execution source of truth; local clone results are not counted as authoritative delivery evidence.

## State semantics

This file records the exact product base verified before the current task/documentation slice, latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
