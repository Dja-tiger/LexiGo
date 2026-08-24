# Current Task Execution

## Task

- Branch: feat/issue-651-process-analytics
- Base SHA: 4412209b771edab470223d6dd683be5fc73b05f4
- Head SHA: resolve from live branch ref
- PR: #673

## Skills used

### Agent Harness pre-flight and cross-layer API delivery

Purpose:

Deliver Issue #651 Stage 6b as one bounded process-analytics contract after Stage 6a made process attribution durable.

Instruction source:

`AGENTS.md`, `.agents/AGENTS.issue-19-completion.md`, `.agents/AGENTS.issue-132-openapi-structure.md`, `.agents/PROJECT_STATE.md`, `.agents/current/**`, `docs/agent-harness.md`.

Version or verification date:

Read from live `main` on 2026-08-24 before runtime writes.

Inputs:

Live Issue #651 acceptance; exact `main`; open-PR state; Stage 6a event-attribution schema; Progress producer/model/OpenAPI/frontend validator/normalization/tests; Review queue ownership.

Files inspected:

- `backend/internal/learning/model.go`
- `backend/internal/learning/repository.go`
- `backend/internal/learning/lesson_session_queues.go`
- `backend/internal/learning/scheduler.go`
- `backend/internal/platform/migrate/migrations/000025_learning_process_attribution.up.sql`
- `backend/integration/learning_flow_test.go`
- `backend/integration/weekly_part_of_speech_test.go`
- `frontend/lib/progress.ts`
- `frontend/lib/account-resources.ts`
- `frontend/lib/account-resources.test.ts`
- `frontend/lib/progress-evidence.test.ts`
- `frontend/components/progress-evidence-dashboard.tsx`
- `api/openapi.yaml`

Actions performed:

- Verified no open PRs and exact base SHA before branch creation.
- Confirmed the remaining analytics acceptance cannot be implemented correctly from `answer_mode` alone and Stage 6a now supplies immutable `session_kind` / `selection_reason` evidence.
- Added a required backend/OpenAPI `processes` progress object while keeping frontend read compatibility optional for rolling responses.
- Added current-week `newLearned`, `dueReviewed`, `remediationReviewed`, `lapses`, strong Review retention and current due non-new `reviewBacklog`.
- Guarded existing retained-item evidence against explicitly attributed Study recall while preserving historical NULL-attribution compatibility.
- Added frontend runtime validation and zero-attribution compatibility normalization without inventing a new visual Progress layout.
- Added an integration regression that proves Study recall cannot inflate retention, future-due items cannot inflate Review backlog, and Review/Remediation remain distinct from answer mode.
- Used temporary branch-only helper workflows to apply the bounded multi-file patch; both helper files were removed before the immutable runtime diff.

Commands or procedures:

GitHub connector reads/writes, temporary PR bootstrap, `gofmt`, `git diff --cached --check`, exact compare against immutable base, per-file PR patch review.

Artifacts produced:

- Draft PR #673
- `backend/integration/process_progress_analytics_test.go`
- additive `LearningProcessEvidence` / `ProcessRetentionEvidence` API contract
- frontend process-evidence runtime contract and compatibility normalization

Result:

Runtime diff is clean and contains no workflow, scheduler, queue, migration or visual-layout changes. Immutable-head full CI is the next gate.

Failures:

The first branch-only `push` helper did not start, so it did not apply the runtime patch.

Root cause:

The newly added branch-only workflow was not observed as a running push workflow. No product code was affected.

Fallback:

A temporary `pull_request` bootstrap executed the same bounded helper body on Draft PR #673, then removed both helper workflows. The final runtime diff contains zero `.github/workflows/**` files.

Limitations:

This slice establishes the cross-layer analytics contract and correctness evidence. It intentionally does not create a new visible Progress analytics panel without repository-owned OpenPencil evidence.

Reusable lesson:

Process analytics must aggregate immutable process attribution directly. Interaction mode is an orthogonal signal and cannot safely reconstruct Study / Review / Remediation after the event is written.
