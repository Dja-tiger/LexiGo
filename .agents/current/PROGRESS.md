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
- `.agents/lessons/backend.md`
- `.agents/lessons/ci.md`
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

## 2026-07-26 00:48 Europe/Berlin

### Validation evidence

- Draft PR #226 was created against the exact base SHA and remains limited to the declared Scenario progress slice.
- Product head `df35704aac40a5c398d8e0887f55ba62db4f70a9` passed CI run #1841 after one targeted infrastructure retry.
- Backend unit/security passed dependency verification, `gofmt`, `go vet`, race tests, coverage and vulnerability scan.
- Backend integration passed under the race detector with the new initial/open/completed/all-completed recommendation contract.
- Frontend core passed lint, typecheck, unit tests, production build and production dependency audit.
- Both UI shards passed, including the new desktop Chromium and iOS WebKit Scenario/Progress lifecycle contract.
- Content security, accessibility, performance budgets, iOS PWA dictionary, controlled service worker, visual regression, lesson completion and dictionary smoke passed.
- API and web container builds passed after backend integration became green.

### Failures and root causes

- Early CI heads failed formatting because exact changed Go blobs had not been run through `gofmt` in the connector-only execution environment. All changed Go files were reconstructed and formatter-verified; a durable CI lesson now requires this before first CI when no checkout is available.
- The first Scenario integration fixture used two parameterized SQL commands in one pgx `Exec`; the extended protocol rejected multiple commands before production behavior was exercised. The fixture was split into separate parameterized calls and a durable backend lesson was added.
- The first backend integration attempt on run #1841 failed while starting isolated Docker services before tests began. The exact same immutable SHA passed service bootstrap and integration tests on attempt 2 without repository changes, confirming a hosted-runner transient rather than a code or workflow defect.

### Checks passed

- Every write targeted the explicit feature branch and was read back.
- Branch comparison remains based on the exact immutable `main` SHA with `behind_by=0`.
- The Scenario route change was verified as an actual `+6/-1` semantic diff.
- Full changed-path review contains only declared task paths.
- PR comments are empty.
- Product code is frozen after the green product head; only active task memory and durable prevention lessons changed afterward.

### Checks pending

- One full final CI run on the developer-authored head containing the completed repository memory and lessons.
- Review/review-thread reconciliation and conversion from draft.
- Squash merge with expected final head SHA.
- Exact-merge stage deploy, public smoke and public browser matrix.
- Post-merge Issue #24 checklist reconciliation while keeping catalog/discovery open.
- Repository-memory reset/reconciliation required by the harness.

### Environment limitation

Local repository checkout remained unavailable because the sandbox could not resolve GitHub. GitHub Actions is the executable source of truth; the limitation did not weaken or skip any required gate.

### Current head

Resolve from the live feature branch after this memory update.

### Next action

Finalize `EXECUTION.md`, verify the complete PR diff and review state, then require one unchanged full CI run on the resulting immutable head before marking PR #226 ready.
