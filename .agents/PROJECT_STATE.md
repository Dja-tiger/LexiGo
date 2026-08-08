# LexiGo Project State

## Verification

- Last verified: 2026-08-08 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Verified product `main` before this reconciliation: `3ec8b92509d72b3b435779a9ede65adc7222a50a`.
- Latest deployed product SHA: `3ec8b92509d72b3b435779a9ede65adc7222a50a`.
- Latest merged Issue #74 product slice is PR #435, final developer-authored head `18f3dcd48cbec48ccf7bdb706d43bfab0e48f0fb`, squash product SHA `3ec8b92509d72b3b435779a9ede65adc7222a50a`.
- Exact-SHA main CI #3024 / run `31233432643` succeeded for `3ec8b92509d72b3b435779a9ede65adc7222a50a` across the full product matrix including both container builds.
- Deploy Stage #2865 / run `31233790755` succeeded for the same exact SHA after validating the exact CI deployment-scope artifact.
- Exact currently deployed image tags are `ghcr.io/dja-tiger/lexigo-web:3ec8b92509d72b3b435779a9ede65adc7222a50a` and `ghcr.io/dja-tiger/lexigo-api:3ec8b92509d72b3b435779a9ede65adc7222a50a`; both services were healthy in the deployment evidence.
- Public Stage frontend and API smoke returned HTTP 200 on the first attempt; public browser validation passed 12/12 across desktop Chromium and iOS WebKit for `/`, `/learn`, `/phrases`, `/dictionary`, `/progress` and stale-build recovery.
- Security baseline from prerequisite PR #431 remains Next `16.2.11`, PostCSS `8.5.23`, Nano ID `3.3.18` and Sharp `0.35.3`; PR #435 changed no dependency or lockfile version.
- Issue #74 remains open. The Active Lesson live-control target slice is fully delivered; residual whole-application live-control inventory and final real-physical-device/manual acceptance remain mandatory.
- Dependabot PRs #304, #305 and #403 remain unrelated maintenance.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, review audit, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.
- A green workflow proves only the tests selected by its effective command and configuration. A source file that is not collected by Playwright is not acceptance evidence.
- Exact deployment claims require immutable image tags, exact CI-scope validation, healthy deployed services, public endpoint smoke and public browser evidence.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.
- One PR contains one atomic slice. Product work does not continue through stale Agent Harness state.
- Automatic and manual deploy jobs share `group: deploy-stage` with `cancel-in-progress: true`; only an accepted state-mutating deploy job enters that concurrency group.
- Skipped workflow-run consumers, including Dependabot-triggered consumers, are not deployment evidence.
- A GitHub-hosted runner setup failure before checkout is infrastructure evidence only; an exact-job rerun is acceptable only when the workflow run and product SHA remain unchanged and full scope/deploy validation subsequently succeeds.

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
- PR #397: readable rem-responsive canonical mobile-navigation labels and 48px targets under compact width and 200% root-text enlargement. Product SHA `597e1fcf5c707ca07b6b3fb4783352be91d0555b`.
- PR #402: unfinished-lesson `Сбросить` and `Продолжить урок` 44/48px effective targets. Product SHA `ecbd6ac3ec16f77f7d34aca8782d1182bf5db090`.
- PR #405: canonical Home `Открыть прогресс` 44/48px target. Product SHA `2ba2c279f0a460dacd8972ac08b8c0e277342a0b`.
- PR #407: Phrases `Очистить поиск` contained 44/48px target with separation from `Найти`. Product SHA `f36c70d4b21477f2df63500d97c20715bc4b3db3`.
- PR #409: Dictionary `Очистить поиск` contained 44/48px target. Product SHA `65cb8c675e40ed654f5b1779d0ee57e34cf112ec`.
- PR #411: Word Detail Back 44/48px target with Dictionary-state restoration. Product SHA `3b8f3c39faee1223e3773935c761eb7903409868`.
- PR #413: Word Detail related-phrase 44/48px targets with non-overlap. Product SHA `477bccd8f38e648a3ad536dcc58526303297a376`.
- PR #415: retryable Word Detail related-phrase `Повторить` 44/48px target and same-request recovery. Product SHA `51e3ee5a6ea63146bdb7eb7d0faa9e351c52f56b`.
- PR #417: canonical Word Detail true 200% browser-owned Chromium zoom, responsive reflow, containment, de-sticky content, visible focus and no runtime errors. Product SHA `5d864970103479863fc74ad76009a33030842420`.
- PR #419: Home true-browser-zoom source merged. Product SHA `c40cd72a6ffde59f2a795b031b0dac2f3a48a38c`; authoritative collection evidence was completed later by PR #426.
- PR #421: Lesson Composer true-browser-zoom source merged. Product SHA `45ed5a1d5b65887b519807b8726b65cb416a11a4`; authoritative collection evidence was completed later by PR #426.
- PR #423: Active Lesson true-browser-zoom source merged. Product SHA `00774b8a4299d652c1433a5093f18e3265de5e4f`; authoritative collection evidence was completed later by PR #426.
- PR #426: repaired the explicit authoritative visual collection, added fail-closed collection/semantic contracts, synchronized dormant Home/Learn/Active tests with current canonical IA/CSS/ARIA behavior and added canonical Phrases true-browser-owned 200% acceptance without product runtime/CSS/API changes. Product SHA `7c641b2eea330363c80e6c666721a31eb5d60b9c`.
- PR #428: canonical populated Progress actions expose 44px fine-pointer / 48px coarse-pointer effective targets through paint-inert block-axis hit slop while preserving approved painted geometry. Product SHA `69dc1fd2e893a932dce9facccaebc5afd5a6d2c1`.
- PR #435: canonical Active Lesson utility, recall text-action, confidence-rating and compact Back/Close controls expose 44px fine-pointer / 48px coarse-pointer effective targets through a dedicated paint-inert target owner while preserving approved 44px painted geometry. Product SHA `3ec8b92509d72b3b435779a9ede65adc7222a50a`.

## Issue #74 browser-zoom evidence

PR #426 final authoritative Visual regression evidence on immutable head `10b4cc87d7d4af2f04498506ed758414f76a8e7a`:

- CI #2983 / run `31166237906` completed successfully across every required product gate.
- Visual job `92828059911` reported `Running 141 tests`, `57 passed`, `84 skipped`, `0 failed`.
- The log explicitly executed the Home, Learn and Active Lesson standalone true-browser-zoom owners, the Phrases browser-owned zoom case and the previously authoritative Word Detail browser-owned zoom case.
- Home expectations follow the effective 720px CSS boundary rather than assuming a non-existent one-column breakpoint.
- Learn roving-radio focus evidence targets the checked/tabbable radio instead of a DOM-first `tabindex=-1` item.
- Home geometry evidence follows the confirmed same-row two-column topology and does not assert contradictory vertical stacking.
- Home, Learn, Active Lesson and Phrases focus-visible evidence originates from keyboard navigation rather than direct programmatic focus.
- All eight existing Phrases Light/Dark compact/desktop content-addressed visual cases executed without baseline mismatch or baseline update.
- Browser-owned zoom is controlled through the established per-tab MV3 mechanism and independently checked through browser/CDP/DOM telemetry as required by the Issue #74 harness rule.

Post-merge evidence for product SHA `7c641b2eea330363c80e6c666721a31eb5d60b9c`:

- exact-SHA main CI #2984 / run `31167034122`: complete success;
- Deploy Stage #2826 / run `31167741474`: complete success;
- exact CI deployment scope validation: success;
- exact immutable image deployment: success;
- public frontend/API smoke: success;
- public browser UI validation: success;
- deployment Issue #12 confirms both exact images healthy on stage.

## Issue #74 Progress effective-target evidence

PR #428 final immutable-head evidence on `b84a88f6f3d250ce54c4098c9847d994361a61d0`:

- CI #2995 / run `31207726893`: complete success across backend, frontend core, browser matrix, accessibility, visual, performance and both container gates.
- Linux Visual regression passed the existing Progress and calendar-dialog baselines without snapshot updates, proving the accessibility implementation is paint-inert at the approved layout boundary.
- The Progress target acceptance ran in desktop Chromium, iOS WebKit and Android Chromium and requires actual `document.elementFromPoint` perimeter hits rather than painted-box size alone.
- Effective target expansion is block-axis only (`inset-inline: 0`), with explicit non-overlap assertions against weak-area status badges and neighboring actions.
- Weak-area painted buttons intentionally remain below the 44/48px effective minimum; transparent hit slop supplies the accessibility target without redesigning the card layout.
- Keyboard focus-visible behavior, native `details/summary` disclosure semantics, compact horizontal containment and exact global/topic/source Recall callbacks remain covered.

Post-merge evidence for product SHA `69dc1fd2e893a932dce9facccaebc5afd5a6d2c1`:

- exact-SHA main CI #2996 / run `31208560099`: complete success;
- Deploy Stage #2838 / run `31209280600`: complete success;
- exact CI deployment scope validation: success;
- exact immutable API/Web image deployment: success;
- public frontend/API smoke: success;
- public browser UI validation: 12/12 passed across desktop Chromium and iOS WebKit, including `/progress`;
- deployment Issue #12 confirms both exact images healthy on stage.

CI failure classification during PR #428 development:

- Initial direct `min-height` expansion produced a real compact visual regression (Progress/calendar-dialog height 1900px -> 1916px). It was not retried or baselined away; production CSS was corrected to the existing paint-inert hit-slop pattern.
- A later compact Progress hit-test failure was traced from Playwright evidence to `document.elementFromPoint()` receiving off-screen coordinates for the activity disclosure. The test helper was corrected with `scrollIntoViewIfNeeded()` before viewport-relative hit testing; production CSS was intentionally unchanged.

## Security prerequisite after PR #428

PR #431 remediated newly published dependency-audit blockers before the next Issue #74 product slice:

- product/dependency SHA: `a2cb82b2415e0695120ec666b86690cbcd91f12d`;
- exact-SHA main CI run `31222428133`: success;
- Deploy Stage #2852 / run `31223081467`: success on the same SHA;
- PostCSS baseline: `8.5.23`;
- Nano ID baseline: `3.3.18`;
- Next remains `16.2.11` and Sharp remains `0.35.3`;
- this security delivery is a prerequisite preserved by the current deployed product.

## Issue #74 Active Lesson effective-target evidence

PR #435 final immutable-head evidence on `18f3dcd48cbec48ccf7bdb706d43bfab0e48f0fb`:

- PR #435 was recreated from exact reconciled base `c73011f423a5d46afa433bbdff49b9223b0552c0` after docs-only reconciliation #434, rather than carrying stale #433 branch ancestry.
- CI #3023 / run `31232953312`: complete success across backend, frontend core, full browser matrix, accessibility, visual, performance and both container gates.
- Review audit before merge found 0 comments, 0 reviews and 0 review threads; the developer-authored head remained immutable through Ready and merge.
- The route-scoped `frontend/app/active-lesson-touch-targets.css` expands only the effective hit surface to 44px fine-pointer / 48px coarse-pointer minimums; approved painted 44px geometry remains unchanged.
- Permanent acceptance is explicitly collected by `test:e2e:lesson` and runs on desktop Chromium, iOS WebKit and Android Chromium.
- Acceptance verifies effective width/height, viewport containment, all four `document.elementFromPoint` perimeter hits, keyboard focus-visible behavior and compact horizontal containment.
- The first #433 CI exposed a deterministic iOS WebKit test-harness edge case: Playwright scrolled the 44px border box into view but not the larger pseudo hit surface. The retained trace identified `Не знал` as the failing control; the remediation scrolls the expanded target into the viewport without reducing the 48px minimum or weakening perimeter assertions.
- Linux Visual regression passed without snapshot updates, confirming the final target implementation is paint-inert at the approved layout boundary.

Post-merge evidence for product SHA `3ec8b92509d72b3b435779a9ede65adc7222a50a`:

- exact-SHA main CI #3024 / run `31233432643`: complete success across the full product matrix;
- both exact-SHA `api` and `web` container builds succeeded and published immutable GHCR images;
- Deploy Stage #2865 / run `31233790755`: complete success;
- exact CI deployment-scope artifact validation: success;
- exact immutable API/Web image deployment: success;
- stage `api`, `web`, PostgreSQL and Redis services healthy in deployment evidence;
- public frontend root returned HTTP 200 on attempt 1;
- public API readiness returned HTTP 200 on attempt 1;
- public smoke passed with expected CSP mode `report-only`;
- public browser UI validation: 12/12 passed across desktop Chromium and iOS WebKit for `/`, `/learn`, `/phrases`, `/dictionary`, `/progress` and stale-build recovery;
- deployment Issue #12 records `Stage: success`, image SHA `3ec8b92509d72b3b435779a9ede65adc7222a50a`, deploy `success`, public smoke `success`, public browser `success`.

## Issue #74 acceptance status

Completed automated evidence:

- Confirmed live controls covered by PRs #387, #389, #391, #393, #395, #402, #405, #407, #409, #411, #413, #415, #428 and #435 meet their route-specific 44/48px target, spacing, focus and callback contracts.
- Canonical mobile-navigation labels scale under root-text enlargement without clipping, ellipsis, target overlap or horizontal overflow.
- Word Detail has permanent authoritative true 200% browser-owned zoom evidence.
- The authoritative collection permanently executes Home, Learn and Active Lesson true-browser-zoom owners and contains fail-closed source protection against silently dropping them.
- Canonical Phrases has authoritative true-browser-owned 200% zoom evidence inside the already collected Phrases visual owner.
- Canonical populated Progress has explicit desktop/mobile effective-target and real hit-testing acceptance while preserving approved visual baselines.
- Canonical Active Lesson utility, recall action, rating and compact navigation controls have explicit desktop/mobile effective-target and real hit-testing acceptance while preserving approved visual geometry.
- Expanded targets preserve keyboard focus, accessible names, runtime callbacks, route navigation, API semantics and content clearance for the delivered slices.

Remaining / validation pending:

- Perform the residual whole-application live-control inventory against the Issue #74 affected screens and remediate only controls still confirmed below the 44px fine-pointer / 48px coarse-pointer contracts or with intersecting target geometry.
- Confirm that all remaining primary, secondary, text-only and icon controls in the affected Header, bottom navigation, Home, Learn, Phrases, Dictionary, Lesson and Progress surfaces are either already covered by canonical shared contracts or receive explicit bounded regression evidence.
- Perform final manual acceptance on real physical mobile hardware. This is a required Issue criterion and cannot be replaced by Playwright emulation, desktop browser zoom, root-font enlargement or Stage smoke.

Issue #74 stays open until those remaining criteria are proven.

## Completed CI/CD control-plane slice

### PR #400 — deploy-job-only stage concurrency

- Workflow-level concurrency was removed from `Deploy Stage`.
- The exact CI-scope job remains unconstrained and fail-closed.
- Only an accepted state-mutating deploy job carries `group: deploy-stage` and `cancel-in-progress: true`.
- Skipped pull-request, Dependabot, docs-only and otherwise non-deployable workflow runs cannot cancel an authoritative deployment.
- Product SHA `ad45e9ca4b21114dee979495dfb89da3b43eab7f`.

## Current state

- Repository-memory reconciliation is active on docs-only branch `docs/reconcile-project-state-3ec8-issue74-active`; no product/runtime file is allowed in that diff.
- Current product runtime and Stage are validated on exact image SHA `3ec8b92509d72b3b435779a9ede65adc7222a50a` after PR #435.
- PR #435 is merged and fully delivered through immutable-head CI, exact-SHA main CI and exact-image Stage/public validation.
- The dormant browser-zoom collection defect remains closed and protected by `.agents/AGENTS.issue-74-browser-zoom-collection.md` plus `frontend/components/browser-zoom-collection-contract.test.ts`.
- The Progress and Active Lesson effective-target slices are merged and preserved by the current deployed product.
- The next product work is residual whole-application Issue #74 live-control inventory; only evidenced gaps should produce additional product slices.
- Physical-device acceptance remains a separate final manual validation gate and is not claimed by automated browser evidence.
- Dependabot PRs #304, #305 and #403 remain separate maintenance work.

## Remaining roadmap

- Issue #74: complete residual live-control audit/remediation and final real-device acceptance; close the Issue only after all mandatory criteria are evidenced.
- Issue #78 CSP implementation and stage evidence are complete, but final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Dependabot PRs #304, #305 and #403 require separate review, immutable-head CI and deployment treatment according to changed scope.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices after Issue #74 is completed or explicitly blocked by the manual hardware gate.

## Reconciliation evidence

- PR #428 merged from final developer-authored head `b84a88f6f3d250ce54c4098c9847d994361a61d0` to product SHA `69dc1fd2e893a932dce9facccaebc5afd5a6d2c1`.
- Production `frontend/app/progress-evidence.css` owns the route-level 44px target token, 48px coarse-pointer override and transparent block-axis hit surface without inline expansion.
- Existing collected `frontend/e2e/progress-evidence.spec.ts` owns the permanent effective-target, perimeter hit-test, non-overlap, focus and callback contracts.
- PR #428 CI #2995 / run `31207726893` completed successfully on the exact immutable PR head.
- Exact-SHA main CI #2996 / run `31208560099` completed successfully on the squash product SHA.
- Deploy Stage #2838 / run `31209280600` consumed the exact CI scope, deployed exact API/Web image tags for `69dc1fd2e893a932dce9facccaebc5afd5a6d2c1` and completed public endpoint plus 12/12 public browser validation successfully.
- Security prerequisite #431 advanced product/dependency runtime to `a2cb82b2415e0695120ec666b86690cbcd91f12d`; exact-SHA main CI run `31222428133` and Deploy Stage #2852 / run `31223081467` both succeeded for that exact SHA.
- Docs-only reconciliation #434 updated repository memory before the replacement product delivery and merged as `c73011f423a5d46afa433bbdff49b9223b0552c0` after CI #3020 / run `31232770284` validated its one-file Agent Docs scope.
- Stale PR #433 was closed without merge after its CI artifacts were used to diagnose and correct the iOS WebKit pseudo-target scrolling edge case; its later successful CI was diagnostic only, not merge evidence.
- PR #435 merged from final developer-authored head `18f3dcd48cbec48ccf7bdb706d43bfab0e48f0fb` to product SHA `3ec8b92509d72b3b435779a9ede65adc7222a50a`.
- PR #435 CI #3023 / run `31232953312` completed successfully on the exact immutable PR head after a clean review/thread audit.
- Exact-SHA main CI #3024 / run `31233432643` completed successfully on the squash product SHA and published exact API/Web images.
- Deploy Stage #2865 / run `31233790755` consumed the exact CI scope, deployed exact API/Web image tags for `3ec8b92509d72b3b435779a9ede65adc7222a50a` and completed public endpoint plus 12/12 public browser validation successfully.
- Deployment Issue #12 confirms Stage `success`, exact image SHA `3ec8b92509d72b3b435779a9ede65adc7222a50a`, deploy `success`, public smoke `success` and public browser `success`.
- Issue #74 remains open only for residual live-control inventory/remediation and physical-device/manual acceptance.
- No local clone result is counted as authoritative evidence; GitHub CI/Stage remain the execution source of truth.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
