alter table refresh_tokens
    add column family_id uuid,
    add column replaced_by_hash bytea,
    add column reuse_detected_at timestamptz;

update refresh_tokens
set family_id = id
where family_id is null;

alter table refresh_tokens
    alter column family_id set not null;

create index refresh_tokens_family_idx
    on refresh_tokens (family_id, created_at);
