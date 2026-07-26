# Дополнения production-safe delivery — PR #214

## Короткое описание

Применяйте этот блок при изменении route islands, focus/scroll restoration, accessible names, progressive disclosure, lesson recovery, reduced motion и Linux visual baselines. Правила появились по результатам полного CI PR #214 и предотвращают повторение ошибок, которые targeted happy-path tests не обнаруживали.

## Инструкции и правила

1. Для переходов между независимыми client islands проверяйте полный journey: legacy island → новый island → legacy island, Back/Forward, сохранённый tab target, scroll, focus и live-region announcement.
2. Не используйте глобальный `MutationObserver` для ожидания React route lifecycle. Применяйте отменяемый `requestAnimationFrame` scheduler с точным semantic predicate и cleanup.
3. Перед созданием exact Playwright locator получите фактический accessibility snapshot. Полный accessible name может включать тему, перевод, CTA и assistive text.
4. Multi-route lesson journey моделируется полностью: create → active route bootstrap → canonical resume gate → active presentation.
5. API fixture покрывает все list, direct-detail и mutation requests, возникающие после remount. Direct-detail item выбирается по slug/id запроса.
6. Computed CSS durations нормализуются в миллисекунды. Для reduced motion допустимы только значения `<= 0.01ms` и ноль активных Web Animations.
7. Утверждённые Linux PNG импортируются только из конкретного artifact ID после ручной сверки с Figma. Обязательны SHA-256, IHDR dimensions и точный allow-list paths.
8. Temporary workflow удаляется из diff до финального CI. Branch-local maintenance нельзя строить на непроверенной регистрации `pull_request` workflow; предпочтительны прямой contents/Git Data API либо уже зарегистрированный path-scoped mechanism.
9. Финальный required CI запускается только на developer-authored head после восстановления канонических workflows.
10. При imperative App Router navigation из отдельного client island не размонтируйте island по намерению перехода или фиксированной задержке. Сохраняйте owner до фактической смены pathname через отменяемый scheduler с точным route predicate.

## Инструменты и скрипты

- GitHub connector: `compare_commits`, workflow jobs/logs/artifacts, Git blobs/trees/commits, explicit ref update, Ready/merge и post-merge validation.
- Playwright report и trace viewer: фактические accessibility snapshots, request sequence и computed styles.
- `scripts/ci/frontend-container.sh`: production build и Linux visual regression без `--update-snapshots` на финальном head.
- Targeted suites: `frontend/e2e/adaptive-navigation.spec.ts`, `frontend/e2e/route-focus-management.spec.ts`, `frontend/e2e/interface-copy.spec.ts`, `frontend/e2e/progress-evidence.spec.ts`.
- Figma source of truth PR #214: nodes `76:6`, `76:53`, `76:154`.

## Данные

- CI #1716 подтвердил route-island focus/scroll ownership, progressive disclosure, canonical lesson resume gate и direct-detail mock contract в Chromium/WebKit.
- Visual artifact `8614824397` стал источником шести вручную утверждённых Linux PNG.
- CI #1721 и #1729 позволили отделить stale selectors/assertions от production defects по accessibility snapshots и Playwright traces.
- Approved visual import проверен по SHA-256, PNG dimensions и allow-list из шести paths.
- Утверждённые snapshot paths:
  - `frontend/e2e/visual-regression.spec.ts-snapshots/progress-visual-compact-linux.png`;
  - `frontend/e2e/visual-regression.spec.ts-snapshots/progress-visual-medium-linux.png`;
  - `frontend/e2e/visual-regression.spec.ts-snapshots/progress-visual-desktop-linux.png`;
  - `frontend/e2e/visual-regression.spec.ts-snapshots/calendar-dialog-visual-compact-linux.png`;
  - `frontend/e2e/visual-regression.spec.ts-snapshots/calendar-dialog-visual-medium-linux.png`;
  - `frontend/e2e/visual-regression.spec.ts-snapshots/calendar-dialog-visual-desktop-linux.png`.

## Журнал новых категорий ошибок

### 2026-07-25 — Route island remount потерял focus, scroll и route announcement

- **Симптом:** keyboard и adaptive-navigation suites после перехода через `/progress` не восстанавливали фокус на новом `main`, scroll предыдущей вкладки и live-region announcement.
- **Первопричина:** `/progress` был выделен в отдельный React route island, но ownership route transition оставался внутри размонтированного legacy product graph.
- **Почему ошибка не была обнаружена раньше:** feature E2E проверял содержимое `/progress`, но не полный переход между islands, Back/Forward и сохранённый tab destination.
- **Профилактика:** общий App Router shell владеет boundary transition и ждёт semantic `main` через отменяемый scheduler.
- **Regression gate:** `route-focus-management.spec.ts` и `adaptive-navigation.spec.ts`.
- **Область действия:** App Router islands, primary tabs, browser history, keyboard и screen readers.

### 2026-07-25 — Global `MutationObserver` нарушил React DOM ownership

- **Симптом:** frontend core остановил изменение правилом `react-dom-ownership` после попытки ждать remount через `MutationObserver(document.body)`.
- **Первопричина:** synchronization была реализована глобальным наблюдением DOM вместо React-owned lifecycle.
- **Почему ошибка не была обнаружена раньше:** исправление проектировалось от browser symptom без сверки с ownership source-contract.
- **Профилактика:** использовать отменяемый `requestAnimationFrame` loop с точным predicate и cleanup; global DOM не наблюдать и не патчить.
- **Regression gate:** frontend core ownership gate, lint/typecheck и route-focus E2E.
- **Область действия:** React route shells, focus restoration, dialogs и portals.

### 2026-07-25 — Exact text locator не учёл assistive copy внутри semantic owner

- **Симптом:** interface-copy suite не находил «Закреплено», а adaptive-navigation не находил phrase card по сокращённому имени.
- **Первопричина:** locator строился по видимой подстроке, хотя фактический accessibility contract включал assistive text, тему, перевод и CTA.
- **Почему ошибка не была обнаружена раньше:** selector проектировался по screenshot, а не по accessibility snapshot.
- **Профилактика:** сначала получить полное accessible name, затем scope через semantic owner; assistive context не удалять ради теста.
- **Regression gate:** `interface-copy.spec.ts` и `adaptive-navigation.spec.ts` без `.first()`.
- **Область действия:** definition lists, catalog cards, visually-hidden copy и Playwright locators.

### 2026-07-25 — Созданный server lesson сначала открывает canonical resume gate

- **Симптом:** Progress E2E после POST `/api/v1/lessons` ожидал active presentation, но route показывал «Продолжить урок».
- **Первопричина:** тест пропустил recovery contract server-owned active lesson.
- **Почему ошибка не была обнаружена раньше:** create response был ошибочно связан напрямую с presentation без route bootstrap.
- **Профилактика:** моделировать create → active route bootstrap → resume gate → active presentation.
- **Regression gate:** `progress-evidence.spec.ts` нажимает точный CTA и затем проверяет request bodies и режим.
- **Область действия:** lesson creation, hydration, reload/recovery и due queue.

### 2026-07-25 — Route-island remount активировал отсутствующий direct-detail API mock

- **Симптом:** WebKit scenario возвращался на `/phrases/:slug`, но fixture отвечал `not_mocked`.
- **Первопричина:** mock покрывал catalog list, но не fetch после remount detail route.
- **Почему ошибка не была обнаружена раньше:** fixture анализировался как один экран, а не полный navigation journey.
- **Профилактика:** строить mock по полной read/mutation sequence; list и direct-entry endpoints добавлять совместно.
- **Regression gate:** `adaptive-navigation.spec.ts` получает detail payload и сохраняет URL, heading и scroll.
- **Область действия:** route islands, deep links, catalog/detail mocks и WebKit.

### 2026-07-25 — Reduced-motion assertion не нормализовал zero-equivalent duration

- **Симптом:** trace CI #1729 показал `transition-duration: 1e-05s` при отсутствии animations, а тест требовал буквальное `0s`.
- **Первопричина:** CSS использует `0.01ms`, сериализованный браузером в секундах.
- **Почему ошибка не была обнаружена раньше:** assertion сравнивал строковое представление, а не семантическую длительность.
- **Профилактика:** нормализовать comma-separated durations в миллисекунды и принимать только `<= 0.01ms` при нуле Web Animations.
- **Regression gate:** `route-focus-management.spec.ts` проверяет семь chart bars.
- **Область действия:** reduced motion, CSS serialization, charts и Chromium/WebKit assertions.

### 2026-07-25 — Visual artifact import должен быть криптографически и path-guarded

- **Симптом:** повторный Linux render workflow не создал commit в execution window; слепой повтор мог импортировать другой result.
- **Первопричина:** первый one-shot пытался заново рендерить вместо переноса уже просмотренных actual PNG.
- **Почему ошибка не была обнаружена раньше:** binary delivery path не был включён в pre-flight tooling plan.
- **Профилактика:** импортировать конкретный artifact ID с SHA-256, IHDR dimensions и allow-list paths; bot commit меняет только binaries, workflow восстанавливается byte-for-byte.
- **Regression gate:** compare показывает шесть PNG, signatures валидны, visual CI проходит без update mode.
- **Область действия:** Linux visual baselines, Actions artifacts, binary commits и final-head provenance.

### 2026-07-25 — Branch-local one-shot workflow не должен зависеть от `pull_request` регистрации

- **Симптом:** временный `pull_request` workflow присутствовал в head, но отдельный run не зарегистрировался после synchronize commits.
- **Первопричина:** регистрация workflow зависит от event/base context и не является надёжным branch-local maintenance mechanism.
- **Почему ошибка не была обнаружена раньше:** trigger strategy не была проверена до помещения payload в workflow.
- **Профилактика:** применять прямой contents/Git Data API или заранее зарегистрированный path-scoped workflow; после выполнения восстановить canonical workflow.
- **Regression gate:** allow-listed commit, прочитанный обратно canonical workflow blob и финальный CI на developer-authored head.
- **Область действия:** temporary workflows, binary/text maintenance commits и branch protection.

### 2026-07-26 — Async mutation размонтировала route island до фиксации App Router pathname

- **Симптом:** POST однословного урока возвращал валидный payload и точный `wordIds: [101]`, но `/words/101` не переходил в `/lesson/active`; вместо этого отображалась compatibility-заглушка legacy product graph.
- **Первопричина:** событие намерения перехода синхронно переключало `routeGraph` и размонтировало `LexigoDictionaryApp`, который только после завершения async mutation вызывал imperative `router.push`. Попытка заменить синхронное переключение на `setTimeout(0)` осталась гонкой и также срабатывала раньше реальной смены pathname.
- **Почему ошибка не была обнаружена раньше:** direct entry, обычные Link-переходы и request-body tests проверялись отдельно; полный journey async mutation → imperative App Router push → cross-island remount впервые был выполнен полным UI shard.
- **Профилактика:** не считать custom event или фиксированную задержку доказательством завершённой навигации. Сохранять исходный island до фактического выхода `window.location.pathname` из его route predicate через отменяемый `requestAnimationFrame` scheduler с cleanup.
- **Regression gate:** `frontend/components/word-detail-source.test.ts`, `frontend/e2e/app-router-routes.spec.ts` и полный UI shard 1/2.
- **Область действия:** App Router client islands, async mutations, imperative navigation и route-graph handoff.
