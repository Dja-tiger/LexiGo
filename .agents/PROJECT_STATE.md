# LexiGo Project State

## Verification

- Last verified: 2026-07-31 15:16 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `1e04674aada19b5c024aa3688b45c75ab1e1d7cb`.
- Latest completed product slice: Issue #70 — remove the proven-unreachable legacy Learn presentation.
- Completion PR: #318.
- PR #318 immutable head: `a717f1abb8c4749e6d684e687043ab0414bc01e7`.
- Authoritative PR CI: #2444 / run `30620664121`, successful.
- Expected-head squash merge produced `1e04674aada19b5c024aa3688b45c75ab1e1d7cb`.
- Exact-SHA stage run `30626027711` deployed web/API images tagged `1e04674aada19b5c024aa3688b45c75ab1e1d7cb`; deploy, public smoke and all 12 public browser checks succeeded.
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
- PR #316 proved the two-sided Learn compatibility boundary.
- PR #318 removed only `renderLearn` and its exact dispatch branch, converted source contracts to absence/preservation evidence, and aligned Browser Back/Forward E2E with canonical empty-active-lesson and saved-active-lesson states.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for later independently proven compatibility/CSS families and final dead-code acceptance.

## In progress

- No product slice is active while PR #318 reconciliation is being completed in this docs-only branch.
- Open Dependabot PRs #304, #305 and #306 are unrelated parallel dependency updates.

## Remaining roadmap

### 1. #70 — Audit the next compatibility or CSS ownership family

- Select one minimal family per atomic PR.
- Prove canonical ownership and compatibility reachability before deletion.
- Preserve shared authentication, lesson-domain and unknown-route owners.
- CSS cleanup requires selector search, specificity/import-order analysis, computed-cascade ownership and unchanged authoritative Linux visual hashes.

### 2. #70 — Final dead-code and bundle acceptance

- Complete exact consumer search for remaining compatibility owners.
- Verify bundle impact, route budgets and README ownership before closing Issue #70.

### 3. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after approved design states are available.

### 4. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation.

### 5. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- The next Issue #70 slice must be selected from fresh live evidence; no new family is pre-authorized by this reconciliation.
- Dictionary product-history compatibility remains intentionally live.
- Profile and Scenario guest authentication boundaries remain intentionally live.
- Final bundle/dead-code and CSS ownership acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #318 — `refactor(frontend): remove legacy Learn presentation` → `1e04674aada19b5c024aa3688b45c75ab1e1d7cb`.
2. #316 — `test(frontend): prove Learn compatibility boundary` → `2b8171600bc8422c911025a8bb73ae4c78ccc0a6`.
3. #314 — `docs(agent): reconcile PR 313 Home deletion` → `d7a2c037040b1a1d8d978fa038b2528abd92661e`.
4. #313 — `refactor(frontend): remove legacy Home presentation` → `0ce29fd9bf99de77a62c2397b9046d602bce0c7d`.

## Evidence

- PR #318 head `a717f1abb8c4749e6d684e687043ab0414bc01e7` passed authoritative full CI #2444/run `30620664121`.
- Earlier CI failures were stale browser expectations after the legacy heading was retired; runtime behavior remained canonical and the assertions were corrected to distinguish absent and saved active-lesson states.
- Reviews, comments and unresolved review threads were empty before Ready and merge.
- Expected-head squash merge produced current product `main` SHA `1e04674aada19b5c024aa3688b45c75ab1e1d7cb`.
- Stage run `30626027711` deployed the exact merge SHA and completed deploy, public smoke and 12/12 public browser checks successfully.
- Accidental empty Issues #319, #320 and #321 were immediately closed as `not_planned`; they track no project work.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Resolve live refs before writes.
