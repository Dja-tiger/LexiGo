# Current Task Progress

## 2026-07-27 02:15 Europe/Berlin

### Verified

- Live `main` is `370d0dccfaa9c273d11164bbce37dd71975485cd`.
- Documentation-only PR #240 is blocked by CI #2044/run `30226575552`, not by its four-path diff.
- Backend integration artifact identifies `TestLearningReviewModesAndAnalytics` as the only failed integration suite.
- Production weekly evidence uses the half-open previous-week interval `[weekStartUTC-7d, weekStartUTC)`.
- The affected request uses `timezoneOffsetMinutes=0`, so its boundaries are UTC Monday 00:00.

### Finding

- The fixture inserts previous-period events with `now() - interval '8 days'`.
- On Monday this timestamp is the Sunday of the penultimate week, outside the immediately previous-week interval.
- Retrying the same head on the same Monday cannot pass.

### Root cause

The integration fixture models a calendar bucket using a fixed duration from the current instant. Eight days ago is not invariantly inside the immediately previous ISO week.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Full failure log and integration artifact inspected.
- Production weekly-boundary implementation inspected.
- Existing Issues searched; no duplicate blocker Issue found.
- Issue #241 created and PR #240 left Draft with the blocker recorded.
- Exact-base technical branch created and read back.

### Checks failed

- PR #240 CI #2044 Backend integration failed at the Monday boundary.
- No blocker-fix CI has run yet.

### Current branch head

Resolve from live branch ref after each write.

### Next action

Replace the fixture timestamp with `date_trunc('week', now()) - interval '1 day'`, add the mandatory calendar-boundary lesson and run targeted plus full CI.
