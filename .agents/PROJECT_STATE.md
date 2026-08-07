# LexiGo Project State

## Verification

- Last verified: 2026-08-06 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Verified `main` before this reconciliation: `e390469466e881ee49f5009752e60e545f5cf898`.
- Latest deployed product SHA: `00774b8a4299d652c1433a5093f18e3265de5e4f`.
- Latest merged Issue #74 slice: PR #423, final developer-authored head `6a480d3d6ea059a5554456fb8f3e3daa3960411a`, squash product SHA `00774b8a4299d652c1433a5093f18e3265de5e4f`.
- PR #423 CI #2959 / run `31112824242`, exact-SHA main CI #2960 / run `31113769002` and Deploy Stage #2798 / run `31114604343` completed successfully for the configured repository gates and immutable product image.
- Exact deployed image tags remain `ghcr.io/dja-tiger/lexigo-web:00774b8a4299d652c1433a5093f18e3265de5e4f` and `ghcr.io/dja-tiger/lexigo-api:00774b8a4299d652c1433a5093f18e3265de5e4f`.
- Stage deploy, public endpoint smoke and public browser smoke remain valid for the deployed product image.
- The intended Home, Learn and Active Lesson true-browser-zoom acceptance evidence is **validation pending**, not completed: their standalone specs are excluded from the authoritative visual configuration and were not executed by PR #423 CI.
- Word Detail remains the only confirmed true-browser-zoom route because its browser-owned zoom case is inside the allow-listed `word-detail-visual.spec.ts` and appears in the authoritative visual job log.
- Issue #74 remains open. Its previous completion comments for PRs #419, #421 and #423 overstate browser-zoom evidence and must not be used as acceptance proof until the gate is repaired and rerun.
- Open PRs #304, #305 and #403 are unrelated Dependabot maintenance.

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
- PR #417: confirmed canonical Word Detail true 200% browser-owned Chromium zoom, responsive reflow, containment, de-sticky content, visible focus and no runtime errors. The case is collected by `playwright.visual.config.ts` through `word-detail-visual.spec.ts`. Product SHA `5d864970103479863fc74ad76009a33030842420`.

## Merged Issue #74 browser-zoom specs with validation pending

### PR #419 — Home

- Added `frontend/e2e/home-browser-zoom.spec.ts` with exact-tab MV3 zoom ownership, independent CDP telemetry, responsive Home geometry and focus assertions.
- The file is not present in `playwright.visual.config.ts.testMatch`; authoritative CI did not execute it.
- Product SHA `c40cd72a6ffde59f2a795b031b0dac2f3a48a38c` records the merged source, not completed zoom acceptance.

### PR #421 — Lesson Composer

- Added `frontend/e2e/learn-browser-zoom.spec.ts` for collapsed and expanded `/learn` states under browser-owned zoom factor `2`.
- The file is not present in `playwright.visual.config.ts.testMatch`; authoritative CI did not execute it.
- Product SHA `45ed5a1d5b65887b519807b8726b65cb416a11a4` records the merged source, not completed zoom acceptance.

### PR #423 — Active Lesson

- Added `frontend/e2e/active-lesson-browser-zoom.spec.ts` for canonical Recall geometry, focus and `backlog` → reveal → `Знал` → `Дальше` review semantics.
- The file is not present in `playwright.visual.config.ts.testMatch`; authoritative CI #2959 visual job `92655323130` did not execute it.
- Product SHA `00774b8a4299d652c1433a5093f18e3265de5e4f` records the merged source and deployed unchanged runtime, not completed Active Lesson zoom acceptance.

## Issue #74 acceptance status

Completed:

- Confirmed live controls covered by PRs #387, #389, #391, #393, #395, #402, #405, #407, #409, #411, #413 and #415 meet their route-specific 44/48px target, spacing, focus and callback contracts.
- Canonical mobile-navigation labels scale under root-text enlargement without clipping, ellipsis, target overlap or horizontal overflow.
- Word Detail has authoritative automated Chromium evidence for true 200% browser-owned zoom.
- Expanded targets preserve keyboard focus, accessible names, runtime callbacks, route navigation, API semantics and content clearance.

Validation pending / still open:

- Add `home-browser-zoom.spec.ts`, `learn-browser-zoom.spec.ts` and `active-lesson-browser-zoom.spec.ts` to an authoritative Playwright collection boundary and prove from CI logs that each named case executes on the immutable PR head.
- Continue whole-application true 200% browser-zoom acceptance with separate route-bounded slices after the dormant gate is repaired; Phrases is the next selected route boundary.
- Audit and remediate remaining confirmed live preview, sticky-action, header/icon and route-specific controls.
- Prove all remaining primary, secondary, text-only and icon controls meet minimum target and spacing contracts across affected routes.
- Complete final physical-device acceptance before Issue #74 can close.

Issue #74 remains open. Merged source and green configured CI are not equivalent to completed acceptance when the intended test was not collected.

## Completed CI/CD control-plane slice

### PR #400 — deploy-job-only stage concurrency

- Workflow-level concurrency was removed from `Deploy Stage`.
- The exact CI-scope job remains unconstrained and fail-closed.
- Only an accepted state-mutating deploy job carries `group: deploy-stage` and `cancel-in-progress: true`.
- Skipped pull-request, Dependabot, docs-only and otherwise non-deployable workflow runs cannot cancel an authoritative deployment.
- Product SHA `ad45e9ca4b21114dee979495dfb89da3b43eab7f`.

## Current state

- No product slice is active while this documentation discrepancy is reconciled.
- Product runtime and stage remain validated on exact image SHA `00774b8a4299d652c1433a5093f18e3265de5e4f`; no runtime regression was discovered.
- Home, Learn and Active Lesson browser-zoom acceptance is validation pending because their standalone specs are dormant.
- The next product slice must first repair the authoritative visual collection boundary, retain all existing content-addressed baselines, and add the bounded canonical `/phrases` browser-owned zoom audit without changing product runtime unless a reproduced defect requires it.
- Dependabot PRs #304, #305 and #403 remain separate maintenance work.

## Remaining roadmap

- Issue #74: repair dormant browser-zoom collection, run Home/Learn/Active Lesson evidence, add Phrases true-browser-zoom acceptance, audit remaining live controls and complete physical-device validation.
- Issue #78 CSP implementation and stage evidence are complete, but final acceptance requires an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Dependabot PRs #304, #305 and #403 require separate review, immutable-head CI and deployment treatment according to changed scope.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices.

## Reconciliation evidence

- `frontend/package.json` maps `test:e2e:visual` to `playwright test --config=playwright.visual.config.ts`.
- At verified `main`, `playwright.visual.config.ts.testMatch` contains only `visual-regression.spec.ts`, `word-detail-visual.spec.ts`, `profile-visual.spec.ts`, `system-states-visual.spec.ts` and `phrases-visual.spec.ts`.
- PR #423 authoritative Visual regression job `92655323130` reported `Running 129 tests`, `53 passed`, `76 skipped` and listed only those five files.
- The same job explicitly executed `Word Detail browser-owned zoom › desktop 200% browser zoom reflows without clipping, overlap or sticky obstruction` from `word-detail-visual.spec.ts`.
- The job log contains no Home, Lesson Composer or Active Lesson browser-owned zoom test name and no reference to their standalone spec files.
- Therefore PR CI success, main CI success and stage deployment remain valid for configured code and runtime, but they do not prove the excluded zoom acceptance cases.
- The rejected initial `create_branch` call during this reconciliation used invalid argument names and produced no ref mutation. `main` remained `e390469466e881ee49f5009752e60e545f5cf898`; the target branch remained absent until the exact connector schema was reloaded and the branch was created from that immutable SHA.
- Local clone execution is unavailable in the isolated connector environment; no local result is counted as authoritative evidence.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
