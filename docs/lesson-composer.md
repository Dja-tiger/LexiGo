# Lesson composer

## Contract

Persisted lessons are composed on the server when `wordIds` is omitted from `POST /api/v1/lessons`. Explicit IDs remain supported for manual phrase/topic selections. `POST /api/v1/lessons/preview` invokes the same candidate query and composition algorithm without creating or discarding a lesson session.

## Deterministic mixed queue

Candidates are assigned to three global priority tiers:

1. due reviews: `status <> new` and `due_at <= now()`;
2. new items;
3. already scheduled, not-yet-due items.

The composer exhausts an entire higher-priority tier before selecting from the next tier. Inside each tier, word and phrase queues are ordered by `due_at` and item ID, then alternated one-for-one. The first non-empty tier starts with the kind that has more candidates; ties start with a word. Subsequent tiers start with the opposite of the previously selected kind when possible, preserving alternation across tier boundaries.

This gives due reviews a strict global barrier: a new word cannot be inserted while a due phrase remains, and a new phrase cannot be inserted while a due word remains. At the same time, a large backlog of one kind cannot permanently starve the other inside the same priority tier.

If one kind is unavailable, the lesson continues with the available kind and preview returns one of `words_only`, `phrases_only` or `empty`. Newly assigned items have `due_at = now()` for compatibility with existing recall flows, but remain classified as `new`, not as due reviews.

Recall and choice modes query candidates whose `due_at <= now()`; actual due reviews still precede new candidates. Study mode can fill remaining capacity with new and scheduled candidates. Lesson sizes remain capped at 1000 for `all`.

## Compatibility with adaptive queue work

The composer is intentionally independent of onboarding and personalization from Issue #18. Future ranking reasons such as weak topic or recent failure can be introduced as additional global priority tiers without changing lesson sessions, review events, optimistic concurrency or frontend navigation contracts.

## Performance

Preview and create each use one indexed `user_words`/`words` join and in-memory ordering over the selected source. Preview uses a repeatable-read read-only snapshot. Creation composes and inserts items in the existing lesson transaction; no polling, extra tables or per-item round trips are introduced.
