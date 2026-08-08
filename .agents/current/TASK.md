# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `fix/issue-74-calendar-reminder-targets`
- Base SHA: `0969a5fdff0484d23099e66d7f4f0b31965a689c`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Close the confirmed calendar-reminder interaction gaps in Issue #74 without changing reminder persistence, calendar-provider behavior or approved non-custom visual states.

## Scope

- Guarantee 44px fine-pointer / 48px coarse-pointer effective targets for the route preview and Progress-card `Настроить календарь` actions.
- Guarantee 44/48px effective target for the calendar modal `Закрыть` button while preserving its 42px painted box.
- Guarantee 44/48px effective targets and non-overlap for all seven custom weekday buttons.
- Reflow custom weekday buttons to four columns on compact widths so independent targets fit at 320–390px.
- Add collected desktop Chromium, Android Chromium and iOS WebKit hit-ownership acceptance.

## Non-goals

- No calendar persistence, ICS, Google/Apple provider or dialog lifecycle changes.
- No provider-button or form-control changes; those already exceed 48px.
- No route-reminder disclosure change; it already has a 48px production target.
- No dependency, workflow or visual-baseline update unless deterministic product evidence requires it.
- No `.agents/PROJECT_STATE.md` change in this product PR.

## Allowed paths

- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/calendar-reminders.css`
- `frontend/e2e/calendar-reminder-touch-targets.spec.ts`
- `frontend/package.json` — UI/a11y collection registration only
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
- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/calendar-reminders.css`
- `frontend/e2e/calendar-reminder-touch-targets.spec.ts`

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Existing exact accessible names and native button semantics are unchanged.
- Calendar settings storage, dialog focus lifecycle and provider callbacks are unchanged.
- Route disclosure remains independently operable from streak/profile targets.
- Hit slop is transparent and does not create inline overlap.
- Seven weekday targets never intersect at compact widths.

## Acceptance criteria

- Route preview and contextual Progress-card actions expose >=44px fine / >=48px coarse effective height and real perimeter hit ownership.
- Modal close exposes >=44x44 fine / >=48x48 coarse effective target with all four perimeter points owned by the button.
- Every weekday exposes >=44x44 fine / >=48x48 coarse effective target.
- Weekday effective rectangles do not intersect at 320/390px compact widths.
- Keyboard focus remains visible and opening/closing/configuring the dialog retains existing behavior.
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

## Rollback

Revert the calendar target CSS additions, compact weekday reflow, dedicated acceptance spec and its collection entries; reminder behavior remains otherwise unchanged.
