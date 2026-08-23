# Current Task

## Identity

- Issue: #651
- Branch: `feat/issue-651-result-review-continuation`
- Base SHA: `c590aa185e9e73354d8ca9fc23f46aba3ce77ec7`
- Head SHA: resolve from live branch ref
- PR: Draft until immutable-head full CI is green

## Objective

Deliver the next atomic Issue #651 slice by fixing the post-lesson Result continuation when server progress reports a due backlog. The Result screen must offer one bounded Review block, expose the total backlog separately, and create an explicit `sessionKind=review` lesson instead of falling back to the legacy mixed 30-item continuation.

## Scope

- Keep server `progress.dueNow` as the authoritative total due backlog shown after lesson completion.
- Bound the immediate Result Review continuation to at most 15 items.
- When due backlog exceeds 15, phrase the CTA as `Повторить 15 из M` and keep the full backlog visible separately.
- When due backlog is 1..15, retain a truthful `Повторить M элементов` CTA while still sending `lessonSize: "15"`; the backend Review selector may return fewer than the limit.
- Make the Result Review create request explicitly send `sessionKind: "review"`, `studyMode: "recall"`, `source: "mixed"`, `lessonSize: "15"`.
- Keep the secondary Result action as an explicit exit to Home / finish-for-now path.
- Add focused unit/E2E evidence for bounded continuation and exact create payload.

## Non-goals

- Do not change Study/Review/Remediation selector rules or scheduler formulas.
- Do not change Home recommendation priority or Home process cards.
- Do not change manual `/learn` choices delivered in Stage 4.
- Do not redesign Lesson Result globally or refresh unrelated visual baselines.
- Do not add scheduler migration/ADR work in this slice.
- Do not change due-count calculation; `progress.dueNow` remains server-owned.

## Allowed paths

- `.agents/current/**`
- `frontend/lib/lesson-result.ts`
- `frontend/lib/lesson-result.test.ts`
- `frontend/components/lesson-result-presentation.tsx`
- `frontend/components/lexigo-active-lesson-app.tsx`
- `frontend/e2e/support/lesson-result-fixture.ts`
- `frontend/e2e/lesson-result.spec.ts`
- `.github/workflows/temporary-issue-651-stage5-exact-rewrite.yml` only as a one-shot exact-anchor/path-guarded helper required by the connected Contents API; it must be deleted before final candidate CI and leave zero workflow diff

## Prohibited paths

- backend runtime/selectors/scheduler
- API/OpenAPI schemas
- database migrations
- Home runtime/copy
- `/learn` manual composer runtime
- dependencies and persistent workflows
- unrelated route styles or visual fingerprints

## Runtime owners

- `resolveLessonResultContinuation` owns the bounded count derived from server `dueNow`.
- `LessonResultPresentation` owns truthful backlog-vs-current-block copy.
- `LexigoActiveLessonApp` owns the Result action create payload and must explicitly request the Review process.
- Backend Stage 2 Review selection remains authoritative for which due items are actually returned.

## Documentation owners

- `.agents/current/**` owns execution evidence for this Stage 5 slice.

## Invariants

- Review continuation never requests scheduled-not-due candidates through a legacy omitted-session-kind path.
- Result Review block limit is exactly 15; a larger due backlog is never converted into one required lesson.
- `progress.dueNow` is not locally recomputed or decremented speculatively.
- Existing manual next-lesson continuation keeps its legacy/explicit semantics unchanged.
- Result-action telemetry remains non-blocking and retains `due_review` vocabulary.
- Existing lesson-result persistence/history/accessibility behavior remains intact.

## Acceptance criteria

- `dueNow=47` resolves to a Review continuation with total backlog 47 and current block 15.
- Result shows the total due backlog and a primary CTA `Повторить 15 из 47` instead of `Повторить 47`.
- Clicking that CTA sends one create request with `source:"mixed"`, `studyMode:"recall"`, `sessionKind:"review"`, `lessonSize:"15"`.
- `dueNow=6` remains truthful as a six-item available backlog while the request limit remains 15.
- Result telemetry still records recommended/selected action `due_review`.
- Focused unit/E2E tests and full immutable-head CI are green.
- Final PR inventory contains zero `.github/workflows/**` diff.

## Required checks

- focused `frontend/lib/lesson-result.test.ts`
- focused Playwright `frontend/e2e/lesson-result.spec.ts`
- frontend lint/type/unit/build through immutable-head CI
- full browser/visual/accessibility matrix because Result runtime changes
- review/comments/threads audit
- expected-head squash merge
- exact-main CI and exact-SHA Stage/public validation

## Risks

- Passing 15 as a limit when fewer items are due is correct only because the backend Review selector is already the authoritative no-fill boundary; focused request tests must not assert synthetic padding.
- A Result copy change must not imply that all M items are part of the current lesson.
- The generic manual `startNextLessonFromResult` must not accidentally acquire `sessionKind=review`.

## Rollback

Revert the Stage 5 squash merge. Stage 4 manual sizing remains intact, but Result due continuation would return to the legacy mixed 30-item behavior and should therefore be treated as a regression rather than a desired fallback.
