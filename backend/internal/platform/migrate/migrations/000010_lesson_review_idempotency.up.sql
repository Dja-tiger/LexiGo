create table lesson_review_idempotency (
    user_id uuid not null references users(id) on delete cascade,
    idempotency_key uuid not null,
    request_hash bytea not null,
    lesson_id uuid not null references lesson_sessions(id) on delete cascade,
    word_id bigint not null references words(id) on delete cascade,
    response jsonb not null,
    created_at timestamptz not null default now(),
    primary key (user_id, idempotency_key),
    constraint lesson_review_idempotency_request_hash_length
        check (octet_length(request_hash) = 32)
);

create index lesson_review_idempotency_lesson_created_idx
    on lesson_review_idempotency (lesson_id, created_at desc);
