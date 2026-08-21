-- Issue #638 / Parent #25 Phase 5
--
-- Private vocabulary already reuses the shared words + user_words scheduler.
-- Phase 2 intentionally admitted only owner-scoped words; Phase 5 widens the
-- same ownership boundary to phrases without creating a parallel SRS.
--
-- All existing shared rows keep owner_user_id = null. Private rows remain
-- constrained to the dedicated user-custom-v1 source, so catalog seeding and
-- public projections cannot accidentally claim user-owned content.

alter table words
    drop constraint words_private_scope_chk;

alter table words
    add constraint words_private_scope_chk check (
        owner_user_id is null
        or (
            kind in ('word', 'phrase')
            and source = 'user-custom-v1'
        )
    );
