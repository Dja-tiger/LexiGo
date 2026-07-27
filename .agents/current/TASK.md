# Current Task

## Identity

- Issue: #241 — `fix(ci): make previous-week integration fixture calendar-boundary safe`
- Blocked PR: #240 — post-merge repository-memory reconciliation
- Branch: `fix/issue-241-week-boundary`
- Base SHA: `370d0dccfaa9c273d11164bbce37dd71975485cd`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Objective

Make the previous-week integration fixture independent of the weekday on which CI runs, without changing production weekly aggregation semantics.

## Scope

- Replace the relative `now() - interval '8 days'` fixture timestamp with a value guaranteed to be inside the immediately previous UTC week used by `timezoneOffsetMinutes=0`.
- Add a mandatory repository lesson for calendar-boundary-safe time fixtures.
- Update current agent execution memory for the blocker slice.
- Run the full immutable-head repository CI before merge.

## Non-goals

- No production learning, progress, scheduler or timezone behavior changes.
- No API, database schema, migration, dependency or workflow changes.
- No changes to PR #240 reconciliation content until this blocker is merged.
- No broad integration-test cleanup.

## Allowed paths

- `backend/integration/review_modes_test.go`
- `.agents/AGENTS.md`
- `.agents/AGENTS.issue-241-calendar-boundaries.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `backend/internal/**`
- `api/**`
- migrations
- `.github/workflows/**`
- frontend runtime or tests
- `.agents/PROJECT_STATE.md`
- unrelated fixtures

## Runtime owners

- `learning.Repository.Progress` remains unchanged and authoritative for UTC/local weekly boundaries.
- PostgreSQL `review_events.reviewed_at` remains the evidence timestamp.
- `TestLearningReviewModesAndAnalytics` owns only deterministic fixture placement and assertions.

## Documentation owners

- `.agents/AGENTS.issue-241-calendar-boundaries.md` owns the reusable prevention rule.
- `.agents/AGENTS.md` includes that rule in mandatory reading.
- `.agents/current/**` records the active blocker slice.

## Invariants

- For `timezoneOffsetMinutes=0`, previous-week evidence is within `[current Monday 00:00 UTC - 7d, current Monday 00:00 UTC)`.
- The fixture must pass on every weekday, including Monday and week/year boundaries.
- Current-week and retained-learning evidence counts remain unchanged.
- Production code and public contracts remain byte-for-byte unchanged.

## Acceptance criteria

- The previous Recall fixture uses a calendar-boundary-derived timestamp in the immediately previous UTC week.
- The test no longer depends on the current weekday.
- Existing expected weekly evidence remains one previous Recall attempt, one success and 100% rate.
- The failure category and prevention rule are documented as mandatory guidance.
- Full final-head CI passes with no unresolved review threads.

## Required checks

- source read-back and exact diff audit
- targeted `TestLearningReviewModesAndAnalytics` integration test
- backend unit/security and integration gates
- full repository CI
- clean review comments/reviews/unresolved threads
- expected-head squash merge
- post-merge `main` validation

## Risks

- A timestamp near a boundary could accidentally enter the current or penultimate week.
- A fixture tied to server local timezone could diverge from the API request's offset.
- Mixing the fix into PR #240 would violate its documentation-only scope.

## Rollback

Revert the test/documentation squash commit. No production data or runtime behavior is affected.
