# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-remove-phrases-compatibility`
- Base SHA: `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`
- Head SHA: resolve from live branch ref
- PR: #280

## Objective

Remove the proven-unreachable Phrases catalog/detail compatibility family from `LexigoPremiumApp` while preserving the complete canonical Phrases island, guest/auth fallback and all shared phrase lesson-domain behavior.

## Scope

- Remove Phrases route-only state, derived values, URL/filter synchronization, API loaders/effects, reset writes and presentation from `frontend/components/lexigo-premium-app.tsx`.
- Remove route-only imports/helpers that become unused after the deletion.
- Replace compatibility-candidate presence assertions with fail-closed absence assertions while retaining canonical route ownership and shared lesson-domain assertions.
- Update the compatibility cleanup delivery document with exact completion evidence and the remaining CSS/compatibility boundary.
- Use one temporary, branch-only, path-guarded workflow solely because the connector exposes full-file replacement but no patch operation for the 3,106-line source file; remove all temporary workflow versions before final CI and ensure the final branch head is developer-authored.

## Non-goals

- No CSS or visual baseline changes.
- No auth, password recovery, account, Home, Learn, Active Lesson, Lesson Result, Dictionary, Progress or Profile redesign/refactor.
- No removal of `LessonSource = "phrases"`, mixed lessons, phrase payload conversion, cloze judgement, answer suggestions or backend/API contracts.
- No bundle-budget increase.
- No broad removal of `LexigoPremiumApp`.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.github/workflows/issue-70-phrases-runtime-patch.yml` — temporary only; prohibited from final diff
- `.github/workflows/issue-70-phrases-runtime-patch-v2.yml` — temporary only; prohibited from final diff
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/phrases-route-island-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`

## Prohibited paths

- `frontend/app/*.css`
- `frontend/e2e/**/*-snapshots/**`
- `frontend/bundle-budgets.json`
- backend, API, migrations, deployment and permanent workflow files
- any route island or shared lesson-domain implementation outside the two declared frontend component/test files

## Runtime owners

- `frontend/components/lexigo-bootstrapped-app.tsx` remains the canonical route selector.
- `frontend/components/lexigo-phrases-app.tsx` remains the sole `/phrases` and `/phrases/[slug]` owner.
- `frontend/components/lexigo-premium-app.tsx` remains the compatibility fallback for guest authentication, account recovery and other unextracted states only.
- `LexigoPremiumApp` continues to own shared phrase lesson-domain behavior used by its remaining Learn/lesson fallback states.

## Documentation owners

- `frontend/docs/compatibility-cleanup.md` owns the exact deletion manifest and remaining cleanup boundary.
- `.agents/current/*` owns current task scope, execution evidence and handoff state.

## Invariants

- Guest and authenticated direct Phrases entry resolve to `LexigoPhrasesApp` before `LexigoPremiumApp`.
- `DEFAULT_PHRASE_CATALOG` remains available to enrich live phrase lesson payloads in `toLearningItem`.
- `LessonSource` continues to accept `"phrases"`; the Lesson Composer option remains.
- Mixed lessons, phrase `slug`/`cloze`/answer conversion, cloze review and answer suggestions remain unchanged.
- No CSS selector or stylesheet is changed in this slice.
- Authoritative Linux visual hashes remain unchanged.
- Existing route bundle ceilings are not raised.
- Temporary automation is absent from the final diff and the final head is not bot-authored.

## Acceptance criteria

- Every route-only marker listed in the deletion manifest is absent from `LexigoPremiumApp`.
- Canonical Phrases reachability and ownership contracts remain green.
- Shared phrase lesson-domain markers remain present and executable.
- TypeScript/lint identify no stale imports, types or unreachable route helpers.
- The source file has a measured line/byte reduction with no generated or formatting-only churn.
- Full browser, accessibility, visual, performance, container and backend CI passes on one immutable developer-authored head.
- PR is squash-merged with expected head and exact merge SHA passes stage/public validation.

## Required checks

- Agent Harness validation.
- Frontend lint, TypeScript, unit/source contracts, production build and dependency audit.
- Direct `/phrases` and `/phrases/[slug]` guest/auth entry, reload, new tab and Back/Forward.
- Phrases search/filter/sort/pagination and Learn handoff.
- Phrase-containing lesson, cloze review and answer suggestion regression.
- Desktop Chromium/WebKit and Android/iOS browser projects.
- Keyboard, axe, reduced motion, forced colors, 200% reflow and CSP.
- Authoritative Linux visual regression without baseline updates.
- Controlled route bundle comparison and existing permanent budgets.
- Backend/integration/container full CI, review audit, expected-head merge and exact-SHA stage/public validation.

## Risks

- `DEFAULT_PHRASE_CATALOG` appears in both route-only and shared lesson conversion paths; deleting it would break phrase slug/cloze enrichment.
- Removing a route-only state incompletely can leave a stale effect/import or hidden bundle branch.
- A temporary workflow can accidentally persist or leave a bot-authored final head; final compare must explicitly reject both conditions.
- Raw History transitions may briefly retain the old compatibility component until the App Router selects the canonical island; browser tests must prove no observable regression.

## Rollback

Revert the atomic squash merge. No migration, API or persisted-data rollback is required.
