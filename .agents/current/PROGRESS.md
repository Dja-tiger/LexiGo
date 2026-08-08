# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Exact product/docs base is `0969a5fdff0484d23099e66d7f4f0b31965a689c`; deployed product image remains `2b835258477e05f00a7f29fd6972e62853dea1f9`.
- `.agents/current/*` was canonical idle before this slice.
- Existing route reminder disclosure already paints at least 48px; provider buttons and form controls are at least 48px.
- Live residual gaps are the route-preview `Настроить календарь` action at routed 44px, modal close at 42x42 and weekday buttons at 42px / 39px at <=440px.
- Seven independent weekday targets cannot satisfy 44/48px width in one 320-390px row without compact reflow.
- All live callers of `CalendarReminderIntegration` pass `showCard={false}`; `.lx-calendar-reminder-card` is not a reachable production surface.

### Finding

The coherent live Issue #74 calendar slice is route preview + modal close + custom weekdays. Dead card markup must not be mounted or made reachable solely to satisfy acceptance.

### Root cause and classified CI

- CI #3064 / run `31275409335` on `af6bafbab9da5257762407553dc685bdb8c877b1` failed Frontend core because unrelated root-shell movement escaped the allowed `layout.tsx` import-only scope and because compact weekday presentation was placed in the new hit-target stylesheet, creating fail-closed CSS ownership conflicts. Both defects were fixed at their real owners.
- CI #3073 / run `31276456917` on `f372b5966a3718e5202c32b9956d7a020af27dd7` passed frontend core/build/audit, backend, accessibility, CSP, service worker, PWA keyboard, performance, visual regression, lesson completion and UI shard 2/2. UI shard 1/2 failed deterministically in the new calendar acceptance.
- The downloaded Playwright artifact `frontend-playwright-report-ui-1` proved the CI #3073 failure occurred before any hit-geometry assertion: the spec expected `.lx-calendar-reminder-card` on `/progress`, but the live route does not render that card. It was a stale reachability assumption, not evidence of pointer overlap or production CSS failure.
- Following the existing Issue #74 hidden-control precedent, the dead card assertion and its dedicated hit-area CSS were removed rather than adding a synthetic fixture or weakening Playwright actionability.
- CI #3075 / run `31277262935` on `513a54b9a7e2bf8b1e824b8026a81dda9db8570c` passed Frontend core, backend unit/integration, Content Security, UI shard 1/2, accessibility and iOS PWA dictionary, but UI shard 2/2 failed in the calendar acceptance on Android Chromium and iOS WebKit, including CI retries.
- Downloaded artifact `frontend-playwright-report-ui-2` / artifact `9027459472` proved all individual coarse-pointer weekday minimum-size and perimeter-hit assertions had already passed. The failure was only `weekday targets 0 and 4 must remain independent`.
- The trace showed `.lx-calendar-modal` scrolling while individual weekday rectangles were sampled: an earlier frame used `scrollTop=265`, while a later sample used `scrollTop=314`. The test stored viewport-relative `getBoundingClientRect()` values across those different scroll states, manufacturing a false overlap between row 1 and row 2.
- Production CSS was therefore not changed. The acceptance now keeps the individual actionability/real-hit checks, then re-samples all seven effective target rectangles together through one `evaluateAll` call before pairwise non-overlap comparison.
- The confirmed coordinate-frame failure is recorded in `.agents/AGENTS.issue-74-scroll-normalized-geometry.md` and indexed as mandatory project guidance.

### Changed files

- `frontend/app/calendar-reminders.css`
- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/calendar-reminder-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/calendar-reminder-touch-targets.spec.ts`
- `frontend/package.json`
- `.agents/AGENTS.md`
- `.agents/AGENTS.issue-74-scroll-normalized-geometry.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Source audit confirms form/provider controls and route disclosure need no remediation.
- Dedicated acceptance is registered in both authoritative UI and accessibility collections.
- Root shell is restored to `main` ownership; `layout.tsx` product diff is stylesheet import only.
- Compact 4+3 weekday layout is owned by `calendar-reminders.css`; dedicated touch-target CSS owns only paint-inert modal close/weekday surfaces.
- CI #3073 proves the earlier recovery head passed every executed product gate except the stale dead-card assumption in UI shard 1/2; visual baselines remained unchanged.
- CI #3075 proves the live-only head passed the individual 48px real-hit contract in both failing mobile browser traces; the remaining failure was stale cross-scroll coordinate comparison, not a target-size or overlap defect.

### Checks failed

- CI #3064: classified Frontend source-contract failures on superseded head `af6bafbab9da5257762407553dc685bdb8c877b1`.
- CI #3073: classified stale reachability assumption on superseded head `f372b5966a3718e5202c32b9956d7a020af27dd7`; no retry of that head is valid.
- CI #3075: classified stale viewport-coordinate comparison on superseded head `513a54b9a7e2bf8b1e824b8026a81dda9db8570c`; no production CSS remediation or blind retry is valid.

### Current branch head

Resolve from live branch ref after the final Agent Harness execution record is written.

### Next action

Require a fresh full immutable-head CI with the common-coordinate geometry repair and mandatory lesson present. If green, complete clean review/thread audit, mark PR Ready, expected-head squash merge, exact-main CI and exact-image Stage/public validation, then reconcile Agent Harness state in a separate docs PR.
