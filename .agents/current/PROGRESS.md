# Current Task Progress

## 2026-08-07 Europe/Moscow

### Verified

- Reconciliation PR #427 merged as `adde2a0124ae90d15e2e038afd266c31927b9a67` and exact-SHA main CI #2986 / run `31176049821` succeeded.
- Live Issue #74 remains open.
- Current product PR is Draft #428 on `feat/issue-74-progress-control-targets`, based on exact main `adde2a0124ae90d15e2e038afd266c31927b9a67`.
- Canonical populated `/progress` renders its live weak-area actions and activity disclosure from `progress-evidence-dashboard.tsx`.
- The route CSS gives the normal Progress action buttons a 44px painted minimum, while `.lx-progress-evidence__weak button` intentionally overrides that painted height to `2.25rem` (~36px).
- Issue #74 explicitly permits invisible padding/hit slop; previously delivered PR #387 already established the repository pattern of preserving painted geometry while expanding the effective block-axis hit surface.
- Existing `progress-evidence.spec.ts` owns canonical Progress API fixtures, exact global/topic/source due-Recall callbacks, disclosure behavior, compact iOS 200% text-reflow coverage and no-horizontal-overflow assertions.

### Finding

The residual live-control audit found a concrete Progress accessibility gap: weak-area `Повторить` controls have only about 36px painted height and no compensating effective target, while the existing 44px Progress actions and the native activity disclosure also need a 48px coarse-pointer target contract.

### Initial implementation and CI classification

- The first implementation increased painted `min-height` directly to 44px/48px and added browser geometry acceptance.
- PR #428 CI #2987 / run `31176989529` passed product/runtime, browser matrix, accessibility and performance gates but failed Linux Visual regression.
- Compact `progress` and `calendar dialog` baselines changed from 390×1900 to stable 390×1916 because the direct painted-height expansion increased page layout height.
- A compact Dictionary content-addressed hash mismatch in the same Visual job passed on retry and is classified as an unrelated flake.
- No visual baseline was updated.

### Root cause

The accessibility requirement is an effective hit-area contract, not a requirement to make every painted control visually 44/48px tall. Direct `min-height` expansion changed canonical compact layout even though Issue #74 permits paint-inert hit slop and the repository already has that established implementation pattern.

### Remediation

- `frontend/app/progress-evidence.css` now defines a route-owned 44px target token and promotes it to 48px under `(pointer: coarse)`.
- Existing painted dimensions are preserved.
- Global/weak/empty Progress action buttons and `activity summary` receive a positioned, transparent `::before` block-axis hit surface with no inline expansion.
- `frontend/e2e/progress-evidence.spec.ts` now measures the union of painted control and hit slop, requires the effective width/height minimum, verifies top/bottom perimeter hits through `document.elementFromPoint`, checks zero inline expansion, checks effective target separation from status badges and neighboring weak actions, preserves keyboard `:focus-visible`, opens the native disclosure and asserts compact horizontal containment.
- Weak-action assertions explicitly prove the painted height remains below the target minimum while the effective target satisfies it.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/progress-evidence.css`
- `frontend/e2e/progress-evidence.spec.ts`

### Checks passed

- Exact base/main verification remained stable through writes.
- Every source write was read back and its blob SHA verified on the explicit feature branch.
- PR diff audit confirms production CSS relative to `main` contains only the target token, transparent hit-surface owner and coarse-pointer token override; no painted weak-button/summary size change remains.
- PR #428 has no review threads and no submitted reviews requiring action at the current audit.
- Earlier CI #2987 proved all non-visual required product/browser/accessibility/performance gates green before the layout correction.

### Checks failed / pending

- CI #2987 Visual regression failure is classified and corrected; it is not eligible for retry because source changed.
- Full required CI must pass on the final developer-authored head after task-document reconciliation.
- Expected-head squash merge, exact-SHA main CI and exact-image stage/public validation remain pending.
- Real physical-device acceptance remains a separate Issue #74 manual gate and is not claimed by this PR.

### Current branch head

Resolve from live branch ref after each write; the final immutable candidate is established only after the last allowed task-document update.

### Next action

Complete `.agents/current/EXECUTION.md`, update PR metadata to the effective-target implementation, then require full immutable-head CI with unchanged Linux visual baselines before Ready/merge and post-merge stage validation.
