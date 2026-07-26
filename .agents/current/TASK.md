# Current Task

## Identity

- Issue: #197 — Dictionary catalog
- Branch: `feat/issue-197-dictionary-catalog`
- Base SHA: `6f9bcd196af1f876500d2b6f700e5e7fdfb685aa`
- Head SHA: resolve from live branch ref
- PR: create as Draft after the first bounded implementation checkpoint

## Objective

Implement the production `/dictionary` browse/search catalog from approved Figma nodes `78:54` and `78:193` while preserving the existing Dictionary client island, server-owned pagination/filtering, canonical `/words/[id]` navigation and URL-driven Back/Forward restoration. The catalog must remain distinct from Lesson Composer and must not redesign Word Detail.

## Scope

- Replace the current generic catalog presentation with the approved mobile and desktop Dictionary information architecture.
- Present a concise Dictionary heading, catalog count, search, type/status quick filters, desktop filter rail and vertical result rows/cards.
- Preserve authenticated `GET /api/v1/words` ownership for search, source, topic, status, sort and pagination.
- Preserve URL encoding for filters, search, sort and page; browser Back/Forward must restore the corresponding state and scroll.
- Preserve the dedicated `LexigoDictionaryApp` client island and existing session bootstrap ownership.
- Navigate each result to canonical `/words/[id]` without changing Word Detail presentation or API semantics.
- Remove the catalog-level `Настроить урок по текущей выборке` action so Dictionary does not duplicate Lesson Composer.
- Cover loading, empty, error/retry, pagination, mobile/desktop, Light/Dark, keyboard, axe, long-term reflow, Linux visual and cold-route bundle contracts.

## Non-goals

- No backend, OpenAPI, migration, seed-content or pagination semantic change.
- No redesign of `/words/[id]`; Issue #198 owns Word Detail.
- No Phrases catalog/detail redesign; Issue #199 owns that design gap and implementation.
- No Lesson Composer behavior, queue, scheduler or review change.
- No global loading/error/offline state redesign; Issue #202 owns system states.
- No route-island extraction, dependency update, workflow modification or broad CSS cleanup.
- No client-side filtering, sorting, status inference or fallback catalog content.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/lessons/**` only for a newly proven reusable failure category
- `frontend/components/dictionary-catalog.tsx`
- `frontend/components/lexigo-dictionary-app.tsx` only for route-local presentation/props required by this catalog
- `frontend/components/catalog-pagination.tsx`
- `frontend/components/catalog-kind-navigation.tsx` only if required by the approved catalog type switch
- `frontend/app/dictionary-catalog.css`
- `frontend/app/catalog-pagination.css`
- `frontend/app/information-architecture.css` only for catalog-kind primitives shared with the existing Phrases route
- `frontend/lib/interface-copy.ts` only for a verified shared semantic label correction
- `frontend/lib/navigation.ts` and its tests only if an existing URL contract cannot express an approved filter
- focused Dictionary unit/source-contract/E2E fixture and spec files
- `frontend/e2e/accessibility-audit.spec.ts`
- `frontend/e2e/accessibility-keyboard.spec.ts`
- `frontend/e2e/visual-regression.spec.ts`
- `frontend/e2e/route-bundle-budget.spec.ts`
- `frontend/e2e/information-architecture.spec.ts`
- `frontend/bundle-budgets.json` only after measured immutable Linux evidence
- Dictionary Linux visual baseline paths only after manual artifact review

## Prohibited paths

- `backend/**`
- `api/**`
- database migrations and seed data
- `.github/workflows/**`
- dependency manifests and lockfiles
- Scenario, Progress, Active Lesson or Lesson Composer runtime
- `/words/[id]` detail redesign or new detail API semantics
- Phrases visual redesign
- global design-token definitions
- unrelated routes, visual baselines or legacy cleanup
- CI gate weakening, timeout inflation or skipped required checks

## Runtime owners

- Session restore and route-graph selection: `frontend/components/lexigo-bootstrapped-app.tsx`, unchanged unless an objective route-island regression proves otherwise.
- Dictionary route island, API reads, history and scroll snapshots: `frontend/components/lexigo-dictionary-app.tsx`.
- Catalog presentation and filter interaction: `frontend/components/dictionary-catalog.tsx`.
- Canonical URL parsing/serialization: `frontend/lib/navigation.ts`.
- Pagination metadata: backend `/api/v1/words` response and `frontend/lib/catalog-page.ts`.
- Route shell/global navigation: existing `RoutedLexigoApp` and `RouteChrome`, unchanged.
- Route-local presentation: `frontend/app/dictionary-catalog.css` and narrowly required catalog primitives.

## Documentation owners

- Product contract: Issue #197 and its comments.
- Design source: Figma file `3xXmBWnf38jbvLjtziwber`, Mobile Light `78:54`, Desktop Light `78:193`.
- Dark appearance: existing Foundation V1 semantic tokens plus a separate Linux baseline.
- Active execution memory: `.agents/current/**`.
- Durable final state: `.agents/PROJECT_STATE.md` in a separate post-merge reconciliation PR.

## Invariants

- `main` remains unchanged until squash merge.
- Every repository write names `feat/issue-197-dictionary-catalog` explicitly and is read back.
- Search, topic, source, status, sort and page remain server-owned request parameters; the client does not filter or sort returned items.
- Pagination preserves all active filters and never appends duplicate results.
- Search/filter/page state remains canonical in the URL and restorable through Back/Forward and reload.
- `/dictionary` remains a dedicated client island and does not import the full product graph.
- Catalog cards/rows navigate to the exact `/words/[id]` route.
- Catalog UI does not configure or start a lesson.
- Word Detail behavior remains unchanged in this slice.
- Mobile and desktop use the same semantic data/interaction contract; presentation may adapt without hidden desktop-only interaction assumptions.
- Light/Dark, reduced motion, forced colors, 320 px and 200% text zoom retain usable controls and no horizontal overflow.

## Acceptance criteria

- `/dictionary` matches the hierarchy, spacing, search, quick filters, desktop filter rail and result-row/card patterns of Figma `78:54` and `78:193`.
- The heading is `Словарь`; catalog count is derived from verified metadata/page evidence rather than hard-coded Figma numbers.
- Search works by Enter/submit and remains represented in the URL.
- Type/status/topic/sort controls expose selected state to keyboard and assistive technology.
- Browser Back/Forward and reload restore search/filter/page state and the existing result-scroll contract.
- Pagination keeps filters, uses server page metadata and renders each response item exactly once.
- The catalog has no lesson-configuration CTA or duplicated Lesson Composer controls.
- Result rows/cards expose term, translation and a route-local status label, and open canonical `/words/[id]`.
- Loading, empty and retryable error states remain explicit and accessible without implementing global system-state redesign.
- 320–390 px, desktop, 200% zoom, long technical terms, Light/Dark, reduced motion and forced colors have no overflow, clipping or inaccessible focus.
- Reviewed Linux mobile Light, mobile Dark and desktop Light actuals are content-addressed only after manual comparison with Figma.
- Cold `/dictionary` JavaScript and request counts are measured and protected by an evidence-backed ceiling.
- Final immutable developer-authored head passes full required CI, has no unresolved review threads, squash-merges with expected head SHA, and the exact squash SHA passes stage/public validation.

## Required checks

- Frontend lint, typecheck, unit tests, production build and production dependency audit.
- Dictionary source ownership, navigation and pagination contracts.
- Desktop Chromium and iOS WebKit browse/search/filter/pagination/history tests; configured Android/WebKit route regressions.
- Keyboard interaction, visible focus, axe Light/Dark, reduced motion, forced colors and 320 px/200% reflow.
- Linux visual actual review before allow-listed baseline import; final comparison without update mode.
- Cold `/dictionary` JavaScript/request measurement and budget gate.
- Full repository CI on the final developer-authored head.
- PR comment/review/thread audit, Ready transition, expected-head squash merge and exact-SHA stage/public validation.

## Risks

- Replacing selects with visual chips can lose native keyboard/selected-state semantics.
- Mapping backend statuses to Figma-facing labels can accidentally change global terminology or imply unsupported scheduler meaning.
- A desktop filter rail can become hidden interaction on compact layouts or overlap the fixed route rail.
- Search submit and filter changes can create duplicate history entries or reset page/scroll incorrectly.
- Removing the catalog lesson CTA can leave stale tests or hidden IA copy that still asserts duplicated Lesson Composer behavior.
- Long technical terms and status pills can collide at 320 px or 200% zoom.
- Visual fixture data can accidentally depend on unrelated Progress or Phrases route mocks.

## Rollback

Revert the single Dictionary catalog squash merge. Existing `/dictionary` API ownership, `/words/[id]`, Lesson Composer, Phrases, session bootstrap and backend data remain available; no migration or data rollback is required.
