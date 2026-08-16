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
| First Use / onboarding | `/onboarding` |
| Настройка урока | `/learn` |
| Каталог фраз | `/phrases` |
| Карточка фразы | `/phrases/[slug]` |
| Словарь | `/dictionary` |
| Карточка слова | `/words/[id]` |
| Прогресс | `/progress` |
| Профиль и авторизация | `/profile` |
| Активный урок текущего пользователя | `/lesson/active` |
| Каталог сценариев | `/scenarios` |
| Прохождение сценария | `/scenarios/[slug]` |

Канонические client owners:

| Маршрут | Client entry | Основная ответственность |
| --- | --- | --- |
| guest `/` | `LexigoGuestHomeApp` | truthful First Use value proposition и auth/demo CTA без персонального progress/scheduler state |
| authenticated `/` | `LexigoHomeApp` | progress/active-session reads, next-best action и создание урока |
| authenticated `/onboarding` | `LexigoOnboardingApp` | server-backed status/start/mark/complete/skip, reveal-after-mark, reload resume и recovery |
| `/learn` | `LexigoLearnApp` | metadata, preview/create/resume/discard и Lesson Composer presentation |
| `/lesson/active` | `LexigoActiveLessonApp` | restore, review/resync/suggestion, result continuation и safe exit |
| `/dictionary`, `/words/[id]` | `LexigoDictionaryApp` | Dictionary catalog и независимый Word Detail |
| `/phrases`, `/phrases/[slug]` | `LexigoPhrasesApp` | server-order catalog, URL state, direct Phrase Detail и Learn handoff |
| `/progress` | `LexigoProgressApp` | progress evidence, due actions и recommendations |
| authenticated `/profile` | `LexigoProfileApp` | profile summary, goal и appearance preferences |
| `/scenarios` | `LexigoScenarioCatalogApp` | ordered scenario catalog и recommendation evidence |
| `/scenarios/[slug]` | `LexigoScenarioApp` | scenario attempt lifecycle и evidence presentation |

Принципы маршрутизации:

- верхнеуровневая навигация использует нативные ссылки Next.js `Link`, поэтому поддерживает открытие в новой вкладке, копирование адреса и стандартные browser controls;
- root layout содержит persistent client shell: переключение маршрута не перезапускает refresh-session preflight, outbox runtime и PWA lifecycle;
- `LexigoBootstrappedApp` остаётся единственным владельцем восстановления сессии, refresh coordination, account runtime и динамической загрузки route entries;
- все канонические product routes из таблицы выше используют отдельные client entries; route islands не импортируют session restoration, review outbox, Service Worker или другой route root;
- guest `/` после bootstrap загружает `LexigoGuestHomeApp`: island не вызывает и не фабрикует authenticated progress/account/scheduler API; authenticated `/` загружает `LexigoHomeApp`, который владеет Home progress/active-lesson reads, next-best-action presentation и созданием урока через существующий API;
- authenticated `/onboarding` после bootstrap загружает `LexigoOnboardingApp`; `frontend/app/onboarding/page.tsx` является обязательным каноническим App Router page owner, поэтому client island не монтируется поверх server not-found subtree. Onboarding island использует существующий backend #18 contract `status/start/mark/complete/skip`, не создаёт второй session/storage source of truth и раскрывает answer только после успешного mark;
- `/learn` после bootstrap загружает отдельный `LexigoLearnApp`: island владеет Lesson Composer metadata/progress/active-session reads, preview/create/resume/discard mutations и presentation, но не создаёт второй session, outbox или PWA owner;
- переход Learn → `/lesson/active` сохраняет source/topic URL state, записывает канонический product-graph history target и передаёт backend-owned active session отдельному `LexigoActiveLessonApp`;
- переход Home → `/lesson/active?resume=1` использует одноразовый intent: Active Lesson island удаляет `resume=1` из URL до вызова существующего resume action, поэтому backend-owned session position не дублируется;
- Active Lesson island владеет active-session restore, review/resync/suggestion, completion/result continuation, focused-route announcement и safe exit, но оставляет session bootstrap, review outbox, Service Worker и immutable-event-state Browser Back guard persistent owners;
- `LexigoPhrasesApp` использует существующий content-only demo catalog для гостя; после аутентификации catalog загружается через `/api/v1/words?kind=phrase&source=phrases` без client reordering. `topic`, `query`, `sort` и `page` хранятся в URL, а authenticated detail загружается через `/api/v1/phrases/{slug}` независимо от catalog warm-up;
- Phrases direct entry, reload, new tab и Back/Forward не зависят от ранее открытой catalog page; persistent lesson configuration остаётся authenticated flow и передаётся существующему `/learn?source=phrases` только после входа;
- при переходе между route graphs текущий island остаётся смонтированным до фактического изменения pathname, после чего bootstrap канонизирует history state и только затем подключает целевой graph;
- `/profile` после восстановления сессии загружает отдельный authenticated `LexigoProfileApp`; guest login, registration, password reset и email-change confirmation остаются в compatibility boundary;
- Profile island владеет только сводкой профиля и пользовательскими preferences; password, session revocation, email change, export и account deletion остаются в независимых подтверждаемых account-компонентах;
- `LexigoPremiumApp` остаётся узким compatibility fallback для guest/auth и оставшихся legacy states, не представленных отдельным canonical route owner. Он загружается только через `LexigoBootstrappedApp` и не владеет Guest Home, Onboarding, Phrases или Active Lesson;
- наличие compatibility fallback не является доказательством живого route ownership. Удаление доказанно мёртвых приложений и конфликтующих CSS выполняется отдельными атомарными slice в Issue #70 с source, bundle, browser и Linux visual evidence;
- фильтры, сортировка, страница и detail identifier кодируются в URL; Back/Forward восстанавливают соответствующий экран и scroll position;
- отдельные per-tab snapshots хранят вложенный маршрут и scroll в `sessionStorage`; повреждённый snapshot удаляется локально без очистки остальных данных;
- устаревшие ссылки вида `/?view=...` принимаются только как migration input и заменяются каноническим URL;
- произвольный идентификатор lesson session не публикуется: маршрут `/lesson/active` разрешает backend определить активную сессию по аутентифицированному пользователю;
- гостевой вход в активный урок или onboarding перенаправляется на `/profile` с причиной и валидированным внутренним `return_to`; First Use допускает только канонический `/onboarding`, без open redirect;
- `/dictionary` и `/words/[id]` доступны гостю через content-only `/api/v1/catalog/words` и `/api/v1/catalog/words/{wordID}`; authenticated Dictionary продолжает использовать `/api/v1/words*`, а learning status, due queue, status-фильтры и scheduler values для гостя не отдаются и не фабрикуются;
- `/phrases/[slug]` для authenticated user разрешается адресным user-scoped API lookup по каноническому lowercase kebab-case slug; guest detail использует content-only demo source и не получает персональный learning status;
- detail route фразы имеет независимые loading/error states, поэтому cold start, reload и новая вкладка не зависят от ранее загруженной catalog page;
- одноразовые reset/email-change credentials передаются во fragment `/profile#...`, поэтому не попадают в HTTP access logs, query analytics и `Referer`;
- App Router предоставляет route-level loading, error и not-found boundaries;
- Service Worker кэширует HTML shell канонических маршрутов и использует `/` как fallback для динамических detail routes при offline navigation.

## Guest catalog access policy

- Гость может просматривать, искать, фильтровать, сортировать и листать каталог слов, открывать Word Detail, а также просматривать каталог и карточки фраз. Этот режим является read-only/demo и не создаёт долговременную параллельную систему прогресса.
- Public Words API является отдельной content-only projection: `/api/v1/catalog/words` и `/api/v1/catalog/words/{wordID}` читают данные каталога без персонального `user_words` состояния. Поля `status`, `easiness`, `intervalDays`, `repetitions`, `dueAt` и `lastReviewedAt` остаются authenticated-only.
- Персональные статусы, due queue, интервалы, review history, lesson/review mutations и сохранение результатов требуют реальной аутентифицированной сессии. Guest UI заранее сообщает, что demo progress не сохраняется, и не показывает вымышленные scheduler values.
- Действие, требующее persistent practice, сначала переводит гостя на `/profile`; lesson не создаётся до успешной аутентификации.
- Перед auth переходом текущий канонический Dictionary/Phrases target — включая filters/search/page/detail — сериализуется только как проверенный внутренний `return_to`. Внешние и malformed targets отклоняются, поэтому auth return не является open redirect.
- First Use CTA использует ту же строгую внутреннюю validation boundary и допускает `return_to=/onboarding`; произвольные внешние/неизвестные пути не принимаются.
- После успешного login или registration auth owner потребляет валидированный target и заменяет `/profile` точным исходным catalog/detail/onboarding URL. Это сохраняет пользовательский контекст и не оставляет промежуточный auth screen как дополнительную Back-entry.

Route-specific initial JavaScript и request ceilings хранятся в `frontend/bundle-budgets.json`, защищаются `frontend/lib/bundle-budgets.test.ts` и browser performance gate. Методика и измеренные baselines описаны в [`frontend-bundle-budgets.md`](./frontend-bundle-budgets.md). Изменение ownership route entry не считается завершённым без direct-entry/history evidence и permanent route budget.

Публичная архитектурная документация является downstream consumer executable ownership. `frontend/components/architecture-documentation-contract.test.ts` сверяет README и этот документ с dynamic imports `LexigoBootstrappedApp` и блокирует возврат подтверждённых stale ownership claims.

## Appearance ownership

- пользовательская настройка хранит только значение `auto`, `light` или `dark` под версионированным browser key и не содержит auth/session данных;
- inline bootstrap в root layout читает настройку до первого paint, вычисляет effective appearance и синхронно выставляет document attributes, `color-scheme` и PWA `theme-color`;
- `auto` сохраняет существующие `prefers-color-scheme` media-query owners; explicit Light/Dark переопределяют semantic tokens на document root;
- изменение системной темы применяется в runtime только при `auto`; explicit preference остаётся стабильной до следующего выбора пользователя;
- запрет browser storage не блокирует приложение: текущая вкладка применяет выбранную тему, а следующий cold start безопасно возвращается к `auto`;
- legacy account/security forms остаются отдельными runtime owners и получают route-scoped compatibility palette только при explicit Light на `/profile`, без изменения их API и confirmation semantics.

## System-state ownership

- `frontend/app/system-states.css` является единственным presentation owner общих loading, empty, error, success, skeleton и connectivity-состояний;
- `ReviewOutboxRuntime` остаётся persistent runtime owner очереди review и её online/offline/pending state, но не подключает отдельный глобальный stylesheet;
- `frontend/app/mobile-pwa-fixes.css` ограничен PWA/session shell и не определяет shared async-state presentation;
- изменение shared state visuals требует source-contract проверок и authoritative visual regression gate; перенос ownership сам по себе не является redesign и не обновляет baselines.

## Границы модулей backend

- `auth` — identity, пароли, access/refresh tokens и операции над refresh-token families;
- `account` — verified email change, экспорт персональных данных, удаление аккаунта и privacy-oriented flows;
- `words` — словарь и пользовательское состояние слов;
- `review` — будущий алгоритм интервальных повторений;
- `lesson` — формирование дневной сессии;
- `ai` — будущая интеграция с моделью;
- `platform` — PostgreSQL, Redis, migrations с PostgreSQL advisory lock.
- `moderation` — fail-closed content-admin allowlist, bounded answer-suggestion queue, atomic terminal decisions, immutable audit, operational metrics и bounded raw-answer retention; не владеет review history или scheduler.

## Custom vocabulary ownership

- общие catalog rows остаются в `words` с `owner_user_id is null`; private custom words используют тот же доменный объект `words`, но имеют `owner_user_id` текущего аккаунта и source `user-custom-v1`;
- Phase 2 Issue #25 разрешает private ownership только для `kind = 'word'`; custom phrases и frontend creation UI остаются отдельными будущими slice;
- создание одного private word и запись `user_words` выполняются одной PostgreSQL-транзакцией, поэтому custom vocabulary сразу использует существующие due queue, lesson composition, review events и SRS state без второй scheduler-системы;
- Phase 3 portability использует authenticated `GET /api/v1/words/custom/export` и `POST /api/v1/words/custom/import`; export возвращает только deterministic owner-owned content (`lemma`, `translation`, `phonetic`, `partOfSpeech`, `topic`, `note`) и намеренно исключает database IDs, owner identity, scheduler state, due timestamps и review history;
- export помечается `Cache-Control: no-store`; пустой owner glossary остаётся валидным version-1 документом с `items: []`;
- import version 1 принимает 1–100 items и не более 256 KiB JSON, нормализует каждый item существующим `NormalizeCustomWordRequest`, отвергает intra-payload normalized duplicates до persistence и создаёт всю пачку в одной PostgreSQL-транзакции через тот же private-word insert/scheduler helper;
- конфликт хотя бы одного import item с existing current-owner term приводит к rollback всей пачки; overwrite/merge существующего слова не выполняется, а одинаковый normalized term может независимо принадлежать другому аккаунту;
- export → delete → import переносит только content identity: новые `words`/`user_words` rows получают fresh scheduler defaults; исторический SRS state, due dates и review events не импортируются;
- shared catalog сохраняет отдельную partial uniqueness по `lower(lemma), lower(translation)`, а private rows — owner-scoped uniqueness, поэтому одинаковый пользовательский термин может независимо существовать у разных аккаунтов;
- public `/api/v1/catalog/words*` и `/api/v1/catalog/metadata` читают только `owner_user_id is null`; authenticated reads допускают shared rows или private row текущего владельца и не раскрывают ownership другого аккаунта;
- owner-only delete сначала в той же транзакции переводит активный lesson, содержащий удаляемое слово, в `discarded`, затем удаляет private `words` row; существующий `on delete cascade` очищает `user_words`, review/lesson/idempotency/onboarding/suggestion references, не затрагивая shared catalog или private rows другого пользователя.

## Moderation ownership

- `learning` создаёт pending suggestion только из реального server-rejected review текущего пользователя и никогда автоматически не меняет curated answers;
- `moderation` повторно разрешает текущий account email через server-side allowlist, поэтому JWT не содержит долгоживущую роль;
- accept/reject блокирует suggestion и word в одной PostgreSQL transaction, использует optimistic version и добавляет только normalized-unique accepted answer;
- review event и уже применённый scheduler state неизменяемы;
- pending raw answers хранятся не более 90 дней, terminal decision/audit — не более 365 дней; replica-safe worker использует отдельный advisory lock и bounded batches;
- полный operational/privacy contract описан в [`answer-suggestion-moderation.md`](./answer-suggestion-moderation.md).

## Управление аккаунтом и данными

- Profile summary не дублирует чувствительные операции: ссылки переводят keyboard focus к существующим security, email и data owners;
- дневная цель остаётся server-owned preference и изменяется через authenticated CSRF-protected progress contract; calendar reminder остаётся browser/calendar-owned;
- одно устройство представлено одной refresh-token family; ротация токена не создаёт дубликаты устройств в профиле;
- смена пароля и завершение остальных сессий требуют bearer-аутентификацию, CSRF и повторный ввод текущего пароля;
- смена пароля, отзыв чужих session families и запись security audit выполняются внутри одной PostgreSQL-транзакции;
- текущая session family сохраняется при смене пароля и отзыве остальных devices, получает новый credential epoch и replacement access token; остальные активные families отзываются;
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
- access token подписывается HS256, содержит `auth_version` и на каждом защищённом запросе fail-closed сверяется с PostgreSQL;
- смена пароля, password reset, подтверждение email и отзыв остальных sessions немедленно увеличивают credential epoch; детали lock order и отказоустойчивости описаны в `docs/access-token-revocation.md`;
- state-changing cookie-authenticated операции защищены synchronizer CSRF token;
- security audit хранит тип события, время, user agent, IP и безопасные metadata без secrets;
- SMTP transport требует STARTTLS и TLS 1.2+; log delivery разрешён только в local/test;
- HTML-ответы stage/prod получают per-response nonce CSP: stage наблюдает ту же политику через Report-Only, production применяет её в enforcing-режиме без `unsafe-eval` и inline scripts;
- Caddy централизованно добавляет HSTS, `nosniff`, Referrer Policy, минимальную Permissions Policy и запрет встраивания для frontend/API; безопасный rollout и исключения описаны в `docs/security-headers.md`;
- CSP reports принимаются отдельным rate-limited endpoint и логируются только как очищенные origins/directive metadata без query, fragment и script sample;
- секреты находятся только в environment/GitHub Secrets;
- production deploy требует ручного подтверждения GitHub Environment;
- SSH host key передаётся через проверенный GitHub Secret `DEPLOY_KNOWN_HOSTS`.

## Масштабирование

API stateless, поэтому горизонтально масштабируется. Состояние хранится в PostgreSQL/Redis. До появления реальной нагрузки Kubernetes не нужен; Docker Compose снижает операционную сложность.
