# Current Task

## Identity

- Issue: #198 — canonical Word Detail route
- Branch: `feat/issue-198-word-detail`
- Base SHA: `72291d9351f3c565d13be7b3f9e9055258f98ac6`
- Head SHA: resolve from live branch ref
- PR: create as Draft before runtime writes

## Objective

Implement `/words/[id]` as the canonical, independently loadable Word Detail experience from approved Figma nodes `78:99` and `78:274`. Preserve the existing Dictionary route island, authenticated session ownership, exact user-scoped word lookup, browser history and canonical URL semantics while replacing the temporary compatibility presentation with responsive Light/Dark production UI.

## Scope

- Load the selected word directly from authenticated `GET /api/v1/words/{wordID}` on cold entry, reload and history restoration without requiring a prior Dictionary page response.
- Preserve canonical `/words/[id]` routing and all source/topic/status/query/sort/page parameters used to return to the exact Dictionary result set.
- Present lemma, phonetic transcription, part of speech, translation, catalog context, technical examples and current learning status.
- Expose authoritative scheduler evidence already returned by the detail endpoint: status, repetitions, interval, due timestamp and last review timestamp.
- Load up to three related user-assigned phrases through a bounded server-owned phrase catalog search using the selected lemma; do not infer or fabricate phrase content client-side.
- Reuse `SpeechPlayerButton` for pronunciation with its existing loading, playing, error and unsupported states and a complete text path when audio is unavailable.
- Start an exact single-item lesson through the existing lesson API using `wordIds: [wordID]`, then hand off to canonical `/lesson/active` without duplicating lesson runtime ownership.
- Match the approved compact and desktop Word Detail hierarchy, with Dark as the source design and Light derived from Foundation V1 semantic tokens.
- Add focused source/unit/browser/accessibility/history/PWA/visual/bundle protection.

## Non-goals

- No backend, OpenAPI, migration, seed-content or scheduler algorithm change.
- No personal-note persistence or editing; the existing catalog `note` remains contextual learning content and must not be presented as user-authored data.
- No new audio file service, recording, microphone, listening exercise or pronunciation scoring; Issue #25 owns extended audio contracts.
- No Dictionary catalog redesign, filter semantic change or client-side catalog sorting/filtering.
- No route-island extraction beyond the existing Dictionary graph, no session bootstrap duplication and no global navigation rewrite.
- No Phrases catalog/detail redesign and no general system-state unification.
- No dependency, workflow or broad legacy CSS cleanup.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/AGENTS*.md` or `.agents/lessons/**` only for a newly proven reusable failure category
- `frontend/components/word-detail-presentation.tsx` and focused unit/source tests
- `frontend/components/dictionary-catalog.tsx` only to remove the old inline detail owner and preserve catalog-only behavior
- `frontend/components/lexigo-dictionary-app.tsx` for direct detail, related-phrase and single-item lesson orchestration inside the existing route island
- `frontend/components/lexigo-bootstrapped-app.tsx` and `frontend/components/production-app-entry.test.ts` only if an objective route ownership contract requires clarification; no new application root
- `frontend/lib/account-resources.ts` and focused tests for strict validation of existing detail scheduler fields
- `frontend/lib/learning.ts` only to expose existing server fields in the frontend type
- `frontend/app/word-detail.css`
- `frontend/app/dictionary-detail-compatibility.css` to retire the Issue #197 compatibility boundary
- `frontend/app/layout.tsx` only to import the new feature stylesheet and remove the retired compatibility import if required
- focused Word Detail fixtures and E2E specs
- existing accessibility, keyboard, history/navigation, PWA, visual-regression, route-bundle and performance suites only where Word Detail must become a blocking canonical state
- Word Detail Linux visual baseline paths only after manual artifact review
- `frontend/bundle-budgets.json` only after measured Linux evidence and only if an objective route-specific ceiling is required

## Prohibited paths

- `backend/**`
- `api/**`
- database migrations and seed data
- `.github/workflows/**`
- dependency manifests and lockfiles
- Scenario, Progress, Active Lesson or Lesson Composer implementation except existing public navigation/API handoff contracts
- Phrases visual redesign or unrelated catalog presentation
- global semantic token definitions
- unrelated routes, screenshots, budgets or legacy cleanup
- CI gate weakening, timeout inflation, browser exclusions or blind snapshot updates

## Runtime owners

- Session restore and route graph selection: `frontend/components/lexigo-bootstrapped-app.tsx`.
- Dictionary and Word Detail client island, authenticated requests, session adoption, history and route handoff: `frontend/components/lexigo-dictionary-app.tsx`.
- Canonical URL parsing/serialization: `frontend/lib/navigation.ts`, unchanged unless a proven defect exists.
- Word detail data producer: backend `GET /api/v1/words/{wordID}` with `words.UserWord`; no frontend-derived scheduler metrics.
- Related phrases: authenticated bounded `GET /api/v1/words?kind=phrase&query=<lemma>&limit=3` preserving server order.
- Exact practice session: authenticated `POST /api/v1/lessons` with one validated `wordID`; Active Lesson remains owned by the existing lesson graph.
- Pronunciation lifecycle: `frontend/components/speech-player-button.tsx` and `frontend/lib/speech-player.ts`, reused unchanged unless an objective integration regression is proven.
- Presentation: `frontend/components/word-detail-presentation.tsx` and `frontend/app/word-detail.css`.
- Dictionary list/search/filter/pagination: `frontend/components/dictionary-catalog.tsx`, catalog mode only.

## Documentation owners

- Product contract: Issue #198 and its comments.
- Design source: Figma file `3xXmBWnf38jbvLjtziwber`, Mobile Dark `78:99`, Desktop Dark `78:274`.
- Light appearance: existing Foundation V1 semantic tokens and a separately reviewed Linux baseline.
- Architecture and routing: `README.md` and `docs/architecture.md`.
- Active execution memory: `.agents/current/**`.
- Durable completed state: `.agents/PROJECT_STATE.md` in a separate post-merge reconciliation PR.

## Invariants

- `main` remains unchanged until expected-head squash merge.
- Every repository write explicitly names `feat/issue-198-word-detail` and is read back before the next write.
- Direct entry and reload fetch only the requested user-assigned word and never depend on a previously loaded catalog page.
- The detail route does not start the Dictionary list request in the background.
- Invalid IDs remain rejected by the App Router page; absent/unassigned words use the authenticated API error boundary without exposing catalog shape.
- URL filters and page remain attached to `/words/[id]`; Back restores the exact result set and stored scroll position.
- Scheduler values are displayed only when present and valid; Figma representative percentages are never treated as production data.
- Related phrases come only from the bounded server response and preserve server order; no client semantic ranking is introduced.
- The audio control never blocks reading or the main practice action and always exposes an accessible text alternative and live feedback.
- Single-item practice contains exactly the selected `wordID`; no topic-wide or page-wide substitution is allowed under a single-word CTA.
- Existing active-lesson recovery/version ownership remains unchanged after navigation to `/lesson/active`.
- Compact, medium and desktop presentation share one semantic DOM contract and remain usable at 320 px and 200% text zoom.
- Light/Dark, reduced motion and forced colors retain readable contrast, visible focus and no horizontal overflow.

## Acceptance criteria

- `/words/[id]` matches the hierarchy and responsive intent of Figma `78:99` and `78:274` using actual server data.
- Cold direct entry, new-tab entry, reload and browser Back/Forward work without visiting `/dictionary` first.
- Lemma, phonetic, part of speech, translation, context and technical examples are rendered with correct language semantics.
- Current learning status and available scheduler dates/counts are described without invented retention percentages.
- Up to three server-returned related phrases are visible and navigable when available; their absence does not create a false empty error.
- Pronunciation exposes idle/loading/playing/error/unsupported semantics and the textual word/phonetic remains available in every state.
- The main action creates a lesson containing exactly the selected word and navigates through the canonical active-lesson recovery flow.
- The old topic-wide `Настроить урок по этой теме` detail action and temporary dark compatibility UI are retired.
- Loading, retryable error, not-found/unassigned and action-failure states are explicit, accessible and do not destroy the current route.
- 320–390 px, medium and desktop layouts, 200% zoom and long technical terms/examples have no clipping or horizontal overflow.
- Keyboard order, visible focus, screen-reader names, axe Light/Dark, reduced motion and forced colors pass.
- Reviewed Linux compact Dark, compact Light and desktop Dark/Light actuals are content-addressed only after manual comparison.
- Cold `/words/[id]` JavaScript/request evidence remains within an explicit route budget without importing the full product graph.
- Final developer-authored immutable head passes full required CI, has no unresolved review threads, squash-merges with expected head SHA and the exact squash SHA passes stage/public validation.

## Required checks

- Harness source contract and allowed-path audit.
- Frontend lint, typecheck, unit tests, production build and production dependency audit.
- Strict learning-item validation for existing scheduler fields and malformed payload rejection.
- Word Detail direct-entry, reload, Back/Forward, exact single-item lesson request and related-phrase server-order browser contracts.
- Desktop Chromium/WebKit, Android Chromium and iOS WebKit journeys.
- Speech loading/error/unsupported integration and non-blocking text path.
- Keyboard order, visible focus, blocking axe in Light/Dark, reduced motion, forced colors and 320 px/200% reflow.
- PWA direct-entry/recovery and service-worker route compatibility.
- Linux visual actual review before any baseline promotion; final visual comparison without update mode.
- Cold route JavaScript/request measurement and performance budget gate.
- Full repository CI on the final developer-authored head.
- PR comments/reviews/thread audit, Ready transition, expected-head squash merge and exact-SHA stage/public validation.

## Risks

- The current frontend validator drops scheduler fields already returned by the backend; partially extending the type without validating every consumer could create silent undefined data.
- Creating a lesson from a detail CTA can accidentally send topic/page items instead of the exact selected ID or bypass the canonical resume gate.
- Direct detail currently shares `DictionaryCatalog` effects and may still trigger a catalog page request unless mode ownership is separated explicitly.
- Server search for related phrases can return no items or phrases with long technical text; the UI must preserve server order and reflow without implying stronger semantic ranking.
- The Figma personal-note block has no persistence contract; presenting catalog `note` as personal data would be misleading.
- Scheduler timestamps require deterministic, locale-safe presentation and must not claim a due interval not present in the response.
- Mobile speech synthesis support varies; unsupported/error feedback must not disable the text or lesson action.
- Retiring the compatibility stylesheet can leak catalog Light/Dark tokens into the detail route unless the new full-canvas owner is explicit.
- Existing release suites may still use old detail headings, classes or CTA names and must be migrated to semantic contracts rather than preserved as legacy UI.

## Rollback

Revert the single Word Detail squash merge. The authenticated detail API, Dictionary catalog, canonical `/words/[id]` route, existing Lesson Composer, Active Lesson, session bootstrap and backend data remain intact; no migration or data rollback is required.
