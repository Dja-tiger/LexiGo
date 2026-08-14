# Current Task

## Identity

- Issue: #518 — `[High][Figma][CI] Сделать Dictionary Empty baseline 79:93 детерминированным`
- Branch: `test/issue-518-dictionary-empty-visual-determinism`
- Base SHA: `22c84c630a76384a02e1a785c44bc24b064895ff`
- Head SHA: resolve from live branch ref
- PR: #520 — `test(figma): stabilize Dictionary Empty baseline 79:93`

## Objective

Eliminate nondeterministic raw-PNG capture for the approved Figma `Mobile / Dictionary Empty / Light` state (`79:93`) while preserving approved SHA-256 `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`, product UI and all other System State baselines.

## Scope

- change only the authoritative System State visual test lifecycle;
- make Dictionary Empty capture wait for its semantic final state;
- normalize the static Figma capture away from transient programmatic `:focus-visible` presentation without changing production focus behavior;
- replace the fixed post-font sleep for this state with explicit render-frame stabilization;
- keep raw SHA equality strict.

## Non-goals

- no baseline/hash promotion to `dd2d0c...`;
- no pixel tolerance or retry policy weakening;
- no production React/CSS/Figma changes;
- no arbitrary longer sleep;
- no unrelated visual baseline changes.

## Allowed paths

- `frontend/e2e/system-states-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/app/**/*.css`
- `frontend/components/**/*.tsx`
- `.github/workflows/**`
- snapshot/baseline files or approved SHA values
- backend/deploy/dependency files

## Runtime owners

- Dictionary route island: `LexigoDictionaryApp`
- empty state: `DictionaryCatalog` / `AsyncStatePanel`
- visual owner: `frontend/e2e/system-states-visual.spec.ts`

## Documentation owners

- Figma node `79:93`
- historical approval: PR #239
- follow-up evidence: Issue #518

## Invariants

- approved `79:93` SHA remains `e1405517...`;
- all other System State hashes remain byte-for-byte unchanged;
- production accessibility auto-focus remains unchanged;
- visual capture represents the static Figma frame, not a transient keyboard-focus treatment;
- no hidden product defect is masked by retry/sleep/tolerance.

## Acceptance criteria

- `compact Dictionary empty light` passes approved SHA on the first Playwright attempt;
- authoritative visual job reports no flaky classification for this test;
- all System State hashes remain unchanged;
- immutable-head full CI passes;
- exact-main CI passes without controlled rerun;
- Stage/public validation passes.

## Required checks

- diff/source audit;
- authoritative Linux visual job;
- full CI on frozen head;
- review/thread audit;
- exact-main CI and Stage after merge.

## Risks

- `dd2d...` may be caused by rasterization rather than focus state; CI result must classify this before further changes;
- over-normalizing focus could hide accessibility behavior, so the change is test-capture-only and the production focus contract remains covered elsewhere.

## Rollback

Revert the test-only change; do not update Figma design or approved hashes.