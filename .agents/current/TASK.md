# Current Task

## Identity

- Issue: #518 — `[High][Figma][CI] Сделать Dictionary Empty baseline 79:93 детерминированным`
- Branch: `test/issue-518-dictionary-empty-visual-determinism`
- Base SHA: `22c84c630a76384a02e1a785c44bc24b064895ff`
- Head SHA: resolve from live branch ref
- PR: #520 — `test(figma): stabilize Dictionary Empty baseline 79:93`

## Objective

Eliminate nondeterministic raw-PNG capture for approved Figma `79:93` while preserving approved SHA `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`, product UI and every other approved visual baseline.

## Scope

- keep `system-states-visual.spec.ts` exactly equal to `main`;
- serialize compact Chromium raster tasks with `--num-raster-threads=1`;
- keep Chromium's normal raster algorithm, all raw hashes and all snapshot files unchanged;
- accept only a clean first-attempt authoritative visual run.

## Non-goals

- no alternate hash/baseline promotion;
- no tolerance/retry weakening or longer sleeps;
- no focus normalization;
- no production React/CSS/Figma changes;
- no Skia runtime-optimization switch (rejected by CI #3496).

## Allowed paths

- `frontend/playwright.visual.config.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/e2e/system-states-visual.spec.ts`
- product CSS/components
- workflows
- hashes/snapshots
- backend/deploy/dependencies

## Runtime owners

- content-addressed visual owner: `frontend/e2e/system-states-visual.spec.ts`
- compact Chromium process owner: `visual-compact` in `frontend/playwright.visual.config.ts`

## Documentation owners

- Figma node `79:93`; historical approval PR #239; Issue #518.
- Chromium primary source: `num-raster-threads` controls the number of raster-task worker threads.

## Invariants

- approved `79:93` SHA remains `e1405517...`;
- all other hashes/snapshots remain unchanged;
- only `visual-compact` launch behavior changes;
- no flaky success is accepted.

## Acceptance criteria

- every existing compact content-addressed baseline keeps its approved hash;
- `79:93` produces `e1405517...` on the first attempt;
- Visual regression has no flaky classification;
- full immutable-head CI passes;
- exact-main CI passes without rerun;
- Stage/public validation passes.

## Required checks

- exact diff/source audit;
- authoritative Linux visual suite;
- full CI, review/thread audit;
- exact-main CI and Stage.

## Risks

- single-thread rasterization may still produce the alternate raster or alter unrelated compact output; either result rejects this candidate.

## Rollback

Remove the compact Chromium launch flag; never change approved design evidence.