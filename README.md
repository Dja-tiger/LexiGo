# LexiGo

LexiGo — персональный тренажёр английской лексики с интервальными повторениями, техническим английским и AI-практикой.

Проект строится как production-oriented monorepo:

- `backend/` — Go API;
- `frontend/` — Next.js PWA, устанавливаемая на экран «Домой» iPhone;
- PostgreSQL — основное хранилище;
- Redis — кэш, rate limiting и инфраструктура сессий;
- Docker Compose — локальный контур;
- GitHub Actions — CI, интеграционные тесты и шаблоны CD;
- `deploy/` — stage/prod-конфигурации.

## Текущая итерация

- регистрация, вход, refresh и logout;
- access/refresh tokens;
- защищённый endpoint профиля;
- readiness/liveness probes;
- миграции PostgreSQL;
- заготовка домена слов и интервальных повторений;
- PWA-манифест и service worker;
- unit и integration tests;
- Docker images и CI/CD templates.

## Быстрый старт

```bash
cp .env.example .env
docker compose up --build
```

После запуска:

- PWA: `http://localhost:3000`;
- API: `http://localhost:8080`;
- liveness: `http://localhost:8080/health/live`;
- readiness: `http://localhost:8080/health/ready`.

## Локальная разработка без Docker

```bash
make backend-test
make frontend-install
make frontend-test
```

## Установка на iPhone

1. Открыть PWA в Safari.
2. Нажать «Поделиться».
3. Выбрать «На экран Домой».
4. Запускать LexiGo как отдельное приложение.

## Проверки качества

```bash
make backend-test
make frontend-install
make frontend-test
make frontend-build
```

CI дополнительно запускает `go vet`, race detector, интеграционный HTTP-тест полного auth-flow,
проверку уязвимостей Go-зависимостей и сборку контейнеров.

## Окружения

- `local` — `docker-compose.yml`;
- `stage` — `deploy/compose/docker-compose.stage.yml`;
- `production` — `deploy/compose/docker-compose.prod.yml`.

Секреты не хранятся в Git. Для GitHub Environments используются `stage` и `production`.

Для каждого окружения настраиваются:

- Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`;
- Variable: `DEPLOY_PATH`;
- для stage Variable `STAGE_DEPLOY_ENABLED=true`;
- на сервере — авторизация Docker в `ghcr.io`, clone репозитория и локальный `deploy/env/<env>.env`.

`DEPLOY_KNOWN_HOSTS` должен содержать заранее проверенную строку host key, а не результат
непроверенного `ssh-keyscan` внутри pipeline. Production workflow запускается вручную с immutable SHA-тегом образа.

## Следующие этапы

См. [docs/roadmap.md](docs/roadmap.md).
