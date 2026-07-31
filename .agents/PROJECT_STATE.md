# LexiGo Project State

## Verification

- Last verified: 2026-07-31 21:35 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `674e0d58272a1ca343c6b845c7954b5a66d2d187`.
- Latest completed product slice: Issue #70 — executable inventory of the final live `LexigoPremiumApp` compatibility fallback.
- Completion PR: #324.
- PR #324 immutable head: `97a182b79ed01f528fbd8b2abf982bf98ec6e07c`.
- Authoritative PR CI: #2452 / run `30646932870`, successful.
- Expected-head squash merge produced product SHA `cbb9bc9c50e76a93c887736319047fd5d98bc35a`.
- Exact-SHA stage run `30652629164` deployed web/API images tagged `cbb9bc9c50e76a93c887736319047fd5d98bc35a`; deploy, public smoke and all 12 public browser checks succeeded.
- Documentation reconciliation PR #325 passed lightweight CI #2454 / run `30654585328` and squash-merged as current `main` SHA `674e0d58272a1ca343c6b845c7954b5a66d2d187`.
- Reviews, comments and unresolved review threads were empty before both merges.

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
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown/product-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.
- Issue #70 remains open for independently proven compatibility/CSS families and final dead-code, bundle and ownership acceptance.

## In progress

- No product slice is active.
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
- Final bundle/dead-code, CSS ownership and README acceptance criteria remain open.
- Final moderated usability evidence remains external work under Issue #133.

## Recent production/tooling evidence

1. #325 — `docs(agent): reconcile PR 324 fallback inventory` → `674e0d58272a1ca343c6b845c7954b5a66d2d187`.
2. #324 — `test(frontend): inventory final compatibility fallback` → `cbb9bc9c50e76a93c887736319047fd5d98bc35a`.
3. #323 — `docs(agent): reconcile main after PR 322` → `ec3d3f05f97a61b4600abc2d5947726d599e8618`.
4. #322 — `docs(agent): reconcile legacy Learn deletion` → `558ccda1cf5e062ff6dc050b0ea0a0814f901bf2`.

## Evidence

- PR #324 head `97a182b79ed01f528fbd8b2abf982bf98ec6e07c` passed authoritative full CI #2452/run `30646932870`.
- CI covered backend unit/security/integration, frontend lint/type/unit/build/audit, both UI shards, visual regression, accessibility, CSP, service worker, performance budgets, lesson completion, iOS PWA and both container builds.
- Review comments, review submissions and unresolved threads were empty.
- Expected-head squash merge produced product SHA `cbb9bc9c50e76a93c887736319047fd5d98bc35a`.
- Stage run `30652629164` deployed the exact product merge SHA and completed deploy, public smoke and 12/12 public browser checks successfully.
- PR #325 head `6832eb214148272e745c70891b875fe17c76b2e6` passed lightweight CI #2454/run `30654585328`; heavy backend/frontend/browser/container jobs were correctly skipped.
- PR #325 squash merge produced current `main` SHA `674e0d58272a1ca343c6b845c7954b5a66d2d187`.
- Two rejected connector calls attempted `create_file` against nonexistent branches while branch creation was intended. Both returned 404; verification confirmed `main` unchanged and paths `__invalid__` and `noop` absent. The exact `create_branch` schema was then reloaded before continuing.
- Indexed search remains discovery only; final claims use exact files, refs, Issues, PRs, workflow jobs and deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Resolve live refs before writes.
