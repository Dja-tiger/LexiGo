alter table lesson_sessions
    drop constraint lesson_sessions_version_chk,
    drop column version;
