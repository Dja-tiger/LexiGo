# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-active-lesson-css-boundary`
- Base SHA: `5251485f9d780efabd3bd2379f887852fd8fd71b`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Create an executable proof for the isolated `system-states-lesson.css` ownership boundary before any consolidation or deletion. Establish exact consumers, import order, forced-colors ownership and stop conditions for a later implementation slice.

## Scope

- Prove `active-lesson.css` is imported before `system-states-lesson.css`.
- Prove queued-review markup is owned by `active-lesson-presentation.tsx`.
- Prove the compatibility stylesheet is bounded to queued Active Lesson presentation.
- Preserve all runtime and visual behavior.

## Non-goals

- No stylesheet move, deletion or selector change.
- No runtime, presentation, API, History, storage or lesson-domain change.
- No visual baseline or bundle-budget change.
- No workflow or deployment change.

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

- `frontend/components/lexigo-active-lesson-app.tsx` remains the Active Lesson route runtime owner.
- `frontend/components/active-lesson-presentation.tsx` remains the queued-review markup owner.
- `frontend/app/active-lesson.css` remains the canonical Active Lesson stylesheet.
- `frontend/app/system-states-lesson.css` remains the current post-import queued-review compatibility owner until a separate implementation slice proves safe consolidation.

## Documentation owners

- `.agents/current/*` records this proof slice.
- `frontend/docs/compatibility-cleanup.md` remains the durable Issue #70 plan and is unchanged in this proof-only slice.

## Invariants

- Exact selector text and declarations remain unchanged.
- `system-states-lesson.css` remains imported after `active-lesson.css`.
- Forced-colors Canvas/Highlight behavior remains owned and unchanged.
- No production file changes.

## Acceptance criteria

- Source contract proves exact import presence and order.
- Source contract proves the queued-review consumer boundary.
- Source contract proves the stylesheet contains queued state and forced-colors ownership without unrelated route families.
- Final diff contains only the four allowed paths.
- Required CI passes on an immutable developer-authored head.

## Required checks

- Agent Harness and change-scope classification.
- Frontend lint, TypeScript, unit/source tests and production build.
- Full required CI according to repository classifier.
- Review/comments/threads audit and expected-head squash merge.

## Risks

- Repository-wide code search may miss dynamically constructed class names; the contract therefore proves exact canonical markup and limits its claim to this selector family.
- This proof does not authorize deletion. A later implementation slice must preserve import-order effects and browser/visual evidence.

## Rollback

Revert the proof-only squash merge. No runtime or deployment rollback is required.
