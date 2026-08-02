# LexiGo Project State

## Verification

- Last verified: 2026-08-02 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `c0b8aede5563fd8619072746db77ba69a8c6329e`.
- Latest deployed product SHA: `c0b8aede5563fd8619072746db77ba69a8c6329e`.
- Latest completed Issue #70 slice: checkout-level executable proof that the legacy `.lx-resource-notice*` CSS selector family has no production TypeScript/TSX consumer, while canonical async-state and live resource-stack/session-notice owners remain protected.
- Completion PR: #346.
- PR #346 immutable developer-authored head: `f3dc37181cb95042307358d7cd71de8d62157434`.
- Authoritative final PR CI: #2532 / run `30759470924`, successful.
- Expected-head squash merge produced product SHA `c0b8aede5563fd8619072746db77ba69a8c6329e`.
- Post-merge main CI run `30759899805` succeeded on the exact product merge SHA.
- Exact-SHA stage run `30760260623` deployed web/API images tagged `c0b8aede5563fd8619072746db77ba69a8c6329e`; deploy, public smoke and all 12 public browser checks succeeded.
- No Issue #70 product PR is active at verification time.
- Open PRs #304, #305 and #306 are pre-existing Dependabot dependency updates and remain outside this completed production slice.
- PR #346 comments, reviews and unresolved review threads were empty before merge.

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Backend unit/race/integration/security gates and frontend lint/type/unit/build/browser gates are mandatory for product and mixed changes.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.

### Learning and route ownership

- Home, Learn, Active Lesson, Phrases, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole durable review-queue owner.
- `LexigoLearnApp` is the canonical `/learn` Lesson Composer owner and renders before the final `LexigoPremiumApp` compatibility fallback.
- Authenticated `/profile` is selected by canonical `LexigoProfileApp` before the compatibility fallback.
- Guest `/profile` login, registration, forgot-password, reset-password, reset-token and validation flows remain intentionally compatibility-owned by `LexigoPremiumApp.renderProfile()`.
- Authenticated and guest `/progress` remain owned by canonical `LexigoProgressApp` before the compatibility fallback.
- `renderLibrary()` remains intentionally reachable for product-owned Dictionary History entries and is not a deletion candidate without a separate History ownership change.

### Compatibility cleanup evidence

- PR #277 proved canonical Phrases guest/auth reachability; PR #282 removed the unreachable Phrases route runtime; PR #284 consolidated Phrases CSS ownership.
- PR #288 established the Progress boundary; PR #295 removed only its proven-unreachable compatibility presentation.
- PR #298 established the Dictionary boundary; product-owned History entries still preserve live compatibility reachability.
- PR #300 established the Profile boundary; guest authentication and account recovery remain live in `LexigoPremiumApp`.
- PR #303 established the two-sided Scenario route boundary; PR #308 protects the already-absent Scenario compatibility runtime against regression.
- PR #311 proved the Home boundary; PR #313 removed the unreachable legacy Home presentation.
- PR #316 proved the two-sided Learn boundary; PR #318 removed only `renderLearn` and its exact dispatch branch.
- PR #324 added executable route-island inventory and bounded remaining compatibility dispatch to live Library, guest Profile and Lesson behavior.
- PR #328 added production-network evidence that canonical route islands exclude fallback-exclusive JavaScript assets.
- PR #330 and PR #332 established Phrases CSS order independence and synchronized the normative specificity contract.
- PR #334 deleted `dictionary-detail-compatibility.css` after moving live declarations to exact canonical owners.
- PR #336 proved zero production consumers of `.lx-dictionary-detail*`; PR #339 deleted that proven orphan family with unchanged Linux visual regression.
- PR #341 proved the authenticated Profile compatibility duplicate unreachable; PR #344 deleted only the bounded duplicate and helper-only runtime while preserving guest Profile recovery.
- `LexigoPremiumApp.renderProfile()` retains the complete guest branch and ends with fail-closed `return null` for the impossible authenticated fallback state.
- `LexigoPremiumApp` remains reachable for guest Profile authentication/recovery, Library, Lesson and unknown/product-route fallback; broad deletion remains prohibited without exact reachability evidence.

### Resource-notice CSS proof

- PR #346 added `frontend/components/resource-notice-orphan-source.test.ts`.
- The test recursively scans executable TypeScript/TSX under `frontend/app`, `frontend/components` and `frontend/lib` from the actual checkout.
- Test/spec files are excluded and source comments are stripped before consumer analysis.
- The contract proves zero executable production consumers of the `lx-resource-notice` prefix.
- The contract bounds exactly eight `.lx-resource-notice*` selector-token occurrences in `mobile-pwa-fixes.css` and requires each exact selector marker once.
- Canonical resource-error presentation is protected as `AsyncResourceNotice` → `AsyncStatePanel` → `.lx-async-state`.
- `system-states.css` remains the canonical `.lx-async-state.compact` owner and retains `.lx-resource-stack .lx-async-state` geometry.
- `.lx-resource-stack` remains live across route islands.
- `.lx-session-notice` remains live in `LexigoBootstrappedApp` and shares grouped declarations with the orphan candidate.
- A future deletion must reduce grouped selectors surgically and preserve every `.lx-session-notice` declaration; broad block deletion is prohibited.
- PR #346 changed no production CSS, runtime, layout import, visual baseline, route-budget ceiling, workflow, dependency, API, backend, README or architecture file.

## In progress

- No atomic production slice is active.
- No Issue #70 product pull request is open.
- This documentation-only reconciliation records PR #346 delivery evidence and resets the completed task context.
- The next atomic product task may start only after this reconciliation is merged and live GitHub state is checked again.

## Remaining roadmap

### 1. #70 — Delete only the proven orphaned resource-notice selector family

- Start from fresh live `main`, Issue #70, open PR, CI and stage evidence.
- Use `resource-notice-orphan-source.test.ts` as the exact deletion manifest.
- Remove only `.lx-resource-notice*` selectors from `mobile-pwa-fixes.css`.
- Preserve `.lx-resource-stack`, `.lx-session-notice`, canonical `.lx-async-state`, import order and all PWA/session shell behavior.
- Rewrite grouped selectors so all live `.lx-session-notice` declarations remain byte-for-byte equivalent.
- Convert selector-presence assertions to exact physical-absence assertions without weakening zero-consumer or canonical-owner evidence.
- Require deletion-dominant CSS diff, unchanged Linux visual snapshots, unchanged performance budgets, full immutable-head CI and exact-SHA stage/public validation.

### 2. #70 — Audit the next compatibility or CSS ownership family

- Select one minimal family per atomic PR from fresh source, route, bundle and production evidence.
- Prove canonical ownership and compatibility reachability before deletion.
- Preserve guest authentication/recovery, Library, Lesson, unknown-route and shared account/session owners.
- Do not infer neighboring helpers, selectors or state are dead from a completed cleanup.

### 3. #70 — Final dead-code and bundle acceptance

- Complete exact consumer search for remaining compatibility owners.
- Use PR #328 fallback-exclusive asset evidence together with source ownership, route budgets and README contracts.
- Verify final dead-code inventory, fallback reachability, global CSS ownership, route budgets and README acceptance criteria before closing Issue #70.

### 4. Dependency maintenance

- PRs #304, #305 and #306 remain separate Dependabot updates.
- Do not mix dependency upgrades with Issue #70 compatibility cleanup.
- Evaluate each dependency PR against security, browser, visual and deployment gates in its own atomic slice.

### 5. Product roadmap

- #18 and #201: adaptive personalization and First Use after approved design states.
- #25: pronunciation, listening and custom terminology after architecture/privacy contracts.
- #203, #205 and #133: Figma handoff, final visual parity and external moderated usability validation.

## Validation pending

- The `.lx-resource-notice*` selector family remains physically present until a separate deletion PR.
- Guest Profile authentication and recovery remain intentionally live.
- Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- `.lx-resource-stack`, `.lx-session-notice`, `.lx-async-state`, `.lx-dictionary-result-heading*` and `.lx-dictionary-translation` remain protected live declarations.
- Scenario guest authentication boundaries remain intentionally live.
- Final Issue #70 bundle/dead-code, compatibility reachability, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #346 — `test(frontend): prove legacy resource notice CSS orphaned` → `c0b8aede5563fd8619072746db77ba69a8c6329e`.
2. #345 — `docs(agent): reconcile PR 344 Profile fallback removal` → `65b73f0c9551880b8e84d371e473e9001e70cab9`.
3. #344 — `refactor(frontend): remove authenticated Profile fallback duplicate` → `b5eea8177255f2bc595340ef9e2abc5bc46a16a3`.
4. #342 — `docs(agent): reconcile PR 341 Profile reachability proof` → `9bf254cf423b0d0bf69db836882b253797d24466`.
5. #341 — `test(frontend): prove authenticated Profile fallback duplicate unreachable` → `c516a47910dfad46e174f90c9adf27919f7b4d4d`.

## Evidence

- PR #346 final developer-authored head `f3dc37181cb95042307358d7cd71de8d62157434` passed authoritative full CI #2532 / run `30759470924` before expected-head squash merge.
- Final PR CI passed the new checkout-level resource-notice source contract, frontend lint, typecheck, complete unit suite, production build and dependency audit.
- Backend unit/security/integration, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds succeeded.
- PR #346 discussion contained no comments, reviews or unresolved review threads.
- Its final diff was restricted to one new source-level test and `.agents/current/**`; no production CSS or runtime file changed.
- Expected-head squash merge produced product SHA `c0b8aede5563fd8619072746db77ba69a8c6329e`.
- Post-merge main CI run `30759899805` repeated the complete product matrix successfully on that exact merge SHA.
- Stage run `30760260623` validated the exact CI scope artifact, deployed web/API images tagged `c0b8aede5563fd8619072746db77ba69a8c6329e`, returned HTTP 200 for frontend and API readiness and completed all 12 desktop Chromium/iOS WebKit public browser checks successfully.
- The source proof distinguishes the dead `lx-resource-notice` prefix from live `lx-resource-stack`, `lx-session-notice` and canonical async-state owners.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA, and the latest completed delivery evidence. It intentionally does not claim that a SHA embedded in a documentation commit will remain the live tip after that documentation PR merges. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in those recorded facts. Always verify the current live GitHub tip separately before writes. Do not create recursive reconciliation PRs solely because a docs-only reconciliation merge advanced `main`.
