# Current Task

## Identity

- Issue: #74
- Branch: `feat/issue-74-progress-control-targets`
- Base SHA: `adde2a0124ae90d15e2e038afd266c31927b9a67`
- Head SHA: resolve from live branch ref
- PR: #428

## Objective

Close the confirmed Progress-route live-control target gap without changing product semantics or painted layout: the weak-area `Повторить` actions intentionally render at about 36px height, below the Issue #74 effective target contract, while the populated `Разделение по режимам` disclosure and existing Progress actions also need an explicit 48px coarse-pointer hit-area contract.

## Scope

- Preserve the existing painted geometry of populated Progress controls.
- Expand the effective block-axis hit surface to at least 44px on fine pointers and 48px on coarse pointers using route-owned transparent hit slop.
- Cover the global due action, all populated weak-area `Повторить` actions, empty-state action and the native activity `summary` without changing callbacks or disclosure semantics.
- Add permanent browser acceptance in the already-collected `progress-evidence.spec.ts`, including effective geometry, real perimeter hit testing, non-overlap, focus-visible/keyboard usability and no horizontal overflow on desktop Chromium plus compact iOS/Android projects.
- Preserve the existing due-Recall callbacks, responsive layout, visual hierarchy and approved Linux baselines.

## Non-goals

- No API, session, lesson, History, storage or Service Worker behavior changes.
- No change to Progress server-owned evidence semantics.
- No visual-baseline updates.
- No remediation outside the canonical Progress presentation owner.
- No claim of physical-device acceptance and no Issue #74 closure in this slice.

## Allowed paths

- `frontend/app/progress-evidence.css`
- `frontend/e2e/progress-evidence.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Backend/API/migrations.
- Authentication/session ownership.
- Lesson/runtime callbacks outside existing Progress behavior.
- Other route CSS/components.
- Package/dependency/workflow files.
- Existing visual baselines.

## Runtime owners

- `frontend/components/lexigo-progress-app.tsx`
- `frontend/components/progress-evidence-dashboard.tsx`
- `frontend/app/progress-evidence.css`

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Progress weak-area buttons continue to invoke the exact existing topic/source due-Recall callbacks.
- `Разделение по режимам` remains a native `details/summary` disclosure.
- Painted control dimensions and approved Progress/calendar-dialog visual baselines remain unchanged.
- Hit-surface expansion is block-axis only and must not create horizontal overflow or overlapping effective targets.
- Fine-pointer effective minimum is 44px; coarse-pointer effective minimum is 48px.
- Existing text-size/reflow, Light/Dark and reduced-motion behavior remain unchanged.

## Acceptance criteria

- Every visible populated Progress action under this slice exposes an effective target width/height >=44px on fine pointer and >=48px on coarse pointer.
- The 36px weak-area `Повторить` painted controls remain visually unchanged while their effective target reaches the required minimum.
- Top and bottom perimeter points of each expanded target resolve to the owning control via browser hit testing.
- Effective weak-action targets do not intersect their status badge or neighboring weak-action targets.
- Keyboard navigation produces visible focus on the disclosure and actionable buttons.
- Existing global/topic/source filtered Recall tests and native disclosure behavior remain green.
- Compact iOS/Android layouts remain horizontally contained.
- Linux Progress and calendar-dialog visual regression passes without baseline updates.

## Required checks

- Read-back of every repository write, branch-head verification and main-drift check.
- Existing frontend unit/lint/type/build gates through CI.
- Browser matrix with the added Progress target acceptance actually collected and executed.
- Accessibility, visual and performance gates unchanged/green.
- Review/thread audit.
- Expected-head squash merge.
- Exact-SHA main CI and exact-image stage/public validation.

## Confirmed failure and correction

- PR #428 CI run `31176989529` failed only the Linux visual gate after direct `min-height` expansion changed compact Progress and calendar-dialog page height from 1900px to 1916px.
- The unrelated compact Dictionary content-addressed hash mismatch passed on retry and is classified as a flake, not a Progress defect.
- The direct visual expansion was therefore replaced with the established Issue #74 paint-inert block-axis hit-slop pattern used by earlier delivered controls; acceptance now measures the effective target and real hit points rather than equating painted `boundingBox()` height with hit area.

## Risks

- Transparent hit slop can overlap a sibling even when painted boxes do not; effective rectangles are therefore tested explicitly.
- Coarse-pointer expansion can cross a compact card boundary if spacing is insufficient; perimeter hit testing and non-overlap checks fail closed.
- A new standalone E2E file could repeat the Issue #74 collection bug, therefore acceptance stays inside the existing collected Progress owner.

## Rollback

Revert the Progress CSS/test slice. No data migration or server rollback is required.
