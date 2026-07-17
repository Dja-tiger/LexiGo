from pathlib import Path

path = Path("frontend/components/lexigo-premium-app.tsx")
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    text = text.replace(old, new, 1)


replace_once(
    'import { useEffect, useMemo, useRef, useState } from "react";',
    'import { useCallback, useEffect, useMemo, useRef, useState } from "react";',
    "React hook imports",
)

replace_once(
    '''  useEffect(() => {
    setPhraseSortMode(readStoredCatalogSort("phrases"));
    setAllItemsSortMode(readStoredCatalogSort("all-items"));
    return () => {
      if (speechNoticeTimer.current !== null) window.clearTimeout(speechNoticeTimer.current);
      window.speechSynthesis?.cancel();
    };
  }, []);
''',
    '''  useEffect(() => {
    const storageTimer = window.setTimeout(() => {
      setPhraseSortMode(readStoredCatalogSort("phrases"));
      setAllItemsSortMode(readStoredCatalogSort("all-items"));
    }, 0);
    return () => {
      window.clearTimeout(storageTimer);
      if (speechNoticeTimer.current !== null) window.clearTimeout(speechNoticeTimer.current);
      window.speechSynthesis?.cancel();
    };
  }, []);
''',
    "deferred sort hydration",
)

replace_once(
    '''  useEffect(() => {
    if (!session || hydratedUserID === session.user.id) return;
    let cancelled = false;
    void hydrateAccount(session).then(() => {
      if (!cancelled) setHydratedUserID(session.user.id);
    });
    return () => {
      cancelled = true;
    };
  }, [session, hydratedUserID]);

''',
    "",
    "unstable hydrate effect",
)

replace_once(
    '''  async function loadItems(activeSession: Session, kind: "word" | "phrase", dueOnly: boolean) {
    const endpoint = dueOnly ? "/api/v1/words/due" : "/api/v1/words";
    const result = await authorizedRequest<ItemsResponse>(
      activeSession,
      `${endpoint}?kind=${kind}&limit=1000`,
    );
    return { activeSession: result.activeSession, items: result.data.items.map(toLearningItem) };
  }

  async function hydrateAccount(activeSession: Session) {
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
  }

''',
    '''  const loadItems = useCallback(async (activeSession: Session, kind: "word" | "phrase", dueOnly: boolean) => {
    const endpoint = dueOnly ? "/api/v1/words/due" : "/api/v1/words";
    const result = await authorizedRequest<ItemsResponse>(
      activeSession,
      `${endpoint}?kind=${kind}&limit=1000`,
    );
    return { activeSession: result.activeSession, items: result.data.items.map(toLearningItem) };
  }, []);

  const hydrateAccount = useCallback(async (activeSession: Session) => {
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
    void hydrateAccount(session).then(() => {
      if (!cancelled) setHydratedUserID(session.user.id);
    });
    return () => {
      cancelled = true;
    };
  }, [session, hydratedUserID, hydrateAccount]);

''',
    "stable account hydration",
)

path.write_text(text)
print("issue 36 lint fix applied")
