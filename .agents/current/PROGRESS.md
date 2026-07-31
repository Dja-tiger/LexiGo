# Current Task Progress

## 2026-07-31 03:42 Europe/Moscow

### Verified

- PR #317 lightweight CI #2433/run `30592660514` passed and PR was expected-head squash-merged as `1f55d5f9c38fc191c1b213930e1379da360c20dc`.
- Issue #70 remains open.
- PR #316 already proved canonical Learn precedence and bounded `renderLearn` as the next deletion candidate.
- Exact source audit confirmed `renderLearn` is a presentation-only block; `startLesson`, authentication, Library, Profile and Lesson remain shared/live.

### Finding

The safe atomic runtime slice is limited to deleting `renderLearn`, removing its exact dispatch branch and converting candidate-presence assertions to absence/preservation assertions.

### Root cause

The canonical Learn route island replaced the presentation, but the legacy compatibility rendering block remained in `LexigoPremiumApp`.

### Changed files

- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/learn-route-island-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Live main/Issue/stage reconciliation.
- Exact bootstrap and compatibility source audit.
- Bounded one-shot patch verification: only runtime and source-contract paths changed.
- Temporary workflow removed from the branch.
- Read-back confirms the source contract now rejects `renderLearn` and its dispatch while preserving shared owners.

### Checks failed

- No product check failure yet.
- Direct local clone was unavailable because the execution container had no DNS access; a temporary path-guarded one-shot workflow was used and removed before final CI.

### Current branch head

Resolve from live branch ref.

### Next action

Complete execution memory, compare branch against main, open Draft PR and run authoritative full CI.
