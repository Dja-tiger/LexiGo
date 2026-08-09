# LexiGo Project State

## Verification

- Last verified: 2026-08-09 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Verified product `main` before this reconciliation: `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.
- Latest deployed product SHA: `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.
- Latest merged Issue #74 product slice is PR #448, final developer-authored head `448faae28f91b39989bc46f8701811d48e68e832`, squash product SHA `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.
- PR #448 immutable-head CI #3095 / run `31295450246` succeeded across the full product matrix, including the re-bound deterministic Linux Dictionary medium-Light content-addressed visual contract.
- Exact-SHA main CI #3096 / run `31295869109` succeeded for `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f` across backend unit/race/security, backend integration, frontend lint/typecheck/unit/build/audit, UI shards, accessibility, visual, performance, CSP/PWA and immutable API/Web container publication.
- Deploy Stage #2937 / run `31296173844` succeeded for the same exact product SHA after validating the exact CI deployment-scope artifact.
- Exact deployed image tags are `ghcr.io/dja-tiger/lexigo-web:237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f` and `ghcr.io/dja-tiger/lexigo-api:237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.
- Stage PostgreSQL, Redis, API and Web services were healthy; public frontend root and API readiness returned HTTP 200 on attempt 1; public smoke and public browser UI validation succeeded.
- Deployment Issue #12 records the same exact image SHA with deploy, public smoke and public browser states all `success`.
- Security baseline remains Next `16.2.11`, PostCSS `8.5.23`, Nano ID `3.3.18` and Sharp `0.35.3`; PR #448 changed no dependency or lockfile version.
- Issue #74 remains open. The canonical Dictionary catalog control target slice is fully delivered; residual whole-application live-control inventory and final real-physical-device/manual acceptance remain mandatory.
- Open unrelated maintenance PRs verified at reconciliation time: Dependabot #304, #403 and #432.

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
- PR #419: Home true-browser-zoom source merged. Product SHA `c40cd72a6ffde59f2a795b031b0dac2f3a48a38c`; authoritative collection evidence was completed by PR #426.
- PR #421: Lesson Composer true-browser-zoom source merged. Product SHA `45ed5a1d5b65887b519807b8726b65cb416a11a4`; authoritative collection evidence was completed by PR #426.
- PR #423: Active Lesson true-browser-zoom source merged. Product SHA `00774b8a4299d652c1433a5093f18e3265de5e4f`; authoritative collection evidence was completed by PR #426.
- PR #426: repaired the authoritative visual collection and added fail-closed collection/semantic contracts plus Phrases true-browser-owned 200% acceptance. Product SHA `7c641b2eea330363c80e6c666721a31eb5d60b9c`.
- PR #428: canonical populated Progress actions expose paint-inert 44/48px effective targets. Product SHA `69dc1fd2e893a932dce9facccaebc5afd5a6d2c1`.
- PR #435: canonical Active Lesson utility, recall, confidence-rating and compact navigation controls expose paint-inert 44/48px effective targets. Product SHA `3ec8b92509d72b3b435779a9ede65adc7222a50a`.
- PR #442: canonical Phrases catalog controls expose 44/48px effective targets while preserving approved compact painted geometry. Product SHA `2ee32d075b20dca000f1e10726ba8842b4685434`.
- PR #444: reusable AsyncStatePanel primary/secondary recovery actions expose a 44px fine-pointer border-box target and a border-aware 48px coarse-pointer effective target through paint-inert block-axis hit slop. Product SHA `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- PR #446: live calendar reminder route-preview action, modal close and seven custom weekday controls expose independent 44px fine-pointer / 48px coarse-pointer effective targets; compact weekdays reflow to 4+3 without target intersection. Product SHA `0700fed4f77758bc193b87d30a698ed2217a7dad`.
- PR #448: canonical Dictionary quick filters, source/status/sort/reset controls and shared pagination expose 44px fine-pointer / 48px coarse-pointer effective targets while preserving compact painted geometry; wrapped and stacked coarse targets reserve independent separation. Product SHA `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.

## Issue #74 reusable target evidence

- Reusable AsyncStatePanel recovery actions remain protected by explicit desktop/mobile effective-target, real-hit ownership, keyboard-focus and live retry-callback acceptance from PR #444.
- Live calendar reminder preview/close/weekdays remain protected by desktop/mobile effective-target, real-hit ownership, common-frame non-overlap and keyboard-focus acceptance from PR #446.
- Scroll-sensitive pairwise target geometry must be sampled from one shared scroll state or normalized coordinate system as recorded in `.agents/AGENTS.issue-74-scroll-normalized-geometry.md`.
- Browser-owned zoom acceptance must remain explicitly collected by the authoritative suites as recorded in `.agents/AGENTS.issue-74-browser-zoom-collection.md`.

## Issue #74 Dictionary catalog effective-target evidence

PR #448 final immutable-head evidence on `448faae28f91b39989bc46f8701811d48e68e832`:

- Exact product/docs base was `80b0a8d3d13f0d7ac12350867eba64f312fe750c` from reconciliation PR #447.
- Canonical `/dictionary` inventory found four quick-filter buttons painted at 34px, source/status/sort panel buttons painted at 38px, reset at 46px and shared pagination at the generic 44px minimum.
- Search clear was already owned by PR #409; result-card buttons and the mobile filter toggle were already compliant; the 44px topic select already sits inside a semantic label whose clickable area exceeds 48px.
- `frontend/app/dictionary-catalog-touch-targets.css` adds route-scoped, paint-inert block-axis effective ownership: >=44px for fine pointers and >=48px for coarse pointers without changing painted button size, border, background, transform or focus ownership.
- At <=340px wrapped quick-filter rows reserve sufficient gap for independent effective targets; coarse stacked panel groups reserve positive separation.
- `frontend/e2e/dictionary-catalog-touch-targets.spec.ts` is collected by authoritative UI and accessibility suites and runs in desktop Chromium, Android Chromium and iOS WebKit.
- Acceptance uses border-aware effective geometry, real four-side `document.elementFromPoint` ownership, one-common-frame pairwise overlap checks, semantic select labeling, visible focus and horizontal containment.
- `frontend/components/dictionary-catalog-touch-target-source.test.ts` locks stylesheet import order, live selector ownership, paint-inert declarations and authoritative collection.
- A pre-CI full-file edit briefly introduced unrelated root-layout drift; fail-closed base/head comparison rejected it and the final `layout.tsx` diff is one stylesheet import only.
- CI #3089 / run `31284029667` on superseded head `38dd2cbbebcf2e288f9197aa10091d774733f08f` exposed accidental `@types/react-dom@^19.2.8` package metadata drift through deterministic `npm ETARGET`; package metadata was restored to exact `main`/lockfile ownership and `package-lock.json` remained unchanged.
- CI #3092 / run `31284198024` and CI #3093 / run `31284616220` independently produced the same Linux Dictionary medium-Light actual: `768x1664`, SHA-256 `3e0215d2af6b4d024fddffd585752d125094b6737d987426b63f620f74577af3`.
- The previous content-addressed baseline was `768x1616`; the exact +48px page-height delta was reviewed as the intended aggregate coarse-pointer row-gap increase. Only `DICTIONARY_VISUAL_BASELINES.mediumLight` provenance/dimensions/hash changed; compact/desktop Dictionary baselines and all binary snapshots remained unchanged.
- Final immutable-head CI #3095 / run `31295450246` completed successfully across the full product matrix; the review/thread audit was clean; expected-head squash merge used exact final head `448faae28f91b39989bc46f8701811d48e68e832`.

Post-merge evidence for product SHA `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`:

- exact-SHA main CI #3096 / run `31295869109`: complete success across the full product matrix;
- backend unit/security and integration race tests succeeded;
- frontend core, both UI shards, accessibility, visual, performance, Dictionary smoke, iOS PWA, content-security and controlled-service-worker gates succeeded;
- exact-SHA API and Web container builds completed successfully and published immutable images;
- Deploy Stage #2937 / run `31296173844`: complete success on the same exact SHA;
- exact CI deployment-scope artifact validation and exact immutable API/Web image deployment: success;
- stage PostgreSQL, Redis, API and Web services healthy;
- public frontend root HTTP 200 on attempt 1 and public API readiness HTTP 200 on attempt 1;
- public smoke passed with expected CSP mode `report-only`;
- public browser validation completed successfully across the 12-test desktop Chromium/iOS WebKit matrix;
- deployment Issue #12 confirms the same exact image SHA and deploy/public states as `success`.

## Issue #74 acceptance status

Completed automated evidence:

- Confirmed live controls covered by PRs #387, #389, #391, #393, #395, #402, #405, #407, #409, #411, #413, #415, #428, #435, #442, #444, #446 and #448 meet their route-specific 44/48px target, spacing, focus and callback contracts.
- Canonical mobile-navigation labels scale under root-text enlargement without clipping, ellipsis, target overlap or horizontal overflow.
- Word Detail has permanent authoritative true 200% browser-owned zoom evidence.
- The authoritative collection permanently executes Home, Learn and Active Lesson true-browser-zoom owners and contains fail-closed source protection against silently dropping them.
- Canonical Phrases has authoritative true-browser-owned 200% zoom evidence plus explicit desktop/mobile real-hit-target acceptance for catalog controls.
- Canonical populated Progress and Active Lesson have explicit desktop/mobile effective-target and real-hit-testing acceptance while preserving approved visual baselines.
- Reusable AsyncStatePanel, calendar-reminder and Dictionary catalog target owners have explicit multi-browser real-hit and non-overlap regression protection.
- Expanded targets preserve accessible names, runtime callbacks, navigation/API semantics and approved compact painted geometry for the delivered slices.

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

- Product PR #448 is merged and fully delivered through immutable-head CI, clean review/thread audit, expected-head squash merge, exact-SHA main CI and exact-image Stage/public validation.
- Current product runtime and Stage are validated on exact image SHA `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.
- Repository memory is being reconciled in docs-only branch `docs/issue-74-dictionary-catalog-reconcile` from that exact product base; reconciliation PR number is pending creation at this record revision.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset exactly to canonical templates before the next product slice.
- The browser-zoom collection contract and scroll-normalized geometry rules remain permanent fail-closed protection.
- Progress, Active Lesson, Phrases catalog, reusable system-state, live calendar-reminder and Dictionary catalog effective-target slices are merged and preserved by the current deployed product.
- The next product work is residual whole-application Issue #74 live-control inventory; only evidenced gaps should produce additional product slices.
- Physical-device acceptance remains a separate final manual validation gate and is not claimed by automated browser evidence.
- Dependabot PRs #304, #403 and #432 remain separate maintenance work.

## Remaining roadmap

- Issue #74: complete residual live-control audit/remediation and final real-device acceptance; close the Issue only after all mandatory criteria are evidenced.
- Issue #78 CSP implementation and Stage evidence are complete, but final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Dependabot PRs #304, #403 and #432 require separate review, immutable-head CI and deployment treatment according to changed scope.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices after Issue #74 is completed or explicitly blocked by the manual hardware gate.

## Reconciliation evidence

- Docs-only reconciliation PR #447 merged as `80b0a8d3d13f0d7ac12350867eba64f312fe750c` and became the exact base for PR #448.
- PR #448 merged from final developer-authored head `448faae28f91b39989bc46f8701811d48e68e832` to product SHA `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.
- PR #448 final immutable-head CI #3095 / run `31295450246` completed successfully.
- Exact-SHA main CI #3096 / run `31295869109` completed successfully and published exact API/Web images.
- Deploy Stage #2937 / run `31296173844` consumed the exact CI scope, deployed the exact product image SHA and completed public endpoint plus public browser UI validation successfully.
- Deployment Issue #12 records the exact product SHA `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f` with deploy, public smoke and public browser states all `success`.
- Current reconciliation branch is `docs/issue-74-dictionary-catalog-reconcile`; its PR number and final docs merge SHA must be appended after the PR is opened and validated.
- Issue #74 remains open only for residual live-control inventory/remediation and physical-device/manual acceptance.
- No local clone result is counted as authoritative evidence; GitHub CI/Stage remain the execution source of truth.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
