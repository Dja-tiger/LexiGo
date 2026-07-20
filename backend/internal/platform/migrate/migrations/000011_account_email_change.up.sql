create table account_email_change_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    old_email text not null,
    new_email text not null,
    token_hash bytea not null unique,
    expires_at timestamptz not null,
    used_at timestamptz,
    created_at timestamptz not null default now(),
    user_agent text not null default '',
    ip_address inet,
    constraint account_email_change_old_email_normalized_chk check (
        old_email = lower(trim(old_email))
    ),
    constraint account_email_change_new_email_normalized_chk check (
        new_email = lower(trim(new_email))
    ),
    constraint account_email_change_email_diff_chk check (
        old_email <> new_email
    )
);

create index account_email_change_tokens_user_active_idx
    on account_email_change_tokens (user_id, created_at desc)
    where used_at is null;

alter table account_audit_events
    drop constraint account_audit_events_type_check;

alter table account_audit_events
    add constraint account_audit_events_type_check check (
        event_type in (
            'password_changed',
            'other_sessions_revoked',
            'email_changed'
        )
    );
