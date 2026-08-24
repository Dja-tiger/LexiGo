# Current Task Progress

## 2026-08-24 Stage 6b

### Verified

- Live base `main`: `4412209b771edab470223d6dd683be5fc73b05f4`.
- No open pull requests existed before branch creation.
- Stage 6a runtime attribution is delivered in `review_events.session_kind` and `selection_reason`.
- Issue #651 explicitly requires analytics separation for `new_learned`, `due_reviewed`, `remediation_reviewed`, `review_backlog`, `lapses`, and `retention`.
- Existing Progress answer-mode/global metrics remain separate from the new process evidence.
- Existing retained-items evidence previously accepted explicit Study recall because it had no process guard.

### Finding

Stage 6a created enough immutable event evidence to aggregate Study / Review / Remediation without inference. Process retention can therefore be restricted to explicit Review retrieval while preserving historical NULL-attribution compatibility in the pre-existing retained-items metric.

### Root cause

Before Stage 6a, review events did not persist session intent, so Progress could only aggregate by interaction mode. That made process separation impossible without semantic inference.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `api/openapi.yaml`
- `backend/internal/learning/model.go`
- `backend/internal/learning/repository.go`
- `backend/integration/process_progress_analytics_test.go`
- `frontend/lib/progress.ts`
- `frontend/lib/account-resources.ts`
- `frontend/lib/account-resources.test.ts`
- `frontend/lib/progress-evidence.test.ts`

### Checks passed

- Temporary helper workflows removed from the final compare.
- Final runtime compare against base is `behind_by=0` with zero `.github/workflows/**` changes.
- `gofmt` and `git diff --cached --check` passed in the helper execution.
- Per-file self-review confirmed process aggregation uses explicit `session_kind` / `selection_reason`, Review backlog excludes `status='new'` and future-due items, and explicit Study is excluded from Review retention.
- OpenAPI diff is additive and structurally nested under components; full YAML parse remains delegated to immutable-head CI as required.

### Checks failed

- The initial branch-only push helper did not start; a Draft-PR bootstrap successfully applied the exact bounded patch and cleaned itself up.
- No product/test failure is known at this head before immutable-head CI.

### Current branch head

Resolve from live PR after this harness update.

### Next action

Run full CI on the new clean immutable head, fix only reproduced failures, then perform final compare/review audit before Ready/merge.
