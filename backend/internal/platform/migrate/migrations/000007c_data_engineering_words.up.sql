with entries (
    lemma, translation, phonetic, part_of_speech, topic, example, source, note
) as (
    values
    ('data mart', 'витрина данных', '', 'noun phrase', 'Data Engineering', 'The finance data mart contains monthly aggregates.', 'lexigo-data-engineering-v2', 'Тематический аналитический набор данных.'),
    ('fact table', 'таблица фактов', '', 'noun phrase', 'Data Engineering', 'The fact table stores one row per sale.', 'lexigo-data-engineering-v2', 'Таблица с измеряемыми событиями и показателями.'),
    ('dimension table', 'таблица измерений', '', 'noun phrase', 'Data Engineering', 'The dimension table contains store attributes.', 'lexigo-data-engineering-v2', 'Таблица описательных сущностей для аналитики.'),
    ('star schema', 'схема звезда', '', 'noun phrase', 'Data Engineering', 'The data mart uses a star schema.', 'lexigo-data-engineering-v2', 'Модель с таблицей фактов и связанными измерениями.'),
    ('snowflake schema', 'схема снежинка', '', 'noun phrase', 'Data Engineering', 'The snowflake schema normalizes dimension attributes.', 'lexigo-data-engineering-v2', 'Модель с нормализованными измерениями.'),
    ('staging area', 'промежуточная зона данных', '', 'noun phrase', 'Data Engineering', 'Raw files are loaded into the staging area first.', 'lexigo-data-engineering-v2', 'Зона подготовки данных перед основной обработкой.'),
    ('source system', 'система-источник', '', 'noun phrase', 'Data Engineering', 'The source system publishes updates every hour.', 'lexigo-data-engineering-v2', 'Система, из которой поступают данные.'),
    ('target table', 'целевая таблица', '', 'noun phrase', 'Data Engineering', 'The job replaces the affected partition in the target table.', 'lexigo-data-engineering-v2', 'Таблица, куда записывается результат.'),
    ('primary key', 'первичный ключ', '', 'noun phrase', 'Data Engineering', 'The primary key uniquely identifies each row.', 'lexigo-data-engineering-v2', 'Уникальный идентификатор строки.'),
    ('foreign key', 'внешний ключ', '', 'noun phrase', 'Data Engineering', 'The foreign key links the fact to a dimension.', 'lexigo-data-engineering-v2', 'Ссылка на ключ другой таблицы.'),
    ('natural key', 'естественный ключ', '', 'noun phrase', 'Data Engineering', 'The product code is used as a natural key.', 'lexigo-data-engineering-v2', 'Бизнес-идентификатор из предметной области.'),
    ('data contract', 'контракт данных', '', 'noun phrase', 'Data Engineering', 'The data contract defines fields and compatibility rules.', 'lexigo-data-engineering-v2', 'Соглашение о структуре и семантике данных.'),
    ('schema registry', 'реестр схем', '', 'noun phrase', 'Data Engineering', 'The producer registers the event schema in the schema registry.', 'lexigo-data-engineering-v2', 'Сервис хранения и проверки версий схем.'),
    ('event time', 'время события', '', 'noun phrase', 'Data Engineering', 'The window is calculated using event time.', 'lexigo-data-engineering-v2', 'Время, когда событие произошло в источнике.'),
    ('processing time', 'время обработки', '', 'noun phrase', 'Data Engineering', 'Processing time depends on when the worker receives the event.', 'lexigo-data-engineering-v2', 'Время, когда платформа обрабатывает событие.'),
    ('late-arriving data', 'запоздавшие данные', '', 'noun phrase', 'Data Engineering', 'Late-arriving data must update an earlier partition.', 'lexigo-data-engineering-v2', 'Данные, пришедшие позже ожидаемого окна.'),
    ('compaction', 'компакция', '', 'noun', 'Data Engineering', 'Compaction merges small files into larger ones.', 'lexigo-data-engineering-v2', 'Объединение или уплотнение данных и файлов.'),
    ('retention period', 'период хранения', '', 'noun phrase', 'Data Engineering', 'The retention period is limited to seven days.', 'lexigo-data-engineering-v2', 'Срок, в течение которого данные сохраняются.'),
    ('replication factor', 'коэффициент репликации', '', 'noun phrase', 'Data Engineering', 'A replication factor of three stores three copies.', 'lexigo-data-engineering-v2', 'Количество копий данных в кластере.'),
    ('consumer lag', 'отставание потребителя', '', 'noun phrase', 'Data Engineering', 'Consumer lag increased after the downstream outage.', 'lexigo-data-engineering-v2', 'Разница между последним сообщением и обработанной позицией.'),
    ('offset', 'смещение сообщения', '', 'noun', 'Data Engineering', 'The consumer committed the latest offset.', 'lexigo-data-engineering-v2', 'Позиция сообщения в партиции журнала.'),
    ('throughput', 'пропускная способность', '', 'noun', 'Data Engineering', 'The pipeline throughput reached fifty thousand rows per second.', 'lexigo-data-engineering-v2', 'Объём данных, обрабатываемый за единицу времени.'),
    ('latency', 'задержка обработки', '', 'noun', 'Data Engineering', 'End-to-end latency must remain below five minutes.', 'lexigo-data-engineering-v2', 'Время от появления данных до доступности результата.'),
    ('cardinality', 'кардинальность', '', 'noun', 'Data Engineering', 'High cardinality can make metrics expensive.', 'lexigo-data-engineering-v2', 'Количество уникальных значений.'),
    ('materialized view', 'материализованное представление', '', 'noun phrase', 'Data Engineering', 'The materialized view is refreshed every hour.', 'lexigo-data-engineering-v2', 'Сохранённый результат запроса, обновляемый отдельно.')
)
insert into words (
    lemma, translation, phonetic, part_of_speech, topic, examples, source, note, kind
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
    'word'
from entries
on conflict do nothing;
