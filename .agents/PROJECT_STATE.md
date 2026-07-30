# LexiGo Project State

## Verification

- Last verified: 2026-07-30 12:14 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `a735c304b7f288b1014082c79e4dde74cdfeb10a`.
- Latest completed product slice: Issue #70 — lock the already-absent Scenario compatibility runtime against regression.
- Completion PR: #308.
- PR #308 immutable developer-authored head: `7df6aa9058256fc5af3ba4dac61978fcfffabb38`.
- Authoritative PR CI: #2402 / run `30493061049`, successful.
- Expected-head squash merge produced `f2bc1dfb46408bdd85bbc9ad4a1145f7269908f6`.
- Exact-SHA stage run `30494296741` deployed web/API images tagged `f2bc1dfb46408bdd85bbc9ad4a1145f7269908f6`; deploy, public smoke and all 12 public browser checks succeeded.
- Agent Docs reconciliation PR #309 passed lightweight CI #2404 / run `30528157545` and squash-merged as `a735c304b7f288b1014082c79e4dde74cdfeb10a`.
- Reviews, comments and unresolved review threads were empty before both merges.

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Backend unit/race/integration/security gates and frontend lint/type/unit/build/browser gates are mandatory for product and mixed changes.
- Pure Agent Docs changes use the fail-closed lightweight classifier.

### Learning and route ownership

- Home, Learn, Active Lesson, Phrases, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole durable review-queue owner.
- Canonical Scenario catalog/detail lifecycle, pause/resume, draft persistence and submission contracts are implemented.

### Compatibility cleanup evidence

- PR #277 proved canonical Phrases guest/auth reachability; PR #282 removed the unreachable Phrases route runtime; PR #284 consolidated Phrases CSS ownership.
- PR #288 established the Progress boundary; PR #295 removed only its proven-unreachable compatibility presentation.
- PR #298 established the Dictionary boundary; product-owned History entries still preserve live compatibility reachability.
- PR #300 established the Profile boundary; guest authentication and account recovery remain live in `LexigoPremiumApp`.
- PR #303 established the two-sided Scenario route boundary: authenticated `/scenarios` and `/scenarios/[slug]` select dedicated islands before `LexigoPremiumApp`, while guest entry remains redirected to `/profile?session=required&return_to=...`.
- PR #308 added an executable absence contract proving and protecting that Scenario API, state, lifecycle and render ownership remain absent from `LexigoPremiumApp`.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for later independently proven compatibility or selector families.

## In progress

- No product or tooling slice is active after reconciliation PR #309.
- Open Dependabot PRs #304, #305 and #306 are unrelated parallel dependency updates and are not part of the active Issue #70 workflow.

## Remaining roadmap

### 1. #70 — Select the next independently proven compatibility family

- Re-read live routing, imports, fallback predicates, markup consumers and `frontend/docs/compatibility-cleanup.md` before choosing scope.
- Select one minimal family per atomic PR.
- Preserve guest authentication, account recovery, unknown-route fallback and all shared lesson-domain behavior until exact evidence proves replacement ownership.
- Runtime cleanup requires absence/preservation source contracts, full CI, browser matrix, performance budgets and containers.
- CSS cleanup requires selector search, specificity/import-order analysis, computed-cascade ownership and unchanged authoritative Linux visual hashes.
- Existing bundle ceilings remain unchanged unless a separately approved performance decision changes them.

### 2. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after approved design states are available.

### 3. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation.

### 4. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- Each remaining Issue #70 family requires its own reachability, consumer, browser and visual evidence.
- Dictionary product-history compatibility remains intentionally live.
- Profile and Scenario guest authentication boundaries remain intentionally live.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #309 — `docs(agent): reconcile PR 308 Scenario absence` → `a735c304b7f288b1014082c79e4dde74cdfeb10a`.
2. #308 — `test(frontend): lock Scenario compatibility absence` → `f2bc1dfb46408bdd85bbc9ad4a1145f7269908f6`.
3. #307 — `docs(agent): reconcile PR 303 Scenario boundary` → `eedd9dc4d978cd8f5b89d2d969a85cd181342e8f`.
4. #303 — `test(frontend): prove Scenario compatibility boundary` → `c8495eacdd8b1289e82a532668834414fb63e55c`.

## Evidence

- PR #308 head `7df6aa9058256fc5af3ba4dac61978fcfffabb38` passed authoritative full CI #2402/run `30493061049`.
- Expected-head squash merge produced `f2bc1dfb46408bdd85bbc9ad4a1145f7269908f6`.
- Stage run `30494296741` deployed the exact product merge SHA and completed deploy, public smoke and 12/12 public browser checks successfully.
- PR #309 head `3b6c194b7f9c3acacf8777f8008ec9db5e9a0648` passed lightweight CI #2404/run `30528157545`; product, browser and container jobs were correctly skipped.
- PR #309 squash merge produced current `main` SHA `a735c304b7f288b1014082c79e4dde74cdfeb10a`.
- The source contract preserves canonical Scenario islands and guest redirect ownership while prohibiting Scenario runtime from returning to `LexigoPremiumApp`.
- Indexed search is discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Resolve live refs before writes.
