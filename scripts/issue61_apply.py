from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    if content.count(old) != 1:
        raise RuntimeError(f"{path}: expected one exact match, found {content.count(old)} for {old[:100]!r}")
    write(path, content.replace(old, new, 1))


def sub_once(path: str, pattern: str, replacement: str, *, flags: int = 0) -> None:
    content = read(path)
    updated, count = re.subn(pattern, replacement, content, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f"{path}: expected one regex match, found {count} for {pattern[:100]!r}")
    write(path, updated)


# Frontend route chrome and top-level information architecture.
replace_once(
    "frontend/app/layout.tsx",
    'import "./dictionary-catalog.css";\n',
    'import "./dictionary-catalog.css";\nimport "./information-architecture.css";\n',
)

sub_once(
    "frontend/lib/navigation.ts",
    r'^\s*\{ view: "phrases", label: "Фразы", shortLabel: "Фразы" \},\n',
    "",
    flags=re.MULTILINE,
)

replace_once(
    "frontend/lib/navigation-tabs.ts",
    'export type PrimaryNavigationView = Exclude<AppView, "profile" | "lesson">;',
    'export type PrimaryNavigationView = Extract<AppView, "home" | "learn" | "library" | "progress">;',
)
sub_once(
    "frontend/lib/navigation-tabs.ts",
    r'^\s*"phrases",\n',
    "",
    flags=re.MULTILINE,
)

replace_once(
    "frontend/lib/route-tab-snapshots.ts",
    'export type PrimaryRouteView = Extract<AppView, "home" | "learn" | "phrases" | "library" | "progress">;',
    'export type PrimaryRouteView = Extract<AppView, "home" | "learn" | "library" | "progress">;',
)
sub_once(
    "frontend/lib/route-tab-snapshots.ts",
    r'^\s*"phrases",\n',
    "",
    flags=re.MULTILINE,
)

replace_once(
    "frontend/components/route-primary-navigation.tsx",
    'import { createNavigationHistoryState } from "../lib/navigation-history";\n',
    'import { createNavigationHistoryState } from "../lib/navigation-history";\nimport { queueProductJourneyIntent } from "../lib/product-journey";\n',
)
replace_once(
    "frontend/components/route-primary-navigation.tsx",
    'type RouteIconName = "home" | "learn" | "phrases" | "library" | "progress";',
    'type RouteIconName = "home" | "learn" | "library" | "progress";',
)
sub_once(
    "frontend/components/route-primary-navigation.tsx",
    r'^\s*"phrases",\n',
    "",
    flags=re.MULTILINE,
)
sub_once(
    "frontend/components/route-primary-navigation.tsx",
    r'^\s*if \(name === "phrases"\) return <svg.*?;</svg>;\n',
    "",
    flags=re.MULTILINE,
)
replace_once(
    "frontend/components/route-primary-navigation.tsx",
    '        event.preventDefault();\n        pushRoute(target);',
    '        event.preventDefault();\n        queueProductJourneyIntent(navigationView ? "primary_navigation" : "in_app_navigation");\n        pushRoute(target);',
)

# Dictionary becomes browse-only and delegates lesson composition to /learn.
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    'import { CatalogPagination, CatalogSearchForm } from "./catalog-pagination";\n',
    'import { CatalogKindNavigation } from "./catalog-kind-navigation";\nimport { CatalogPagination, CatalogSearchForm } from "./catalog-pagination";\n',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '  onStartLesson: (items: LearningItem[], mode: "study" | "recall") => void;\n  onRequireAuthentication: () => void;',
    '  onConfigureLesson: (context: { source: DictionarySource; topic?: string }) => void;\n  onOpenPhrases: () => void;\n  onRequireAuthentication: () => void;',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '  onStartLesson,\n  onRequireAuthentication,',
    '  onConfigureLesson,\n  onOpenPhrases,\n  onRequireAuthentication,',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    'Ищите слова по английскому написанию, переводу и синонимам, затем открывайте карточку или запускайте урок.',
    'Ищите слова по английскому написанию, переводу и синонимам, затем открывайте карточку с примерами и контекстом.',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '<button className="lx-button primary" type="button" onClick={() => onStartLesson([selectedItem], selectedItem.status === "new" ? "study" : "recall")}>\n                {selectedItem.status === "new" ? "Изучить это слово" : "Повторить это слово"}\n              </button>',
    '<button className="lx-button primary" type="button" onClick={() => onConfigureLesson({ source: filters.source, topic: selectedItem.topic })}>\n                Настроить урок с этим словом\n              </button>',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '    <>\n      <section className="lx-page-heading">',
    '    <>\n      <CatalogKindNavigation active="words" onSelect={() => onOpenPhrases()} />\n      <section className="lx-page-heading">',
)
replace_once(
    "frontend/components/dictionary-catalog.tsx",
    '<button className="lx-button primary" type="button" disabled={pending || items.length === 0} onClick={() => onStartLesson(items, filters.status === "review" || filters.status === "mastered" ? "recall" : "study")}>\n          {filters.status === "review" || filters.status === "mastered" ? "Повторить текущую страницу" : "Изучить текущую страницу"}\n        </button>\n        <small>В урок попадут только показанные {items.length.toLocaleString("ru-RU")} элементов; весь каталог не загружается.</small>',
    '<button className="lx-button primary" type="button" disabled={pending || items.length === 0} onClick={() => onConfigureLesson({ source: filters.source, ...(filters.topic ? { topic: filters.topic } : {}) })}>\n          Настроить урок по текущей выборке\n        </button>\n        <small>Раздел и тема будут перенесены в composer; каталог останется доступен как справочник.</small>',
)

# Product journey instrumentation and focused screen responsibilities.
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'import { createScrollSnapshotScheduler } from "../lib/navigation-scroll-snapshot";\n',
    'import { createScrollSnapshotScheduler } from "../lib/navigation-scroll-snapshot";\nimport {\n  consumeProductJourneyIntent,\n  reportProductJourney,\n  type ProductJourneyIntent,\n} from "../lib/product-journey";\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'import { CalendarReminderIntegration } from "./calendar-reminder-integration";\n',
    'import { CalendarReminderIntegration } from "./calendar-reminder-integration";\nimport { CatalogKindNavigation } from "./catalog-kind-navigation";\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'type NavigationRequestOptions = {\n  scroll?: NavigationScrollPosition;\n  allowLessonExit?: boolean;\n};',
    'type NavigationRequestOptions = {\n  scroll?: NavigationScrollPosition;\n  allowLessonExit?: boolean;\n  intent?: ProductJourneyIntent;\n};',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '  catalogQuery?: CatalogBrowseQuery;\n};',
    '  catalogQuery?: CatalogBrowseQuery;\n  intent?: ProductJourneyIntent;\n};',
)
sub_once(
    "frontend/components/lexigo-premium-app.tsx",
    r'\nconst WORD_PREVIEW = \{.*?\n\};\n',
    "\n",
    flags=re.DOTALL,
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '      setPendingNavigation({\n        identity: navigationIdentity(next),\n        scroll,\n        behavior: "auto",\n      });\n      applyNavigation(next, scroll);',
    '      reportProductJourney(current, next, consumeProductJourneyIntent() ?? "browser_history");\n      setPendingNavigation({\n        identity: navigationIdentity(next),\n        scroll,\n        behavior: "auto",\n      });\n      applyNavigation(next, scroll);',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '      void authorizedRequest<LessonPreviewResponse>(session, "/api/v1/lessons/preview", {\n        method: "POST",\n        body: JSON.stringify({ source, studyMode, lessonSize: String(lessonSize) }),\n      }).then((result) => {',
    '      const topic = navigation.topic?.trim() ?? "";\n      void authorizedRequest<LessonPreviewResponse>(session, "/api/v1/lessons/preview", {\n        method: "POST",\n        body: JSON.stringify({ source, studyMode, lessonSize: String(lessonSize), ...(topic ? { topic } : {}) }),\n      }).then((result) => {',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '  }, [navigation.view, session, source, studyMode, lessonSize]);',
    '  }, [navigation.topic, navigation.view, session, source, studyMode, lessonSize]);',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    const url = navigationURL(target);\n',
    '    reportProductJourney(navigation, target, options.intent ?? "in_app_navigation");\n    const url = navigationURL(target);\n',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    navigate(destination.target, false, { scroll: destination.scroll });',
    '    navigate(destination.target, false, { scroll: destination.scroll, intent: "primary_navigation" });',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    navigate({ view: "profile" });',
    '    navigate({ view: "profile" }, false, { intent: "authentication" });',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    const resolvedTopic = overrides.topic?.trim() ?? "";',
    '    const resolvedTopic = overrides.topic?.trim() ?? navigation.topic?.trim() ?? "";',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'navigate({ view: "lesson", source: resolvedSource });',
    'navigate({ view: "lesson", source: resolvedSource }, false, { intent: overrides.intent ?? "lesson_start" });',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    navigate({ view: target }, true, { allowLessonExit: true });',
    '    navigate({ view: target }, true, { allowLessonExit: true, intent: "lesson_exit" });',
)

new_home = r'''  function renderHome() {
    const progressPending = Boolean(session && (progressStatus.phase === "idle" || progressStatus.phase === "loading"));
    const dueNow = !session ? "—" : progress ? progress.dueNow : progressPending ? "…" : "—";
    const retained = !session ? "—" : progress ? progress.retainedItemsWeek : progressPending ? "…" : "—";
    const dailyPercent = goalPercent(progress);
    const progressPanelStatus = !session
      ? "Войдите для персональной статистики"
      : progress
        ? "Актуальные данные аккаунта"
        : progressPending
          ? "Загружаем данные аккаунта…"
          : "Статистика временно недоступна";
    const overallProgressLabel = !session
      ? "—"
      : !progress
        ? progressPending ? "…" : "—"
        : catalogMetadataStatus === "loading"
          ? "…"
          : catalogMetadata
            ? `${overallPercent}%`
            : "—";
    const recommendedTitle = activeLesson
      ? "Продолжите незавершённый урок"
      : session && progress && progress.dueNow > 0
        ? "Закрепите материал из due-очереди"
        : session
          ? "Соберите следующий учебный блок"
          : "Начните с короткого учебного блока";
    const recommendedDescription = activeLesson
      ? `${sourceLabel(activeLesson.source)} · позиция ${activeLesson.currentIndex + 1} из ${activeLesson.items.length}.`
      : session && progress && progress.dueNow > 0
        ? `${progress.dueWords} слов и ${progress.duePhrases} фраз готовы к повторению.`
        : "Режим, материал и размер выбираются на одном экране без дублирующих настроек.";
    const recommendedLabel = activeLesson
      ? "Продолжить урок"
      : session && progress && progress.dueNow > 0
        ? "Начать повторение"
        : "Настроить урок";
    const recommendedAction = activeLesson
      ? resumeLesson
      : session && progress && progress.dueNow > 0
        ? () => startLesson(session, { mode: "recall", source: "mixed", size: 15, intent: "home_next_action" })
        : () => navigate({ view: "learn" }, false, { intent: "home_next_action" });

    return (
      <>
        <section className="lx-home-next-action">
          <article className="lx-hero-card">
            <div className="lx-home-next-action-copy">
              <span className="lx-kicker">СЛЕДУЮЩЕЕ ДЕЙСТВИЕ</span>
              <h1>{recommendedTitle}</h1>
              <p>{recommendedDescription}</p>
              <button className="lx-button primary large" type="button" disabled={busy} onClick={recommendedAction}>
                <Icon name="play" />
                {recommendedLabel}
              </button>
            </div>
            <div className="lx-hero-art" aria-hidden="true">
              <div className="lx-orbit orbit-one" />
              <div className="lx-orbit orbit-two" />
              <div className="lx-floating-card"><span>Aa</span><i>★</i></div>
              <div className="lx-book-base"><span/><span/><span/></div>
              <div className="lx-glow" />
            </div>
          </article>

          <article className="lx-progress-panel">
            <div className="lx-panel-heading">
              <div><span>Ваш прогресс</span><small>{progressPanelStatus}</small></div>
              <button type="button" onClick={() => navigate({ view: "progress" })}>Подробнее <Icon name="arrow" size={16}/></button>
            </div>
            <div className="lx-progress-stats">
              <button type="button" onClick={() => navigate({ view: "learn" })}>
                <span>К повторению</span><strong className="purple">{dueNow}</strong><small>{progress ? `${progress.dueWords} слов · ${progress.duePhrases} фраз` : "Учебная очередь"}</small>
              </button>
              <button type="button" onClick={() => navigate({ view: "progress" })}>
                <span>Серия дней</span><strong className="orange">{progress ? progress.currentStreak : progressPending ? "…" : "—"}</strong><small>{progress ? `Рекорд ${progress.longestStreak}` : "История занятий"}</small>
              </button>
              <button type="button" onClick={() => navigate({ view: "progress" })}>
                <span>Сохранено за неделю</span><strong className="blue">{retained}</strong><small>Retained items</small>
              </button>
              <button type="button" className="lx-ring-stat" onClick={() => navigate({ view: "library" })}>
                <span>Общий прогресс</span>
                <div
                  className="lx-progress-ring"
                  role="progressbar"
                  aria-label="Общий прогресс каталога"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={normalizeProgressValue(progress && catalogMetadata ? overallPercent : 0)}
                  aria-valuetext={progress && catalogMetadata
                    ? `${progress.masteredWords + progress.masteredPhrases} из ${catalogMetadata.totals.items} элементов, ${overallPercent}%`
                    : progressPanelStatus}
                  style={{ "--progress": `${progress && catalogMetadata ? overallPercent : 0}%` } as React.CSSProperties}
                ><strong>{overallProgressLabel}</strong></div>
                <small>Освоенные элементы</small>
              </button>
            </div>
            <div className="lx-goal-row">
              <div><span>Цель на сегодня</span><strong>{session && progress ? `${progress.reviewsToday} / ${progress.dailyGoal}` : "Войдите в аккаунт"}</strong></div>
              <div className="lx-goal-track" role="progressbar" aria-label="Дневная цель на главной" aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalizeProgressValue(dailyPercent)}><span style={{ width: `${dailyPercent}%` }}/></div>
              <b>{session && progress ? `${dailyPercent}%` : "—"}</b>
            </div>
          </article>
        </section>

        {renderResumeStrip()}

        <section className="lx-home-paths" aria-label="Основные разделы продукта">
          <article>
            <span>Обучение</span>
            <h2>Настройте учебный блок</h2>
            <p>Выберите режим, материал и размер. Только этот экран формирует новый урок.</p>
            <button className="lx-button ghost" type="button" onClick={() => navigate({ view: "learn" }, false, { intent: "home_configure_lesson" })}>Открыть composer</button>
          </article>
          <article>
            <span>Словарь</span>
            <h2>Найдите нужный материал</h2>
            <p>Просматривайте слова, термины и рабочие фразы без смешивания с настройкой урока.</p>
            <button className="lx-button ghost" type="button" onClick={() => navigate({ view: "library" }, false, { intent: "home_find_material" })}>Открыть словарь</button>
          </article>
          <article>
            <span>Прогресс</span>
            <h2>Проверьте результат</h2>
            <p>Due-очередь, дневная цель, retained items и объективная успешность собраны в одном месте.</p>
            <button className="lx-button ghost" type="button" onClick={() => navigate({ view: "progress" })}>Открыть прогресс</button>
          </article>
        </section>
      </>
    );
  }

'''
sub_once(
    "frontend/components/lexigo-premium-app.tsx",
    r'  function renderHome\(\) \{.*?\n  function renderLearn\(\) \{',
    new_home + '  function renderLearn() {',
    flags=re.DOTALL,
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    return (\n      <>\n        <section className="lx-page-heading">\n          <div><span>ОБУЧЕНИЕ</span><h1>Настройте урок под текущую задачу</h1><p>Для спокойного знакомства выберите простое изучение. Для проверки знаний — active recall или варианты.</p></div>\n          <div className="lx-heading-badge"><Icon name="learn"/><span>{session && progress ? `${progress.dueNow} элементов готовы` : "Прогресс сохраняется после входа"}</span></div>\n        </section>\n        {renderResumeStrip()}',
    '    const contextLabel = navigation.topic\n      ? `${sourceLabel(source)} · ${navigation.topic}`\n      : navigation.source\n        ? sourceLabel(source)\n        : "";\n    return (\n      <>\n        <section className="lx-page-heading">\n          <div><span>ОБУЧЕНИЕ</span><h1>Настройте урок под текущую задачу</h1><p>Для спокойного знакомства выберите простое изучение. Для проверки знаний — active recall или варианты.</p></div>\n          <div className="lx-heading-badge"><Icon name="learn"/><span>{session && progress ? `${progress.dueNow} элементов готовы` : "Прогресс сохраняется после входа"}</span></div>\n        </section>\n        {contextLabel ? <section className="lx-composer-context" aria-label="Контекст из каталога"><div><span>Перенесено из словаря</span><strong>{contextLabel}</strong></div><button className="lx-button ghost" type="button" onClick={() => { setSource("mixed"); navigate({ view: "learn" }, true); }}>Сбросить контекст</button></section> : null}\n        {renderResumeStrip()}',
)

# Phrase catalog is a second browse mode, not a second lesson composer.
sub_once(
    "frontend/components/lexigo-premium-app.tsx",
    r'\n  function startSelectedPhraseLesson\(\) \{.*?\n  \}\n',
    "\n",
    flags=re.DOTALL,
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '<div className="lx-hero-actions"><button className="lx-button primary" type="button" onClick={startSelectedPhraseLesson}>Изучить эту фразу</button><button className="lx-button ghost" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "recall" })}>Повторить due-фразы</button></div>',
    '<div className="lx-hero-actions"><button className="lx-button primary" type="button" onClick={() => navigate({ view: "learn", source: "phrases", topic: selectedPhrase.topic }, false, { intent: "catalog_configure_lesson" })}>Настроить урок с этой фразой</button></div>',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '      <>\n        <section className="lx-page-heading"><div><span>ТЕХНИЧЕСКИЕ ФРАЗЫ</span>',
    '      <>\n        <CatalogKindNavigation active="phrases" onSelect={() => navigate({ view: "library" }, false, { intent: "catalog_switch" })} />\n        <section className="lx-page-heading"><div><span>ТЕХНИЧЕСКИЕ ФРАЗЫ</span>',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '<div className="lx-page-actions"><button className="lx-button ghost" type="button" disabled={phrasePageInfo.total === 0} onClick={() => startLesson(session, { source: "phrases", size: "all", mode: "all", catalogQuery: { topic: topicValue, query: phraseSearch, sort: phraseSortMode } })}>Посмотреть выбранные</button><button className="lx-button primary" type="button" disabled={phrasePageInfo.total === 0} onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "study", topic: topicValue, ...(phraseSearch ? { items: sortedVisiblePhrases } : {}) })}>Изучать выбранную тему</button></div>',
    '<div className="lx-page-actions"><button className="lx-button primary" type="button" disabled={phrasePageInfo.total === 0} onClick={() => navigate({ view: "learn", source: "phrases", ...(topicValue ? { topic: topicValue } : {}) }, false, { intent: "catalog_configure_lesson" })}>Настроить урок по выбранной теме</button><small>Тема будет перенесена в composer без повторного выбора.</small></div>',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '        onStartLesson={(selectedItems, mode) => {\n          void startLesson(session, { source: dictionarySource, size: 15, mode, items: selectedItems });\n        }}\n        onRequireAuthentication={() => requestAuthentication("library")}',
    '        onConfigureLesson={(context) => navigate({ view: "learn", source: context.source, ...(context.topic ? { topic: context.topic } : {}) }, false, { intent: "catalog_configure_lesson" })}\n        onOpenPhrases={() => navigate({ view: "phrases" }, false, { intent: "catalog_switch" })}\n        onRequireAuthentication={() => requestAuthentication("library")}',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '    const dictionarySource: LessonSource = navigation.source && navigation.source !== "phrases"\n      ? navigation.source\n      : "mixed";\n',
    '',
)

# Backend endpoint and storage contract.
replace_once(
    "backend/internal/performance/repository.go",
    'type Store interface {\n\tStoreReport(ctx context.Context, report Report) error\n}',
    'type Store interface {\n\tStoreReport(ctx context.Context, report Report) error\n\tStoreJourney(ctx context.Context, event JourneyEvent) error\n}',
)
replace_once(
    "backend/internal/performance/repository.go",
    '\treturn nil\n}\n',
    '\treturn nil\n}\n\nfunc (repository *Repository) StoreJourney(ctx context.Context, event JourneyEvent) error {\n\t_, err := repository.pool.Exec(ctx, `\n\t\tinsert into product_navigation_events (\n\t\t\tapp_version, from_route, to_route, intent, is_backtrack,\n\t\t\tdevice_class, browser_family, display_mode\n\t\t)\n\t\tvalues ($1, $2, $3, $4, $5, $6, $7, $8)\n\t`, event.AppVersion, event.FromRoute, event.ToRoute, event.Intent, event.Backtrack, event.DeviceClass, event.BrowserFamily, event.DisplayMode)\n\tif err != nil {\n\t\treturn fmt.Errorf("store product journey: %w", err)\n\t}\n\treturn nil\n}\n',
)
replace_once(
    "backend/internal/performance/http.go",
    '\tw.WriteHeader(http.StatusAccepted)\n}\n',
    '\tw.WriteHeader(http.StatusAccepted)\n}\n\nfunc (handler *Handler) Journey(w http.ResponseWriter, r *http.Request) {\n\tvar event JourneyEvent\n\tif err := httpx.DecodeJSONLimit(w, r, &event, MaxJourneyEventBytes); err != nil {\n\t\thttpx.WriteError(w, http.StatusBadRequest, "invalid_json", "request body must contain one valid product journey event")\n\t\treturn\n\t}\n\tif err := event.Validate(); err != nil {\n\t\tvar validationError *ValidationError\n\t\tif errors.As(err, &validationError) {\n\t\t\thttpx.WriteFieldError(w, http.StatusUnprocessableEntity, "invalid_product_journey", validationError.Message, validationError.Field)\n\t\t\treturn\n\t\t}\n\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_product_journey", "product journey event is invalid")\n\t\treturn\n\t}\n\tif err := handler.store.StoreJourney(r.Context(), event); err != nil {\n\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")\n\t\treturn\n\t}\n\n\tw.Header().Set("Cache-Control", "no-store")\n\tw.WriteHeader(http.StatusAccepted)\n}\n',
)
replace_once(
    "backend/internal/performance/http_test.go",
    'type recordingStore struct {\n\treports []Report\n\terr     error\n}',
    'type recordingStore struct {\n\treports    []Report\n\tjourneys   []JourneyEvent\n\terr        error\n\tjourneyErr error\n}',
)
replace_once(
    "backend/internal/performance/http_test.go",
    '\tstore.reports = append(store.reports, report)\n\treturn nil\n}\n',
    '\tstore.reports = append(store.reports, report)\n\treturn nil\n}\n\nfunc (store *recordingStore) StoreJourney(_ context.Context, event JourneyEvent) error {\n\tif store.journeyErr != nil {\n\t\treturn store.journeyErr\n\t}\n\tstore.journeys = append(store.journeys, event)\n\treturn nil\n}\n',
)
replace_once(
    "backend/internal/server/server.go",
    '\tmux.Handle("POST /api/v1/performance/rum", limiter.MiddlewareFailClosed("performance", 120, http.HandlerFunc(performanceHandler.Report)))\n',
    '\tmux.Handle("POST /api/v1/performance/rum", limiter.MiddlewareFailClosed("performance", 120, http.HandlerFunc(performanceHandler.Report)))\n\tmux.Handle("POST /api/v1/product/journey", limiter.MiddlewareFailClosed("product-journey", 120, http.HandlerFunc(performanceHandler.Journey)))\n',
)

# API contract.
replace_once("api/openapi.yaml", "  version: 0.10.0", "  version: 0.11.0")
journey_path = '''  /api/v1/product/journey:\n    post:\n      operationId: reportProductJourney\n      tags: [product]\n      summary: Принять анонимный переход между allow-listed разделами продукта.\n      description: Не принимает user ID, session ID, IP, raw URL, query, referrer, search text, email, cookie или raw User-Agent.\n      requestBody:\n        required: true\n        content:\n          application/json:\n            schema:\n              $ref: "#/components/schemas/ProductJourneyEvent"\n      responses:\n        "202":\n          description: Переход принят и сохранён.\n          headers:\n            Cache-Control:\n              schema: { type: string, const: no-store }\n        "400":\n          $ref: "#/components/responses/BadRequest"\n        "403":\n          $ref: "#/components/responses/Forbidden"\n        "422":\n          $ref: "#/components/responses/ValidationError"\n        "429":\n          $ref: "#/components/responses/TooManyRequests"\n        "500":\n          description: Внутренняя ошибка сохранения без раскрытия деталей инфраструктуры.\n          content:\n            application/json:\n              schema:\n                $ref: "#/components/schemas/Error"\n'''
replace_once("api/openapi.yaml", "  /api/v1/auth/register:\n", journey_path + "  /api/v1/auth/register:\n")
journey_schema = '''    ProductJourneyEvent:\n      type: object\n      additionalProperties: false\n      required: [appVersion, fromRoute, toRoute, intent, backtrack, deviceClass, browserFamily, displayMode]\n      properties:\n        appVersion:\n          type: string\n          minLength: 1\n          maxLength: 80\n          pattern: '^[A-Za-z0-9._-]+$'\n        fromRoute:\n          type: string\n          enum: [/, /learn, /dictionary, /phrases, /progress, /profile, /lesson, /word, /phrase]\n        toRoute:\n          type: string\n          enum: [/, /learn, /dictionary, /phrases, /progress, /profile, /lesson, /word, /phrase]\n        intent:\n          type: string\n          enum: [primary_navigation, home_next_action, home_configure_lesson, home_find_material, catalog_switch, catalog_open_detail, catalog_configure_lesson, lesson_start, lesson_exit, authentication, browser_history, in_app_navigation]\n        backtrack:\n          type: boolean\n        deviceClass:\n          type: string\n          enum: [mobile, tablet, desktop]\n        browserFamily:\n          type: string\n          enum: [chromium, webkit, firefox, other]\n        displayMode:\n          type: string\n          enum: [browser, standalone, fullscreen, minimal-ui, unknown]\n'''
replace_once("api/openapi.yaml", "    PerformanceRUMReport:\n", journey_schema + "    PerformanceRUMReport:\n")

# Deterministic browser mocks should accept best-effort telemetry without console noise.
replace_once(
    "frontend/e2e/support/quality-gates.ts",
    '    if (path === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, QUALITY_METADATA);',
    '    if (path === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, QUALITY_METADATA);\n    if (path === "/api/v1/product/journey") return route.fulfill({ status: 202, body: "" });',
)

print("Issue #61 deterministic patch applied")
