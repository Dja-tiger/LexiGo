# Learning event schema v2

## Purpose

A learning event separates four facts that were previously conflated:

1. `answer_mode` — `study`, `recall`, or `choice`;
2. `rating` — the learner's self-assessment (`again`, `almost`, `known`);
3. `correct` — objective correctness for recall/choice, never for study;
4. `answer_revealed` — whether the answer was visible before persistence.

New events are stored with `event_schema_version = 2`.

## Scheduling

`recall` and `choice` use the spaced-repetition transition. `study` is an exposure/self-assessment event: it may move a new item into `learning` and schedule its first near-term objective attempt, but it never increases repetitions, easiness, review status, or mastery. For an existing learning/review/mastered item, study preserves the current `due_at` exactly, so passive viewing cannot postpone an objective review. Database and HTTP constraints reject schema-v2 study events that claim objective correctness or omit `answer_revealed=true`.

## Analytics

- `reviewsToday` and `reviewsTotal` are activity counters and include all modes.
- `successfulToday` is a rolling-deployment compatibility aggregate: verified schema-v2 objective successes plus historical schema-v1 grade-based successes.
- `objectiveReviewsToday` and `objectiveSuccessfulToday` contain only schema-v2 recall/choice data.
- `modes.study`, `modes.recall`, and `modes.choice` contain only schema-v2 events.
- `modes.legacy` contains every schema-v1 event, regardless of its historical `answer_mode` value.
- Study success is always zero because passive exposure has no objective correctness.
- Retained items require two successful schema-v2 objective attempts: one before the current week and one during it. Study and schema-v1 events are excluded.

## Why all schema-v1 events are legacy

Before schema v2 the frontend stored the presentation mode `study` only in browser storage and sent it to the backend as `recall`. Consequently, even a schema-v1 row containing `answer_mode='recall'` cannot be trusted as objective recall. Migration `000007` preserves the row but marks it `event_schema_version=1`; analytics deliberately avoid retroactive guessing.

## Backward compatibility

- Existing rows remain readable and continue contributing to activity, streak and the compatibility field `successfulToday`.
- Existing rows are visible under `modes.legacy` instead of being falsely attributed to recall or choice.
- Old rows do not establish retained knowledge because answer visibility and objective correctness cannot be reconstructed reliably.
- Omitting `answerMode` in a request remains accepted for pre-v2 clients and is normalized to `recall`; accurate mode analytics require a schema-v2 client.
- Existing response fields remain present. New clients should use `objectiveReviewsToday`, `objectiveSuccessfulToday`, and `modes` for accurate analytics.
