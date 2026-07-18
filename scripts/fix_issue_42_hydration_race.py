from pathlib import Path


path = Path("frontend/components/lexigo-premium-app.tsx")
text = path.read_text(encoding="utf-8")
old = '''      setHydratedUserID(activeSession.user.id);
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
'''
new = '''      setProgress(null);
      setActiveLesson(null);
      setPhraseCatalog(DEFAULT_PHRASE_CATALOG);
      void Promise.all([
        loadProgressResource(activeSession, controller.signal, false),
        loadPhraseCatalogResource(activeSession, controller.signal, false),
        loadActiveLessonResource(activeSession, controller.signal, false),
      ]).then((sessions) => {
        if (cancelled) return;
        setHydratedUserID(activeSession.user.id);
        const refreshed = sessions.find((candidate) => candidate?.tokens.accessToken !== activeSession.tokens.accessToken);
        if (refreshed) setSession(refreshed);
      });
'''
count = text.count(old)
if count != 1:
    raise SystemExit(f"hydration completion marker: expected one block, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
