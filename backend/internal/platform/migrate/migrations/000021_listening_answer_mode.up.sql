-- Issue #481 / Parent #25 Phase 1
--
-- `listening` is a new first-class objective exercise mode. This migration
-- deliberately changes only the allowed-value constraints: existing review
-- rows remain untouched, so historical typed `recall` events keep their
-- original semantics.

alter table review_events
    drop constraint if exists review_events_answer_mode_chk;

alter table review_events
    add constraint review_events_answer_mode_chk
    check (
        answer_mode is null
        or answer_mode in ('study', 'recall', 'choice', 'listening')
    );

alter table lesson_sessions
    drop constraint if exists lesson_sessions_study_mode_chk;

alter table lesson_sessions
    add constraint lesson_sessions_study_mode_chk
    check (study_mode in ('study', 'recall', 'choice', 'listening'));

comment on column review_events.answer_mode is
    'Exercise mode for schema-v2 events: study, recall, choice or listening; null is reserved for legacy schema-v1 rows.';

comment on column lesson_sessions.study_mode is
    'Exercise mode selected for the lesson: study, recall, choice or listening.';
