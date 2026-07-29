# LexiGo Project State

## Verification

- Last verified: 2026-07-29 22:59 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `c8495eacdd8b1289e82a532668834414fb63e55c`.
- Latest completed product slice: Issue #70 — prove the authenticated/guest Scenario compatibility boundary without deleting runtime.
- Completion PR: #303.
- PR #303 immutable developer-authored head: `ba5663bfbe68aed5750d76fa698e700a3116a98c`.
- Authoritative PR CI: #2395 / run `30471439763`, successful.
- Expected-head squash merge produced `c8495eacdd8b1289e82a532668834414fb63e55c`.
- Exact-SHA stage run `30479156802` deployed web/API images tagged `c8495eacdd8b1289e82a532668834414fb63e55c`; deploy and public smoke succeeded.
- Public browser gate concluded success after one iOS WebKit retry. The first stale-build-marker attempt reported a transient service-worker access-control pageerror; retry passed and the deployment status remained success.
- Reviews, comments and unresolved review threads were empty before merge.

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
- PR #303 established the two-sided Scenario boundary: authenticated `/scenarios` and `/scenarios/[slug]` select dedicated islands before `LexigoPremiumApp`, while guest entry remains redirected to `/profile?session=required&return_to=...`.
- Scenario runtime deletion was intentionally not performed because the guest authentication boundary remains live.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for later independently proven compatibility or selector families.

## In progress

- No product or tooling slice is active after PR #303.
- This Agent Docs reconciliation records the exact merge/deployment evidence and resets current task memory.

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

1. #303 — `test(frontend): prove Scenario compatibility boundary` → `c8495eacdd8b1289e82a532668834414fb63e55c`.
2. #302 — `docs(agent): reconcile PR 301 and tool-selection safety` → `8576c6645d31a4d4d4ef7b1aed5c2453f28d5d84`.
3. #301 — `docs(agent): reconcile PR 300 main state` → `9d82b67efc2b408f0696f856e2f3aad33c9aa244`.
4. #300 — `test(frontend): prove Profile compatibility boundary` → `3f6efd70d8f8d76fcbd59a35aa292c078352c2ec`.

## Evidence

- PR #303 head `ba5663bfbe68aed5750d76fa698e700a3116a98c` passed authoritative full CI #2395/run `30471439763`.
- Expected-head squash merge produced `c8495eacdd8b1289e82a532668834414fb63e55c`.
- Stage run `30479156802` deployed the exact merge SHA and completed deploy, public smoke and public browser successfully.
- The executable source contract proves authenticated Scenario catalog/detail ownership and preserves the live guest redirect boundary.
- Indexed search is discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Resolve live refs before writes.
