with entries (
    lemma, translation, phonetic, part_of_speech, topic, example, source, note
) as (
    values
    ('dependency injection', 'внедрение зависимостей', '', 'noun phrase', 'Backend Development', 'Dependency injection makes services easier to test.', 'lexigo-backend-v2', 'Передача зависимостей извне вместо создания внутри объекта.'),
    ('service layer', 'сервисный слой', '', 'noun phrase', 'Backend Development', 'The service layer contains the business rules.', 'lexigo-backend-v2', 'Слой прикладной бизнес-логики.'),
    ('repository pattern', 'паттерн репозиторий', '', 'noun phrase', 'Backend Development', 'The repository pattern hides database-specific code.', 'lexigo-backend-v2', 'Абстракция доступа к хранилищу данных.'),
    ('domain model', 'доменная модель', '', 'noun phrase', 'Backend Development', 'The domain model represents orders and payments.', 'lexigo-backend-v2', 'Модель сущностей и правил предметной области.'),
    ('data transfer object', 'объект передачи данных', '', 'noun phrase', 'Backend Development', 'The handler maps the request to a data transfer object.', 'lexigo-backend-v2', 'Структура для передачи данных между слоями.'),
    ('request validation', 'валидация запроса', '', 'noun phrase', 'Backend Development', 'Request validation rejects malformed input.', 'lexigo-backend-v2', 'Проверка входных данных клиента.'),
    ('response validation', 'валидация ответа', '', 'noun phrase', 'Backend Development', 'Response validation detects an incompatible upstream API.', 'lexigo-backend-v2', 'Проверка данных, возвращаемых сервисом.'),
    ('API gateway', 'API-шлюз', '', 'noun phrase', 'Backend Development', 'The API gateway authenticates external requests.', 'lexigo-backend-v2', 'Единая точка входа для API.'),
    ('reverse proxy', 'обратный прокси', '', 'noun phrase', 'Backend Development', 'The reverse proxy terminates TLS and forwards traffic.', 'lexigo-backend-v2', 'Прокси-сервер перед приложением.'),
    ('load balancer', 'балансировщик нагрузки', '', 'noun phrase', 'Backend Development', 'The load balancer distributes requests across replicas.', 'lexigo-backend-v2', 'Компонент распределения трафика.'),
    ('service discovery', 'обнаружение сервисов', '', 'noun phrase', 'Backend Development', 'Service discovery provides the current instance addresses.', 'lexigo-backend-v2', 'Механизм поиска доступных экземпляров сервиса.'),
    ('configuration file', 'файл конфигурации', '', 'noun phrase', 'Backend Development', 'The configuration file defines non-secret defaults.', 'lexigo-backend-v2', 'Файл с параметрами приложения.'),
    ('environment variable', 'переменная окружения', '', 'noun phrase', 'Backend Development', 'The database address is read from an environment variable.', 'lexigo-backend-v2', 'Параметр, передаваемый процессу через окружение.'),
    ('secret management', 'управление секретами', '', 'noun phrase', 'Backend Development', 'Secret management keeps credentials out of source code.', 'lexigo-backend-v2', 'Безопасное хранение и выдача секретных значений.'),
    ('feature flag', 'флаг функциональности', '', 'noun phrase', 'Backend Development', 'The feature flag enables the new endpoint gradually.', 'lexigo-backend-v2', 'Переключатель для управляемого включения функции.'),
    ('concurrency', 'конкурентное выполнение', '', 'noun', 'Backend Development', 'The worker limits concurrency to protect the database.', 'lexigo-backend-v2', 'Одновременное выполнение нескольких операций.'),
    ('thread pool', 'пул потоков', '', 'noun phrase', 'Backend Development', 'The thread pool has a bounded queue.', 'lexigo-backend-v2', 'Набор переиспользуемых потоков выполнения.'),
    ('deadlock', 'взаимная блокировка', '', 'noun', 'Backend Development', 'The transaction failed because of a deadlock.', 'lexigo-backend-v2', 'Ситуация взаимного ожидания ресурсов.'),
    ('race condition', 'состояние гонки', '', 'noun phrase', 'Backend Development', 'The test exposed a race condition in the cache.', 'lexigo-backend-v2', 'Ошибка из-за непредсказуемого порядка конкурентных операций.'),
    ('memory leak', 'утечка памяти', '', 'noun phrase', 'Backend Development', 'The memory leak appears after repeated requests.', 'lexigo-backend-v2', 'Память, которая больше не нужна, но не освобождается.'),
    ('garbage collection', 'сборка мусора', '', 'noun phrase', 'Backend Development', 'Garbage collection pauses increased under load.', 'lexigo-backend-v2', 'Автоматическое освобождение неиспользуемой памяти.'),
    ('database index', 'индекс базы данных', '', 'noun phrase', 'Backend Development', 'A database index speeds up the lookup.', 'lexigo-backend-v2', 'Структура для ускорения поиска строк.'),
    ('query plan', 'план выполнения запроса', '', 'noun phrase', 'Backend Development', 'The query plan shows a sequential scan.', 'lexigo-backend-v2', 'Стратегия выполнения SQL-запроса.'),
    ('optimistic locking', 'оптимистическая блокировка', '', 'noun phrase', 'Backend Development', 'Optimistic locking rejects a stale update.', 'lexigo-backend-v2', 'Контроль конфликтов через версию записи.'),
    ('pessimistic locking', 'пессимистическая блокировка', '', 'noun phrase', 'Backend Development', 'Pessimistic locking holds the row until commit.', 'lexigo-backend-v2', 'Блокировка ресурса до завершения транзакции.')
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
