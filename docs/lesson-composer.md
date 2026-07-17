# Lesson composer

## Contract

Persisted lessons are composed on the server when `wordIds` is omitted from `POST /api/v1/lessons`. Explicit IDs remain supported for manual phrase/topic selections. `POST /api/v1/lessons/preview` invokes the same candidate query and composition algorithm without creating or discarding a lesson session.

## Deterministic mixed queue

Candidates are split into word and phrase queues. Each queue is ordered by:

1. due items;
2. new items;
3. already scheduled, not-yet-due items;
4. `due_at` and item ID as deterministic tie-breakers.

The composer alternates word and phrase queues one-for-one. The kind with more due items starts; ties start with a word. This prevents a large backlog of one kind from starving the other while still guaranteeing that due items are selected before new items of the same kind. If one kind is unavailable, the lesson continues with the other and preview returns a machine-readable fallback code.

Recall and choice modes query only due candidates. Study mode can fill remaining capacity with new and scheduled candidates. Lesson sizes remain capped at 1000 for `all`.

## Compatibility with adaptive queue work

The composer is intentionally independent of onboarding and personalization from Issue #18. Future ranking reasons such as weak topic or recent failure can be inserted into the per-kind priority comparator without changing the lesson session, review, optimistic-concurrency or frontend navigation contracts.

## Performance

Preview and create each use one indexed `user_words`/`words` join and in-memory ordering over the selected source. Preview uses a repeatable-read read-only snapshot. Creation composes and inserts items in the existing lesson transaction; no polling, extra tables or per-item round trips are introduced.
