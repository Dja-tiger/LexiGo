# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-active-lesson-css-boundary-v2`
- Base SHA: `82812d407ee117a89e3835ef7c94e3a550c531ed`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Create an executable proof for the isolated `system-states-lesson.css` ownership boundary before any consolidation or deletion. Establish exact consumers, import order and forced-colors ownership without changing runtime behavior.

## Scope

- Prove `active-lesson.css` is imported before `system-states-lesson.css`.
- Prove queued-review markup is owned by `active-lesson-presentation.tsx`.
- Prove the compatibility stylesheet is bounded to queued Active Lesson presentation.
- Preserve runtime and visual behavior.

## Non-goals

- No stylesheet move, deletion or selector change.
- No runtime, API, History, storage or lesson-domain change.
- No visual baseline, bundle-budget, workflow or deployment change.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/active-lesson-css-boundary.test.ts`

## Prohibited paths

- `.github/workflows/**`
- `frontend/app/**`
- frontend runtime and presentation sources
- visual snapshots and bundle budgets
- backend, API, migrations and deployment files

## Runtime owners

- `frontend/components/lexigo-active-lesson-app.tsx` remains the route runtime owner.
- `frontend/components/active-lesson-presentation.tsx` remains the queued-review markup owner.
- `frontend/app/active-lesson.css` remains the canonical stylesheet.
- `frontend/app/system-states-lesson.css` remains the compatibility owner until a later implementation slice.

## Documentation owners

- `.agents/current/**` records this proof slice.
- `frontend/docs/compatibility-cleanup.md` remains unchanged.

## Invariants

- Exact selectors and declarations remain unchanged.
- Import order remains unchanged.
- Forced-colors Canvas/Highlight behavior remains unchanged.
- No production file changes.

## Acceptance criteria

- Source contract proves exact import presence and order.
- Source contract proves the queued-review consumer boundary.
- Source contract proves bounded queued-state and forced-colors ownership.
- Final diff contains only the four allowed paths.
- Required CI passes on an immutable head.

## Required checks

- Change-scope classification.
- Frontend lint, TypeScript, unit/source tests, production build and dependency audit.
- Complete required CI.
- Review/comments/threads audit and expected-head squash merge.

## Risks

- Dynamically constructed class names could escape a text search; the contract therefore limits its claim to the canonical exact marker family.
- This proof does not authorize deletion.

## Rollback

Revert the proof-only squash merge. No runtime or deployment rollback is required.
