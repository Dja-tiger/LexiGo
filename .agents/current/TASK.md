# Current Task

## Identity

- Issue: #518 — `[High][Figma][CI] Сделать Dictionary Empty baseline 79:93 детерминированным`
- Branch: `test/issue-518-dictionary-empty-visual-determinism`
- Base SHA: `22c84c630a76384a02e1a785c44bc24b064895ff`
- Head SHA: resolve from live branch ref
- PR: #520 — `test(figma): stabilize Dictionary Empty baseline 79:93`

## Objective

Eliminate nondeterministic raw-PNG capture for the approved Figma `Mobile / Dictionary Empty / Light` state (`79:93`) while preserving approved SHA-256 `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`, product UI and all other approved visual baselines.

## Scope

- restore the authoritative System State test lifecycle to `main` after CI rejected the focus-only hypothesis;
- make the compact Chromium visual project use Skia's baseline CPU code path via Chromium `--disable-skia-runtime-opts`;
- keep every existing raw PNG/SHA baseline strict and unchanged;
- use the full authoritative visual suite as the compatibility test: if any approved compact baseline changes, reject this rasterizer hypothesis rather than promoting hashes.

## Non-goals

- no baseline/hash promotion to `dd2d0c...`, `31cc...` or `4f06...`;
- no pixel tolerance or retry policy weakening;
- no production React/CSS/Figma changes;
- no arbitrary sleep;
- no focus normalization in the final candidate;
- no unrelated Playwright project behavior changes.

## Allowed paths

- `frontend/playwright.visual.config.ts`
- `frontend/e2e/system-states-visual.spec.ts` only to restore it exactly to `main`
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
- content-addressed visual owner: `frontend/e2e/system-states-visual.spec.ts`
- Chromium raster baseline owner for this experiment: `visual-compact` in `frontend/playwright.visual.config.ts`

## Documentation owners

- Figma node `79:93`
- historical approval: PR #239
- follow-up evidence: Issue #518
- Chromium primary-source switch contract: `--disable-skia-runtime-opts` disables runtime-detected high-end CPU optimizations in Skia to force a baseline path useful for web/layout tests

## Invariants

- approved `79:93` SHA remains `e1405517...`;
- all other approved hashes/snapshots remain unchanged;
- production accessibility auto-focus remains unchanged;
- visual config remains Chromium-only and changes only the compact visual project;
- no hidden product defect is masked by retry/sleep/tolerance;
- passing requires a clean first Playwright attempt, not a flaky success.

## Acceptance criteria

- all compact content-addressed/System State baselines keep their existing approved hashes;
- `compact Dictionary empty light` produces approved `e1405517...` on the first Playwright attempt;
- authoritative visual job reports no flaky classification for this test;
- immutable-head full CI passes;
- exact-main CI passes without controlled rerun;
- Stage/public validation passes.

## Required checks

- diff/source audit proving the failed focus experiment is fully removed;
- authoritative Linux visual job with unchanged raw hashes/snapshots;
- full CI on frozen head;
- review/thread audit;
- exact-main CI and Stage after merge.

## Risks

- forcing Skia baseline code paths may intentionally alter other compact raster output; if any existing hash/snapshot changes, this candidate is rejected rather than updating design evidence;
- raster nondeterminism may live outside Skia CPU runtime dispatch; in that case continue diagnosis without weakening the gate.

## Rollback

Revert the visual-project launch flag. Do not update Figma design or approved hashes.