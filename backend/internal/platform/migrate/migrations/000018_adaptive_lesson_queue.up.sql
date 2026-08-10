alter table lesson_sessions
    add column review_ratio smallint not null default 70,
    add constraint lesson_sessions_review_ratio_chk check (review_ratio between 0 and 100);

alter table lesson_session_items
    add column selection_reason text,
    add constraint lesson_session_items_selection_reason_chk check (
        selection_reason is null
        or selection_reason in (
            'recent_failure',
            'due',
            'weak_topic',
            'new',
            'scheduled',
            'manual'
        )
    );

comment on column lesson_sessions.review_ratio is
    'Requested review share in percent for the server-owned adaptive lesson queue. Existing and omitted requests use 70.';
comment on column lesson_session_items.selection_reason is
    'Durable explanation for why an adaptive lesson item was selected; manual sessions are marked manual and legacy rows may be null.';
