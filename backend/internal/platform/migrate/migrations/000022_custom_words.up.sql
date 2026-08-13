-- Issue #485 / Parent #25 Phase 2
--
-- Shared catalog rows keep owner_user_id = null. User-created vocabulary is
-- represented by the same `words` entity but has an explicit account owner,
-- so it can reuse user_words, lesson sessions and review_events without a
-- parallel scheduler.

alter table words
    add column owner_user_id uuid references users(id) on delete cascade;

comment on column words.owner_user_id is
    'Null for shared catalog content; set to the owning account for private custom vocabulary.';

-- The original global index would reject the same private term for two
-- different accounts. Preserve its semantics for shared catalog rows while
-- making private uniqueness account-scoped.
drop index words_lemma_translation_unique_idx;

create unique index words_shared_lemma_translation_unique_idx
    on words (lower(lemma), lower(translation))
    where owner_user_id is null;

create unique index words_owner_lemma_translation_unique_idx
    on words (owner_user_id, lower(lemma), lower(translation))
    where owner_user_id is not null;

create index words_owner_user_id_idx
    on words (owner_user_id, id)
    where owner_user_id is not null;

alter table words
    add constraint words_private_scope_chk check (
        owner_user_id is null
        or (kind = 'word' and source = 'user-custom-v1')
    );
