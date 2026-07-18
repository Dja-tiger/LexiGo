from pathlib import Path


COMPONENT = Path("frontend/components/lexigo-premium-app.tsx")
KEYBOARD_SPEC = Path("frontend/e2e/accessibility-keyboard.spec.ts")


def replace_once(content: str, old: str, new: str, label: str) -> str:
    if old not in content:
        raise SystemExit(f"{label}: expected block was not found")
    return content.replace(old, new, 1)


content = COMPONENT.read_text()

content = replace_once(
    content,
    'import { useCallback, useEffect, useMemo, useRef, useState } from "react";',
    'import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";',
    "React hook import",
)

content = replace_once(
    content,
    '''} from "../lib/navigation";
import {
  goalPercent,''',
    '''} from "../lib/navigation";
import {
  createNavigationHistoryState,
  navigationIdentity,
  navigationScrollBehavior,
  navigationScrollFromHistory,
  navigationTargetFromHistory,
  type NavigationScrollPosition,
} from "../lib/navigation-history";
import {
  goalPercent,''',
    "navigation history import",
)

content = replace_once(
    content,
    '''type CatalogKind = "phrases" | "all-items";

type CollectionDefinition = {''',
    '''type CatalogKind = "phrases" | "all-items";

type PendingNavigationFocus = {
  identity: string;
  scroll: NavigationScrollPosition;
  behavior: ScrollBehavior;
};

type CollectionDefinition = {''',
    "pending navigation type",
)

content = replace_once(
    content,
    '''  const [cardStartedAt, setCardStartedAt] = useState(0);
  const reviewInFlightRef = useRef(false);

  const loadCatalogMetadataResource''',
    '''  const [cardStartedAt, setCardStartedAt] = useState(0);
  const reviewInFlightRef = useRef(false);
  const mainContentRef = useRef<HTMLElement | null>(null);
  const lessonAdvanceRef = useRef<HTMLButtonElement | null>(null);
  const navigationRef = useRef(navigation);
  const pendingNavigationRef = useRef<PendingNavigationFocus | null>(null);
  const announcementCounterRef = useRef(0);
  const [routeAnnouncement, setRouteAnnouncement] = useState({ id: 0, message: "" });

  const loadCatalogMetadataResource''',
    "navigation refs",
)

content = replace_once(
    content,
    '''  useEffect(() => {
    const applyNavigation = (next: NavigationTarget) => {
      setNavigation(next);
      if (next.source) setSource(next.source);
      writeNavigationCache(window.localStorage, next);
    };
    const syncNavigationFromURL = () => applyNavigation(parseNavigation(window.location.search));

    const explicitNavigation = window.location.search.length > 0;
    const restored = !explicitNavigation && isStandaloneDisplayMode()
      ? readNavigationCache(window.localStorage)
      : null;
    if (restored) {
      window.history.replaceState({ lexigo: true, ...restored }, "", navigationURL(restored));
      applyNavigation(restored);
    } else {
      syncNavigationFromURL();
    }

    window.addEventListener("popstate", syncNavigationFromURL);
    return () => {
      window.removeEventListener("popstate", syncNavigationFromURL);
    };
  }, []);''',
    '''  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    let scrollFrame = 0;

    const applyNavigation = (next: NavigationTarget) => {
      navigationRef.current = next;
      setNavigation(next);
      if (next.source) setSource(next.source);
      writeNavigationCache(window.localStorage, next);
    };

    const persistCurrentEntry = () => {
      const current = navigationRef.current;
      window.history.replaceState(
        createNavigationHistoryState(current, { x: window.scrollX, y: window.scrollY }),
        "",
        window.location.href,
      );
    };

    const scheduleScrollSnapshot = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        persistCurrentEntry();
      });
    };

    const syncNavigationFromHistory = (event: PopStateEvent) => {
      const next = navigationTargetFromHistory(event.state, window.location.search);
      pendingNavigationRef.current = {
        identity: navigationIdentity(next),
        scroll: navigationScrollFromHistory(event.state),
        behavior: "auto",
      };
      applyNavigation(next);
    };

    const explicitNavigation = window.location.search.length > 0;
    const restored = !explicitNavigation && isStandaloneDisplayMode()
      ? readNavigationCache(window.localStorage)
      : null;
    const initial = restored
      ?? navigationTargetFromHistory(window.history.state, window.location.search);
    window.history.replaceState(
      createNavigationHistoryState(initial, { x: window.scrollX, y: window.scrollY }),
      "",
      restored ? navigationURL(restored) : window.location.href,
    );
    applyNavigation(initial);

    window.addEventListener("popstate", syncNavigationFromHistory);
    window.addEventListener("scroll", scheduleScrollSnapshot, { passive: true });
    return () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", syncNavigationFromHistory);
      window.removeEventListener("scroll", scheduleScrollSnapshot);
    };
  }, []);''',
    "history lifecycle",
)

content = replace_once(
    content,
    '''  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);

  const currentItem''',
    '''  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);

  useLayoutEffect(() => {
    const pending = pendingNavigationRef.current;
    if (!pending || pending.identity !== navigationIdentity(navigation)) return;
    pendingNavigationRef.current = null;

    const frame = window.requestAnimationFrame(() => {
      mainContentRef.current?.focus({ preventScroll: true });
      window.scrollTo({
        left: pending.scroll.x,
        top: pending.scroll.y,
        behavior: pending.behavior,
      });
      announcementCounterRef.current += 1;
      setRouteAnnouncement({
        id: announcementCounterRef.current,
        message: `${viewTitle(navigation.view)}. Экран загружен.`,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [navigation]);

  const currentItem''',
    "route focus effect",
)

content = replace_once(
    content,
    '''  function navigate(target: NavigationTarget, replace = false) {
    const url = navigationURL(target);
    if (replace) window.history.replaceState({ lexigo: true, ...target }, "", url);
    else window.history.pushState({ lexigo: true, ...target }, "", url);
    setNavigation(target);
    if (target.source) setSource(target.source);
    writeNavigationCache(window.localStorage, target);
    setError("");
    if (target.view !== "lesson") setLessonQueueNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function requestAuthentication''',
    '''  function navigate(target: NavigationTarget, replace = false) {
    const url = navigationURL(target);
    window.history.replaceState(
      createNavigationHistoryState(navigationRef.current, { x: window.scrollX, y: window.scrollY }),
      "",
      window.location.href,
    );

    const nextState = createNavigationHistoryState(target, { x: 0, y: 0 });
    if (replace) window.history.replaceState(nextState, "", url);
    else window.history.pushState(nextState, "", url);

    pendingNavigationRef.current = {
      identity: navigationIdentity(target),
      scroll: { x: 0, y: 0 },
      behavior: navigationScrollBehavior(window),
    };
    navigationRef.current = target;
    setNavigation(target);
    if (target.source) setSource(target.source);
    writeNavigationCache(window.localStorage, target);
    setError("");
    if (target.view !== "lesson") setLessonQueueNotice("");
  }

  function skipToMainContent(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const main = mainContentRef.current;
    if (!main) return;
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start", behavior: navigationScrollBehavior(window) });
  }

  function requestAuthentication''',
    "navigate function",
)

content = replace_once(
    content,
    '''      window.history.replaceState(
        { lexigo: true, view: "profile" },
        "",
        target.pathname + (target.searchParams.size ? `?${target.searchParams.toString()}` : ""),
      );''',
    '''      window.history.replaceState(
        createNavigationHistoryState(
          { view: "profile" },
          { x: window.scrollX, y: window.scrollY },
        ),
        "",
        target.pathname + (target.searchParams.size ? `?${target.searchParams.toString()}` : ""),
      );''',
    "reset token history",
)

content = replace_once(
    content,
    '''  function handleRatingClick(event: MouseEvent<HTMLButtonElement>) {
    const rating = event.currentTarget.dataset.rating;
    if (rating === "again" || rating === "almost" || rating === "known") {
      void rateCurrent(rating, event.timeStamp);
    }
  }

  async function rateCurrent(rating: ReviewRating, submittedAt: number) {
    if (!currentItem || currentRating || reviewInFlightRef.current) return;''',
    '''  function handleRatingClick(event: MouseEvent<HTMLButtonElement>) {
    const rating = event.currentTarget.dataset.rating;
    if (rating === "again" || rating === "almost" || rating === "known") {
      void rateCurrent(rating, event.timeStamp, document.activeElement === event.currentTarget);
    }
  }

  async function rateCurrent(
    rating: ReviewRating,
    submittedAt: number,
    restoreFocusAfterSave = false,
  ) {
    if (!currentItem || currentRating || reviewInFlightRef.current) return;''',
    "review focus input",
)

content = replace_once(
    content,
    '''    reviewInFlightRef.current = true;
    setReviewing(true);
    setError("");
    try {''',
    '''    reviewInFlightRef.current = true;
    setReviewing(true);
    setError("");
    let reviewSaved = false;
    try {''',
    "review saved flag",
)

content = replace_once(
    content,
    '''      setSession(result.activeSession);
      setRatings((current) => ({ ...current, [currentItem.id]: rating }));''',
    '''      setSession(result.activeSession);
      setRatings((current) => ({ ...current, [currentItem.id]: rating }));
      reviewSaved = true;''',
    "review saved success",
)

content = replace_once(
    content,
    '''    } finally {
      reviewInFlightRef.current = false;
      setReviewing(false);
    }
  }''',
    '''    } finally {
      reviewInFlightRef.current = false;
      setReviewing(false);
      if (reviewSaved && restoreFocusAfterSave) {
        window.requestAnimationFrame(() => lessonAdvanceRef.current?.focus({ preventScroll: true }));
      }
    }
  }''',
    "review focus output",
)

content = replace_once(
    content,
    '''              className={navigation.view === entry.view ? "active" : ""}
              onClick={() => navigate({ view: entry.view })}''',
    '''              className={navigation.view === entry.view ? "active" : ""}
              aria-current={navigation.view === entry.view ? "page" : undefined}
              onClick={() => navigate({ view: entry.view })}''',
    "desktop aria-current",
)

content = replace_once(
    content,
    '<button className="lx-streak" type="button" onClick={() => navigate({ view: "progress" })}>',
    '<button className="lx-streak" type="button" aria-current={navigation.view === "progress" ? "page" : undefined} onClick={() => navigate({ view: "progress" })}>',
    "streak aria-current",
)

content = replace_once(
    content,
    '<button className="lx-avatar" type="button" onClick={() => navigate({ view: "profile" })} aria-label="Открыть профиль">',
    '<button className="lx-avatar" type="button" onClick={() => navigate({ view: "profile" })} aria-label="Открыть профиль" aria-current={navigation.view === "profile" ? "page" : undefined}>',
    "profile aria-current",
)

content = replace_once(
    content,
    '<main className="lx-study-column" data-study-view={studyView}>',
    '<div className="lx-study-column" data-study-view={studyView}>',
    "nested main open",
)

content = replace_once(
    content,
    '''<button className="lx-button primary wide" type="button" disabled={!advanceDecision.canAdvance} onClick={nextItem}>''',
    '''<button ref={lessonAdvanceRef} className="lx-button primary wide" type="button" disabled={!advanceDecision.canAdvance} onClick={nextItem}>''',
    "lesson advance ref",
)

content = replace_once(
    content,
    '''          </main>

          <aside className="lx-lesson-stats">''',
    '''          </div>

          <aside className="lx-lesson-stats">''',
    "nested main close",
)

old_return = '''  return (
    <main className="lx-app">
      {renderHeader()}
      {error ? <AsyncStatePanel label="Ошибка текущего действия" kind="error" title="Действие не выполнено" message={error} compact /> : null}
      {session ? <div className="lx-resource-stack">
        {navigation.view !== "progress" ? <AsyncResourceNotice label="Прогресс" status={progressStatus} onRetry={() => void loadProgressResource(session)} /> : null}
        <AsyncResourceNotice label="Состав каталога" status={catalogMetadataResourceStatus} onRetry={() => void loadCatalogMetadataResource()} />
        <AsyncResourceNotice label="Каталог фраз" status={phraseCatalogStatus} onRetry={() => void loadPhraseCatalogResource(session)} />
        <AsyncResourceNotice label="Незавершённый урок" status={activeLessonStatus} onRetry={() => void loadActiveLessonResource(session)} />
      </div> : null}
      {lessonQueueNotice ? <p className="lx-queue-notice" role="status">{lessonQueueNotice}</p> : null}
      <div className="lx-view">
        {view}
        <CalendarReminderIntegration
          open={calendarOpen}
          showCard={navigation.view === "progress" && Boolean(session && progress)}
          onOpen={() => setCalendarOpen(true)}
          onClose={() => setCalendarOpen(false)}
        />
      </div>
      <nav className="lx-mobile-nav" aria-label="Мобильная навигация">
        {PRIMARY_NAVIGATION.map((entry) => <button key={entry.view} type="button" className={navigation.view === entry.view ? "active" : ""} onClick={() => navigate({ view: entry.view })}><Icon name={navigationIcon(entry.view)}/><span>{entry.shortLabel}</span></button>)}
      </nav>
      {speechNotice ? <div className={`lx-speech-toast visible${speechNotice.error ? " error" : ""}`} role="status">{speechNotice.message}</div> : null}
    </main>
  );'''

new_return = '''  return (
    <div className="lx-app">
      <a className="lx-skip-link" href="#lexigo-main-content" onClick={skipToMainContent}>
        Перейти к основному содержимому
      </a>
      {renderHeader()}
      <main
        id="lexigo-main-content"
        ref={mainContentRef}
        className="lx-main-content"
        tabIndex={-1}
        aria-label={viewTitle(navigation.view)}
      >
        {error ? <AsyncStatePanel label="Ошибка текущего действия" kind="error" title="Действие не выполнено" message={error} compact /> : null}
        {session ? <div className="lx-resource-stack">
          {navigation.view !== "progress" ? <AsyncResourceNotice label="Прогресс" status={progressStatus} onRetry={() => void loadProgressResource(session)} /> : null}
          <AsyncResourceNotice label="Состав каталога" status={catalogMetadataResourceStatus} onRetry={() => void loadCatalogMetadataResource()} />
          <AsyncResourceNotice label="Каталог фраз" status={phraseCatalogStatus} onRetry={() => void loadPhraseCatalogResource(session)} />
          <AsyncResourceNotice label="Незавершённый урок" status={activeLessonStatus} onRetry={() => void loadActiveLessonResource(session)} />
        </div> : null}
        {lessonQueueNotice ? <p className="lx-queue-notice" role="status">{lessonQueueNotice}</p> : null}
        <div className="lx-view">
          {view}
          <CalendarReminderIntegration
            open={calendarOpen}
            showCard={navigation.view === "progress" && Boolean(session && progress)}
            onOpen={() => setCalendarOpen(true)}
            onClose={() => setCalendarOpen(false)}
          />
        </div>
      </main>
      <nav className="lx-mobile-nav" aria-label="Мобильная навигация">
        {PRIMARY_NAVIGATION.map((entry) => (
          <button
            key={entry.view}
            type="button"
            className={navigation.view === entry.view ? "active" : ""}
            aria-current={navigation.view === entry.view ? "page" : undefined}
            onClick={() => navigate({ view: entry.view })}
          >
            <Icon name={navigationIcon(entry.view)}/><span>{entry.shortLabel}</span>
          </button>
        ))}
      </nav>
      {routeAnnouncement.message ? (
        <p
          key={routeAnnouncement.id}
          className="lx-route-announcement"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {routeAnnouncement.message}
        </p>
      ) : null}
      {speechNotice ? <div className={`lx-speech-toast visible${speechNotice.error ? " error" : ""}`} role="status">{speechNotice.message}</div> : null}
    </div>
  );'''

content = replace_once(content, old_return, new_return, "application landmarks")
COMPONENT.write_text(content)

keyboard = KEYBOARD_SPEC.read_text()
keyboard = replace_once(
    keyboard,
    '''  const expected = [
    page.locator(".lx-brand"),''',
    '''  const expected = [
    page.getByRole("link", { name: "Перейти к основному содержимому" }),
    page.locator(".lx-brand"),''',
    "keyboard skip link order",
)
KEYBOARD_SPEC.write_text(keyboard)
