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

## Frontend: production source of truth

Единственная production-цепочка приложения:

`frontend/app/layout.tsx` → `RoutedLexigoApp → LexigoBootstrappedApp → LexigoPremiumApp`.

Ownership компонентов разделён следующим образом:

- `frontend/app/layout.tsx` владеет глобальным runtime-контуром: error boundary, Web Vitals, Service Worker, persistent route shell и legal footer;
- `frontend/components/routed-lexigo-app.tsx` владеет канонической route shell, skip-link и persistent navigation chrome;
- `frontend/components/lexigo-bootstrapped-app.tsx` владеет восстановлением сессии, account runtime и единственной динамической загрузкой product graph;
- `frontend/components/lexigo-premium-app.tsx` является единственным product UI graph и не должен импортироваться напрямую из других компонентов;
- feature-компоненты расширяют product graph, но не создают альтернативные application roots.

Глобальные CSS-файлы подключаются только из `frontend/app/layout.tsx`. Feature styles не должны добавлять скрытые root-level imports или зависеть от альтернативной точки входа. Консолидация существующих глобальных CSS выполняется отдельными небольшими PR с visual regression gate, без смешивания с redesign.

Контракт защищён unit-тестом `frontend/components/production-app-entry.test.ts`, который запрещает возврат retired app roots и прямые обходные импорты product graph.

Подробности маршрутизации и runtime boundaries находятся в [docs/architecture.md](docs/architecture.md).

## Текущая итерация

- регистрация, вход, refresh и logout;
- access/refresh tokens;
- защищённый endpoint профиля;
- readiness/liveness probes;
- миграции PostgreSQL;
- встроенный каталог из 579 слов технического и академического английского;
- автоматическое назначение каталога каждому новому пользователю;
- endpoint выдачи слов, срок повторения которых наступил;
- PWA-манифест и service worker;
- unit и integration tests;
- Docker images и CI/CD templates.

## Каталог слов

Исходный Excel-файл преобразован в нормализованный CSV, после чего каталог детерминированно сжат и сохранён в `backend/internal/catalog/catalog_data.go`. Контрольная сумма несжатого CSV проверяется при каждом запуске и в unit-тестах.

При запуске API каталог:

1. декодируется и проверяется по SHA-256;
2. валидируется по схеме и количеству записей;
3. идемпотентно синхронизируется с PostgreSQL;
4. назначается уже существующим пользователям;
5. автоматически назначается каждому новому пользователю через PostgreSQL trigger.

В исходном файле указано «580 слов», но фактически присутствуют 579 слов и одна служебная строка с обозначениями частей речи. Для `elsewhere`, `equally` и `especially` отсутствовавшая часть речи восстановлена как `adverb`; повреждённый маркер `Ǫ quality` нормализован до `quality`.

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
проверку каталога и его идемпотентной загрузки, проверку уязвимостей Go-зависимостей и сборку контейнеров.

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
