# Current Task

## Identity

- Issue: #610
- Branch: `test/issue-610-calendar-reflow-stable-home`
- Base SHA: `e70778dc22c1e61441e4d5356df4c484e30e367e`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Stabilize the existing Issue #74 320px / 200% calendar reminder reflow gate so whole-document geometry is measured only after the authenticated Home route has completed its deterministic async transition.

## Scope

- synchronize `frontend/e2e/calendar-reminder-touch-targets.spec.ts` with the deterministic Home progress and active-lesson state before page-level overflow measurement;
- preserve the closed-preview zero-geometry proof;
- preserve the strict `documentElement` and `body` horizontal-overflow contract at `viewport + 1`;
- preserve open-preview in-viewport and actionable calendar-button evidence;
- validate Android Chromium and iOS WebKit without retry-dependent behavior.

## Non-goals

- no runtime CSS/React changes unless stable-state evidence reproduces a genuine product defect;
- no calendar settings/storage/dialog redesign;
- no keyboard/focus audit changes from #608/#609;
- no timeout sleeps, overflow hiding, tolerance widening or browser/project exclusion.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/calendar-reminder-touch-targets.spec.ts`
- narrowly required deterministic test support only if direct synchronization cannot be expressed in the owner spec.

## Prohibited paths

- production frontend runtime/CSS/component files unless stable-state evidence proves a real runtime defect and the scope is explicitly split first;
- backend/API/schema/deploy/workflow/design-source files;
- #608/#609 keyboard/focus audit files;
- geometry tolerance changes.

## Runtime owners

- Home runtime remains unchanged unless deterministic post-load evidence proves actual overflow;
- calendar reminder runtime remains unchanged unless deterministic post-load evidence proves actual overflow;
- `frontend/e2e/calendar-reminder-touch-targets.spec.ts` owns the existing 320px / 200% acceptance gate.

## Documentation owners

- `.agents/current/**` records Issue #610 execution evidence.

## Invariants

- fixture synchronization must prove completion of both Home async resources that can alter geometry;
- no arbitrary `waitForTimeout`;
- closed reminder preview remains `display: none` with zero width/height before page-level measurement;
- horizontal overflow remains `<= viewport + 1` for both document and body;
- Android Chromium and iOS WebKit remain in scope.

## Acceptance criteria

- Home is deterministically stable before the first whole-document 320px / 200% geometry assertion;
- closed preview remains zero-geometry;
- strict page-level no-overflow assertions pass;
- opening preview remains visible, in viewport and exposes `Настроить календарь`;
- Android Chromium and iOS WebKit pass on the immutable head without relying on a failed-job rerun;
- full repository CI passes;
- reviews/threads/main drift are clean before expected-head squash merge.

## Required checks

- source readback and allowed-path compare;
- focused calendar reminder E2E through repository CI;
- full immutable-head CI;
- final review/thread/main-drift audit.

## Risks

- waiting only for the loading CTA to disappear could miss an independently pending progress response; synchronization must cover both `/api/v1/progress` and `/api/v1/lessons/active` or an equivalent final DOM state that logically requires both commits;
- over-coupling to incidental Home copy could make the test brittle, so use stable fixture/role semantics where possible.

## Rollback

Revert the test-only squash merge. No runtime, data, API, deployment or design rollback is required.
