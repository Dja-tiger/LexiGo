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
- focused keyboard, browser-zoom, adaptive composer and visual acceptance suites

Files inspected/changed:

- `.agents/current/TASK.md`, `PROGRESS.md`, `EXECUTION.md`
- `api/openapi.yaml`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_composer.go`
- focused backend lesson-size/composer tests
- `frontend/lib/learning.ts`
- `frontend/components/lexigo-learn-app.tsx`
- `frontend/components/lexigo-active-lesson-app.tsx`
- `frontend/app/adaptive-lesson-composer.css`
- focused frontend source/E2E/accessibility/browser-zoom/visual tests
- Stage 3 Home owner was inspected but not modified

Actions performed:

- Rechecked live GitHub before write and continued the existing Stage 4 PR #666 rather than opening another task/PR.
- Replaced manual `/learn` `60` preset with `50`, added explicit `Все`, and changed the default from 30 to 15.
- Extended backend request validation and OpenAPI to exact new write vocabulary `15 / 30 / 50 / all`; unsupported values including `60` return `invalid_lesson_size`.
- Added explicit `all` → no-cap composer mapping and deterministic proof that a 55-item candidate set is not silently capped at 50.
- Added HTTP-boundary validation regression shared by Preview and Create.
- Preserved Stage 3 automatic Home `lessonSize: "15"` ownership and added a source guard that Home never sends `all`.
- Preserved historical `60` in the shared frontend read type after diagnostic CI proved that already-created Active Lesson/compatibility payloads still require it.
- Updated dedicated Active Lesson parser so new `50` and `all` sessions retain exact size semantics while old `60` remains readable.
- Added exact preview/create payload E2E for `15`, `30`, `50`, `all` and updated keyboard roving-radio coverage for four choices.
- Reconciled stale `/learn` browser-owned zoom default assertions from 30 to 15.
- Repaired both responsive `.lx-size-control` grids from three columns to four after Linux visual evidence proved the fourth option was orphaned on its own row.
- Audited final OpenAPI changes and removed unrelated accidental text drift.

Visual acceptance and reconciliation:

- CI #4064 / run `32647075755` was treated as diagnostic evidence, not a baseline source: its screenshots showed `15 / 30 / 50` on the first row and `Все` alone on a second row, with a deterministic +56 px tablet/desktop height regression.
- Runtime CSS was corrected before any fingerprint refresh.
- Exact Linux CI #4069 / run `32648333357` on head `c4d52f51f944ba0d29c52e0707425ed2473e0267` proved the relevant `/learn` geometry returned to reviewed dimensions after the CSS repair.
- The Visual Regression artifact supplied exactly 15 intentional `/learn` fingerprints across route-tablet, route-transition, visual-regression, Issue #603 browser-zoom and route-browser-zoom owners.
- UI shard 2 artifact `frontend-playwright-report-ui-2` proved two additional deterministic `/learn` fingerprints in Issue #583 changed while dimensions remained exactly `430×1575`: light `b735c5e48f5aaa4a364d7a7b16b48ef168088b4f4ebc904298dba3aa0b5ba2cf`, dark `737339c0b6395780f25516be3320c3dd478ef9c49718a87010725f071e838825`.
- Direct source inspection rejected a guessed Issue #603 3→4 assertion because it did not exist; the file already required `96px 96px 96px 96px`. Only the real `learn-browser-zoom.spec.ts` `toHaveLength(3)` assertion was changed to 4.
- `.agents/current/TASK.md` was updated before mutation to authorize exactly 17 reviewed hash/provenance replacements plus that single assertion.
- One-shot helper run `32669295151` succeeded with exact-anchor counts and a seven-file path allowlist, producing test-only commit `a4cc0a8d102e22ff4e2ec3f26b197dd7c3240ab8`.
- The temporary workflow was immediately removed by `202c4d01e5cb0d11bc29dac7873d8622073e6cf3`; subsequent PR inventory contained zero `.github/workflows/**` diff.

Final immutable-head recovery:

- CI #4078 / run `32669383712` executed on immutable branch head `3dd4ea9e6653eb94599e1669f3757e60570d5f46`.
- Both UI shards, Lesson completion, backend unit/integration, frontend lint/type/unit/build, performance/security/accessibility, iOS PWA, Dictionary smoke and Controlled Service Worker gates passed.
- Its sole failure was `frontend/e2e/issue-603-browser-zoom-reflow.spec.ts` dark `/learn` at exact `720×995`: branch expected `b07510edb2246d3effceb174593b8ed66d619bb873a23e957f090e77ba003d4b`, while initial and retry actuals were both `b07510edb2246d3effceb174593b8ed66d619bb873a23e957f090e77ba003d4f`.
- Because only one final SHA-256 nibble differed, no baseline mutation was made from #4078 itself. The primary #4069 Playwright artifact `frontend-playwright-report-visual` was downloaded and inspected directly.
- Artifact `9495610938`, digest `sha256:d6d345b7368a9a9e7610ed7419b1aaf1e2c18d37487a484a769f36c3ac07a015`, is tied to #4069 head `c4d52f51f944ba0d29c52e0707425ed2473e0267`; its Issue #603 dark error context records the original exact actual hash ending `...003d4f` at `720×995`.
- That primary evidence proved a one-nibble transcription error had been introduced while copying the #4069 reviewed hash; there was no runtime or geometry drift.
- `.agents/current/TASK.md` was updated before correction to authorize only the exact `...003d4b → ...003d4f` mutation with unchanged dimensions and provenance.
- One-shot helper run `32670105012` then succeeded fail-closed and produced only `frontend/e2e/issue-603-browser-zoom-reflow.spec.ts` commit `075477711725263195454569092a278317e238e2`.
- The helper was immediately deleted by `afe25aaa91c3aeaf73a149076a8417dd468139e8`; CI #4080 on the helper-containing intermediate head is diagnostic only and cannot serve as merge evidence.
- The branch must now remain frozen after this final Agent Harness write and receive a complete fresh immutable-head CI.

Large-file exact-rewrite procedure:

- The connected GitHub Contents action replaces complete UTF-8 files and provides no safe inline patch operation for very large files.
- Following repository precedent, `.agents/current/TASK.md` explicitly authorized every temporary exact-anchor helper use before mutation.
- Helpers were fail-closed on expected parent, exact anchor count and exact changed-path allowlists.
- All temporary helpers were deleted before eligible final candidates; final acceptance requires zero `.github/workflows/**` diff.

CI evidence so far:

- Initial immutable run #4049 / `32646428769` exposed a real TypeScript compatibility defect: shared `LessonSize` no longer allowed historical `60` consumed by Active Lesson and compatibility code.
- Recovery separated write validation from read compatibility rather than reintroducing `60` into new manual/API choices.
- Diagnostic run #4052 / `32646629393` then passed frontend lint, type-check and unit tests before later branch writes superseded the run.
- CI #4064 diagnosed the actual four-choice layout regression; its visual deltas were not approved.
- CI #4069 is the exact post-CSS evidence source for the reviewed `/learn` fingerprints and stale test contracts.
- CI #4078 proved all final gates except the one incorrectly transcribed Issue #603 fingerprint were green and independently reproduced the primary #4069 `...003d4f` value on both attempts.
- The head produced by this final Agent Harness write is the only candidate eligible for final merge evidence; all earlier CI runs are diagnostic/superseded.

Failures and recovery:

- Local read-only clone was unavailable because the execution container could not reliably resolve `github.com`; connected GitHub reads/writes and GitHub Actions remained authoritative. Downloaded CI artifacts were inspected locally without changing repository state.
- First implementation removed `60` too broadly from the frontend union; CI caught the mismatch. Correct recovery retained it only for read compatibility while keeping new write validation strict.
- Existing adaptive and browser-zoom tests encoded the old default 30; they were reconciled to the new 15 default rather than weakening assertions.
- Self-review found the Active Lesson `50 → 30` parser defect before merge; exact downstream compatibility was added with a regression.
- Initial four-option CSS retained a three-column grid; Linux screenshots proved the resulting orphan row and prevented an incorrect baseline refresh.
- A guessed second stale three-column assertion was deliberately rejected after direct source/report inspection showed the actual UI shard 2 failures were Issue #583 fingerprints, not an Issue #603 assertion.
- An earlier helper revision failed closed on that nonexistent guessed anchor and wrote nothing; the corrected helper was authorized only after exact artifact evidence was obtained.
- Final CI #4078 exposed a one-character copied SHA mismatch; recovery used the original #4069 artifact as the authority rather than blessing #4078 output as a new baseline.

Result:

Stage 4 implementation is feature-complete at the intended boundary: manual `/learn` owns `15 / 30 / 50 / Все`, automatic Home remains 15, backend/OpenAPI own exact new write vocabulary, explicit `all` is uncapped only after validation, Active Lesson preserves both new and historical sizes, and reviewed visual geometry/fingerprints encode the corrected four-column runtime with exact primary CI provenance.

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

Treat the head produced by this write as immutable. Require complete PR CI on that exact SHA, then re-audit review/thread/final diff, mark ready, expected-head squash merge, exact-main CI and exact-SHA Stage/public validation. Only after those gates pass should a separate Agent Docs reconciliation record Stage 4 and reset `.agents/current/**`.

Reusable lesson:

When an API vocabulary changes, write-contract validation and persisted read compatibility are different ownership boundaries. Visual baselines are acceptance evidence, not a mechanism to hide geometry regressions: correct runtime first, prove stable dimensions on exact Linux CI, and if a copied content hash later differs by transcription, return to the primary artifact before changing the baseline.
