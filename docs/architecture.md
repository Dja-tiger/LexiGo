# Архитектура LexiGo

## Контекст

LexiGo должен одновременно быть рабочим инструментом для ежедневного изучения английского и учебным production-проектом на Go.

## Компоненты

1. **PWA / Next.js** — интерфейс для iPhone, desktop и tablet.
2. **Go API** — бизнес-логика, авторизация, интервальные повторения, импорт и AI orchestration.
3. **PostgreSQL** — пользователи, словарь, прогресс, история повторений и транзакционные данные.
4. **Redis** — rate limiting, кэш, краткоживущие состояния и будущие фоновые очереди.
5. **Caddy** — TLS termination и reverse proxy для stage/prod.

## Frontend routing

Публичная навигация построена на Next.js App Router и использует канонические pathname-маршруты:

| Экран | Маршрут |
| --- | --- |
| Главная | `/` |
| Настройка урока | `/learn` |
| Каталог фраз | `/phrases` |
| Карточка фразы | `/phrases/[slug]` |
| Словарь | `/dictionary` |
| Карточка слова | `/words/[id]` |
| Прогресс | `/progress` |
| Профиль и авторизация | `/profile` |
| Активный урок текущего пользователя | `/lesson/active` |

Принципы маршрутизации:

- верхнеуровневая навигация использует нативные ссылки Next.js `Link`, поэтому поддерживает открытие в новой вкладке, копирование адреса и стандартные browser controls;
- root layout содержит persistent client shell: переключение маршрута не перезапускает refresh-session preflight, outbox runtime и PWA lifecycle;
- тяжёлый product graph загружается отдельным client chunk только после восстановления сессии;
- текущая React state-модель экранов остаётся внутренним compatibility layer и синхронизируется с pathname/history;
- фильтры, сортировка, страница и detail identifier кодируются в URL; Back/Forward восстанавливают соответствующий экран и scroll position;
- отдельные per-tab snapshots хранят вложенный маршрут и scroll в `sessionStorage`; повреждённый snapshot удаляется локально без очистки остальных данных;
- устаревшие ссылки вида `/?view=...` принимаются только как migration input и заменяются каноническим URL;
- произвольный идентификатор lesson session не публикуется: маршрут `/lesson/active` разрешает backend определить активную сессию по аутентифицированному пользователю;
- гостевой вход в активный урок перенаправляется на `/profile` с причиной и `return_to`;
- `/dictionary` доступен как канонический shell без сессии, но персональный список, learning status и due queue не отдаются до успешной аутентификации; guest smoke проверяет явный authentication gate, а не приватные данные;
- одноразовые reset/email-change credentials передаются во fragment `/profile#...`, поэтому не попадают в HTTP access logs, query analytics и `Referer`;
- App Router предоставляет route-level loading, error и not-found boundaries;
- Service Worker кэширует HTML shell канонических маршрутов и использует `/` как fallback для динамических detail routes при offline navigation.

## Границы модулей backend

- `auth` — identity, пароли, access/refresh tokens и операции над refresh-token families;
- `account` — verified email change, экспорт персональных данных, удаление аккаунта и privacy-oriented flows;
- `words` — словарь и пользовательское состояние слов;
- `review` — будущий алгоритм интервальных повторений;
- `lesson` — формирование дневной сессии;
- `ai` — будущая интеграция с моделью;
- `platform` — PostgreSQL, Redis, migrations с PostgreSQL advisory lock.

## Управление аккаунтом и данными

- одно устройство представлено одной refresh-token family; ротация токена не создаёт дубликаты устройств в профиле;
- смена пароля и завершение остальных сессий требуют bearer-аутентификацию, CSRF и повторный ввод текущего пароля;
- смена пароля, отзыв чужих session families и запись security audit выполняются внутри одной PostgreSQL-транзакции;
- текущая session family сохраняется при смене пароля, остальные активные families отзываются;
- смена email начинается только после re-authentication текущим паролем и отправляет verification link исключительно на новый адрес;
- email-change token сохраняется только как SHA-256 digest, имеет TTL, является одноразовым и заменяет ранее выпущенные активные tokens пользователя;
- confirmation transaction блокирует token row, проверяет прежний identity, меняет login email, использует все pending tokens, отзывает все refresh families и пишет `email_changed` audit event;
- после подтверждения email security notification отправляется на прежний адрес; клиент переходит в guest state и должен войти с новым email;
- JSON-export имеет версионированную схему и включает профиль, настройки обучения, состояния слов, review history и security audit без password hash и token secrets;
- удаление требует текущий пароль и точное подтверждение email; `delete from users` каскадно удаляет зависимые пользовательские данные;
- delete-запрос использует optimistic credential check по актуальному password hash, чтобы не удалить аккаунт после конкурентной смены credentials;
- успешное удаление очищает refresh/CSRF cookies и возвращает `Clear-Site-Data` для browser cache и storage;
- уведомления о смене пароля, email и удалении отправляются только после успешной транзакции; SMTP failure логируется и не заставляет клиента повторять уже совершённую операцию;
- все чувствительные ответы используют `Cache-Control: no-store`.

## Безопасность

- пароли хэшируются bcrypt cost 12;
- refresh token и одноразовые email/reset tokens хранятся только как SHA-256 hashes;
- refresh rotation выполняется транзакционно;
- access token подписывается HS256;
- state-changing cookie-authenticated операции защищены synchronizer CSRF token;
- security audit хранит тип события, время, user agent, IP и безопасные metadata без secrets;
- SMTP transport требует STARTTLS и TLS 1.2+; log delivery разрешён только в local/test;
- секреты находятся только в environment/GitHub Secrets;
- production deploy требует ручного подтверждения GitHub Environment;
- SSH host key передаётся через проверенный GitHub Secret `DEPLOY_KNOWN_HOSTS`.

## Масштабирование

API stateless, поэтому горизонтально масштабируется. Состояние хранится в PostgreSQL/Redis. До появления реальной нагрузки Kubernetes не нужен; Docker Compose снижает операционную сложность.
