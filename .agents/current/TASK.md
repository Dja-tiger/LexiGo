# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-dictionary-detail-orphan-proof`
- Base SHA: `99668994916e1587a0855c801c10915c6419f59e`
- PR: #336

## Objective

Add executable source evidence that the legacy `.lx-dictionary-detail*` CSS family remaining in `frontend/app/dictionary-catalog.css` has no production TypeScript/TSX consumer before any deletion is attempted.

## Scope

- Recursively inspect executable `app`, `components` and `lib` TypeScript/TSX sources.
- Exclude test/spec files and strip comments before matching the legacy class prefix.
- Require zero executable consumers of `lx-dictionary-detail`.
- Inventory and bound the exact remaining selector family in `dictionary-catalog.css`.
- Preserve the candidate CSS unchanged for a separate deletion slice.

## Non-goals

- No CSS deletion or declaration change.
- No runtime, markup, route, API, backend, workflow, dependency, visual baseline or performance-ceiling change.
- No claim that the entire Dictionary compatibility boundary is dead.

## Allowed paths

- `frontend/components/dictionary-detail-orphan-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Runtime implementation files.
- CSS files and visual snapshots.
- Backend, migrations, permanent workflows and dependencies.

## Invariants

- `dictionary-catalog.css` remains byte-for-byte unchanged in this slice.
- Canonical Dictionary and Word Detail owners remain unchanged.
- Guest/authentication, History, lesson-domain and fallback ownership remain unchanged.
- The proof must fail if the legacy class prefix returns to executable TS/TSX markup or if the bounded selector family changes unexpectedly.

## Acceptance criteria

- The source contract passes in frontend unit tests.
- Full authoritative CI passes on the final developer-authored head.
- Final diff contains only the four allowed paths.
- Reviews, comments and unresolved threads are audited before Ready.
- Expected-head squash merge and exact-SHA stage/public validation complete before reconciliation.

## Process note

The source-contract file was created before this task record was populated. No runtime or CSS file was changed. Repository memory is being corrected in the same branch before merge.

## Rollback

Revert the source-contract and current-task documentation commits; production behavior is unchanged.
