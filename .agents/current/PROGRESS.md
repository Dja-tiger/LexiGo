# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Issue #574 is open and has no parallel implementation PR.
- Runtime base/current `main` is `580300373bfad88eed5bbaf7b024d004837058fa`.
- Draft PR #575 is the atomic runtime delivery path for #574.
- #568 / Draft PR #570 remains intentionally fail-closed; no consolidated tablet fingerprints were approved after the Home defect was found.
- Exact #570 evidence that reproduced the Home defect: head `7f6efef0d3832e095900b571708f7788760d76e5`, CI #3719 / run `32003874006`, artifact `9279509833`, digest `sha256:be73d655914078a78ddf78872432861ba19a4fb367e04e5cf13b362c40bc4303`.
- Source root cause is adjacent `<span>`/`<strong>` metric siblings with row flex ownership only through compact `max-width:760px`; no equivalent row layout exists at 768px.
- Existing `home-visual-medium-linux.png` on `main` already encodes the defect and therefore cannot be treated as valid approval after the fix.

### Finding

The narrowest safe repair is a Home-scoped companion stylesheet for `761px–1023px`, imported immediately after `adaptive-knowledge-coach-home.css`, reusing the compact row semantics (`display:flex`, `justify-content:space-between`, explicit gap) without changing Home markup or progress content.

### Root cause

The compact Home owner stops at 760px and the adaptive mobile block stops at 719px. At 768px `.lx-progress-list > div` is an ordinary block with adjacent inline children, so labels and values render as one visual token. The defect predates #572.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/home-tablet-progress-spacing.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/home-tablet-progress-visual.spec.ts`
- `frontend/playwright.visual.config.ts`
- `frontend/e2e/visual-regression.spec.ts-snapshots/home-visual-medium-linux.png` only after exact Linux review, if the old snapshot mismatch is confirmed as the expected Home-only change

### Checks passed

- Companion CSS read-back confirms the media interval is exactly `761px–1023px` and selectors are scoped to authenticated Home progress rows.
- Production import read-back confirms the companion loads immediately after `adaptive-knowledge-coach-home.css`.
- New visual harness read-back confirms explicit Light/Dark, boundary widths, runtime geometry, overflow/focusable checks and `REVIEW_REQUIRED` sentinels.
- Visual config read-back confirms #574 evidence collection is enabled.
- `main` remained `580300373bfad88eed5bbaf7b024d004837058fa` after implementation writes.

### Checks failed

- None classified yet. First immutable pre-artifact CI is expected to fail only on the two #574 `REVIEW_REQUIRED` hashes and the existing Home medium snapshot if runtime geometry changed as intended.

### Current branch head

Resolve from live branch ref after `EXECUTION.md` is populated. That final docs commit defines the first valid pre-artifact immutable head.

### Next action

Populate `EXECUTION.md`, freeze the pre-artifact head, run CI, classify boundary/core/visual results, download the exact Linux Visual artifact, manually inspect Home Light/Dark plus the old medium snapshot actual, and only then write reviewed hashes/binary snapshot evidence.
