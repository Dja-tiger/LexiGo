alter table review_events
    drop constraint review_events_answer_mode_chk;

alter table review_events
    add constraint review_events_answer_mode_chk
        check (answer_mode is null or answer_mode in ('study', 'recall', 'choice')),
    add column answer_revealed boolean,
    add column event_schema_version smallint;

update review_events
set event_schema_version = 1
where event_schema_version is null;

alter table review_events
    alter column event_schema_version set not null,
    alter column event_schema_version set default 2,
    add constraint review_events_event_schema_version_chk
        check (event_schema_version in (1, 2));

alter table lesson_sessions
    drop constraint lesson_sessions_study_mode_chk;

alter table lesson_sessions
    add constraint lesson_sessions_study_mode_chk
        check (study_mode in ('study', 'recall', 'choice'));

create index review_events_user_mode_time_idx
    on review_events (user_id, answer_mode, reviewed_at desc);

comment on column review_events.rating is
    'User self-assessment: again, almost or known.';
comment on column review_events.answer_mode is
    'Exercise mode. NULL identifies pre-mode legacy events.';
comment on column review_events.correct is
    'Objective correctness. Must remain NULL for study mode.';
comment on column review_events.answer_revealed is
    'Whether the answer was visible before the attempt was persisted; unknown for schema v1.';
comment on column review_events.event_schema_version is
    'Version 1 is historical data; version 2 stores mode, self-assessment, answer visibility and objective correctness separately.';
