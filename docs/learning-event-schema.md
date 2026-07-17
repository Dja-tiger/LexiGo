# Learning event schema v2

## Purpose

A learning event separates four facts that were previously conflated:

1. `answer_mode` — `study`, `recall`, or `choice`;
2. `rating` — the learner's self-assessment (`again`, `almost`, `known`);
3. `correct` — objective correctness for recall/choice, never for study;
4. `answer_revealed` — whether the answer was visible before persistence.

New events are stored with `event_schema_version = 2`.

## Scheduling

`recall` and `choice` use the existing spaced-repetition transition. `study` is an exposure/self-assessment event: it can move a new item into `learning` and schedule a near-term objective attempt, but it does not increase repetitions, easiness, review status, or mastery.

## Analytics

- `reviewsToday` and `reviewsTotal` remain activity counters and include all modes.
- `successfulToday` is retained as a compatibility alias for `objectiveSuccessfulToday`.
- `objectiveReviewsToday` includes recall, choice, and legacy attempts, but excludes study.
- `modes` returns separate today/total attempt and success counts for study, recall, choice, and legacy data.
- Study success is always zero because passive exposure has no objective correctness.
- Retained items require a successful objective current attempt and a successful objective attempt before the current week. Study events are excluded.

## Backward compatibility

Rows written before migration `000007` receive `event_schema_version = 1`.

- `answer_mode IS NULL` is reported as `legacy` because the original mode cannot be reconstructed.
- Schema-v1 recall/choice rows with `correct IS NULL` retain their historical grade-based success semantics.
- Omitting `answerMode` in an API request remains accepted for pre-v2 clients and is normalized to `recall`.
- Existing response fields remain present; new clients should use `objectiveReviewsToday`, `objectiveSuccessfulToday`, and `modes` for accuracy.
