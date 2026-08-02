# LexiGo Project State

## Verification

- Last verified: 2026-08-02 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `c516a47910dfad46e174f90c9adf27919f7b4d4d`.
- Latest deployed product SHA: `c516a47910dfad46e174f90c9adf27919f7b4d4d`.
- Latest completed Issue #70 slice: executable proof that the authenticated presentation inside the compatibility-owned Profile renderer is unreachable, while guest authentication and password recovery remain live.
- Completion PR: #341.
- PR #341 immutable head: `0bcab13d69121c375a718d7663c26c622c43a69b`.
- Authoritative final PR CI: #2512 / run `30738044292`, successful.
- Expected-head squash merge produced product SHA `c516a47910dfad46e174f90c9adf27919f7b4d4d`.
- Post-merge main CI run `30738363662` succeeded on the exact product merge SHA.
- Exact-SHA stage run `30738638783` deployed web/API images tagged `c516a47910dfad46e174f90c9adf27919f7b4d4d`; deploy, public smoke and all 12 public browser checks succeeded.
- No Issue #70 product PR is active at verification time.
- Unrelated Dependabot PRs #304, #305 and #306 remain open and were not mixed into this slice.
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
- PR #332 synchronized the normative CSS-specificity rule with the production Phrases order-independence contract; PR #333 reset the completed current context.
- PR #334 deleted `dictionary-detail-compatibility.css` and its root-layout import after moving every live declaration group to the exact canonical owner.
- `dictionary-catalog.css` owns Dictionary route variables, active filter/status colors and the compact filter-toggle correction while preserving the prior effective later-file position after forced-colors.
- `word-detail.css` owns the `/words/[id]` example-heading dark contrast correction.
- `route-navigation.css` owns the `/words/[id]` active Library rail-label dark contrast correction.
- `word-detail-source.test.ts` proves physical compatibility-file/import absence, exact canonical declaration blocks, single occurrence and no cross-owner placement.
- PR #336 added `dictionary-detail-orphan-source.test.ts`, which recursively inspects executable `app`, `components` and `lib` TypeScript/TSX, excludes tests/specs, strips comments and proved zero production consumers of the `lx-dictionary-detail` prefix.
- PR #337 corrected only the WebKit test fixture that prepares adjacent History entries for the Active Lesson Browser Back contract; production runtime remained unchanged.
- PR #339 removed all 12 proven orphaned `.lx-dictionary-detail*` selector tokens from `dictionary-catalog.css`, including their compact and dark-mode overrides.
- The PR #339 CSS patch was deletion-only: 79 removed CSS lines and zero CSS additions.
- Three grouped rules were reduced to their live `.lx-dictionary-result-heading*` selector owners without changing declaration values.
- `.lx-dictionary-translation` remained independent and unchanged.
- `dictionary-detail-orphan-source.test.ts` now enforces both zero executable production consumers and zero remaining legacy selector tokens, while protecting the three live result-heading blocks and translation block by exact single-occurrence assertions.
- PR #339 changed no runtime TSX, API, backend, CSS import order, visual baseline, route-budget ceiling, workflow, dependency, README or architecture contract.
- Both authoritative Linux visual regression runs passed without snapshot changes, validating the no-mounted-consumer claim.
- PR #341 added `profile-authenticated-fallback-source.test.ts` without changing production runtime.
- The new contract proves that authenticated `/profile` requires a restored non-null session and selects `LexigoProfileApp` before the final `LexigoPremiumApp` fallback.
- It isolates the guest and authenticated portions of `LexigoPremiumApp.renderProfile()` and protects live login, registration, forgot-password, reset-password, validation and endpoint markers.
- It proves the post-guest authenticated Profile summary is a duplicate of the canonical route island and bounds the future deletion candidate to that return plus compatibility-local `formatAccountDate`, `logout` and uncalled `updateDailyGoal`.
- The proof records exact occurrence counts rather than relying on names or indexed search.
- It also proves canonical `LexigoProfileApp` independently owns authenticated logout, daily-goal mutation, appearance and calendar integration.
- Guest Profile dispatch, Library fallback and Lesson fallback remain explicitly protected and live.
- PR #341 changed no production runtime, CSS, API, backend, visual baseline, route-budget ceiling, workflow, dependency, README or architecture contract.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown/product-route fallback and shared lesson-domain behavior; broad deletion remains prohibited.
- Issue #70 remains open for the separately bounded authenticated Profile deletion, independently proven compatibility/CSS families and final dead-code, bundle and ownership acceptance.

## In progress

- No atomic production slice is active.
- No Issue #70 product pull request is open.
- The next atomic task must be selected only after this reconciliation is merged and fresh live evidence is reviewed.

## Remaining roadmap

### 1. #70 — Remove the proven-unreachable authenticated Profile fallback duplicate

- Use PR #341 as the executable reachability and exact-consumer manifest.
- Remove only the authenticated return after the guest `if (!session)` branch inside `renderProfile()`.
- Remove compatibility-local `formatAccountDate`, `logout` and uncalled `updateDailyGoal` only if the updated source contract proves complete absence.
- Preserve `renderProfile()` itself and all guest login/register/forgot/reset presentation, validation, endpoints and reset-token handling.
- Preserve the bootstrap predicate, canonical `LexigoProfileApp`, Library fallback, Lesson fallback and shared account runtime.
- Convert the PR #341 presence/count proof into an absence contract while retaining all live-owner guards.

### 2. #70 — Audit the next compatibility or CSS ownership family

- Select one minimal family per atomic PR.
- Prove canonical ownership and compatibility reachability before deletion.
- Preserve shared authentication, lesson-domain and unknown-route owners.
- CSS cleanup requires exact consumer search, specificity/import-order analysis, computed-cascade ownership and unchanged authoritative Linux visual hashes.

### 3. #70 — Final dead-code and bundle acceptance

- Complete exact consumer search for remaining compatibility owners.
- Use the PR #328 fallback-exclusive asset evidence together with source ownership, route budgets and README contracts when assessing final bundle acceptance.
- Verify final bundle/dead-code, global CSS ownership and README acceptance criteria before closing Issue #70.

### 4. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after approved design states are available.

### 5. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation.

### 6. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- The authenticated Profile duplicate remains in production source until the separate deletion PR passes full immutable-head CI and exact-SHA deployment validation.
- Guest Profile direct entry, reload, reset-token flow, login, registration and password recovery remain intentionally live in `LexigoPremiumApp`.
- Dictionary product-history compatibility remains intentionally live.
- `.lx-dictionary-result-heading*` and `.lx-dictionary-translation` remain protected live declarations.
- Profile and Scenario guest authentication boundaries remain intentionally live.
- Final bundle/dead-code, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #341 — `test(frontend): prove authenticated Profile fallback duplicate unreachable` → `c516a47910dfad46e174f90c9adf27919f7b4d4d`.
2. #340 — `docs(agent): reconcile PR 339 Dictionary selector cleanup` → `ab906738ab19287aac40016b5d28c2f341e3ae45`.
3. #339 — `style(frontend): remove orphaned Dictionary detail selectors` → `29bf4bba7909fb370e9887d24d00e463da065e33`.
4. #338 — `docs(agent): reconcile PR 336 and PR 337 validation` → `377d3d11ff5faf0c8fc95ac78f738add7bfac306`.
5. #337 — `test(frontend): stabilize WebKit Active Lesson history setup` → `109ffd8dd39587a83e791ba195449a49bd084cbf`.

## Evidence

- PR #341 final head `0bcab13d69121c375a718d7663c26c622c43a69b` passed authoritative full CI #2512/run `30738044292` before expected-head squash merge.
- The final CI repeated the exact Profile source manifest, frontend lint/typecheck/unit/build/audit, backend unit/security/integration, both UI shards, lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds successfully.
- The source contract passed without relaxing route predicates, guest auth/recovery markers or helper occurrence counts.
- Review comments, review submissions and unresolved threads were empty before PR #341 merge.
- Expected-head squash merge produced product SHA `c516a47910dfad46e174f90c9adf27919f7b4d4d`.
- Post-merge main CI run `30738363662` repeated the complete product matrix successfully on the exact merge SHA.
- Stage run `30738638783` deployed the exact merge SHA; web/API containers were healthy, public frontend/API smoke passed and all 12 desktop Chromium/iOS WebKit public browser checks passed.
- No production runtime, visual baseline, performance ceiling, API contract, dependency or workflow was changed to obtain green validation.
- PR #341 is proof-only; the authenticated duplicate and its helper-only consumers remain a separate atomic deletion task.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA, and the latest completed delivery evidence. It intentionally does not claim that a SHA embedded in a documentation commit will remain the live tip after that documentation PR merges. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in those recorded facts. Always verify the current live GitHub tip separately before writes. Do not create recursive reconciliation PRs solely because a docs-only reconciliation merge advanced `main`.
