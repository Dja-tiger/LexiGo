# Указания для агентов и разработчиков LexiGo

Ниже перечислены обязательные правила production-разработки и сквозного тестирования. Перед любым изменением агент должен сначала выполнить pre-flight prompt из раздела 0, а затем применять предметные правила остальных разделов.

## 0. Обязательный pre-flight prompt перед началом любой задачи

Скопируйте этот prompt в рабочий контекст агента без сокращений. Кодирование запрещено, пока не подготовлен и не проверен pre-flight record.

> Ты продолжаешь production-разработку LexiGo. Твоя цель — не просто написать код и затем реагировать на падения CI, а до первой правки устранить непроверенные предположения о runtime, API, responsive UI, браузерах, навигации, CSS и тестах.
>
> Абсолютное отсутствие дефектов нельзя гарантировать, но ошибки из-за неполного анализа, неверных selectors, stale mocks, отсутствующих tokens, неправильной history semantics и неподготовленных visual baselines недопустимы.
>
> ### 0. Защити repository до любого write-action
>
> 1. Сначала создай отдельную branch от подтверждённого актуального `main` и прочитай её ref/head обратно через GitHub.
> 2. До первого write выведи `repository`, `base SHA`, `branch` и точные paths, которые разрешено изменять.
> 3. В каждом `create_file`, `update_file`, `delete_file`, ref update и workflow write указывай branch явно. Использование default branch по умолчанию запрещено.
> 4. Перед отправкой tool call ещё раз сравни имя вызываемой функции с намерением. Read/search/list-action нельзя подменять write-action.
> 5. После каждого write прочитай изменённый path из целевой branch и проверь commit SHA. Не выполняй следующий write, пока это не подтверждено.
> 6. Если write попал не в ту branch или вызвана неверная функция, немедленно останови все дальнейшие writes, проверь `main`, откати только случайный artifact и зафиксируй ошибку в этом файле. Повторять тот же вызов без повторного чтения schema запрещено.
> 7. Перед PR сравни branch с `main`; diff обязан содержать только разрешённые paths. История default branch также проверяется на accidental placeholder/trigger commits.
>
> ### 1. Сначала восстанови фактический контекст
>
> До изменения файлов обязательно:
>
> 1. Прочитай Issue целиком, все комментарии, связанные Issues/PR и acceptance criteria.
> 2. Прочитай `.agents/AGENTS.md`, архитектурную документацию, README и документы конкретной feature.
> 3. Проверь живое состояние `main`, открытые PR, последний merge SHA и CI. Не опирайся на старый handoff как на источник текущего состояния.
> 4. Если задача связана с дизайном, открой точные Figma nodes, состояния, mobile/desktop variants, Light/Dark и Screen Map. Не реализуй экран по памяти, screenshot-фрагменту или приблизительной интерпретации.
> 5. Найди production entry, runtime owner, presentation owner, API client, state owner, CSS owner и все тесты/моки, которые потребляют изменяемый контракт.
> 6. Выполни repository-wide search по старым и новым selectors, accessible names, IDs, API paths, tokens, storage keys, events и component names. Удалённый контракт не должен оставаться в соседних suites.
> 7. GitHub code-search index может отставать от branch head. Dead-code evidence обязательно подтверждай source-level test или чтением фактического PR merge ref; indexed search сам по себе недостаточен.
>
> ### 2. До кода составь contract matrix
>
> Зафиксируй ожидаемое поведение минимум по следующим измерениям:
>
> - route и direct entry;
> - основное состояние, loading, empty, error, retry, offline и restored state;
> - guest и authenticated session;
> - desktop Chromium, desktop WebKit, Android Chromium и iOS WebKit;
> - compact/mobile и full/desktop layout;
> - Light и Dark appearance;
> - reduced motion и обычное motion;
> - mouse/touch и keyboard/screen reader;
> - reload, Back, Forward, deep link и повторный click/submit;
> - API request body, response body, version/index/completion fields и mutation sequence;
> - localStorage/sessionStorage/history state и правила восстановления;
> - visual baseline и bundle/performance impact.
>
> Для каждого перехода явно ответь:
>
> - какой элемент видит пользователь;
> - какое у него фактическое accessible name;
> - какой semantic container владеет control;
> - какой API request отправляется;
> - какое состояние меняется после ответа;
> - должна ли навигация использовать `pushState`, `replaceState` или App Router navigation;
> - что произойдёт после reload и browser Back/Forward;
> - чем поведение отличается на compact UI и в WebKit.
>
> Если хотя бы один ответ неизвестен, сначала исследуй код, Figma, тест или runtime artifact. Не заполняй пробел предположением.
>
> ### 3. Проведи аудит рисков до реализации
>
> Обязательно проверь:
>
> 1. Не возвращает ли mock жёсткие значения, расходящиеся с request body. По умолчанию preview/create mock должен echo фактические параметры, если тест намеренно не проверяет server normalization.
> 2. Не ищет ли тест desktop-only control в compact layout или скрытый элемент с `display: none`.
> 3. Не проверяет ли тест внутреннюю legacy-разметку, скрытый answer или state-copy вместо пользовательского semantic contract.
> 4. Объявлен ли каждый используемый CSS custom property и проверена ли foreground/background пара в Light и Dark.
> 5. Поддерживает ли controlled input native `input` и фактическое поведение Chromium/WebKit.
> 6. Не уничтожает ли `replaceState` запись, к которой пользователь должен вернуться через Back.
> 7. Есть ли Linux visual baseline для каждого нового canonical state.
> 8. Не импортирует ли route код других тяжёлых screens и не расширяет ли общий client graph.
> 9. Не дублируются ли session bootstrap, refresh coordination, review outbox, API clients или PWA lifecycle.
> 10. Не осталось ли dead CSS, selectors или components после redesign.
>
> ### 4. Сформируй минимальный production slice
>
> До первой правки перечисли:
>
> - точный scope и non-goals;
> - изменяемые runtime files;
> - изменяемые test/fixture files;
> - инварианты, которые нельзя нарушить;
> - targeted checks, которые докажут каждый acceptance criterion;
> - возможный rollback;
> - ожидаемое изменение bundle/visual/runtime contract.
>
> Не смешивай redesign, архитектурный refactoring, CSS cleanup, dependency update и unrelated test repair в одном PR без объективной необходимости.
>
> ### 5. Реализуй контракт, а не картинку или отдельный happy path
>
> Во время разработки:
>
> - сохраняй ownership boundaries между runtime, presentation, session, navigation и API;
> - используй существующие типизированные clients и validators;
> - добавляй source-level/unit contract одновременно с runtime-правкой;
> - выбирай controls через role, точное accessible name и owning container;
> - не используй `.first()` для скрытия неоднозначности;
> - не увеличивай timeout вместо исправления synchronization/runtime defect;
> - не отключай axe rule, browser project, visual assertion или security gate;
> - не раскрывай скрытый ответ и не меняй production UX ради неверного теста;
> - не вводи неизвестный CSS token и raw value без design-system justification;
> - не обновляй snapshot вслепую: сначала проверь actual artifact против Figma;
> - не создавай временный write-workflow, если изменение можно внести обычным commit. Если one-shot workflow объективно неизбежен, он должен быть минимальным, path-guarded, удалён из diff до финального CI, а bot-authored head не считается финальным.
>
> ### 6. Проверяй по нарастающей, а не только полным CI в конце
>
> Выполняй gates в таком порядке:
>
> 1. repository search и source-contract tests;
> 2. lint и typecheck затронутой области;
> 3. targeted unit/integration tests;
> 4. targeted E2E для каждого состояния в Chromium и WebKit;
> 5. compact Android и iOS WebKit scenarios;
> 6. keyboard, screen reader semantics, axe в Light/Dark и reduced motion;
> 7. reload, Back/Forward, duplicate submit и offline/recovery journeys;
> 8. visual regression в Linux container;
> 9. route bundle/performance budgets;
> 10. полный required CI на обычном developer-authored final head.
>
> После каждого failure остановись. Сначала прочитай полный log, screenshot, trace и artifact, сформулируй подтверждённую первопричину и только затем меняй код. Не запускай серию случайных исправлений.
>
> ### 7. Перед Ready и merge выполни финальный аудит
>
> PR нельзя переводить в Ready, пока не выполнено всё:
>
> - diff содержит только целевые файлы;
> - отсутствуют temporary workflows, trigger files и accidental artifacts;
> - нет unresolved review threads;
> - acceptance criteria сопоставлены с конкретными tests;
> - новые visual baselines перечислены и проверены в Linux;
> - bundle budget не повышен только ради зелёного CI;
> - финальный head создан обычным credential, а required CI завершён success;
> - Issue/PR description содержит source of truth, ownership boundaries, root causes найденных дефектов и полный validation record;
> - новые знания о предотвращении ошибок добавлены в `.agents/AGENTS.md`.
>
> ### 8. Формат обязательного pre-flight record
>
> До кодирования выведи и сохрани в рабочем контексте:
>
> ```markdown
> ## Pre-flight
> - Issue / PR / base SHA:
> - Source of truth:
> - Production entry и owners:
> - Scope / non-goals:
> - Contract matrix:
> - API и state transitions:
> - Responsive/browser differences:
> - History/storage/recovery semantics:
> - CSS tokens и visual states:
> - Existing tests/mocks/legacy consumers:
> - Risks:
> - Planned files:
> - Targeted validation:
> - Full CI gate:
> ```
>
> Если record неполон, не начинай реализацию. Если в ходе работы обнаружен новый контракт, сначала обнови record и tests, затем продолжай кодирование.

### Почему PR #209 потребовал несколько итераций

Ошибки возникли не из-за одной сложной функции, а из-за реактивного порядка разработки: отдельные контракты проверялись только после очередного падения CI, а не были сведены в общую матрицу до первой правки.

Основные причины:

- responsive CTA contract не был заранее разделён на desktop composer и compact recommendation;
- API fixture возвращал жёсткие параметры вместо фактического request contract;
- E2E ожидал скрытый Recall answer вместо публичного cloze prompt;
- browser history semantics `push`/`replace` не были проверены для полного Home → Back journey;
- CSS использовал необъявленный token, а Light/Dark contrast audit выполнялся поздно;
- controlled textbox не был заранее проверен по native event contract в WebKit;
- Linux visual baselines появились только после функциональной матрицы;
- временные write-workflows усложнили head/CI lifecycle и создали лишние точки отказа.

Следствие: каждый следующий gate находил новый класс ошибки. Pre-flight prompt выше делает эти проверки обязательными до реализации и запрещает считать частично зелёную матрицу доказательством production readiness.

## 1. Адаптивность в тестах (Mobile-First UI)

Playwright-тесты в LexiGo запускаются в 3 окружениях (`desktop-chromium`, `desktop-webkit`, `android-chromium`/`ios-webkit`).

- **Разворачивайте скрытые элементы.** Если в мобильном UI часть настроек скрывается под кнопкой «Настроить урок», тест не сможет с ними взаимодействовать и упадет по таймауту. Перед взаимодействием с контролами внутри Progressive UI определяйте layout по viewport и дожидайтесь semantic disclosure, а не используйте мгновенный snapshot `isVisible()` сразу после navigation:
  ```typescript
  const isCompact = (page.viewportSize()?.width ?? 1000) < 768;
  if (isCompact) {
    const configureBtn = page.getByRole("button", { name: "Настроить урок" });
    await expect(configureBtn).toBeVisible();
    await configureBtn.click();
  }
  // Теперь взаимодействуем с раскрытыми элементами...
  ```
- **Выбирайте CTA по layout contract.** Полный desktop composer использует «Начать урок», а compact recommendation card — «Начать рекомендуемый урок». Не ищите desktop-only control в mobile layout и не скрывайте расхождение `.first()`; scope CTA через owning `article`, `region` или composer container.
- **Пересекающиеся accessible names требуют `exact: true`.** Кнопки «Знал»/«Не знал» и «Сохранить и выйти»/«Назад — сохранить и выйти из урока» намеренно содержат общие фрагменты. Для таких controls всегда используйте точное имя или scope через ближайший `dialog`, `group` или `region`; strict-mode violation нельзя скрывать `.first()`.
- **Осторожно с `getByText` и `toBeVisible`.** Если элемент скрыт за аккордеоном или полностью вырезан из мобильного Layout через CSS `display: none`, проверяйте только фактически существующий layout contract.

## 2. Скролл и History API (Next.js)

- **Ожидайте debouncing скролла.** Перед немедленной навигацией после программного scroll необходимо дождаться сохранения snapshot или явно flush-нуть scheduler.
- `replaceState` допустим для canonicalization, redirect и намеренной замены текущей записи. Для recoverable state, к которому должен возвращать Back, используйте новую history entry.

## 3. API моки и дефолтные значения

- Если меняется дефолтное поведение UI, синхронизируйте API-моки. Preview/create mocks по умолчанию должны echo параметры request body, если тест не проверяет намеренную server normalization.
- Multi-step journey обязан мокировать все mutations и возвращать актуальные `lessonVersion`, `lessonCurrentIndex`, completion и judgement fields.

## 4. Визуальные регрессии

- **Не обновляйте snapshots на macOS.** Используйте Linux project container (`scripts/ci/frontend-container.sh`) или GitHub Actions.
- Сначала проверьте actual artifact против Figma, затем добавляйте только явно перечисленные baselines и повторно запускайте visual test без `--update-snapshots`.

## 5. Доступность

- Привязывайтесь к `getByRole`, фактическому accessible name и owning semantic container.
- Соблюдайте нативную семантику controls.
- Проверяйте blocking axe audit в Light и Dark, keyboard navigation и reduced motion.

## 6. Обязательная фиксация предотвращения повторных ошибок

Каждая обнаруженная ошибка должна завершаться не только исправлением текущего падения, но и документированной профилактикой повторения. Это относится к unit/integration/E2E, GitHub Actions, visual regression, accessibility, performance, stage/production smoke, runtime-дефектам и замечаниям review.

После появления ошибки агент обязан:

1. Установить подтверждённую первопричину по log, artifact, screenshot, trace или воспроизводимому сценарию.
2. Исправить первопричину, а не скрывать симптом timeout, ослаблением assertion или исключением gate.
3. Обновить этот файл до перевода PR в Ready.
4. Дополнить существующее правило вместо создания дубля.
5. Для внешнего или транзиентного сбоя зафиксировать способ распознавания и безопасной повторной проверки.

Формат записи:

```markdown
### YYYY-MM-DD — <категория / краткое название ошибки>

- **Симптом:** какой check, route или сценарий упал.
- **Первопричина:** подтверждённая техническая причина.
- **Профилактика:** что необходимо делать или запрещено делать.
- **Обязательная проверка:** конкретный test, command, assertion, artifact или CI gate.
- **Область действия:** components, routes, viewport, browser или environments.
```

PR не считается готовым, если новая категория ошибки не связана с профилактическим правилом.

### 2026-07-24 — React DOM ownership в модальных keyboard traps

- **Симптом:** unit gate сообщил global document event delegation для нового presentation-компонента.
- **Первопричина:** focus trap подписывался через `document.addEventListener`, хотя dialog принадлежит React subtree.
- **Профилактика:** keyboard trap, Escape и циклический Tab обрабатывать через React `onKeyDown` на корне dialog; глобальные listeners допустимы только для внешних lifecycle-событий с обоснованием.
- **Обязательная проверка:** `components/react-dom-ownership.test.ts` и keyboard E2E.
- **Область действия:** React dialogs, modals, drawers и focused routes.

### 2026-07-24 — Ложные срабатывания source-contract regex на комментариях

- **Симптом:** source contract обнаружил raw hex в номере Issue внутри комментария.
- **Первопричина:** regex анализировал комментарии и исполняемый CSS как один поток.
- **Профилактика:** удалять comments перед regex-проверкой или применять parser-aware анализ.
- **Обязательная проверка:** contract падает на declaration и проходит на том же значении в комментарии.
- **Область действия:** CSS, TS/TSX и configuration source contracts.

### 2026-07-24 — PR workflow после commit от `github-actions[bot]`

- **Симптом:** PR workflow получил `action_required` и пустой список jobs.
- **Первопричина:** head SHA создан workflow через `GITHUB_TOKEN`.
- **Профилактика:** bot commit не считать финальным head; temporary write-workflow удалить, затем создать содержательный обычный commit и запустить штатный CI.
- **Обязательная проверка:** финальный CI содержит непустой список jobs и завершён success.
- **Область действия:** workflows с `contents: write`, snapshots и automated migrations.

### 2026-07-24 — Contrast semantic token недостаточен для мелкого текста

- **Симптом:** axe обнаружил недостаточный contrast у мелкого foreground text.
- **Первопричина:** status token использован как text token без расчёта пары.
- **Профилактика:** вводить foreground token только после расчёта Light/Dark contrast; не отключать axe.
- **Обязательная проверка:** contrast ratio >= 4.5 и blocking axe audit.
- **Область действия:** labels, eyebrow, captions и feedback text.

### 2026-07-24 — Computed CSS duration сериализуется по-разному

- **Симптом:** browser engines вернули разные строковые форматы эквивалентной duration.
- **Первопричина:** тест сравнивал сериализацию, а не числовое значение.
- **Профилактика:** нормализовать через `Number.parseFloat` и проверять semantic threshold.
- **Обязательная проверка:** Chromium и WebKit проходят при duration <= установленного предела.
- **Область действия:** motion и computed CSS assertions.

### 2026-07-24 — Redesign удалил legacy controls, но E2E искал старую структуру

- **Симптом:** suites искали удалённые controls и legacy copy.
- **Первопричина:** tests были связаны с внутренней разметкой вместо устойчивого semantic contract.
- **Профилактика:** одновременно с canonical screen мигрировать все suites на roles, state contracts, focus и dialog semantics; не сохранять удалённый UX ради теста.
- **Обязательная проверка:** repository search не находит retired selectors, все configured projects проходят.
- **Область действия:** route redesign и Playwright selectors.

### 2026-07-24 — Первичный visual baseline отсутствует

- **Симптом:** visual test сообщил `A snapshot doesn't exist`.
- **Первопричина:** новый canonical state не имел утверждённого Linux baseline.
- **Профилактика:** после runtime validation проверить actual против Figma, сгенерировать baseline в Linux и commit-нуть только approved PNG.
- **Обязательная проверка:** повторный visual run без update mode проходит.
- **Область действия:** new canonical frames и Linux rendering.

### 2026-07-24 — UI journey не синхронизировал review API mock

- **Симптом:** journey оставался на первой карточке и получал `not_mocked`/timeout.
- **Первопричина:** fixture не поддерживал последующую mutation.
- **Профилактика:** мокировать полный mutation sequence с server-owned position/version/completion.
- **Обязательная проверка:** multi-step journey проходит во всех configured projects.
- **Область действия:** Playwright API mocks и lesson review mutations.

### 2026-07-24 — Глобальный role locator стал неоднозначным

- **Симптом:** strict-mode violation у повторяющегося role.
- **Первопричина:** locator полагался на глобальную уникальность role.
- **Профилактика:** scope через name, text или semantic owner; `.first()` запрещён как маскировка.
- **Обязательная проверка:** targeted cross-browser test.
- **Область действия:** pages с несколькими live regions/navigation/groups.

### 2026-07-24 — Lesson Composer mock и CTA расходились с layout contract

- **Симптом:** desktop CTA был disabled, Android не находил control.
- **Первопричина:** stale hardcoded preview response и desktop locator в compact layout.
- **Профилактика:** echo request contract; разделять full composer и compact recommendation по viewport и owner.
- **Обязательная проверка:** Lesson Result E2E проходит в desktop Chromium/WebKit, Android Chromium и iOS WebKit.
- **Область действия:** Lesson Composer fixtures и responsive CTA.

### 2026-07-25 — Canonical controls нельзя искать по legacy ID или state-copy

- **Симптом:** journeys заполняли удалённый control или искали CTA по названию состояния.
- **Первопричина:** selectors не соответствовали фактическому accessible contract.
- **Профилактика:** использовать role, exact accessible name и visible owner; heading, eyebrow и CTA считать разными контрактами.
- **Обязательная проверка:** repository search не находит retired selectors.
- **Область действия:** Active Lesson, Lesson Result и progressive UI.

### 2026-07-24 — Recall E2E раскрыл скрытый ответ

- **Симптом:** test ожидал полный answer до попытки.
- **Первопричина:** assertion нарушал objective Recall contract.
- **Профилактика:** до submit проверять только public cloze prompt, textbox и отсутствие answer leakage.
- **Обязательная проверка:** distinct-next E2E во всех configured projects.
- **Область действия:** Recall, cloze и answer reveal.

### 2026-07-24 — `replaceState` уничтожил возврат к Lesson Result

- **Симптом:** после Home и Back пользователь не возвращался к результату.
- **Первопричина:** recoverable result entry была заменена.
- **Профилактика:** для поддерживаемого Back journey использовать новую history entry.
- **Обязательная проверка:** complete → reload → Home → Back без duplicate review.
- **Область действия:** route-state persistence и terminal actions.

### 2026-07-24 — Необъявленный CSS token сделал CTA неконтрастным

- **Симптом:** axe обнаружил contrast 2.59:1.
- **Первопричина:** неизвестный custom property стал invalid и foreground унаследовался.
- **Профилактика:** feature CSS использует только declared tokens и approved pairs; неизвестный token блокируется source contract.
- **Обязательная проверка:** source test и axe Light/Dark.
- **Область действия:** design tokens и primary CTA.

### 2026-07-24 — Controlled Recall textbox не обработал native `input` в WebKit

- **Симптом:** `fill()` завершался, но controlled value снова становился пустым, CTA оставался disabled.
- **Первопричина:** state обновлялся только через несовместимый для этого flow event contract.
- **Профилактика:** critical controlled text input обрабатывать через `onInput` и `event.currentTarget.value`; E2E выполняет focus → fill → toHaveValue → enabled → submit.
- **Обязательная проверка:** source contract и Recall suites во всех Chromium/WebKit projects.
- **Область действия:** controlled inputs и objective Recall.

### 2026-07-25 — Реактивная валидация вместо pre-flight matrix

- **Симптом:** PR #209 требовал последовательных исправлений responsive CTA, API mocks, Recall assertions, history, CSS contrast, WebKit input и visual baselines.
- **Первопричина:** contracts проверялись по одному после падений downstream gates, а не были собраны и доказаны до первой реализации.
- **Профилактика:** обязательный prompt раздела 0, contract matrix, repository-wide consumer audit и staged validation до полного CI.
- **Обязательная проверка:** каждый новый PR содержит заполненный pre-flight record, tests для заявленных invariants и один чистый финальный CI run на developer-authored head.
- **Область действия:** все production задачи LexiGo.
### 2026-07-25 — Write-action без явной branch изменил default branch

- **Симптом:** при подготовке рабочей ветки ошибочный `create_file` трижды создавал placeholder `INVALID` в `main`; каждый artifact был сразу удалён, но default-branch history получила лишние commits.
- **Первопричина:** write-tool был вызван до подтверждённого создания branch, поле `branch` отсутствовало, а после первого неверного вызова execution не был остановлен для повторной проверки schema и recipient.
- **Профилактика:** выполнить write-safety gate из обязательного prompt: branch создаётся и читается до writes, каждый write содержит явный branch, после любого unexpected mutation все writes останавливаются до проверки `main` и tool schema.
- **Обязательная проверка:** перед PR `compare_commits(main, branch)` содержит только разрешённые paths; default branch не содержит accidental artifacts; каждый commit/write подтверждён чтением целевого path из ожидаемой branch.
- **Область действия:** GitHub connector writes, workflow patches, ref updates и любые repository mutations.

### 2026-07-25 — Stale code-search скрыл живого consumer legacy selector

- **Симптом:** source-contract PR #212 обнаружил `lx-lesson-top` в production component graph после того, как предварительный GitHub code search показал только `premium-ui.css`.
- **Первопричина:** search index отставал от актуального source graph; selector с lesson-названием фактически использовался header справочного каталога `renderAllItems`.
- **Профилактика:** indexed search использовать только как discovery signal. Перед удалением selector доказать отсутствие consumer через source-level test на PR merge ref или прямое чтение всех production sources; живой selector переносить к семантически верному owner вместо удаления.
- **Обязательная проверка:** ownership test сканирует production `.tsx`, legacy `lx-lesson-top` отсутствует, а `lx-all-items-top` одновременно присутствует в catalog markup и `premium-ui.css`.
- **Область действия:** dead-code/CSS cleanup, GitHub code search, generated branches и PR merge refs.
