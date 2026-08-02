# LexiGo Project State

## Verification

- Last verified: 2026-08-02 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `07aa9d55c265a392ec20db9057fb7e0f880a8884`.
- Latest deployed product SHA: `07aa9d55c265a392ec20db9057fb7e0f880a8884`.
- Latest completed Issue #70 slice: deletion of the proven-orphaned `.lx-resource-notice*` CSS selector family while preserving exact live `.lx-session-notice`, `.lx-resource-stack` and canonical async-state ownership.
- Completion PR: #348.
- PR #348 immutable developer-authored head: `4c454a883dcb743785bb2b38a7df0f4035e430ea`.
- Authoritative final PR CI: #2539 / run `30760870736`, successful.
- Expected-head squash merge produced product SHA `07aa9d55c265a392ec20db9057fb7e0f880a8884`.
- Post-merge main CI run `30761257218` succeeded on the exact product merge SHA.
- Exact-SHA stage run `30761598976` deployed web/API images tagged `07aa9d55c265a392ec20db9057fb7e0f880a8884`; deploy, public smoke and all 12 public browser checks succeeded.
- No Issue #70 product PR is active at verification time.
- Open PRs #304, #305 and #306 are pre-existing Dependabot dependency updates and remain outside this completed production slice.
- PR #348 comments, reviews and unresolved review threads were empty before merge.

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Backend unit/race/integration/security gates and frontend lint/type/unit/build/browser gates are mandatory for product and mixed changes.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.

### Learning and route ownership

- Home, Learn, Active Lesson, Phrases, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole durable review-queue owner.
- Authenticated `/profile` is selected by canonical `LexigoProfileApp` before the compatibility fallback.
- Guest `/profile` login, registration, forgot-password, reset-password, reset-token and validation remain intentionally compatibility-owned by `LexigoPremiumApp.renderProfile()`.
- Authenticated and guest `/progress` remain owned by canonical `LexigoProgressApp` before the compatibility fallback.
- `renderLibrary()` remains intentionally reachable for product-owned Dictionary History entries and is not a deletion candidate without a separate History ownership change.
- `LexigoPremiumApp` remains reachable for guest Profile authentication/recovery, Library, Lesson and unknown/product-route fallback; broad deletion is prohibited without exact reachability evidence.

### Compatibility cleanup evidence

- PR #277 proved canonical Phrases guest/auth reachability; PR #282 removed the unreachable Phrases route runtime; PR #284 consolidated Phrases CSS ownership.
- PR #288 established the Progress boundary; PR #295 removed only its proven-unreachable compatibility presentation.
- PR #298 established the Dictionary boundary; product-owned History entries preserve live compatibility reachability.
- PR #300 established the Profile boundary; guest authentication and account recovery remain live in `LexigoPremiumApp`.
- PR #303 established the two-sided Scenario route boundary; PR #308 protects the already-absent Scenario compatibility runtime.
- PR #311 proved the Home boundary; PR #313 removed the unreachable legacy Home presentation.
- PR #316 proved the two-sided Learn boundary; PR #318 removed only `renderLearn` and its exact dispatch branch.
- PR #324 bounded remaining compatibility dispatch to live Library, guest Profile and Lesson behavior.
- PR #328 added production-network evidence that canonical route islands exclude fallback-exclusive JavaScript assets.
- PR #330 and PR #332 established Phrases CSS order independence and synchronized the normative specificity contract.
- PR #334 deleted `dictionary-detail-compatibility.css` after moving live declarations to exact canonical owners.
- PR #336 proved zero production consumers of `.lx-dictionary-detail*`; PR #339 deleted that orphan family with unchanged Linux visual regression.
- PR #341 proved the authenticated Profile duplicate unreachable; PR #344 deleted only the bounded duplicate and helper-only runtime while preserving guest Profile recovery.

### Resource-notice CSS cleanup

- PR #346 added `frontend/components/resource-notice-orphan-source.test.ts` and proved zero executable production TypeScript/TSX consumers of the `lx-resource-notice` prefix using the actual checkout.
- Test/spec files are excluded and comments are stripped before consumer analysis.
- PR #346 bounded exactly eight legacy selector-token occurrences and protected canonical `AsyncResourceNotice` → `AsyncStatePanel` → `.lx-async-state`, live `.lx-resource-stack`, live `.lx-session-notice` and CSS import order.
- PR #348 removed the complete `.lx-resource-notice*` selector family from `mobile-pwa-fixes.css`.
- The production CSS patch was deletion-only: 19 removed lines and zero additions.
- The three grouped rules were reduced to `.lx-session-notice button`, `.lx-session-notice.offline` / `.timeout` and `.lx-session-notice.malformed` with declaration bodies unchanged.
- `resource-notice-orphan-source.test.ts` now requires physical CSS absence and exact single occurrence of the retained live session-notice rule bodies.
- `mobile-pwa-fixes.css` contains zero `lx-resource-notice` tokens.
- `.lx-resource-stack`, canonical `.lx-async-state`, `system-states.css`, layout import order and production TypeScript/TSX runtime were unchanged.
- Both authoritative Linux visual regression runs and all route-performance budgets passed without baseline or ceiling changes.

## In progress

- No atomic production slice is active.
- No Issue #70 product pull request is open.
- This documentation-only reconciliation records PR #348 delivery evidence and resets the completed task context.
- The next atomic product task may start only after this reconciliation is merged and live GitHub state is checked again.

## Remaining roadmap

### 1. #70 — Audit the next compatibility or CSS ownership family

- Select one minimal family per atomic PR from fresh source, route, bundle and production evidence.
- Prove canonical ownership and compatibility reachability before deletion.
- Preserve guest authentication/recovery, Library, Lesson, unknown-route, session shell and shared account runtime.
- Do not infer neighboring helpers, selectors or state are dead from completed adjacent cleanup.
- CSS cleanup requires actual-checkout consumer search, specificity/import-order analysis, exact cascade ownership and unchanged authoritative Linux visual hashes.

### 2. #70 — Final dead-code and bundle acceptance

- Complete exact consumer search for remaining compatibility owners.
- Reconcile PR #328 fallback-exclusive asset evidence with current source ownership and route budgets.
- Verify final dead-code inventory, fallback reachability, global CSS ownership, README acceptance criteria and bundle impact before closing Issue #70.

### 3. Dependency maintenance

- PRs #304, #305 and #306 remain separate Dependabot updates.
- Do not mix dependency upgrades with Issue #70 compatibility cleanup.
- Evaluate each dependency PR against security, browser, visual and deployment gates in its own atomic slice.

### 4. Product roadmap

- #18 and #201: adaptive personalization and First Use after approved design states.
- #25: pronunciation, listening and custom terminology after architecture/privacy contracts.
- #203, #205 and #133: Figma handoff, final visual parity and external moderated usability validation.

## Validation pending

- Guest Profile authentication and recovery remain intentionally live.
- Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- `.lx-resource-stack`, `.lx-session-notice`, `.lx-async-state`, `.lx-dictionary-result-heading*` and `.lx-dictionary-translation` remain protected live declarations.
- Scenario guest authentication boundaries remain intentionally live.
- Final Issue #70 bundle/dead-code, compatibility reachability, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #348 — `style(frontend): remove orphaned resource notice selectors` → `07aa9d55c265a392ec20db9057fb7e0f880a8884`.
2. #347 — `docs(agent): reconcile PR 346 resource notice proof` → `e5978d3af77e6c5e14e22ee189d72c32d7b79461`.
3. #346 — `test(frontend): prove legacy resource notice CSS orphaned` → `c0b8aede5563fd8619072746db77ba69a8c6329e`.
4. #345 — `docs(agent): reconcile PR 344 Profile fallback removal` → `65b73f0c9551880b8e84d371e473e9001e70cab9`.
5. #344 — `refactor(frontend): remove authenticated Profile fallback duplicate` → `b5eea8177255f2bc595340ef9e2abc5bc46a16a3`.

## Evidence

- PR #348 final developer-authored head `4c454a883dcb743785bb2b38a7df0f4035e430ea` passed authoritative full CI #2539 / run `30760870736` before expected-head squash merge.
- Final PR CI passed the updated absence contract, frontend lint, typecheck, complete unit suite, production build and dependency audit.
- Backend unit/security/integration, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds succeeded.
- PR #348 discussion contained no comments, reviews or unresolved review threads.
- Its final diff was restricted to `mobile-pwa-fixes.css`, the exact source contract and `.agents/current/**`; production CSS changed by 19 deletions and zero additions.
- Expected-head squash merge produced product SHA `07aa9d55c265a392ec20db9057fb7e0f880a8884`.
- Post-merge main CI run `30761257218` repeated the complete product matrix successfully on that exact merge SHA.
- Stage run `30761598976` validated the exact CI scope artifact, deployed web/API images tagged `07aa9d55c265a392ec20db9057fb7e0f880a8884`, returned HTTP 200 for frontend and API readiness and completed all 12 desktop Chromium/iOS WebKit public browser checks successfully.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA and the latest completed delivery evidence. It intentionally does not claim that a SHA embedded in a documentation commit will remain the live tip after that documentation PR merges. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in those recorded facts. Always verify the current live GitHub tip separately before writes. Do not create recursive reconciliation PRs solely because a docs-only reconciliation merge advanced `main`.
