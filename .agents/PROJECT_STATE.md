# LexiGo Project State

## Verification

- Last verified: 2026-08-02 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `109ffd8dd39587a83e791ba195449a49bd084cbf`.
- Latest deployed product SHA: `109ffd8dd39587a83e791ba195449a49bd084cbf`.
- Latest completed Issue #70 sequence: executable orphan proof for the legacy `.lx-dictionary-detail*` CSS family, followed by correction of the WebKit Active Lesson Browser Back test setup discovered during post-merge validation.
- Proof PR: #336.
- PR #336 immutable head: `d22d71041c2722770eacea85eaa45d77738db746`.
- PR #336 authoritative final CI: #2493 / run `30725579604`, successful.
- PR #336 expected-head squash merge: `b4dace966bffcb482231d48b9b7926fee4e2b26f`.
- PR #336 post-merge main CI run `30725885894` failed only the desktop WebKit Active Lesson Browser Back test because the test setup used Next.js-patched History methods; stage was correctly blocked.
- Corrective PR: #337.
- PR #337 immutable head: `632e87ac6c00b2934012b09a98001f62a2f22c4d`.
- PR #337 authoritative final CI: #2498 / run `30726742268`, successful.
- PR #337 expected-head squash merge produced product SHA `109ffd8dd39587a83e791ba195449a49bd084cbf`.
- Post-merge main CI run `30726998934` succeeded on the exact corrective merge SHA.
- Exact-SHA stage run `30727269090` deployed web/API images tagged `109ffd8dd39587a83e791ba195449a49bd084cbf`; deploy, public smoke and all 12 public browser checks succeeded.
- No pull requests were open at verification time.
- Reviews, comments and unresolved review threads were empty before the corrective merge.

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
- `dictionary-catalog.css` now owns Dictionary route variables, active filter/status colors and the compact filter-toggle correction while preserving the prior effective later-file position after forced-colors.
- `word-detail.css` now owns the `/words/[id]` example-heading dark contrast correction.
- `route-navigation.css` now owns the `/words/[id]` active Library rail-label dark contrast correction.
- `word-detail-source.test.ts` proves physical compatibility-file/import absence, exact canonical declaration blocks, single occurrence and no cross-owner placement.
- No selector text, declaration value, specificity, component markup, runtime behavior, visual snapshot or route-budget ceiling changed in PR #334.
- PR #336 added `dictionary-detail-orphan-source.test.ts`, which recursively inspects executable `app`, `components` and `lib` TypeScript/TSX, excludes tests/specs, strips comments and requires zero production consumers of the `lx-dictionary-detail` prefix.
- PR #336 also bounds the exact remaining `.lx-dictionary-detail*` selector inventory in `dictionary-catalog.css`; the candidate CSS itself was intentionally not deleted.
- The proof shows the legacy `.lx-dictionary-detail*` selector arms are orphaned, but grouped live `.lx-dictionary-result-heading*` declarations and `.lx-dictionary-translation` remain separate consumers and must be preserved in the deletion slice.
- PR #337 corrected only the test fixture that prepares adjacent History entries for the Active Lesson Browser Back contract: native `History.prototype` methods now seed entries without triggering Next.js App Router synchronization.
- PR #337 retained a real `page.goBack()` traversal, explicit `/lesson/active` precondition, protected URL restoration, safe-exit dialog and no-review-submit assertions; production runtime was unchanged.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown/product-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for the bounded orphan-selector deletion, independently proven compatibility/CSS families and final dead-code, bundle and ownership acceptance.

## In progress

- No product slice is active.
- No pull request was open at verification time.
- The next atomic task must be selected only after this reconciliation is merged and fresh live evidence is reviewed.

## Remaining roadmap

### 1. #70 — Remove the proven orphaned Dictionary detail selector arms

- Use PR #336 as executable consumer evidence.
- Remove only the bounded `.lx-dictionary-detail*` selector arms from `dictionary-catalog.css`.
- Preserve grouped live `.lx-dictionary-result-heading*` selectors and their declarations exactly.
- Treat `.lx-dictionary-translation` independently; it is not covered by the `lx-dictionary-detail` prefix proof.
- Replace candidate-presence assertions with absence assertions in the same source contract.
- Require unchanged authoritative Linux visual hashes, accessibility results and performance ceilings.

### 2. #70 — Audit the next compatibility or CSS ownership family

- Select one minimal family per atomic PR.
- Prove canonical ownership and compatibility reachability before deletion.
- Preserve shared authentication, lesson-domain and unknown-route owners.
- CSS cleanup requires selector search, specificity/import-order analysis, computed-cascade ownership and unchanged authoritative Linux visual hashes.

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

- The `.lx-dictionary-detail*` family is now proven orphaned in executable TypeScript/TSX but has not yet been removed from `dictionary-catalog.css`.
- The deletion PR must preserve live grouped `.lx-dictionary-result-heading*` declarations and treat `.lx-dictionary-translation` separately.
- Dictionary product-history compatibility remains intentionally live.
- Profile and Scenario guest authentication boundaries remain intentionally live.
- Final bundle/dead-code, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #337 — `test(frontend): stabilize WebKit Active Lesson history setup` → `109ffd8dd39587a83e791ba195449a49bd084cbf`.
2. #336 — `test(frontend): prove legacy Dictionary detail CSS orphaned` → `b4dace966bffcb482231d48b9b7926fee4e2b26f`.
3. #335 — `docs(agent): reconcile PR 334 Dictionary CSS ownership` → `99668994916e1587a0855c801c10915c6419f59e`.
4. #334 — `refactor(frontend): consolidate Dictionary detail CSS ownership` → `c184742b651d0f0f8fbdd2c02e7e0c987c86b95b`.
5. #333 — `docs(agent): reset context after PR 332` → `5b4cab79d6030b01b1306fa1ca28666c95fb35fd`.

## Evidence

- PR #336 final head `d22d71041c2722770eacea85eaa45d77738db746` passed authoritative full CI #2493/run `30725579604` before expected-head squash merge.
- `dictionary-detail-orphan-source.test.ts` proves zero comment-stripped production TS/TSX consumers and an exact bounded selector inventory without changing CSS or runtime.
- PR #336 merge `b4dace966bffcb482231d48b9b7926fee4e2b26f` exposed a post-merge WebKit-only test-setup race in main CI run `30725885894`; stage was blocked as designed.
- The failed trace showed `/learn` before `page.goBack()`, proving the Next.js-patched synthetic History setup invalidated the test precondition rather than exercising product safe-exit behavior.
- PR #337 final head `632e87ac6c00b2934012b09a98001f62a2f22c4d` passed authoritative full CI #2498/run `30726742268`, including the previously failing desktop WebKit UI shard 1 and both container builds.
- PR #337 changed no runtime, CSS, API, backend, workflow, dependency, timeout, retry, snapshot or performance ceiling.
- Review comments, review submissions and unresolved threads were empty before PR #337 merge.
- Expected-head squash merge produced product SHA `109ffd8dd39587a83e791ba195449a49bd084cbf`.
- Post-merge main CI run `30726998934` repeated the complete product matrix successfully on the exact merge SHA.
- Stage run `30727269090` deployed the exact merge SHA; web/API containers were healthy, public frontend/API smoke passed and all 12 desktop Chromium/iOS WebKit public browser checks passed.
- Earlier PR #334 ownership evidence remains valid: `dictionary-detail-compatibility.css` and its import are absent, canonical Dictionary/Word Detail/route-navigation declarations remain in their exact owners, and no approved visual or budget ceiling changed.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs, artifacts, traces and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA, and the latest completed delivery evidence. It intentionally does not claim that a SHA embedded in a documentation commit will remain the live tip after that documentation PR merges. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in those recorded facts. Always verify the current live GitHub tip separately before writes. Do not create recursive reconciliation PRs solely because a docs-only reconciliation merge advanced `main`.
