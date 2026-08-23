# Current Task Execution

## Task

- Branch: `feat/issue-651-bounded-manual-workload`
- Base SHA: `5196a4b2824820bb3c5105d03112929d9a495da1`
- Head SHA: resolve from live branch ref
- PR: pending

## Skills used

### GitHub live repository preflight and bounded-source audit

Purpose:

Prove the next unmet Issue #651 boundary before changing runtime and preserve the repository rule that existing open PRs take precedence.

Instruction source:

`AGENTS.md`, `.agents/AGENTS.md`, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, `docs/agent-harness.md`, plus the live Issue #651 contract.

Version or verification date:

2026-08-23 Europe/Berlin.

Inputs:

- live `main` branch
- live open PR list
- Issue #651 body/acceptance
- current `/learn` frontend source
- shared frontend learning types
- backend lesson HTTP validation
- backend lesson composer limit handling
- OpenPencil route mapping for `/learn`

Files inspected:

- `frontend/components/lexigo-learn-app.tsx`
- `frontend/lib/learning.ts`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_composer.go`
- `docs/figma/openpencil-screen-map.json`
- `api/openapi.yaml` via repository code search for the legacy lesson-size enum
- focused frontend/backend test locations via repository code search

Actions performed:

- Rechecked live open PRs: none.
- Rechecked exact `main`: `5196a4b2824820bb3c5105d03112929d9a495da1`.
- Created `feat/issue-651-bounded-manual-workload` from that exact SHA.
- Confirmed current manual UI presets are `15 / 30 / 60`, defaulting to `30`.
- Confirmed shared frontend LessonSize is `15 | 30 | 60 | "all"`.
- Confirmed backend validation accepts only `15 / 30 / 60` and rejects `all`.
- Confirmed the composer uses `lessonSizeLimit` as the cap and an explicit no-cap path can reuse existing `limit <= 0` behavior once `all` is validated intentionally.
- Confirmed Stage 3 automatic Home flow is already fixed to 15 and must remain outside this slice.

Commands or procedures:

Live GitHub connector reads/searches and branch writes. A local clone attempt was made only for read-only audit convenience and failed because the execution container cannot resolve `github.com`; no repository state depended on it.

Artifacts produced:

- Stage 4 branch
- populated `.agents/current/TASK.md`
- populated `.agents/current/PROGRESS.md`
- populated `.agents/current/EXECUTION.md`

Result:

The next atomic runtime slice is proven: manual `/learn` workload controls and their API/OpenAPI contract are stale relative to Issue #651 (`15 / 30 / 50` + explicit user-only `All`).

Failures:

Local clone DNS resolution failure.

Root cause:

The execution container has no direct DNS/network route to GitHub.

Fallback:

Use the connected GitHub integration as the authoritative repository transport and validate behavior through immutable GitHub CI.

Limitations:

No local test execution is available from the disconnected container; focused correctness is established through source-level contracts first and then GitHub CI on the immutable branch head.

Reusable lesson:

A latent frontend union member such as `"all"` is not a delivered product contract unless backend validation, OpenAPI, UI ownership and regression tests all agree on its semantics.
