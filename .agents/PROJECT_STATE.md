# LexiGo Project State

## Verification

- Last verified: 2026-07-30 15:58 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `8ce61297d4c0ade5cb687a42ca11047b836c85c3`.
- Latest completed product slice: Issue #70 — prove the two-sided Home compatibility boundary before any runtime deletion.
- Completion PR: #311.
- PR #311 immutable developer-authored head: `f45115b551a19a8313e2950058650b5d40071924`.
- Authoritative PR CI: #2409 / run `30535283540`, successful after the isolated UI shard rerun.
- Expected-head squash merge produced `8ce61297d4c0ade5cb687a42ca11047b836c85c3`.
- Exact-SHA stage run `30546514323` deployed web/API images tagged `8ce61297d4c0ade5cb687a42ca11047b836c85c3`; deploy, public smoke and all 12 public browser checks succeeded.
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
- PR #303 established the two-sided Scenario route boundary; PR #308 protects the already-absent Scenario compatibility runtime against regression.
- PR #311 proves that `/` is forced onto the Home graph and renders `LexigoHomeApp` before the `LexigoPremiumApp` fallback, while explicitly preserving shared authentication, recovery, unknown-route and lesson-domain owners.
- The legacy `renderHome` presentation family is now a bounded future deletion candidate; no runtime or CSS was deleted by PR #311.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for later independently proven compatibility or selector families.

## In progress

- No product or tooling slice is active after PR #311 post-merge validation.
- Agent Docs reconciliation is being completed in a separate docs-only PR.
- Open Dependabot PRs #304, #305 and #306 are unrelated parallel dependency updates and are not part of the active Issue #70 workflow.

## Remaining roadmap

### 1. #70 — Select the next independently proven compatibility family

- Re-read live routing, imports, fallback predicates, markup consumers and `frontend/docs/compatibility-cleanup.md` before choosing scope.
- Select one minimal family per atomic PR.
- Preserve guest authentication, account recovery, unknown-route fallback and all shared lesson-domain behavior until exact evidence proves replacement ownership.
- The Home compatibility presentation may be considered for a later deletion slice only after exact shared-domain and consumer evidence is revalidated.
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
- Home shared lesson/auth/fallback owners remain intentionally live.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #311 — `test(frontend): prove Home compatibility boundary` → `8ce61297d4c0ade5cb687a42ca11047b836c85c3`.
2. #310 — Agent Docs reconciliation before the Home slice → `94836b3214dddccd58e249a342f0e56505bf2d7d`.
3. #309 — `docs(agent): reconcile PR 308 Scenario absence` → `a735c304b7f288b1014082c79e4dde74cdfeb10a`.
4. #308 — `test(frontend): lock Scenario compatibility absence` → `f2bc1dfb46408bdd85bbc9ad4a1145f7269908f6`.

## Evidence

- PR #311 head `f45115b551a19a8313e2950058650b5d40071924` passed authoritative full CI #2409/run `30535283540`.
- The first CI run exposed an incorrect source-marker assertion; it was corrected without runtime changes.
- A pre-existing Active Lesson WebKit test failed once on `/learn`; the isolated failed job rerun passed on the same immutable head, and the complete workflow concluded successfully.
- Expected-head squash merge produced current product `main` SHA `8ce61297d4c0ade5cb687a42ca11047b836c85c3`.
- Stage run `30546514323` deployed the exact product merge SHA and completed deploy, public smoke and 12/12 public browser checks successfully.
- The Home source contract protects canonical route-graph and render-order ownership while preserving the bounded compatibility manifest.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Resolve live refs before writes.
