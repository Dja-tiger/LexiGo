# Current Task Progress

## 2026-08-23 17:xx Europe/Berlin

### Verified

- Live `main` before task start: `5196a4b2824820bb3c5105d03112929d9a495da1`.
- No open pull requests existed immediately before creating the Stage 4 branch.
- Issue #651 remains open.
- Stage 1 (#656), Stage 2 (#662), Stage 3 (#664) and Stage 3 reconciliation (#665) are already delivered; Stage/public runtime remains healthy on `cb0c82fced8e729672e80e8a202456366ead09d4`.
- Current `/learn` manual size options are `15 / 30 / 60`; state defaults to `30`.
- `frontend/lib/learning.ts` already has a latent `"all"` LessonSize type but uses legacy numeric `60`.
- Backend request validation currently accepts only `15 / 30 / 60`; `all` is rejected.
- `lessonSizeLimit` currently parses numeric strings with `strconv.Atoi`, so an explicit validated `all` path must be documented/tested rather than relying on accidental parse failure.
- Stage 3 automatic Home process creation already owns fixed `lessonSize: "15"` and is outside this slice.

### Finding

Issue #651 blocking/workload acceptance is still incomplete specifically at the manual `/learn` boundary: the requested bounded presets `15 / 30 / 50` and explicit user-only `All` do not match the current frontend/API contract.

### Root cause

The pre-#651 manual lesson-size vocabulary (`15 / 30 / 60`) remained unchanged while the process-aware automatic Home rollout was intentionally implemented as a separate 15-item path. Frontend retained an unused `"all"` type variant, but backend validation/OpenAPI never made it a real explicit manual action.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live open-PR preflight: zero open PRs.
- Exact-main preflight: `5196a4b2824820bb3c5105d03112929d9a495da1`.
- Source audit of `/learn`, shared LessonSize type, backend HTTP validation and lesson composer limit behavior.

### Checks failed

- Local read-only clone was unavailable because the execution container cannot resolve `github.com`; live GitHub connector remains authoritative and usable.

### Current branch head

Resolve from live branch ref after this update.

### Next action

Implement the exact request vocabulary and manual UI behavior, then update focused backend/frontend/OpenAPI tests before opening the Draft PR.
