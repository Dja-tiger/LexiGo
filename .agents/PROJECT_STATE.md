# LexiGo Project State

## Verification

- Last verified: 2026-08-09 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Verified product `main` before this reconciliation: `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- Latest deployed product SHA: `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- Latest merged Issue #74 product slice is PR #450, final developer-authored head `09417a3fb97f201c2e3431554e2db2618e640fd5`, squash product SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- PR #450 immutable-head CI #3103 / run `31296902303` succeeded across the full product matrix, including the new Phrase Detail real-hit target acceptance and unchanged content-addressed Phrase Detail visual baselines.
- Exact-SHA main CI #3104 / run `31297293933` succeeded for `dcc03d589a660fff6bd56872a53e5b7f3560d09a` across backend unit/race/security, backend integration, frontend lint/typecheck/unit/build/audit, UI shards, accessibility, visual, performance, CSP/PWA and immutable API/Web container publication.
- Deploy Stage #2945 / run `31297652617` succeeded for the same exact product SHA after validating the exact CI deployment-scope artifact.
- Exact deployed image tags are `ghcr.io/dja-tiger/lexigo-web:dcc03d589a660fff6bd56872a53e5b7f3560d09a` and `ghcr.io/dja-tiger/lexigo-api:dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- Stage PostgreSQL, Redis, API and Web services were healthy; public frontend root and API readiness returned HTTP 200 on attempt 1; public smoke succeeded with CSP mode `report-only`; all 12 public desktop Chromium/iOS WebKit runtime tests passed.
- Deployment Issue #12 records image SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a` with deploy, public smoke and public browser states all `success`.
- Security baseline remains Next `16.2.11`, PostCSS `8.5.23`, Nano ID `3.3.18` and Sharp `0.35.3`; PR #450 changed no dependency or lockfile version.
- Issue #74 remains open. Phrase Detail target remediation is fully delivered; residual whole-application live-control inventory and final real-physical-device/manual acceptance remain mandatory.
- Open unrelated maintenance PRs verified before the slice: Dependabot #304, #403 and #432.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, clean review/thread audit, expected-head squash merge, exact-SHA main CI and exact-image Stage/public validation.
- A green workflow proves only the tests selected by its effective command and configuration. A source file that is not collected by Playwright is not acceptance evidence.
- Exact deployment claims require immutable image tags, exact CI-scope validation, healthy deployed services, public endpoint smoke and public browser evidence.
- Pure Agent Docs changes use the fail-closed lightweight classifier and must not deploy Stage.
- One PR contains one atomic slice. Product work does not continue through stale Agent Harness state.
- Automatic and manual deploy jobs share `group: deploy-stage` with `cancel-in-progress: true`; only an accepted state-mutating deploy job enters that concurrency group.
- Skipped workflow-run consumers are not deployment evidence.
- A GitHub-hosted runner setup failure before checkout is infrastructure evidence only; an exact-job rerun is acceptable only when the workflow run and product SHA remain unchanged and all required validation subsequently succeeds.

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
- Product SHA `45ba441da5f8faf1248389311461cf2adf787786` completed Issue #70 and product SHA `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c` completed Issue #75; the current deployed product preserves both deliveries.

## Completed Issue #74 slices

- PR #387: connectivity action 44px fine-pointer / 48px coarse-pointer effective targets. Product SHA `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
- PR #389: live shared-header profile button 44/48px target. Product SHA `29151758bae0b4220ee48213d0fc49a2290ba20a`.
- PR #391: mobile Lesson Composer disclosure 44/48px targets. Product SHA `0535f6641b6624b5f07266137942c3c5ae73c167`.
- PR #393: visible Lesson Composer option-radio 44/48px targets. Product SHA `9a02252f83e20c9f7daffc4bbd52d919dd1a9788`.
- PR #395: live shared-header streak 44/48px target. Product SHA `346b9690ab6029776eeac614f2d26472160af927`.
- PR #397: rem-responsive canonical mobile-navigation labels and 48px targets under compact width and 200% root-text enlargement. Product SHA `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.
- PR #402: unfinished-lesson `Сбросить` and `Продолжить урок` 44/48px effective targets. Product SHA `ecbd6ac3ec16f77f7d34aca8782d1182bf5db090`.
- PR #405: canonical Home `Открыть прогресс` 44/48px target. Product SHA `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.
- PR #407: Phrases `Очистить поиск` contained 44/48px target with separation from `Найти`. Product SHA `f36c70d4b21477f2df63500d97c20715bc4b3db3`.
- PR #409: Dictionary `Очистить поиск` contained 44/48px target. Product SHA `65cb8c675e40ed654f5b1779d0ee57e34cf112ec`.
- PR #411: Word Detail Back 44/48px target with Dictionary-state restoration. Product SHA `3b8f3c39faee1223e3773935c761eb7903409868`.
- PR #413: Word Detail related-phrase 44/48px targets with non-overlap. Product SHA `477bccd8f38e648a3ad536dcc58526303297a376`.
- PR #415: retryable Word Detail related-phrase `Повторить` 44/48px target and same-request recovery. Product SHA `51e3ee5a6ea63146bdb7eb7d0faa9e351c52f56b`.
- PR #417: canonical Word Detail true 200% browser-owned Chromium zoom, responsive reflow, containment, de-sticky content, visible focus and no runtime errors. Product SHA `5d864970103479863fc74ad76009a33030842420`.
- PR #419: Home true-browser-zoom source merged. Product SHA `c40cd72a6ffde59f2a795b031b0dac2f3a48a38c`; authoritative collection evidence completed by PR #426.
- PR #421: Lesson Composer true-browser-zoom source merged. Product SHA `45ed5a1d5b65887b519807b8726b65cb416a11a4`; authoritative collection evidence completed by PR #426.
- PR #423: Active Lesson true-browser-zoom source merged. Product SHA `00774b8a4299d652c1433a5093f18e3265de5e4f`; authoritative collection evidence completed by PR #426.
- PR #426: repaired the authoritative visual collection and added fail-closed collection/semantic contracts plus Phrases true-browser-owned 200% acceptance. Product SHA `7c641b2eea330363c80e6c666721a31eb5d60b9c`.
- PR #428: canonical populated Progress actions expose paint-inert 44/48px effective targets. Product SHA `69dc1fd2e893a932dce9facccaebc5afd5a6d2c1`.
- PR #435: canonical Active Lesson utility, recall, confidence-rating and compact navigation controls expose paint-inert 44/48px effective targets. Product SHA `3ec8b92509d72b3b435779a9ede65adc7222a50a`.
- PR #442: canonical Phrases catalog controls expose 44/48px effective targets while preserving approved compact painted geometry. Product SHA `2ee32d075b20dca000f1e10726ba8842b4685434`.
- PR #444: reusable AsyncStatePanel primary/secondary recovery actions expose a 44px fine-pointer border-box target and a border-aware 48px coarse-pointer effective target through paint-inert block-axis hit slop. Product SHA `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- PR #446: live calendar reminder route-preview action, modal close and seven custom weekday controls expose independent 44px fine-pointer / 48px coarse-pointer effective targets; compact weekdays reflow to 4+3 without target intersection. Product SHA `0700fed4f77758bc193b87d30a698ed2217a7dad`.
- PR #448: canonical Dictionary quick filters, source/status/sort/reset controls and shared pagination expose 44px fine-pointer / 48px coarse-pointer effective targets while preserving compact painted geometry; wrapped and stacked coarse targets reserve independent separation. Product SHA `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.
- PR #450: canonical Phrase Detail back, speech, lesson-configuration, return-to-catalog and visible side-practice actions expose route-scoped 44px fine-pointer / 48px coarse-pointer effective targets with unchanged painted geometry and unchanged content-addressed visual baselines. Product SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.

## Issue #74 reusable target evidence

- Reusable AsyncStatePanel recovery actions remain protected by explicit desktop/mobile effective-target, real-hit ownership, keyboard-focus and live retry-callback acceptance from PR #444.
- Live calendar reminder preview/close/weekdays remain protected by desktop/mobile effective-target, real-hit ownership, common-frame non-overlap and keyboard-focus acceptance from PR #446.
- Scroll-sensitive pairwise target geometry must be sampled from one shared scroll state or normalized coordinate system as recorded in `.agents/AGENTS.issue-74-scroll-normalized-geometry.md`.
- Browser-owned zoom acceptance must remain explicitly collected by the authoritative suites as recorded in `.agents/AGENTS.issue-74-browser-zoom-collection.md`.

## Issue #74 Dictionary catalog effective-target evidence

- PR #448 final developer-authored head was `448faae28f91b39989bc46f8701811d48e68e832`; exact product/docs base was `80b0a8d3d13f0d7ac12350867eba64f312fe750c`.
- Canonical `/dictionary` quick filters, source/status/sort/reset controls and shared pagination receive route-scoped, paint-inert 44px fine / 48px coarse effective ownership; existing search-clear/result-card/mobile-toggle owners were not duplicated.
- Browser acceptance runs in desktop Chromium, Android Chromium and iOS WebKit with border-aware geometry, four-side `elementFromPoint` ownership, common-frame non-overlap, focus and containment checks.
- CI #3092 and #3093 independently produced the same intended Linux Dictionary medium-Light actual `768x1664`, SHA-256 `3e0215d2af6b4d024fddffd585752d125094b6737d987426b63f620f74577af3`; only that content-addressed metadata owner changed after artifact review.
- PR #448 immutable-head CI #3095 / run `31295450246`, exact-SHA main CI #3096 / run `31295869109` and Stage #2937 / run `31296173844` all succeeded.

## Issue #74 Phrase Detail effective-target evidence

PR #450 final immutable-head evidence on `09417a3fb97f201c2e3431554e2db2618e640fd5`:

- Exact reconciled base was `85c3b69350e87cb5ed399f93a418a020ef9170c9` from docs reconciliation PR #449.
- The stale Issue literal `Подробнее` is already owned by connectivity PR #387; `Все режимы` is no longer a live runtime literal, so neither was duplicated.
- Canonical `/phrases/:slug` has five live in-scope Phrase Detail actions: `К списку фраз`, `Прослушать`, `Настроить урок`, `К другим фразам`, and `Начать практику` when the side-practice panel is visible.
- All five already had >=44px painted height in canonical `phrases.css`; no Phrase Detail-specific 48px coarse-pointer owner existed. Phrases catalog controls are independently owned by PR #442 and AsyncStatePanel recovery controls by PR #444.
- `frontend/app/phrase-detail-touch-targets.css` adds route-scoped block-axis hit ownership with a 44px fine-pointer / 48px coarse-pointer variable and transparent/no-border/no-shadow pseudo surfaces. It does not change painted size, color, border, typography, focus styling or runtime callbacks.
- `layout.tsx` changed by exactly one stylesheet import; `frontend/package.json` changed only by collecting the dedicated acceptance once in `test:e2e:ui` and once in `test:e2e:a11y`; `package-lock.json`, dependency versions, runtime components and canonical `phrases.css` remained untouched.
- `frontend/e2e/phrase-detail-touch-targets.spec.ts` runs against deterministic phrase fixtures in desktop Chromium, Android Chromium and iOS WebKit at 1440/820/390/320 widths.
- Acceptance uses border-aware effective geometry, real four-side `document.elementFromPoint` ownership, one-common-frame non-overlap for adjacent main actions, existing visible keyboard focus and horizontal-containment checks.
- Below 768px the side-practice aside is intentionally hidden and is asserted hidden rather than synthetically exposed as a mobile control.
- `frontend/components/phrase-detail-touch-target-source.test.ts` permanently locks live-selector ownership, canonical 44px paint ownership, paint-inert declarations, import order and blocking UI/a11y collection.
- Existing Phrase Detail content-addressed compact/desktop Light/Dark visual baselines remained unchanged; visual regression passed on both immutable PR head and exact merge SHA.
- Fail-closed base/head audit showed exactly eight allowed paths; no `PROJECT_STATE`, lockfile, workflow, backend, visual-baseline or runtime-owner drift entered the product PR.
- PR #450 immutable-head CI #3103 / run `31296902303` completed successfully across backend unit/race/security/integration, frontend core, both UI shards, accessibility, visual, performance, Dictionary smoke, lesson completion, iOS PWA, CSP, controlled service worker and API/Web container publication.
- Review submissions, comments and unresolved review threads were empty; Ready transition was followed by expected-head squash merge using exact head `09417a3fb97f201c2e3431554e2db2618e640fd5`.

Post-merge evidence for product SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a`:

- exact-SHA main CI #3104 / run `31297293933`: complete success across the full product matrix;
- backend unit/security and integration race tests succeeded;
- frontend core, both UI shards, lesson completion, accessibility, visual, performance, Dictionary smoke, iOS PWA, content-security and controlled-service-worker gates succeeded;
- exact-SHA API and Web container builds completed successfully and published immutable images;
- Deploy Stage #2945 / run `31297652617`: complete success on the same exact SHA;
- exact CI deployment-scope artifact validation and exact immutable API/Web image deployment: success;
- stage PostgreSQL, Redis, API and Web services healthy;
- public frontend root HTTP 200 on attempt 1 and public API readiness HTTP 200 on attempt 1;
- public smoke passed with expected CSP mode `report-only`;
- public browser validation completed with 12/12 passing desktop Chromium/iOS WebKit runtime tests;
- deployment Issue #12 confirms exact image SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a` and deploy/public smoke/public browser states as `success`.

## Issue #74 acceptance status

Completed automated evidence:

- Confirmed live controls covered by PRs #387, #389, #391, #393, #395, #402, #405, #407, #409, #411, #413, #415, #428, #435, #442, #444, #446, #448 and #450 meet their route-specific 44/48px target, spacing, focus and callback contracts.
- Canonical mobile-navigation labels scale under root-text enlargement without clipping, ellipsis, target overlap or horizontal overflow.
- Word Detail has permanent authoritative true 200% browser-owned zoom evidence.
- The authoritative collection permanently executes Home, Learn and Active Lesson true-browser-zoom owners and contains fail-closed source protection against silently dropping them.
- Canonical Phrases has authoritative true-browser-owned 200% zoom evidence plus explicit multi-browser real-hit acceptance for both catalog and Phrase Detail controls.
- Canonical populated Progress and Active Lesson have explicit desktop/mobile effective-target and real-hit-testing acceptance while preserving approved visual baselines.
- Reusable AsyncStatePanel, calendar-reminder, Dictionary catalog and Phrase Detail target owners have explicit multi-browser real-hit and non-overlap regression protection.
- Expanded targets preserve accessible names, runtime callbacks, navigation/API semantics and approved painted geometry for all delivered slices.

Remaining / validation pending:

- Perform the residual whole-application live-control inventory against Issue #74 affected screens and remediate only controls still confirmed below the 44px fine-pointer / 48px coarse-pointer contracts or with intersecting target geometry.
- Confirm all remaining primary, secondary, text-only and icon controls in Header, bottom navigation, Home, Learn, Phrases, Dictionary, Lesson and Progress are either covered by canonical shared contracts or receive explicit bounded regression evidence.
- Perform final manual acceptance on real physical mobile hardware. This is a required Issue criterion and cannot be replaced by Playwright emulation, desktop browser zoom, root-font enlargement or Stage smoke.

Issue #74 stays open until those remaining criteria are proven.

## Completed CI/CD control-plane slice

### PR #400 — deploy-job-only Stage concurrency

- Workflow-level concurrency was removed from `Deploy Stage`.
- Exact CI-scope resolution remains unconstrained and fail-closed.
- Only an accepted state-mutating deploy job carries `group: deploy-stage` and `cancel-in-progress: true`.
- Skipped pull-request, Dependabot, docs-only and otherwise non-deployable workflow runs cannot cancel an authoritative deployment.
- Product SHA `ad45e9ca4b21114dee979495dfb89da3b43eab7f`.

## Current state

- Product PR #450 is merged and fully delivered through immutable-head CI, clean review/thread audit, expected-head squash merge, exact-SHA main CI and exact-image Stage/public validation.
- Current product runtime and Stage are validated on exact image SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- Repository memory is being reconciled in docs-only branch `docs/issue-74-phrase-detail-reconcile` from that exact product base; reconciliation PR number is pending creation at this record revision.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset exactly to canonical templates before the next product slice.
- The browser-zoom collection contract and scroll-normalized geometry rules remain permanent fail-closed protection.
- Progress, Active Lesson, Phrases catalog, Phrase Detail, reusable system-state, live calendar-reminder and Dictionary catalog effective-target slices are merged and preserved by the current deployed product.
- The next product work is residual whole-application Issue #74 live-control inventory; only evidenced gaps should produce additional product slices.
- Physical-device acceptance remains a separate final manual validation gate and is not claimed by automated browser evidence.
- Dependabot PRs #304, #403 and #432 remain separate maintenance work.

## Remaining roadmap

- Issue #74: complete residual live-control audit/remediation and final real-device acceptance; close the Issue only after all mandatory criteria are evidenced.
- Issue #78 CSP implementation and Stage evidence are complete, but final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Dependabot PRs #304, #403 and #432 require separate review, immutable-head CI and deployment treatment according to changed scope.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices after Issue #74 is completed or explicitly blocked by the manual hardware gate.

## Reconciliation evidence

- Docs-only reconciliation PR #449 merged as `85c3b69350e87cb5ed399f93a418a020ef9170c9` and became the exact base for PR #450.
- PR #450 merged from final developer-authored head `09417a3fb97f201c2e3431554e2db2618e640fd5` to product SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a`.
- PR #450 final immutable-head CI #3103 / run `31296902303` completed successfully.
- Exact-SHA main CI #3104 / run `31297293933` completed successfully and published exact API/Web images.
- Deploy Stage #2945 / run `31297652617` consumed the exact CI scope, deployed the exact product image SHA and completed public endpoint plus public browser UI validation successfully.
- Deployment Issue #12 records exact product SHA `dcc03d589a660fff6bd56872a53e5b7f3560d09a` with deploy, public smoke and public browser states all `success`.
- Current docs-only reconciliation branch is `docs/issue-74-phrase-detail-reconcile`; its PR number and final docs merge SHA must be recorded after the PR is opened and validated.
- Issue #74 remains open only for residual live-control inventory/remediation and physical-device/manual acceptance.
- No local clone result is counted as authoritative evidence; GitHub CI/Stage remain the execution source of truth.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
