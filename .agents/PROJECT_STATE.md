# LexiGo Project State

## Verification

- Last verified: 2026-07-25 22:03 Europe/Berlin
- Repository: `Dja-tiger/LexiGo`
- Live `main` must be resolved from GitHub at agent startup; at this verification the latest production merge was PR #221 at `8404066b0d5705de19f230fb98621d139fab12a0`
- Product deployment evidence for PR #221: Issue #12 and stage run `30172501400` report image `8404066b0d5705de19f230fb98621d139fab12a0`, successful deploy, public smoke and 12/12 public Chromium/iOS WebKit checks
- PR #221 validation: final immutable-head CI #1833 (`30171929980`) succeeded on `f9aa48b457f717b3faacd6cf549c93313dd14091`; changed-file and review-thread audits were clean
- PR #221 was squash-merged as `8404066b0d5705de19f230fb98621d139fab12a0`; Issue #196 is closed as completed
- No product PR was open after PR #221 merged; repository-memory reconciliation is a separate documentation/tooling follow-up
- Issue #24 remains open only for the broader Scenario product reconciliation, including an explicit Progress/recommendation contract for completed attempts

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
- Full required CI and post-merge stage validation are green for these product slices.

### Scenario learning foundation

- PR #216 added six workplace scenario types, ordered steps, explicit outcomes and criteria, durable attempts, optimistic versioning, pause/resume/reload recovery, atomic step acceptance, fact/hypothesis storage, submission idempotency and ordinary Recall review-event persistence.
- PR #218 corrected the Scenario evidence ownership boundary: every seeded step has an immutable review target definition; public payloads expose only `reviewTarget.term`; accepted submissions resolve/create and enroll the concrete learning item atomically; correctness and rating are derived server-side; scheduler and review-event persistence remain centralized in the learning transaction writer.
- `api/openapi-scenarios.json` is the bounded OpenAPI 3.1 source of truth for all seven authenticated Scenario routes and is protected by a dependency-free Go source-contract test.
- PR #221 completed Issue #196 with the canonical authenticated `/scenarios/[slug]` route island, start/resume/pause/reload/completion lifecycle, retry-safe versioned drafts, optimistic conflict resynchronization, separate facts/hypotheses, server-owned feedback and safe browser Back/close flows.
- Scenario presentation reuses `AccessibleDialog`, supports Light/Dark, compact/desktop, forced colors, reduced motion and 320 px/200% reflow, and has blocking keyboard/axe/browser coverage.
- Cold Scenario route evidence is `202679` JavaScript bytes and `16` initial requests with enforced ceilings `235000`/`18`.
- Reviewed Linux visual contracts are content-addressed: compact Light `390 × 1792`, SHA-256 `85a674882de19c87bc92d4b06888d7dc91471726a9916a943d4592bbd7919aab`; desktop Dark `1440 × 1054`, SHA-256 `eaad352ced6e94a639014af3ea9a01c5bd20ec335857fe21a5d2cec93af4da40`.
- PR #221 passed complete final-head CI and stage deployment/public validation on the exact squash SHA.

### Agent Harness

- PR #217 added the root agent entrypoint, normative index, verified project state, skills registry, current-task memory, templates, lessons, README/PR integration and dependency-free source contract.
- PR #217 passed full CI #1756 after the confirmed GitHub Actions infrastructure incident was resolved.
- PR #219 reconciled merged Scenario backend evidence, reset `.agents/current/**` byte-for-byte from templates and passed full final-head CI #1773.
- PR #220 removed the self-invalidating current-`main` snapshot from repository memory and passed full final-head CI #1775.
- PR #222 reconciled the stage observation before Scenario UI work and passed full CI #1804.
- Harness foundation merge SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`.

### Quality gates

Required contracts include backend unit/race/integration/security; frontend lint/type/build; Chromium/WebKit; Android/iOS PWA; keyboard/axe/reduced motion/200% zoom; route/history/recovery; CSP/service worker; Linux visual regression; bundle/performance; clean final-head CI and no unresolved review threads.

## In progress

No product slice is active. `.agents/current/**` is reset by the post-merge repository-memory reconciliation. A new product branch must not be created until live GitHub is re-read and one remaining Issue is selected through a fresh pre-flight.

## Remaining roadmap

### 1. #24 — Final Scenario product reconciliation

- Define an explicit server-owned contract for how completed Scenario attempts appear in Progress and recommendations.
- Reconcile the remaining catalog/completion/Progress acceptance surface without client-inferred judgement or duplicated scheduler logic.
- Close #24 only after the new contract, cross-layer consumers, browser matrix and stage evidence are complete.

### 2. #197 — Dictionary catalog

Canonical Figma presentation for `/dictionary`, preserving URL filters, API and route-island semantics. Nodes `78:54`, `78:193`.

### 3. #198 — Word Detail

Canonical `/words/[id]` Figma presentation and direct-entry/loading/error/history contract. Nodes `78:99`, `78:274`.

### 4. #199 — Phrases design gap

Approve exact catalog/detail nodes before implementation; no production implementation from inferred design.

### 5. #200 — Profile

Canonical Profile/preferences/appearance presentation preserving auth/session/security ownership. Nodes `79:6`, `79:129`.

### 6. #18 and #201 — Adaptive personalization and First Use

Diagnostic onboarding, skip path, reason-coded personalized queue and balancing after stable catalog/scenario routes and approved Figma states.

### 7. #202 and #170 — System and offline states

Unified loading/empty/error/offline presentation and explicit network-loss/recovery UX.

### 8. #25 — Pronunciation, listening and custom terminology

Architecture/privacy decision first, then typed backend contract, scheduling, permission UX and import/export/deletion semantics.

### 9. #115 — Route-level client islands and budgets

Bundle inventory and gradual extraction of remaining routes without duplicated session/API/PWA ownership.

### 10. #70 — Legacy apps and CSS

Proven-dead app/CSS families only, coordinated with route ownership and guarded by browser/visual/bundle evidence.

### 11. #203, #205 and #133 — Figma handoff, final parity and usability

Maintain exact production nodes, perform route-by-route parity after product slices, and complete external moderated usability validation.

## Validation pending

- Progress/recommendation integration for completed Scenario attempts requires an explicit product/API contract and regression matrix in a later atomic slice under Issue #24.
- Phrases and First Use design gaps require approved Figma states before implementation.
- Final moderated usability evidence remains external work under #133.

## Blocked

- Phrases and parts of First Use remain blocked where exact approved Figma states are absent.
- Final usability closure is blocked on external moderated sessions (#133).

## Recent production/tooling evidence

1. #221 — `feat(scenarios): implement focused Scenario Lessons UI` → `8404066b0d5705de19f230fb98621d139fab12a0`.
2. #222 — repository-memory/stage reconciliation before Scenario UI → `96caedb58a289ce13af9862a9258ba007809a73c`.
3. #220 — `docs(agent): make project state durable across docs merges` → `d7dc76c9139beff75d331c2b904f743f381f243d`.
4. #219 — `docs(agent): reconcile state after Scenario contract merge` → `bb9a70f5d49e62d0aa44330eeb9f41f1ebe540f2`.
5. #218 — `fix(scenarios): own objective review targets on the server` → `15386321399f5386ff97d7d093c8a3c2777018be`.
6. #217 — `chore(agent): formalize LexiGo development harness` → `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`.
7. #216 — `feat(scenarios): add durable scenario learning contract` → `f2785be459a04b87511ab8d9f26d60b3da15669b`.

## Evidence

- Live `main`, merged PR #221, final CI #1833, closed Issue #196, open Issue #24 and stage Issue #12/run `30172501400` were re-read at the verification timestamp.
- Product deployment evidence for #221 uses immutable image SHA `8404066b0d5705de19f230fb98621d139fab12a0`; API/frontend containers were healthy, public endpoints returned HTTP 200 and 12/12 public Chromium/iOS WebKit checks passed.
- The current stage and `main` must always be resolved live. The immutable product evidence above may be superseded by later documentation-only deployments and must not be interpreted as an indefinitely current ref.
- Indexed search is discovery only; final claims are based on exact files, refs, Issues, PRs, checks or deployment records.

## Update protocol

Update this file before a new task when stale, after roadmap/dependency changes, after material Issue changes, after product deployment and after any discrepancy with live GitHub. GitHub remains authoritative. Do not persist the current branch or `main` head as an indefinitely current fact: record it only with an explicit verification timestamp, and always resolve live refs again before writes.
