# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Exact product/docs base is `0969a5fdff0484d23099e66d7f4f0b31965a689c`; deployed product image remains `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- `.agents/current/*` was canonical idle before this slice.
- Existing route reminder disclosure already paints at least 48px; provider buttons and form controls are at least 48px.
- Confirmed residual gaps: preview/card `Настроить календарь` stops at routed 44px; modal close paints 42x42; weekday buttons paint 42px and shrink to 39px at <=440px.
- Seven independent weekday targets cannot satisfy 44/48px width in one 320-390px row without overlap.
- PR #446 CI #3064 / run `31275409335` ran on candidate `af6bafbab9da5257762407553dc685bdb8c877b1`; backend unit/security and integration passed, while Frontend core stopped at two deterministic unit/source-contract failures before browser/container jobs.

### Finding

Calendar reminder preview/card actions, modal close and custom weekday selectors are a coherent residual Issue #74 interaction surface requiring explicit effective-target ownership.

CI #3064 also proved two branch-specific ownership defects in the candidate: an unrelated root-shell movement in `layout.tsx`, and compact weekday layout declarations living in the new hit-target stylesheet rather than the canonical calendar presentation owner.

### Root cause

The calendar surface predates the Issue #74 effective-target contract. Compact weekday layout prioritized seven single-row painted controls, while routed 44px buttons and the 42px close control had no coarse-pointer hit owner.

For CI #3064:

- `ApplicationErrorBoundary` source contract failed because the branch accidentally moved `WebVitalsReporter` and `ServiceWorkerRegistration` outside the boundary even though `layout.tsx` was allowed for stylesheet import only. The runtime movement was unrelated drift and was reverted to the exact `main` ownership order.
- `global-feature-style-overlap-source.test.ts` failed because `grid-template-columns` and `gap` for `.lx-calendar-weekdays > div` were overridden from `calendar-reminder-touch-targets.css`, creating three new cross-file exact-selector conflicts. The compact 4+3 reflow is presentation, so its canonical owner is `calendar-reminders.css`; the dedicated touch-target stylesheet now owns only paint-inert pseudo hit surfaces.

### Changed files

- `frontend/app/calendar-reminders.css`
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
- CI #3064 lint and typecheck passed before the source-contract failure.
- CI #3064 backend unit/race/security and backend integration passed.
- Post-failure readback confirms root-shell ownership is restored and compact grid/gap declarations are now in `calendar-reminders.css`, eliminating the new cross-file exact-selector conflict without changing the conflict manifest.

### Checks failed

- CI #3064 / run `31275409335`: Frontend core unit/source contracts failed on the pre-recovery candidate `af6bafbab9da5257762407553dc685bdb8c877b1` for the two classified ownership defects above. Browser and container jobs were correctly skipped after the core gate failed.

### Current branch head

Resolve from live branch ref after the final Agent Harness recovery record is written.

### Next action

Verify the recovered developer-authored head and allowed-path diff against unchanged `main`, require a fresh full immutable-head product CI, classify any remaining failure from exact artifacts, then complete clean review audit, Ready, expected-head squash merge, exact-main CI and exact-image Stage/public validation.
