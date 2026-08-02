# LexiGo Project State

## Verification

- Last verified: 2026-08-02 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `29bf4bba7909fb370e9887d24d00e463da065e33`.
- Latest deployed product SHA: `29bf4bba7909fb370e9887d24d00e463da065e33`.
- Latest completed Issue #70 slice: deletion of the proven-unreachable legacy `.lx-dictionary-detail*` CSS selector family while preserving every live adjacent Dictionary declaration.
- Completion PR: #339.
- PR #339 immutable head: `dea9227bc37ad458c78ef33a4853a4074a35f380`.
- Authoritative final PR CI: #2505 / run `30736298511`, successful.
- Expected-head squash merge produced product SHA `29bf4bba7909fb370e9887d24d00e463da065e33`.
- Post-merge main CI run `30736614782` succeeded on the exact product merge SHA.
- Exact-SHA stage run `30736912145` deployed web/API images tagged `29bf4bba7909fb370e9887d24d00e463da065e33`; deploy, public smoke and all 12 public browser checks succeeded.
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
- No selector text, declaration value, specificity, component markup, runtime behavior, visual snapshot or route-budget ceiling changed in PR #334.
- PR #336 added `dictionary-detail-orphan-source.test.ts`, which recursively inspects executable `app`, `components` and `lib` TypeScript/TSX, excludes tests/specs, strips comments and proved zero production consumers of the `lx-dictionary-detail` prefix.
- PR #336 bounded the exact remaining legacy selector inventory while intentionally leaving deletion to a separate atomic slice.
- PR #337 corrected only the WebKit test fixture that prepares adjacent History entries for the Active Lesson Browser Back contract; production runtime remained unchanged.
- PR #339 removed all 12 proven orphaned `.lx-dictionary-detail*` selector tokens from `dictionary-catalog.css`, including their compact and dark-mode overrides.
- The PR #339 CSS patch was deletion-only: 79 removed CSS lines and zero CSS additions.
- Three grouped rules were reduced to their live `.lx-dictionary-result-heading*` selector owners without changing declaration values.
- `.lx-dictionary-translation` remained independent and unchanged.
- `dictionary-detail-orphan-source.test.ts` now enforces both zero executable production consumers and zero remaining legacy selector tokens, while protecting the three live result-heading blocks and translation block by exact single-occurrence assertions.
- PR #339 changed no runtime TSX, API, backend, CSS import order, visual baseline, route-budget ceiling, workflow, dependency, README or architecture contract.
- Both authoritative Linux visual regression runs passed without snapshot changes, validating the no-mounted-consumer claim.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown/product-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for independently proven compatibility/CSS families and final dead-code, bundle and ownership acceptance.

## In progress

- No atomic production slice is active.
- No Issue #70 product pull request is open.
- The next atomic task must be selected only after this reconciliation is merged and fresh live evidence is reviewed.

## Remaining roadmap

### 1. #70 — Audit the next compatibility or CSS ownership family

- Select one minimal family per atomic PR.
- Prove canonical ownership and compatibility reachability before deletion.
- Preserve shared authentication, lesson-domain and unknown-route owners.
- CSS cleanup requires exact consumer search, specificity/import-order analysis, computed-cascade ownership and unchanged authoritative Linux visual hashes.
- Do not infer that neighboring Dictionary selectors are dead merely because `.lx-dictionary-detail*` is now absent.

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

- The next Issue #70 family has not been selected or authorized; fresh source, runtime, cascade and bundle evidence is required.
- Dictionary product-history compatibility remains intentionally live.
- `.lx-dictionary-result-heading*` and `.lx-dictionary-translation` remain protected live declarations.
- Profile and Scenario guest authentication boundaries remain intentionally live.
- Final bundle/dead-code, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #339 — `style(frontend): remove orphaned Dictionary detail selectors` → `29bf4bba7909fb370e9887d24d00e463da065e33`.
2. #338 — `docs(agent): reconcile PR 336 and PR 337 validation` → `377d3d11ff5faf0c8fc95ac78f738add7bfac306`.
3. #337 — `test(frontend): stabilize WebKit Active Lesson history setup` → `109ffd8dd39587a83e791ba195449a49bd084cbf`.
4. #336 — `test(frontend): prove legacy Dictionary detail CSS orphaned` → `b4dace966bffcb482231d48b9b7926fee4e2b26f`.
5. #334 — `refactor(frontend): consolidate Dictionary detail CSS ownership` → `c184742b651d0f0f8fbdd2c02e7e0c987c86b95b`.

## Evidence

- PR #339 final head `dea9227bc37ad458c78ef33a4853a4074a35f380` passed authoritative full CI #2505/run `30736298511` before expected-head squash merge.
- The final CI repeated frontend source-contract, lint, typecheck, unit tests, production build, dependency audit, backend unit/security/integration, both UI shards, Dictionary smoke, iOS PWA, controlled service worker, CSP, lesson completion, accessibility, performance budgets and both container builds successfully.
- Linux visual regression passed on both the pre-final and final PR heads without snapshot updates.
- The CSS deletion removed 79 lines and added no CSS; exact live result-heading and translation declaration blocks remained unchanged and uniquely protected.
- Review comments, review submissions and unresolved threads were empty before PR #339 merge.
- Expected-head squash merge produced product SHA `29bf4bba7909fb370e9887d24d00e463da065e33`.
- Post-merge main CI run `30736614782` repeated the complete product matrix successfully on the exact merge SHA.
- Stage run `30736912145` deployed the exact merge SHA; web/API containers were healthy, public frontend/API smoke passed and all 12 desktop Chromium/iOS WebKit public browser checks passed.
- No visual baseline, performance ceiling, runtime/API contract, dependency or workflow was changed to obtain green validation.
- Earlier PR #334 ownership evidence and PR #336 consumer proof remain executable and are strengthened by the PR #339 absence contract.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA, and the latest completed delivery evidence. It intentionally does not claim that a SHA embedded in a documentation commit will remain the live tip after that documentation PR merges. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in those recorded facts. Always verify the current live GitHub tip separately before writes. Do not create recursive reconciliation PRs solely because a docs-only reconciliation merge advanced `main`.
