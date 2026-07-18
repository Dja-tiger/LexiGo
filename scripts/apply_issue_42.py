from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one marker, found {count}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


path = "frontend/components/lexigo-premium-app.tsx"

replace_once(
    path,
    'import { apiUrl } from "../lib/api";\nimport { csrfTokenFromCookie, refreshSession, type Session } from "../lib/auth-session";\n',
    'import {\n'
    '  failedResourceStatus,\n'
    '  idleResourceStatus,\n'
    '  isActiveLessonPayload,\n'
    '  isItemsResponsePayload,\n'
    '  isProgressSummaryPayload,\n'
    '  loadingResourceStatus,\n'
    '  readyResourceStatus,\n'
    '  type ResourceStatus,\n'
    '} from "../lib/account-resources";\n'
    'import { apiUrl } from "../lib/api";\n'
    'import { csrfTokenFromCookie, refreshSession, type Session } from "../lib/auth-session";\n',
    "account resource imports",
)

replace_once(
    path,
    'import {\n'
    '  isRestorableNavigation,\n'
    '  navigationURL,\n'
    '  NAVIGATION_STORAGE_KEY,\n'
    '  parseNavigation,\n'
    '  parseStoredNavigation,\n'
    '  PRIMARY_NAVIGATION,\n'
    '  type AppView,\n'
    '  type NavigationTarget,\n'
    '  viewTitle,\n'
    '} from "../lib/navigation";\n',
    'import {\n'
    '  navigationURL,\n'
    '  parseNavigation,\n'
    '  PRIMARY_NAVIGATION,\n'
    '  readPersistedNavigation as readNavigationCache,\n'
    '  type AppView,\n'
    '  type NavigationTarget,\n'
    '  viewTitle,\n'
    '  writePersistedNavigation as writeNavigationCache,\n'
    '} from "../lib/navigation";\n',
    "versioned navigation imports",
)

replace_once(
    path,
    'import { TECHNICAL_PHRASES } from "../lib/technical-phrases";\n',
    'import {\n'
    '  decodeJSON,\n'
    '  failureFromResponse,\n'
    '  fetchWithTimeout,\n'
    '  RequestFailure,\n'
    '} from "../lib/request-failure";\n'
    'import { TECHNICAL_PHRASES } from "../lib/technical-phrases";\n',
    "request failure imports",
)

replace_once(
    path,
    'type ErrorResponse = {\n  error?: { code?: string; message?: string };\n};\n\n',
    '',
    "obsolete error response type",
)

replace_once(
    path,
    '''function readPersistedNavigation(): NavigationTarget | null {
  try {
    const target = parseStoredNavigation(window.localStorage.getItem(NAVIGATION_STORAGE_KEY));
    if (!target) window.localStorage.removeItem(NAVIGATION_STORAGE_KEY);
    return target;
  } catch {
    return null;
  }
}

function persistNavigation(target: NavigationTarget) {
  if (!isRestorableNavigation(target)) return;
  try {
    window.localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(target));
  } catch {
    // URL navigation remains authoritative when standalone storage is restricted.
  }
}

class APIError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

async function requestJSON<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = csrfTokenFromCookie();
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }
  const response = await fetch(apiUrl(path), { ...init, headers, credentials: "include" });
  if (!response.ok) {
    let code = "request_failed";
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as ErrorResponse;
      code = payload.error?.code ?? code;
      message = payload.error?.message ?? message;
    } catch {
      // Keep the HTTP status when the upstream response is not JSON.
    }
    throw new APIError(response.status, code, localizeAPIMessage(message));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function authorizedRequest<T>(current: Session, path: string, init: RequestInit = {}): Promise<AuthorizedResult<T>> {
  try {
    return { activeSession: current, data: await requestJSON<T>(path, init, current.tokens.accessToken) };
  } catch (requestError) {
    if (!(requestError instanceof APIError) || requestError.status !== 401) throw requestError;
    const refreshed = await refreshSession();
    return { activeSession: refreshed, data: await requestJSON<T>(path, init, refreshed.tokens.accessToken) };
  }
}
''',
    '''async function requestJSON<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
  validator: (value: unknown) => boolean = () => true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = csrfTokenFromCookie();
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }
  const response = await fetchWithTimeout(apiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    const failure = await failureFromResponse(response);
    throw new RequestFailure(failure.kind, localizeAPIMessage(failure.message), {
      status: failure.status,
      code: failure.code,
      cause: failure,
    });
  }
  if (response.status === 204) return undefined as T;
  return decodeJSON<T>(response, validator, `${path} response`);
}

async function authorizedRequest<T>(
  current: Session,
  path: string,
  init: RequestInit = {},
  validator: (value: unknown) => boolean = () => true,
): Promise<AuthorizedResult<T>> {
  try {
    return {
      activeSession: current,
      data: await requestJSON<T>(path, init, current.tokens.accessToken, validator),
    };
  } catch (requestError) {
    if (!(requestError instanceof RequestFailure) || requestError.status !== 401) throw requestError;
    const refreshed = await refreshSession();
    return {
      activeSession: refreshed,
      data: await requestJSON<T>(path, init, refreshed.tokens.accessToken, validator),
    };
  }
}
''',
    "typed request client",
)

replace_once(
    path,
    '''function CatalogSortControl({
''',
    '''function AccountResourceNotice({
  label,
  status,
  onRetry,
}: {
  label: string;
  status: ResourceStatus;
  onRetry: () => void;
}) {
  if (status.phase !== "error" || !status.problem) return null;
  return (
    <section className={`lx-resource-notice ${status.problem.kind}`} role="alert" aria-label={`${label}: ошибка загрузки`}>
      <div><strong>{status.problem.title}</strong><span>{status.problem.message}</span></div>
      {status.problem.retryable ? <button type="button" onClick={onRetry}>Повторить</button> : null}
    </section>
  );
}

function CatalogSortControl({
''',
    "resource notice component",
)

replace_once(
    path,
    '''  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [catalogMetadata, setCatalogMetadata] = useState<CatalogMetadata | null>(null);
  const [catalogMetadataStatus, setCatalogMetadataStatus] = useState<CatalogMetadataStatus>("loading");
  const [activeLesson, setActiveLesson] = useState<LessonSessionResponse | null>(null);
  const [hydratedUserID, setHydratedUserID] = useState("");
  const [phraseCatalog, setPhraseCatalog] = useState<LearningItem[]>(DEFAULT_PHRASE_CATALOG);
''',
    '''  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [progressStatus, setProgressStatus] = useState<ResourceStatus>(idleResourceStatus);
  const [catalogMetadata, setCatalogMetadata] = useState<CatalogMetadata | null>(null);
  const [catalogMetadataStatus, setCatalogMetadataStatus] = useState<CatalogMetadataStatus>("loading");
  const [activeLesson, setActiveLesson] = useState<LessonSessionResponse | null>(null);
  const [activeLessonStatus, setActiveLessonStatus] = useState<ResourceStatus>(idleResourceStatus);
  const [hydratedUserID, setHydratedUserID] = useState("");
  const [phraseCatalog, setPhraseCatalog] = useState<LearningItem[]>(DEFAULT_PHRASE_CATALOG);
  const [phraseCatalogStatus, setPhraseCatalogStatus] = useState<ResourceStatus>(idleResourceStatus);
''',
    "independent account resource state",
)

replace_once(
    path,
    '      ? readPersistedNavigation()\n',
    '      ? readNavigationCache(window.localStorage)\n',
    "read versioned navigation",
)

text = Path(path).read_text(encoding="utf-8")
count = text.count("persistNavigation(next);")
if count != 1:
    raise SystemExit(f"persist navigation callback: expected one marker, found {count}")
text = text.replace("persistNavigation(next);", "writeNavigationCache(window.localStorage, next);", 1)
count = text.count("persistNavigation(target);")
if count != 1:
    raise SystemExit(f"persist navigation action: expected one marker, found {count}")
text = text.replace("persistNavigation(target);", "writeNavigationCache(window.localStorage, target);", 1)
Path(path).write_text(text, encoding="utf-8")

replace_once(
    path,
    '''    const result = await authorizedRequest<ItemsResponse>(
      activeSession,
      `${endpoint}?kind=${kind}&limit=1000`,
    );
''',
    '''    const result = await authorizedRequest<ItemsResponse>(
      activeSession,
      `${endpoint}?kind=${kind}&limit=1000`,
      {},
      isItemsResponsePayload,
    );
''',
    "catalog payload validation",
)

replace_once(
    path,
    '''  const hydrateAccount = useCallback(async (activeSession: Session) => {
    setError("");
    try {
      const progressResult = await authorizedRequest<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
      );
      let currentSession = progressResult.activeSession;
      setProgress(progressResult.data);

      const phrasesResult = await loadItems(currentSession, "phrase", false);
      currentSession = phrasesResult.activeSession;
      setPhraseCatalog(phrasesResult.items);

      try {
        const lessonResult = await authorizedRequest<LessonSessionResponse>(currentSession, "/api/v1/lessons/active");
        currentSession = lessonResult.activeSession;
        setActiveLesson(lessonResult.data);
      } catch (lessonError) {
        if (lessonError instanceof APIError && lessonError.status === 404) setActiveLesson(null);
        else throw lessonError;
      }

      setSession(currentSession);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить данные аккаунта");
    }
  }, [loadItems]);

  useEffect(() => {
    if (!session || hydratedUserID === session.user.id) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void hydrateAccount(session).then(() => {
        if (!cancelled) setHydratedUserID(session.user.id);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [session, hydratedUserID, hydrateAccount]);
''',
    '''  const loadProgressResource = useCallback(async (
    activeSession: Session,
    signal?: AbortSignal,
    adoptSession = true,
  ): Promise<Session | null> => {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedRequest<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
        { signal },
        isProgressSummaryPayload,
      );
      if (signal?.aborted) return null;
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
      if (adoptSession) setSession(result.activeSession);
      return result.activeSession;
    } catch (requestError) {
      if (signal?.aborted) return null;
      setProgressStatus(failedResourceStatus(requestError, "прогресс"));
      return null;
    }
  }, []);

  const loadPhraseCatalogResource = useCallback(async (
    activeSession: Session,
    signal?: AbortSignal,
    adoptSession = true,
  ): Promise<Session | null> => {
    setPhraseCatalogStatus(loadingResourceStatus());
    try {
      const result = await loadItems(activeSession, "phrase", false, signal);
      if (signal?.aborted) return null;
      setPhraseCatalog(result.items);
      setPhraseCatalogStatus(readyResourceStatus());
      if (adoptSession) setSession(result.activeSession);
      return result.activeSession;
    } catch (requestError) {
      if (signal?.aborted) return null;
      setPhraseCatalogStatus(failedResourceStatus(requestError, "каталог фраз"));
      return null;
    }
  }, [loadItems]);

  const loadActiveLessonResource = useCallback(async (
    activeSession: Session,
    signal?: AbortSignal,
    adoptSession = true,
  ): Promise<Session | null> => {
    setActiveLessonStatus(loadingResourceStatus());
    try {
      const result = await authorizedRequest<LessonSessionResponse>(
        activeSession,
        "/api/v1/lessons/active",
        { signal },
        isActiveLessonPayload,
      );
      if (signal?.aborted) return null;
      setActiveLesson(result.data);
      setActiveLessonStatus(readyResourceStatus());
      if (adoptSession) setSession(result.activeSession);
      return result.activeSession;
    } catch (requestError) {
      if (signal?.aborted) return null;
      if (requestError instanceof RequestFailure && requestError.status === 404) {
        setActiveLesson(null);
        setActiveLessonStatus(readyResourceStatus());
        return activeSession;
      }
      setActiveLessonStatus(failedResourceStatus(requestError, "незавершённый урок"));
      return null;
    }
  }, []);

  useEffect(() => {
    if (!session || hydratedUserID === session.user.id) return;
    let cancelled = false;
    const controller = new AbortController();
    const activeSession = session;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setHydratedUserID(activeSession.user.id);
      setProgress(null);
      setActiveLesson(null);
      setPhraseCatalog(DEFAULT_PHRASE_CATALOG);
      void Promise.all([
        loadProgressResource(activeSession, controller.signal, false),
        loadPhraseCatalogResource(activeSession, controller.signal, false),
        loadActiveLessonResource(activeSession, controller.signal, false),
      ]).then((sessions) => {
        if (cancelled) return;
        const refreshed = sessions.find((candidate) => candidate?.tokens.accessToken !== activeSession.tokens.accessToken);
        if (refreshed) setSession(refreshed);
      });
    }, 0);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    session,
    hydratedUserID,
    loadActiveLessonResource,
    loadPhraseCatalogResource,
    loadProgressResource,
  ]);
''',
    "independent account hydration",
)

replace_once(
    path,
    '''  const loadItems = useCallback(async (activeSession: Session, kind: "word" | "phrase", dueOnly: boolean) => {
    const endpoint = dueOnly ? "/api/v1/words/due" : "/api/v1/words";
    const result = await authorizedRequest<ItemsResponse>(
      activeSession,
      `${endpoint}?kind=${kind}&limit=1000`,
      {},
      isItemsResponsePayload,
    );
    return { activeSession: result.activeSession, items: result.data.items.map(toLearningItem) };
  }, []);
''',
    '''  const loadItems = useCallback(async (
    activeSession: Session,
    kind: "word" | "phrase",
    dueOnly: boolean,
    signal?: AbortSignal,
  ) => {
    const endpoint = dueOnly ? "/api/v1/words/due" : "/api/v1/words";
    const result = await authorizedRequest<ItemsResponse>(
      activeSession,
      `${endpoint}?kind=${kind}&limit=1000`,
      { signal },
      isItemsResponsePayload,
    );
    return { activeSession: result.activeSession, items: result.data.items.map(toLearningItem) };
  }, []);
''',
    "abortable item loader",
)

replace_once(
    path,
    '''  async function refreshProgress(activeSession: Session): Promise<Session> {
    const result = await authorizedRequest<ProgressSummary>(
      activeSession,
      `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
    );
    setSession(result.activeSession);
    setProgress(result.data);
    return result.activeSession;
  }
''',
    '''  async function refreshProgress(activeSession: Session): Promise<Session> {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedRequest<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
        {},
        isProgressSummaryPayload,
      );
      setSession(result.activeSession);
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
      return result.activeSession;
    } catch (requestError) {
      setProgressStatus(failedResourceStatus(requestError, "прогресс"));
      throw requestError;
    }
  }
''',
    "validated progress refresh",
)

text = Path(path).read_text(encoding="utf-8")
api_error_count = text.count("instanceof APIError")
if api_error_count == 0:
    raise SystemExit("APIError usages: expected at least one marker")
text = text.replace("instanceof APIError", "instanceof RequestFailure")
Path(path).write_text(text, encoding="utf-8")

replace_once(
    path,
    '''  function renderProgress() {
    if (!session || !progress) {
      return <section className="lx-empty"><span>ПРОГРЕСС</span><h1>Войдите, чтобы видеть результат обучения</h1><p>Дневная цель, due-очередь, retained items и серия синхронизируются между устройствами.</p><button className="lx-button primary" type="button" onClick={() => requestAuthentication("progress")}>Войти и открыть прогресс</button></section>;
    }
''',
    '''  function renderProgress() {
    if (!session) {
      return <section className="lx-empty"><span>ПРОГРЕСС</span><h1>Войдите, чтобы видеть результат обучения</h1><p>Дневная цель, due-очередь, retained items и серия синхронизируются между устройствами.</p><button className="lx-button primary" type="button" onClick={() => requestAuthentication("progress")}>Войти и открыть прогресс</button></section>;
    }
    if (!progress) {
      const problem = progressStatus.problem;
      return <section className="lx-empty"><span>ПРОГРЕСС</span><h1>{progressStatus.phase === "loading" || progressStatus.phase === "idle" ? "Загружаем прогресс…" : problem?.title ?? "Прогресс недоступен"}</h1><p>{problem?.message ?? "Данные появятся после синхронизации аккаунта."}</p>{problem?.retryable ? <button className="lx-button primary" type="button" onClick={() => void loadProgressResource(session)}>Повторить загрузку</button> : null}</section>;
    }
''',
    "progress loading and error view",
)

replace_once(
    path,
    '<div className="lx-heading-badge"><Icon name="phrases"/><span>{progress?.duePhrases ?? 0} фраз готовы к повторению</span></div>',
    '<div className="lx-heading-badge"><Icon name="phrases"/><span>{progress ? `${progress.duePhrases} фраз готовы к повторению` : progressStatus.phase === "loading" || progressStatus.phase === "idle" ? "Загружаем очередь…" : "Очередь недоступна"}</span></div>',
    "phrase progress state",
)

replace_once(
    path,
    '''      {renderHeader()}
      {error ? <p className="lx-error" role="alert">{error}</p> : null}
      {lessonQueueNotice ? <p className="lx-queue-notice" role="status">{lessonQueueNotice}</p> : null}
''',
    '''      {renderHeader()}
      {error ? <p className="lx-error" role="alert">{error}</p> : null}
      {session ? <div className="lx-resource-stack">
        <AccountResourceNotice label="Прогресс" status={progressStatus} onRetry={() => void loadProgressResource(session)} />
        <AccountResourceNotice label="Каталог фраз" status={phraseCatalogStatus} onRetry={() => void loadPhraseCatalogResource(session)} />
        <AccountResourceNotice label="Незавершённый урок" status={activeLessonStatus} onRetry={() => void loadActiveLessonResource(session)} />
      </div> : null}
      {lessonQueueNotice ? <p className="lx-queue-notice" role="status">{lessonQueueNotice}</p> : null}
''',
    "resource retry stack",
)

# Add styling without coupling the resource state to the large legacy stylesheet.
css_path = Path("frontend/app/mobile-pwa-fixes.css")
css = css_path.read_text(encoding="utf-8")
css_marker = ".lx-speech-toast {\n"
if css.count(css_marker) != 1:
    raise SystemExit("resource notice CSS marker not found exactly once")
resource_css = '''.lx-resource-stack {
  position: relative;
  z-index: 20;
  display: grid;
  width: min(1160px, calc(100% - 28px));
  gap: 10px;
  margin: 12px auto 0;
}

.lx-resource-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid rgba(255, 178, 75, 0.28);
  border-radius: 15px;
  padding: 12px 15px;
  color: #ffe2ad;
  background: rgba(70, 44, 12, 0.88);
}

.lx-resource-notice > div { display: grid; gap: 4px; }
.lx-resource-notice strong { font-size: 14px; }
.lx-resource-notice span { color: inherit; font-size: 13px; line-height: 1.45; }
.lx-resource-notice button,
.lx-session-notice button {
  min-height: 40px;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 11px;
  padding: 8px 13px;
  color: inherit;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 800;
}

.lx-resource-notice.offline,
.lx-resource-notice.timeout,
.lx-session-notice.offline,
.lx-session-notice.timeout { border-color: rgba(101, 191, 255, 0.3); color: #c7e8ff; background: rgba(13, 55, 84, 0.94); }

.lx-resource-notice.malformed,
.lx-session-notice.malformed { border-color: rgba(205, 158, 255, 0.32); color: #ead7ff; background: rgba(57, 31, 83, 0.94); }

'''
css_path.write_text(css.replace(css_marker, resource_css + css_marker, 1), encoding="utf-8")
