# LexiGo Project State

## Verification

- Last verified: 2026-07-28 22:53 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `df033168f56f6143285e68aff0fc67d4570fc2a4`.
- Latest completed slice: Issue #70 — consolidate the live Phrases computed-cascade compatibility rules into the canonical route stylesheet.
- Completion PR: #284.
- PR #284 immutable developer-authored head: `03820b4b5b92cdc8bb37df84efc98c7b9070ab07`.
- Authoritative full CI: #2357 / run `30392104701`, successful across Agent Harness, backend, frontend, browser, accessibility, forced-colors, visual, performance and container gates.
- Expected-head squash merge produced `df033168f56f6143285e68aff0fc67d4570fc2a4`.
- Exact-SHA stage/public validation: run `30393760854`, deployed web/API image `df033168f56f6143285e68aff0fc67d4570fc2a4`; frontend/API smoke succeeded and public desktop Chromium/iOS WebKit passed 12/12.
- Deployment-status Issue #12 reports the same exact stage SHA with deploy, public smoke and public browser all successful.
- No pull request was open when this reconciliation branch was created.

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

- `/progress` is server-owned and reports current due evidence, retained knowledge, weekly trends, weak topics and deterministic recommendations.
- Route-boundary session adoption prevents logout during Progress navigation.
- Progress navigation remains escapable in desktop, mobile and installed PWA contexts.
- Scroll restoration is immediate and interruptible.

### Route-level client islands and bundle budgets

- Issue #115 is completed and closed.
- Home, Learn, Active Lesson, Phrases, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole connectivity and durable review-queue owner.
- All History writers use `createNavigationHistoryState`, preserve the active `lexigoRouteGraph` owner and do not copy unknown Next.js internal state between route graphs.
- Cold `/`: `207675` JavaScript bytes, `18` initial requests; limits `235000` bytes and `21` requests.
- Cold `/progress`: `207502` JavaScript bytes, `18` initial requests; limits `240000` bytes and `21` requests.
- Cold `/learn`: `210986` JavaScript bytes, `20` initial requests; limits `235000` bytes and `22` requests.
- Cold `/lesson/active`: `220225` JavaScript bytes, `19` initial requests; limits `235000` bytes and `22` requests.
- Cold `/phrases`: `226149` JavaScript bytes, `19` initial requests; limits `235000` bytes and `22` requests.

### Compatibility cleanup evidence

- Production route ownership and public architecture ownership are executable contracts.
- Document-level element ownership and shared system-state CSS ownership are centralized without visual redesign.
- PR #277 proved canonical Phrases guest/auth route reachability before the compatibility fallback.
- PR #282 removed the proven-unreachable Phrases catalog/detail runtime family from `LexigoPremiumApp` while preserving shared lesson-domain consumers.
- PR #284 removed the separate `phrases-compat.css` boundary and moved its exact seven live route-scoped rule groups into `frontend/app/phrases.css`.
- `frontend/app/phrases.css` is now the sole Phrases route-specific visual and computed-cascade owner.
- Root layout imports `catalog-enhancements.css` before `phrases.css`; `phrases-compat.css` and its import are absent.
- The executable ownership contract enforces file absence, import order, selector uniqueness and exact declarations.
- Catalog contrast/surface/elevation, selected-topic contrast, result spacing and forced-colors values remain unchanged.
- Eight compact/desktop Light/Dark Phrases catalog/detail visual hashes remained unchanged; no baseline or bundle-budget promotion occurred.
- Issue #70 remains open for later independently proven compatibility families.
- `LexigoPremiumApp` remains reachable for guest authentication, account recovery, unknown-route fallback and shared lesson-domain behavior; broad deletion is prohibited without exact replacement evidence.

### Scenario learning

- Durable Scenario contracts, ordered steps, optimistic versioning, pause/resume/reload and idempotent submission are implemented.
- Scenario review targets resolve to concrete enrolled learning items and use the central learning transaction writer.
- Canonical `/scenarios/[slug]` and `/scenarios` are in production.

### Dictionary, Word Detail and Phrases

- `/dictionary` is server-owned for search, filters, sorting, pagination and result order; URL state and Back/Forward recovery are preserved.
- `/words/[id]` loads independently, validates scheduler fields and loads bounded related phrases.
- Word Detail pronunciation has supported, loading, playing, error and unsupported states.
- `/phrases` preserves server order, bounded pagination and URL-backed state.
- `/phrases/[slug]` loads only its direct-detail API on cold entry, reload and new-tab navigation.
- Phrases hands lesson configuration to `/learn?source=phrases` without creating a second lesson lifecycle.

### Profile, appearance and offline states

- Authenticated `/profile` is implemented from approved Figma nodes.
- Daily goal remains server-owned; calendar reminders remain browser/calendar-owned.
- Appearance persists only `auto`, `light` or `dark`; first-paint theme bootstrap and PWA `theme-color` are implemented.
- `frontend/app/system-states.css` is the sole shared loading, empty, error, success, skeleton and connectivity presentation owner.
- Reviews are persisted before the first network request and retain one idempotency key across retry/reload; auth and CSRF tokens are never persisted in the outbox.
- Full offline lesson progression remains intentionally unsupported; new lesson creation remains blocked offline.

## In progress

- No product or tooling slice is active after PR #284 merge and exact-SHA stage validation.
- The next Issue #70 slice may start only after this repository-memory reconciliation is merged.

## Remaining roadmap

### 1. #70 — Select the next independently proven compatibility family

- Re-read live routing, imports, fallback predicates, markup consumers and `frontend/docs/compatibility-cleanup.md` before choosing scope.
- Select one minimal family per atomic PR; do not combine authentication fallback extraction, broad `LexigoPremiumApp` removal and unrelated CSS cleanup.
- Preserve guest authentication, account recovery, unknown-route fallback and all shared lesson-domain behavior until exact evidence proves replacement ownership.
- Runtime cleanup requires absence/preservation source contracts, lint, typecheck, unit/build, browser matrix, performance budgets and containers.
- CSS cleanup requires comment-stripped selector search, specificity/import-order analysis, computed-cascade ownership and authoritative Linux visual hashes; pure cleanup must not promote baselines.
- Existing bundle ceilings remain unchanged unless a separately approved performance decision changes them.

### 2. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after exact approved design states are available.

### 3. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation, including scheduling, permissions, import/export and deletion semantics.

### 4. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- Each remaining Issue #70 family requires its own reachability, consumer, bundle, browser and visual evidence; no broad dead-code claim is accepted.
- Parts of First Use still require approved exact Figma states.
- Final moderated usability evidence remains external work under Issue #133.

## Blocked

- Design-dependent portions of First Use remain blocked on approved production Figma nodes.
- Final usability closure is blocked on external moderated sessions.

## Recent production/tooling evidence

1. #284 — `refactor(frontend): consolidate Phrases CSS ownership` → `df033168f56f6143285e68aff0fc67d4570fc2a4`.
2. #282 — `refactor(frontend): remove Phrases compatibility route family` → `9250d9ca583614b976e0c3154246ef56b69a5994`.
3. #278 — `docs(agent): reconcile Phrases compatibility proof completion` → `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
4. #277 — `test(frontend): prove Phrases compatibility deletion boundary` → `928b026e0bf694f07043986bec12f70374405dde`.
5. #276 — `docs(agent): reconcile route-island epic completion` → `3d4a8dd49255da11f25fd38f92b2a8637d443517`.
6. #275 — `docs(frontend): align completed route-island architecture` → `156f7a9144d7652766e68e54ff9f0e246edfcc2b`.
7. #273 — `feat(phrases): add production catalog and route island` → `b53aeca3329bef61dd23c7b08964d98065ee1d7b`.
8. #262 — `refactor(frontend): consolidate system-state CSS ownership` → `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.

## Evidence

- PR #284 final head `03820b4b5b92cdc8bb37df84efc98c7b9070ab07` passed authoritative full CI #2357/run `30392104701`.
- Final compare was behind `0`, contained exactly nine declared paths and contained no workflow, temporary script, unrelated stylesheet, snapshot, runtime, backend, API, migration, deployment or bundle-budget change.
- Reviews, comments and unresolved review threads were empty before merge.
- Expected-head squash merge produced `df033168f56f6143285e68aff0fc67d4570fc2a4`.
- Deploy Stage run `30393760854` deployed exact web/API image `df033168f56f6143285e68aff0fc67d4570fc2a4`, returned successful frontend/API smoke and passed all 12 public browser checks.
- Deployment-status Issue #12 reports the same exact SHA with deploy, public smoke and public browser successful.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, workflow jobs, artifacts or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not persist the current branch or `main` head as an indefinitely current fact: record it only with an explicit verification timestamp, and always resolve live refs again before writes.
