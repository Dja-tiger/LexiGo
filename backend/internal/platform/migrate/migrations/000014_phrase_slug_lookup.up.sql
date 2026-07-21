-- Phrase detail URLs are public, durable identifiers. Refuse to migrate an
-- inconsistent catalog instead of silently changing links that may already be
-- shared outside the application.
do $$
begin
    if exists (
        select 1
        from words
        where kind = 'phrase'
          and (
              slug is null
              or slug = ''
              or char_length(slug) > 120
              or slug <> lower(slug)
              or slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
          )
    ) then
        raise exception 'phrase catalog contains a non-canonical slug';
    end if;

    if exists (
        select lower(slug)
        from words
        where slug is not null
        group by lower(slug)
        having count(*) > 1
    ) then
        raise exception 'catalog contains case-insensitive duplicate slugs';
    end if;
end
$$;

alter table words
    add constraint words_phrase_slug_canonical_chk
        check (
            kind <> 'phrase'
            or (
                slug is not null
                and char_length(slug) between 1 and 120
                and slug = lower(slug)
                and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
            )
        );

-- One functional index supports both uniqueness and the address lookup used by
-- get /api/v1/phrases/{slug}. The partial predicate keeps word rows without a
-- slug out of the index.
drop index if exists words_slug_unique_idx;

create unique index words_slug_unique_idx
    on words (lower(slug))
    where slug is not null;

comment on column words.slug is
    'Canonical lowercase kebab-case identifier for durable phrase detail URLs.';
