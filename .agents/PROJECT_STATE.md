# LexiGo Project State

## Verification

- Last verified: 2026-07-28 19:13 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `156f7a9144d7652766e68e54ff9f0e246edfcc2b`.
- Latest completed slice: Issue #115 — route-level client islands, bundle budgets and architecture documentation.
- Architecture completion PR: #275.
- PR #275 immutable developer-authored head: `3604ddecf68ce4d7be86f0f16cc3ad2e243e7505`.
- PR #275 authoritative full CI: #2286 / run `30375142888`, successful across the root-level architecture contract, backend unit/security/integration, frontend lint/type/unit/build/audit, both UI shards, Lesson completion, iOS PWA, accessibility, Content Security, Controlled Service Worker, Dictionary smoke, Linux visual regression, performance budgets and container builds.
- PR #275 review comments, submitted reviews and unresolved review threads were empty before merge.
- Expected-head squash merge produced `156f7a9144d7652766e68e54ff9f0e246edfcc2b`.
- Post-merge full CI succeeded on the exact merge SHA; automatic stage deployment consumed and validated that exact CI scope artifact before deployment.
- Exact-SHA stage/public validation: run `30376789983`, deployed web/API image `156f7a9144d7652766e68e54ff9f0e246edfcc2b`, frontend/API HTTP 200 on the first attempt and public desktop Chromium/iOS WebKit matrix 12/12.
- Deployment-status Issue #12 reports the same exact stage SHA with deploy, public smoke and public browser all successful.
- Issue #115 is closed as completed; completion comment ID `5106704918` records final evidence.
- Issue #199 remains closed as completed after PR #273 and exact-SHA stage run `30371866995`.
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

- Issue #115 is fully completed and closed.
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
- README and `docs/architecture.md` now document the executable route-to-entry inventory, persistent runtime owners, Phrases direct-entry/URL-state contract and the narrow compatibility fallback.
- `scripts/ci/agent_docs_scope_test.py` validates public architecture against `LexigoBootstrappedApp` from the complete repository checkout before CI scope routing.
- `LexigoPremiumApp` is no longer documented as the canonical owner of Phrases or Active Lesson; remaining compatibility code is separate Issue #70 debt.

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

- No product or tooling slice is active after Issue #115 completion, merge and exact-SHA stage validation.
- The next candidate epic is Issue #70, but work must begin with a fresh pre-flight and a repository-wide proof of the smallest dead compatibility application/CSS owner. Issue #70 must not be treated as one broad deletion PR.

## Remaining roadmap

### 1. #70 — Remove proven-dead compatibility applications and conflicting CSS

- Route-island extraction and architecture documentation now provide the required ownership baseline.
- Inventory actual imports, dynamic fallbacks, route predicates, CSS selectors, browser consumers and authoritative Linux visual hashes before deletion.
- Select one minimal proven-dead family per atomic PR.
- Preserve guest/auth and any remaining compatibility state until source and browser evidence proves replacement ownership.

### 2. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after exact approved design states are available.

### 3. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation, including scheduling, permissions, import/export and deletion semantics.

### 4. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- Parts of First Use still require approved exact Figma states.
- Final moderated usability evidence remains external work under Issue #133.
- Issue #70 cleanup evidence must be established per compatibility family; no broad dead-code claim is currently accepted.

## Blocked

- Design-dependent portions of First Use remain blocked on approved production Figma nodes.
- Final usability closure is blocked on external moderated sessions.

## Recent production/tooling evidence

1. #275 — `docs(frontend): align completed route-island architecture` → `156f7a9144d7652766e68e54ff9f0e246edfcc2b`.
2. #274 — `docs(agent): reconcile Phrases runtime completion` → `279eb4dcfe461ce6c9b056146644689e488e44cc`.
3. #273 — `feat(phrases): add production catalog and route island` → `b53aeca3329bef61dd23c7b08964d98065ee1d7b`.
4. #272 — `docs(agent): reconcile live main before Phrases runtime` → `3475d1443bbccedb63bca54e67c5762aec2374e3`.
5. #271 — `docs(agent): reconcile Phrases design handoff` → `ff63aba1b0cd02f909121e80da6ea51537ef1960`.
6. #270 — `docs(figma): hand off Phrases production designs` → `5472e8f0479a750483709222745cdee92f504258`.
7. #267 — `fix(dictionary): preserve immediate search submit` → `b16f1e4a54b7c9a997744f5fd6bdf230010b76fa`.
8. #262 — `refactor(frontend): consolidate system-state CSS ownership` → `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.
9. #258 — `perf(lesson): extract Active Lesson route island` → `d142fb4a6ce4f7e8c9894a19b0ccf6e5bcde05a2`.
10. #255 — `perf(learn): extract Learn route island and lock bundle budget` → `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`.

## Evidence

- PR #275 final head `3604ddecf68ce4d7be86f0f16cc3ad2e243e7505` passed full CI #2286/run `30375142888`; review comments, reviews and review threads were empty.
- Initial PR CI #2279/run `30374395504` failed only because the first root-document contract was placed inside the isolated frontend workspace. Artifact `8694316141` proved 455 existing tests green and two new `ENOENT: /README.md` failures.
- The unreachable frontend test was removed; the semantic contract was moved to the existing root-level classifier boundary without workflow or container-mount changes. The confirmed failure category is recorded in `.agents/AGENTS.issue-115-architecture-docs.md`.
- Expected-head squash merge produced `156f7a9144d7652766e68e54ff9f0e246edfcc2b`; updated architecture files were read back from that exact `main` SHA.
- Post-merge full CI succeeded on the exact merge SHA and supplied the CI scope artifact consumed by automatic deployment.
- Deploy Stage run `30376789983` checked out the exact merge SHA, downloaded and validated its CI scope artifact, deployed exact web/API images, returned public frontend/API HTTP 200 on attempt one and passed all 12 public browser checks.
- Deployment-status Issue #12 reports `156f7a9144d7652766e68e54ff9f0e246edfcc2b` with deploy, public smoke and public browser all successful.
- Issue #115 completion comment `5106704918` records final CI, merge, stage and architecture evidence; Issue #115 is closed as completed.
- Issue #199 completion comment `5106052236` records the Phrases runtime, visual and performance evidence; Issue #199 remains closed.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, workflow jobs, artifacts or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not persist the current branch or `main` head as an indefinitely current fact: record it only with an explicit verification timestamp, and always resolve live refs again before writes.
