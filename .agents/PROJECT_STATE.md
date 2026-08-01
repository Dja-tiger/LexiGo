# LexiGo Project State

## Verification

- Last verified: 2026-08-01 09:04 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `65efdab1211b4b7bebfec04d6186fed80cde0949`.
- Latest deployed product SHA: `65efdab1211b4b7bebfec04d6186fed80cde0949`.
- Latest completed product slice: Issue #70 — executable production-bundle isolation of the live `LexigoPremiumApp` compatibility fallback from canonical route islands.
- Completion PR: #328.
- PR #328 immutable head: `461ccea68a46ec1ac094da9397943f3ab3fd8b1e`.
- Authoritative PR CI: #2466 / run `30667854862`, successful.
- Expected-head squash merge produced product SHA `65efdab1211b4b7bebfec04d6186fed80cde0949`.
- Exact-SHA stage run `30686867662` deployed web/API images tagged `65efdab1211b4b7bebfec04d6186fed80cde0949`; deploy, public smoke and all 12 public browser checks succeeded.
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
- The PR #328 performance gate derives evidence from cold-browser production requests and reports the compatibility probe plus fallback-exclusive asset set without static chunk-name assumptions or budget-ceiling changes.
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

1. #328 — `test(frontend): prove compatibility fallback bundle isolation` → `65efdab1211b4b7bebfec04d6186fed80cde0949`.
2. #327 — `docs(agent): make project-state SHA semantics non-recursive` → `31c1f9cd9432bc5fd75a81c76e7f65d96e430e8b`.
3. #326 — `docs(agent): reconcile main after PR 325` → `f09b278e5ef743bec10d1bb69d75a460513bb581`.
4. #325 — `docs(agent): reconcile PR 324 fallback inventory` → `674e0d58272a1ca343c6b845c7954b5a66d2d187`.
5. #324 — `test(frontend): inventory final compatibility fallback` → `cbb9bc9c50e76a93c887736319047fd5d98bc35a`.

## Evidence

- PR #328 head `461ccea68a46ec1ac094da9397943f3ab3fd8b1e` passed authoritative full CI #2466/run `30667854862`.
- CI covered backend unit/security/integration, frontend lint/type/unit/build/audit, both UI shards, visual regression, accessibility, CSP, service worker, performance budgets, lesson completion, iOS PWA and both container builds.
- The route bundle performance gate measured the real `.lx-app` compatibility fallback through a controlled product-graph probe, required at least one fallback-exclusive JavaScript asset and required every canonical route result to exclude every such asset.
- Existing canonical route budgets and ceilings were unchanged; no runtime, routing, API, backend, CSS, dependency, workflow or visual baseline changed.
- Review comments, review submissions and unresolved threads were empty.
- Expected-head squash merge produced product SHA `65efdab1211b4b7bebfec04d6186fed80cde0949`.
- Stage run `30686867662` deployed the exact product merge SHA and completed deploy, public smoke and 12/12 public browser checks successfully.
- The stage status Issue #12 recorded healthy web/API containers tagged with the exact merge SHA.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA, and the latest completed delivery evidence. It intentionally does not claim that a SHA embedded in a documentation commit will remain the live tip after that documentation PR merges. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in those recorded facts. Always verify the current live GitHub tip separately before writes. Do not create recursive reconciliation PRs solely because a docs-only reconciliation merge advanced `main`.