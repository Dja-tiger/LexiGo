alter table words
    add column kind text not null default 'word',
    add column slug text,
    add column cloze text not null default '',
    add column cloze_answer text not null default '';

alter table words
    add constraint words_kind_chk check (kind in ('word', 'phrase')),
    add constraint words_phrase_shape_chk check (
        kind = 'word' or (slug is not null and slug <> '' and cloze <> '' and cloze_answer <> '')
    );

create unique index words_slug_unique_idx
    on words (slug)
    where slug is not null;

create index words_kind_idx on words (kind, id);

insert into words (
    lemma, translation, phonetic, part_of_speech, topic, examples, source, note,
    kind, slug, cloze, cloze_answer
) values
    ('We need to identify the root cause.', 'Нам нужно определить первопричину.', '', 'phrase', 'Incidents',
     jsonb_build_array('Before applying another workaround, we need to identify the root cause.'),
     'lexigo-technical-phrases-v1', 'root cause — первопричина, а не просто наблюдаемый симптом',
     'phrase', 'phrase-root-cause', 'We need to identify the _____ cause.', 'root'),
    ('The issue is reproducible in production.', 'Проблема воспроизводится в production.', '', 'phrase', 'Incidents',
     jsonb_build_array('The issue is reproducible in production but not in staging.'),
     'lexigo-technical-phrases-v1', 'reproducible — стабильно воспроизводимый',
     'phrase', 'phrase-reproducible', 'The issue is _____ in production.', 'reproducible'),
    ('The service is currently degraded.', 'Сервис сейчас работает с ухудшенным качеством.', '', 'phrase', 'Incidents',
     jsonb_build_array('The service is currently degraded, but requests are still being processed.'),
     'lexigo-technical-phrases-v1', 'degraded не обязательно означает полный outage',
     'phrase', 'phrase-degraded', 'The service is currently _____.', 'degraded'),
    ('There is no confirmed root cause yet.', 'Подтверждённой первопричины пока нет.', '', 'phrase', 'Incidents',
     jsonb_build_array('The incident is resolved, but there is no confirmed root cause yet.'),
     'lexigo-technical-phrases-v1', 'Подходит для аккуратного статуса без преждевременных выводов.',
     'phrase', 'phrase-no-confirmed-root-cause', 'There is no _____ root cause yet.', 'confirmed'),
    ('Could you share the relevant logs?', 'Можешь прислать относящиеся к проблеме логи?', '', 'phrase', 'Troubleshooting',
     jsonb_build_array('Could you share the relevant logs and the exact timestamp?'),
     'lexigo-technical-phrases-v1', 'relevant logs звучит точнее, чем просто logs',
     'phrase', 'phrase-share-logs', 'Could you share the _____ logs?', 'relevant'),
    ('Let''s walk through the data flow.', 'Давайте пошагово разберём поток данных.', '', 'phrase', 'Architecture',
     jsonb_build_array('Let''s walk through the data flow from NiFi to Greenplum.'),
     'lexigo-technical-phrases-v1', 'walk through — последовательно разобрать',
     'phrase', 'phrase-walk-through', 'Let''s _____ through the data flow.', 'walk'),
    ('This change is backward-compatible.', 'Это изменение обратно совместимо.', '', 'phrase', 'Architecture',
     jsonb_build_array('The schema change is backward-compatible with the current consumers.'),
     'lexigo-technical-phrases-v1', 'backward-compatible — совместимый с предыдущими версиями',
     'phrase', 'phrase-backward-compatible', 'This change is _____-compatible.', 'backward'),
    ('This change requires a database migration.', 'Это изменение требует миграции базы данных.', '', 'phrase', 'Architecture',
     jsonb_build_array('This change requires a database migration before the new API can start.'),
     'lexigo-technical-phrases-v1', 'requires — требует, prerequisite — предварительное условие',
     'phrase', 'phrase-database-migration', 'This change requires a database _____.', 'migration'),
    ('The job is idempotent.', 'Задача идемпотентна.', '', 'phrase', 'Data Engineering',
     jsonb_build_array('The job is idempotent, so it can be safely retried.'),
     'lexigo-technical-phrases-v1', 'idempotent — повторный запуск не меняет результат сверх первого применения',
     'phrase', 'phrase-idempotent', 'The job is _____.', 'idempotent'),
    ('The data is stale.', 'Данные устарели.', '', 'phrase', 'Data Engineering',
     jsonb_build_array('The dashboard is available, but the data is stale.'),
     'lexigo-technical-phrases-v1', 'stale data — данные, которые не обновились вовремя',
     'phrase', 'phrase-stale-data', 'The data is _____.', 'stale'),
    ('The dataset is incomplete.', 'Набор данных неполный.', '', 'phrase', 'Data Engineering',
     jsonb_build_array('The dataset is incomplete because one source system has not finished loading.'),
     'lexigo-technical-phrases-v1', 'dataset — набор данных; incomplete — неполный',
     'phrase', 'phrase-incomplete-data', 'The dataset is _____.', 'incomplete'),
    ('The query is resource-intensive.', 'Запрос потребляет много ресурсов.', '', 'phrase', 'Data Engineering',
     jsonb_build_array('The query is resource-intensive and should not run during peak hours.'),
     'lexigo-technical-phrases-v1', 'resource-intensive — требующий значительных CPU, memory или I/O',
     'phrase', 'phrase-resource-intensive', 'The query is resource-_____.', 'intensive'),
    ('The pipeline failed due to a timeout.', 'Пайплайн завершился ошибкой из-за таймаута.', '', 'phrase', 'Data Engineering',
     jsonb_build_array('The pipeline failed due to a timeout while reading from the source API.'),
     'lexigo-technical-phrases-v1', 'failed due to — завершился ошибкой из-за',
     'phrase', 'phrase-timeout', 'The pipeline failed due to a _____.', 'timeout'),
    ('This stage is the main bottleneck.', 'Этот этап является основным узким местом.', '', 'phrase', 'Performance',
     jsonb_build_array('The database write stage is the main bottleneck in the data flow.'),
     'lexigo-technical-phrases-v1', 'bottleneck — узкое место, ограничивающее пропускную способность',
     'phrase', 'phrase-data-flow-bottleneck', 'This stage is the main _____.', 'bottleneck'),
    ('We should test this under load.', 'Нам следует проверить это под нагрузкой.', '', 'phrase', 'Performance',
     jsonb_build_array('We should test this under load before enabling it in production.'),
     'lexigo-technical-phrases-v1', 'under load — в условиях нагрузки',
     'phrase', 'phrase-under-load', 'We should test this under _____.', 'load'),
    ('Let''s align on the acceptance criteria.', 'Давайте согласуем критерии приёмки.', '', 'phrase', 'Delivery',
     jsonb_build_array('Before implementation, let''s align on the acceptance criteria.'),
     'lexigo-technical-phrases-v1', 'align on — согласовать общее понимание',
     'phrase', 'phrase-acceptance-criteria', 'Let''s align on the acceptance _____.', 'criteria'),
    ('This is out of scope for this iteration.', 'Это не входит в объём текущей итерации.', '', 'phrase', 'Delivery',
     jsonb_build_array('Advanced analytics is out of scope for this iteration.'),
     'lexigo-technical-phrases-v1', 'out of scope — вне согласованного объёма работ',
     'phrase', 'phrase-out-of-scope', 'This is out of _____ for this iteration.', 'scope'),
    ('What are the next steps?', 'Каковы следующие шаги?', '', 'phrase', 'Delivery',
     jsonb_build_array('We have agreed on the design. What are the next steps?'),
     'lexigo-technical-phrases-v1', 'Короткая нейтральная фраза для завершения обсуждения.',
     'phrase', 'phrase-next-steps', 'What are the next _____?', 'steps'),
    ('Do we have an ETA for the fix?', 'Есть ли ожидаемый срок исправления?', '', 'phrase', 'Delivery',
     jsonb_build_array('Do we have an ETA for the fix and the rollout plan?'),
     'lexigo-technical-phrases-v1', 'ETA — estimated time of arrival; в работе означает ожидаемый срок',
     'phrase', 'phrase-eta', 'Do we have an _____ for the fix?', 'ETA'),
    ('The fix has been deployed to staging.', 'Исправление развёрнуто на staging.', '', 'phrase', 'Release',
     jsonb_build_array('The fix has been deployed to staging and is ready for verification.'),
     'lexigo-technical-phrases-v1', 'has been deployed — уже развёрнуто, результат актуален сейчас',
     'phrase', 'phrase-deployed-staging', 'The fix has been _____ to staging.', 'deployed'),
    ('We need to roll back the release.', 'Нам нужно откатить релиз.', '', 'phrase', 'Release',
     jsonb_build_array('The error rate is increasing, so we need to roll back the release.'),
     'lexigo-technical-phrases-v1', 'roll back — откатить изменение или релиз',
     'phrase', 'phrase-roll-back', 'We need to roll _____ the release.', 'back'),
    ('We should add monitoring and alerting.', 'Нам следует добавить мониторинг и оповещения.', '', 'phrase', 'Operations',
     jsonb_build_array('We should add monitoring and alerting before the production rollout.'),
     'lexigo-technical-phrases-v1', 'monitoring наблюдает состояние, alerting уведомляет об отклонениях',
     'phrase', 'phrase-monitoring-alerting', 'We should add monitoring and _____.', 'alerting'),
    ('Could you clarify what you mean by that?', 'Можешь уточнить, что ты имеешь в виду?', '', 'phrase', 'Communication',
     jsonb_build_array('Could you clarify what you mean by a complete reload?'),
     'lexigo-technical-phrases-v1', 'Нейтральный способ запросить уточнение без конфронтации.',
     'phrase', 'phrase-clarify', 'Could you _____ what you mean by that?', 'clarify'),
    ('Please correct me if I''m wrong.', 'Поправьте меня, если я ошибаюсь.', '', 'phrase', 'Communication',
     jsonb_build_array('Please correct me if I''m wrong, but the consumer retries indefinitely.'),
     'lexigo-technical-phrases-v1', 'Используется перед осторожной формулировкой предположения.',
     'phrase', 'phrase-correct-me', 'Please _____ me if I''m wrong.', 'correct')
on conflict do nothing;

insert into user_words (user_id, word_id)
select users.id, words.id
from users
cross join words
where words.kind = 'phrase'
on conflict (user_id, word_id) do nothing;

create or replace function enroll_default_words_for_user()
returns trigger
language plpgsql
as $$
begin
    insert into user_words (user_id, word_id)
    select new.id, words.id
    from words
    where words.source in ('hakui-technical-english-2020', 'lexigo-technical-phrases-v1')
    on conflict (user_id, word_id) do nothing;

    return new;
end;
$$;

alter table lesson_sessions drop constraint lesson_sessions_source_chk;
alter table lesson_sessions
    add constraint lesson_sessions_source_chk
        check (source in ('mixed', 'noun', 'verb', 'adjective', 'phrases'));
