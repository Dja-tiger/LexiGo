# LexiGo Project State

## Verification

- Last verified: 2026-07-31 03:04 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `2b8171600bc8422c911025a8bb73ae4c78ccc0a6`.
- Latest completed product slice: Issue #70 — prove the two-sided Learn compatibility boundary before runtime deletion.
- Completion PR: #316.
- PR #316 immutable head: `654cb64823bc90cf27a9458694c19995de761767`.
- Authoritative PR CI: #2431 / run `30586633106`, successful.
- Expected-head squash merge produced `2b8171600bc8422c911025a8bb73ae4c78ccc0a6`.
- Exact-SHA stage run `30591994231` deployed web/API images tagged `2b8171600bc8422c911025a8bb73ae4c78ccc0a6`; deploy, public smoke and all 12 public browser checks succeeded.
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
- `LexigoLearnApp` is the canonical `/learn` Lesson Composer owner and renders before the final `LexigoPremiumApp` compatibility fallback.

### Compatibility cleanup evidence

- PR #277 proved canonical Phrases guest/auth reachability; PR #282 removed the unreachable Phrases route runtime; PR #284 consolidated Phrases CSS ownership.
- PR #288 established the Progress boundary; PR #295 removed only its proven-unreachable compatibility presentation.
- PR #298 established the Dictionary boundary; product-owned History entries still preserve live compatibility reachability.
- PR #300 established the Profile boundary; guest authentication and account recovery remain live in `LexigoPremiumApp`.
- PR #303 established the two-sided Scenario route boundary; PR #308 protects the already-absent Scenario compatibility runtime against regression.
- PR #311 proved the Home boundary; PR #313 removed the unreachable legacy Home presentation.
- PR #316 proved that `/learn` renders `LexigoLearnApp` before `LexigoPremiumApp`, bounded legacy `renderLearn` and its dispatch as the next deletion candidate, and explicitly preserved shared lesson creation, authentication, Library, Profile and Lesson owners.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for the Learn runtime deletion and later independently proven compatibility/CSS families.

## In progress

- No product slice is active while PR #316 reconciliation is being completed in this docs-only branch.
- Open Dependabot PRs #304, #305 and #306 are unrelated parallel dependency updates.

## Remaining roadmap

### 1. #70 — Remove only the proven-unreachable legacy Learn presentation

- Delete `renderLearn` and its exact dispatch branch from `LexigoPremiumApp`.
- Remove only dependencies proven Learn-exclusive by exact consumer search.
- Preserve `startLesson`, authentication, Library, Profile, Lesson, unknown-route fallback and Active Lesson behavior.
- Convert the Learn source contract from candidate-presence assertions to absence/preservation assertions.
- Require full authoritative CI, browser matrix, performance budgets, containers, expected-head squash merge and exact-SHA stage validation.

### 2. #70 — Audit remaining compatibility and CSS ownership families

- Select one minimal family per atomic PR.
- CSS cleanup requires selector search, specificity/import-order analysis, computed-cascade ownership and unchanged authoritative Linux visual hashes.
- Finish with bundle/dead-code evidence and README ownership verification before closing Issue #70.

### 3. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after approved design states are available.

### 4. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation.

### 5. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- The next Issue #70 runtime slice must prove `renderLearn` absence while preserving shared owners.
- Dictionary product-history compatibility remains intentionally live.
- Profile and Scenario guest authentication boundaries remain intentionally live.
- Final bundle/dead-code and CSS ownership acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #316 — `test(frontend): prove Learn compatibility boundary` → `2b8171600bc8422c911025a8bb73ae4c78ccc0a6`.
2. #314 — `docs(agent): reconcile PR 313 Home deletion` → `d7a2c037040b1a1d8d978fa038b2528abd92661e`.
3. #313 — `refactor(frontend): remove legacy Home presentation` → `0ce29fd9bf99de77a62c2397b9046d602bce0c7d`.
4. #312 — `docs(agent): reconcile PR 311 Home boundary` → `dbb7d04c083cc266ab3f9247564a7b293e32d272`.

## Evidence

- PR #316 head `654cb64823bc90cf27a9458694c19995de761767` passed authoritative full CI #2431/run `30586633106`.
- Initial CI #2430 failed only because the new source test used an incorrect textual ternary marker; the marker was corrected without runtime changes.
- Reviews, comments and unresolved review threads were empty before Ready and merge.
- Expected-head squash merge produced current product `main` SHA `2b8171600bc8422c911025a8bb73ae4c78ccc0a6`.
- Stage run `30591994231` deployed the exact merge SHA and completed deploy, public smoke and 12/12 public browser checks successfully.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Resolve live refs before writes.
