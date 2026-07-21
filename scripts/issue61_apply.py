#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one occurrence, found {count}: {old[:100]!r}")
    write(path, text.replace(old, new, 1))


def replace_between(path: str, start: str, end: str, replacement: str) -> None:
    text = read(path)
    start_index = text.find(start)
    if start_index < 0:
        raise RuntimeError(f"{path}: start marker not found: {start!r}")
    end_index = text.find(end, start_index + len(start))
    if end_index < 0:
        raise RuntimeError(f"{path}: end marker not found: {end!r}")
    write(path, text[:start_index] + replacement + text[end_index:])


# Primary navigation exposes four user intentions. Phrases remain a canonical
# catalog route and are reached from the Dictionary catalog switch.
replace_once(
    "frontend/lib/navigation.ts",
    '  { view: "phrases", label: "Фразы", shortLabel: "Фразы", path: "/phrases" },\n',
    "",
)

replace_once(
    "frontend/app/layout.tsx",
    'import "./dictionary-catalog.css";\n',
    'import "./dictionary-catalog.css";\nimport "./information-architecture.css";\n',
)

replace_once(
    "frontend/components/route-primary-navigation.tsx",
    'import { createNavigationHistoryState } from "../lib/navigation-history";\n',
    'import { createNavigationHistoryState } from "../lib/navigation-history";\nimport { queueProductJourneyIntent } from "../lib/product-journey";\n',
)
replace_once(
    "frontend/components/route-primary-navigation.tsx",
    '  const nextState = createNavigationHistoryState(destination.target, destination.scroll);\n  window.history.pushState(nextState, "", nextURL);\n',
    '  const nextState = createNavigationHistoryState(destination.target, destination.scroll);\n  queueProductJourneyIntent("primary_navigation");\n  window.history.pushState(nextState, "", nextURL);\n',
)

# Backend product-journey endpoint and persistence.
replace_once(
    "backend/internal/performance/repository.go",
    'type Store interface {\n\tStoreReport(ctx context.Context, report Report) error\n}\n',
    'type Store interface {\n\tStoreReport(ctx context.Context, report Report) error\n\tStoreJourney(ctx context.Context, event JourneyEvent) error\n}\n',
)
repository = read("backend/internal/performance/repository.go")
repository += '''

func (repository *Repository) StoreJourney(ctx context.Context, event JourneyEvent) error {
	command, err := repository.pool.Exec(
		ctx,
		`insert into product_navigation_events (
			app_version,
			from_route,
			to_route,
			intent,
			is_backtrack,
			device_class,
			browser_family,
			display_mode
		) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
		event.AppVersion,
		event.FromRoute,
		event.ToRoute,
		event.Intent,
		event.Backtrack,
		event.DeviceClass,
		event.BrowserFamily,
		event.DisplayMode,
	)
	if err != nil {
		return fmt.Errorf("store product journey: %w", err)
	}
	if command.RowsAffected() != 1 {
		return fmt.Errorf("store product journey: inserted %d rows", command.RowsAffected())
	}
	return nil
}
'''
write("backend/internal/performance/repository.go", repository)

http_go = read("backend/internal/performance/http.go")
http_go += '''

func (handler *Handler) Journey(w http.ResponseWriter, r *http.Request) {
	var event JourneyEvent
	if err := httpx.DecodeJSONLimit(w, r, &event, MaxJourneyEventBytes); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "request body must contain one valid product journey event")
		return
	}
	if err := event.Validate(); err != nil {
		var validationError *ValidationError
		if errors.As(err, &validationError) {
			httpx.WriteFieldError(w, http.StatusUnprocessableEntity, "invalid_product_journey", validationError.Message, validationError.Field)
			return
		}
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_product_journey", "product journey event is invalid")
		return
	}
	if err := handler.store.StoreJourney(r.Context(), event); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusAccepted)
}
'''
write("backend/internal/performance/http.go", http_go)

replace_once(
    "backend/internal/server/server.go",
    '\tmux.Handle("POST /api/v1/performance/rum", limiter.MiddlewareFailClosed("performance", 120, http.HandlerFunc(performanceHandler.Report)))\n',
    '\tmux.Handle("POST /api/v1/performance/rum", limiter.MiddlewareFailClosed("performance", 120, http.HandlerFunc(performanceHandler.Report)))\n\tmux.Handle("POST /api/v1/product/journey", limiter.MiddlewareFailClosed("product-journey", 120, http.HandlerFunc(performanceHandler.Journey)))\n',
)

replace_once(
    "backend/internal/performance/http_test.go",
    'type recordingStore struct {\n\treports []Report\n\terr     error\n}\n',
    'type recordingStore struct {\n\treports    []Report\n\tjourneys   []JourneyEvent\n\terr        error\n\tjourneyErr error\n}\n',
)
replace_once(
    "backend/internal/performance/http_test.go",
    'func (store *recordingStore) StoreReport(_ context.Context, report Report) error {\n\tif store.err != nil {\n\t\treturn store.err\n\t}\n\tstore.reports = append(store.reports, report)\n\treturn nil\n}\n',
    'func (store *recordingStore) StoreReport(_ context.Context, report Report) error {\n\tif store.err != nil {\n\t\treturn store.err\n\t}\n\tstore.reports = append(store.reports, report)\n\treturn nil\n}\n\nfunc (store *recordingStore) StoreJourney(_ context.Context, event JourneyEvent) error {\n\tif store.journeyErr != nil {\n\t\treturn store.journeyErr\n\t}\n\tstore.journeys = append(store.journeys, event)\n\treturn nil\n}\n',
)

# OpenAPI contract.
journey_path = '''  /api/v1/product/journey:
    post:
      operationId: reportProductJourney
      tags: [analytics]
      summary: Принять анонимный переход между allow-listed экранами.
      description: Событие не содержит user ID, session ID, IP, raw URL, query, referrer, search text, cookie или raw User-Agent.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ProductJourneyEvent"
      responses:
        "202":
          description: Переход принят и сохранён.
          headers:
            Cache-Control:
              schema: { type: string, const: no-store }
        "400":
          $ref: "#/components/responses/BadRequest"
        "403":
          $ref: "#/components/responses/Forbidden"
        "422":
          $ref: "#/components/responses/ValidationError"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          description: Внутренняя ошибка сохранения без раскрытия деталей инфраструктуры.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
'''
replace_once(
    "api/openapi.yaml",
    "  /api/v1/auth/register:\n",
    journey_path + "  /api/v1/auth/register:\n",
)
journey_schema = '''    ProductJourneyEvent:
      type: object
      additionalProperties: false
      required: [appVersion, fromRoute, toRoute, intent, backtrack, deviceClass, browserFamily, displayMode]
      properties:
        appVersion:
          type: string
          minLength: 1
          maxLength: 80
          pattern: '^[A-Za-z0-9._-]+$'
        fromRoute:
          type: string
          enum: [/, /learn, /dictionary, /phrases, /progress, /profile, /lesson, /word, /phrase, /privacy, /terms, /legal, /not-found]
        toRoute:
          type: string
          enum: [/, /learn, /dictionary, /phrases, /progress, /profile, /lesson, /word, /phrase, /privacy, /terms, /legal, /not-found]
        intent:
          type: string
          enum:
            - primary_navigation
            - home_next_action
            - home_configure_lesson
            - home_find_material
            - catalog_switch
            - catalog_open_detail
            - catalog_configure_lesson
            - lesson_start
            - lesson_exit
            - authentication
            - browser_history
            - in_app_navigation
        backtrack:
          type: boolean
        deviceClass:
          type: string
          enum: [mobile, tablet, desktop]
        browserFamily:
          type: string
          enum: [chromium, webkit, firefox, other]
        displayMode:
          type: string
          enum: [browser, standalone, fullscreen, minimal-ui, unknown]
'''
replace_once(
    "api/openapi.yaml",
    "    PerformanceRUMReport:\n",
    journey_schema + "    PerformanceRUMReport:\n",
)

# Dictionary becomes a browsing surface and forwards context to the lesson composer.
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    'import type { CatalogSort, CatalogStatus, NavigationTarget } from "../lib/navigation";\n',
    'import type { CatalogSort, CatalogStatus, NavigationTarget } from "../lib/navigation";\nimport type { ProductJourneyIntent } from "../lib/product-journey";\n',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    'import { AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";\n',
    'import { AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";\nimport { CatalogKindNavigation } from "./catalog-kind-navigation";\n',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '''  onNavigate: (
    target: NavigationTarget,
    replace?: boolean,
    scroll?: NavigationScrollPosition,
  ) => void;
  onBackToResults: () => void;
  onStartLesson: (items: LearningItem[], mode: "study" | "recall") => void;
  onRequireAuthentication: () => void;
''',
    '''  onNavigate: (
    target: NavigationTarget,
    replace?: boolean,
    scroll?: NavigationScrollPosition,
    intent?: ProductJourneyIntent,
  ) => void;
  onBackToResults: () => void;
  onConfigureLesson: (context: { source: DictionarySource; topic?: string }) => void;
  onRequireAuthentication: () => void;
''',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '  onBackToResults,\n  onStartLesson,\n  onRequireAuthentication,\n',
    '  onBackToResults,\n  onConfigureLesson,\n  onRequireAuthentication,\n',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '    onNavigate(cleanTarget(next));\n',
    '    onNavigate(cleanTarget(next), false, undefined, "in_app_navigation");\n',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '    onNavigate({ view: "library" });\n',
    '    onNavigate({ view: "library" }, false, undefined, "in_app_navigation");\n',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '    onNavigate(cleanTarget(filters, String(item.wordId)));\n',
    '    onNavigate(cleanTarget(filters, String(item.wordId)), false, undefined, "catalog_open_detail");\n',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '<section className="lx-page-heading">\n          <div><span>СЛОВАРЬ</span><h1>Каталог слов и терминов</h1><p>Ищите слова по английскому написанию, переводу и синонимам, затем открывайте карточку или запускайте урок.</p></div>\n        </section>',
    '<CatalogKindNavigation active="words" onSelect={() => onNavigate({ view: "phrases" }, false, undefined, "catalog_switch")} />\n        <section className="lx-page-heading">\n          <div><span>СЛОВАРЬ</span><h1>Каталог слов и терминов</h1><p>Ищите слова по английскому написанию, переводу и синонимам. Настройка урока находится в отдельном разделе «Обучение».</p></div>\n        </section>',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '''              <button className="lx-button primary" type="button" onClick={() => onStartLesson([selectedItem], selectedItem.status === "new" ? "study" : "recall")}>
                {selectedItem.status === "new" ? "Изучить это слово" : "Повторить это слово"}
              </button>
''',
    '''              <button className="lx-button primary" type="button" onClick={() => onConfigureLesson({ source: filters.source, topic: selectedItem.topic })}>
                Настроить урок по этой теме
              </button>
''',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '''      <section className="lx-page-heading">
        <div>
          <span>СЛОВАРЬ</span>
          <h1>Каталог слов и терминов</h1>
          <p>Поиск по английскому слову, переводу и aliases. Фильтры и текущая страница сохраняются в адресе.</p>
        </div>
        <div className="lx-heading-badge"><span>{progress ? `${progress.masteredWords} слов освоено` : metadataStatus === "ready" && metadata ? `${metadata.totals.words} слов` : "Каталог"}</span></div>
      </section>
''',
    '''      <CatalogKindNavigation active="words" onSelect={() => onNavigate({ view: "phrases" }, false, undefined, "catalog_switch")} />
      <section className="lx-page-heading">
        <div>
          <span>СЛОВАРЬ</span>
          <h1>Находите и изучайте материал в контексте</h1>
          <p>Поиск по английскому слову, переводу и aliases. Здесь вы просматриваете материал; состав урока настраивается в «Обучении».</p>
        </div>
        <div className="lx-heading-badge"><span>{progress ? `${progress.masteredWords} слов освоено` : metadataStatus === "ready" && metadata ? `${metadata.totals.words} слов` : "Каталог"}</span></div>
      </section>
''',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '''      <div className="lx-page-actions">
        <button className="lx-button primary" type="button" disabled={pending || items.length === 0} onClick={() => onStartLesson(items, filters.status === "review" || filters.status === "mastered" ? "recall" : "study")}>
          {filters.status === "review" || filters.status === "mastered" ? "Повторить текущую страницу" : "Изучить текущую страницу"}
        </button>
        <small>В урок попадут только показанные {items.length.toLocaleString("ru-RU")} элементов; весь каталог не загружается.</small>
      </div>
''',
    '''      <div className="lx-page-actions">
        <button className="lx-button primary" type="button" disabled={pending || items.length === 0} onClick={() => onConfigureLesson({ source: filters.source, ...(filters.topic ? { topic: filters.topic } : {}) })}>
          Настроить урок по текущей выборке
        </button>
        <small>Раздел и тема будут перенесены в composer; повторно выбирать их не потребуется.</small>
      </div>
''',
)

# Main application: focused Home, catalog hierarchy, context-preserving composer,
# and transition analytics shared by legacy and App Router navigation.
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'import { AsyncResourceNotice, AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";\n',
    'import { AsyncResourceNotice, AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";\nimport { CatalogKindNavigation } from "./catalog-kind-navigation";\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'import { createScrollSnapshotScheduler } from "../lib/navigation-scroll-snapshot";\n',
    'import { createScrollSnapshotScheduler } from "../lib/navigation-scroll-snapshot";\nimport {\n  consumeProductJourneyIntent,\n  reportProductJourney,\n  type ProductJourneyIntent,\n} from "../lib/product-journey";\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'type NavigationRequestOptions = {\n  scroll?: NavigationScrollPosition;\n  allowLessonExit?: boolean;\n};\n',
    'type NavigationRequestOptions = {\n  scroll?: NavigationScrollPosition;\n  allowLessonExit?: boolean;\n  intent?: ProductJourneyIntent;\n};\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '  catalogQuery?: CatalogBrowseQuery;\n};\n',
    '  catalogQuery?: CatalogBrowseQuery;\n  journeyIntent?: ProductJourneyIntent;\n};\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  {
    value: "all",
    label: "Все и сразу",
    hint: "Открытый список без записи оценок",
    icon: "library",
  },
''',
    "",
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '  const [studyMode, setStudyMode] = useState<StudyMode>("study");\n',
    '  const [studyMode, setStudyMode] = useState<StudyMode>("study");\n  const [lessonTopic, setLessonTopic] = useState("");\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '      if (next.source) setSource(next.source);\n      writeNavigationCache(window.localStorage, next);\n',
    '      if (next.source) setSource(next.source);\n      if (next.view === "learn") setLessonTopic(next.topic ?? "");\n      writeNavigationCache(window.localStorage, next);\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''      setPendingNavigation({
        identity: navigationIdentity(next),
        scroll,
        behavior: "auto",
      });
      applyNavigation(next, scroll);
''',
    '''      reportProductJourney(current, next, consumeProductJourneyIntent() ?? "browser_history");
      setPendingNavigation({
        identity: navigationIdentity(next),
        scroll,
        behavior: "auto",
      });
      applyNavigation(next, scroll);
''',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '        body: JSON.stringify({ source, studyMode, lessonSize: String(lessonSize) }),\n',
    '        body: JSON.stringify({ source, studyMode, lessonSize: String(lessonSize), ...(lessonTopic ? { topic: lessonTopic } : {}) }),\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '  }, [navigation.view, session, source, studyMode, lessonSize]);\n',
    '  }, [lessonSize, lessonTopic, navigation.view, session, source, studyMode]);\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''    const currentScroll = { x: window.scrollX, y: window.scrollY };
    navigationTabs.remember(navigation, currentScroll);
''',
    '''    reportProductJourney(navigation, target, options.intent ?? "in_app_navigation");
    const currentScroll = { x: window.scrollX, y: window.scrollY };
    navigationTabs.remember(navigation, currentScroll);
''',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    if (target.source) setSource(target.source);\n    writeNavigationCache(window.localStorage, target);\n',
    '    if (target.source) setSource(target.source);\n    if (target.view === "learn") setLessonTopic(target.topic ?? "");\n    writeNavigationCache(window.localStorage, target);\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    navigate(destination.target, false, { scroll: destination.scroll });\n',
    '    navigate(destination.target, false, { scroll: destination.scroll, intent: "primary_navigation" });\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    const resolvedTopic = overrides.topic?.trim() ?? "";\n',
    '    const resolvedTopic = overrides.topic?.trim() ?? lessonTopic.trim();\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    setStudyMode(resolvedMode);\n\n    if (resolvedMode !== "all" && !activeSession) {\n',
    '    setStudyMode(resolvedMode);\n    setLessonTopic(resolvedTopic);\n\n    if (resolvedMode !== "all" && !activeSession) {\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'navigate({ view: "lesson", source: resolvedSource });\n',
    'navigate({ view: "lesson", source: resolvedSource }, false, { intent: overrides.journeyIntent ?? "lesson_start" });\n',
)
# The all-items branch has the same navigation statement.
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '      navigate({ view: "lesson", source: resolvedSource });\n',
    '      navigate({ view: "lesson", source: resolvedSource }, false, { intent: overrides.journeyIntent ?? "lesson_start" });\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    navigate({ view: target }, true, { allowLessonExit: true });\n',
    '    navigate({ view: target }, true, { allowLessonExit: true, intent: "lesson_exit" });\n',
)

home = '''  function renderHome() {
    const progressPending = progressStatus.phase === "idle" || progressStatus.phase === "loading";
    const dueNow = progress?.dueNow ?? 0;
    const nextAction = activeLesson
      ? {
          eyebrow: "НЕЗАВЕРШЁННЫЙ УРОК",
          title: "Продолжите с сохранённой позиции",
          description: `${sourceLabel(activeLesson.source)} · карточка ${activeLesson.currentIndex + 1} из ${activeLesson.items.length}.`,
          label: "Продолжить урок",
          action: () => void resumeLesson(),
        }
      : session && progress && dueNow > 0
        ? {
            eyebrow: "СЕЙЧАС ЛУЧШЕ ПОВТОРИТЬ",
            title: `${dueNow} ${plural(dueNow, ["элемент готов", "элемента готовы", "элементов готовы"])} к повторению`,
            description: "LexiGo соберёт due-очередь автоматически — режим и состав уже определены вашим прогрессом.",
            label: "Повторить сейчас",
            action: () => void startLesson(session, { source: "mixed", size: 30, mode: "recall", journeyIntent: "home_next_action" }),
          }
        : session && progress
          ? {
              eyebrow: "СЛЕДУЮЩИЙ ШАГ",
              title: "Добавьте новые слова в учебный цикл",
              description: "Откройте короткий блок знакомства; ответы будут показаны сразу и не исказят active recall.",
              label: "Начать изучение",
              action: () => void startLesson(session, { source: "mixed", size: 15, mode: "study", journeyIntent: "home_next_action" }),
            }
          : {
              eyebrow: progressPending && session ? "СИНХРОНИЗИРУЕМ ПЛАН" : "ПЕРВЫЙ ШАГ",
              title: session ? "Настройте урок под текущую задачу" : "Соберите первый учебный блок",
              description: session ? "Пока очередь загружается, можно выбрать режим, раздел и размер урока." : "Выберите формат обучения и посмотрите состав до регистрации и запуска.",
              label: "Настроить урок",
              action: () => navigate({ view: "learn" }, false, { intent: "home_next_action" }),
            };

    return (
      <>
        <section className="lx-home-next-action" aria-label="Следующее рекомендуемое действие">
          <article className="lx-hero-card">
            <div className="lx-home-next-action-copy">
              <span>{nextAction.eyebrow}</span>
              <h1>{nextAction.title}</h1>
              <p>{nextAction.description}</p>
              <button className="lx-button primary large" type="button" data-journey-intent="home_next_action" onClick={nextAction.action}>
                <Icon name={activeLesson ? "play" : dueNow > 0 ? "repeat" : "learn"} />
                {nextAction.label}
              </button>
            </div>
            <div className="lx-hero-art" aria-hidden="true">
              <div className="lx-word-preview">
                <span>{WORD_PREVIEW.phonetic}</span>
                <strong>{WORD_PREVIEW.prompt}</strong>
                <p>{WORD_PREVIEW.answer}</p>
                <small>{WORD_PREVIEW.example}</small>
              </div>
            </div>
          </article>
          <aside className="lx-progress-panel" aria-label="Краткий прогресс">
            <div className="lx-panel-heading"><div><span>Учебный статус</span><strong>{progress ? `${progress.reviewsToday} из ${progress.dailyGoal}` : progressPending ? "Загружаем…" : "Недоступно"}</strong></div><Icon name="chart" /></div>
            {progress ? (
              <>
                <div className="lx-progress-ring" role="progressbar" aria-label="Выполнение дневной цели" aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalizeProgressValue(goalPercent(progress))} aria-valuetext={`${progress.reviewsToday} из ${progress.dailyGoal} ответов`}><span>{goalPercent(progress)}%</span></div>
                <div className="lx-progress-list"><div><span>К повторению</span><strong>{progress.dueNow}</strong></div><div><span>Retained за неделю</span><strong>{progress.retainedItemsWeek}</strong></div><div><span>Серия</span><strong>{progress.currentStreak} дн.</strong></div></div>
              </>
            ) : (
              <AsyncStatePanel label={progressPending ? "Загрузка краткого прогресса" : "Краткий прогресс недоступен"} kind={progressPending ? "loading" : "error"} title={progressPending ? "Синхронизируем очередь" : progressStatus.problem?.title ?? "Прогресс недоступен"} message={progressStatus.problem?.message ?? "Получаем due-очередь и дневную цель."} reference={progressStatus.problem?.correlationId} actionLabel={progressStatus.problem?.retryable ? "Повторить" : undefined} onAction={progressStatus.problem?.retryable && session ? () => void loadProgressResource(session) : undefined} compact focusResult={false} />
            )}
            <button className="lx-button ghost" type="button" onClick={() => navigate({ view: "progress" }, false, { intent: "in_app_navigation" })}>Открыть прогресс</button>
          </aside>
        </section>

        <section className="lx-home-paths" aria-label="Назначение основных разделов">
          <article><span>Обучение</span><h2>Настройте урок</h2><p>Режим, раздел, размер и предварительный состав находятся в одном composer.</p><button className="lx-button ghost" type="button" data-journey-intent="home_configure_lesson" onClick={() => navigate({ view: "learn" }, false, { intent: "home_configure_lesson" })}>Настроить урок</button></article>
          <article><span>Словарь</span><h2>Найдите материал</h2><p>Ищите слова, термины и рабочие фразы, открывайте карточки и сохраняйте контекст.</p><button className="lx-button ghost" type="button" data-journey-intent="home_find_material" onClick={() => navigate({ view: "library" }, false, { intent: "home_find_material" })}>Найти материал</button></article>
          <article><span>Прогресс</span><h2>Проверьте результат</h2><p>Due-очередь, retained items, объективная успешность и дневная цель собраны отдельно.</p><button className="lx-button ghost" type="button" onClick={() => navigate({ view: "progress" }, false, { intent: "in_app_navigation" })}>Посмотреть результат</button></article>
        </section>
      </>
    );
  }

'''
replace_between(
    "frontend/components/lexigo-premium-app.tsx",
    "  function renderHome() {",
    "  function renderLearn() {",
    home,
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '  function renderLearn() {\n',
    '  function selectLessonSource(nextSource: LessonSource) {\n    setSource(nextSource);\n    setLessonTopic("");\n  }\n\n  function renderLearn() {\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '<div><span>ОБУЧЕНИЕ</span><h1>Настройте урок под текущую задачу</h1><p>Для спокойного знакомства выберите простое изучение. Для проверки знаний — active recall или варианты.</p></div>',
    '<div><span>ОБУЧЕНИЕ</span><h1>Соберите один сфокусированный урок</h1><p>Здесь находятся только параметры учебной сессии: режим, раздел, размер и предварительный состав.</p></div>',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '        {renderResumeStrip()}\n        <section className="lx-setup-card">\n',
    '        {renderResumeStrip()}\n        {lessonTopic ? <section className="lx-composer-context" aria-label="Контекст из каталога"><div><span>Перенесено из словаря</span><strong>{sourceLabel(source)} · {lessonTopic}</strong><small>Раздел и тема уже выбраны; повторная настройка не требуется.</small></div><button className="lx-button ghost" type="button" onClick={() => { setLessonTopic(""); navigate({ view: "learn", source }, true, { intent: "in_app_navigation" }); }}>Очистить тему</button></section> : null}\n        <section className="lx-setup-card">\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'onClick={() => setSource(option.value)} onKeyDown={(event) => selectRovingControl(event, SOURCE_VALUES, option.value, setSource)}',
    'onClick={() => selectLessonSource(option.value)} onKeyDown={(event) => selectRovingControl(event, SOURCE_VALUES, option.value, selectLessonSource)}',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'onKeyDown: (event) => selectRovingControl(event, SOURCE_VALUES, definition.source, setSource),',
    'onKeyDown: (event) => selectRovingControl(event, SOURCE_VALUES, definition.source, selectLessonSource),',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'onSelect={() => setSource(definition.source)}',
    'onSelect={() => selectLessonSource(definition.source)}',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'onClick={() => startLesson()}><Icon name="play"/>',
    'onClick={() => startLesson(session, { topic: lessonTopic, journeyIntent: "lesson_start" })}><Icon name="play"/>',
)

# Remove the direct single-phrase lesson helper; catalog actions now configure.
replace_between(
    "frontend/components/lexigo-premium-app.tsx",
    "  function startSelectedPhraseLesson() {",
    "  function openPhraseDetail(phrase: LearningItem) {",
    "",
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    navigate({ view: "phrases", detail: itemKey(phrase) });\n',
    '    navigate({ view: "phrases", detail: itemKey(phrase) }, false, { intent: "catalog_open_detail" });\n',
)

phrases = '''  function renderPhrases() {
    const openCatalog = (kind: "words" | "phrases") => {
      if (kind === "words") navigate({ view: "library" }, false, { intent: "catalog_switch" });
    };
    if (selectedPhrase) {
      return (
        <>
          <CatalogKindNavigation active="phrases" onSelect={openCatalog} />
          <section className="lx-detail-card">
            <button className="lx-button ghost" type="button" onClick={backToPhraseCatalog}>← Все фразы</button>
            <div className="lx-detail-content">
              <span lang="en">{selectedPhrase.topic}</span>
              <div className="lx-detail-speech-row">
                <h1 lang="en">{selectedPhrase.prompt}</h1>
                <SpeechPlayerButton text={selectedPhrase.prompt}><Icon name="volume" /></SpeechPlayerButton>
              </div>
              <strong lang="ru">{selectedPhrase.answer}</strong>
              {selectedPhrase.cloze ? <div><small>Cloze practice</small><p lang="en">{selectedPhrase.cloze}</p></div> : null}
              {selectedPhrase.examples[0] ? <div><small>Рабочий пример</small><p lang="en">{selectedPhrase.examples[0]}</p></div> : null}
              {selectedPhrase.note ? <div><small>Как использовать</small><p>{selectedPhrase.note}</p></div> : null}
              <div className="lx-page-actions"><button className="lx-button primary" type="button" onClick={() => navigate({ view: "learn", source: "phrases", topic: selectedPhrase.topic }, false, { intent: "catalog_configure_lesson" })}>Настроить урок по этой теме</button><small>Тип материала и тема будут перенесены в «Обучение».</small></div>
            </div>
          </section>
        </>
      );
    }
    const phrasesPending = Boolean(session && (phraseCatalogStatus.phase === "idle" || phraseCatalogStatus.phase === "loading"));
    const phrasePageInfo = activePhrasePageInfo;
    return (
      <>
        <CatalogKindNavigation active="phrases" onSelect={openCatalog} />
        <section className="lx-page-heading"><div><span>РАБОЧИЕ ФРАЗЫ</span><h1>Находите готовые формулировки</h1><p>Поиск и просмотр incident updates, architecture review, data engineering, performance и release communication. Настройка учебной сессии находится в «Обучении».</p></div><div className="lx-heading-badge"><Icon name="phrases"/><span>{progress ? `${progress.duePhrases} фраз готовы к повторению` : progressStatus.phase === "loading" || progressStatus.phase === "idle" ? "Загружаем очередь…" : "Очередь недоступна"}</span></div></section>
        <div className="lx-topic-filter" role="radiogroup" aria-label="Тема фраз" aria-orientation="horizontal">{phraseTopics.map((topic) => {
          const selected = phraseTopic === topic;
          return <button key={topic} type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} className={selected ? "selected" : ""} lang={topic === "all" ? "ru" : "en"} onClick={() => { setPhraseTopic(topic); setPhrasePage(1); }} onKeyDown={(event) => selectRovingControl(event, phraseTopics, topic, (next) => { setPhraseTopic(next); setPhrasePage(1); }, "horizontal")}>{topic === "all" ? "Все темы" : topic}</button>;
        })}</div>
        <CatalogSearchForm value={phraseSearchInput} onChange={setPhraseSearchInput} onSubmit={applyPhraseSearch} onClear={clearPhraseSearch} label="Поиск по каталогу фраз" />
        <CatalogSortControl kind="phrases" mode={phraseSortMode} onChange={(mode) => { updateCatalogSort("phrases", mode); setPhrasePage(1); }} />
        {session && phraseCatalogStatus.phase === "error" && phraseCatalogStatus.problem ? <AsyncStatePanel label="Каталог фраз недоступен" kind="error" title={phraseCatalogStatus.problem.title} message={phraseCatalogStatus.problem.message} reference={phraseCatalogStatus.problem.correlationId} actionLabel={phraseCatalogStatus.problem.retryable ? "Повторить" : undefined} onAction={phraseCatalogStatus.problem.retryable ? () => void loadPhraseCatalogResource(session, { page: phrasePage, topic: phraseTopic, query: phraseSearch, sort: phraseSortMode }) : undefined} /> : null}
        {phrasesPending && sortedVisiblePhrases.length === 0 ? <AsyncSkeletonGrid label="Загружаем каталог фраз" /> : null}
        {!phrasesPending && sortedVisiblePhrases.length === 0 ? <AsyncStatePanel label="Каталог фраз пуст" kind="empty" title="По заданным условиям фразы не найдены" message="Сбросьте поиск или выберите другую тему." actionLabel="Сбросить фильтры" onAction={() => { setPhraseTopic("all"); clearPhraseSearch(); }} /> : null}
        <CatalogPagination info={phrasePageInfo} busy={phrasesPending} onPageChange={changePhrasePage} />
        <section id="phrase-catalog-results" className="lx-phrase-grid" role="list" aria-label="Результаты каталога фраз" aria-busy={phrasesPending}>{sortedVisiblePhrases.map((phrase, index) => <div key={itemKey(phrase)} role="listitem" aria-posinset={(phrasePageInfo.page - 1) * phrasePageInfo.pageSize + index + 1} aria-setsize={phrasePageInfo.total}><button type="button" onClick={() => openPhraseDetail(phrase)}><span lang="en">{phrase.topic}</span><strong lang="en">{phrase.prompt}</strong><small lang="ru">{phrase.answer}</small><em>Открыть карточку <Icon name="arrow" size={15}/></em></button></div>)}</section>
        <CatalogPagination info={phrasePageInfo} busy={phrasesPending} onPageChange={changePhrasePage} label="Навигация под списком фраз" />
        <div className="lx-page-actions"><button className="lx-button primary" type="button" disabled={phrasePageInfo.total === 0} onClick={() => navigate({ view: "learn", source: "phrases", ...(phraseTopic !== "all" ? { topic: phraseTopic } : {}) }, false, { intent: "catalog_configure_lesson" })}>Настроить урок по текущей теме</button><small>Фразы остаются каталогом; режим и размер выбираются на следующем экране.</small></div>
      </>
    );
  }

'''
replace_between(
    "frontend/components/lexigo-premium-app.tsx",
    "  function renderPhrases() {",
    "  function renderLibrary() {",
    phrases,
)

library = '''  function renderLibrary() {
    const dictionarySource: LessonSource = navigation.source && navigation.source !== "phrases"
      ? navigation.source
      : "mixed";
    return (
      <DictionaryCatalog
        authenticated={Boolean(session)}
        navigation={navigation}
        metadata={catalogMetadata}
        metadataStatus={catalogMetadataStatus}
        progress={progress}
        loadPage={loadDictionaryPage}
        loadDetail={loadDictionaryDetail}
        onNavigate={(target, replace, scroll, intent) => navigate(target, replace, { scroll, intent })}
        onBackToResults={() => {
          const destination = navigationTabs.destination("library");
          const target = { ...navigation };
          delete target.detail;
          navigate(target, true, { scroll: destination.target.detail ? { x: 0, y: 0 } : destination.scroll, intent: "in_app_navigation" });
        }}
        onConfigureLesson={({ source: selectedSource, topic }) => {
          navigate({ view: "learn", source: selectedSource || dictionarySource, ...(topic ? { topic } : {}) }, false, { intent: "catalog_configure_lesson" });
        }}
        onRequireAuthentication={() => requestAuthentication("library")}
      />
    );
  }

'''
replace_between(
    "frontend/components/lexigo-premium-app.tsx",
    "  function renderLibrary() {",
    "  function renderProgress() {",
    library,
)

# Existing navigation e2e expectations now reflect four top-level destinations.
adaptive = read("frontend/e2e/adaptive-navigation.spec.ts")
adaptive = adaptive.replace("expect(sizes).toHaveLength(5);", "expect(sizes).toHaveLength(4);")
adaptive = adaptive.replace('  await expect(headerNavigation.getByText("Фразы", { exact: true })).toBeVisible();\n', "")
adaptive = adaptive.replace("/Продолжайте учиться/", "/готовы к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок/", 2)
# Phrases are no longer a primary tab, so route restoration is verified through
# the Dictionary tab while canonical /phrases remains independently reachable.
adaptive = adaptive.replace('  await clickNavigationView(page, "phrases");\n  await expect(page).toHaveURL(/\\/phrases$/);\n', '  await page.getByRole("button", { name: "Рабочие фразы" }).click();\n  await expect(page).toHaveURL(/\\/phrases$/);\n', 1)
write("frontend/e2e/adaptive-navigation.spec.ts", adaptive)

# Product-level e2e tasks are automated proxies for the moderated protocol.
write("frontend/e2e/information-architecture.spec.ts", '''import { expect, test } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ context, page }) => {
  await installDeterministicRuntime(page);
  await installQualityGateAPI(context);
});

test("Home exposes one dominant next action and three unambiguous destinations", async ({ page }) => {
  const runtimeErrors = captureRuntimeErrors(page);
  await page.goto("/");

  const nextAction = page.getByRole("region", { name: "Следующее рекомендуемое действие" });
  await expect(nextAction.getByRole("button", { name: "Повторить сейчас" })).toBeVisible();
  await expect(nextAction.locator(".lx-button.primary")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Назначение основных разделов" })).toContainText("Настройте урок");
  await expect(page.getByRole("region", { name: "Назначение основных разделов" })).toContainText("Найдите материал");
  await expect(page.getByRole("region", { name: "Назначение основных разделов" })).toContainText("Проверьте результат");

  const primaryLinks = page.locator('.lx-route-nav--header [data-navigation-view], .lx-route-nav--rail [data-navigation-view], .lx-route-nav--mobile [data-navigation-view]');
  await expect(primaryLinks.first()).toBeAttached();
  expect(await primaryLinks.evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("data-navigation-view")))].sort())).toEqual(["home", "learn", "library", "progress"]);
  expect(runtimeErrors).toEqual([]);
});

test("a new user can find a word without entering a duplicate lesson setup", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Найти материал" }).click();
  await expect(page).toHaveURL(/\\/dictionary$/);
  await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();

  await page.getByRole("searchbox", { name: "Поиск по словарю" }).fill("rollback");
  await page.getByRole("button", { name: "Найти" }).click();
  await page.getByRole("button", { name: "Открыть карточку: rollback" }).click();
  await expect(page).toHaveURL(/\\/word\\/101/);
  await expect(page.getByRole("heading", { name: "rollback" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Изучить это слово|Повторить это слово/ })).toHaveCount(0);

  await page.getByRole("button", { name: "Настроить урок по этой теме" }).click();
  await expect(page).toHaveURL(/\\/learn\\?source=mixed&topic=Release|\\/learn\\?topic=Release&source=mixed/);
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Контекст из каталога" })).toContainText("Release");
});

test("phrases are a dictionary catalog kind rather than a competing top-level section", async ({ page }) => {
  await page.goto("/dictionary");
  const switcher = page.getByRole("navigation", { name: "Тип каталога" });
  await expect(switcher.getByRole("button", { name: "Слова и термины" })).toHaveAttribute("aria-current", "page");
  await switcher.getByRole("button", { name: "Рабочие фразы" }).click();
  await expect(page).toHaveURL(/\\/phrases$/);
  await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Тип каталога" }).getByRole("button", { name: "Рабочие фразы" })).toHaveAttribute("aria-current", "page");
});

test("catalog context reaches the composer and analytics sends only allow-listed dimensions", async ({ context, page }) => {
  let payload: Record<string, unknown> | null = null;
  await context.route("**/api/v1/product/journey", async (route) => {
    payload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 202, body: "" });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Найти материал" }).click();
  await expect.poll(() => payload).not.toBeNull();
  expect(payload).toMatchObject({
    fromRoute: "/",
    toRoute: "/dictionary",
    intent: "home_find_material",
    backtrack: false,
  });
  expect(payload).not.toHaveProperty("userId");
  expect(payload).not.toHaveProperty("sessionId");
  expect(payload).not.toHaveProperty("query");
  expect(payload).not.toHaveProperty("url");
});
''')

print("Issue #61 deterministic patch applied")
