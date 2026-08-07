# Current Task

## Identity

- Issue: #74
- Branch: `feat/issue-74-progress-control-targets`
- Base SHA: `adde2a0124ae90d15e2e038afd266c31927b9a67`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Close the confirmed Progress-route live-control target gap without changing product semantics: the weak-area `Повторить` actions currently override the shared Progress button minimum down to `2.25rem` (~36px), and the `Разделение по режимам` disclosure has no explicit Issue #74 minimum target contract.

## Scope

- Restore 44px minimum fine-pointer targets for populated Progress dashboard weak-area actions.
- Enforce 48px minimum targets for the same controls on coarse pointers.
- Give the populated Progress activity disclosure the same 44/48px minimum target contract.
- Add permanent browser acceptance in the already-collected `progress-evidence.spec.ts`, including geometry, non-overlap, focus-visible/keyboard usability and no horizontal overflow on desktop Chromium plus compact iOS/Android projects.
- Preserve the existing due-Recall callbacks, disclosure semantics, responsive layout and visual hierarchy.

## Non-goals

- No API, session, lesson, History, storage or Service Worker behavior changes.
- No change to Progress server-owned evidence semantics.
- No visual-baseline updates.
- No remediation outside the populated canonical `/progress` dashboard.
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
- Target expansion must not create horizontal overflow or overlapping hit geometry.
- Fine-pointer minimum is 44px; coarse-pointer minimum is 48px.
- Existing text-size/reflow and dark-mode behavior remain unchanged.

## Acceptance criteria

- Every visible weak-area `Повторить` action in the canonical populated Progress fixture has width and height >=44px on fine pointer and >=48px on coarse pointer.
- `Разделение по режимам` has width and height >=44px on fine pointer and >=48px on coarse pointer.
- Target rectangles do not intersect sibling controls/status badges.
- Keyboard navigation produces visible focus on the disclosure and actionable buttons.
- Existing topic/source filtered Recall tests and disclosure behavior remain green.
- Compact iOS/Android layouts remain horizontally contained.

## Required checks

- Read-back of every repository write, branch-head verification and main-drift check.
- Existing frontend unit/lint/type/build gates through CI.
- Browser matrix with the added Progress target acceptance actually collected and executed.
- Accessibility, visual and performance gates unchanged/green.
- Review/thread audit.
- Expected-head squash merge.
- Exact-SHA main CI and exact-image stage/public validation.

## Risks

- Enlarging desktop weak-area actions can alter the three-column weak-row geometry.
- Coarse-pointer 48px targets can expose compact overflow if responsive ownership is not respected.
- A new standalone E2E file could repeat the Issue #74 collection bug, therefore acceptance is added to the existing collected Progress owner.

## Rollback

Revert the Progress CSS/test slice. No data migration or server rollback is required.
