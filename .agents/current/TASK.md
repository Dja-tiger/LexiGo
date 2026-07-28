# Current Task

## Identity

- Issue: #199 — Phrases runtime implementation and route-island extraction.
- Branch: `agent/issue-199-phrases-runtime`.
- Base SHA: `3475d1443bbccedb63bca54e67c5762aec2374e3`.
- Head SHA: resolve from live PR ref before every immutable-head gate.
- PR: Draft #273.

## Objective

Implement the approved Phrases catalog/detail production slice from Figma and remove canonical `/phrases` and `/phrases/[slug]` runtime ownership from the `LexigoPremiumApp` compatibility entry. Preserve the existing typed backend APIs, authenticated session lifecycle, canonical navigation/history semantics and shared PWA/runtime owners.

## Scope

- Add a dedicated dynamically loaded Phrases client entry for `/phrases` and `/phrases/[slug]`.
- Implement the approved catalog and Phrase Detail hierarchy from Figma nodes `255:10`, `257:2`, `255:55`, `257:47`, `255:81`, `257:74`, `255:162`, `257:159` and resilient hooks `257:212`.
- Keep Phrases as a catalog kind under the primary Dictionary information architecture.
- Preserve URL-backed `topic`, `query`, `sort` and `page` state across reload and browser Back/Forward.
- Load authenticated catalog pages from `/api/v1/words?kind=phrase&source=phrases` without client reordering.
- Load `/api/v1/phrases/{slug}` independently on direct detail entry.
- Reuse the existing Learn route for lesson configuration through `source=phrases` and the selected topic.
- Integrate loading, empty, correlated error/retry and physical-offline presentation through existing shared owners.
- Add route-specific accessibility, responsive, history, direct-entry, visual and bundle contracts.

## Non-goals

- No backend, database, OpenAPI or migration changes.
- No new primary navigation item or second product route graph.
- No duplicate session restoration, refresh, review outbox, Service Worker, appearance or PWA ownership.
- No new lesson lifecycle or direct review writer.
- No unrelated deletion of legacy `LexigoPremiumApp` code or CSS; dead compatibility cleanup remains Issue #70.
- No changes to Dictionary or Word Detail information architecture.
- No Figma writes in this runtime slice.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/phrases.css`
- `frontend/bundle-budgets.json`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/routed-lexigo-app.tsx`
- `frontend/components/lexigo-phrases-app.tsx`
- `frontend/components/phrases-catalog.tsx`
- `frontend/components/phrase-detail-presentation.tsx`
- `frontend/components/phrases-route-island-source.test.ts`
- `frontend/components/production-app-entry.test.ts`
- `frontend/lib/phrases.ts`
- `frontend/lib/phrases.test.ts`
- `frontend/lib/bundle-budgets.test.ts`
- `frontend/e2e/app-router-routes.spec.ts`
- `frontend/e2e/catalog-pagination.spec.ts`
- `frontend/e2e/information-architecture.spec.ts`
- `frontend/e2e/route-bundle-budget.spec.ts`
- `frontend/e2e/speech-player.spec.ts`
- `frontend/e2e/phrases-production.spec.ts`
- `frontend/e2e/visual-regression.spec.ts`
- `frontend/e2e/accessibility.spec.ts`
- `frontend/e2e/support/quality-gates.ts`
- `frontend/docs/adaptive-knowledge-coach.md`
- `docs/frontend-bundle-budgets.md`

## Prohibited paths

- `backend/**`
- `api/**`
- `migrations/**`
- `.github/workflows/**`
- `frontend/components/review-outbox-runtime.tsx`
- `frontend/components/service-worker-registration.tsx`
- `frontend/lib/auth-session.ts`
- `frontend/components/lexigo-premium-app.tsx` unless a later source contract proves a minimal extraction edit is unavoidable and the scope is re-declared before that write.
- Any path outside Allowed paths without first updating this file and re-running pre-flight.

## Runtime owners

- `RouteChrome`: sole primary application navigation owner.
- `LexigoBootstrappedApp`: sole session restoration, refresh coordination, account runtime and dynamic route-entry owner.
- `LexigoPhrasesApp`: Phrases catalog/detail API reads, URL/history state, presentation and Learn handoff only.
- `ReviewOutboxRuntime`: sole connectivity and durable review-queue owner.
- Backend: authoritative catalog order, phrase detail payload and lesson creation/review persistence.

## Documentation owners

- `.agents/current/**`: active slice identity, progress and execution evidence.
- `frontend/docs/adaptive-knowledge-coach.md`: approved Figma/runtime ownership contract.
- `docs/frontend-bundle-budgets.md`: permanent measured route-budget evidence.

## Invariants

- Primary route navigation remains exactly Home, Learn, Dictionary and Progress; Phrases keeps Dictionary active.
- Canonical phrase detail links preserve catalog filters and remain valid in a new tab.
- Browser Back restores catalog URL state, result page and scroll without synthetic duplicate navigation.
- All History writes use `createNavigationHistoryState` and preserve the active route-graph owner.
- Direct Phrase Detail does not request catalog metadata, progress or a catalog page before rendering the phrase.
- Auth refresh remains centralized; Phrases does not call `/api/v1/auth/refresh` directly.
- Catalog requests remain bounded to `CATALOG_PAGE_SIZE` and the DOM never accumulates prior pages.
- Server result order is rendered unchanged.
- Search input synchronization cannot overwrite a user edit or immediate Enter submit.
- Loading, empty and error results preserve visible query/topic controls.
- Long English/Russian content reflows at 320 CSS pixels and 200% without horizontal overflow.
- Optional motion is disabled by `prefers-reduced-motion: reduce`; forced colors retain semantic boundaries.

## Acceptance criteria

- Dedicated `data-route-client-island="phrases"` renders both canonical routes and does not import `LexigoPremiumApp` or persistent runtime owners.
- `/phrases` matches approved mobile/desktop Light/Dark hierarchy and does not duplicate Lesson Composer.
- Search, topic, sort and pagination are URL-backed and recover through reload and Back/Forward.
- `/phrases/[slug]` works through direct entry/reload/new tab and loads only its detail API.
- Authenticated catalog uses exact typed server order and bounded pagination.
- Guest behavior remains explicit and does not create a second server/API owner.
- One lesson-configuration action hands off to `/learn?source=phrases` with the selected topic where applicable.
- Loading, empty, correlated error/retry and offline states are operable in desktop/mobile Chromium/WebKit.
- Keyboard, axe, Light/Dark, reduced motion, forced colors, 120–200% text zoom and Linux visual checks pass.
- Controlled cold-route measurement is recorded; permanent `/phrases` JavaScript/request ceilings are below the original monolithic limits.
- Full immutable-head CI, expected-head squash merge and exact-SHA stage/public validation pass before Issue #199 closes.

## Required checks

- Agent Harness source contract.
- Frontend lint and TypeScript.
- Frontend unit/source-contract tests and production build.
- Complete Playwright matrix: desktop Chromium/WebKit, Android Chromium, iOS WebKit.
- Keyboard and axe accessibility checks.
- Light/Dark, reduced-motion, forced-colors and 200% reflow checks.
- Canonical route, new-tab, reload, Back/Forward and scroll restoration checks.
- Low-end Android bounded catalog check.
- Linux visual review and approved baseline hashes.
- Controlled `/phrases` cold-route bundle measurement followed by permanent budget lock and probe removal.
- Full backend/frontend/browser/container CI required by product scope.
- Review comments, reviews and unresolved thread audit on final immutable head.
- Post-merge `main` CI and exact-SHA stage/public smoke/browser validation.

## Risks

- Next.js and native History can race and drop framework or `lexigoRouteGraph` state during cross-island transitions.
- A catalog synchronization effect can overwrite an immediate search edit, especially in WebKit.
- Importing guest phrase fixtures or compatibility helpers can erase the expected bundle reduction.
- Broad API failure fixtures can fail initial loading instead of the intended filtered request.
- Route-specific CSS can unintentionally override shared system-state or Dictionary presentation.
- Visual parity can conflict with existing primary IA; repository IA and approved ownership rules take precedence over illustrative Figma chrome.

## Rollback

Revert the single squash merge for this slice. The previous `LexigoPremiumApp` compatibility fallback remains present until separate Issue #70 cleanup, so rollback does not require backend or data migration work.
