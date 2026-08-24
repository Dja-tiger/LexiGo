alter table review_events
    add column session_kind text,
    add column selection_reason text,
    add constraint review_events_session_kind_chk check (
        session_kind is null
        or session_kind in ('study', 'review', 'remediation')
    ),
    add constraint review_events_selection_reason_chk check (
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

create index review_events_process_analytics_idx
    on review_events (user_id, session_kind, reviewed_at desc)
    where session_kind is not null;

comment on column review_events.session_kind is
    'Immutable lesson-process attribution copied from lesson_sessions at review time. NULL means legacy, direct or otherwise unattributed; never infer from answer_mode.';
comment on column review_events.selection_reason is
    'Immutable server-owned selection reason copied from the exact lesson item at review time. NULL means legacy, direct or otherwise unattributed.';
