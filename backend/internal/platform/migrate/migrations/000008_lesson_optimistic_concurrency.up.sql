alter table lesson_sessions
    add column version bigint not null default 1,
    add constraint lesson_sessions_version_chk check (version > 0);

comment on column lesson_sessions.version is
    'Monotonic optimistic-concurrency version. Every lesson mutation increments it.';
