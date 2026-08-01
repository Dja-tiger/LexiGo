# LexiGo Project State

## Verification

- Last verified: 2026-08-01 09:56 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `073e59989cd7a938bf28c1ebee1f77b8f49352c3`.
- Latest deployed product SHA: `073e59989cd7a938bf28c1ebee1f77b8f49352c3`.
- Latest completed product slice: Issue #70 — source-order independence of the canonical Phrases route cascade from the shared catalog base.
- Completion PR: #330.
- PR #330 immutable head: `fd91588c57e77a9e9a44ad3e79f6dc99ae832c4e`.
- Authoritative PR CI: #2470 / run `30687931754`, successful.
- Expected-head squash merge produced product SHA `073e59989cd7a938bf28c1ebee1f77b8f49352c3`.
- Post-merge main CI run `30688251296` succeeded on the exact product merge SHA.
- Exact-SHA stage run `30688539355` deployed web/API images tagged `073e59989cd7a938bf28c1ebee1f77b8f49352c3`; deploy, public smoke and final public browser gates succeeded.
- No pull requests were open at verification time.
- Reviews, comments and unresolved review threads were empty before the recorded product merge.

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Backend unit/race/integration/security gates and frontend lint/type/unit/build/browser gates are mandatory for product and mixed changes.
- Pure Agent Docs changes use the fail-closed lightweight classifier.

### Learning and route ownership

- Home, Learn, Active Lesson, Phrases, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole durable review-queue owner.
- `LexigoLearnApp` is the canonical `/learn` Lesson Composer owner and renders before the final `LexigoPremiumApp` compatibility fallback.

### Compatibility cleanup evidence

- PR #277 proved canonical Phrases guest/auth reachability; PR #282 removed the unreachable Phrases route runtime; PR #284 consolidated Phrases CSS ownership.
- PR #288 established the Progress boundary; PR #295 removed only its proven-unreachable compatibility presentation.
- PR #298 established the Dictionary boundary; product-owned History entries still preserve live compatibility reachability.
- PR #300 established the Profile boundary; guest authentication and account recovery remain live in `LexigoPremiumApp`.
- PR #303 established the two-sided Scenario route boundary; PR #308 protects the already-absent Scenario compatibility runtime against regression.
- PR #311 proved the Home boundary; PR #313 removed the unreachable legacy Home presentation.
- PR #316 proved the two-sided Learn compatibility boundary; PR #318 removed only `renderLearn` and its exact dispatch branch.
- PR #324 added executable inventory proving that dedicated route islands precede the final fallback, retired route presentations remain absent, and the remaining compatibility dispatch is limited to Library, Profile and Lesson.
- PR #324 also proved canonical `LexigoLearnApp` still consumes the Learn composer CSS family, so those selectors are not safe orphan-deletion candidates.
- PR #328 added production-network evidence that the live compatibility fallback retains independently loaded JavaScript assets and that every measured canonical route island excludes those fallback-exclusive assets.
- PR #330 removed the remaining Phrases route-after-base source-order assumption: root layout now imports `phrases.css` before `catalog-enhancements.css`, while executable ownership tests prove the route selectors remain more specific than the shared base.
- The overlapping Phrases route selectors retain specificity `(0, 3, 0)` over shared `(0, 1, 0)` and `(0, 3, 1)` over shared `(0, 1, 1)`.
- The exact canonical Phrases cascade block, selector counts, all CSS file bytes, visual snapshots and route budgets remained unchanged.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown/product-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for independently proven compatibility/CSS families and final dead-code, bundle and ownership acceptance.

## In progress

- No product slice is active.
- No pull request was open at verification time.
- The next atomic task must be selected only after this reconciliation is merged and fresh live evidence is reviewed.

## Remaining roadmap

### 1. #70 — Audit the next compatibility or CSS ownership family

- Select one minimal family per atomic PR.
- Prove canonical ownership and compatibility reachability before deletion.
- Preserve shared authentication, lesson-domain and unknown-route owners.
- CSS cleanup requires selector search, specificity/import-order analysis, computed-cascade ownership and unchanged authoritative Linux visual hashes.

### 2. #70 — Final dead-code and bundle acceptance

- Complete exact consumer search for remaining compatibility owners.
- Use the PR #328 fallback-exclusive asset evidence together with source ownership, route budgets and README contracts when assessing final bundle acceptance.
- Verify final bundle/dead-code, global CSS ownership and README acceptance criteria before closing Issue #70.

### 3. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after approved design states are available.

### 4. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation.

### 5. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- The next Issue #70 slice must be selected from fresh live evidence; no new compatibility or CSS family is pre-authorized by this reconciliation.
- Dictionary product-history compatibility remains intentionally live.
- Profile and Scenario guest authentication boundaries remain intentionally live.
- Final bundle/dead-code, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #330 — `refactor(frontend): prove Phrases cascade order independence` → `073e59989cd7a938bf28c1ebee1f77b8f49352c3`.
2. #329 — `docs(agent): reconcile PR 328 bundle isolation` → `8241296b4b452984534777dfa07a7a4f9b7d5b25`.
3. #328 — `test(frontend): prove compatibility fallback bundle isolation` → `65efdab1211b4b7bebfec04d6186fed80cde0949`.
4. #327 — `docs(agent): make project-state SHA semantics non-recursive` → `31c1f9cd9432bc5fd75a81c76e7f65d96e430e8b`.
5. #326 — `docs(agent): reconcile main after PR 325` → `f09b278e5ef743bec10d1bb69d75a460513bb581`.

## Evidence

- PR #330 head `fd91588c57e77a9e9a44ad3e79f6dc99ae832c4e` passed authoritative full CI #2470/run `30687931754`.
- CI covered backend unit/security/integration, frontend lint/type/unit/build/audit, both UI shards, visual regression, accessibility, CSP, service worker, performance budgets, lesson completion, iOS PWA and both container builds.
- `frontend/app/layout.tsx` imports the canonical Phrases route owner before the later shared catalog base as an adversarial production proof.
- `frontend/components/phrases-css-ownership.test.ts` computes selector specificity, requires the inverted import order, preserves the exact canonical cascade block and protects selector uniqueness.
- No CSS declaration, selector, stylesheet byte, visual snapshot, runtime, API, backend, dependency, workflow or route-budget ceiling changed.
- The authoritative Visual Regression, Accessibility audit and Performance budgets jobs succeeded without baseline or ceiling updates.
- Review comments, review submissions and unresolved threads were empty.
- Expected-head squash merge produced product SHA `073e59989cd7a938bf28c1ebee1f77b8f49352c3`.
- Post-merge main CI run `30688251296` repeated the complete product matrix successfully on the exact merge SHA.
- Stage run `30688539355` deployed the exact product merge SHA; web/API containers were healthy and deploy, public smoke and final public browser gates succeeded.
- The stage browser matrix exercised `/`, `/learn`, `/phrases`, `/dictionary`, `/progress` and stale-build recovery in desktop Chromium and iOS WebKit. An iOS WebKit service-worker access-control event was retried by the existing test policy; the final deployment job conclusion remained successful.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA, and the latest completed delivery evidence. It intentionally does not claim that a SHA embedded in a documentation commit will remain the live tip after that documentation PR merges. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in those recorded facts. Always verify the current live GitHub tip separately before writes. Do not create recursive reconciliation PRs solely because a docs-only reconciliation merge advanced `main`.