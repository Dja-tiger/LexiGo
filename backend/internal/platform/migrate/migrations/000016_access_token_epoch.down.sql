alter table refresh_tokens
    drop constraint if exists refresh_tokens_auth_version_positive_chk,
    drop column if exists auth_version;

alter table users
    drop constraint if exists users_auth_version_positive_chk,
    drop column if exists auth_version;
