# Current Task Execution

## Task

- Branch: `fix/issue-74-calendar-reminder-targets`
- Base SHA: `0969a5fdff0484d23099e66d7f4f0b31965a689c`
- Head SHA: resolve from live branch ref
- PR: #446

## Skills used

### GitHub repository harness / Issue #74 target delivery

Purpose:

Audit the remaining live calendar-reminder interaction surface and deliver one bounded production slice with fail-closed cross-browser target evidence.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md` and mandatory specialized instructions
- `.agents/AGENTS.issue-74-browser-zoom-collection.md`
- `.agents/AGENTS.issue-74-scroll-normalized-geometry.md`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/AGENTS.issue-261-css-specificity.md`
- `.agents/AGENTS.tool-selection.md`
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `docs/agent-harness.md`

Version or verification date:

2026-08-08 Europe/Moscow; exact base `0969a5fdff0484d23099e66d7f4f0b31965a689c`.

Inputs:

- Live Issue #74 acceptance criteria and prior delivery history.
- Calendar route-entry/integration components, calendar CSS and dialog/entry browser tests.
- CI #3064 / run `31275409335` source-contract logs.
- CI #3073 / run `31276456917` UI shard artifact `frontend-playwright-report-ui-1`.
- CI #3075 / run `31277262935` UI shard artifact `frontend-playwright-report-ui-2` / artifact `9027459472` and Android/iOS Playwright traces.

Files inspected:

- `frontend/components/calendar-reminder-route-entry.tsx`
- `frontend/components/calendar-reminder-integration.tsx`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/lexigo-profile-app.tsx`
- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/calendar-reminders.css`
- `frontend/app/calendar-reminder-touch-targets.css`
- `frontend/app/global-feature-style-overlap-source.test.ts`
- `frontend/app/global-feature-style-overlap-manifest.json`
- `frontend/components/application-error-boundary.test.ts`
- `frontend/e2e/calendar-reminder-entry.spec.ts`
- `frontend/e2e/calendar-dialog-accessibility.spec.ts`
- `frontend/e2e/calendar-reminder-touch-targets.spec.ts`
- `frontend/e2e/support/quality-gates.ts`
- `frontend/package.json`
- `frontend/app/layout.tsx`

Actions performed:

- Excluded already-compliant route disclosure, form controls and Google/Apple provider buttons.
- Added transparent coarse hit slop to the live routed 44px preview action.
- Added transparent 44/48px owner to the painted 42px close control.
- Added weekday hit slop plus compact 4+3 reflow so seven 44/48px targets remain independent at 320–390px.
- Added browser acceptance measuring border+pseudo effective geometry, real perimeter ownership, pairwise weekday non-overlap, focus-visible and overflow in desktop Chromium, Android Chromium and iOS WebKit; registered it in authoritative UI/a11y collections.
- Classified CI #3064 and restored unrelated `layout.tsx` root-shell ownership; moved compact weekday presentation to canonical `calendar-reminders.css` rather than weakening the CSS conflict inventory.
- Classified CI #3073 from its downloaded Playwright report. The failing locator was `.lx-calendar-reminder-card` before geometry checks; all production callers of `CalendarReminderIntegration` use `showCard={false}`.
- Removed the dead-card assertion and dead-card hit CSS instead of fabricating a fixture or making inaccessible product UI reachable solely for acceptance.
- Classified CI #3075 from downloaded artifact `9027459472`. Android Chromium and iOS WebKit both passed every individual 48px minimum and perimeter-hit assertion, then failed only the pairwise non-overlap comparison between weekday 0 and weekday 4.
- Read the retained trace snapshots and confirmed that `.lx-calendar-modal` changed scroll position while viewport-relative weekday rectangles were being accumulated (`scrollTop=265` in an earlier sample and `scrollTop=314` in a later sample).
- Repaired the acceptance owner rather than production CSS: individual target checks may still scroll for real hit testing, but all seven weekday rectangles are now re-sampled together through one `evaluateAll` call before cross-target overlap comparison.
- Added and indexed `.agents/AGENTS.issue-74-scroll-normalized-geometry.md` so future browser geometry acceptance cannot compare stale viewport coordinate frames.

Commands or procedures:

GitHub connector exact-ref audit, repository/code search, exact-file reads, Actions run/job/artifact inspection, downloaded Playwright report/trace inspection, bounded branch writes and mandatory post-write file/head/default-branch verification.

Artifacts produced:

- `frontend/app/calendar-reminder-touch-targets.css`
- `frontend/e2e/calendar-reminder-touch-targets.spec.ts`
- compact 4+3 weekday presentation in `frontend/app/calendar-reminders.css`
- route-preview target owner in `frontend/app/calendar-reminder-entry.css`
- root stylesheet import and UI/a11y collection entries
- `.agents/AGENTS.issue-74-scroll-normalized-geometry.md`
- current Agent Harness records

Result:

Three superseded candidates were rejected for deterministic, classified reasons. The current candidate preserves the 44/48px minimum, real perimeter hit ownership and pairwise non-overlap contract while removing stale reachability and stale-coordinate assumptions. It requires one fresh full immutable-head CI before delivery.

Failures:

- CI #3064 / `af6bafbab9da5257762407553dc685bdb8c877b1`: root-shell scope drift plus unclassified CSS ownership conflicts.
- CI #3073 / `f372b5966a3718e5202c32b9956d7a020af27dd7`: stale dead-card reachability assumption in the new UI acceptance; all other executed product gates passed.
- CI #3075 / `513a54b9a7e2bf8b1e824b8026a81dda9db8570c`: stale viewport-coordinate comparison across different bottom-sheet scroll states; individual 48px target and real-hit assertions passed before the false overlap failure.

Root cause:

The live calendar reminder surface predates the Issue #74 44/48px effective-target contract. Separately, the initial acceptance inventory treated a dormant `showCard` branch as live even though route/profile owners explicitly pass `false`, and a later version compared `getBoundingClientRect()` samples captured after separate scroll operations as though they shared one coordinate frame. Fail-closed browser evidence exposed both test-contract defects without requiring product CSS weakening.

Fallback:

If the next browser run fails, inspect exact geometry/hit owner and trace artifact before changing production CSS. Do not weaken 44/48px minima, omit required browsers, force clicks, synthesize dead UI, allow intersecting weekday targets, compare cross-scroll viewport rectangles, silence CSS ownership with a manifest exception, or update snapshots without deterministic product evidence.

Limitations:

Automated browser and Stage evidence cannot satisfy the final physical-device acceptance criterion of Issue #74.

Reusable lesson:

Reachability is part of acceptance ownership: a target must be proven on a live product path, not by manufacturing dormant markup. Geometry is also coordinate-frame scoped: individual actionability checks may scroll a nested owner, but cross-target overlap must be measured from one shared scroll state or normalized coordinate space.
