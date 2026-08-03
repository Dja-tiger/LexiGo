# Current Task Progress

## 2026-08-03 — reconstructed PR #354

### Verified live state

- Live `main` is `3a6bf7686a2563c2828b9293b9ac381397274710`.
- PR #355 is delivered and reconciled; deployed product SHA remains `f279bc577704f3f68bf587f4c88b474a62929c02`.
- Exact-SHA stage run `30773148243` is green.
- PR #354 remained Draft from obsolete base `df3cd097cbd159a4d441aea4ce783043dabe36ec` and was non-mergeable because task records diverged.
- Its old head `9916d95b7d6584a05da91393adfaa7743d37d0f4` passed CI #2557 / run `30772233239`, but that result is not authoritative after the base changed.

### Reconstruction

- Force-reset only the PR #354 head branch to exact reconciled `main` `3a6bf7686a2563c2828b9293b9ac381397274710`.
- Reapplied the bounded `compatibility-fallback-source.test.ts` change.
- Rewrote `.agents/current/**` for the new base and preserved PR #355 delivery evidence through repository memory.
- No production runtime, CSS, snapshot, budget, workflow, dependency, backend/API, README or architecture file changed.

### Source-contract changes

- Render-order assertions now cover all nine dedicated route-island components:
  - Scenario Catalog;
  - Scenario Detail;
  - Home;
  - Learn;
  - Active Lesson;
  - Dictionary/Word Detail;
  - Phrases;
  - Progress;
  - authenticated Profile.
- Added fail-closed assertions for all nine island predicates.
- Preserved exact premium presentation dispatch for Library, Profile and Lesson.
- Added explicit guest Profile protection through `initialSession !== null` on the canonical Profile island.
- Protected shared Review Outbox, email confirmation and account panels outside route-island selection.
- Retained canonical Learn CSS consumer evidence.

### Scope evidence

Allowed paths only:

- `frontend/components/compatibility-fallback-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Validation state

- The source-contract content was read from the prior green proof head before reconstruction.
- The new branch is based on exact reconciled `main`.
- Pre-rebase CI is historical evidence only.
- A new final immutable head and complete authoritative CI are required.

### Next action

Write the execution record, compare the reconstructed branch against exact base, verify the four-path allow-list, treat the resulting head as the final developer-authored candidate and monitor only the latest full CI run.
