with entries (
    lemma, translation, phonetic, part_of_speech, topic, example, source, note,
    slug, cloze, cloze_answer
) as (
    values
    ('The pipeline is running behind schedule.', 'Пайплайн отстаёт от расписания.', '', 'phrase', 'Data Engineering', 'The pipeline is running behind schedule because the source is slow.', 'lexigo-themed-phrases-v2', 'behind schedule — с отставанием от плана.', 'phrase-the-pipeline-is-running-behind-schedule', 'The pipeline is running behind _____.', 'schedule'),
    ('The source system is unavailable.', 'Система-источник недоступна.', '', 'phrase', 'Data Engineering', 'The source system is unavailable, so ingestion has stopped.', 'lexigo-themed-phrases-v2', 'Нейтральное описание недоступности источника.', 'phrase-the-source-system-is-unavailable', 'The source system is _____.', 'unavailable'),
    ('The schema has changed upstream.', 'Схема изменилась в вышестоящей системе.', '', 'phrase', 'Data Engineering', 'The schema has changed upstream without prior notice.', 'lexigo-themed-phrases-v2', 'upstream — выше по потоку данных.', 'phrase-the-schema-has-changed-upstream', 'The schema has changed _____.', 'upstream'),
    ('We need to backfill the missing partition.', 'Нам нужно дозагрузить отсутствующую партицию.', '', 'phrase', 'Data Engineering', 'We need to backfill the missing partition for yesterday.', 'lexigo-themed-phrases-v2', 'backfill — дозагрузить исторический период.', 'phrase-we-need-to-backfill-the-missing-partition', 'We need to backfill the missing _____.', 'partition'),
    ('The job can be safely retried.', 'Задачу можно безопасно перезапустить.', '', 'phrase', 'Data Engineering', 'The job can be safely retried because it is idempotent.', 'lexigo-themed-phrases-v2', 'safely retried — безопасно повторно запущен.', 'phrase-the-job-can-be-safely-retried', 'The job can be safely _____.', 'retried'),
    ('The consumer lag is increasing.', 'Отставание потребителя растёт.', '', 'phrase', 'Data Engineering', 'The consumer lag is increasing during peak traffic.', 'lexigo-themed-phrases-v2', 'Фраза для мониторинга Kafka-потребителя.', 'phrase-the-consumer-lag-is-increasing', 'The consumer lag is _____.', 'increasing'),
    ('The data arrived later than expected.', 'Данные пришли позже ожидаемого.', '', 'phrase', 'Data Engineering', 'The data arrived later than expected and missed the processing window.', 'lexigo-themed-phrases-v2', 'later than expected — позже ожидаемого.', 'phrase-the-data-arrived-later-than-expected', 'The data arrived later than _____.', 'expected'),
    ('This table is partitioned by date.', 'Эта таблица партиционирована по дате.', '', 'phrase', 'Data Engineering', 'This table is partitioned by date and distributed by store identifier.', 'lexigo-themed-phrases-v2', 'partitioned by — разбита на разделы по полю.', 'phrase-this-table-is-partitioned-by-date', 'This table is partitioned by _____.', 'date'),
    ('The query is scanning too much data.', 'Запрос сканирует слишком много данных.', '', 'phrase', 'Data Engineering', 'The query is scanning too much data because partition pruning is not applied.', 'lexigo-themed-phrases-v2', 'scanning data — читать данные при выполнении запроса.', 'phrase-the-query-is-scanning-too-much-data', 'The query is scanning too much _____.', 'data'),
    ('We should add a data quality check.', 'Нам следует добавить проверку качества данных.', '', 'phrase', 'Data Engineering', 'We should add a data quality check for null identifiers.', 'lexigo-themed-phrases-v2', 'Фраза для обсуждения контроля данных.', 'phrase-we-should-add-a-data-quality-check', 'We should add a data quality _____.', 'check'),
    ('The record count does not match.', 'Количество записей не совпадает.', '', 'phrase', 'Data Engineering', 'The record count does not match between the source and target.', 'lexigo-themed-phrases-v2', 'does not match — не совпадает.', 'phrase-the-record-count-does-not-match', 'The record count does not _____.', 'match'),
    ('The load completed with partial data.', 'Загрузка завершилась с неполными данными.', '', 'phrase', 'Data Engineering', 'The load completed with partial data from one region.', 'lexigo-themed-phrases-v2', 'partial data — неполный набор данных.', 'phrase-the-load-completed-with-partial-data', 'The load completed with partial _____.', 'data'),
    ('The downstream task is blocked.', 'Нижестоящая задача заблокирована.', '', 'phrase', 'Data Engineering', 'The downstream task is blocked by a failed dependency.', 'lexigo-themed-phrases-v2', 'downstream — ниже по цепочке.', 'phrase-the-downstream-task-is-blocked', 'The downstream task is _____.', 'blocked'),
    ('We need to preserve historical changes.', 'Нам нужно сохранить исторические изменения.', '', 'phrase', 'Data Engineering', 'We need to preserve historical changes in the customer dimension.', 'lexigo-themed-phrases-v2', 'preserve history — сохранять историю.', 'phrase-we-need-to-preserve-historical-changes', 'We need to preserve historical _____.', 'changes'),
    ('This transformation is not idempotent.', 'Это преобразование не идемпотентно.', '', 'phrase', 'Data Engineering', 'This transformation is not idempotent and duplicates rows on retry.', 'lexigo-themed-phrases-v2', 'Критичное свойство для безопасных повторных запусков.', 'phrase-this-transformation-is-not-idempotent', 'This transformation is not _____.', 'idempotent'),
    ('The watermark was not updated.', 'Водяной знак не обновился.', '', 'phrase', 'Data Engineering', 'The watermark was not updated after the failed transaction.', 'lexigo-themed-phrases-v2', 'Фраза для диагностики инкрементальной загрузки.', 'phrase-the-watermark-was-not-updated', 'The watermark was not _____.', 'updated'),
    ('The checkpoint is no longer valid.', 'Контрольная точка больше недействительна.', '', 'phrase', 'Data Engineering', 'The checkpoint is no longer valid after the topic was recreated.', 'lexigo-themed-phrases-v2', 'no longer valid — больше недействителен.', 'phrase-the-checkpoint-is-no-longer-valid', 'The checkpoint is no longer _____.', 'valid'),
    ('The dataset contains duplicate records.', 'Набор данных содержит дублирующиеся записи.', '', 'phrase', 'Data Engineering', 'The dataset contains duplicate records with the same business key.', 'lexigo-themed-phrases-v2', 'duplicate records — повторяющиеся записи.', 'phrase-the-dataset-contains-duplicate-records', 'The dataset contains duplicate _____.', 'records'),
    ('The event timestamp is in UTC.', 'Временная метка события указана в UTC.', '', 'phrase', 'Data Engineering', 'The event timestamp is in UTC and must be converted for the report.', 'lexigo-themed-phrases-v2', 'UTC важно явно указывать при работе со временем.', 'phrase-the-event-timestamp-is-in-utc', 'The event timestamp is in _____.', 'UTC'),
    ('The retention period is seven days.', 'Период хранения составляет семь дней.', '', 'phrase', 'Data Engineering', 'The retention period is seven days for this topic.', 'lexigo-themed-phrases-v2', 'retention period — срок хранения.', 'phrase-the-retention-period-is-seven-days', 'The retention period is seven _____.', 'days'),
    ('The topic has twelve partitions.', 'В топике двенадцать партиций.', '', 'phrase', 'Data Engineering', 'The topic has twelve partitions and three replicas.', 'lexigo-themed-phrases-v2', 'Базовая фраза о конфигурации Kafka-топика.', 'phrase-the-topic-has-twelve-partitions', 'The topic has twelve _____.', 'partitions'),
    ('The batch size is too large.', 'Размер пакета слишком большой.', '', 'phrase', 'Data Engineering', 'The batch size is too large for the current memory limit.', 'lexigo-themed-phrases-v2', 'batch size — размер обрабатываемой порции.', 'phrase-the-batch-size-is-too-large', 'The batch size is too _____.', 'large'),
    ('The data contract is backward-compatible.', 'Контракт данных обратно совместим.', '', 'phrase', 'Data Engineering', 'The data contract is backward-compatible with current consumers.', 'lexigo-themed-phrases-v2', 'Фраза для обсуждения совместимости схем.', 'phrase-the-data-contract-is-backward-compatible', 'The data contract is backward-_____.', 'compatible'),
    ('The materialized view needs a refresh.', 'Материализованное представление нужно обновить.', '', 'phrase', 'Data Engineering', 'The materialized view needs a refresh after the load finishes.', 'lexigo-themed-phrases-v2', 'refresh — обновление сохранённого результата.', 'phrase-the-materialized-view-needs-a-refresh', 'The materialized view needs a _____.', 'refresh'),
    ('Let''s compare the source and target counts.', 'Давайте сравним количество записей в источнике и приёмнике.', '', 'phrase', 'Data Engineering', 'Let''s compare the source and target counts before publishing the table.', 'lexigo-themed-phrases-v2', 'Практичная формулировка для сверки загрузки.', 'phrase-lets-compare-the-source-and-target-counts', 'Let''s compare the source and target _____.', 'counts')
)
insert into words (
    lemma, translation, phonetic, part_of_speech, topic, examples, source, note,
    kind, slug, cloze, cloze_answer
)
select
    lemma,
    translation,
    phonetic,
    part_of_speech,
    topic,
    jsonb_build_array(example),
    source,
    note,
    'phrase',
    slug,
    cloze,
    cloze_answer
from entries
on conflict do nothing;
