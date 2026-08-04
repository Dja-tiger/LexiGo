# Current Task

## Identity

- Issue: #75
- Branch: `agent/issue-75-search-parity`
- Base SHA: `1a2eec84d5886b6e9ab15755feacbcb639440c4e`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Complete the remaining authenticated Phrases search parity gap and add fail-closed evidence for all seven Issue #75 acceptance criteria.

## Scope

- Extend authenticated PostgreSQL catalog search to phrase examples, matching the existing guest search surface.
- Prove English and Russian search, topic combination, URL/Back/Forward state, result count, clear/empty behavior, detail return with scroll/filter restoration and React-owned sorting.
- Register the focused Phrases acceptance browser suite in the authoritative UI command.
- Maintain factual Agent Harness records for this slice.

## Non-goals

- No Phrases redesign, CSS change or visual baseline update.
- No API schema, pagination ceiling, route budget or dependency change.
- No multi-select topic model; the current accessible single-topic filter remains the product contract.
- No production deployment or Issue #78 workflow workaround.

## Allowed paths

- `backend/internal/words/repository.go`
- `backend/integration/catalog_pagination_test.go`
- `frontend/e2e/phrases-search-acceptance.spec.ts`
- `frontend/components/phrases-search-acceptance-source.test.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- frontend runtime and presentation components
- CSS, visual snapshots and bundle budgets
- API/OpenAPI contracts and migrations
- deployment workflows and environment configuration
- dependencies and lockfiles
- `.agents/PROJECT_STATE.md` before product merge and stage validation

## Runtime owners

- `backend/internal/words/repository.go` — authenticated catalog filtering and ordering.
- `frontend/components/lexigo-phrases-app.tsx` — Phrases resource requests, URL/History and scroll restoration.
- `frontend/components/phrases-catalog.tsx` — accessible search/filter/count/empty/sort presentation.

## Documentation owners

- `.agents/current/**` during the active slice.
- `.agents/PROJECT_STATE.md` only in the post-deployment reconciliation slice.

## Invariants

- Search remains case-insensitive and bounded by the existing user, kind, source, topic, status and pagination filters.
- Search by lemma, translation, topic and aliases remains unchanged while examples are added.
- Guest and authenticated search cover the same phrase fields.
- Topic and query combine with logical AND.
- URL, page, detail and scroll restoration semantics remain unchanged.
- Sorting remains server/data-layer owned and exactly one React toolbar is rendered.
- Existing route budgets, accessibility, visual hashes and PWA behavior remain unchanged.

## Acceptance criteria

- English and Russian phrase search are verified.
- Topic controls expose keyboard/screen-reader selected state.
- Search and topic are combined in the request and result set.
- URL state restores through Back/Forward.
- Result count, clear filters and truthful empty state are verified.
- Detail open and Back restore filters and scroll.
- No DOM-injected sorting toolbar remains.
- Full immutable-head CI, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation succeed.

## Required checks

- Go formatting, unit/race/security and real PostgreSQL integration.
- Frontend lint, TypeScript, Vitest source contract and production build.
- Focused Phrases acceptance browser suite in Chromium and WebKit-capable full matrix.
- Full required browser, accessibility, visual, performance and container CI.
- Post-merge main and exact-image stage/public validation.

## Risks

- JSONB example expansion could accidentally broaden rows outside the existing topic/user boundary.
- A browser fixture that ignores request fields could create false evidence.
- History tests can become timing-sensitive if they assert DOM rather than URL/semantic readiness.

## Rollback

Revert the example-search predicate, focused integration/browser/source contracts, UI command registration and current Agent Harness records. No data migration or visual rollback is required.
