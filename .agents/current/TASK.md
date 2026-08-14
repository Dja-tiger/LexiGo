# Current Task

## Identity

- Issue: #518 — `[High][Figma][CI] Сделать Dictionary Empty baseline 79:93 детерминированным`
- Branch: `test/issue-518-dictionary-empty-visual-determinism`
- Base SHA: `22c84c630a76384a02e1a785c44bc24b064895ff`
- PR: #520 — `test(figma): stabilize Dictionary Empty baseline 79:93`

## Objective

Eliminate nondeterministic raw-PNG capture for approved Figma node `79:93` while preserving approved SHA `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`, product UI and every other approved visual baseline.

## Root cause

`CalendarReminderRouteEntry` performs deferred client hydration with `setTimeout(..., 0)` and then commits reminder settings from localStorage. The compact Dictionary visual could reach the raw screenshot path before that deferred state commit had completed. Geometry was already stable, but the resulting repaint of the fixed reminder summary/shadow produced the observed lifecycle-level `e140...` / `dd2d...` 1-LSB raster split.

The accepted fix is a test-owned observable hydration barrier:

- install a deterministic reminder-settings sentinel through `addInitScript()` before navigation;
- wait for the reminder summary `aria-label` to reflect that sentinel, proving the deferred state commit completed;
- only then apply the existing font/scroll/double-rAF layout stabilization and pairwise raw-PNG SHA proof.

At compact 390 px the reminder schedule text is visually hidden. Exact approved SHA verification proves the sentinel does not change the Figma-visible composition.

## Rejected hypotheses

- focus-only normalization — CI #3491;
- `--disable-skia-runtime-opts` — CI #3496, regressed approved Phrases output and did not solve `79:93`;
- `--num-raster-threads=1` — CI #3501, `79:93` still alternate and approved Lessons output regressed;
- paint/layout readiness alone — CI #3503, stable `dd2d...` first attempt and approved retry, `1 flaky`;
- removing screenshot-time animation mutation — CI #3504 immutable-head rerun, `1 flaky`;
- `caret: "initial"` — CI #3512, first attempt `dd2d...`, approved retry, `1 flaky`.

## Scope

- `frontend/e2e/system-states-visual.spec.ts` only for executable behavior;
- `.agents/current/*` for evidence/reconciliation;
- no product React/CSS changes;
- no workflow/config changes;
- no snapshot/hash changes.

## Invariants

- Figma `79:93` approved SHA remains `e1405517...`;
- alternate `dd2d0c58...` remains rejected;
- screenshot options are restored to canonical `animations: "disabled"`, `caret: "hide"`, `fullPage: false`, `scale: "css"`;
- two consecutive captures must be byte-identical before approved-SHA comparison;
- no flaky success is accepted.

## Acceptance evidence

- CI #3513 attempt 1, Visual job `94891172103`: clean first-attempt Dictionary `79:93`; final `57 passed`, `84 skipped`, zero flaky.
- CI #3513 attempt 2, independent Visual job `94893140048` on the same code SHA `f3a3b551d718f7cadbdbf473afffb707da9bbfc6`: clean first-attempt Dictionary `79:93`; final `57 passed`, `84 skipped`, zero flaky.
- Full CI #3513 attempt 1 completed successfully before the controlled Visual rerun.
- No review threads or submitted reviews block PR #520.

## Remaining completion gates

- reconcile PR body and Agent Harness docs;
- final docs-only CI/readback;
- mark PR ready and merge with expected head SHA;
- verify exact-main CI and Stage/public validation after merge.

## Rollback

Restore `frontend/e2e/system-states-visual.spec.ts` to `main`; never change approved design evidence to absorb the race.
