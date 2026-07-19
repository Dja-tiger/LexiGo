create table lesson_review_idempotency (
    user_id uuid not null references users(id) on delete cascade,
    idempotency_key uuid not null,
    request_hash bytea not null,
    lesson_id uuid not null references lesson_sessions(id) on delete cascade,
    word_id bigint not null references words(id) on delete cascade,
    response jsonb not null,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '30 days'),
    primary key (user_id, idempotency_key),
    constraint lesson_review_idempotency_request_hash_length
        check (octet_length(request_hash) = 32),
    constraint lesson_review_idempotency_expiry_after_creation
        check (expires_at > created_at)
);

create index lesson_review_idempotency_lesson_created_idx
    on lesson_review_idempotency (lesson_id, created_at desc);

create index lesson_review_idempotency_expiry_idx
    on lesson_review_idempotency (expires_at);
