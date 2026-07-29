# LexiGo Project State

## Verification

- Last verified: 2026-07-29 08:32 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `90afa3263aa8f04f4988d71ae64ebd5bea156881`.
- Latest completed slice: Issue #70 — scope queued Active Lesson CSS ownership without visual changes.
- Completion PR: #292.
- PR #292 immutable developer-authored head: `ca452297a0a89922a89de8b6ebfae29487432372`.
- Authoritative PR CI: #2372 / run `30424265056`, successful across backend, frontend core, browser, accessibility, visual, performance and container gates.
- Expected-head squash merge produced `90afa3263aa8f04f4988d71ae64ebd5bea156881`.
- Post-merge Main CI run `30424720586` initially failed one iOS WebKit Back/safe-exit assertion, then passed completely on an unchanged-SHA rerun; the failure was non-reproducible and no repair commit was required.
- Exact-SHA stage run `30428344783` deployed `90afa3263aa8f04f4988d71ae64ebd5bea156881`; deploy, public smoke and public browser were successful, including 12/12 public runtime checks.
- Reviews, comments and unresolved review threads were empty before merge.

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
- The Progress proof separates route-only presentation markers from shared progress state/data used by Home, Profile and lesson-result flows.
- Progress runtime deletion remains pending a separate atomic implementation slice.

### Route-level client islands and bundle budgets

- Issue #115 is completed and closed.
- Home, Learn, Active Lesson, Phrases, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole connectivity and durable review-queue owner.
- Cold `/`: `207675` JavaScript bytes, `18` initial requests; limits `235000` bytes and `21` requests.
- Cold `/progress`: `207502` JavaScript bytes, `18` initial requests; limits `240000` bytes and `21` requests.
- Cold `/learn`: `210986` JavaScript bytes, `20` initial requests; limits `235000` bytes and `22` requests.
- Cold `/lesson/active`: `220225` JavaScript bytes, `19` initial requests; limits `235000` bytes and `22` requests.
- Cold `/phrases`: `226149` JavaScript bytes, `19` initial requests; limits `235000` bytes and `22` requests.

### Compatibility cleanup evidence

- PR #277 proved canonical Phrases guest/auth route reachability before the compatibility fallback.
- PR #282 removed the proven-unreachable Phrases catalog/detail runtime family from `LexigoPremiumApp` while preserving shared lesson-domain consumers.
- PR #284 consolidated live Phrases computed-cascade rules into `frontend/app/phrases.css`.
- PR #288 established the two-sided Progress compatibility boundary.
- PR #290 proved that the queued-review stylesheet was live, imported after `active-lesson.css`, bounded to Active Lesson and required for forced-colors presentation.
- PR #292 retired the misleading `system-states-lesson.css` path and renamed the exact unchanged stylesheet to `frontend/app/active-lesson-queued-state.css`.
- Root import position, selectors, declarations, specificity, responsive behavior, forced-colors behavior, visual hashes and bundle budgets remained unchanged.
- Executable ownership contracts reject the retired generic path and preserve the route-scoped owner.
- Issue #70 remains open for later independently proven compatibility families.
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

- No product or tooling slice is active after PR #292 merge and exact-SHA stage validation.
- This Agent Docs reconciliation must merge before another Issue #70 slice starts.

## Remaining roadmap

### 1. #70 — Select the next independently proven compatibility family

- Re-read live routing, imports, fallback predicates, markup consumers and `frontend/docs/compatibility-cleanup.md` before choosing scope.
- Select one minimal family per atomic PR.
- Preserve guest authentication, account recovery, unknown-route fallback and all shared lesson-domain behavior until exact evidence proves replacement ownership.
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
- Progress runtime deletion remains pending a separate implementation slice.
- Physical consolidation of `active-lesson-queued-state.css` into the large canonical stylesheet remains optional and requires an exact-patch local workflow plus unchanged visual hashes.
- Parts of First Use still require approved exact Figma states.
- Final moderated usability evidence remains external work under Issue #133.

## Blocked

- Design-dependent portions of First Use remain blocked on approved production Figma nodes.
- Final usability closure is blocked on external moderated sessions.

## Recent production/tooling evidence

1. #292 — `refactor(frontend): scope Active Lesson queued-state CSS ownership` → `90afa3263aa8f04f4988d71ae64ebd5bea156881`.
2. #290 — `test(frontend): prove Active Lesson CSS compatibility boundary` → `23f575fa7adf338dcd5ec76f0942875a7ea046c4`.
3. #288 — `test(frontend): prove Progress compatibility deletion boundary` → `daef3e456f2b775389d913d6b3df689b21b2b9b1`.
4. #284 — `refactor(frontend): consolidate Phrases CSS ownership` → `df033168f56f6143285e68aff0fc67d4570fc2a4`.

## Evidence

- PR #292 final head `ca452297a0a89922a89de8b6ebfae29487432372` passed authoritative PR CI #2372/run `30424265056`.
- Final compare was behind `0`; GitHub detected the stylesheet as a pure rename with `0` additions and `0` deletions.
- Reviews, comments and unresolved review threads were empty before merge.
- Expected-head squash merge produced `90afa3263aa8f04f4988d71ae64ebd5bea156881`.
- Post-merge Main CI run `30424720586` passed on rerun without a code change after one non-reproducible WebKit history timing failure.
- Stage run `30428344783` deployed the exact merge SHA; deploy, public smoke and public browser succeeded.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, workflow jobs, artifacts or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Resolve live refs before writes.
