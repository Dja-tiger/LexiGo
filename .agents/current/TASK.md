# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-final-fallback-inventory`
- Base SHA: `ec3d3f05f97a61b4600abc2d5947726d599e8618`
- PR: pending

## Objective

Add an executable source inventory for the final live `LexigoPremiumApp` compatibility boundary before any further dead-code or CSS deletion.

## Scope

- Prove dedicated Home, Learn, Progress, Phrases and Scenario owners render before the final compatibility fallback.
- Prove retired route presentations remain absent from `LexigoPremiumApp`.
- Prove the remaining dispatch is limited to Library, Profile and Lesson.
- Preserve shared authentication, recovery, lesson creation/resume and unknown-route behavior.
- Record that Learn composer CSS selectors remain consumed by `LexigoLearnApp` and are not safe deletion candidates.

## Non-goals

- No runtime deletion.
- No CSS deletion, consolidation or baseline update.
- No authentication, navigation, API, backend, dependency, workflow or bundle-ceiling change.
- No claim that Dictionary/Profile/Lesson compatibility is dead.

## Allowed paths

- `frontend/components/compatibility-fallback-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Runtime implementation files.
- CSS and visual snapshots.
- Backend, migrations, permanent workflows and dependencies.

## Invariants

- Canonical route islands remain before `LexigoPremiumApp`.
- `renderLibrary`, `renderProfile`, `renderLesson`, `startLesson`, `resumeLesson` and authentication owners remain present.
- Retired Home/Learn/Progress/Phrases presentation markers remain absent.
- Canonical Learn CSS consumers remain protected against incorrect orphan cleanup.

## Acceptance criteria

- New source contract passes and fails if a retired presentation returns or a live fallback owner disappears.
- Final diff contains only the four allow-listed paths.
- Full required CI passes on the final developer-authored head.
- Review audit, expected-head squash merge and exact-SHA stage/public validation complete before reconciliation.

## Process note

The source-test file was created before this task record was populated. No runtime or CSS file was changed. Further writes are blocked until this record, progress record and execution record are read back from the branch.

## Rollback

Revert the source contract and task-memory commits; runtime behavior is unchanged.
