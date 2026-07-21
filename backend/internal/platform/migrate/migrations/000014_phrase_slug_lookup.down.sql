drop index if exists words_slug_unique_idx;

create unique index words_slug_unique_idx
    on words (slug)
    where slug is not null;

alter table words
    drop constraint if exists words_phrase_slug_canonical_chk;

comment on column words.slug is null;
