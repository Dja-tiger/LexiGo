# Learning event schema v2

## Purpose

A learning event separates the facts that were previously conflated:

1. `answer_mode` — `study`, `recall`, or `choice`;
2. `rating` — the learner's confidence (`again`, `almost`, `known`);
3. `submitted_answer` — the raw recall or choice response sent by the learner;
4. `correct` — objective correctness for recall/choice, never for study;
5. `effective_rating` — the rating that is actually applied to the scheduler;
6. `answer_revealed` — whether the answer was visible before persistence;
7. `judgement_source`, `judgement_reason`, and `matched_answer` — an auditable explanation of how correctness was determined.

New events are stored with `event_schema_version = 2`. The schema version remains v2 because the event semantics are compatible and the new columns are additive.

## Deterministic answer judgement

The server is the source of truth for objective correctness. New recall and choice clients send `submittedAnswer`; the backend loads the learning item and compares the response against curated accepted answers.

The synchronous judge is deliberately conservative and predictable:

- comparison is case-insensitive;
- Russian `ё` is normalized to `е`;
- punctuation and repeated whitespace are normalized;
- apostrophe variants are treated consistently;
- no substring, edit-distance, stemming, fuzzy or LLM-only decision is used;
- semantic and morphological variants must be explicitly curated in `words.accepted_answers`.

`words.aliases` remains a catalog/search field. An alias is not automatically a valid translation because search synonyms and pedagogically accepted answers have different semantics.

The API returns `judgementReason` and, when applicable, `matchedAnswer`, so the UI can explain why a response was accepted or rejected.

## Confidence and scheduling

`rating` is always preserved as the learner's self-assessment. It is independent from objective correctness.

For an objectively correct recall/choice response, `effective_rating` equals the requested `rating`. For an objectively incorrect response, `effective_rating` is forced to `again`, regardless of whether the learner selected `almost` or `known`. Therefore an incorrect answer cannot increase repetitions, postpone the next review, or move an item toward `mastered`.

`study` remains an exposure/self-assessment event: it may move a new item into `learning` and schedule its first near-term objective attempt, but it never increases repetitions, easiness, review status, or mastery. For an existing learning/review/mastered item, study preserves the current `due_at` exactly, so passive viewing cannot postpone an objective review. Database and HTTP constraints reject study events that claim objective correctness, contain a submitted answer, or omit `answer_revealed=true`.

## Safe answer suggestions

When a deterministic server judgement rejects a non-empty answer, the response may expose `suggestionAvailable=true`. The learner can submit the same response to the moderation queue with the associated `reviewEventId`.

A suggestion:

- must reference a real server-rejected review belonging to the same user and item;
- is deduplicated while pending;
- never changes the current review result or scheduler state;
- never mutates `accepted_answers` automatically;
- requires an explicit content moderation decision before it can become an accepted answer.

## Analytics

- `reviewsToday` and `reviewsTotal` are activity counters and include all modes.
- `successfulToday` is a rolling-deployment compatibility aggregate: verified schema-v2 objective successes plus historical schema-v1 grade-based successes.
- `objectiveReviewsToday` and `objectiveSuccessfulToday` contain only schema-v2 recall/choice data.
- `modes.study`, `modes.recall`, and `modes.choice` contain only schema-v2 events.
- `modes.legacy` contains every schema-v1 event, regardless of its historical `answer_mode` value.
- Study success is always zero because passive exposure has no objective correctness.
- Retained items require two successful schema-v2 objective attempts: one before the current week and one during it. Study and schema-v1 events are excluded.
- Confidence analytics should use `rating`; learning-state analytics should use `correct`, `effective_rating`, and the resulting scheduler state.

## Why all schema-v1 events are legacy

Before schema v2 the frontend stored the presentation mode `study` only in browser storage and sent it to the backend as `recall`. Consequently, even a schema-v1 row containing `answer_mode='recall'` cannot be trusted as objective recall. Migration `000007` preserves the row but marks it `event_schema_version=1`; analytics deliberately avoid retroactive guessing.

## Backward compatibility

- Existing rows remain readable and continue contributing to activity, streak and the compatibility field `successfulToday`.
- Existing rows are visible under `modes.legacy` instead of being falsely attributed to recall or choice.
- Old rows do not establish retained knowledge because answer visibility and objective correctness cannot be reconstructed reliably.
- Omitting `answerMode` in a request remains accepted for pre-v2 clients and is normalized to `recall`.
- Legacy objective clients may still send `correct` without `submittedAnswer`. Those events are marked with `judgement_source=legacy_client`; the server still forces an incorrect result to `effective_rating=again`.
- Requests cannot send both `submittedAnswer` and `correct`, preventing ambiguous sources of truth.
- Existing response fields remain present. New clients should use the objective judgement and effective-rating fields for accurate UX and analytics.
