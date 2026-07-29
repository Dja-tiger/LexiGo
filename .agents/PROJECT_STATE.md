# LexiGo Project State

## Verification

- Last verified: 2026-07-29 18:05 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `9d82b67efc2b408f0696f856e2f3aad33c9aa244`.
- Latest completed product slice: Issue #70 — prove the authenticated/guest Profile compatibility boundary without deleting runtime.
- Completion PR: #300.
- PR #300 immutable developer-authored head: `7b2571e1be6306c5598fecad231632549b4beb81`.
- Authoritative PR CI: #2389 / run `30456469695`, successful.
- Expected-head squash merge produced `3f6efd70d8f8d76fcbd59a35aa292c078352c2ec`.
- Exact-SHA stage run `30462326308` deployed web/API images tagged `3f6efd70d8f8d76fcbd59a35aa292c078352c2ec`; deploy, public smoke and public browser all succeeded, with 12/12 public checks passing.
- Agent Docs reconciliation PR #301 passed lightweight CI #2391 / run `30467853472` and squash-merged as `9d82b67efc2b408f0696f856e2f3aad33c9aa244`; product, browser, container and deployment jobs were correctly skipped.
- Reviews, comments and unresolved review threads were empty before both merges.

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Backend unit/race/integration/security gates and frontend lint/type/unit/build/browser gates are mandatory for product and mixed changes.
- Canonical App Router paths, browser history, route recovery, persistent PWA shell and service-worker safety contracts are implemented.
- Pure Agent Docs changes use the fail-closed lightweight classifier; runtime, workflow, mixed and non-Agent documentation changes retain the complete required matrix.

### Learning core

- Due queue, spaced repetition, objective schema-v2 review events, durable offline review outbox and idempotency are implemented.
- Study, Recall and Choice remain separate runtime and evidence modes.
- Progressive Lesson Composer, canonical Active Lesson and canonical Lesson Result are in production.
- Distinct-next protection prevents the next lesson from silently repeating the completed block.
- Active Lesson Browser Back preserves framework history state and the safe-exit contract across desktop and mobile browsers.

### Progress and retained-learning evidence

- `/progress` is server-owned and reports due evidence, retained knowledge, weekly trends, weak topics and deterministic recommendations.
- PR #288 proves exact `/progress` route detection, unconditional guest/auth island selection and render ordering before the compatibility fallback.
- PR #295 removed the unreachable route-level Progress presentation from `LexigoPremiumApp`.
- Shared progress state, loaders and navigation consumers used by Home, Profile, Dictionary, header and lesson-result flows remain intact.

### Route-level client islands and bundle budgets

- Issue #115 is completed and closed.
- Home, Learn, Active Lesson, Phrases, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole connectivity and durable review-queue owner.
- Cold `/`: `207675` JavaScript bytes, `18` initial requests; limits `235000` bytes and `21` requests.
- Cold `/progress`: existing limit remains `240000` bytes and `21` requests.
- Cold `/learn`: `210986` JavaScript bytes, `20` initial requests; limits `235000` bytes and `22` requests.
- Cold `/lesson/active`: `220225` JavaScript bytes, `19` initial requests; limits `235000` bytes and `22` requests.
- Cold `/phrases`: `226149` JavaScript bytes, `19` initial requests; limits `235000` bytes and `22` requests.

### Compatibility cleanup evidence

- PR #277 proved canonical Phrases guest/auth route reachability before the compatibility fallback.
- PR #282 removed the proven-unreachable Phrases catalog/detail runtime family from `LexigoPremiumApp` while preserving shared lesson-domain consumers.
- PR #284 consolidated live Phrases computed-cascade rules into `frontend/app/phrases.css`.
- PR #288 established the two-sided Progress compatibility boundary.
- PR #290 proved that the queued Active Lesson CSS family was live, bounded and imported after the canonical Active Lesson sheet.
- PR #292 renamed `system-states-lesson.css` to `active-lesson-queued-state.css` with zero CSS additions or deletions, preserved import order, updated both ownership contracts and retired the misleading generic path.
- PR #295 removed only the proven-unreachable Progress route presentation and its presentation-only helpers; absence and preservation source contracts cover the boundary.
- PR #298 established the two-sided Dictionary boundary: canonical direct entry, reload and new-tab reconstruction use `LexigoDictionaryApp`, while product-owned Dictionary History entries may still retain the product graph and reach `LexigoPremiumApp.renderLibrary()`.
- PR #300 established the Profile boundary: authenticated `/profile` uses `LexigoProfileApp`, while guest authentication and account-recovery behavior remains live in `LexigoPremiumApp`.
- `frontend/app/active-lesson-queued-state.css` is the explicit queued-state presentation owner; `frontend/app/active-lesson.css` remains the canonical base presentation owner.
- Issue #70 remains open for later independently proven compatibility families.
- Dictionary compatibility runtime is not deletion-ready; route extraction alone does not prove product-owned History entries unreachable.
- Profile guest compatibility runtime is not deletion-ready because authentication and account recovery still route through the compatibility owner.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.

### Scenario learning

- Durable Scenario contracts, ordered steps, optimistic versioning, pause/resume/reload and idempotent submission are implemented.
- Canonical `/scenarios/[slug]` and `/scenarios` are in production.

### Dictionary, Word Detail and Phrases

- `/dictionary` is server-owned for search, filters, sorting, pagination and result order; URL state and Back/Forward recovery are preserved.
- `/words/[id]` loads independently, validates scheduler fields and loads bounded related phrases.
- `/phrases` preserves server order, bounded pagination and URL-backed state.
- `/phrases/[slug]` loads only its direct-detail API on cold entry, reload and new-tab navigation.

### Profile, appearance and offline states

- Authenticated `/profile` is implemented from approved Figma nodes.
- Appearance persists only `auto`, `light` or `dark`; first-paint theme bootstrap and PWA `theme-color` are implemented.
- `frontend/app/system-states.css` is the sole shared loading, empty, error, success, skeleton and connectivity presentation owner.
- Reviews are persisted before the first network request and retain one idempotency key across retry/reload.

## In progress

- No product or tooling slice is active after PR #301.
- A documentation-only reconciliation is being prepared because repository memory must explicitly record the PR #301 merge before the next Issue #70 product slice.
- The next Issue #70 slice may start only after fresh routing, consumer and CSS ownership evidence selects one bounded compatibility family.

## Remaining roadmap

### 1. #70 — Select the next independently proven compatibility family

- Re-read live routing, imports, fallback predicates, markup consumers and `frontend/docs/compatibility-cleanup.md` before choosing scope.
- Select one minimal family per atomic PR.
- Preserve guest authentication, account recovery, unknown-route fallback and all shared lesson-domain behavior until exact evidence proves replacement ownership.
- Do not delete Dictionary compatibility runtime while product-owned History entries can still route through the product graph.
- Do not delete Profile guest compatibility runtime while authentication and recovery remain owned by the compatibility app.
- Runtime cleanup requires absence/preservation source contracts, lint, typecheck, unit/build, browser matrix, performance budgets and containers.
- CSS cleanup requires selector search, specificity/import-order analysis, computed-cascade ownership and authoritative Linux visual hashes.
- Existing bundle ceilings remain unchanged unless a separately approved performance decision changes them.

### 2. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after approved design states are available.

### 3. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation.

### 4. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- Each remaining Issue #70 family requires its own reachability, consumer, browser and visual evidence.
- Dictionary product-history compatibility remains intentionally live and requires a separately proven migration or replacement before deletion.
- Profile guest compatibility remains intentionally live until authentication and account-recovery ownership is migrated or replaced with exact evidence.
- Physical consolidation of `active-lesson-queued-state.css` into the large canonical sheet remains optional and requires exact patch semantics plus unchanged visual hashes.
- Parts of First Use still require approved exact Figma states.
- Final moderated usability evidence remains external work under Issue #133.

## Blocked

- Design-dependent portions of First Use remain blocked on approved production Figma nodes.
- Final usability closure is blocked on external moderated sessions.

## Recent production/tooling evidence

1. #301 — `docs(agent): reconcile PR 300 main state` → `9d82b67efc2b408f0696f856e2f3aad33c9aa244`.
2. #300 — `test(frontend): prove Profile compatibility boundary` → `3f6efd70d8f8d76fcbd59a35aa292c078352c2ec`.
3. #299 — `docs(agent): reconcile PR 298 main state` → `4568c1c2446f24180726a7a5729758c05e6baa1a`.
4. #298 — `test(frontend): prove Dictionary compatibility boundary` → `8e1ba2b1785f78c0e3bfdc945a8f802e5ef4f5ee`.

## Evidence

- PR #300 final head `7b2571e1be6306c5598fecad231632549b4beb81` passed authoritative full PR CI #2389/run `30456469695`.
- Reviews, comments and unresolved review threads were empty before merge.
- Expected-head squash merge produced `3f6efd70d8f8d76fcbd59a35aa292c078352c2ec`.
- Stage run `30462326308` deployed exact merge SHA and passed deploy, public smoke and public browser validation, including 12/12 public runtime checks.
- The source contract proves canonical authenticated Profile ownership and deliberately preserves evidence for the still-live guest authentication and account-recovery fallback.
- PR #301 head `c41d78128a210b1bb99e30ffa73672dbd4ae44bb` passed lightweight Agent Docs CI #2391/run `30467853472`; heavy product jobs were skipped by the fail-closed classifier.
- Expected-head squash merge of PR #301 produced `9d82b67efc2b408f0696f856e2f3aad33c9aa244`.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, workflow jobs, artifacts or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Resolve live refs before writes.
