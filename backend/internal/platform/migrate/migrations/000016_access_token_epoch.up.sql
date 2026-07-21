alter table users
    add column auth_version bigint not null default 1,
    add constraint users_auth_version_positive_chk check (auth_version > 0);

alter table refresh_tokens
    add column auth_version bigint;

update refresh_tokens
set auth_version = users.auth_version
from users
where users.id = refresh_tokens.user_id;

alter table refresh_tokens
    alter column auth_version set default 1,
    alter column auth_version set not null,
    add constraint refresh_tokens_auth_version_positive_chk check (auth_version > 0);
