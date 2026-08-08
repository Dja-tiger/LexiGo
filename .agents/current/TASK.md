# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `fix/issue-74-calendar-reminder-targets`
- Base SHA: `0969a5fdff0484d23099e66d7f4f0b31965a689c`
- Head SHA: resolve from live branch ref
- PR: #446

## Objective

Close the confirmed live calendar-reminder interaction gaps in Issue #74 without changing reminder persistence, calendar-provider behavior or approved non-custom visual states.

## Scope

- Guarantee 44px fine-pointer / 48px coarse-pointer effective target for the live route-preview `Настроить календарь` action.
- Guarantee 44/48px effective target for the calendar modal `Закрыть` button while preserving its 42px painted box.
- Guarantee 44/48px effective targets and non-overlap for all seven custom weekday buttons.
- Reflow custom weekday buttons to four columns on compact widths so independent targets fit at 320–390px.
- Add collected desktop Chromium, Android Chromium and iOS WebKit hit-ownership acceptance.
- Record the confirmed scroll-coordinate acceptance failure exposed by CI #3077 as a mandatory reusable geometry rule.

## Non-goals

- No dead `CalendarReminderIntegration(showCard=true)` card contract; all live callers pass `showCard={false}`.
- No calendar persistence, ICS, Google/Apple provider or dialog lifecycle changes.
- No provider-button or form-control changes; those already exceed 48px.
- No route-reminder disclosure change; it already has a 48px production target.
- No dependency, workflow or visual-baseline update unless deterministic product evidence requires it.
- No `.agents/PROJECT_STATE.md` change in this product PR.

## Allowed paths

- `frontend/app/calendar-reminders.css` — canonical compact weekday layout owner only
- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/calendar-reminder-touch-targets.css`
- `frontend/app/layout.tsx` — stylesheet import only
- `frontend/e2e/calendar-reminder-touch-targets.spec.ts`
- `frontend/package.json` — UI/a11y collection registration only
- `.agents/AGENTS.md` — mandatory specialized-rule index entry only
- `.agents/AGENTS.issue-74-scroll-normalized-geometry.md` — confirmed CI geometry lesson only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `.agents/PROJECT_STATE.md`
- Backend/API/migrations.
- Calendar persistence/provider implementation.
- Dependency versions or lockfile.
- Existing visual snapshots without deterministic product evidence.

## Runtime owners

- `frontend/components/calendar-reminder-route-entry.tsx`
- `frontend/components/calendar-reminder-integration.tsx`
- `frontend/app/calendar-reminders.css`
- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/calendar-reminder-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/calendar-reminder-touch-targets.spec.ts`

## Documentation owners

- `.agents/AGENTS.md`
- `.agents/AGENTS.issue-74-scroll-normalized-geometry.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Existing exact accessible names and native button semantics are unchanged.
- Calendar settings storage, dialog focus lifecycle and provider callbacks are unchanged.
- Route disclosure remains independently operable from streak/profile targets.
- Dead/inaccessible controls are not mounted or made reachable solely to satisfy acceptance.
- Hit slop is transparent and does not create inline overlap.
- Seven weekday targets never intersect at compact widths.
- Compact weekday grid/gap remain owned by `calendar-reminders.css`; the dedicated touch-target stylesheet owns only paint-inert modal hit surfaces.
- Pairwise geometry is compared only in one common coordinate frame; scrolling one candidate must not invalidate previously sampled rectangles.

## Acceptance criteria

- Live route-preview action exposes >=44px fine / >=48px coarse effective height and real perimeter hit ownership.
- Modal close exposes >=44x44 fine / >=48x48 coarse effective target with all four perimeter points owned by the button.
- Every weekday exposes >=44x44 fine / >=48x48 coarse effective target.
- Weekday effective rectangles do not intersect at 320/390px compact widths.
- Keyboard focus remains visible and opening/configuring the dialog retains existing behavior.
- No horizontal overflow.
- Acceptance is explicitly collected by authoritative UI and accessibility suites.

## Required checks

- Frontend lint/typecheck/unit/build and production dependency audit.
- Authoritative UI/a11y browser matrix.
- Full immutable-head product CI including visual, performance, CSP/PWA and container gates.
- Clean review/thread audit before Ready.
- Expected-head squash merge.
- Exact-SHA main CI and exact-image Stage/public validation.

## Risks

- Pseudo hit slop can overlap neighboring weekday rows if compact row gaps are insufficient.
- Modal-close hit slop must stay within an unobstructed modal header area.
- Compact weekday reflow is a deliberate custom-state presentation change and must remain horizontally contained.
- Viewport-relative geometry sampled across separate scroll states can manufacture false overlap; cross-target comparisons must use one scroll state or a normalized coordinate system.

## Rollback

Revert the calendar target CSS additions, compact weekday reflow, dedicated acceptance spec and its collection entries; reminder behavior remains otherwise unchanged.
