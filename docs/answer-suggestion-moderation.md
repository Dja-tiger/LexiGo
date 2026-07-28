# Answer suggestion moderation

## Ownership

`learning` owns deterministic judgement, scheduler updates and safe user submission to `answer_suggestions`. `moderation` is the only owner of administrative queue reads, terminal decisions, audit, operational metrics and raw-answer retention.

A moderation decision never updates the referenced `review_events` row or historical `user_words` scheduling state. Acceptance affects only future deterministic judgements by adding one normalized-unique value to `words.accepted_answers`.

## Authorization

Moderation routes require both:

1. a bearer token whose credential epoch is successfully revalidated against PostgreSQL;
2. the authenticated account's current normalized email in `CONTENT_ADMIN_EMAILS`.

The allowlist is comma-separated, normalized and validated at startup. An empty allowlist is valid and fail-closed: every moderation request returns `403`. Real identities belong only in environment configuration, never in Git.

Changing an account email immediately changes the authorization result because the server resolves the current email for every request.

## Operational API

- `GET /api/v1/admin/answer-suggestions` returns at most 100 records with keyset pagination. Filters are bounded to status, exercise kind, item text and an RFC3339 upper time boundary.
- `GET /api/v1/admin/answer-suggestions/metrics` returns pending count, oldest pending timestamp and age in seconds, terminal totals/rate and expired-row counts.
- `POST /api/v1/admin/answer-suggestions/{id}/decision` requires `expectedVersion`, a terminal decision and a controlled reason.

Responses containing raw learner answers use `Cache-Control: no-store`.

Accepted reason:

- `valid_variant`.

Rejected reasons:

- `incorrect`;
- `duplicate`;
- `unsafe`;
- `irrelevant`;
- `insufficient_context`.

Comments are optional and limited to 1,000 Unicode characters.

## Transaction and concurrency contract

The decision transaction locks both the pending suggestion and its learning item.

1. Verify `status=pending` and the exact expected version.
2. For acceptance, run the existing deterministic judge against canonical and curated answers.
3. Append the submitted value only when no normalized match already exists.
4. Move the suggestion to its terminal state and increment the version.
5. Insert the immutable audit snapshot with actor UUID, controlled reason, comment and before/after accepted-answer arrays.
6. Commit all changes together.

A repeated or concurrent decision returns `409 suggestion_version_conflict`. At most one request using a given version can commit.

## Privacy and retention

Raw submitted answers may contain workplace terminology and are treated as personal content.

- pending suggestions: maximum 90 days;
- accepted/rejected suggestions and audit snapshots: maximum 365 days after decision;
- learner account deletion: immediate cascade removal of that learner's suggestions and audit rows;
- moderator deletion: the bounded audit retains only the stable actor UUID snapshot, not email or display name;
- an accepted variant remains in `words.accepted_answers` as de-identified curated dictionary content; after suggestion/audit deletion it has no learner or moderator association;
- logs contain suggestion ID, actor UUID, decision/reason and `answerAdded`; they never contain the raw answer or comment.

The retention worker runs every six hours by default. It uses one PostgreSQL advisory lock across replicas, deletes in bounded `1,000 × 20` batches and exposes overdue counts through the admin metrics endpoint. Configuration may disable the worker only for controlled maintenance; the policy and overdue alert remain applicable.

## Incident procedure

1. If `expiredPendingCount` or `expiredDecidedCount` is non-zero beyond one cleanup interval, inspect the structured `answer suggestion retention cleanup failed` event.
2. Verify PostgreSQL health and that exactly one replica can obtain the advisory lock.
3. Do not run unbounded manual deletes. Restore the worker or execute the same ordered, limited predicate in controlled batches.
4. If an unauthorized response is suspected, clear `CONTENT_ADMIN_EMAILS`, redeploy to fail closed, revoke affected sessions and audit access logs by request ID.
5. A mistaken terminal decision is not overwritten. Create a separate curated-content correction with its own audit evidence; never rewrite the historical review event.

## Required validation

- unit tests for filters, cursor, controlled decisions and retention policy;
- authorization tests for unauthenticated, ordinary and allowlisted accounts;
- PostgreSQL integration for pagination/context, normalized dedupe, accept/reject audit, immutable review/scheduler and concurrent conflict;
- migration, race, OpenAPI, full CI, container and exact-SHA stage gates.
