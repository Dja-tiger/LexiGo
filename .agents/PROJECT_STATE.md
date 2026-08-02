# LexiGo Project State

## Verification

- Last verified: 2026-08-02 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `b5eea8177255f2bc595340ef9e2abc5bc46a16a3`.
- Latest deployed product SHA: `b5eea8177255f2bc595340ef9e2abc5bc46a16a3`.
- Latest completed Issue #70 slice: removal of the proven-unreachable authenticated Profile compatibility presentation and its helper-only runtime from `LexigoPremiumApp`, while preserving guest authentication/recovery and canonical Profile/Progress ownership.
- Completion PR: #344.
- PR #344 immutable head: `39a46919ba376cae03882f3c703a59ac61ef1e22`.
- Authoritative final PR CI: #2525 / run `30751670158`, successful.
- Expected-head squash merge produced product SHA `b5eea8177255f2bc595340ef9e2abc5bc46a16a3`.
- Post-merge main CI run `30752056658` succeeded on the exact product merge SHA.
- Exact-SHA stage run `30752387593` deployed web/API images tagged `b5eea8177255f2bc595340ef9e2abc5bc46a16a3`; deploy, public smoke and all 12 public browser checks succeeded.
- No Issue #70 product PR is active at verification time.
- Open PRs #304, #305 and #306 are pre-existing Dependabot dependency updates and are outside this completed production slice.
- PR #344 comments, reviews and unresolved review threads were empty before merge.

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Backend unit/race/integration/security gates and frontend lint/type/unit/build/browser gates are mandatory for product and mixed changes.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy stage.

### Learning and route ownership

- Home, Learn, Active Lesson, Phrases, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole durable review-queue owner.
- `LexigoLearnApp` is the canonical `/learn` Lesson Composer owner and renders before the final `LexigoPremiumApp` compatibility fallback.
- Authenticated `/profile` is selected by the canonical `LexigoProfileApp` before the final compatibility fallback.
- Guest `/profile` login, registration, forgot-password, reset-password, reset-token and validation flows remain intentionally compatibility-owned by `LexigoPremiumApp.renderProfile()`.
- Authenticated and guest `/progress` remain owned by canonical `LexigoProgressApp` before the compatibility fallback.

### Compatibility cleanup evidence

- PR #277 proved canonical Phrases guest/auth reachability; PR #282 removed the unreachable Phrases route runtime; PR #284 consolidated Phrases CSS ownership.
- PR #288 established the Progress boundary; PR #295 removed only its proven-unreachable compatibility presentation.
- PR #298 established the Dictionary boundary; product-owned History entries still preserve live compatibility reachability.
- PR #300 established the Profile boundary; guest authentication and account recovery remain live in `LexigoPremiumApp`.
- PR #303 established the two-sided Scenario route boundary; PR #308 protects the already-absent Scenario compatibility runtime against regression.
- PR #311 proved the Home boundary; PR #313 removed the unreachable legacy Home presentation.
- PR #316 proved the two-sided Learn compatibility boundary; PR #318 removed only `renderLearn` and its exact dispatch branch.
- PR #324 added executable inventory proving that dedicated route islands precede the final fallback, retired route presentations remain absent, and remaining compatibility dispatch is limited to live Library, guest Profile and Lesson behavior.
- PR #328 added production-network evidence that the live compatibility fallback retains independently loaded JavaScript assets and that measured canonical route islands exclude those fallback-exclusive assets.
- PR #330 removed the Phrases route-after-base source-order assumption; PR #332 synchronized the normative CSS-specificity rule with the production order-independence contract.
- PR #334 deleted `dictionary-detail-compatibility.css` and moved every live declaration group to the exact canonical owner without changing selector behavior.
- PR #336 proved zero production consumers of the remaining `.lx-dictionary-detail*` selector family.
- PR #337 corrected only the WebKit test fixture that prepares adjacent History entries for the Active Lesson Browser Back contract; production runtime remained unchanged.
- PR #339 removed all 12 proven orphaned `.lx-dictionary-detail*` selector tokens; its CSS patch was deletion-only and authoritative Linux visual regression remained unchanged.
- PR #341 added `profile-authenticated-fallback-source.test.ts` and proved authenticated `/profile` selects `LexigoProfileApp` before `LexigoPremiumApp`, while guest Profile authentication/recovery remains live.
- PR #341 bounded the exact authenticated Profile deletion candidate to the post-guest return, `formatAccountDate`, compatibility-local `logout` and compatibility-local unused `updateDailyGoal`.
- PR #344 deleted that exact bounded candidate and no neighboring runtime family.
- `LexigoPremiumApp.renderProfile()` still preserves the complete guest branch and ends with fail-closed `return null` for the impossible authenticated compatibility state.
- `profile-authenticated-fallback-source.test.ts` now requires physical absence of the deleted authenticated family, continued presence of guest auth/recovery markers and continued canonical Profile mutation ownership.
- The directly affected `progress-route-island-source.test.ts` now treats only `progress.dailyGoal` and Profile navigation as retired Profile-owned consumers while preserving shared Progress state/loading, `latestProgressRef` and `lessonProgressBeforeRef` requirements.
- No Progress runtime, bootstrap route, canonical Profile, CSS, visual baseline, route-budget ceiling, API, backend, migration, workflow, dependency, README or architecture file changed in PR #344.
- `LexigoPremiumApp` remains reachable for guest Profile authentication/recovery, Library, Lesson and unknown/product-route fallback; broad deletion remains prohibited without exact replacement and reachability evidence.

## In progress

- No atomic production slice is active.
- No Issue #70 product pull request is open.
- This documentation-only reconciliation records PR #344 delivery evidence and resets the completed task context.
- The next atomic product task may start only after this reconciliation is merged and live GitHub state is checked again.

## Remaining roadmap

### 1. #70 — Audit the next compatibility or CSS ownership family

- Select one minimal family per atomic PR from fresh source, route, bundle and production evidence.
- Prove canonical ownership and compatibility reachability before deletion.
- Preserve guest authentication/recovery, Library, Lesson, unknown-route and shared account/session owners.
- CSS cleanup requires exact consumer search, specificity/import-order analysis, computed-cascade ownership and unchanged authoritative Linux visual hashes.
- Do not infer that neighboring helpers, selectors or state are dead from the completed Profile cleanup.

### 2. #70 — Final dead-code and bundle acceptance

- Complete exact consumer search for remaining compatibility owners.
- Use the PR #328 fallback-exclusive asset evidence together with source ownership, route budgets and README contracts when assessing final bundle acceptance.
- Verify final dead-code inventory, fallback reachability, global CSS ownership, route budgets and README acceptance criteria before closing Issue #70.

### 3. Dependency maintenance

- PRs #304, #305 and #306 remain separate Dependabot updates.
- Do not mix dependency upgrades with Issue #70 compatibility cleanup.
- Evaluate each dependency PR against repository security, browser, visual and deployment gates in its own atomic slice.

### 4. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after approved design states are available.

### 5. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation.

### 6. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- Guest Profile authentication and recovery remain intentionally live and must not be included in inferred deletion.
- Library, Lesson, unknown/product-route fallback and shared account/session runtime remain intentionally live.
- Dictionary product-history compatibility remains intentionally live.
- `.lx-dictionary-result-heading*` and `.lx-dictionary-translation` remain protected live declarations.
- Scenario guest authentication boundaries remain intentionally live.
- Final Issue #70 bundle/dead-code, compatibility reachability, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #344 — `refactor(frontend): remove authenticated Profile fallback duplicate` → `b5eea8177255f2bc595340ef9e2abc5bc46a16a3`.
2. #342 — `docs(agent): reconcile PR 341 Profile reachability proof` → `9bf254cf423b0d0bf69db836882b253797d24466`.
3. #341 — `test(frontend): prove authenticated Profile fallback duplicate unreachable` → `c516a47910dfad46e174f90c9adf27919f7b4d4d`.
4. #340 — `docs(agent): reconcile PR 339 Dictionary selector cleanup` → `ab906738ab19287aac40016b5d28c2f341e3ae45`.
5. #339 — `style(frontend): remove orphaned Dictionary detail selectors` → `29bf4bba7909fb370e9887d24d00e463da065e33`.

## Evidence

- PR #344 final developer-authored head `39a46919ba376cae03882f3c703a59ac61ef1e22` passed authoritative full CI #2525 / run `30751670158` before expected-head squash merge.
- Final PR CI passed Profile absence and Progress ownership source contracts, frontend lint, typecheck, unit tests, production build and dependency audit.
- Backend unit/security/integration, both UI shards, Lesson completion, Dictionary smoke, iOS PWA, controlled service worker, CSP, Linux visual regression, accessibility, performance budgets and both container builds succeeded.
- PR #344 discussion contained no comments, reviews or unresolved review threads; its final diff remained restricted to one production TSX file, two directly related source contracts and `.agents/current/**`.
- Production TSX change was deletion-dominant: 88 deletions and 37 additions, where additions were the fail-closed terminator and local indentation normalization.
- Expected-head squash merge produced product SHA `b5eea8177255f2bc595340ef9e2abc5bc46a16a3`.
- Post-merge main CI run `30752056658` repeated the complete product matrix successfully on that exact merge SHA.
- Stage run `30752387593` validated the exact CI scope artifact, deployed web/API images tagged `b5eea8177255f2bc595340ef9e2abc5bc46a16a3`, returned HTTP 200 for frontend and API readiness and completed all 12 desktop Chromium/iOS WebKit public browser checks successfully.
- No snapshot, route-budget ceiling or production owner outside the bounded authenticated Profile family changed.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA, and the latest completed delivery evidence. It intentionally does not claim that a SHA embedded in a documentation commit will remain the live tip after that documentation PR merges. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in those recorded facts. Always verify the current live GitHub tip separately before writes. Do not create recursive reconciliation PRs solely because a docs-only reconciliation merge advanced `main`.
