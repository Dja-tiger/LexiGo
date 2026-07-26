# LexiGo Project State

## Verification

- Last verified: 2026-07-26 17:03 Europe/Berlin
- Repository: `Dja-tiger/LexiGo`
- Live `main` must be resolved from GitHub at agent startup; at this verification the latest production merge is PR #235 at `5551ec5b0ac849e884c1c94dff91ae66a73269d9`
- PR #235 final immutable head: `a518e3fb84e2ce05de04e4b1d7cb7bc6e6a74754`
- PR #235 full CI: #1971, run `30204983602`, successful
- Product deployment evidence for PR #235: Issue #12 and stage run `30207248528` report image `5551ec5b0ac849e884c1c94dff91ae66a73269d9`, successful deploy, public smoke and 12/12 public Chromium/iOS WebKit checks
- Issue #198 is closed as completed
- No product PR is open after PR #235 merged
- The current repository-memory reconciliation is a documentation/tooling follow-up only; it does not change runtime code

## Completed

### Platform foundations

- Go API, PostgreSQL, Redis, auth/session, account security, migrations, Docker and CI/CD foundations are implemented and protected by backend unit/race/integration/security gates.
- PWA shell, canonical App Router paths, browser history, route recovery and persistent runtime were completed by PR #113.
- Catalog, word/phrase detail, durable personal learning state and phrase deep links are in production.

### Learning core

- Due queue, spaced repetition, objective schema-v2 review events, durable offline review outbox and idempotency are implemented.
- Study, Recall and Choice are separate runtime and evidence modes.
- Progressive Lesson Composer was completed by PR #192.
- Canonical Active Lesson was completed by PR #208.
- Canonical Lesson Result, distinct-next protection and reload/history recovery were completed by PR #209.

### Retained-learning evidence

- PR #214 implemented canonical `/progress`, server-owned weekly evidence, retained knowledge, due backlog, weak topics, trend, recommendations and global/topic due Recall actions.
- PR #215 completed Issue #19 with weak part-of-speech evidence and direct server-owned recommendations.
- PR #226 extended `/api/v1/progress` with authoritative Scenario completion activity and one deterministic reason-coded Scenario recommendation while preserving due Recall as the higher-priority next action.
- Full required CI and post-merge stage validation are green for these product slices.

### Route-boundary session and navigation reliability

- PR #231 fixed the guest-bootstrap → in-app login → `/progress` ownership gap: route-boundary reconciliation now adopts the authenticated document session before the dedicated Progress island renders.
- Every successful coalesced access-token refresh publishes one validated document-scoped session update; the bootstrap owner adopts it through the existing cache rather than allowing a later island to receive a stale token.
- Matching bootstrap-cache and CSRF state remain a cache hit, so ordinary App Router transitions do not add a duplicate network refresh.
- Progress remains escapable through Home, Learning and Dictionary navigation in desktop, mobile and installed-PWA browser projects.
- Route/history scroll recovery is immediate (`behavior: "auto"`) rather than smooth and is cancelled by explicit wheel, touch, primary-pointer or non-editable scroll-navigation keyboard intent.
- Bounded retry remains for temporarily unreachable positions caused by asynchronous content growth; after interruption no later frame overwrites the user's position.
- Focus and live-region settlement remain single-shot after successful restoration or user interruption.
- Regression coverage includes guest login → authenticated Progress → Home/Learning/Dictionary, successful refresh adoption, immediate scroll behavior, async-height retry, cancellation/no-further-write and deterministic browser wheel interruption.
- PR #231 passed complete final-head CI #1885 and exact-squash stage/public validation in run `30186260749`; Issue #230 is complete.

### Scenario learning foundation and product integration

- PR #216 added six workplace scenario types, ordered steps, explicit outcomes and criteria, durable attempts, optimistic versioning, pause/resume/reload recovery, atomic step acceptance, fact/hypothesis storage, submission idempotency and ordinary Recall review-event persistence.
- PR #218 corrected the Scenario evidence ownership boundary: every seeded step has an immutable review target definition; public payloads expose only `reviewTarget.term`; accepted submissions resolve/create and enroll the concrete learning item atomically; correctness and rating are derived server-side; scheduler and review-event persistence remain centralized in the learning transaction writer.
- `api/openapi-scenarios.json` is the bounded OpenAPI 3.1 source of truth for all authenticated Scenario routes plus the Scenario projection in `/api/v1/progress`; it is protected by a dependency-free Go source-contract test.
- PR #221 completed the canonical authenticated `/scenarios/[slug]` route island, start/resume/pause/reload/completion lifecycle, retry-safe versioned drafts, optimistic conflict resynchronization, separate facts/hypotheses, server-owned feedback and safe browser Back/close flows.
- Scenario presentation reuses `AccessibleDialog`, supports Light/Dark, compact/desktop, forced colors, reduced motion and 320 px/200% reflow, and has blocking keyboard/axe/browser coverage.
- PR #226 added current-week and total Scenario completion counts, deterministic `resume_in_progress`, `first_uncompleted` and `least_recently_completed` recommendations, strict frontend semantic validation, due-Recall priority, Scenario activity separate from retained knowledge, exact-slug routing from Progress and a completed-Scenario CTA to `/progress`.
- PR #228 completed the server-backed Scenario catalog/discovery surface at `/scenarios`, preserving exact backend order, keeping recommendation ownership in `/api/v1/progress`, remaining usable when Progress fails and routing into the existing focused Scenario lifecycle.
- PR #228 added the approved `Уроки / Сценарии` Learning subsection switch while preserving the four-item global navigation and route-chrome geometry across compact, medium and desktop layouts.
- Cold `/scenarios` evidence is `198852` JavaScript bytes and `17` initial requests with enforced ceilings `230000`/`19`.
- Reviewed Scenario Catalog Linux visual contracts: compact Light `390 × 1876`, SHA-256 `6d6412fabb2e1b9d5b146da4609da35b7544252d9ab04bd4a8ae3c6e45d26508`; compact Dark `390 × 1876`, SHA-256 `fa874501b7c1a9f66b868c350f607bec444ab12255a18a108f990295a525a47a`; desktop Light `1440 × 981`, SHA-256 `350597de5f363c687c821223b88d86849a62bf51f17b2483c300455fb717ae8a`.
- PR #228 passed complete final-head CI #1867 and exact-squash stage deployment/public validation in run `30184041786`; Issue #24 is complete.

### Dictionary catalog

- PR #233 completed the canonical Figma-backed `/dictionary` browse/search catalog from nodes `78:54` and `78:193` while preserving the dedicated `LexigoDictionaryApp` route island.
- Authenticated `GET /api/v1/words` remains authoritative for search, source, topic, learning status, sorting, pagination and exact item order; the client does not filter or sort returned items.
- Search/filter/sort/page state remains canonical in the URL and is restored through reload and browser Back/Forward without losing the existing result-scroll contract.
- The approved compact and desktop hierarchy includes the Dictionary heading/count, search, quick filters, desktop filter rail, vertical result rows/cards and one server-metadata-owned pagination surface.
- Catalog items navigate to canonical `/words/[id]`; Word Detail is now the production presentation completed by PR #235.
- The duplicate catalog-level Lesson Composer action was removed; Dictionary remains browse/search only.
- Loading, empty, error/retry, keyboard, axe, 320 px/200% reflow, PWA/history, route ownership and performance contracts are blocking.
- Dictionary visual evidence uses content-addressed full-page Linux screenshots while masking only the non-product profile glyph boundary that proved platform-antialias-sensitive.
- Reviewed Dictionary Linux visual contracts: compact Light `390 × 1064`, SHA-256 `fd61da13cbfb4378e17c5337e95632e95a33a944a5bbed1f64741124a8cea32b`; compact Dark `390 × 1064`, SHA-256 `b3f5349c94660fa041ac62d96f0e2f1f7683dfdbccf3792933eeb8a3892a3e27`; medium Light `768 × 1616`, SHA-256 `a0e187ffe7dedf4fefc29b4ae8f4ecf7ca859b66de178395c7b928647c19b80f`; desktop Light `1440 × 1624`, SHA-256 `eb4bf1143a93bedaf6186deca7f88154db1b1c2c46018b0dd4f3a6bfe63899bd`.
- PR #233 passed complete final-head CI #1912 and exact-squash stage deployment/public validation in run `30198116371`; Issue #197 is complete.

### Word Detail

- PR #235 completed canonical independently loadable `/words/[id]` from Figma nodes `78:99` and `78:274` while preserving the existing Dictionary route island, session bootstrap and URL/history ownership.
- Cold direct entry and reload load only authenticated `GET /api/v1/words/{wordID}` and do not require Dictionary catalog metadata or a prior catalog visit.
- Existing scheduler fields `easiness`, `intervalDays`, `repetitions`, `dueAt` and optional `lastReviewedAt` are strictly validated before presentation; no representative Figma percentages are treated as production evidence.
- Related phrases use bounded server-owned phrase search with `limit=3` and preserve exact API order.
- Pronunciation reuses the accessible browser speech runtime with loading/playing/error/unsupported feedback and never blocks the textual learning path.
- The primary practice action creates an exact one-word lesson with `wordIds: [selectedWordId]` and follows the canonical `/lesson/active` resume-gate lifecycle.
- Cross-island handoff retains the Dictionary island until pathname settlement, reconciles the canonical URL-derived LexiGo target into the framework-owned Next history entry and only then transfers ownership to the product graph.
- Light/Dark, 320 px, 200% reflow, forced colors, reduced motion, keyboard, axe, PWA/history and browser contracts are blocking.
- Cold `/words/[id]` evidence is `212877` JavaScript bytes and `18` initial requests with enforced ceilings `245000`/`20`.
- Reviewed Word Detail Linux visual contracts: compact Light `390 × 1745`, SHA-256 `0d9eade831f96bcdf7b55132ebce75c69cf22bd4be9761d28e0ce98595968f7b`; compact Dark `390 × 1745`, SHA-256 `f985ac2cce5ae144e09dbe296de886de10b3fe31b01e175cd579f85812ca8088`; desktop Light `1440 × 1160`, SHA-256 `64258a07b5010045dcc4929110f5635d072c995bfaf315d9140aee0e6a3abf72`; desktop Dark `1440 × 1160`, SHA-256 `0d5f69b6b4ecb530bd51b421e20f5fcd66f4bc01d60bb20969b592e9a95fde24`.
- PR #235 passed complete final-head CI #1971/run `30204983602` and exact-squash stage deployment/public validation in run `30207248528`; Issue #198 is complete.

### Agent Harness

- PR #217 added the root agent entrypoint, normative index, verified project state, skills registry, current-task memory, templates, lessons, README/PR integration and dependency-free source contract.
- PR #219 reconciled merged Scenario backend evidence and reset `.agents/current/**` from templates.
- PR #220 removed the self-invalidating current-`main` snapshot from repository memory.
- PR #222 reconciled stage observation before Scenario UI work.
- PR #225 reconciled Scenario UI production evidence and reset `.agents/current/**` from templates.
- PR #227 reconciled Scenario progress integration and reset current task memory.
- PR #229 reconciled Scenario catalog production evidence and reset current task memory.
- PR #232 reconciled Progress navigation reliability production evidence and reset current task memory.
- PR #234 reconciled Dictionary catalog production evidence and reset current task memory.
- This documentation follow-up records PR #235 production evidence and resets `.agents/current/**` byte-for-byte from canonical templates.
- Harness foundation merge SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`.

### Quality gates

Required contracts include backend unit/race/integration/security; frontend lint/type/build; Chromium/WebKit; Android/iOS PWA; keyboard/axe/reduced motion/200% zoom; route/history/recovery; CSP/service worker; Linux visual regression; bundle/performance; clean final-head CI and no unresolved review threads.

## In progress

No product slice is active. `.agents/current/**` is reset by the post-merge repository-memory reconciliation. A new product branch must not be created until live GitHub is re-read and one remaining Issue is selected through a fresh pre-flight.

## Remaining roadmap

### 1. #199 — Phrases design gap

Approve exact catalog/detail nodes before implementation; no production implementation from inferred design.

### 2. #200 — Profile

Canonical Profile/preferences/appearance presentation preserving auth/session/security ownership. Nodes `79:6`, `79:129`.

### 3. #18 and #201 — Adaptive personalization and First Use

Diagnostic onboarding, skip path, reason-coded personalized queue and balancing after stable catalog/scenario routes and approved Figma states.

### 4. #202 and #170 — System and offline states

Unified loading/empty/error/offline presentation and explicit network-loss/recovery UX.

### 5. #25 — Pronunciation, listening and custom terminology

Architecture/privacy decision first, then typed backend contract, scheduling, permission UX and import/export/deletion semantics.

### 6. #115 — Route-level client islands and budgets

Bundle inventory and gradual extraction of remaining routes without duplicated session/API/PWA ownership.

### 7. #70 — Legacy apps and CSS

Proven-dead app/CSS families only, coordinated with route ownership and guarded by browser/visual/bundle evidence.

### 8. #203, #205 and #133 — Figma handoff, final parity and usability

Maintain exact production nodes, perform route-by-route parity after product slices, and complete external moderated usability validation.

## Validation pending

- Phrases and First Use design gaps require approved Figma states before implementation.
- Final moderated usability evidence remains external work under #133.

## Blocked

- Phrases and parts of First Use remain blocked where exact approved Figma states are absent.
- Final usability closure is blocked on external moderated sessions (#133).

## Recent production/tooling evidence

1. #235 — `feat(dictionary): implement canonical Word Detail` → `5551ec5b0ac849e884c1c94dff91ae66a73269d9`.
2. #234 — `docs(agent): reconcile state after Dictionary catalog` → `72291d9351f3c565d13be7b3f9e9055258f98ac6`.
3. #233 — `feat(dictionary): implement Figma-backed catalog` → `5da5218250c671fcee73dbe154f0e14703b05036`.
4. #232 — `docs(agent): reconcile state after Progress navigation fix` → `6f9bcd196af1f876500d2b6f700e5e7fdfb685aa`.
5. #231 — `fix(navigation): preserve Progress session and interrupt scroll restore` → `e8be735457f5d622487b27ad5a621ce6bb7b9754`.
6. #229 — `docs(agent): reconcile state after Scenario catalog` → `b1f92920af88c9d82b00c50e13b4d0450666989f`.
7. #228 — `feat(scenarios): add server-backed Scenario catalog` → `733b49feec5230d151ab7f0e6e78ca0a8ea0671e`.

## Evidence

- Live `main`, merged PR #235, final CI #1971, closed Issue #198 and stage Issue #12/run `30207248528` were re-read at the verification timestamp.
- Product deployment evidence for #235 uses immutable image SHA `5551ec5b0ac849e884c1c94dff91ae66a73269d9`; API/frontend containers were healthy, public endpoints returned HTTP 200 and 12/12 public Chromium/iOS WebKit checks passed.
- No open product PR or parallel reconciliation branch was found after PR #235 merged.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, checks or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not persist the current branch or `main` head as an indefinitely current fact: record it only with an explicit verification timestamp, and always resolve live refs again before writes.
