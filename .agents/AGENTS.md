# Указания для агентов и разработчиков LexiGo

Ниже перечислены важные правила по разработке и сквозному (E2E) тестированию, собранные на основе опыта отладки хрупких тестов. Пожалуйста, всегда сверяйтесь с этим гайдом перед внесением изменений.

## 1. Адаптивность в тестах (Mobile-First UI)

Playwright-тесты в LexiGo запускаются в 3 окружениях (`desktop-chromium`, `desktop-webkit`, `android-chromium`/`ios-webkit`). 

- **Разворачивайте скрытые элементы.** Если в мобильном UI часть настроек скрывается под кнопкой «Настроить урок», тест не сможет с ними взаимодействовать и упадет по таймауту. Перед взаимодействием с контролами внутри Progressive UI **всегда проверяйте видимость кнопки-expand**:
  ```typescript
  const configureBtn = page.getByRole("button", { name: "Настроить урок" });
  if (await configureBtn.isVisible()) {
    await configureBtn.click();
  }
  // Теперь взаимодействуем с раскрытыми элементами...
  ```
- **Используйте унифицированные элементы.** Если после раскрытия настроек кнопка на мобильном и на десктопе называется одинаково («Начать урок»), используйте единый селектор (`page.getByRole("button", { name: "Начать урок", exact: true })`), а не пытайтесь угадать текст для разных девайсов.
- **Пересекающиеся accessible names требуют `exact: true`.** Кнопки «Знал»/«Не знал» и «Сохранить и выйти»/«Назад — сохранить и выйти из урока» намеренно содержат общие фрагменты. Для таких controls всегда используйте точное имя или scope через ближайший `dialog`, `group` или `region`; strict-mode violation нельзя скрывать `.first()`.
- **Осторожно с `getByText` и `toBeVisible`**. Если элемент скрыт за аккордеоном или полностью вырезан из мобильного Layout через CSS `display: none` (например, блок `lx-lesson-preview`), `expect(locator).toBeVisible()` логично упадёт на мобилках. В таких случаях оборачивайте проверку в условие для десктопа:
  ```typescript
  if ((page.viewportSize()?.width || 1000) >= 768) {
    await expect(page.getByText("... summary ...")).toBeVisible();
  }
  ```

## 2. Скролл и History API (Next.js)

- **Ожидайте debouncing скролла**. Next.js сохраняет позицию скролла в `sessionStorage` для `next/router`, но делает это с небольшим делей-debouncing'ом (около 100-250ms) после события скролла. Если тест выполняет программный скролл (`scrollIntoViewIfNeeded`, `window.scrollTo`) и **сразу же** кликает по ссылке (переходит на другую страницу), Next.js может не успеть сохранить позицию скролла, и при возврате (`page.goBack()`) позиция будет равна 0.
- **Всегда добавляйте задержку**:
  ```typescript
  await page.getByRole("button", { name: "Открыть" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500); // Обязательно ждём перед навигацией
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "Открыть" }).click();
  ```

## 3. API Моки и Дефолтные значения

- Если вы меняете дефолтное поведение в UI (например, `studyMode` стал по умолчанию `recall`), обновите API-моки в тестах так, чтобы они либо отражали новое дефолтное поведение, либо возвращали параметры обратно из тела запроса (echoing). Иначе тест сломается на валидации UI состояния после ответа сервера.

## 4. Визуальные регрессии

- **Не обновляйте снепшоты на macOS.** Скриншоты, сгенерированные локально, упадут в CI (Linux Ubuntu) из-за разницы в рендеринге шрифтов. Используйте Docker (`scripts/ci/frontend-container.sh`) или GitHub Actions для обновления визуальных тестов.

## 5. Доступность (Accessibility)

- Привязывайтесь к `getByRole` и `getByText`.
- Соблюдайте семантику (используйте `<button>`, а не `<div>` с `onClick`), чтобы тесты в группе `ui-accessibility` проходили успешно.

## 6. Обязательная фиксация предотвращения повторных ошибок

Каждая обнаруженная ошибка должна завершаться не только исправлением текущего падения, но и документированной профилактикой повторения. Это относится к локальным проверкам, unit/integration/E2E-тестам, GitHub Actions, visual regression, accessibility, performance, stage/production smoke, runtime-дефектам и замечаниям code review.

После появления ошибки агент или разработчик обязан:

1. Сначала установить подтверждённую первопричину по логам, artifact, screenshot, trace или воспроизводимому сценарию. Нельзя делать вывод только по названию упавшего job.
2. Исправить первопричину, а не скрывать симптом ослаблением assertion, увеличением timeout или исключением проверки без отдельного обоснования.
3. До перевода PR в Ready или сообщения о завершении обновить этот файл и записать конкретное правило, проверку или технический приём, который предотвращает аналогичную ошибку в будущем.
4. Если подходящее правило уже существует, дополнить или уточнить его вместо создания дублирующей записи.
5. Для внешнего или транзиентного сбоя также зафиксировать способ его распознавания и безопасную процедуру повторной проверки, если это может повлиять на будущие решения команды.

Не копируйте в этот файл длинный лог ошибки. Запись должна содержать применимое знание:

```markdown
### YYYY-MM-DD — <категория / краткое название ошибки>

- **Симптом:** какой check, route или сценарий упал.
- **Первопричина:** подтверждённая техническая причина.
- **Профилактика:** что необходимо делать или запрещено делать в следующих задачах.
- **Обязательная проверка:** конкретный test, command, assertion, artifact или CI gate, подтверждающий отсутствие регрессии.
- **Область действия:** компоненты, routes, viewport, browser или окружения, к которым относится правило.
```

PR не считается полностью готовым, если в процессе работы возникла новая категория ошибки, но профилактическое знание не добавлено в `.agents/AGENTS.md` и не связано с уже существующим правилом.

### 2026-07-24 — React DOM ownership в модальных keyboard traps

- **Симптом:** unit gate `components/react-dom-ownership.test.ts` сообщил `global document event delegation` для нового presentation-компонента.
- **Первопричина:** focus trap диалога подписывался через `document.addEventListener("keydown", ...)`, хотя весь диалог принадлежит React subtree.
- **Профилактика:** keyboard trap, Escape и циклический Tab обрабатывать через React `onKeyDown` на корневом элементе диалога; глобальные document/window listeners допустимы только для действительно внешних lifecycle-событий с явным обоснованием.
- **Обязательная проверка:** `npm test -- components/react-dom-ownership.test.ts` и keyboard E2E безопасного выхода.
- **Область действия:** React dialogs, modals, drawers и focused routes.

### 2026-07-24 — Ложные срабатывания source-contract regex на комментариях

- **Симптом:** `app/active-lesson.test.ts` ошибочно обнаружил raw hex color в CSS, хотя совпадением оказался номер Issue `#193` в комментарии.
- **Первопричина:** regex анализировал комментарии и исполняемый CSS как один текстовый поток.
- **Профилактика:** перед проверкой запрещённых CSS literals удалять block/line comments либо использовать parser-aware проверку; не ослаблять запрет на реальные raw values.
- **Обязательная проверка:** unit contract должен падать на реальном `#rrggbb` в declaration и проходить при `#123` только внутри комментария/документации.
- **Область действия:** source-contract tests для CSS, TS/TSX и конфигураций.

### 2026-07-24 — PR workflow после commit от `github-actions[bot]`

- **Симптом:** PR workflow завершился как `action_required`, при этом GitHub API вернул пустой список jobs.
- **Первопричина:** head SHA был создан workflow через `GITHUB_TOKEN`; автоматически возникший PR synchronize run не был обычным исполняемым CI run. Следующий commit через авторизованный GitHub connector создал штатный run с jobs.
- **Профилактика:** временные write-workflows не считать источником финального CI; после их bot-commit обязательно создать содержательный commit от разработчика/агента через обычный repository credential и проверять новый head SHA.
- **Обязательная проверка:** `fetch_commit_workflow_runs` должен вернуть CI run со status `queued|in_progress|completed`, а `fetch_workflow_run_jobs` — непустой список jobs.
- **Область действия:** GitHub Actions workflows с `contents: write`, snapshot generation и автоматические source migrations.


### 2026-07-24 — Contrast semantic token недостаточен для мелкого текста на surface

- **Симптом:** blocking axe audit обнаружил `color-contrast` 3.42:1 у `Сохранено` и eyebrow активного урока.
- **Первопричина:** базовый retained token предназначен для статуса/акцента, но не обеспечивает WCAG AA 4.5:1 для текста 12–14 px на белой surface.
- **Профилактика:** сохранять базовый semantic status token для fills/borders, а для мелкого foreground-текста вводить локальный token только после расчёта Light/Dark contrast; не отключать axe rule и не увеличивать шрифт как замену проверке.
- **Обязательная проверка:** unit-расчёт contrast ratio >= 4.5 для обеих appearance surfaces и blocking axe audit route/dialog.
- **Область действия:** status labels, eyebrow, compact captions и feedback text на semantic surfaces.

### 2026-07-24 — Computed CSS duration сериализуется по-разному

- **Симптом:** reduced-motion E2E ожидал строку `0.00001s`, Chromium/WebKit вернули эквивалентную запись `1e-05s`.
- **Первопричина:** тест сравнивал формат сериализации computed style, а не числовую длительность transition.
- **Профилактика:** числовые CSS values из `getComputedStyle` нормализовать через `Number.parseFloat` и проверять семантический предел; не менять runtime value под формат одного browser engine.
- **Обязательная проверка:** reduced-motion test проходит в Chromium и WebKit при duration <= 0.00001s.
- **Область действия:** motion, duration, opacity, transform и другие computed CSS assertions.

### 2026-07-24 — Redesign удалил legacy controls, но E2E продолжил искать старую структуру

- **Симптом:** lesson, accessibility и ownership suites искали `Слово N`, `Урок в процессе` и tabs `Карточка/Пример/Контекст`, которых нет в canonical Active Lesson.
- **Первопричина:** тесты проверяли внутреннюю legacy-разметку и копирайт вместо устойчивых contract semantics новой production slice.
- **Профилактика:** при замене canonical screen одновременно мигрировать все потребляющие suites на roles/state contracts: progressbar `aria-valuetext`, route region, prompt heading, focusable controls и dialog; удалённый UX не сохранять только ради старого теста.
- **Обязательная проверка:** repository search не находит удалённые Active Lesson selectors, а lesson/a11y/ui ownership suites проходят во всех configured projects.
- **Область действия:** route redesign, Playwright selectors, accessibility journeys и React ownership tests.

### 2026-07-24 — Первичный visual baseline отсутствует

- **Симптом:** visual regression сохранил `*-actual.png` и завершился ошибкой `A snapshot doesn't exist` для новых Active Lesson states.
- **Первопричина:** production state новый и ещё не имел утверждённого Linux snapshot; отдельный Dark scenario до baseline дополнительно блокировался нестрогим selector.
- **Профилактика:** сначала устранить runtime/test defects и вручную сверить actual artifact с Figma, затем генерировать baseline только в project Linux container; добавлять в commit только явно перечисленные новые screenshots.
- **Обязательная проверка:** повторный `npm run test:e2e:visual` сравнивает существующие Linux baselines без `--update-snapshots` и проходит.
- **Область действия:** visual regression, new canonical frames, Linux rendering environment.
