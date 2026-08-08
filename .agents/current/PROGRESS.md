# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Exact product/docs base is `0969a5fdff0484d23099e66d7f4f0b31965a689c`; deployed product image remains `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- `.agents/current/*` was canonical idle before this slice.
- Existing route reminder disclosure already paints at least 48px; provider buttons and form controls are at least 48px.
- Confirmed residual gaps: preview/card `Настроить календарь` stops at routed 44px; modal close paints 42x42; weekday buttons paint 42px and shrink to 39px at <=440px.
- Seven independent weekday targets cannot satisfy 44/48px width in one 320-390px row without overlap.

### Finding

Calendar reminder preview/card actions, modal close and custom weekday selectors are a coherent residual Issue #74 interaction surface requiring explicit effective-target ownership.

### Root cause

The calendar surface predates the Issue #74 effective-target contract. Compact weekday layout prioritized seven single-row painted controls, while routed 44px buttons and the 42px close control had no coarse-pointer hit owner.

### Changed files

- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/calendar-reminder-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/calendar-reminder-touch-targets.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Source audit confirms form/provider controls and route disclosure need no remediation.
- Dedicated acceptance is explicitly registered in both authoritative UI and accessibility collections.
- Product implementation keeps preview/card/close/weekday painted heights unchanged; only custom <=440px weekday column flow changes to 4+3 with 10px gap.

### Checks failed

None yet; authoritative immutable-head CI is the next gate.

### Current branch head

Resolve from live branch ref after the final Agent Harness record is written.

### Next action

Freeze the developer-authored head, verify allowed diff against unchanged `main`, open Draft PR, require full product CI, classify any failure from exact artifacts, then complete clean review audit, Ready, expected-head squash merge, exact-main CI and exact-image Stage/public validation.
