create table lesson_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    source text not null,
    study_mode text not null,
    lesson_size text not null,
    current_index integer not null default 0,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz,
    constraint lesson_sessions_source_chk
        check (source in ('mixed', 'noun', 'verb', 'adjective')),
    constraint lesson_sessions_study_mode_chk
        check (study_mode in ('recall', 'choice')),
    constraint lesson_sessions_lesson_size_chk
        check (lesson_size in ('15', '30', '60', 'all')),
    constraint lesson_sessions_current_index_chk
        check (current_index >= 0),
    constraint lesson_sessions_status_chk
        check (status in ('active', 'completed', 'discarded'))
);

create unique index lesson_sessions_one_active_per_user_idx
    on lesson_sessions (user_id)
    where status = 'active';

create index lesson_sessions_user_updated_idx
    on lesson_sessions (user_id, updated_at desc);

create table lesson_session_items (
    session_id uuid not null references lesson_sessions(id) on delete cascade,
    position integer not null,
    word_id bigint not null references words(id) on delete cascade,
    rating text,
    reviewed_at timestamptz,
    primary key (session_id, position),
    unique (session_id, word_id),
    constraint lesson_session_items_position_chk check (position >= 0),
    constraint lesson_session_items_rating_chk
        check (rating is null or rating in ('again', 'almost', 'known'))
);

create index lesson_session_items_session_word_idx
    on lesson_session_items (session_id, word_id);
