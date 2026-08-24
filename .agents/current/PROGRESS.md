# Current Task Progress

## 2026-08-24 03:02 Europe/Berlin

### Verified

- Issue #651 Stage 5 is active in Draft PR #669, branch `feat/issue-651-process-continuation`.
- Base/current `main` at task start: `c590aa185e9e73354d8ca9fc23f46aba3ce77ec7` (Stage 4 Agent Docs reconciliation).
- Live audit before starting Stage 5 found no open PRs.
- Backend `LessonSession` already persists/returns optional `sessionKind=study|review|remediation`, and `frontend/lib/account-resources.ts` already accepts it on active lesson payloads.
- The old Active Lesson local contract dropped `sessionKind` before Lesson Result, so post-result preview and normal next-lesson creation silently reverted to omitted legacy intent.
- The old due-result action created `source=mixed`, `studyMode=recall`, `lessonSize=30` without `sessionKind`, violating the delivered automatic 15-item Review boundary.
- Current PR inventory on clean code head `9fda9e2988000ca4fe5859b77caad0a5a2eb074d` contained exactly 7 intended paths and zero `.github/workflows/**` diff.

### Finding

Stage 1–4 had separated process selection and bounded initial workload, but the process intent was not durable through the completion boundary. A process-aware Study/Review/Remediation lesson could therefore become a legacy mixed continuation after the Result screen. In addition, the due-result CTA could launch a 30-item legacy review instead of one bounded 15-item Review block.

### Root cause

- `LexigoActiveLessonApp.LessonSessionResponse` omitted the already-returned `sessionKind` field.
- `buildLessonResultSnapshot` had no optional process-intent field, so result persistence could not preserve it.
- post-result `/lessons/preview` and `/lessons` create bodies used source/mode/size only.
- `startDueReviewFromResult()` hard-coded legacy size 30.
- the Result due presentation exposed the whole due count as the action rather than distinguishing the next bounded block from the total backlog.

### Changed files

- `.agents/current/TASK.md`
- `frontend/lib/lesson-result.ts`
- `frontend/lib/lesson-result.test.ts`
- `frontend/components/lexigo-active-lesson-app.tsx`
- `frontend/components/lesson-result-presentation.tsx`
- `frontend/e2e/lesson-result.spec.ts`
- `frontend/e2e/support/lesson-result-fixture.ts`

Runtime/test changes:

- Added optional `LessonResultSessionKind = study | review | remediation` to Lesson Result snapshots/build input while keeping `LESSON_RESULT_VERSION = 2` and accepting historical version-2 snapshots that omit it.
- Active Lesson now preserves an explicit backend `sessionKind` into the result snapshot, post-result preview and normal next-block create; omitted legacy/manual intent remains omitted.
- Due continuation now creates exactly `sessionKind: "review"`, `lessonSize: "15"`, `studyMode: "recall"`.
- Due Result copy uses `min(15, dueCount)` for the next action. For backlog >15 it shows `Повторить 15 из M` and explicitly states that the remaining backlog stays queued.
- E2E fixture records exact preview/create request bodies and models an already-restored active lesson as making the first subsequent create a continuation.
- Lesson Result E2E proves explicit Study intent survives preview/create and proves a 32-item due backlog launches only an explicit 15-item Review block.

### Checks passed

- One-shot exact rewrite helper run `32674628290`: success; 28/28 exact anchors and bounded changed-path allowlist; produced runtime/test commit `f4c5fe5297bc37043141dd38d0275bc67bdb9c9f`; helper immediately deleted.
- Self-review then found a fixture-only defect: for `resumeWithReviewedItem=true`, the first post-result create was incorrectly modeled as the first lesson rather than continuation.
- Fixture repair helper run `32674748391`: success on the single authorized fixture path; produced commit `588c35256e3ecc473434a0c07ceda8c641c10ad4`; helper immediately deleted.
- Clean diagnostic code head after helper deletion: `9fda9e2988000ca4fe5859b77caad0a5a2eb074d`; zero workflow diff.
- Full diagnostic CI #4099 / run `32674779619` on exact `9fda9e2988000ca4fe5859b77caad0a5a2eb074d`: **success**.
- #4099 passed backend unit/security/integration, frontend lint/type/unit/build/audit, Lesson completion, both UI shards, Visual Regression, accessibility, content security, performance, iOS PWA, Controlled Service Worker, Dictionary smoke, frontend aggregate and API/web container builds. PR-only Caddy publish was expectedly skipped.
- Stage 5 owned Lesson completion tests passed exact process-preserving preview/create bodies and bounded `review + 15` continuation.
- Visual Regression passed without any baseline refresh.

### Checks failed

- No product/test failures remain on the clean diagnostic code head.
- One rejected GitHub Contents call targeted nonexistent branch `__invalid__` before the real branch was created; GitHub returned 404 and wrote nothing. Repository state was rechecked before continuing.

### Current branch head

This Progress write changes the branch head. Resolve the exact live head again after the subsequent Execution write; only that final harness head is eligible for merge evidence.

### Next action

Write final Stage 5 execution evidence, freeze the resulting head, verify zero workflow drift and `behind_by=0`, then require a fresh complete immutable-head PR CI. Only after that exact run is fully green: review/thread/diff audit, mark #669 Ready, expected-head squash merge, exact-main CI, exact-SHA Stage/public validation, then a separate Agent Docs reconciliation PR.
