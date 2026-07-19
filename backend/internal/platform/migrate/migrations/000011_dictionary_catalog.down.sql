drop index if exists user_words_catalog_status_idx;
drop index if exists words_aliases_gin_idx;

alter table words
    drop column if exists aliases;
