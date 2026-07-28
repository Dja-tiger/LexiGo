# LexiGo Project State

## Verification

- Last verified: 2026-07-28 20:51 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live `main` at verification: `928b026e0bf694f07043986bec12f70374405dde`.
- Latest completed slice: Issue #70 tooling proof — Phrases compatibility reachability and deletion boundary.
- Completion PR: #277.
- PR #277 immutable developer-authored head: `7bd1b01ac7309c1198b9e7ea6e96dcdea6ea054d`.
- PR #277 authoritative full CI: #2290 / run `30379189814`, successful across Agent Harness and architecture contracts, backend unit/security/integration, frontend lint/type/unit/build/audit, both UI shards, Lesson completion, iOS PWA, accessibility, Content Security, Controlled Service Worker, Dictionary smoke, Linux visual regression, performance budgets and container builds.
- PR #277 review comments, submitted reviews and unresolved review threads were empty before merge.
- Expected-head squash merge produced `928b026e0bf694f07043986bec12f70374405dde`.
- Exact-SHA stage/public validation: run `30380720977`, deployed web/API image `928b026e0bf694f07043986bec12f70374405dde`, frontend/API HTTP 200 on the first attempt and public desktop Chromium/iOS WebKit matrix 12/12.
- Deployment-status Issue #12 reports the same exact stage SHA with deploy, public smoke and public browser all successful.
- Issue #70 remains open: the proof slice authorizes only one bounded follow-up runtime deletion family and does not close the broader compatibility/CSS cleanup epic.
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
- README and `docs/architecture.md` document the executable route-to-entry inventory, persistent runtime owners, Phrases direct-entry/URL-state contract and the narrow compatibility fallback.
- `scripts/ci/agent_docs_scope_test.py` validates public architecture against `LexigoBootstrappedApp` from the complete repository checkout before CI scope routing.
- `LexigoPremiumApp` is not the canonical owner of Phrases or Active Lesson; remaining compatibility code is separate Issue #70 debt.

### Compatibility cleanup evidence

- The production application-entry inventory and public architecture ownership are executable contracts.
- Document-level `body`, `button` and `input` ownership has been centralized without visual redesign.
- Shared system-state CSS ownership has been consolidated with computed-cascade and Linux visual protection.
- PR #277 proves that canonical `/phrases` and `/phrases/[slug]` select `LexigoPhrasesApp` for guest and authenticated entry before the final `LexigoPremiumApp` fallback.
- `LexigoPhrasesApp` owns guest catalog data, authenticated bounded catalog reads, independent direct detail, URL/History state and Learn handoff.
- `frontend/docs/compatibility-cleanup.md` records the exact Phrases catalog/detail deletion candidate family and the live shared phrase lesson-domain contracts that must remain.
- The complete `LexigoPremiumApp` is still reachable for guest authentication, account recovery and other fallback states and must not be broadly deleted.
- No CSS selector removal is authorized by the Phrases reachability proof; CSS changes require a separate selector, specificity, computed-cascade and authoritative Linux visual audit.

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

- `frontend/app/system-states.css` is the sole shared loading, empty, error, success, skeleton and connectivity presentation owner.
- `ReviewOutboxRuntime` remains the sole connectivity and durable review-queue runtime owner.
- Reviews are persisted before the first network request and retain one idempotency key across retry/reload.
- Auth and CSRF tokens are never persisted in the outbox.
- Full offline lesson progression remains intentionally unsupported; new lesson creation remains blocked offline.
- Reduced motion, forced colors, Light/Dark, 320 px, 200% reflow, Chromium/WebKit, Android/iOS PWA, keyboard, axe, CSP, service-worker and performance contracts are blocking.

## In progress

- No product or tooling slice is active after PR #277 merge and exact-SHA stage validation.
- The next Issue #70 slice must start only after this repository-memory reconciliation is merged.

## Remaining roadmap

### 1. #70 — Remove one proven-dead Phrases compatibility runtime family

- Use the exact manifest in `frontend/docs/compatibility-cleanup.md`.
- Delete only the unreachable Phrases catalog/detail state, effects/API loaders, presentation/navigation branches and imports from `LexigoPremiumApp`.
- Preserve guest authentication, account recovery, unknown-route fallback and all shared phrase lesson-domain behavior: `LessonSource = "phrases"`, mixed lessons, cloze judgement and answer suggestions.
- Replace candidate-presence assertions with absence assertions.
- Do not modify CSS in the runtime deletion PR; stop if a selector appears shared or its computed ownership is not proven.
- Require lint, typecheck, unit/source contracts, production build, full Chromium/WebKit/Android/iOS regression, authoritative Linux visual hashes and a controlled bundle comparison.

### 2. #70 — Continue compatibility and CSS cleanup by independently proven families

- Inventory actual imports, dynamic fallbacks, route predicates, CSS selectors, browser consumers and authoritative Linux visual hashes before each deletion.
- Select one minimal proven-dead family per atomic PR.
- Preserve guest/auth and remaining compatibility state until source and browser evidence proves replacement ownership.

### 3. #18 and #201 — Adaptive personalization and First Use

- Implement diagnostic onboarding, skip path, reason-coded personalized queue and balancing after exact approved design states are available.

### 4. #25 — Pronunciation, listening and custom terminology

- Resolve architecture/privacy and typed backend contracts before implementation, including scheduling, permissions, import/export and deletion semantics.

### 5. #203, #205 and #133 — Figma handoff, final parity and usability

- Maintain exact production nodes, complete route-by-route parity and perform external moderated usability validation.

## Validation pending

- Parts of First Use still require approved exact Figma states.
- Final moderated usability evidence remains external work under Issue #133.
- Each remaining Issue #70 family requires its own reachability, consumer, bundle, browser and visual evidence; no broad dead-code claim is accepted.

## Blocked

- Design-dependent portions of First Use remain blocked on approved production Figma nodes.
- Final usability closure is blocked on external moderated sessions.

## Recent production/tooling evidence

1. #277 — `test(frontend): prove Phrases compatibility deletion boundary` → `928b026e0bf694f07043986bec12f70374405dde`.
2. #276 — `docs(agent): reconcile route-island epic completion` → `3d4a8dd49255da11f25fd38f92b2a8637d443517`.
3. #275 — `docs(frontend): align completed route-island architecture` → `156f7a9144d7652766e68e54ff9f0e246edfcc2b`.
4. #274 — `docs(agent): reconcile Phrases runtime completion` → `279eb4dcfe461ce6c9b056146644689e488e44cc`.
5. #273 — `feat(phrases): add production catalog and route island` → `b53aeca3329bef61dd23c7b08964d98065ee1d7b`.
6. #272 — `docs(agent): reconcile live main before Phrases runtime` → `3475d1443bbccedb63bca54e67c5762aec2374e3`.
7. #271 — `docs(agent): reconcile Phrases design handoff` → `ff63aba1b0cd02f909121e80da6ea51537ef1960`.
8. #270 — `docs(figma): hand off Phrases production designs` → `5472e8f0479a750483709222745cdee92f504258`.
9. #262 — `refactor(frontend): consolidate system-state CSS ownership` → `f84e60a06124821e4d90086eea8fd8a2a03aaed9`.
10. #255 — `perf(learn): extract Learn route island and lock bundle budget` → `9c7a2a46a974a2fd3b16f2de95d8e6f7694584b8`.

## Evidence

- PR #277 final head `7bd1b01ac7309c1198b9e7ea6e96dcdea6ea054d` passed authoritative full CI #2290/run `30379189814`; review comments, submitted reviews and unresolved review threads were empty.
- Final compare was behind `0`, contained exactly the seven declared paths and made no runtime, CSS, workflow, backend or bundle-budget changes.
- Expected-head squash merge produced `928b026e0bf694f07043986bec12f70374405dde`; the proof rule, source contract and deletion manifest were read back from that exact `main` SHA.
- Deploy Stage run `30380720977` deployed exact web/API image `928b026e0bf694f07043986bec12f70374405dde`, returned frontend/API HTTP 200 on attempt one and passed all 12 public browser checks.
- Deployment-status Issue #12 reports `928b026e0bf694f07043986bec12f70374405dde` with deploy, public smoke and public browser all successful.
- Issue #70 remains open because PR #277 establishes only the Phrases deletion boundary; the actual runtime family and later CSS/compatibility families remain separate slices.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, workflow jobs, artifacts or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not persist the current branch or `main` head as an indefinitely current fact: record it only with an explicit verification timestamp, and always resolve live refs again before writes.
