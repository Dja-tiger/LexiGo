alter table words
    add column aliases text[] not null default '{}'::text[];

create index words_aliases_gin_idx
    on words using gin (aliases);

create index user_words_catalog_status_idx
    on user_words (user_id, status, word_id);
