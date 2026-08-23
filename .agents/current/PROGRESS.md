# Current Task Progress

## 2026-08-23 03:20 +03:00

### Verified

- Draft PR #664 remains the only active development slice for Issue #651 and stays on `feat/issue-651-process-aware-home`.
- Base SHA recorded by the task contract: `6d8c8dbc3b25f5fd428c18cb18b151402984ec72`.
- Runtime Home sends explicit `sessionKind` for all automatic Study / Review / Remediation preview requests and lesson creation requests.
- Backend preview and create paths both use `queryLessonCandidatesForSession`, so queue ownership is not duplicated in the UI.
- Explicit Review excludes new and not-due candidates; explicit Remediation excludes new and due candidates; explicit Study contains only new candidates.
- Legacy preview/create omission remains distinct from `study`: empty `sessionKind` routes to the legacy composer and is omitted from JSON by `omitempty`.
- `api/openapi.yaml` currently documents `LessonSessionKind` on create/session but does not yet expose it on `LessonPreviewRequest` / `LessonPreview`.

### Finding

The staged runtime contract is ahead of the canonical OpenAPI preview schema. This is an in-scope acceptance gap because authenticated Home now depends on explicit preview process intent.

### Root cause

The initial Stage 3 contract update covered `LessonCreateRequest` and `LessonSession`, while the later preview rollout added `sessionKind` to Go request/response types and HTTP validation without updating the two preview OpenAPI blocks.

### Changed files

- Added preview request/response assertions to `backend/internal/learning/openapi_session_kind_contract_test.go` in commit `9599c14ead6046074ed003137b618480b9b4ee5f`.
- No global database seed, workflow, dependency, visual baseline or other prohibited path was changed.

### Checks passed

From immutable-head CI #4016 on `1a3f179e1da0b346a9ac2718ec1a012ae83feab3` before the new failing-first contract assertion:

- change-scope classification;
- backend core/unit/security groups;
- frontend core/type/build groups that completed before browser fan-out.

Current CI #4017 for `9599c14ead6046074ed003137b618480b9b4ee5f` is running.

### Checks failed

- CI #4016 browser-oriented fan-out was blocked during shared authenticated test-user cleanup by the existing `course_enrollments_user_id_fkey` relation before the relevant browser assertions executed.
- That cleanup owner is outside the exact allowed-path contract, so this PR does not modify the global seed to hide the failure.
- The new OpenAPI preview contract assertion is intentionally expected to fail until `api/openapi.yaml` is synchronized in the next in-scope change.

### Current branch head

`9599c14ead6046074ed003137b618480b9b4ee5f`

### Next action

1. Add optional `sessionKind` references to `LessonPreviewRequest` and `LessonPreview` without changing their legacy required-field sets.
2. Re-run immutable-head CI and confirm the OpenAPI parser/contract gate is green.
3. Re-check browser failures. If the same pre-test foreign-key cleanup failure remains, record it as an external fixture blocker rather than editing a prohibited global owner.
4. Keep PR #664 Draft until every in-scope runtime/CI gate is actually satisfied.
