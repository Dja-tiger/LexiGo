# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Live `main` before the slice: `b9119d8f2b57e454d1bfa24b0cefe3875801102e`.
- Issue #74 is still open after PR #428 because the remaining work is residual whole-app live-control inventory plus final physical-device acceptance.
- Canonical `frontend/app/active-lesson.css` still contains 44px-only live controls with no `(pointer: coarse)` 48px owner: utility buttons, text actions, confidence ratings and compact Back/Close.
- Default `frontend/playwright.config.ts` has no explicit `testMatch`, so a new spec under `frontend/e2e` is collected by the authoritative browser matrix.

### Finding

The Active Lesson route had a confirmed residual Issue #74 gap: several live controls met the 44px fine-pointer minimum but had no 48px coarse-pointer effective target contract.

### Root cause

The canonical Active Lesson presentation predates the per-control Issue #74 hit-slop pattern used by later slices. Its 44px controls were visually correct but had no pointer-dependent effective-target overlay.

### Changed files

- `.agents/current/TASK.md`
- `frontend/app/active-lesson-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/active-lesson-touch-targets.spec.ts`

### Checks passed

- Live-state/harness pre-flight completed against current GitHub state.
- Branch created from the exact verified `main` SHA.
- Changed files read back after repository writes.
- Compare against base is ahead-only with no base drift at the last verification.
- Browser acceptance is fail-closed on effective geometry, four-side perimeter hit testing, viewport containment, keyboard focus for the text action and horizontal overflow.

### Checks failed

- No CI result yet; immutable-head CI starts after the draft PR is opened.

### Current branch head

- Latest implementation/test head before this progress update: `29674f00c6565470a1c4d4ecf8a7e0126dcc65a3`.

### Next action

Open the atomic draft PR, inspect the immutable diff, run/classify full CI, fix any real regression, then Ready → expected-head squash merge → exact-SHA main CI → exact-image Stage/public validation. After delivery, reconcile/reset Agent Harness in the usual docs-only PR and continue the remaining Issue #74 live-control inventory rather than stopping at this slice.
