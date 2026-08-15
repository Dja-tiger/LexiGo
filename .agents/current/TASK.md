# Current Task

## Identity

- Issue: #540 — [Figma][#205] Add canonical Phrase Detail parity contract
- Branch: `feat/issue-540-phrase-detail-parity`
- Base SHA: `b418b2ff0e326eb5cb1d9a017afd2205bdf43a2d`
- Head SHA: resolve from live branch ref after handoff synchronization
- PR: #541 (Draft)

## Objective

Add an executable four-case canonical Figma parity contract for `/phrases/[slug]` in the existing authoritative Phrases browser owner, without creating a competing route graph, changing production UI speculatively, or refreshing visual baselines blindly.

## Scope

- Extend `frontend/e2e/phrases-visual.spec.ts` with the canonical Phrase Detail matrix.
- Cover mobile Dark/daily `255:55`, mobile Light/travel `257:47`, desktop Dark/technical `255:162`, desktop Light/daily `257:159`.
- Verify direct detail entry, exact content hierarchy, Light/Dark canvas, RouteChrome ownership, horizontal containment, reload stability, route-island ownership and authenticated exact-detail API scoping.
- Use guest demo content for deterministic guest canonical variants and a test-local exact `/api/v1/phrases/{slug}` override where authenticated coverage is required.
- Preserve the existing responsive Phrase Detail ownership: compact layouts below 768px intentionally hide the duplicate `.lx-phrase-detail-side` panel while keeping the main-card primary action visible; desktop keeps the side practice panel visible.

## Non-goals

- No Phrases catalog parity rework.
- No redesign, broad CSS cleanup or alternate Phrases route graph.
- No blind snapshot refresh.
- No backend/API contract, package/lockfile, Playwright config or workflow changes.
- No Profile, Onboarding or Issue #201 work.

## Allowed paths

- `frontend/e2e/phrases-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/AGENTS.base.md` only if a genuinely new confirmed failure category must be recorded before Ready.

## Prohibited paths

- `frontend/components/**`
- `frontend/app/**/*.css`
- existing Phrases PNG baselines
- `backend/**`
- package/lockfiles
- Playwright config
- `.github/workflows/**`

Production/runtime paths may be admitted only by a separately proven product defect and an updated pre-flight record.

## Runtime owners

- `LexigoPhrasesApp` owns `/phrases` and `/phrases/[slug]`.
- `PhraseDetailPresentation` owns Phrase Detail presentation.
- `RouteChrome` owns primary navigation.
- Authenticated direct detail uses exact `/api/v1/phrases/{slug}`.
- Guest direct detail uses `GUEST_PHRASES` derived from the repository phrase catalogs without fabricated scheduler/progress state.
- Mobile `<768px` hides `.lx-phrase-detail-side` by the existing `phrases.css` responsive contract; the main detail-card actions remain the compact interaction owner.

## Documentation owners

- Umbrella parity Issue #205.
- Atomic Issue #540.
- Repository handoff: `frontend/docs/adaptive-knowledge-coach.md`.
- Screen Map source: Figma `82:3`; Phrase Detail handoff `261:2`; production wrapper/page `253:3` / `253:2`.

## Invariants

- Preserve all eight existing content-addressed Phrases visual hashes and dimensions.
- Preserve existing browser-owned 200% zoom/reflow coverage.
- Preserve catalog parity delivered by #536 / PR #538.
- Semantic Phrases route boundary remains a single route island; detail semantic main is the existing `Карточка фразы` owner.
- Do not broaden authenticated direct-detail interception to catalog/metadata/progress endpoints.
- Compact canonical cases must assert hidden duplicate side practice ownership plus visible/enabled primary action; desktop canonical cases must assert visible side practice ownership.
- Live Figma MCP is quota-blocked; repository-approved exact node mapping is authoritative for this slice and no fresh cloud synchronization may be claimed.

## Acceptance criteria

- Four canonical Phrase Detail node/state cases execute in `frontend/e2e/phrases-visual.spec.ts`.
- Direct entry and reload are deterministic for selected daily/travel/technical content.
- Mobile uses visible `data-route-navigation="mobile"`; desktop uses visible `data-route-navigation="rail"`.
- Mobile hides `.lx-phrase-detail-side` while `.lx-phrase-detail-primary` remains visible/enabled; desktop shows the side practice panel and its action.
- Light/Dark canvas and Phrase Detail hierarchy are asserted without horizontal overflow.
- Authenticated direct-detail fixture is scoped to the exact slug request.
- Existing Phrases catalog parity and content-addressed baselines remain unchanged unless an independent defect is proven.
- Required immutable-head CI is green on final developer-authored head; no unresolved review threads remain before merge.

## Required checks

- Source/readback review of the modified authoritative spec.
- Targeted Phrases visual/browser collection on the canonical compact and desktop projects.
- Existing Phrases visual baseline/hash tests without update mode.
- Relevant UI/browser shards and full required immutable-head CI.
- Review-thread audit, expected-head squash merge, exact-main CI and Stage/public validation if runtime-bearing behavior changes; otherwise follow repository classifier for test-only delivery.

## Risks

- Guest dataset slugs/topics may be selected incorrectly from expanded catalogs.
- A broad route mock could hide unintended catalog/metadata/progress requests.
- Detail semantic main differs intentionally from catalog semantic main; assertions must follow actual route boundary instead of copying catalog expectations.
- Responsive ownership differs intentionally between compact and desktop; a parity test must not require the desktop-only side panel to be visible on mobile.
- Existing deterministic runtime forces animation/transition behavior; appearance must still be asserted through LexiGo appearance attributes and canvas token.

## Rollback

Revert the atomic test-contract changes plus task-memory bookkeeping without touching production runtime or existing visual baselines.
