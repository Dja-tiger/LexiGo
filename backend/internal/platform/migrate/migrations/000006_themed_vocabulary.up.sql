with themed_words (
    lemma, translation, phonetic, part_of_speech, topic, example, source, note
) as (
    values
    ('groceries', 'продукты', '', 'noun', 'Daily Life', 'I need to buy groceries after work.', 'lexigo-daily-life-v1', 'Повседневное слово для продуктов из магазина.'),
    ('receipt', 'чек', '', 'noun', 'Daily Life', 'Could I have the receipt, please?', 'lexigo-daily-life-v1', 'Подтверждение покупки.'),
    ('bill', 'счёт', '', 'noun', 'Daily Life', 'Could you bring the bill, please?', 'lexigo-daily-life-v1', 'Счёт за услугу, коммунальные услуги или еду.'),
    ('rent', 'арендная плата', '', 'noun', 'Daily Life', 'The rent is due on the first day of the month.', 'lexigo-daily-life-v1', 'Регулярная плата за жильё.'),
    ('landlord', 'арендодатель', '', 'noun', 'Daily Life', 'I called the landlord about the heating.', 'lexigo-daily-life-v1', 'Владелец или управляющий арендуемого жилья.'),
    ('neighbor', 'сосед', '', 'noun', 'Daily Life', 'My neighbor helped me carry the boxes.', 'lexigo-daily-life-v1', 'Человек, живущий рядом.'),
    ('appointment', 'запись, назначенная встреча', '', 'noun', 'Daily Life', 'I have a doctor''s appointment at three.', 'lexigo-daily-life-v1', 'Встреча или визит на конкретное время.'),
    ('pharmacy', 'аптека', '', 'noun', 'Daily Life', 'Is there a pharmacy nearby?', 'lexigo-daily-life-v1', 'Место, где покупают лекарства.'),
    ('medicine', 'лекарство', '', 'noun', 'Daily Life', 'How often should I take this medicine?', 'lexigo-daily-life-v1', 'Общее слово для лекарства.'),
    ('laundry', 'стирка, бельё для стирки', '', 'noun', 'Daily Life', 'I need to do the laundry tonight.', 'lexigo-daily-life-v1', 'Одежда для стирки или сам процесс.'),
    ('detergent', 'моющее средство', '', 'noun', 'Daily Life', 'We are out of laundry detergent.', 'lexigo-daily-life-v1', 'Средство для стирки или уборки.'),
    ('charger', 'зарядное устройство', '', 'noun', 'Daily Life', 'I forgot my phone charger at home.', 'lexigo-daily-life-v1', 'Устройство для зарядки техники.'),
    ('keys', 'ключи', '', 'noun', 'Daily Life', 'Have you seen my keys?', 'lexigo-daily-life-v1', 'Обычно употребляется во множественном числе.'),
    ('wallet', 'кошелёк', '', 'noun', 'Daily Life', 'I left my wallet in the car.', 'lexigo-daily-life-v1', 'Кошелёк для денег и карт.'),
    ('cash', 'наличные', '', 'noun', 'Daily Life', 'Do you accept cash?', 'lexigo-daily-life-v1', 'Деньги в банкнотах и монетах.'),
    ('change', 'сдача', '', 'noun', 'Daily Life', 'Keep the change.', 'lexigo-daily-life-v1', 'Оставшиеся деньги после оплаты.'),
    ('queue', 'очередь', '', 'noun', 'Daily Life', 'There is a long queue at the checkout.', 'lexigo-daily-life-v1', 'Британский вариант; в США часто line.'),
    ('delivery', 'доставка', '', 'noun', 'Daily Life', 'The delivery should arrive this evening.', 'lexigo-daily-life-v1', 'Доставка товара или еды.'),
    ('address', 'адрес', '', 'noun', 'Daily Life', 'Please confirm the delivery address.', 'lexigo-daily-life-v1', 'Адрес проживания или доставки.'),
    ('entrance', 'вход', '', 'noun', 'Daily Life', 'The main entrance is around the corner.', 'lexigo-daily-life-v1', 'Место входа в здание.'),
    ('elevator', 'лифт', '', 'noun', 'Daily Life', 'Take the elevator to the fifth floor.', 'lexigo-daily-life-v1', 'В британском английском также lift.'),
    ('heating', 'отопление', '', 'noun', 'Daily Life', 'The heating is not working.', 'lexigo-daily-life-v1', 'Система обогрева помещения.'),
    ('electricity', 'электричество', '', 'noun', 'Daily Life', 'The electricity went off for an hour.', 'lexigo-daily-life-v1', 'Электроснабжение или электрическая энергия.'),
    ('emergency', 'чрезвычайная ситуация', '', 'noun', 'Daily Life', 'Call this number in an emergency.', 'lexigo-daily-life-v1', 'Ситуация, требующая срочной помощи.'),
    ('borrow', 'одолжить у кого-то', '', 'verb', 'Daily Life', 'Can I borrow your charger?', 'lexigo-daily-life-v1', 'Взять вещь временно у другого человека.'),
    ('lend', 'одолжить кому-то', '', 'verb', 'Daily Life', 'Could you lend me a pen?', 'lexigo-daily-life-v1', 'Дать вещь другому человеку временно.'),
    ('repair', 'ремонтировать', '', 'verb', 'Daily Life', 'They will repair the washing machine tomorrow.', 'lexigo-daily-life-v1', 'Исправить неисправную вещь.'),
    ('clean', 'убирать, чистить', '', 'verb', 'Daily Life', 'I need to clean the kitchen.', 'lexigo-daily-life-v1', 'Сделать помещение или предмет чистым.'),
    ('cook', 'готовить еду', '', 'verb', 'Daily Life', 'I usually cook dinner at home.', 'lexigo-daily-life-v1', 'Готовить пищу.'),
    ('pay', 'платить', '', 'verb', 'Daily Life', 'Can I pay by card?', 'lexigo-daily-life-v1', 'Передавать деньги за товар или услугу.'),
    ('passport', 'паспорт', '', 'noun', 'Travel', 'Keep your passport in a safe place.', 'lexigo-travel-v1', 'Главный документ для международной поездки.'),
    ('boarding pass', 'посадочный талон', '', 'noun phrase', 'Travel', 'Your boarding pass is available in the app.', 'lexigo-travel-v1', 'Документ для посадки на самолёт.'),
    ('luggage', 'багаж', '', 'noun', 'Travel', 'Where can I leave my luggage?', 'lexigo-travel-v1', 'Неисчисляемое существительное.'),
    ('suitcase', 'чемодан', '', 'noun', 'Travel', 'My suitcase is too heavy.', 'lexigo-travel-v1', 'Отдельный предмет багажа.'),
    ('backpack', 'рюкзак', '', 'noun', 'Travel', 'I only travel with a small backpack.', 'lexigo-travel-v1', 'Сумка, которую носят на спине.'),
    ('ticket', 'билет', '', 'noun', 'Travel', 'I bought a train ticket online.', 'lexigo-travel-v1', 'Билет на транспорт или мероприятие.'),
    ('reservation', 'бронирование', '', 'noun', 'Travel', 'I have a reservation under the name Jalil.', 'lexigo-travel-v1', 'Предварительно закреплённое место или номер.'),
    ('accommodation', 'жильё, размещение', '', 'noun', 'Travel', 'We need affordable accommodation near the center.', 'lexigo-travel-v1', 'Общее слово для места проживания.'),
    ('hotel', 'отель', '', 'noun', 'Travel', 'The hotel is within walking distance of the station.', 'lexigo-travel-v1', 'Место временного проживания.'),
    ('hostel', 'хостел', '', 'noun', 'Travel', 'The hostel has a shared kitchen.', 'lexigo-travel-v1', 'Бюджетное размещение, часто с общими комнатами.'),
    ('airport', 'аэропорт', '', 'noun', 'Travel', 'How long does it take to get to the airport?', 'lexigo-travel-v1', 'Место отправления и прибытия самолётов.'),
    ('departure', 'отправление', '', 'noun', 'Travel', 'The departure is scheduled for 8:20.', 'lexigo-travel-v1', 'Отправление транспорта.'),
    ('arrival', 'прибытие', '', 'noun', 'Travel', 'Please check the arrival time.', 'lexigo-travel-v1', 'Прибытие транспорта или человека.'),
    ('gate', 'выход на посадку', '', 'noun', 'Travel', 'Our flight leaves from gate 12.', 'lexigo-travel-v1', 'Зона посадки в аэропорту.'),
    ('platform', 'платформа', '', 'noun', 'Travel', 'The train to Berlin leaves from platform six.', 'lexigo-travel-v1', 'Платформа на железнодорожной станции.'),
    ('customs', 'таможня', '', 'noun', 'Travel', 'We had to declare the item at customs.', 'lexigo-travel-v1', 'Государственный контроль товаров на границе.'),
    ('border', 'граница', '', 'noun', 'Travel', 'There may be delays at the border.', 'lexigo-travel-v1', 'Граница между странами.'),
    ('currency', 'валюта', '', 'noun', 'Travel', 'What currency is used here?', 'lexigo-travel-v1', 'Денежная единица страны.'),
    ('exchange rate', 'обменный курс', '', 'noun phrase', 'Travel', 'The exchange rate is better at the bank.', 'lexigo-travel-v1', 'Соотношение стоимости двух валют.'),
    ('map', 'карта', '', 'noun', 'Travel', 'Can you show me this place on the map?', 'lexigo-travel-v1', 'Схема местности или маршрута.'),
    ('route', 'маршрут', '', 'noun', 'Travel', 'This is the fastest route to the airport.', 'lexigo-travel-v1', 'Путь от одной точки к другой.'),
    ('destination', 'место назначения', '', 'noun', 'Travel', 'Paris is our final destination.', 'lexigo-travel-v1', 'Конечная точка поездки.'),
    ('sightseeing', 'осмотр достопримечательностей', '', 'noun', 'Travel', 'We spent the afternoon sightseeing.', 'lexigo-travel-v1', 'Посещение интересных мест в городе.'),
    ('delay', 'задержка', '', 'noun', 'Travel', 'The flight has a two-hour delay.', 'lexigo-travel-v1', 'Опоздание транспорта или события.'),
    ('cancellation', 'отмена', '', 'noun', 'Travel', 'The airline confirmed the cancellation.', 'lexigo-travel-v1', 'Отмена рейса, поезда или бронирования.'),
    ('transfer', 'пересадка, трансфер', '', 'noun', 'Travel', 'We have a short transfer in Istanbul.', 'lexigo-travel-v1', 'Пересадка между рейсами или организованная поездка.'),
    ('check in', 'зарегистрироваться, заселиться', '', 'phrasal verb', 'Travel', 'You can check in online 24 hours before departure.', 'lexigo-travel-v1', 'Регистрация на рейс или заселение в отель.'),
    ('check out', 'выселиться', '', 'phrasal verb', 'Travel', 'We need to check out before noon.', 'lexigo-travel-v1', 'Оформить выезд из отеля.'),
    ('book', 'бронировать', '', 'verb', 'Travel', 'I need to book a room for two nights.', 'lexigo-travel-v1', 'Заранее заказать билет, номер или место.'),
    ('miss', 'опоздать, пропустить', '', 'verb', 'Travel', 'We might miss the last train.', 'lexigo-travel-v1', 'Не успеть на транспорт или пропустить событие.'),
    ('data pipeline', 'конвейер данных', '', 'noun phrase', 'Data Engineering', 'The data pipeline loads sales data every hour.', 'lexigo-data-engineering-v1', 'Последовательность этапов обработки и доставки данных.'),
    ('data warehouse', 'хранилище данных', '', 'noun phrase', 'Data Engineering', 'The report reads aggregated data from the data warehouse.', 'lexigo-data-engineering-v1', 'Централизованное аналитическое хранилище.'),
    ('data lake', 'озеро данных', '', 'noun phrase', 'Data Engineering', 'Raw events are stored in the data lake.', 'lexigo-data-engineering-v1', 'Хранилище больших объёмов исходных данных.'),
    ('data lakehouse', 'лейкхаус', '', 'noun phrase', 'Data Engineering', 'The lakehouse combines open storage with warehouse features.', 'lexigo-data-engineering-v1', 'Архитектура, сочетающая data lake и warehouse.'),
    ('batch processing', 'пакетная обработка', '', 'noun phrase', 'Data Engineering', 'Batch processing runs after the nightly load.', 'lexigo-data-engineering-v1', 'Обработка накопленного набора данных.'),
    ('stream processing', 'потоковая обработка', '', 'noun phrase', 'Data Engineering', 'Stream processing handles events in near real time.', 'lexigo-data-engineering-v1', 'Непрерывная обработка входящих событий.'),
    ('data ingestion', 'приём данных', '', 'noun phrase', 'Data Engineering', 'Data ingestion starts when the source file arrives.', 'lexigo-data-engineering-v1', 'Загрузка данных из источника в платформу.'),
    ('data extraction', 'извлечение данных', '', 'noun phrase', 'Data Engineering', 'Data extraction reads only changed records.', 'lexigo-data-engineering-v1', 'Получение данных из исходной системы.'),
    ('data transformation', 'преобразование данных', '', 'noun phrase', 'Data Engineering', 'The transformation standardizes timestamps and identifiers.', 'lexigo-data-engineering-v1', 'Изменение структуры, формата или значений данных.'),
    ('data loading', 'загрузка данных', '', 'noun phrase', 'Data Engineering', 'Data loading writes the result to the target table.', 'lexigo-data-engineering-v1', 'Запись подготовленных данных в целевую систему.'),
    ('orchestration', 'оркестрация', '', 'noun', 'Data Engineering', 'Airflow is used for workflow orchestration.', 'lexigo-data-engineering-v1', 'Координация задач, зависимостей и расписаний.'),
    ('scheduler', 'планировщик', '', 'noun', 'Data Engineering', 'The scheduler triggers the job every fifteen minutes.', 'lexigo-data-engineering-v1', 'Компонент, запускающий задачи по расписанию.'),
    ('workflow', 'рабочий процесс', '', 'noun', 'Data Engineering', 'The workflow contains extraction, validation and loading steps.', 'lexigo-data-engineering-v1', 'Связанная последовательность задач.'),
    ('dependency', 'зависимость', '', 'noun', 'Data Engineering', 'The downstream task waits for its dependency.', 'lexigo-data-engineering-v1', 'Связь, определяющая порядок выполнения.'),
    ('partition', 'партиция, раздел данных', '', 'noun', 'Data Engineering', 'Each partition contains one day of data.', 'lexigo-data-engineering-v1', 'Логическая часть таблицы или набора данных.'),
    ('watermark', 'водяной знак обработки', '', 'noun', 'Data Engineering', 'The watermark stores the latest processed timestamp.', 'lexigo-data-engineering-v1', 'Граница уже обработанных данных.'),
    ('checkpoint', 'контрольная точка', '', 'noun', 'Data Engineering', 'The consumer resumes from the latest checkpoint.', 'lexigo-data-engineering-v1', 'Сохранённое состояние для продолжения обработки.'),
    ('schema evolution', 'эволюция схемы', '', 'noun phrase', 'Data Engineering', 'Schema evolution must remain compatible with existing readers.', 'lexigo-data-engineering-v1', 'Изменение структуры данных со временем.'),
    ('data lineage', 'происхождение и путь данных', '', 'noun phrase', 'Data Engineering', 'Data lineage shows where the metric comes from.', 'lexigo-data-engineering-v1', 'Связи от источника до итогового набора данных.'),
    ('data quality', 'качество данных', '', 'noun phrase', 'Data Engineering', 'The data quality check found missing store identifiers.', 'lexigo-data-engineering-v1', 'Полнота, точность, согласованность и актуальность данных.'),
    ('data validation', 'валидация данных', '', 'noun phrase', 'Data Engineering', 'Data validation runs before the table is published.', 'lexigo-data-engineering-v1', 'Проверка данных по правилам и ограничениям.'),
    ('deduplication', 'дедупликация', '', 'noun', 'Data Engineering', 'Deduplication removes repeated events by their identifier.', 'lexigo-data-engineering-v1', 'Удаление повторяющихся записей.'),
    ('backfill', 'дозагрузка исторических данных', '', 'noun', 'Data Engineering', 'We need a backfill for the previous seven days.', 'lexigo-data-engineering-v1', 'Повторная или дополнительная загрузка прошлого периода.'),
    ('incremental load', 'инкрементальная загрузка', '', 'noun phrase', 'Data Engineering', 'The incremental load processes records changed since yesterday.', 'lexigo-data-engineering-v1', 'Загрузка только новых или изменённых данных.'),
    ('full load', 'полная загрузка', '', 'noun phrase', 'Data Engineering', 'A full load replaces the complete target dataset.', 'lexigo-data-engineering-v1', 'Перезагрузка всего набора данных.'),
    ('change data capture', 'захват изменений данных', '', 'noun phrase', 'Data Engineering', 'Change data capture publishes database updates to Kafka.', 'lexigo-data-engineering-v1', 'Получение вставок, обновлений и удалений из источника.'),
    ('slowly changing dimension', 'медленно изменяющееся измерение', '', 'noun phrase', 'Data Engineering', 'A slowly changing dimension preserves attribute history.', 'lexigo-data-engineering-v1', 'Подход к хранению истории изменений справочника.'),
    ('surrogate key', 'суррогатный ключ', '', 'noun phrase', 'Data Engineering', 'The dimension uses a surrogate key instead of the source identifier.', 'lexigo-data-engineering-v1', 'Технический ключ, не зависящий от бизнес-идентификатора.'),
    ('data skew', 'перекос данных', '', 'noun phrase', 'Data Engineering', 'Data skew overloads a small number of partitions.', 'lexigo-data-engineering-v1', 'Неравномерное распределение данных между узлами.'),
    ('partition pruning', 'отсечение партиций', '', 'noun phrase', 'Data Engineering', 'Partition pruning reduces the amount of scanned data.', 'lexigo-data-engineering-v1', 'Чтение только подходящих разделов таблицы.'),
    ('API endpoint', 'эндпоинт API', '', 'noun phrase', 'Backend Development', 'The API endpoint returns the current user profile.', 'lexigo-backend-v1', 'Адрес и операция, доступные клиенту API.'),
    ('request body', 'тело запроса', '', 'noun phrase', 'Backend Development', 'The request body must contain a valid email address.', 'lexigo-backend-v1', 'Данные, отправленные клиентом в HTTP-запросе.'),
    ('response body', 'тело ответа', '', 'noun phrase', 'Backend Development', 'The response body contains the created resource.', 'lexigo-backend-v1', 'Данные, возвращаемые сервером.'),
    ('HTTP status code', 'код состояния HTTP', '', 'noun phrase', 'Backend Development', 'The handler returns an HTTP status code of 201.', 'lexigo-backend-v1', 'Числовой результат обработки HTTP-запроса.'),
    ('route handler', 'обработчик маршрута', '', 'noun phrase', 'Backend Development', 'The route handler validates input before calling the service.', 'lexigo-backend-v1', 'Функция, обрабатывающая конкретный маршрут.'),
    ('middleware', 'промежуточный обработчик', '', 'noun', 'Backend Development', 'Authentication middleware checks the access token.', 'lexigo-backend-v1', 'Слой обработки между запросом и конечным handler.'),
    ('authentication', 'аутентификация', '', 'noun', 'Backend Development', 'Authentication verifies who the user is.', 'lexigo-backend-v1', 'Проверка личности пользователя.'),
    ('authorization', 'авторизация', '', 'noun', 'Backend Development', 'Authorization determines what the user may access.', 'lexigo-backend-v1', 'Проверка прав уже известного пользователя.'),
    ('access token', 'токен доступа', '', 'noun phrase', 'Backend Development', 'The client sends the access token in the Authorization header.', 'lexigo-backend-v1', 'Короткоживущий токен для доступа к API.'),
    ('refresh token', 'токен обновления', '', 'noun phrase', 'Backend Development', 'The refresh token is exchanged for a new access token.', 'lexigo-backend-v1', 'Долгоживущий секрет для обновления сессии.'),
    ('session', 'сессия', '', 'noun', 'Backend Development', 'The session remains active across page reloads.', 'lexigo-backend-v1', 'Состояние взаимодействия пользователя с системой.'),
    ('cookie', 'cookie-файл', '', 'noun', 'Backend Development', 'The server stores the session identifier in a secure cookie.', 'lexigo-backend-v1', 'Небольшое значение, которое браузер отправляет серверу.'),
    ('database transaction', 'транзакция базы данных', '', 'noun phrase', 'Backend Development', 'The database transaction commits all changes together.', 'lexigo-backend-v1', 'Атомарная группа операций чтения и записи.'),
    ('connection pool', 'пул соединений', '', 'noun phrase', 'Backend Development', 'The connection pool limits concurrent database sessions.', 'lexigo-backend-v1', 'Набор переиспользуемых подключений к базе данных.'),
    ('cache', 'кэш', '', 'noun', 'Backend Development', 'The cache reduces repeated database reads.', 'lexigo-backend-v1', 'Быстрое временное хранилище результатов.'),
    ('cache invalidation', 'инвалидация кэша', '', 'noun phrase', 'Backend Development', 'Cache invalidation runs after the record is updated.', 'lexigo-backend-v1', 'Удаление или обновление устаревших данных в кэше.'),
    ('message queue', 'очередь сообщений', '', 'noun phrase', 'Backend Development', 'The message queue decouples the API from background processing.', 'lexigo-backend-v1', 'Буфер для асинхронного обмена сообщениями.'),
    ('background job', 'фоновая задача', '', 'noun phrase', 'Backend Development', 'A background job sends the weekly report.', 'lexigo-backend-v1', 'Задача, выполняемая вне пользовательского HTTP-запроса.'),
    ('retry policy', 'политика повторных попыток', '', 'noun phrase', 'Backend Development', 'The retry policy uses exponential backoff.', 'lexigo-backend-v1', 'Правила повторения временно неуспешной операции.'),
    ('timeout', 'таймаут', '', 'noun', 'Backend Development', 'The client timeout is shorter than the server timeout.', 'lexigo-backend-v1', 'Максимальное время ожидания операции.'),
    ('rate limiter', 'ограничитель частоты запросов', '', 'noun phrase', 'Backend Development', 'The rate limiter protects the login endpoint.', 'lexigo-backend-v1', 'Компонент, ограничивающий число запросов.'),
    ('circuit breaker', 'автоматический выключатель', '', 'noun phrase', 'Backend Development', 'The circuit breaker stops calls to an unhealthy dependency.', 'lexigo-backend-v1', 'Паттерн защиты от повторных обращений к сбойному сервису.'),
    ('idempotency key', 'ключ идемпотентности', '', 'noun phrase', 'Backend Development', 'The idempotency key prevents duplicate payments.', 'lexigo-backend-v1', 'Ключ, позволяющий безопасно повторять запрос.'),
    ('health check', 'проверка состояния', '', 'noun phrase', 'Backend Development', 'The health check verifies the database connection.', 'lexigo-backend-v1', 'Проверка готовности или работоспособности сервиса.'),
    ('graceful shutdown', 'корректное завершение', '', 'noun phrase', 'Backend Development', 'Graceful shutdown lets active requests finish.', 'lexigo-backend-v1', 'Остановка сервиса без обрыва текущей работы.'),
    ('logging', 'логирование', '', 'noun', 'Backend Development', 'Structured logging makes incidents easier to investigate.', 'lexigo-backend-v1', 'Запись событий приложения.'),
    ('tracing', 'трассировка', '', 'noun', 'Backend Development', 'Distributed tracing follows one request across services.', 'lexigo-backend-v1', 'Отслеживание запроса через несколько компонентов.'),
    ('error handling', 'обработка ошибок', '', 'noun phrase', 'Backend Development', 'Centralized error handling keeps API responses consistent.', 'lexigo-backend-v1', 'Преобразование ошибок в управляемое поведение и ответы.'),
    ('serialization', 'сериализация', '', 'noun', 'Backend Development', 'Serialization converts the object into JSON.', 'lexigo-backend-v1', 'Преобразование объекта в передаваемый формат.'),
    ('pagination', 'пагинация', '', 'noun', 'Backend Development', 'Cursor pagination works well for large result sets.', 'lexigo-backend-v1', 'Разделение большого списка на части.')
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
from themed_words;

insert into user_words (user_id, word_id)
select users.id, words.id
from users
cross join words
where words.source in (
    'lexigo-daily-life-v1',
    'lexigo-travel-v1',
    'lexigo-data-engineering-v1',
    'lexigo-backend-v1'
)
on conflict (user_id, word_id) do nothing;

create or replace function enroll_default_words_for_user()
returns trigger
language plpgsql
as $$
begin
    insert into user_words (user_id, word_id)
    select new.id, words.id
    from words
    where words.source in (
        'hakui-technical-english-2020',
        'lexigo-technical-phrases-v1',
        'lexigo-daily-life-v1',
        'lexigo-travel-v1',
        'lexigo-data-engineering-v1',
        'lexigo-backend-v1'
    )
    on conflict (user_id, word_id) do nothing;

    return new;
end;
$$;

alter table lesson_sessions drop constraint lesson_sessions_source_chk;
alter table lesson_sessions
    add constraint lesson_sessions_source_chk
        check (source in (
            'mixed',
            'noun',
            'verb',
            'adjective',
            'phrases',
            'daily-life',
            'travel',
            'data-engineering',
            'backend'
        ));
