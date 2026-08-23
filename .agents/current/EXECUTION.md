# Current Task Execution

## Task

- Issue: #651 — Stage 4 bounded manual lesson workload
- Branch: `feat/issue-651-bounded-manual-workload`
- Base SHA: `5196a4b2824820bb3c5105d03112929d9a495da1`
- Head SHA: resolve from live branch ref after this final harness write
- PR: #666 (Draft)

## Skills used

### GitHub live repository workflow and production-safe Agent Harness

Purpose:

Deliver one bounded Issue #651 runtime slice that makes manual `/learn` workload explicit and safe without changing the already-delivered Study/Review/Remediation queue semantics.

Instruction source:

`AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, `.agents/current/**`, `docs/agent-harness.md`, Issue #651 and live PR/CI state.

Version or verification date:

2026-08-23 Europe/Berlin.

Inputs:

- exact `main` `5196a4b2824820bb3c5105d03112929d9a495da1`
- delivered #651 Stages 1–3 and Stage 3 reconciliation
- `/learn` manual composer
- backend lesson preview/create validation and composer limit logic
- OpenAPI lesson request schemas
- Active Lesson read boundary
- focused keyboard, browser-zoom and adaptive composer acceptance suites

Files inspected/changed:

- `.agents/current/TASK.md`, `PROGRESS.md`, `EXECUTION.md`
- `api/openapi.yaml`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_composer.go`
- focused backend lesson-size/composer tests
- `frontend/lib/learning.ts`
- `frontend/components/lexigo-learn-app.tsx`
- `frontend/components/lexigo-active-lesson-app.tsx`
- focused frontend source/E2E/accessibility/browser-zoom tests
- Stage 3 Home owner was inspected but not modified

Actions performed:

- Rechecked live GitHub before write; no open PR existed and Stage 3 reconciliation was already in `main`.
- Reused the already-existing Stage 4 branch instead of creating a duplicate branch/PR.
- Opened Draft PR #666 only after auditing the existing branch scope.
- Replaced manual `/learn` `60` preset with `50`, added explicit `Все`, and changed the default from 30 to 15.
- Extended backend request validation and OpenAPI to exact new write vocabulary `15 / 30 / 50 / all`; unsupported values including `60` return `invalid_lesson_size`.
- Added explicit `all` → no-cap composer mapping and deterministic proof that a 55-item candidate set is not silently capped at 50.
- Added HTTP-boundary validation regression shared by Preview and Create.
- Preserved Stage 3 automatic Home `lessonSize: "15"` ownership and added a source guard that Home never sends `all`.
- Preserved historical `60` in the shared frontend read type after diagnostic CI proved that already-created Active Lesson/compatibility payloads still require it.
- Updated dedicated Active Lesson parser so new `50` and `all` sessions retain exact size semantics while old `60` remains readable.
- Added exact preview/create payload E2E for `15`, `30`, `50`, `all` and updated keyboard roving-radio coverage for four choices.
- Reconciled stale `/learn` browser-owned zoom default assertions from 30 to 15.
- Audited final OpenAPI changes and removed one unrelated accidental text drift.

Large-file exact-rewrite procedure:

- The connected GitHub Contents action replaces complete UTF-8 files and provides no safe inline patch operation for very large files.
- Following the repository precedent used in PR #492, `.agents/current/TASK.md` explicitly authorized a temporary exact-anchor helper before each use.
- First one-shot helper changed only `api/openapi.yaml` and `frontend/e2e/learn-browser-zoom.spec.ts`; exact anchor counts and changed paths were fail-closed. It corrected the two intended large-file contracts and removed unrelated OpenAPI drift, then was deleted.
- Acceptance audit later proved `frontend/components/lexigo-active-lesson-app.tsx` was a required downstream consumer because its parser silently changed valid new `50` sessions to `30`.
- A second explicitly authorized one-shot helper changed only that exact parser line, then was deleted.
- Final compare after helper deletion contains zero `.github/workflows/**` diff.

CI evidence so far:

- Initial immutable run #4049 / `32646428769` exposed a real TypeScript compatibility defect: shared `LessonSize` no longer allowed historical `60` consumed by Active Lesson and compatibility code.
- Recovery separated write validation from read compatibility rather than reintroducing `60` into new manual/API choices.
- Diagnostic run #4052 / `32646629393` then passed frontend lint, type-check and unit tests before later branch writes superseded the run.
- Runs #4056/#4057 were intentionally superseded by acceptance-gap fixes and are not final delivery evidence.
- The head produced by this final Agent Harness write must receive a fresh complete immutable-head CI; no older run is eligible for merge evidence.

Failures and recovery:

- Local read-only clone was unavailable because the execution container cannot resolve `github.com`; connected GitHub reads/writes and GitHub Actions remain authoritative.
- First implementation removed `60` too broadly from the frontend union; CI caught the mismatch. Correct recovery retained it only for read compatibility while keeping new write validation strict.
- Existing adaptive and browser-zoom tests encoded the old default 30; they were reconciled to the new 15 default rather than weakening assertions.
- One Contents update returned HTTP 409 because the supplied blob SHA had a transcription error. The file was re-read, the current SHA was used and the bounded update succeeded; failed mutation changed nothing.
- Self-review found the Active Lesson `50 → 30` parser defect before merge; exact downstream compatibility was added with a regression.

Result:

Stage 4 implementation is feature-complete at the intended boundary: manual `/learn` owns `15 / 30 / 50 / Все`, automatic Home remains 15, backend/OpenAPI own exact new write vocabulary, explicit `all` is uncapped only after validation, and Active Lesson preserves both new and historical sizes.

Limitations / non-goals preserved:

- no scheduler formula/ranking change
- no Study/Review/Remediation selector change
- no due/remediation eligibility change
- no Home recommendation-priority change
- no database migration
- no `wordIds` limit change
- no OpenPencil production design change
- no dependency or persistent workflow change

Next action:

Treat the head produced by this write as immutable. Require complete PR CI, then review/thread/diff audit, mark ready, expected-head squash merge, exact-main CI and exact-SHA Stage/public validation. Only after those gates pass should a separate Agent Docs reconciliation record Stage 4 and reset `.agents/current/**`.

Reusable lesson:

When an API vocabulary changes, write-contract validation and persisted read compatibility are different ownership boundaries. Removing a legacy value from new writes does not justify making historical persisted sessions unreadable, and every newly writable value must be traced through downstream route parsers before acceptance.
