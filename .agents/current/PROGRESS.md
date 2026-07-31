# Current Task Progress

## 2026-07-31 10:50 Europe/Moscow

### Verified

- PR #317 lightweight CI #2433/run `30592660514` passed and PR was expected-head squash-merged as `1f55d5f9c38fc191c1b213930e1379da360c20dc`.
- Issue #70 remains open.
- PR #316 proved canonical Learn precedence and bounded `renderLearn` as the next deletion candidate.
- Exact source audit confirmed `renderLearn` is presentation-only; `startLesson`, authentication, Library, Profile and Lesson remain shared/live.
- PR #318 remains Draft and mergeable.

### Finding

The safe atomic runtime slice is limited to deleting `renderLearn`, removing its exact dispatch branch and aligning all existing source contracts that incorrectly treated the retired Learn presentation as a shared owner.

### Root cause

The canonical Learn route island replaced the presentation, but the legacy compatibility rendering block and two cross-slice source assertions still encoded the previous ownership model.

### Changed files

- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/learn-route-island-source.test.ts`
- `frontend/components/home-route-island-source.test.ts`
- `frontend/app/adaptive-lesson-composer.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Live main/Issue/stage reconciliation.
- Exact bootstrap and compatibility source audit.
- Bounded runtime patch verification.
- Temporary workflow removed from the branch.
- Learn source contract rejects `renderLearn` and its dispatch while preserving shared owners.
- Home source contract treats Home and Learn presentations as retired while preserving shared fallback owners.
- CI #2437 backend integration and backend unit/security jobs passed.
- CI #2437 lint and TypeScript passed before the unit gate.

### Checks failed

- CI #2435 failed in unit tests because the Home source contract still required `renderLearn`; classified as a stale cross-slice assertion and corrected without runtime expansion.
- CI #2437 failed in `frontend/app/adaptive-lesson-composer.test.ts` because it still required `<LessonComposerProgressiveShell>` and its legacy `onStart` wiring inside `LexigoPremiumApp`; production `startLesson` API ownership remains present, so the contract was changed to preserve API evidence and reject retired presentation usage.
- Direct local clone was unavailable because the execution container had no DNS access; repository reads/writes and authoritative CI are performed through the connected GitHub app.

### Current branch head

Resolve from live branch ref after the source-contract and task-memory commits.

### Next action

Read back the updated contract, compare the final branch diff against main and run authoritative full CI on the new developer-authored head. If green, complete review audit, Ready transition, expected-head squash merge and exact-SHA stage/public validation.
