-- Scenario production must create durable learning evidence for a server-owned
-- vocabulary target. Store the immutable target definition with the Scenario
-- step. The concrete words.id is resolved lazily in the accepted-submission
-- transaction so catalog reseeds and integration database resets cannot leave a
-- persisted cross-seed identifier behind.
alter table scenario_steps
    add column review_term text,
    add column review_translation text,
    add column review_part_of_speech text;

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
update scenario_steps step
set review_term = target.term,
    review_translation = target.translation,
    review_part_of_speech = target.part_of_speech
from targets target
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
        where review_term is null
           or btrim(review_term) = ''
           or review_translation is null
           or btrim(review_translation) = ''
           or review_part_of_speech is null
           or btrim(review_part_of_speech) = ''
           or not (review_term = any(vocabulary))
    ) then
        raise exception 'scenario review target backfill is incomplete or inconsistent';
    end if;
end
$$;

alter table scenario_steps
    alter column review_term set not null,
    alter column review_translation set not null,
    alter column review_part_of_speech set not null,
    add constraint scenario_steps_review_target_chk
        check (
            review_term = btrim(review_term)
            and review_term <> ''
            and review_translation = btrim(review_translation)
            and review_translation <> ''
            and review_part_of_speech = btrim(review_part_of_speech)
            and review_part_of_speech <> ''
            and review_term = any(vocabulary)
        );

comment on column scenario_steps.review_term is
    'Exact technical term whose normalized whole-term presence is judged in the Scenario response.';
comment on column scenario_steps.review_translation is
    'Canonical catalog translation used when the target learning item is resolved lazily.';
comment on column scenario_steps.review_part_of_speech is
    'Canonical catalog part of speech used when the target learning item is resolved lazily.';
