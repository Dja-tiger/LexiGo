# Lesson concurrency and navigation

## Contract

An active lesson is a server-owned linear state machine. The browser may display only `currentIndex` returned by the backend and may advance only to the exact `lessonCurrentIndex` returned after a committed review. Backward navigation and related-item jumps are deliberately disabled until the session is completed.

Every `lesson_sessions` row has a monotonic `version` starting at 1. A review request contains `lessonVersion`; discard uses `If-Match`. The mutation locks the session row, compares the expected version and increments it in the same transaction as the item review/status update. A stale device receives `409 lesson_version_conflict` and must reload `/api/v1/lessons/active`.

## Safety properties

- An unexpected item cannot be reviewed because position, rating, lesson mode and version are checked under row locks.
- A duplicate or stale request cannot create a second review event.
- Session and item arrays are returned from a repeatable-read snapshot.
- An active snapshot is rejected if positions are non-contiguous, `currentIndex` is negative or outside the item array, a prior item is unrated, or the current/future items are already rated.
- A completed snapshot is accepted only when every item is rated and `currentIndex` equals the item count.
- The frontend never clamps or invents an invalid server index.
- Creating a new lesson or discarding the current lesson invalidates prior device versions.

## Compatibility

Migration `000008` assigns version 1 to existing sessions. Old clients can still read lessons but cannot mutate them without a version precondition; this is intentional because unversioned writes are unsafe in multi-device use.

## Rollout and observability

Deploy the database migration before or together with the API. During rolling deployment, track `lesson_version_conflict`, `lesson_invalid_state`, `lesson_item_out_of_order` and `active_lesson_not_found` response counts. A short increase in version conflicts is expected when an older browser tab resumes; invalid-state responses should remain zero and require investigation because the API deliberately fails closed instead of repairing persisted lesson order in memory.
