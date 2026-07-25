# Current Task

## Identity

- Issue: #24 — Scenario catalog and discovery
- Branch: `feat/issue-24-scenario-catalog`
- Base SHA: `56c8bf7b589601510ff60465c68c7482f5a8f320`
- Head SHA: resolve from live branch ref
- PR: create as Draft after the first bounded implementation checkpoint

## Objective

Implement the canonical authenticated `/scenarios` catalog/discovery route from approved Figma nodes `228:3`, `228:4`, `228:5` and `228:6`. The route must list the existing server catalog in backend order, present the exact optional Scenario recommendation returned by `/api/v1/progress`, and navigate to the existing focused `/scenarios/[slug]` lifecycle without client-owned ranking, judgement or scheduler logic.

## Scope

- Add the canonical App Router `/scenarios` boundary.
- Add a dedicated authenticated Scenario Catalog client island.
- Fetch and validate `GET /api/v1/scenarios` without local fallback, sorting or ranking.
- Fetch `/api/v1/progress` only to present the existing exact server-selected Scenario recommendation.
- Keep catalog discovery usable when progress/recommendation loading fails.
- Add the approved `Уроки / Сценарии` subsection switch inside Learning and Scenario Catalog.
- Preserve the existing four-item global navigation; Scenario Catalog remains under `Обучение`.
- Navigate every catalog card and recommendation to the exact canonical `/scenarios/[slug]` route.
- Cover direct entry, authentication return, loading, empty, error/retry, recommendation/no-recommendation, history, responsive, accessibility, visual and cold-route bundle contracts.

## Non-goals

- No backend, migration, seed-content or OpenAPI semantic change.
- No change to Scenario attempt lifecycle, review target, correctness, rating, review writer or scheduler.
- No fifth global navigation item.
- No client-side Scenario sorting, filtering, search, ranking or readiness calculation.
- No redesign of Lesson Composer, Progress or focused Scenario Lessons.
- No dependency update, broad CSS cleanup or unrelated route-island extraction.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/lessons/**` only for a newly proven reusable failure category
- `frontend/app/layout.tsx`
- `frontend/app/scenarios/page.tsx`
- `frontend/app/scenario-catalog.css`
- `frontend/app/scenario-catalog-accessibility.css` only if a distinct route-local accessibility owner is required
- `frontend/components/lexigo-scenario-catalog-app.tsx`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/route-primary-navigation.tsx`
- `frontend/components/routed-lexigo-app.tsx`
- `frontend/components/production-app-entry.test.ts`
- `frontend/lib/navigation.ts`
- `frontend/lib/navigation.test.ts`
- `frontend/lib/scenarios.ts`
- `frontend/lib/scenarios.test.ts`
- `frontend/bundle-budgets.json`
- focused Scenario Catalog E2E fixture/spec files
- narrowly required existing route, accessibility, visual and bundle source-contract/spec files
- Scenario Catalog Linux visual baseline paths only after manual artifact review

## Prohibited paths

- `backend/**`
- `api/**`
- database migrations and seed data
- `.github/workflows/**`
- authentication/session implementation except existing bootstrap route classification
- focused Scenario attempt/judgement implementation
- global design-token definitions
- unrelated visual baselines, routes or legacy cleanup
- CI gate weakening, timeout inflation or skipped required checks

## Runtime owners

- Session restore, auth loss and dynamic route graph: `frontend/components/lexigo-bootstrapped-app.tsx`.
- Canonical path/history and route focus transition: `frontend/lib/navigation.ts`, `frontend/components/routed-lexigo-app.tsx` and `frontend/components/route-primary-navigation.tsx`.
- Scenario catalog API reads and presentation: `frontend/components/lexigo-scenario-catalog-app.tsx`.
- Learning subsection entry: existing `frontend/components/lexigo-premium-app.tsx`.
- Scenario detail lifecycle and server-owned evidence: existing `frontend/components/lexigo-scenario-app.tsx`, unchanged unless an objective catalog-to-detail regression proves otherwise.
- Catalog payload validation: `frontend/lib/scenarios.ts`.
- Progress recommendation validation: existing `frontend/lib/account-resources.ts` and `frontend/lib/progress.ts`.
- Global CSS import: `frontend/app/layout.tsx`; route presentation: `frontend/app/scenario-catalog.css`.

## Documentation owners

- Product/API source: `api/openapi-scenarios.json`, unchanged.
- Design source: Figma file `3xXmBWnf38jbvLjtziwber`, nodes `228:3`, `228:4`, `228:5`, `228:6`.
- Active execution memory: `.agents/current/**`.
- Durable final state: `.agents/PROJECT_STATE.md` in post-merge reconciliation.

## Invariants

- `main` remains unchanged until squash merge.
- Every repository write names the feature branch explicitly and is read back.
- Catalog item order is byte-for-byte server order; the client never sorts or ranks.
- Recommendation slug, reason and action remain server-owned; the client only labels and routes the returned action.
- A progress read failure cannot hide a successfully loaded catalog.
- An empty server catalog renders an explicit empty state and never falls back to hard-coded Scenario content.
- `/scenarios` is authenticated and preserves `return_to=/scenarios` on auth loss.
- `/scenarios/[slug]` remains focused and keeps its existing lifecycle, drafts and judgement ownership.
- Global primary navigation remains four items and marks `Обучение` active on `/scenarios`.
- Catalog/recommendation state is not persisted to localStorage or sessionStorage.
- Light/Dark, reduced motion, forced colors and compact/desktop use the same semantic DOM and API contract.

## Acceptance criteria

- Authenticated direct entry to `/scenarios` loads `GET /api/v1/scenarios` and renders every valid item in response order.
- Malformed catalog envelopes fail closed through the existing request/validator error path.
- Empty `items` and `count=0` produce an explicit user-facing empty state.
- A recommendation from `/api/v1/progress` presents the exact server title/slug and uses `Продолжить` for `resume`, `Начать` for `start`.
- Catalog remains available when progress loading fails or recommendation is absent.
- `Уроки` opens `/learn`; `Сценарии` is current on `/scenarios`; `/learn` exposes the same subsection switch without changing Lesson Composer behavior.
- Every catalog card opens the exact canonical `/scenarios/[slug]` route and browser Back returns to the catalog.
- Guest entry redirects to `/profile?session=required&return_to=%2Fscenarios`; successful return opens the catalog.
- Global navigation remains four entries and `Обучение` is active for the catalog.
- Keyboard, focus, semantic list/article structure, axe, reduced motion, forced colors and 320 px/200% reflow pass.
- Reviewed Linux compact Light, compact Dark and desktop Light visuals match the exact approved Figma nodes.
- Cold `/scenarios` JavaScript/request evidence is measured and protected by an explicit ceiling.
- Final immutable head passes full required CI, has no unresolved review threads, squash-merges with expected head SHA, and the exact squash SHA passes stage deploy/public validation.

## Required checks

- Frontend lint, typecheck, unit tests, production build and production dependency audit.
- Navigation, Scenario catalog validator and production-root source contracts.
- Focused catalog E2E in desktop Chromium and iOS WebKit, plus configured Android/WebKit route regressions.
- App Router direct entry, Back/Forward, authentication return and route-island focus checks.
- Keyboard, axe Light/Dark, reduced motion, forced colors and 320 px/200% reflow.
- Linux visual actual review before allow-listed baseline import; final comparison without update mode.
- Measured `/scenarios` cold-route JavaScript and request ceilings.
- Full repository CI on the final developer-authored head.
- Exact-squash stage deploy, public smoke and public browser matrix.

## Risks

- Treating `/scenarios` as focused could incorrectly hide global chrome/footer; treating detail routes as catalog could expose chrome during focused work.
- A new route island can bypass the bootstrap ownership allow-list or lose focus/scroll during Learning ↔ Catalog transitions.
- Coupling catalog readiness to `/progress` can hide discovery during an analytics failure.
- Hard-coded card ordering or labels can silently duplicate backend ownership.
- Mobile cards or subsection tabs can overflow at 320 px/200% zoom.
- New visual baselines can be accepted without Linux/Figma review.
- A cold route can accidentally import the full premium product graph.

## Rollback

Revert the single Scenario Catalog squash merge. Existing `/learn`, `/progress`, `/scenarios/[slug]`, backend catalog and durable Scenario attempts remain intact; no migration or data rollback is required.
