# LexiGo Project State

## Verification

- Last verified: 2026-07-30 22:39 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `0ce29fd9bf99de77a62c2397b9046d602bce0c7d`.
- Latest completed product slice: Issue #70 — remove the proven-unreachable legacy Home presentation from `LexigoPremiumApp`.
- Completion PR: #313.
- PR #313 immutable developer-authored head: `b7e8c872078a60aceeacaad6fd5978ed3d6164cb`.
- Authoritative PR CI: #2426 / run `30575851960`, successful.
- Expected-head squash merge produced `0ce29fd9bf99de77a62c2397b9046d602bce0c7d`.
- Exact-SHA stage run `30577252268` deployed web/API images tagged `0ce29fd9bf99de77a62c2397b9046d602bce0c7d`; deploy, public smoke and public browser validation succeeded.
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
- PR #311 proved that `/` is forced onto the Home graph and renders `LexigoHomeApp` before the `LexigoPremiumApp` fallback.
- PR #313 removed the now-unreachable `renderHome` presentation, its Home dispatch branch and Home-only `WORD_PREVIEW`, `russianPlural`, `goalPercent` and `RETAINED_COPY` dependencies.
- The Home absence/preservation source contract keeps shared authentication, recovery, unknown-route, progress-loading, active-lesson and lesson-domain owners explicit.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for later independently proven compatibility or selector families.

## In progress

- No product or tooling slice is active after PR #313 post-merge validation.
- Agent Docs reconciliation is being completed in a separate docs-only PR.
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
- Home shared lesson/auth/fallback owners remain intentionally live after presentation deletion.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #313 — `refactor(frontend): remove legacy Home presentation` → `0ce29fd9bf99de77a62c2397b9046d602bce0c7d`.
2. #312 — `docs(agent): reconcile PR 311 Home boundary` → `dbb7d04c083cc266ab3f9247564a7b293e32d272`.
3. #311 — `test(frontend): prove Home compatibility boundary` → `8ce61297d4c0ade5cb687a42ca11047b836c85c3`.
4. #310 — Agent Docs reconciliation before the Home slice → `94836b3214dddccd58e249a342f0e56505bf2d7d`.

## Evidence

- PR #313 head `b7e8c872078a60aceeacaad6fd5978ed3d6164cb` passed authoritative full CI #2426/run `30575851960`.
- A prior full CI #2419/run `30568316390` also passed on the runtime/test head before final documentation updates.
- The final branch diff contained exactly six allowed files and no temporary workflow.
- Reviews, comments and unresolved review threads were empty before Ready and merge.
- Expected-head squash merge produced current product `main` SHA `0ce29fd9bf99de77a62c2397b9046d602bce0c7d`.
- Stage run `30577252268` deployed the exact product merge SHA and completed deploy, public smoke and public browser validation successfully; one iOS WebKit stale-build check required its configured retry and then passed.
- The Home source contract prohibits the legacy presentation from returning while preserving shared compatibility owners.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Resolve live refs before writes.
