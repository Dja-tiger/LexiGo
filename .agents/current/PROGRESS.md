# Current Task Progress

## 2026-08-04 18:55 Europe/Moscow

### Verified

- Live `main`: `c56485511c752aacd3e2f43cd0d102f229a9c25f`.
- Latest deployed product SHA before this slice: `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`; stage run `30917349721` passed deploy, public smoke and 12/12 public browser checks.
- Issue #70 is fully closed and Issue #75 is fully reconciled; active product work remains Issue #74 in Draft PR #387.
- Branch `agent/issue-74-header-touch-targets` is based on the current `main` and remains mergeable.
- Issue #74 explicitly names `Подробнее` and other text actions as controls without guaranteed minimum hit area.
- `frontend/app/system-states.css` gives live `.lx-review-sync` actions only 40px visible height and reduces active-lesson actions to 36px.
- `frontend/app/calendar-reminder-entry.css` intentionally hides the legacy routed-header `.lx-icon-button`; the initial Dictionary bell target was therefore not a live user control.

### Confirmed failure and classification

CI #2728 / run `30922599313` on superseded head `7ace030a368f107f93fa7a174e05195ad6bb8eea` passed frontend core, backend, axe, visual, performance, service-worker and PWA gates but failed UI shards 1 and 3.

Downloaded artifacts:

- `frontend-playwright-report-ui-1`, artifact `8897981374`, digest `sha256:fb3693f653142c8b30f7c411ed686907d724b8429900f79acc7ac4ebee3f4e4d`;
- `frontend-playwright-report-ui-2`, artifact `8897961032`, digest `sha256:b8aa678b6b170c602267f0515f676579392f02b9fac7d5158c135762bf5da63b`.

Desktop Chromium, iOS WebKit and Android Chromium all failed because `getByRole("button", { name: "Напоминание о занятии" })` found no element. The page and Dictionary island were healthy. Accessibility snapshots and screenshots showed the live route reminder `<summary>` plus the routed header without the hidden legacy bell.

Classification: stale test plus invalid runtime-owner selection, not a browser flake and not a production rendering failure.

### Root cause

The first slice inferred ownership from dormant JSX in `lexigo-dictionary-app.tsx` without applying the later canonical CSS rule that hides `.lx-routed-app .lx-header-tools > .lx-icon-button` as duplicate UI. The source contract proved that dead markup existed, but did not prove that it was rendered and exposed in the live accessibility tree. The E2E warning attached to Issue #74 explicitly prohibited this pattern.

### Corrected scope

- Removed the hidden Dictionary reminder CSS owner and its source/browser contracts.
- Selected the live ReviewOutbox connectivity actions, beginning with `Подробнее`, as the first concrete Issue #74 defect.
- Added `frontend/app/connectivity-touch-targets.css` after `system-states.css`.
- Preserved the existing 40px default and 36px active-lesson visible button boxes.
- Added transparent block-axis hit slop using negative inset boundaries: 44px fine pointer and 48px coarse pointer.
- Kept inline inset at zero so adjacent action targets cannot overlap horizontally.
- Added no transform, background, border, shadow or visual baseline change.
- Added a fail-closed source contract that maps the live runtime owner and rejects the hidden legacy bell.
- Added desktop Chromium, iOS WebKit and Android Chromium perimeter hit-testing against the real offline `Подробнее` action.
- Registered the corrected suite in authoritative UI and accessibility commands.

### Files in scope

- `frontend/app/connectivity-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/connectivity-touch-target-source.test.ts`
- `frontend/e2e/connectivity-touch-targets.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

Superseded branch-only files removed:

- `frontend/app/header-touch-targets.css`
- `frontend/components/header-touch-target-source.test.ts`
- `frontend/e2e/header-touch-targets.spec.ts`

### Checks completed

- Mandatory Issue, comments, Agent Harness rules and live owners re-read before corrected functional writes.
- Every new/updated/deleted path read back from the target branch after write.
- Current `main` re-read and confirmed unchanged at `c5648551…`.
- Source-level contract inputs verified against live ReviewOutbox, system-state geometry, hidden legacy selector, focus owner and package registration.
- Superseded paths verified absent from the branch.
- Local clone/test execution was unavailable because the isolated execution container could not resolve `github.com`; this is an environment limitation, not validation evidence.

### Validation pending

- New authoritative CI has not yet been registered for the corrected immutable head.
- Source contract, lint, typecheck, Vitest, build and focused browser proof remain pending in GitHub Actions.
- Full UI/a11y/axe/visual/performance/PWA/backend/container matrices remain pending.
- PR remains Draft.
- Merge, exact-SHA main CI, exact-image stage/public validation and manual real-device acceptance have not occurred.

### Next action

Read back the final eight-file diff, update PR metadata to the corrected connectivity-action scope, and track one authoritative full CI run on the final developer-authored head. Do not retry superseded CI #2728 and do not merge until every required gate is green.
