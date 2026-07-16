# Архитектура LexiGo

## Контекст

LexiGo должен одновременно быть рабочим инструментом для ежедневного изучения английского и учебным production-проектом на Go.

## Компоненты

1. **PWA / Next.js** — интерфейс для iPhone, desktop и tablet.
2. **Go API** — бизнес-логика, авторизация, интервальные повторения, импорт и AI orchestration.
3. **PostgreSQL** — пользователи, словарь, прогресс, история повторений и транзакционные данные.
4. **Redis** — rate limiting, кэш, краткоживущие состояния и будущие фоновые очереди.
5. **Caddy** — TLS termination и reverse proxy для stage/prod.

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
