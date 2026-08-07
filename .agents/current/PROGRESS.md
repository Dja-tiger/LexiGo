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
- `frontend/e2e/progress-evidence.spec.ts` measures the union of painted control and hit slop, requires the effective width/height minimum, verifies top/bottom perimeter hits through `document.elementFromPoint`, checks zero inline expansion, checks effective target separation from status badges and neighboring weak actions, preserves keyboard `:focus-visible`, opens the native disclosure and asserts compact horizontal containment.
- The helper now calls Playwright `scrollIntoViewIfNeeded()` before viewport-relative `elementFromPoint` assertions so off-screen controls are tested at valid viewport coordinates rather than producing false negatives.
- Weak-action assertions explicitly prove the painted height remains below the target minimum while the effective target satisfies it.

### Final-candidate CI #2992 classification

- CI #2992 / run `31206575801` on head `c0e470de15c06b35badd12386ca1e224c0ea67fb` proved Backend unit/security, Frontend core, Backend integration, Lesson completion, Accessibility audit, iOS PWA dictionary, Controlled service worker, Performance budgets, Dictionary smoke, Content security, UI shard 1 and Linux Visual regression green.
- Linux Visual regression passed with the existing Progress and calendar-dialog baselines, confirming the paint-inert production correction preserves canonical layout.
- UI shard 2 failed the new Progress target test on compact iOS/Android at the `activity summary` perimeter assertion. Downloaded Playwright traces showed the global next-action target passed first; the disclosure was below the 844px viewport and the helper called `document.elementFromPoint` with off-screen Y coordinates, yielding `[false, false]` on both attempts. This is a test-harness coordinate defect, not a production hit-surface failure.
- The helper was corrected to scroll each target into view before measurement/hit testing; production CSS is unchanged by this correction.
- The same shard also observed an unrelated pre-existing connectivity test race on iOS where an unscoped exact-text locator matched four simultaneous `Нет подключения к сети` messages. This is classified separately from the Progress slice and is not used to weaken Progress acceptance.

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
- CI #2992 independently confirmed the corrected production CSS passes unchanged Linux visual baselines and all completed non-shard-2 product gates listed above.

### Checks failed / pending

- CI #2987 Visual regression failure is classified and corrected; it is historical evidence only because source changed.
- CI #2992 UI shard 2 failure is classified as an off-screen viewport-coordinate defect in the new test helper and corrected; source changed, so a new full immutable-head CI run is required.
- Full required CI must pass on the final developer-authored head after this task-document reconciliation.
- Expected-head squash merge, exact-SHA main CI and exact-image stage/public validation remain pending.
- Real physical-device acceptance remains a separate Issue #74 manual gate and is not claimed by this PR.

### Current branch head

Resolve from live branch ref after each write; the final immutable candidate is established only after the last allowed task-document update.

### Next action

Update `.agents/current/EXECUTION.md` and PR metadata with the CI #2992 classification, then require full immutable-head CI before Ready/merge and post-merge stage validation.
