# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `fix/issue-74-active-lesson-live-targets-v2`
- Base SHA: `a2cb82b2415e0695120ec666b86690cbcd91f12d`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Close the confirmed residual Active Lesson live-control gap in Issue #74 by preserving approved painted geometry while providing at least 44 CSS px effective targets for fine pointers and 48 CSS px for coarse pointers.

## Scope

- Add an Active Lesson-specific paint-inert hit-slop owner for utility, recall text-action, confidence-rating and compact Back/Close controls.
- Load the owner after canonical Active Lesson CSS.
- Add permanent browser acceptance for effective geometry, four-side perimeter hit testing, viewport containment, keyboard focus and compact overflow.
- Register the acceptance in the authoritative `test:e2e:lesson` command.

## Non-goals

- No redesign, typography, scheduler, review, session, history, API or backend changes.
- No dependency or lockfile changes.
- No visual baseline changes.
- No claim of final physical-device acceptance.

## Allowed paths

- `frontend/app/active-lesson-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- `frontend/package.json` — test collection only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Backend/API/migrations.
- Dependency versions or `frontend/package-lock.json`.
- Existing visual snapshots.
- Other route owners.

## Runtime owners

- `frontend/components/active-lesson-presentation.tsx`
- `frontend/app/active-lesson.css`
- `frontend/app/active-lesson-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- `frontend/package.json` → `test:e2e:lesson`

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Existing painted 44px geometry stays unchanged.
- Coarse-pointer effective target is at least 48px; fine-pointer target at least 44px.
- Hit slop must not overlap neighbouring controls or escape viewport containment.
- Accessible names, focus behavior, callbacks and lesson semantics remain unchanged.
- Security dependency remediation from #431 remains unchanged.

## Acceptance criteria

- Utility, text-action and confidence controls meet 44/48px effective target contracts.
- Compact Back/Close meet 44×44 fine / 48×48 coarse contracts where required.
- Four effective-target perimeter points hit the owning control.
- Recall text action keeps ~44px painted height while exposing larger coarse hit surface.
- Keyboard focus remains visible and compact layouts have no horizontal overflow.
- Acceptance runs on desktop Chromium, iOS WebKit and Android Chromium through `test:e2e:lesson`.

## Required checks

- Frontend lint/typecheck/unit/build and production dependency audit.
- Lesson browser matrix including the new acceptance.
- Full immutable-head CI including accessibility, visual, performance, CSP, PWA and container gates.
- Clean review/thread audit before Ready.
- Expected-head squash merge.
- Exact-SHA main CI and exact-image Stage/public validation.

## Risks

- Paint-inert pseudo-element regions can intercept adjacent controls if spacing is insufficient.
- An unregistered standalone spec can silently avoid authoritative CI; package script registration is part of the contract.

## Rollback

Remove the dedicated stylesheet/import, browser spec and its `test:e2e:lesson` entry while preserving all prior Issue #74 slices and #431 security remediation.
