# LexiGo Project State

## Verification

- Last verified: 2026-07-28 18:22 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `b53aeca3329bef61dd23c7b08964d98065ee1d7b`.
- Latest product merge: PR #273, `feat(phrases): add production catalog and route island`.
- PR #273 immutable developer-authored head: `73320ed0d61731984dc5004dc85c87184a083057`.
- PR #273 authoritative full CI: #2275 / run `30368871533`, successful across frontend core, backend unit/security/integration, the complete browser matrix, visual regression, accessibility, CSP, Service Worker, iOS PWA, Dictionary smoke, performance budgets and container builds.
- PR #273 review comments, submitted reviews and unresolved review threads were empty before merge.
- Expected-head squash merge produced `b53aeca3329bef61dd23c7b08964d98065ee1d7b`.
- Automatic stage run `30371866995` successfully downloaded and validated the exact CI scope artifact for the merge SHA, deployed web/API image `b53aeca3329bef61dd23c7b08964d98065ee1d7b`, returned frontend/API HTTP 200 on the first attempt and passed the public desktop Chromium/iOS WebKit matrix 12/12.
- Deployment-status Issue #12 reports the same exact stage SHA and successful deploy, public smoke and public browser outcomes.
- Issue #199 is closed as completed.
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
- Active Lesson Browser Back preserves exact framework history state, invokes the safe-exit dialog across desktop Chromium/WebKit and Android/iOS, and leaves the confirmed-exit Back target at `/learn`.

### Answer-suggestion moderation

- A real server-rejected review can create a bounded pending answer suggestion without changing curated answers or the already-applied scheduler result.
- Administrative access is resolved fail-closed from the current account email against a server-side allowlist; no long-lived role is stored in the JWT.
- The moderation queue supports bounded pagination, atomic accept/reject with optimistic versioning, immutable audit snapshots, normalized-unique accepted answers, operational metrics and replica-safe retention cleanup.
- OpenAPI structure, PostgreSQL empty-array semantics, unit/integration contracts, full CI and exact-SHA stage deployment are validated for Issue #132.

### Progress and retained-learning evidence

- `/progress` is server-owned and reports current due evidence, retained knowledge, weekly trends, weak topics, weak parts of speech and deterministic recommendations.
- Route-boundary session adoption prevents logout during Progress navigation.
- Progress navigation remains escapable in desktop, mobile and installed PWA contexts.
- Scroll restoration is immediate and interruptible rather than uninterruptible smooth scrolling.

### Route-level client islands and bundle budgets

- Home, Learn, Active Lesson, Phrases, Dictionary, Word Detail, Progress, Profile, Scenario catalog and Scenario detail use dedicated dynamic client entries.
- `LexigoBootstrappedApp` remains the sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `ReviewOutboxRuntime` remains the sole connectivity and durable review-queue owner.
- Route islands do not duplicate session bootstrap, auth refresh, review outbox, Service Worker, appearance or PWA lifecycle ownership.
- All LexiGo History writers use `createNavigationHistoryState`, preserve the active `lexigoRouteGraph` owner and do not copy unknown Next.js internal state between route graphs.
- Cold `/` entry: `207675` JavaScript bytes, `18` initial requests; permanent limits `235000` bytes and `21` requests.
- Cold `/progress` entry: `207502` JavaScript bytes, `18` initial requests; permanent limits `240000` bytes and `21` requests.
- Cold `/learn` entry: `210986` JavaScript bytes, `20` initial requests; permanent limits `235000` bytes and `22` requests.
- Cold `/lesson/active` entry: `220225` JavaScript bytes, `19` initial requests; permanent limits `235000` bytes and `22` requests.
- Cold `/phrases` entry: `226149` JavaScript bytes and `19` initial requests versus the original `238257`-byte monolithic graph; reduction `12108` bytes (`5.1%`); permanent limits `235000` bytes and `22` requests.
- Phrases performance evidence came from controlled run `30366489438`, artifact `8691127915`, digest `sha256:ac33ca9695a7b3bc8db26b4f8bca89c54fa05b0eb0a8145c7b93cf629bc9c589`; the test-only probe was removed byte-for-byte before final CI.
- Eight compact/desktop Light/Dark Phrases catalog/detail Linux images were manually reviewed and protected by exact dimensions and SHA-256 hashes; source artifact `8691167183`, digest `sha256:5b9a1c18f27d014de47885a1ae7743f93583730b17734e5dc04eb6d293b16790`.
- Canonical `/phrases` and `/phrases/[slug]` no longer load `LexigoPremiumApp`; the remaining compatibility implementation is rollback/dead-code debt for Issue #70.

### Scenario learning

- Durable Scenario contracts, ordered steps, optimistic versioning, pause/resume/reload, fact/hypothesis evidence and idempotent submission are implemented.
- Scenario review targets resolve to concrete enrolled learning items and use the central learning transaction writer.
- Canonical `/scenarios/[slug]`, Scenario catalog `/scenarios` and Progress Scenario evidence/recommendations are in production.
- Scenario catalog preserves backend order and remains usable if Progress recommendations fail.

### Dictionary, Word Detail and Phrases

- Canonical `/dictionary` is server-owned for search, filters, sorting, pagination and exact result order; URL state and Back/Forward recovery are preserved.
- Canonical `/words/[id]` loads independently, strictly validates scheduler fields and loads bounded server-owned related phrases.
- Word Detail pronunciation has supported, loading, playing, error and unsupported states.
- Single-word practice creates an exact lesson with `wordIds: [selectedWordId]`.
- Canonical `/phrases` preserves server order, bounded pagination and URL-backed `topic`, `query`, `sort` and `page` state.
- Canonical `/phrases/[slug]` loads only its direct-detail API on cold entry, reload and new-tab navigation.
- Phrases hands lesson configuration to the existing `/learn?source=phrases` flow without creating a second lesson lifecycle.
- Loading, empty, correlated error/retry, offline, guest preview, keyboard, axe, reduced motion, forced colors, Light/Dark and 200% reflow contracts are blocking.

### Profile and appearance

- Authenticated `/profile` is implemented from approved Figma nodes.
- Daily goal remains server-owned; calendar reminders remain browser/calendar-owned.
- Password, sessions, email change, export and deletion retain their existing account/API owners.
- Appearance persists only `auto`, `light` or `dark`; first-paint theme bootstrap and PWA `theme-color` are implemented.
- Logout and session invalidation remain owned by the persistent App Router shell.

### Shared system and offline states

- `frontend/app/system-states.css` is the sole shared loading/empty/error/success/skeleton/connectivity presentation owner.
- `ReviewOutboxRuntime` remains the sole connectivity and durable review-queue runtime owner.
- Reviews are persisted before the first network request and retain one idempotency key across retry/reload.
- Auth and CSRF tokens are never persisted in the outbox.
- Full offline lesson progression remains intentionally unsupported; new lesson creation remains blocked offline.
- Reduced motion, forced colors, Light/Dark, 320 px, 200% reflow, Chromium/WebKit, Android/iOS PWA, keyboard, axe, CSP, service-worker and performance contracts are blocking.

## In progress

- No product slice is active after Issue #199 completion and exact-SHA stage validation.
- The immediate follow-up is a separate documentation slice for Issue #115: update stale frontend ownership text in `README.md` and `docs/architecture.md`, validate it through the non-Agent-Docs CI path and close the route-island epic only after that criterion is satisfied.

## Remaining roadmap

### 1. #115 — Complete route-island architecture documentation

- Runtime islands, budgets, direct-entry, History and browser validation are complete.
- Update the stale statements that still describe Phrases or Active Lesson as compatibility-graph routes.
- Re-run the complete required CI because `README.md` and `docs/architecture.md` are outside the Agent Docs lightweight allow-list.
- Close Issue #115 only after documentation and final evidence are verified.

### 2. #70 — Remove proven-dead compatibility applications and conflicting CSS

- Route extraction now provides the missing Phrases/dead-code evidence.
- Perform dependency/import, source-owner, bundle, browser and authoritative Linux visual audits before each deletion.
- Remove only proven-dead code in small atomic PRs; do not mix cleanup with redesign.

### 3. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after exact approved design states are available.

### 4. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation, including scheduling, permissions, import/export and deletion semantics.

### 5. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- Issue #115 architecture-documentation criterion remains pending; runtime implementation and route budgets are complete.
- Parts of First Use still require approved exact Figma states.
- Final moderated usability evidence remains external work under Issue #133.

## Blocked

- Design-dependent portions of First Use remain blocked on approved production Figma nodes.
- Final usability closure is blocked on external moderated sessions.

## Recent production/tooling evidence

1. #273 — `feat(phrases): add production catalog and route island` → `b53aeca3329bef61dd23c7b08964d98065ee1d7b`.
2. #272 — `docs(agent): reconcile live main before Phrases runtime` → `3475d1443bbccedb63bca54e67c5762aec2374e3`.
3. #271 — `docs(agent): reconcile Phrases design handoff` → `ff63aba1b0cd02f909121e80da6ea51537ef1960`.
4. #270 — `docs(figma): hand off Phrases production designs` → `5472e8f0479a750483709222745cdee92f504258`.
5. #267 — `fix(dictionary): preserve immediate search submit` → `b16f1e4a54b7c9a997744f5fd6bdf230010b76fa`.
6. #262 — `refactor(frontend): consolidate system-state CSS ownership` → `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.
7. #258 — `perf(lesson): extract Active Lesson route island` → `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`.
8. #255 — `perf(learn): extract Learn route island and lock bundle budget` → `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`.
9. #251 — `fix(home): preserve navigation history graph` → `dc59c8cc0906e8fe3f2ec787c87aecb0a4b23754`.
10. #248 — `perf(progress): extract Progress route island` → `a617dfce331700d0b3e911726d52a2683f18d526`.
11. #244 — `ci(agent): add lightweight Agent Docs path` → `426144d00a857f36be8a543553df5029ac49a454`.

## Evidence

- PR #273 final head `73320ed0d61731984dc5004dc85c87184a083057` passed full CI #2275/run `30368871533`; review comments, reviews and review threads were empty.
- Expected-head squash merge produced `b53aeca3329bef61dd23c7b08964d98065ee1d7b` and canonical Phrases owners were read back from that exact `main` SHA.
- Deploy Stage run `30371866995` checked out the exact merge SHA, downloaded and validated its CI scope artifact, deployed exact web/API images, returned public frontend/API HTTP 200 on attempt one and passed all 12 public browser checks.
- Deployment-status Issue #12 reports `b53aeca3329bef61dd23c7b08964d98065ee1d7b` with deploy, public smoke and public browser all successful.
- Issue #199 completion comment `5106052236` records the immutable-head CI, merge, stage, visual and performance evidence; Issue #199 is closed as completed.
- Issue #115 remains open because its architecture-documentation acceptance criterion is not yet satisfied by the stale `README.md` and `docs/architecture.md` wording.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, workflow jobs, artifacts or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not persist the current branch or `main` head as an indefinitely current fact: record it only with an explicit verification timestamp, and always resolve live refs again before writes.
