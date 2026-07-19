create table account_audit_events (
    id bigserial primary key,
    user_id uuid not null references users(id) on delete cascade,
    event_type text not null,
    user_agent text not null default '',
    ip_address inet,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint account_audit_events_type_check check (
        event_type in (
            'password_changed',
            'other_sessions_revoked'
        )
    )
);

create index account_audit_events_user_created_idx
    on account_audit_events (user_id, created_at desc, id desc);
