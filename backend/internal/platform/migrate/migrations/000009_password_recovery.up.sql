create table password_reset_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    token_hash bytea not null unique,
    requested_at timestamptz not null default now(),
    expires_at timestamptz not null,
    used_at timestamptz,
    user_agent text not null default '',
    ip_address inet,
    constraint password_reset_tokens_hash_length_chk check (octet_length(token_hash) = 32),
    constraint password_reset_tokens_expiry_chk check (expires_at > requested_at)
);

create index password_reset_tokens_user_active_idx
    on password_reset_tokens (user_id, expires_at desc)
    where used_at is null;

create index password_reset_tokens_expiry_idx
    on password_reset_tokens (expires_at)
    where used_at is null;
