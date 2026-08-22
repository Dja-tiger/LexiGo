alter table lesson_sessions
    add column session_kind text,
    add constraint lesson_sessions_session_kind_chk check (
        session_kind is null
        or session_kind in ('study', 'review', 'remediation')
    );

alter table lesson_session_items
    drop constraint lesson_session_items_selection_reason_chk,
    add constraint lesson_session_items_selection_reason_chk check (
        selection_reason is null
        or selection_reason in (
            'recent_failure',
            'due',
            'overdue',
            'relearning_due',
            'repeated_again',
            'repeated_almost',
            'weak_topic',
            'new',
            'scheduled',
            'manual'
        )
    );

comment on column lesson_sessions.session_kind is
    'Optional staged-rollout lesson intent: study, review or remediation. NULL means legacy/unspecified and must not be inferred from study_mode.';
comment on column lesson_session_items.selection_reason is
    'Durable explanation for lesson selection, including due/relearning and rating-history reasons; manual sessions are marked manual and legacy rows may be null.';
