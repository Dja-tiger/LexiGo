# Current Task Progress

## 2026-08-13 Europe/Moscow

### Verified

- Parent Issue #25 remains open and large/XL; reliable base speech playback was already delivered by closed Issue #51, so duplicating playback work is out of scope.
- Created child Issue #481 for the first atomic #25 phase: persist `listening` as a distinct objective review mode.
- Current repository `main` is `2b91949f42db36899a79bf2329b104f368127b14` after the Agent-Docs reconciliation merge.
- Latest deployed product image remains `1f5b152d6f904ff57f56f434c917a44f1923c6f1`; docs-only `main` advancement did not deploy because the Stage deploy job was correctly skipped after scope validation.
- Created branch `feat/issue-481-listening-event-mode` from exact repository `main` SHA `2b91949f42db36899a79bf2329b104f368127b14`.
- Parallel open PRs are Dependabot maintenance and do not overlap the learning/OpenAPI/migration paths selected for #481.
- Current backend `AnswerMode` is `study|recall|choice`; `study` is non-objective, while `recall` and `choice` share the existing `ScheduleReview` objective path.
- Current DB constraints permit only `study|recall|choice` for v2 `review_events.answer_mode` and `lesson_sessions.study_mode`.
- Current progress aggregates objective-today evidence from `recall|choice` and expose per-mode `study`, `recall`, `choice`, `legacy` buckets.
- Existing OpenAPI-structure rule requires validating the complete YAML document after every OpenAPI write.

### Finding

A future listening-first exercise cannot currently be persisted honestly: using `recall` would mix audio comprehension with typed recall, while inventing an unpersisted UI-only mode would break API/DB mode matching. The safe foundation is a first-class `listening` mode across the existing review contract before any listening UI is introduced.

### Root cause

The learning event schema was intentionally created before listening exercises and its allowed-mode vocabulary is closed over three modes. Playback was fixed later by #51, but event semantics were not extended because no listening exercise existed yet.

### Changed files

- `.agents/current/TASK.md` — active #481 contract.
- `.agents/current/PROGRESS.md` — this verified pre-flight state.
- `.agents/current/EXECUTION.md` — execution provenance for the active slice.

### Checks passed

- Live Issue/PR/main/deployment state verified before branch creation.
- #51 playback ownership and release checklist inspected; no duplicate playback implementation required.
- `learning.AnswerMode`, HTTP normalization/validation, lesson mode validation, scheduler dispatch, DB constraints and progress aggregation owners inspected.
- OpenAPI whole-document validation lesson re-read.

### Checks failed

- None yet. No product code has been written on #481 before this task-memory initialization.

### Current branch head

Resolve after the atomic `.agents/current/**` initialization commit.

### Next action

Commit the three current task-memory files atomically, read them back, then inspect focused tests/OpenAPI enum locations and implement the minimal listening-mode persistence contract without UI or scheduler-formula changes.