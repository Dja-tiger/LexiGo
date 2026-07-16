with entries (
    lemma, translation, phonetic, part_of_speech, topic, example, source, note,
    slug, cloze, cloze_answer
) as (
    values
    ('The endpoint returns a 404 response.', 'Эндпоинт возвращает ответ 404.', '', 'phrase', 'Backend Development', 'The endpoint returns a 404 response when the resource is missing.', 'lexigo-themed-phrases-v2', 'Стандартная формулировка поведения API.', 'phrase-the-endpoint-returns-a-404-response', 'The endpoint returns a 404 _____.', 'response'),
    ('The request payload is invalid.', 'Полезная нагрузка запроса некорректна.', '', 'phrase', 'Backend Development', 'The request payload is invalid because a required field is missing.', 'lexigo-themed-phrases-v2', 'payload — данные запроса.', 'phrase-the-request-payload-is-invalid', 'The request payload is _____.', 'invalid'),
    ('The token has expired.', 'Срок действия токена истёк.', '', 'phrase', 'Backend Development', 'The token has expired and must be refreshed.', 'lexigo-themed-phrases-v2', 'expired — истёкший.', 'phrase-the-token-has-expired', 'The token has _____.', 'expired'),
    ('The user does not have permission.', 'У пользователя нет разрешения.', '', 'phrase', 'Backend Development', 'The user does not have permission to delete this resource.', 'lexigo-themed-phrases-v2', 'Фраза для ошибки авторизации.', 'phrase-the-user-does-not-have-permission', 'The user does not have _____.', 'permission'),
    ('The transaction was rolled back.', 'Транзакция была отменена.', '', 'phrase', 'Backend Development', 'The transaction was rolled back after the insert failed.', 'lexigo-themed-phrases-v2', 'roll back — откатить изменения.', 'phrase-the-transaction-was-rolled-back', 'The transaction was rolled _____.', 'back'),
    ('The connection pool is exhausted.', 'Пул соединений исчерпан.', '', 'phrase', 'Backend Development', 'The connection pool is exhausted during traffic spikes.', 'lexigo-themed-phrases-v2', 'exhausted — все доступные ресурсы заняты.', 'phrase-the-connection-pool-is-exhausted', 'The connection pool is _____.', 'exhausted'),
    ('The cache entry is stale.', 'Запись в кэше устарела.', '', 'phrase', 'Backend Development', 'The cache entry is stale and should be invalidated.', 'lexigo-themed-phrases-v2', 'stale cache entry — устаревшее значение.', 'phrase-the-cache-entry-is-stale', 'The cache entry is _____.', 'stale'),
    ('The request timed out.', 'Время ожидания запроса истекло.', '', 'phrase', 'Backend Development', 'The request timed out while waiting for the upstream service.', 'lexigo-themed-phrases-v2', 'timed out — завершился по таймауту.', 'phrase-the-request-timed-out', 'The request timed _____.', 'out'),
    ('The service failed to start.', 'Сервис не смог запуститься.', '', 'phrase', 'Backend Development', 'The service failed to start because the configuration is invalid.', 'lexigo-themed-phrases-v2', 'failed to start — не смог запуститься.', 'phrase-the-service-failed-to-start', 'The service failed to _____.', 'start'),
    ('The health check is failing.', 'Проверка состояния завершается ошибкой.', '', 'phrase', 'Backend Development', 'The health check is failing because the database is unavailable.', 'lexigo-themed-phrases-v2', 'Фраза для диагностики готовности сервиса.', 'phrase-the-health-check-is-failing', 'The health check is _____.', 'failing'),
    ('We need to add input validation.', 'Нам нужно добавить валидацию входных данных.', '', 'phrase', 'Backend Development', 'We need to add input validation before calling the service layer.', 'lexigo-themed-phrases-v2', 'input validation — проверка входных данных.', 'phrase-we-need-to-add-input-validation', 'We need to add input _____.', 'validation'),
    ('This operation must be idempotent.', 'Эта операция должна быть идемпотентной.', '', 'phrase', 'Backend Development', 'This operation must be idempotent because clients may retry it.', 'lexigo-themed-phrases-v2', 'Требование к безопасно повторяемой операции.', 'phrase-this-operation-must-be-idempotent', 'This operation must be _____.', 'idempotent'),
    ('The retry should use exponential backoff.', 'Повторная попытка должна использовать экспоненциальную задержку.', '', 'phrase', 'Backend Development', 'The retry should use exponential backoff with jitter.', 'lexigo-themed-phrases-v2', 'Стандартная стратегия повторных попыток.', 'phrase-the-retry-should-use-exponential-backoff', 'The retry should use exponential _____.', 'backoff'),
    ('The feature flag is disabled.', 'Флаг функциональности отключён.', '', 'phrase', 'Backend Development', 'The feature flag is disabled in production.', 'lexigo-themed-phrases-v2', 'disabled — отключён.', 'phrase-the-feature-flag-is-disabled', 'The feature flag is _____.', 'disabled'),
    ('The API is rate-limited.', 'API ограничен по частоте запросов.', '', 'phrase', 'Backend Development', 'The API is rate-limited per client identifier.', 'lexigo-themed-phrases-v2', 'rate-limited — ограниченный по числу запросов.', 'phrase-the-api-is-rate-limited', 'The API is rate-_____.', 'limited'),
    ('The database query needs an index.', 'Запросу к базе данных нужен индекс.', '', 'phrase', 'Backend Development', 'The database query needs an index on the filtering columns.', 'lexigo-themed-phrases-v2', 'Фраза для обсуждения оптимизации SQL.', 'phrase-the-database-query-needs-an-index', 'The database query needs an _____.', 'index'),
    ('The lock caused a deadlock.', 'Блокировка вызвала взаимную блокировку.', '', 'phrase', 'Backend Development', 'The lock caused a deadlock between two transactions.', 'lexigo-themed-phrases-v2', 'deadlock — взаимная блокировка.', 'phrase-the-lock-caused-a-deadlock', 'The lock caused a _____.', 'deadlock'),
    ('There is a race condition here.', 'Здесь есть состояние гонки.', '', 'phrase', 'Backend Development', 'There is a race condition here when two workers update the cache.', 'lexigo-themed-phrases-v2', 'Фраза для code review конкурентного кода.', 'phrase-there-is-a-race-condition-here', 'There is a race condition _____.', 'here'),
    ('The worker is leaking memory.', 'Воркер допускает утечку памяти.', '', 'phrase', 'Backend Development', 'The worker is leaking memory after every completed job.', 'lexigo-themed-phrases-v2', 'leaking memory — постепенно терять доступную память.', 'phrase-the-worker-is-leaking-memory', 'The worker is leaking _____.', 'memory'),
    ('The response should include pagination metadata.', 'Ответ должен включать метаданные пагинации.', '', 'phrase', 'Backend Development', 'The response should include pagination metadata and the next cursor.', 'lexigo-themed-phrases-v2', 'Требование к API со списками.', 'phrase-the-response-should-include-pagination-metadata', 'The response should include pagination _____.', 'metadata'),
    ('The service must shut down gracefully.', 'Сервис должен завершаться корректно.', '', 'phrase', 'Backend Development', 'The service must shut down gracefully without dropping active requests.', 'lexigo-themed-phrases-v2', 'gracefully — корректно, с завершением текущей работы.', 'phrase-the-service-must-shut-down-gracefully', 'The service must shut down _____.', 'gracefully'),
    ('The secret must not be logged.', 'Секрет нельзя записывать в лог.', '', 'phrase', 'Backend Development', 'The secret must not be logged even at debug level.', 'lexigo-themed-phrases-v2', 'Критичное правило безопасности.', 'phrase-the-secret-must-not-be-logged', 'The secret must not be _____.', 'logged'),
    ('The configuration is loaded from the environment.', 'Конфигурация загружается из окружения.', '', 'phrase', 'Backend Development', 'The configuration is loaded from the environment at startup.', 'lexigo-themed-phrases-v2', 'from the environment — из переменных окружения.', 'phrase-the-configuration-is-loaded-from-the-environment', 'The configuration is loaded from the _____.', 'environment'),
    ('The gateway forwards the request.', 'Шлюз перенаправляет запрос.', '', 'phrase', 'Backend Development', 'The gateway forwards the request to a healthy service instance.', 'lexigo-themed-phrases-v2', 'forward a request — передать запрос дальше.', 'phrase-the-gateway-forwards-the-request', 'The gateway forwards the _____.', 'request'),
    ('Let''s add an integration test for this case.', 'Давайте добавим интеграционный тест для этого случая.', '', 'phrase', 'Backend Development', 'Let''s add an integration test for this case before merging the change.', 'lexigo-themed-phrases-v2', 'Частотная фраза при обсуждении качества реализации.', 'phrase-lets-add-an-integration-test-for-this-case', 'Let''s add an integration test for this _____.', 'case')
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
