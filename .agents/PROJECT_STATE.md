# LexiGo Project State

## Verification

- Last verified: 2026-08-04 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product base verified before this documentation slice: `29151758bae0b4220ee48213d0fc49a2290ba20a`.
- Latest deployed product SHA: `29151758bae0b4220ee48213d0fc49a2290ba20a`.
- Latest completed product slice: Issue #74 live header profile touch-target contract.
- Completion PR: #389.
- PR #389 immutable developer-authored head: `4877caa8e92288b8688d05600cb0498a9f0bd874`.
- Authoritative PR CI: #2755 / run `30935579733`, complete success.
- Expected-head squash merge produced product SHA `29151758bae0b4220ee48213d0fc49a2290ba20a`.
- Exact-SHA main CI run `30936575035` completed successfully with the full product matrix and immutable web/API image publication.
- Exact-image stage run `30937320392` deployed web/API images tagged `29151758bae0b4220ee48213d0fc49a2290ba20a`; deployment, public smoke and public browser validation succeeded, including 12/12 public runtime checks.
- PR #389 had no comments, reviews or unresolved review threads before merge.
- No intersecting product or documentation PR remains open; Dependabot PRs #304–#306 remain unrelated maintenance work.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security gates plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates.
- Product delivery requires immutable-head PR CI, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.
- One PR contains one atomic slice. Product work does not continue through stale Agent Harness state.

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

- The live `ReviewOutboxRuntime` connectivity actions expose a 44px fine-pointer / 48px coarse-pointer effective target without changing the painted 40px default or 36px Active Lesson boxes.
- Inline expansion remains zero, preventing horizontal overlap between adjacent actions.
- Desktop Chromium, iOS WebKit and Android Chromium prove the live `Подробнее` role/name, target height, perimeter hits, keyboard focus and compact overflow.
- The intentionally hidden legacy Dictionary bell is excluded from ownership.
- Product SHA: `9ee68f15d623bc7d0e001967b94eff3946b246b3`.

### PR #389 — header profile touch target

- The live `button.lx-avatar[aria-label="Открыть профиль"]` now exposes a 44×44 fine-pointer and 48×48 coarse-pointer effective target.
- Existing 44×44 desktop and 42×42 compact painted avatar geometry remains unchanged.
- The exact button-and-accessible-name selector excludes the decorative Profile-page `span.lx-avatar[aria-hidden="true"]`.
- Inline expansion remains symmetric; block-axis expansion is directed downward because compact headers place the avatar at the viewport top boundary.
- The initial test incorrectly selected the hidden compact streak; the corrected evidence uses the visible `.lx-route-reminder-entry > summary` adjacent control.
- Superseded CI #2750 proved symmetric top expansion was not hit-testable in Android Chromium or iOS WebKit despite a computed 48×48 rectangle. The viewport-safe owner makes all four perimeter points resolve to the profile button.
- Desktop Chromium, Android Chromium and iOS WebKit prove target geometry, all four perimeter hits, reminder separation, focus-visible and compact overflow.
- Visual regression passed without baseline updates. One earlier unrelated exact-PNG Dictionary hash drift passed an evidence-backed isolated rerun and did not recur in final CI #2755.
- Product SHA: `29151758bae0b4220ee48213d0fc49a2290ba20a`.

## Issue #74 acceptance status

Completed:

- Global connectivity text actions have guaranteed 44/48px effective targets.
- The shared live header profile button has a guaranteed 44/48px square target across desktop Chromium, Android Chromium and iOS WebKit.
- Expanded targets preserve presentation, keyboard focus, accessible names, runtime callbacks and adjacent-control separation.
- Hidden/decorative consumers are explicitly excluded from ownership.

Still open:

- Audit and remediate remaining live controls named by Issue #74, including `Все режимы`, preview actions and other exposed header/icon controls.
- Prove all primary, secondary and icon controls meet minimum target and spacing contracts across affected routes.
- Verify mobile navigation labels and target spacing under default and enlarged text.
- Verify 200% browser zoom and system text enlargement without clipping, overlap or inaccessible actions.
- Complete manual physical-device acceptance before Issue #74 can close.

Issue #74 remains open. PRs #387 and #389 are completed atomic production slices, not full Issue closure.

## Current state

- No product slice is active.
- Product runtime and stage are validated on `29151758bae0b4220ee48213d0fc49a2290ba20a`.
- This documentation reconciliation resets `.agents/current/**`.
- The next Issue #74 slice must begin from live GitHub state and select only a confirmed exposed control after computed-style, runtime-visibility and accessibility-tree verification.

## Remaining roadmap

- Issue #74: continue with separate atomic slices for remaining live touch targets, enlarged-text/zoom evidence and final physical-device acceptance.
- Issue #78 CSP implementation and stage evidence are complete, but its final acceptance gate remains an authorized manual `Deploy Production` workflow dispatch with enforcing public smoke. No repository workaround or synthetic trigger is permitted.
- Other open product/design Issues must be selected from live GitHub state and decomposed into separate atomic slices.

## Recent production evidence

1. #389 — `fix(frontend): expand header profile touch target` → `29151758bae0b4220ee48213d0fc49a2290ba20a`.
2. #388 — `docs(agent): reconcile Issue 74 connectivity slice` → `cda65e39ba65cd00651be3ae7e39da651cc57f1c`.
3. #387 — `fix(frontend): expand connectivity action touch targets` → `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
4. #386 — `docs(agent): reconcile Issue 75 delivery` → `c56485511c752aacd3e2f43cd0d102f229a9c25f`.

## Evidence

- PR #389 immutable head `4877caa8e92288b8688d05600cb0498a9f0bd874` passed authoritative full CI #2755 / run `30935579733`.
- Frontend lint, TypeScript, unit/source contracts, production build, dependency audit, both UI shards, focused desktop/iOS/Android profile-target proof, Lesson, Dictionary, iOS PWA, controlled service worker, CSP, visual regression, accessibility, performance, backend unit/security/integration and both container builds succeeded.
- Expected-head squash merge produced `29151758bae0b4220ee48213d0fc49a2290ba20a`.
- Exact-SHA main CI run `30936575035` completed successfully with the same full product gates and immutable image publication.
- Stage run `30937320392` deployed the exact image; deploy, public smoke and all 12 Chromium/iOS WebKit public runtime checks passed.
- PR #389 had no comments, reviews or unresolved review threads before merge.
- Local clone execution was unavailable because the isolated execution container could not resolve `github.com`; no local result was counted as validation evidence.
- Final claims use exact refs, files, Issues, PRs, workflow jobs, artifacts and deployment records.

## State semantics

This file records the exact product base verified before the current task or documentation slice, the latest deployed product SHA and active delivery boundaries. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in recorded facts. Always verify the live GitHub tip and open PR set separately before writes. Do not create recursive reconciliation PRs solely because a docs-only merge advanced `main`.
