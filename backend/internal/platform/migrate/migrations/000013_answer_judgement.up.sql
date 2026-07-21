-- Curated accepted answers are intentionally separate from catalog aliases.
-- Aliases describe a catalog term, while accepted_answers define which learner
-- responses may be treated as objectively correct by the deterministic judge.
alter table words
    add column accepted_answers text[] not null default '{}'::text[];

-- Preserve the canonical translation and add common delimiter-separated variants
-- for existing word cards. Curators can add morphological or semantic variants
-- explicitly without introducing fuzzy matching into the synchronous review path.
update words as word
set accepted_answers = coalesce((
    select array_agg(distinct candidate.answer order by candidate.answer)
    from (
        select nullif(btrim(word.translation), '') as answer
        union all
        select nullif(btrim(split_answer.value), '') as answer
        from regexp_split_to_table(word.translation, '\s*[,;/]\s*') as split_answer(value)
    ) as candidate
    where candidate.answer is not null
), '{}'::text[])
where word.kind = 'word';

-- Phrase exercises are judged against the missing English fragment. Additional
-- valid cloze forms can be curated in accepted_answers later.
update words
set accepted_answers = array[cloze_answer]
where kind = 'phrase' and cloze_answer <> '';

alter table review_events
    add column submitted_answer text,
    add column effective_rating text,
    add column judgement_source text,
    add column judgement_reason text,
    add column matched_answer text;

alter table review_events
    add constraint review_events_effective_rating_chk
        check (effective_rating is null or effective_rating in ('again', 'almost', 'known')),
    add constraint review_events_judgement_source_chk
        check (judgement_source is null or judgement_source in ('study', 'server', 'legacy_client')),
    add constraint review_events_submitted_answer_length_chk
        check (submitted_answer is null or char_length(submitted_answer) <= 500),
    add constraint review_events_judgement_shape_chk
        check (
            judgement_source is null
            or (
                effective_rating is not null
                and judgement_reason is not null
                and judgement_reason <> ''
            )
        );

comment on column words.accepted_answers is
    'Curated learner answers accepted by the deterministic judge. Catalog aliases are not accepted automatically.';
comment on column review_events.submitted_answer is
    'Raw learner response, bounded to 500 characters. Null for passive study and legacy events without an answer.';
comment on column review_events.effective_rating is
    'Rating applied to the spaced-repetition scheduler after objective correctness policy.';
comment on column review_events.judgement_source is
    'study, deterministic server judge, or legacy client correctness fallback.';
comment on column review_events.judgement_reason is
    'Stable machine-readable explanation for the objective judgement.';
comment on column review_events.matched_answer is
    'Curated accepted answer matched after deterministic normalization.';

-- Suggestions never mutate learning state automatically. They form a bounded,
-- auditable moderation queue that can later update words.accepted_answers after
-- an explicit content review.
create table answer_suggestions (
    id bigint generated always as identity primary key,
    user_id uuid not null references users(id) on delete cascade,
    word_id bigint not null references words(id) on delete cascade,
    review_event_id bigint references review_events(id) on delete set null,
    exercise_kind text not null,
    submitted_answer text not null,
    normalized_answer text not null,
    status text not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint answer_suggestions_exercise_kind_chk
        check (exercise_kind in ('translation', 'cloze')),
    constraint answer_suggestions_status_chk
        check (status in ('pending', 'accepted', 'rejected')),
    constraint answer_suggestions_answer_length_chk
        check (char_length(submitted_answer) between 1 and 500),
    constraint answer_suggestions_normalized_answer_chk
        check (normalized_answer <> '')
);

create unique index answer_suggestions_pending_unique_idx
    on answer_suggestions (user_id, word_id, exercise_kind, normalized_answer)
    where status = 'pending';

create index answer_suggestions_moderation_idx
    on answer_suggestions (status, created_at, id);
