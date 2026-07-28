# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-remove-phrases-compatibility`
- Base SHA: `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`
- Head SHA: resolve from live branch ref
- PR: #282

## Objective

Remove the proven-unreachable Phrases catalog/detail compatibility family from `LexigoPremiumApp` while preserving the canonical Phrases island, guest/auth fallback and every shared phrase lesson-domain contract.

## Scope

- Remove Phrases route-only state, derived values, URL/filter synchronization, API loaders/effects, lifecycle resets, handlers and presentation from `frontend/components/lexigo-premium-app.tsx`.
- Remove only imports, types and helpers that become unused with that route family.
- Replace compatibility-candidate presence assertions with a fail-closed absence contract while retaining canonical route ownership and shared lesson-domain assertions.
- Document the completed deletion boundary, preserved shared consumers, CSS boundary, validation and remaining Issue #70 work.
- Record exact execution and validation evidence in `.agents/current/*`.

## Non-goals

- No CSS selector, stylesheet or visual baseline change.
- No auth, password recovery, account, Home, Learn, Active Lesson, Lesson Result, Dictionary, Progress or Profile redesign/refactor.
- No removal of `LessonSource = "phrases"`, mixed lessons, phrase payload conversion, cloze judgement, answer suggestions or backend/API contracts.
- No removal of the shared guest phrase-browse helper `sortLearningItems` or its `sortCatalogEntries` dependency.
- No bundle-budget increase.
- No broad removal of `LexigoPremiumApp`.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/phrases-route-island-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`

## Prohibited paths

- `.github/workflows/**`
- `scripts/ci/**`
- `frontend/app/*.css`
- `frontend/e2e/**/*-snapshots/**`
- `frontend/bundle-budgets.json`
- backend, API, migrations and deployment files
- any route-island or shared lesson-domain implementation outside the two declared frontend component/test files

## Runtime owners

- `frontend/components/lexigo-bootstrapped-app.tsx` remains the canonical route selector.
- `frontend/components/lexigo-phrases-app.tsx` remains the sole `/phrases` and `/phrases/[slug]` owner.
- `frontend/components/lexigo-premium-app.tsx` remains the compatibility fallback for guest authentication, account recovery and other unextracted states only.
- `LexigoPremiumApp` continues to own shared phrase lesson-domain behavior used by its remaining Learn/lesson fallback states.

## Documentation owners

- `frontend/docs/compatibility-cleanup.md` owns the exact deletion manifest, preserved contracts and remaining cleanup boundary.
- `.agents/current/*` owns current task scope, execution evidence and handoff state.

## Invariants

- Guest and authenticated direct Phrases entry resolve to `LexigoPhrasesApp` before `LexigoPremiumApp`.
- `DEFAULT_PHRASE_CATALOG` remains available to enrich live phrase lesson payloads in `toLearningItem`.
- `sortLearningItems` and `sortCatalogEntries` remain available to the shared guest phrase-browse lesson path.
- `LessonSource` continues to accept `"phrases"`; the Lesson Composer option remains.
- Mixed lessons, phrase `slug`/`cloze`/answer conversion, cloze review and answer suggestions remain unchanged.
- No CSS selector or stylesheet changes in this slice.
- Authoritative Linux visual hashes remain unchanged.
- Existing route bundle ceilings are not raised.
- Temporary workflows, jobs and scripts are absent from the final diff.
- The final immutable PR head is developer-authored.

## Acceptance criteria

- Every route-only marker listed in the deletion manifest is absent from `LexigoPremiumApp`.
- Canonical Phrases reachability and ownership contracts remain green.
- Shared phrase lesson-domain markers remain present and executable.
- Lint and TypeScript report no stale imports, types or unreachable route helpers.
- `lexigo-premium-app.tsx` has a measured net reduction with no generated or formatting-only churn.
- Final compare is behind `0` and contains exactly the six allowed paths.
- Full frontend, backend, browser, accessibility, visual, performance, service-worker and container CI passes on one immutable developer-authored head.
- PR #282 has no unresolved review feedback and is squash-merged with expected head.
- Exact merge SHA passes stage deploy, public frontend/API smoke and public desktop/iOS browser validation.

## Required checks

- Change-scope classifier and Agent Harness routing contract.
- Frontend lint, TypeScript, unit/source contracts, production build and dependency audit.
- Direct `/phrases` and `/phrases/[slug]` guest/auth entry, reload, new tab and Back/Forward.
- Phrases search/filter/sort/pagination and Learn handoff.
- Phrase-containing lesson, cloze review and answer-suggestion regression.
- Desktop Chromium/WebKit and Android/iOS browser projects.
- Keyboard, axe, reduced motion, forced colors, 200% reflow and CSP.
- Authoritative Linux visual regression without baseline updates.
- Performance budgets without ceiling changes.
- Backend unit/security/integration and container builds.
- Review audit, expected-head squash merge and exact-SHA stage/public validation.

## Risks

- `DEFAULT_PHRASE_CATALOG` has both retired route and live lesson-conversion consumers; deleting it would break phrase slug/cloze enrichment.
- `sortLearningItems` has both retired route and live shared guest phrase-browse consumers; deleting it would break lesson browsing.
- Incomplete deletion can leave a stale effect/import or hidden bundle branch.
- Raw History transitions may briefly retain a compatibility component until the App Router selects the canonical island; browser tests must prove no observable regression.
- A documentation update after a green run changes the immutable head; the full authoritative matrix must therefore run again before merge.

## Rollback

Revert the atomic squash merge. No migration, API or persisted-data rollback is required.
