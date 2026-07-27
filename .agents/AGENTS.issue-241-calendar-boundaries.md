# Calendar-boundary-safe time fixtures

## Scope

This rule applies to tests and fixtures for daily, weekly, monthly, retention, due-window and timezone-derived evidence.

## Confirmed failure

On 2026-07-27, CI #2044/run `30226575552` failed in `TestLearningReviewModesAndAnalytics` while PR #240 changed documentation only.

The fixture intended to seed the immediately previous week with:

```sql
now() - interval '8 days'
```

On Monday, eight days earlier is Sunday in the penultimate ISO week. Production correctly returned zero `PreviousRecallAttempts`, so retrying the same head could not pass.

## Mandatory rule

Never represent a calendar bucket with a fixed-duration subtraction from `now()` unless the assertion is explicitly about elapsed duration.

For a calendar bucket:

1. Resolve the same timezone/offset used by the production request.
2. Derive the exact bucket boundary.
3. Place fixtures inside the intended half-open interval `[start, end)`.
4. Verify start-inclusive and end-exclusive semantics.
5. Consider Monday/week, month, year and DST boundaries before approving the fixture.

For the UTC previous-week evidence used by `timezoneOffsetMinutes=0`, a safe in-bucket timestamp is:

```sql
date_trunc('week', now()) - interval '1 day'
```

This is always the Sunday immediately before the current UTC Monday boundary.

## Regression gate

- `backend/integration/review_modes_test.go` must pass on every weekday.
- The expected previous-week Recall evidence remains one attempt, one success and 100% rate.
- Production `learning.Repository.Progress` must not be changed to accommodate an invalid fixture.
- A same-head retry is allowed only after the failure is classified as transient; a deterministic calendar-boundary failure requires a source fix.

## Reusable lesson

Calendar semantics are boundary semantics, not duration semantics. Seed tests from the production interval, not from a convenient number of hours or days before the current instant.
