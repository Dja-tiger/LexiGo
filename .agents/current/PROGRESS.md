# Current Task Progress

## 2026-07-25 22:44 Europe/Berlin

### Verified

- Live `main` is `591322c4a55b362402eab0b4936cd4e4f0347c3a`.
- Open pull requests: none before this slice.
- Stage run `30173542601` deployed the exact live `main` SHA; deploy, public smoke and 12/12 public browser checks succeeded.
- Issue #24 leaves Scenario catalog/discovery, `/progress` completion evidence and server-owned recommendations open.
- Feature branch was created from the exact base and compared as identical before the first write.
- Mandatory repository harness, architecture and skill documentation were read from live `main`.
- Figma nodes `76:6`, `76:53` and `76:154` define the existing Progress next-action surface; Scenario nodes `76:100`, `76:127` and `76:219` confirm the focused Scenario presentation contract.

### Finding

Scenario steps already persist ordinary schema-v2 Recall review events and completed attempts already have authoritative `completed_at`, but `/api/v1/progress` exposes neither Scenario completion activity nor a Scenario next action. The current completed Scenario state only routes back to learning.

### Root cause

The Scenario backend/content foundation and focused UI were intentionally delivered before a cross-layer Progress/recommendation contract. The remaining integration requires a read-only projection over `scenarios` and `scenario_attempts`; no migration or new scheduler is needed.

## 2026-07-26 00:18 Europe/Berlin

### Implemented

- Added authoritative Scenario completion counts to both `/progress` response paths using the same local-week boundary as review evidence.
- Added one deterministic server-owned recommendation: open attempt, first uncompleted Scenario, then least recently completed Scenario.
- Kept Scenario attempt lifecycle and schema-v2 Recall review writing unchanged.
- Extended the bounded Scenario OpenAPI contract and locked exact recommendation enums, actions and client/server ownership in source tests.
- Added integration coverage for initial, open, completed and all-completed Scenario histories.
- Added rolling-compatible frontend types and runtime validation, including semantic `reason`/`action` consistency.
- Reused the Figma-backed Progress next-action surface; due Recall remains higher priority than Scenario activity.
- Added current-week Scenario completion activity separately from retained-knowledge metrics.
- Added a direct completed-Scenario CTA to `/progress`.
- Added focused desktop Chromium and iOS WebKit contracts for due priority, exact Scenario routing and completion-to-Progress navigation.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `api/openapi-scenarios.json`
- `backend/internal/learning/model.go`
- `backend/internal/learning/http.go`
- `backend/internal/learning/scenario_progress.go`
- `backend/internal/scenarios/openapi_contract_test.go`
- `backend/integration/scenario_progress_test.go`
- `frontend/lib/progress.ts`
- `frontend/lib/account-resources.ts`
- `frontend/lib/progress-evidence.test.ts`
- `frontend/components/progress-evidence-dashboard.tsx`
- `frontend/components/lexigo-progress-app.tsx`
- `frontend/components/lexigo-scenario-app.tsx`
- `frontend/e2e/scenario-progress-recommendation.spec.ts`

### Checks passed

- Every write targeted the explicit feature branch and was read back.
- Branch comparison remains based on the exact immutable `main` SHA with `behind_by=0`.
- The large Scenario route rewrite was verified as an actual `+6/-1` semantic diff.
- Full changed-path review contains only declared task paths.
- Focused source, integration and browser contracts are present.

### Checks pending

- Executable formatting, backend, frontend and browser validation in GitHub Actions.
- Full immutable-head CI.
- Review-thread reconciliation, squash merge and exact post-merge stage/public validation.

### Checks failed

- Local executable validation is unavailable because the sandbox cannot resolve GitHub for a repository checkout. This is an execution-environment restriction, not a repository failure; GitHub Actions remains blocking evidence.

### Current branch head before this memory update

`7b7ad9413ba6bd55c904a3b10b715d20a6ca7c01`

### Next action

Open a draft PR linked to Issue #24, inspect the first executable CI evidence, and fix every root cause before converting the final immutable head to ready for review.