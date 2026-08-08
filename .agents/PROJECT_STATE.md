# LexiGo Project State

## Verification

- Last verified: 2026-08-08 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Verified product `main` before this reconciliation: `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- Latest deployed product SHA: `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- Latest merged Issue #74 product slice is PR #444, final developer-authored head `c38c4504d4f69260256b17f17e8622cec78f1003`, squash product SHA `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- PR #444 immutable-head CI #3058 / run `31273755526` succeeded across the full product matrix, including both authoritative UI shards and both container builds.
- Exact-SHA main CI #3059 / run `31274280827` succeeded for `2b835258477e05f00a7f29fd6972e62853dea1f9` across the full product matrix, including desktop Chromium, Android Chromium, iOS WebKit, visual, accessibility, performance, CSP/PWA and immutable API/Web container publication.
- Deploy Stage #2900 / run `31274687604` succeeded for the same exact product SHA after validating the exact CI deployment-scope artifact.
- Exact deployed image tags are `ghcr.io/dja-tiger/lexigo-web:2b835258477e05f00a7f29fd6972e62853dea1f9` and `ghcr.io/dja-tiger/lexigo-api:2b835258477e05f00a7f29fd6972e62853dea1f9`; both services were healthy in deployment evidence.
- Stage PostgreSQL, Redis, API and Web services were healthy; public frontend root and API readiness returned HTTP 200 on the first attempt.
- Public browser validation passed 12/12 across desktop Chromium and iOS WebKit for `/`, `/learn`, `/phrases`, `/dictionary`, `/progress` and stale-build recovery.
- Deployment Issue #12 records Stage `success`, image SHA `2b835258477e05f00a7f29fd6972e62853dea1f9`, deploy `success`, public smoke `success` and public browser `success`.
- Security baseline remains Next `16.2.11`, PostCSS `8.5.23`, Nano ID `3.3.18` and Sharp `0.35.3`; PR #444 changed no dependency or lockfile version.
- Issue #74 remains open. The reusable AsyncStatePanel/system-state recovery-action target slice is fully delivered; residual whole-application live-control inventory and final real-physical-device/manual acceptance remain mandatory.
- Dependabot PRs #304, #403 and #432 remain unrelated maintenance.

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

## Issue #74 system-state effective-target evidence

PR #444 final immutable-head evidence on `c38c4504d4f69260256b17f17e8622cec78f1003`:

- Exact product base was docs-only reconciled SHA `f7067b5d30ed944c8431233fbb21ae1d9b27a765` from PR #443.
- The shared AsyncStatePanel action owner was a confirmed residual gap: routed actions already had a 44px painted button border box but no guaranteed 48px coarse-pointer target.
- `frontend/app/system-state-touch-targets.css` supplies a narrowly scoped paint-inert pseudo hit surface. Fine pointers keep the normal button border box; coarse pointers add 3px on each block edge and no inline expansion.
- The 3px coarse inset is border-aware: routed primary/ghost buttons may have a 1px border, so the absolutely positioned pseudo element can start from a 42px padding box; 3px per block edge guarantees a 48px worst-case pseudo surface.
- `frontend/e2e/system-state-touch-targets.spec.ts` exercises the live Dictionary correlated-error/retry action and is explicitly collected by authoritative UI and accessibility suites.
- Acceptance runs in desktop Chromium, Android Chromium and iOS WebKit and requires 44/48px minimum effective geometry, four `document.elementFromPoint` perimeter hits, transparent/borderless/shadowless pseudo paint, visible keyboard focus, retry recovery, preserved query and no horizontal overflow.
- Effective geometry is measured as the union of the clickable button border box and the transparent pseudo surface; viewport normalization keeps that complete union inside a safe viewport margin before hit probing.
- Existing visual baselines remained unchanged, confirming the accessibility implementation is paint-inert.
- Review/thread audit before Ready found no PR comments or review threads; expected-head squash merge used the immutable final developer-authored head.

Development failure classification retained for future slices:

- CI #3050 / run `31253827648` on candidate `6e37feee6dc62b242004e7e53207a34b3f39303b` failed only UI shard 2 because Android Chromium and iOS WebKit missed the lower perimeter point after `scrollIntoViewIfNeeded()`. Size assertions had already passed. Root cause was acceptance viewport normalization, not product CSS; commit `43bbe0edfe9bedfd75e162dcf439710cf3d7d088` centered the owner and kept the complete effective target inside the viewport without weakening any target assertion.
- CI #3054 / run `31273126592` on candidate `e29649157939c719775fdf5d552a9e2296f818f3` exposed two distinct facts: desktop 42px was an acceptance-model error from measuring the pseudo padding box alone, while Android/iOS 46px was a real product gap because `inset-block: -2px` expanded a 42px pseudo base only to 46px.
- Product recovery `d9688d649945d3e928df50cc425559ed5cd613f6` changed coarse block inset from -2px to -3px; acceptance recovery `34637795268b65c09b7101a46ef6209a88baebfe` measures the union of the button border box and pseudo surface.
- Final immutable-head CI #3058 / run `31273755526` completed successfully across the full product matrix on `c38c4504d4f69260256b17f17e8622cec78f1003`.

Post-merge evidence for product SHA `2b835258477e05f00a7f29fd6972e62853dea1f9`:

- exact-SHA main CI #3059 / run `31274280827`: complete success across the full product matrix;
- authoritative UI shard 1 and shard 2 both completed successfully on the merge SHA;
- exact-SHA API and Web container builds completed successfully and published immutable GHCR images;
- Deploy Stage #2900 / run `31274687604`: complete success;
- exact CI deployment-scope artifact validation: success;
- exact immutable API/Web image deployment: success;
- stage PostgreSQL, Redis, API and Web services healthy;
- public frontend root HTTP 200 on attempt 1;
- public API readiness HTTP 200 on attempt 1;
- public smoke passed with expected CSP mode `report-only`;
- public browser validation: 12/12 passed across desktop Chromium and iOS WebKit;
- deployment Issue #12 confirms the same exact image SHA and all deploy/public validation states as `success`.

## Issue #74 acceptance status

Completed automated evidence:

- Confirmed live controls covered by PRs #387, #389, #391, #393, #395, #402, #405, #407, #409, #411, #413, #415, #428, #435, #442 and #444 meet their route-specific 44/48px target, spacing, focus and callback contracts.
- Canonical mobile-navigation labels scale under root-text enlargement without clipping, ellipsis, target overlap or horizontal overflow.
- Word Detail has permanent authoritative true 200% browser-owned zoom evidence.
- The authoritative collection permanently executes Home, Learn and Active Lesson true-browser-zoom owners and contains fail-closed source protection against silently dropping them.
- Canonical Phrases has authoritative true-browser-owned 200% zoom evidence plus explicit desktop/mobile real-hit-target acceptance for catalog controls.
- Canonical populated Progress and Active Lesson have explicit desktop/mobile effective-target and real-hit-testing acceptance while preserving approved visual baselines.
- Reusable AsyncStatePanel recovery actions now have explicit desktop/mobile effective-target, real hit ownership, keyboard focus and live retry-callback acceptance.
- Expanded targets preserve accessible names, runtime callbacks, navigation/API semantics and compact visual layout for the delivered slices.

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

- Product PR #444 is merged and fully delivered through immutable-head CI, clean review audit, expected-head squash merge, exact-SHA main CI and exact-image Stage/public validation.
- Current product runtime and Stage are validated on exact image SHA `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- Repository memory is being reconciled in a docs-only PR from that exact product base; `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset exactly to canonical templates before the next product slice.
- The dormant browser-zoom collection defect remains closed and protected by `.agents/AGENTS.issue-74-browser-zoom-collection.md` plus `frontend/components/browser-zoom-collection-contract.test.ts`.
- Progress, Active Lesson, Phrases catalog and reusable system-state effective-target slices are merged and preserved by the current deployed product.
- The next product work is residual whole-application Issue #74 live-control inventory; only evidenced gaps should produce additional product slices.
- Physical-device acceptance remains a separate final manual validation gate and is not claimed by automated browser evidence.
- Dependabot PRs #304, #403 and #432 remain separate maintenance work.

## Remaining roadmap

- Issue #74: complete residual live-control audit/remediation and final real-device acceptance; close the Issue only after all mandatory criteria are evidenced.
- Issue #78 CSP implementation and Stage evidence are complete, but final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Dependabot PRs #304, #403 and #432 require separate review, immutable-head CI and deployment treatment according to changed scope.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices after Issue #74 is completed or explicitly blocked by the manual hardware gate.

## Reconciliation evidence

- Docs-only reconciliation #443 merged as `f7067b5d30ed944c8431233fbb21ae1d9b27a765`; exact docs-only main CI #3049 / run `31253606487` succeeded and became the exact base for PR #444.
- PR #444 merged from final developer-authored head `c38c4504d4f69260256b17f17e8622cec78f1003` to product SHA `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- PR #444 final immutable-head CI #3058 / run `31273755526` completed successfully.
- Exact-SHA main CI #3059 / run `31274280827` completed successfully and published exact API/Web images.
- Deploy Stage #2900 / run `31274687604` consumed the exact CI scope, deployed the exact product image SHA and completed public endpoint plus 12/12 public browser validation successfully.
- Issue #74 remains open only for residual live-control inventory/remediation and physical-device/manual acceptance.
- No local clone result is counted as authoritative evidence; GitHub CI/Stage remain the execution source of truth.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
