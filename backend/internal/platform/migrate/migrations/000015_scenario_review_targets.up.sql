-- Scenario production must create durable learning evidence for a server-owned
-- vocabulary target. The target is explicit instead of being inferred from the
-- array order by API clients, and every target points to the canonical words /
-- user_words learning model used by the scheduler.
alter table scenario_steps
    add column review_word_id bigint,
    add column review_term text;

with targets (
    scenario_slug,
    position,
    term,
    translation,
    part_of_speech
) as (
    values
        ('incident-update', 0, 'incident', 'инцидент', 'noun'),
        ('incident-update', 1, 'mitigation', 'смягчение последствий', 'noun'),
        ('incident-update', 2, 'status', 'статус', 'noun'),
        ('troubleshoot-latency', 0, 'latency', 'задержка', 'noun'),
        ('troubleshoot-latency', 1, 'hypothesis', 'гипотеза', 'noun'),
        ('troubleshoot-latency', 2, 'evidence', 'доказательство', 'noun'),
        ('architecture-review-cache', 0, 'consistency', 'согласованность', 'noun'),
        ('architecture-review-cache', 1, 'trade-off', 'компромисс', 'noun'),
        ('architecture-review-cache', 2, 'observability', 'наблюдаемость', 'noun'),
        ('data-pipeline-late-arrival', 0, 'event time', 'время события', 'noun phrase'),
        ('data-pipeline-late-arrival', 1, 'idempotency', 'идемпотентность', 'noun'),
        ('data-pipeline-late-arrival', 2, 'backfill', 'дозагрузка исторических данных', 'noun'),
        ('release-go-no-go', 0, 'release', 'релиз', 'noun'),
        ('release-go-no-go', 1, 'rollback', 'откат', 'noun'),
        ('release-go-no-go', 2, 'go/no-go', 'решение о запуске или остановке', 'noun phrase'),
        ('weekly-status-update', 0, 'outcome', 'результат', 'noun'),
        ('weekly-status-update', 1, 'risk', 'риск', 'noun'),
        ('weekly-status-update', 2, 'status update', 'обновление статуса', 'noun phrase')
)
insert into words (
    lemma,
    translation,
    phonetic,
    part_of_speech,
    topic,
    examples,
    source,
    note,
    kind,
    accepted_answers
)
select
    target.term,
    target.translation,
    '',
    target.part_of_speech,
    'Technical Scenarios',
    '[]'::jsonb,
    'lexigo-scenario-vocabulary-v1',
    'Целевая лексика для технических Scenario Lessons.',
    'word',
    array[target.translation]
from targets target
on conflict do nothing;

with targets (
    scenario_slug,
    position,
    term,
    translation
) as (
    values
        ('incident-update', 0, 'incident', 'инцидент'),
        ('incident-update', 1, 'mitigation', 'смягчение последствий'),
        ('incident-update', 2, 'status', 'статус'),
        ('troubleshoot-latency', 0, 'latency', 'задержка'),
        ('troubleshoot-latency', 1, 'hypothesis', 'гипотеза'),
        ('troubleshoot-latency', 2, 'evidence', 'доказательство'),
        ('architecture-review-cache', 0, 'consistency', 'согласованность'),
        ('architecture-review-cache', 1, 'trade-off', 'компромисс'),
        ('architecture-review-cache', 2, 'observability', 'наблюдаемость'),
        ('data-pipeline-late-arrival', 0, 'event time', 'время события'),
        ('data-pipeline-late-arrival', 1, 'idempotency', 'идемпотентность'),
        ('data-pipeline-late-arrival', 2, 'backfill', 'дозагрузка исторических данных'),
        ('release-go-no-go', 0, 'release', 'релиз'),
        ('release-go-no-go', 1, 'rollback', 'откат'),
        ('release-go-no-go', 2, 'go/no-go', 'решение о запуске или остановке'),
        ('weekly-status-update', 0, 'outcome', 'результат'),
        ('weekly-status-update', 1, 'risk', 'риск'),
        ('weekly-status-update', 2, 'status update', 'обновление статуса')
)
update scenario_steps step
set review_word_id = word.id,
    review_term = target.term
from targets target
join words word
  on lower(word.lemma) = lower(target.term)
 and lower(word.translation) = lower(target.translation)
where step.scenario_slug = target.scenario_slug
  and step.position = target.position;

do $$
declare
    target_count integer;
begin
    select count(*)::integer into target_count
    from scenario_steps;

    if target_count <> 18 then
        raise exception 'scenario catalog contains % steps; expected 18', target_count;
    end if;

    if exists (
        select 1
        from scenario_steps
        where review_word_id is null
           or review_term is null
           or btrim(review_term) = ''
           or not (review_term = any(vocabulary))
    ) then
        raise exception 'scenario review target backfill is incomplete or inconsistent';
    end if;
end
$$;

alter table scenario_steps
    alter column review_word_id set not null,
    alter column review_term set not null,
    add constraint scenario_steps_review_word_fk
        foreign key (review_word_id) references words(id),
    add constraint scenario_steps_review_term_chk
        check (review_term = btrim(review_term) and review_term <> '' and review_term = any(vocabulary));

create index scenario_steps_review_word_idx on scenario_steps (review_word_id);

comment on column scenario_steps.review_word_id is
    'Server-owned learning item updated atomically when this Scenario step is accepted.';
comment on column scenario_steps.review_term is
    'Exact technical term whose normalized whole-term presence is judged in the Scenario response.';
