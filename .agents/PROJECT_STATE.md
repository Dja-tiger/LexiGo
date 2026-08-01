# LexiGo Project State

## Verification

- Last verified: 2026-08-02 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Repository base verified before this documentation slice: `c184742b651d0f0f8fbdd2c02e7e0c987c86b95b`.
- Latest deployed product SHA: `c184742b651d0f0f8fbdd2c02e7e0c987c86b95b`.
- Latest completed product slice: Issue #70 — consolidation of Dictionary catalog, canonical Word Detail and persistent route-navigation CSS ownership.
- Completion PR: #334.
- PR #334 immutable head: `533a072987311f1ca9cff043429b5bd7f8c42b40`.
- Authoritative PR CI: #2484 / run `30722732370`, successful.
- Expected-head squash merge produced product SHA `c184742b651d0f0f8fbdd2c02e7e0c987c86b95b`.
- Post-merge main CI run `30723066187` succeeded on the exact product merge SHA.
- Exact-SHA stage run `30723367270` deployed web/API images tagged `c184742b651d0f0f8fbdd2c02e7e0c987c86b95b`; deploy, public smoke and all 12 public browser checks succeeded.
- No pull requests were open at verification time.
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
- `dictionary-catalog.css` now owns Dictionary route variables, active filter/status colors and the compact filter-toggle correction while preserving the prior effective later-file position after forced-colors.
- `word-detail.css` now owns the `/words/[id]` example-heading dark contrast correction.
- `route-navigation.css` now owns the `/words/[id]` active Library rail-label dark contrast correction.
- `word-detail-source.test.ts` proves physical compatibility-file/import absence, exact canonical declaration blocks, single occurrence and no cross-owner placement.
- No selector text, declaration value, specificity, component markup, runtime behavior, visual snapshot or route-budget ceiling changed in PR #334.
- The older `.lx-dictionary-detail-*` family remains intentionally outside PR #334 and requires a separate exact-consumer proof before any deletion.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown/product-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for independently proven compatibility/CSS families and final dead-code, bundle and ownership acceptance.

## In progress

- No product slice is active.
- No pull request was open at verification time.
- The next atomic task must be selected only after this reconciliation is merged and fresh live evidence is reviewed.

## Remaining roadmap

### 1. #70 — Audit the next compatibility or CSS ownership family

- Select one minimal family per atomic PR.
- Prove canonical ownership and compatibility reachability before deletion.
- Preserve shared authentication, lesson-domain and unknown-route owners.
- CSS cleanup requires selector search, specificity/import-order analysis, computed-cascade ownership and unchanged authoritative Linux visual hashes.
- Treat the old `.lx-dictionary-detail-*` family as unproven until executable markup and comment-stripped CSS search establish exact consumer absence.

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

- The next Issue #70 slice must be selected from fresh live evidence; no new compatibility or CSS family is pre-authorized by this reconciliation.
- Dictionary product-history compatibility remains intentionally live.
- The old `.lx-dictionary-detail-*` family remains unproven and was not removed by PR #334.
- Profile and Scenario guest authentication boundaries remain intentionally live.
- Final bundle/dead-code, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #334 — `refactor(frontend): consolidate Dictionary detail CSS ownership` → `c184742b651d0f0f8fbdd2c02e7e0c987c86b95b`.
2. #333 — `docs(agent): reset context after PR 332` → `5b4cab79d6030b01b1306fa1ca28666c95fb35fd`.
3. #332 — `docs(agent): align Phrases cascade ownership rule` → `3683c58603f0243cd99a9889f01bb372c4ddcf3c`.
4. #331 — `docs(agent): reconcile PR 330 Phrases cascade` → `4b4da827856c2551321332afeed4f9c9473bdcb3`.
5. #330 — `refactor(frontend): prove Phrases cascade order independence` → `073e59989cd7a938bf28c1ebee1f77b8f49352c3`.

## Evidence

- PR #334 head `533a072987311f1ca9cff043429b5bd7f8c42b40` passed authoritative full CI #2484/run `30722732370`.
- CI covered backend unit/security/integration, frontend lint/type/unit/build/audit, both UI shards, visual regression, accessibility, CSP, service worker, performance budgets, lesson completion, iOS PWA, Dictionary smoke and both container builds.
- `frontend/app/dictionary-detail-compatibility.css` and its root-layout import are absent.
- The exact Dictionary computed-cascade block is canonical in `dictionary-catalog.css`; the exact Word Detail and route-chrome contrast blocks are canonical in `word-detail.css` and `route-navigation.css` respectively.
- `frontend/components/word-detail-source.test.ts` enforces file/import absence, exact declaration text, unique occurrence and owner separation.
- No selector, declaration value, specificity, runtime, API, backend, dependency, workflow, visual baseline or route-budget ceiling changed.
- Authoritative Visual Regression, Accessibility audit and Performance budgets jobs succeeded without baseline or ceiling updates.
- Review comments, review submissions and unresolved threads were empty.
- Expected-head squash merge produced product SHA `c184742b651d0f0f8fbdd2c02e7e0c987c86b95b`.
- Post-merge main CI run `30723066187` repeated the complete product matrix successfully on the exact merge SHA.
- Stage run `30723367270` deployed the exact product merge SHA; web/API containers were healthy and deploy, public smoke and 12/12 public browser checks succeeded without retries.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## State semantics

This file records the exact repository base verified before the current task or documentation slice, the latest deployed product SHA, and the latest completed delivery evidence. It intentionally does not claim that a SHA embedded in a documentation commit will remain the live tip after that documentation PR merges. A docs-only merge does not make this state stale solely by advancing `main`; staleness is determined by unrecorded product, roadmap, Issue, deployment or dependency changes.

## Update protocol

Update this file before a new task when product, roadmap, Issue, deployment or dependency facts are stale; after material product deployment; and after any discrepancy in those recorded facts. Always verify the current live GitHub tip separately before writes. Do not create recursive reconciliation PRs solely because a docs-only reconciliation merge advanced `main`.
