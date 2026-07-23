alter table lesson_sessions
    drop constraint if exists lesson_sessions_source_chk;

alter table lesson_sessions
    add constraint lesson_sessions_source_chk
        check (source in (
            'mixed',
            'noun',
            'verb',
            'adjective',
            'phrases',
            'daily-life',
            'travel',
            'data-engineering',
            'backend',
            'academic-technical-english'
        )) not valid;

alter table lesson_sessions
    validate constraint lesson_sessions_source_chk;
