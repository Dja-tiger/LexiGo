# LexiGo Project State

## Verification

- Last verified: 2026-07-26 05:32 Europe/Berlin
- Repository: `Dja-tiger/LexiGo`
- Live `main` must be resolved from GitHub at agent startup; at this verification the latest production merge was PR #231 at `e8be735457f5d622487b27ad5a621ce6bb7b9754`
- PR #231 final immutable head: `c603124eb6bc79300b6ada629816af937c0465b3`
- PR #231 full CI: #1885, run `30185771628`, successful
- Product deployment evidence for PR #231: Issue #12 and stage run `30186260749` report image `e8be735457f5d622487b27ad5a621ce6bb7b9754`, successful deploy, public smoke and 12/12 public Chromium/iOS WebKit checks
- Issue #230 is closed as completed
- No product PR is open after PR #231 merged
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

### Agent Harness

- PR #217 added the root agent entrypoint, normative index, verified project state, skills registry, current-task memory, templates, lessons, README/PR integration and dependency-free source contract.
- PR #219 reconciled merged Scenario backend evidence and reset `.agents/current/**` from templates.
- PR #220 removed the self-invalidating current-`main` snapshot from repository memory.
- PR #222 reconciled stage observation before Scenario UI work.
- PR #225 reconciled Scenario UI production evidence and reset `.agents/current/**` from templates.
- PR #227 reconciled Scenario progress integration and reset current task memory.
- PR #229 reconciled Scenario catalog production evidence and reset current task memory.
- This documentation follow-up records PR #231 production evidence and resets `.agents/current/**` byte-for-byte from canonical templates.
- Harness foundation merge SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`.

### Quality gates

Required contracts include backend unit/race/integration/security; frontend lint/type/build; Chromium/WebKit; Android/iOS PWA; keyboard/axe/reduced motion/200% zoom; route/history/recovery; CSP/service worker; Linux visual regression; bundle/performance; clean final-head CI and no unresolved review threads.

## In progress

No product slice is active. `.agents/current/**` is reset by the post-merge repository-memory reconciliation. A new product branch must not be created until live GitHub is re-read and one remaining Issue is selected through a fresh pre-flight.

## Remaining roadmap

### 1. #197 — Dictionary catalog

Canonical Figma presentation for `/dictionary`, preserving URL filters, API and route-island semantics. Nodes `78:54`, `78:193`.

### 2. #198 — Word Detail

Canonical `/words/[id]` Figma presentation and direct-entry/loading/error/history contract. Nodes `78:99`, `78:274`.

### 3. #199 — Phrases design gap

Approve exact catalog/detail nodes before implementation; no production implementation from inferred design.

### 4. #200 — Profile

Canonical Profile/preferences/appearance presentation preserving auth/session/security ownership. Nodes `79:6`, `79:129`.

### 5. #18 and #201 — Adaptive personalization and First Use

Diagnostic onboarding, skip path, reason-coded personalized queue and balancing after stable catalog/scenario routes and approved Figma states.

### 6. #202 and #170 — System and offline states

Unified loading/empty/error/offline presentation and explicit network-loss/recovery UX.

### 7. #25 — Pronunciation, listening and custom terminology

Architecture/privacy decision first, then typed backend contract, scheduling, permission UX and import/export/deletion semantics.

### 8. #115 — Route-level client islands and budgets

Bundle inventory and gradual extraction of remaining routes without duplicated session/API/PWA ownership.

### 9. #70 — Legacy apps and CSS

Proven-dead app/CSS families only, coordinated with route ownership and guarded by browser/visual/bundle evidence.

### 10. #203, #205 and #133 — Figma handoff, final parity and usability

Maintain exact production nodes, perform route-by-route parity after product slices, and complete external moderated usability validation.

## Validation pending

- Phrases and First Use design gaps require approved Figma states before implementation.
- Final moderated usability evidence remains external work under #133.

## Blocked

- Phrases and parts of First Use remain blocked where exact approved Figma states are absent.
- Final usability closure is blocked on external moderated sessions (#133).

## Recent production/tooling evidence

1. #231 — `fix(navigation): preserve Progress session and interrupt scroll restore` → `e8be735457f5d622487b27ad5a621ce6bb7b9754`.
2. #229 — `docs(agent): reconcile state after Scenario catalog` → `b1f92920af88c9d82b00c50e13b4d0450666989f`.
3. #228 — `feat(scenarios): add server-backed Scenario catalog` → `733b49feec5230d151ab7f0e6e78ca0a8ea0671e`.
4. #227 — `docs(agent): reconcile state after Scenario progress integration` → `56c8bf7b589601510ff60465c68c7482f5a8f320`.
5. #226 — `feat(progress): integrate Scenario completion recommendations` → `e45b6beb63de2e1b18fd4482f21df8083e188df2`.
6. #225 — `docs(agent): reconcile state after Scenario UI` → `591322c4a55b362402eab0b4936cd4e4f0347c3a`.
7. #221 — `feat(scenarios): implement focused Scenario Lessons UI` → `8404066b0d5705de19f230fb98621d139fab12a0`.

## Evidence

- Live `main`, merged PR #231, final CI #1885, closed Issue #230 and stage Issue #12/run `30186260749` were re-read at the verification timestamp.
- Product deployment evidence for #231 uses immutable image SHA `e8be735457f5d622487b27ad5a621ce6bb7b9754`; API/frontend containers were healthy, public endpoints returned HTTP 200 and 12/12 public Chromium/iOS WebKit checks passed.
- No open product PR was found after PR #231 merged.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, checks or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not persist the current branch or `main` head as an indefinitely current fact: record it only with an explicit verification timestamp, and always resolve live refs again before writes.
