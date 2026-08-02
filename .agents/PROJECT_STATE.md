# LexiGo Project State

## Verification

- Last verified: 2026-08-03 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `b490e9cde0d6a994d6b4ebd3753f4a13e2d56420`.
- Latest deployed product SHA: `b490e9cde0d6a994d6b4ebd3753f4a13e2d56420`.
- Latest completed Issue #70 slice: deletion of the proven-orphaned `.lx-themed-home` and `.lx-themed-library` CSS selector family while preserving every live themed and accessibility owner.
- Completion PR: #352.
- PR #352 immutable developer-authored head: `58dccbc363dac85d3581841a41f2f88423d27a4e`.
- Authoritative PR CI: #2553 / run `30768519332`, successful after a targeted same-head retry of the isolated Lesson completion job.
- Expected-head squash merge produced product SHA `b490e9cde0d6a994d6b4ebd3753f4a13e2d56420`.
- Post-merge main CI run `30769104005` succeeded on the exact product merge SHA without retry.
- Exact-SHA stage run `30769451780` deployed web/API images tagged `b490e9cde0d6a994d6b4ebd3753f4a13e2d56420`; deploy, public smoke and all 12 public browser checks succeeded.
- No Issue #70 product PR is active at verification time.
- No pull request is open at verification time.
- PR #352 comments, reviews and unresolved review threads were empty before merge.

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
- The grouped rules were reduced to their live `.lx-session-notice*` members with declaration bodies unchanged.
- `resource-notice-orphan-source.test.ts` now requires physical CSS absence and protects retained live owners.
- Both authoritative Linux visual regression runs and all route-performance budgets passed without baseline or ceiling changes.

### Themed-card CSS cleanup

- PR #350 added `frontend/components/themed-card-orphan-source.test.ts` as actual-checkout evidence for the legacy card selector candidates.
- The contract recursively scans executable TypeScript/TSX under `frontend/app`, `frontend/components` and `frontend/lib`, excludes test/spec files and strips source comments.
- PR #350 proved zero executable production consumers of `lx-themed-home` and `lx-themed-library` and bounded their exact former CSS inventory.
- PR #352 removed the two retired selector names from `themed-vocabulary.css`, `accessibility-focus.css` and `accessibility-navigation.css`.
- The production CSS patch was deletion-only: 34 removed lines and zero additions.
- Removed material was limited to dead cursor members, the dead parent-scoped arrow hover rule, dead overflow/pseudo-element/child-layer blocks and the two retired members of shared focus and reduced-motion groups.
- `.lx-themed-selector`, `.lx-themed-symbol`, `.lx-themed-arrow`, collection-prefixed selectors and every unrelated accessibility selector/declaration remain unchanged.
- `themed-card-orphan-source.test.ts` now fails closed if either retired name reappears in executable TypeScript/TSX or any former CSS owner.
- The contract continues to require executable consumers and exact declarations for the live themed owners.
- CSS import order, production TypeScript/TSX runtime, snapshots and route-budget ceilings were unchanged.
- Authoritative PR and exact-merge Linux visual regression and route-performance budgets passed without baseline or ceiling changes.

## In progress

- No atomic production slice is active.
- No Issue #70 product pull request is open.
- This documentation-only reconciliation records PR #352 delivery evidence and resets the completed task context.
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

- Keep dependency upgrades separate from Issue #70 compatibility cleanup.
- Evaluate each dependency update against security, browser, visual and deployment gates in its own atomic slice.

### 4. Product roadmap

- #18 and #201: adaptive personalization and First Use after approved design states.
- #25: pronunciation, listening and custom terminology after architecture/privacy contracts.
- #203, #205 and #133: Figma handoff, final visual parity and external moderated usability validation.

## Validation pending

- Guest Profile authentication and recovery remain intentionally live.
- Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- `.lx-themed-selector`, `.lx-themed-symbol`, `.lx-themed-arrow`, collection-prefixed selectors and their accessibility rules remain protected live declarations.
- `.lx-resource-stack`, `.lx-session-notice`, `.lx-async-state`, `.lx-dictionary-result-heading*` and `.lx-dictionary-translation` remain protected live declarations.
- Scenario guest authentication boundaries remain intentionally live.
- Final Issue #70 bundle/dead-code, compatibility reachability, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #352 — `style(frontend): remove orphaned themed card selectors` → `b490e9cde0d6a994d6b4ebd3753f4a13e2d56420`.
2. #351 — `docs(agent): reconcile PR 350 themed card proof` → `6e5f66953f1e0dbda7e48b5f98d9bd97e6731ebd`.
3. #350 — `test(frontend): prove legacy themed cards orphaned` → `de1e56fc558e7a7d3fdca155902718034b9f22d2`.
4. #349 — `docs(agent): reconcile PR 348 resource notice deletion` → `9001982fa6cf917741a455c84d78fe06b23a2045`.
5. #348 — `style(frontend): remove orphaned resource notice selectors` → `07aa9d55c265a392ec20db9057fb7e0f880a8884`.

## Evidence

- PR #352 final developer-authored head `58dccbc363dac85d3581841a41f2f88423d27a4e` passed authoritative full CI #2553 / run `30768519332` before expected-head squash merge.
- The first Lesson-completion job attempt failed because one strict text locator matched both explanatory copy and the identically worded button; all CSS-sensitive visual, accessibility, performance and UI gates were already green.
- A targeted retry of only that isolated job passed on the same immutable head; no code, snapshot or budget change was made.
- Final PR CI passed the physical-absence source contract, frontend lint, typecheck, complete unit suite, production build and dependency audit.
- Backend unit/security/integration, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds succeeded.
- PR #352 discussion contained no comments, reviews or unresolved review threads.
- Its final diff was restricted to three CSS owners, `themed-card-orphan-source.test.ts` and `.agents/current/**`.
- Expected-head squash merge produced product SHA `b490e9cde0d6a994d6b4ebd3753f4a13e2d56420`.
- Post-merge main CI run `30769104005` repeated the complete product matrix successfully on that exact merge SHA, including Lesson completion without retry.
- Stage run `30769451780` validated the exact CI scope artifact from run `30769104005`, deployed web/API images tagged `b490e9cde0d6a994d6b4ebd3753f4a13e2d56420`, returned successful public smoke and completed all 12 public browser validations.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA and the latest completed delivery evidence. It intentionally does not claim that a SHA embedded in a documentation commit will remain the live tip after that documentation PR merges. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in those recorded facts. Always verify the current live GitHub tip separately before writes. Do not create recursive reconciliation PRs solely because a docs-only reconciliation merge advanced `main`.
