# Current Task Progress

## 2026-08-19

### Verified

- Live base: `main@e70778dc22c1e61441e4d5356df4c484e30e367e`.
- No open PR remained after Issue #608 delivery/reconciliation.
- Issue #610 is open and records the exact CI #3853 iOS WebKit failure plus trace evidence.
- The closed calendar preview itself remained `display:none` with zero geometry; the failure was whole-page `scrollWidth=331` at viewport `320` while Home transitioned asynchronously.
- The same runtime tree passed the same shard previously and a same-head rerun passed without code changes.
- `installQualityGateAPI()` deterministically returns progress and a 404 active-lesson response; both Home resources can alter final geometry.

### Finding

The existing reflow test applies 200% text zoom and immediately measures whole-document overflow after proving the calendar preview is closed. It does not wait for the parallel Home `/api/v1/progress` and `/api/v1/lessons/active` resource transitions to commit.

### Root cause

Test synchronization race: page-level geometry is sampled while the host Home route can still replace its loading next-action state with final progress/recall content. This can transiently produce a scroll-width sample unrelated to the closed reminder preview.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- planned: `frontend/e2e/calendar-reminder-touch-targets.spec.ts`

### Checks passed

- live main/open-PR pre-flight;
- Issue #610 evidence review;
- current calendar reflow owner inspection;
- Home async-state and deterministic fixture ownership inspection.

### Checks failed

None on the new branch yet.

### Current branch head

Resolve from live branch ref after harness initialization.

### Next action

Add the narrowest deterministic Home-stability synchronization to the existing reflow test without timeout sleeps or tolerance changes, then open a Draft PR and use immutable CI as execution proof.
