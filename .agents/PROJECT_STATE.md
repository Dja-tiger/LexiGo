# LexiGo Project State

## Verification

- Last verified: 2026-07-29 00:25 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `23f575fa7adf338dcd5ec76f0942875a7ea046c4`.
- Latest completed slice: Issue #70 — prove the Active Lesson queued-review CSS compatibility boundary without runtime changes.
- Completion PR: #290.
- PR #290 immutable developer-authored head: `5a57e9e43f1a691f555e3bca74e1526b7abe699f`.
- Authoritative full CI: #2366 / run `30399822158`, successful.
- Expected-head squash merge produced `23f575fa7adf338dcd5ec76f0942875a7ea046c4`.
- PR #290 was proof-only: no production CSS, runtime, API, backend, migration, workflow, deployment, visual baseline or bundle-budget change.
- Reviews, comments and unresolved review threads were empty before merge.
- No stage deployment was required for this proof-only slice.
- Stale conflicting PR #287 was closed without merge and replaced by PR #290 from the current reconciled base.

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
- PR #290 proves `active-lesson.css` imports before `system-states-lesson.css`, queued-review markup is owned by `active-lesson-presentation.tsx`, and the compatibility stylesheet is bounded to queued Active Lesson and forced-colors presentation.
- `system-states-lesson.css` is live and remains unchanged; PR #290 does not authorize consolidation or deletion.
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

- No product or tooling slice is active after PR #290 merge.
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
- Active Lesson CSS consolidation remains pending a separate implementation slice with computed-cascade and visual evidence.
- Parts of First Use still require approved exact Figma states.
- Final moderated usability evidence remains external work under Issue #133.

## Blocked

- Design-dependent portions of First Use remain blocked on approved production Figma nodes.
- Final usability closure is blocked on external moderated sessions.

## Recent production/tooling evidence

1. #290 — `test(frontend): prove Active Lesson CSS compatibility boundary` → `23f575fa7adf338dcd5ec76f0942875a7ea046c4`.
2. #288 — `test(frontend): prove Progress compatibility deletion boundary` → `daef3e456f2b775389d913d6b3df689b21b2b9b1`.
3. #284 — `refactor(frontend): consolidate Phrases CSS ownership` → `df033168f56f6143285e68aff0fc67d4570fc2a4`.
4. #282 — `refactor(frontend): remove Phrases compatibility route family` → `9250d9ca583614b976e0c3154246ef56b69a5994`.

## Evidence

- PR #290 final head `5a57e9e43f1a691f555e3bca74e1526b7abe699f` passed authoritative full CI #2366/run `30399822158`.
- Final compare was behind `0` and contained exactly four declared proof-only paths.
- Reviews, comments and unresolved review threads were empty before merge.
- Expected-head squash merge produced `23f575fa7adf338dcd5ec76f0942875a7ea046c4`.
- No stage deployment was required because the slice changed only an executable source test and Agent Harness current-task records.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, workflow jobs, artifacts or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Resolve live refs before writes.