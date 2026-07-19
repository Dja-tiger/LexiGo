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
- App Router предоставляет route-level loading, error и not-found boundaries;
- Service Worker кэширует HTML shell канонических маршрутов и использует `/` как fallback для динамических detail routes при offline navigation.

## Границы модулей backend

- `auth` — identity, пароли, access/refresh tokens;
- `words` — словарь и пользовательское состояние слов;
- `review` — будущий алгоритм интервальных повторений;
- `lesson` — формирование дневной сессии;
- `ai` — будущая интеграция с моделью;
- `platform` — PostgreSQL, Redis, migrations с PostgreSQL advisory lock.

## Безопасность

- пароли хэшируются bcrypt cost 12;
- refresh token хранится только как SHA-256 hash;
- refresh rotation выполняется транзакционно;
- access token подписывается HS256;
- секреты находятся только в environment/GitHub Secrets;
- production deploy требует ручного подтверждения GitHub Environment;
- SSH host key передаётся через проверенный GitHub Secret `DEPLOY_KNOWN_HOSTS`.

## Масштабирование

API stateless, поэтому горизонтально масштабируется. Состояние хранится в PostgreSQL/Redis. До появления реальной нагрузки Kubernetes не нужен; Docker Compose снижает операционную сложность.
