# LexiGo Project State

## Verification

- Last verified: 2026-07-28 14:08 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `ff63aba1b0cd02f909121e80da6ea51537ef1960`.
- Latest documentation merge: PR #271, merge SHA `ff63aba1b0cd02f909121e80da6ea51537ef1960`.
- PR #271 immutable developer-authored head `4f40d0fff78a52d0f94ca5b6d2f678314bc45539` passed lightweight CI run `30343850404`.
- PR #271 is Agent Docs-only: it reset `.agents/current/**`, did not change runtime, did not build a new product image and did not supersede the verified stage image.
- Latest design/runtime handoff merge: PR #270, merge SHA `5472e8f0479a750483709222745cdee92f504258`.
- PR #270 immutable developer-authored head `15d31f1dd7c0ad21b7cf6c42552a6ad8c616457c` passed full CI run `30341744614`.
- PR #270 post-merge full CI run `30342447923` passed on the exact merge SHA.
- PR #270 exact-SHA stage/public validation run `30343061807` created deployment `5636659535` and deployed web/API image `5472e8f0479a750483709222745cdee92f504258`; frontend/API returned HTTP 200 on the first attempt and the public desktop Chromium/iOS WebKit matrix passed 12/12.
- Deployment-status Issue #12 still reports the same exact healthy stage image `5472e8f0479a750483709222745cdee92f504258`.
- Latest product merge: recovery PR #267, merge SHA `b16f1e4a54b7c9a997744f5fd6bdf230010b76fa`.
- PR #267 immutable developer-authored head `68a2be9987b8d1fcb2ca31ead40b50994055267c` passed full CI run `30337018986`.
- PR #267 post-merge full CI run `30337705777` passed on the exact merge SHA.
- PR #267 exact-SHA stage/public validation run `30338245219` passed first-attempt frontend/API smoke and 12/12 public browser checks.
- Issue #199 is open. Its design handoff is complete; runtime implementation and Phrases route-island extraction remain pending.
- No pull request was open at verification. `.agents/current/**` is reset to templates.

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, authenticated sessions, account security, migrations, containers and CI/CD foundations are implemented.
- Backend unit/race/integration/security gates and frontend lint/type/unit/build/browser gates are mandatory for product and mixed changes.
- Canonical App Router paths, browser history, route recovery, persistent PWA shell and service-worker safety contracts are implemented.

### Shared system-state presentation

- `frontend/app/system-states.css` is the sole shared loading, empty, error, success, skeleton and connectivity presentation owner.
- `frontend/app/mobile-pwa-fixes.css` is limited to the PWA/session shell.
- `ReviewOutboxRuntime` remains the sole connectivity and durable review-queue runtime owner.
- Source contracts protect ownership and effective review-sync typography; authoritative Linux system-state hashes remain unchanged.

### Learning core

- Due queue, spaced repetition, objective schema-v2 review events, durable offline review outbox and idempotency are implemented.
- Study, Recall and Choice remain separate runtime and evidence modes.
- Progressive Lesson Composer, canonical Active Lesson and canonical Lesson Result are in production.
- Distinct-next protection prevents the next lesson from silently repeating the completed block.

### Answer-suggestion moderation

- A real server-rejected review can create a bounded pending answer suggestion without changing curated answers or the already-applied scheduler result.
- Administrative access is fail-closed through a server-side allowlist; no long-lived role is stored in the JWT.
- The moderation queue supports bounded pagination, atomic accept/reject with optimistic versioning, immutable audit snapshots, normalized-unique accepted answers, metrics and bounded retention.
- OpenAPI structure, PostgreSQL empty-array semantics, unit/integration contracts, full CI and exact-SHA stage deployment are validated for Issue #132.

### Progress and retained-learning evidence

- `/progress` is server-owned and reports due evidence, retained knowledge, weekly trends, weak topics and deterministic recommendations.
- Weak part-of-speech evidence and direct server-owned recommendations are implemented.
- Route-boundary session adoption prevents logout during Progress navigation.
- Progress navigation remains escapable in desktop, mobile and installed PWA contexts.
- Scroll restoration is immediate and interruptible.

### Route-level client islands and bundle budgets

- Home, Learn, Active Lesson, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole connectivity and review-outbox owner.
- All LexiGo History writers use `createNavigationHistoryState`, preserve the current `lexigoRouteGraph` owner and do not copy unknown Next.js internal state between route graphs.
- Home: 207,675 JavaScript bytes, 18 initial requests; permanent limits 235,000 bytes and 21 requests.
- Progress: 207,502 JavaScript bytes, 18 initial requests; permanent limits 240,000 bytes and 21 requests.
- Learn: 210,986 JavaScript bytes, 20 initial requests; permanent limits 235,000 bytes and 22 requests.
- Active Lesson: 220,225 JavaScript bytes, 19 initial requests; permanent limits 235,000 bytes and 22 requests.
- Active Lesson Browser Back preserves exact framework history state, invokes safe exit in all four browser projects and leaves the confirmed-exit Back target at `/learn`.
- The only remaining route in the compatibility graph `LexigoPremiumApp` is Phrases.

### Scenario learning

- Durable Scenario contracts, ordered steps, optimistic versioning, pause/resume/reload, fact/hypothesis evidence and idempotent submission are implemented.
- Scenario review targets resolve to concrete enrolled learning items and use the central learning transaction writer.
- Canonical `/scenarios/[slug]`, Scenario catalog `/scenarios` and Progress Scenario evidence/recommendations are in production.
- Scenario catalog preserves backend order and remains usable if Progress recommendations fail.

### Dictionary catalog and Word Detail

- Canonical `/dictionary` is server-owned for search, filters, sorting, pagination and exact result order.
- URL state and Back/Forward recovery are preserved.
- Canonical `/words/[id]` loads independently, strictly validates scheduler fields and loads bounded server-owned related phrases.
- Word Detail pronunciation has supported, loading, playing, error and unsupported states.
- Single-word practice creates an exact lesson with `wordIds: [selectedWordId]`.
- Immediate Dictionary search submit is protected from stale mount-frame synchronization in Chromium and WebKit.

### Profile and appearance

- Authenticated `/profile` is implemented from approved Figma nodes.
- Daily goal remains server-owned; calendar reminders remain browser/calendar-owned.
- Password, sessions, email change, export and deletion retain their existing account/API owners.
- Appearance persists only `auto`, `light` or `dark`; first-paint theme bootstrap and PWA `theme-color` are implemented.
- Logout and session invalidation remain owned by the persistent App Router shell.

### System and offline states

- Approved loading, empty, correlated error, physical-offline, retryable-failure, queued-review, restored-connection and synchronized states are implemented.
- Reviews are persisted before the first network request and retain one idempotency key across retry/reload.
- Auth and CSRF tokens are never persisted in the outbox.
- Active Lesson preserves the submitted answer after offline/retryable review and blocks duplicate rating or next-card advancement until authoritative replay confirmation.
- Full offline lesson progression remains intentionally unsupported; new lesson creation remains blocked offline.
- Dictionary query/filter state survives loading, empty, error and retry states.
- Reduced motion, forced colors, Light/Dark, 320 px, 200% reflow, Chromium/WebKit, Android/iOS PWA, keyboard, axe, CSP, service-worker and performance contracts are blocking.

### Agent Harness and Agent Docs CI

- The repository contains normative agent instructions, verified project state, skills registry, current-task memory, templates, reusable lessons and a dependency-free source contract.
- Only pure changes limited to `AGENTS.md`, `.agents/**` and `docs/agent-harness.md` may use the lightweight Agent Harness path.
- Workflow, script, runtime, dependency, mixed and all other documentation changes retain the complete backend/frontend/browser/container matrix.
- Pure Agent Docs pushes do not build or publish runtime images and do not perform automatic stage deployment.
- Missing, malformed or mismatched scope evidence blocks automatic deployment.

## In progress

- No product slice is active after PR #271 reconciliation and context reset.
- The next atomic production slice is Issue #199 runtime implementation and Phrases route-island extraction from `LexigoPremiumApp` using the approved exact Figma nodes.

## Remaining roadmap

### 1. #199 — Phrases runtime implementation

Implement the merged catalog/detail Figma handoff in a dedicated frontend slice. Canonical page: `253:2`; screens: `255:10`, `257:2`, `255:55`, `257:47`, `255:81`, `257:74`, `255:162`, `257:159`; resilient hooks: `257:212`; Screen Map entry: `261:2`.

Required runtime outcomes:

- canonical `/phrases` catalog without Lesson Composer duplication;
- canonical direct-entry `/phrases/[slug]` detail route;
- server-owned ordering and existing typed phrase APIs;
- URL-backed search/filter state and Back/Forward restoration;
- loading, empty, correlated error, retry and offline integration through existing system-state owners;
- compact/medium/desktop, Light/Dark, reduced motion, forced colors and 200% reflow;
- Chromium, WebKit, Android, iOS, keyboard, axe and Linux visual validation;
- separate Phrases client entry with no duplicate session/outbox/PWA ownership;
- exact cold-route measurement and a permanent route-specific JavaScript/request ceiling.

### 2. #18 and #201 — Adaptive personalization and First Use

Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after exact approved design states are available.

### 3. #25 — Pronunciation, listening and custom terminology

Resolve architecture/privacy and typed backend contracts before implementation, including scheduling, permissions, import/export and deletion semantics.

### 4. #115 — Remaining route-level client islands and budgets

Close the remaining Phrases compatibility graph after Issue #199, with direct-entry/navigation proof, exact transfer evidence and a strictly tighter route-specific release ceiling.

### 5. #70 — Legacy applications and CSS

Remove only proven-dead app/CSS families with browser, visual and bundle evidence after Phrases extraction.

### 6. #203, #205 and #133 — Figma handoff, final parity and usability

Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- Phrases runtime implementation, browser/visual validation and permanent route budget remain pending.
- Parts of First Use still require approved exact Figma states.
- Final moderated usability evidence remains external work under #133.

## Blocked

- Design-dependent portions of First Use remain blocked on approved production Figma nodes.
- Final usability closure is blocked on external moderated sessions.

## Recent production/tooling evidence

1. #271 — `docs(agent): reconcile Phrases design handoff` → `ff63aba1b0cd02f909121e80da6ea51537ef1960`.
2. #270 — `docs(figma): hand off Phrases production designs` → `5472e8f0479a750483709222745cdee92f504258`.
3. #269 — `docs(agent): reconcile state before Phrases design` → `72a1a621225ee08dbf6643d6c982396c77b85bd4`.
4. #268 — `docs(agent): finalize Issue 132 delivery` → `c001932fdec11e4c09e33c173656c85be6592906`.
5. #267 — `fix(dictionary): preserve immediate search submit` → `b16f1e4a54b7c9a997744f5fd6bdf230010b76fa`.
6. #265 — `feat(moderation): add answer suggestion workflow` → `6059cbd2ffd8669b92fdf73add75a706773a299a`.
7. #262 — `refactor(frontend): consolidate system-state CSS ownership` → `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.
8. #258 — `perf(lesson): extract Active Lesson route island` → `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`.
9. #255 — `perf(learn): extract Learn route island and lock bundle budget` → `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`.
10. #251 — `perf(home): extract Home route island and lock bundle budget` → `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754`.

## Evidence

- Live GitHub `main`, open PRs, Issue #199, Issue #12, recent commits and PR #271 were re-read at the verification timestamp.
- PR #271 final head `4f40d0fff78a52d0f94ca5b6d2f678314bc45539` passed lightweight CI run `30343850404`; expected-head squash merge produced `ff63aba1b0cd02f909121e80da6ea51537ef1960`.
- PR #271 changed only `.agents/PROJECT_STATE.md` and reset `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` from templates.
- PR #270 final head `15d31f1dd7c0ad21b7cf6c42552a6ad8c616457c` passed full CI run `30341744614`; expected-head squash merge produced `5472e8f0479a750483709222745cdee92f504258`.
- Post-merge full CI run `30342447923` passed on the exact PR #270 merge SHA.
- Stage run `30343061807` created deployment `5636659535` for exact SHA `5472e8f0479a750483709222745cdee92f504258`; deploy, public smoke and public browser checks succeeded, frontend/API returned HTTP 200 on attempt one and all 12 desktop Chromium/iOS WebKit checks passed.
- Issue #199 records exact canonical Figma file `3xXmBWnf38jbvLjtziwber`, page `253:2`, catalog/detail nodes `255:10`, `257:2`, `255:55`, `257:47`, `255:81`, `257:74`, `255:162`, `257:159`, resilient hooks `257:212` and Screen Map handoff `261:2`.
- Indexed repository search is discovery only; final claims are based on exact files, refs, Issues, PRs, checks or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Record a `main` head only with an explicit verification timestamp and always resolve live refs again before writes.
