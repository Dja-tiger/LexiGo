create extension if not exists pgcrypto;

create table users (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    password_hash text not null,
    display_name text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint users_email_normalized_chk check (email = lower(trim(email)))
);

create unique index users_email_unique_idx on users (email);

create table refresh_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    token_hash bytea not null unique,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    created_at timestamptz not null default now(),
    user_agent text not null default '',
    ip_address inet
);

create index refresh_tokens_user_active_idx
    on refresh_tokens (user_id, expires_at)
    where revoked_at is null;

create table words (
    id bigserial primary key,
    lemma text not null,
    translation text not null,
    phonetic text not null default '',
    part_of_speech text not null default '',
    topic text not null default 'general',
    examples jsonb not null default '[]'::jsonb,
    source text not null default 'manual',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index words_lemma_translation_unique_idx
    on words (lower(lemma), lower(translation));

create table user_words (
    user_id uuid not null references users(id) on delete cascade,
    word_id bigint not null references words(id) on delete cascade,
    status text not null default 'new',
    easiness numeric(4,2) not null default 2.50,
    interval_days integer not null default 0,
    repetitions integer not null default 0,
    due_at timestamptz not null default now(),
    last_reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, word_id),
    constraint user_words_status_chk check (status in ('new', 'learning', 'review', 'mastered')),
    constraint user_words_easiness_chk check (easiness >= 1.30),
    constraint user_words_interval_chk check (interval_days >= 0),
    constraint user_words_repetitions_chk check (repetitions >= 0)
);

create index user_words_due_idx on user_words (user_id, due_at);

create table review_events (
    id bigserial primary key,
    user_id uuid not null references users(id) on delete cascade,
    word_id bigint not null references words(id) on delete cascade,
    grade smallint not null,
    response_ms integer,
    reviewed_at timestamptz not null default now(),
    constraint review_events_grade_chk check (grade between 0 and 5),
    constraint review_events_response_ms_chk check (response_ms is null or response_ms >= 0)
);

create index review_events_user_time_idx on review_events (user_id, reviewed_at desc);
