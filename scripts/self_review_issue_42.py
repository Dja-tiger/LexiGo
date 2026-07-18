from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one marker, found {count}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


component = "frontend/components/lexigo-premium-app.tsx"

replace_once(
    component,
    '''  function renderHome() {
    const dueNow = progress?.dueNow ?? 0;
    const retained = progress?.retainedItemsWeek ?? 0;
    const dailyPercent = goalPercent(progress);
    const heroAction = activeLesson ? resumeLesson : () => startLesson(session, { mode: "study", source: "mixed", size: 30 });
''',
    '''  function renderHome() {
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
    const dueBreakdown = !session
      ? "После входа"
      : progress
        ? `${progress.dueWords} слов · ${progress.duePhrases} фраз`
        : progressPending
          ? "Загружаем очередь…"
          : "Очередь недоступна";
    const streakValue = !session ? "—" : progress ? progress.currentStreak : progressPending ? "…" : "—";
    const streakHint = !session ? "Сохраняется" : progress ? `Рекорд ${progress.longestStreak}` : progressPending ? "Загружаем серию…" : "Серия недоступна";
    const overallProgressLabel = !session
      ? "—"
      : !progress
        ? progressPending ? "…" : "—"
        : catalogMetadataStatus === "loading"
          ? "…"
          : catalogMetadata
            ? `${overallPercent}%`
            : "—";
    const goalSummary = !session
      ? "Войдите в аккаунт"
      : progress
        ? `${progress.reviewsToday} / ${progress.dailyGoal}`
        : progressPending
          ? "Загружаем цель…"
          : "Цель недоступна";
    const goalPercentLabel = !session ? "—" : progress ? `${dailyPercent}%` : progressPending ? "…" : "—";
    const heroAction = activeLesson ? resumeLesson : () => startLesson(session, { mode: "study", source: "mixed", size: 30 });
''',
    "home resource-derived metrics",
)

replace_once(
    component,
    '<div><span>Ваш прогресс</span><small>{session ? "Актуальные данные аккаунта" : "Войдите для персональной статистики"}</small></div>',
    '<div><span>Ваш прогресс</span><small>{progressPanelStatus}</small></div>',
    "home progress panel status",
)
replace_once(
    component,
    '<span>К повторению</span><strong className="purple">{session ? dueNow : "—"}</strong><small>{session ? `${progress?.dueWords ?? 0} слов · ${progress?.duePhrases ?? 0} фраз` : "После входа"}</small>',
    '<span>К повторению</span><strong className="purple">{dueNow}</strong><small>{dueBreakdown}</small>',
    "home due metrics",
)
replace_once(
    component,
    '<span>Серия дней</span><strong className="orange">{session ? progress?.currentStreak ?? 0 : "—"}</strong><small>{session ? `Рекорд ${progress?.longestStreak ?? 0}` : "Сохраняется"}</small>',
    '<span>Серия дней</span><strong className="orange">{streakValue}</strong><small>{streakHint}</small>',
    "home streak metrics",
)
replace_once(
    component,
    '<span>Сохранено за неделю</span><strong className="blue">{session ? retained : "—"}</strong><small>Retained items</small>',
    '<span>Сохранено за неделю</span><strong className="blue">{retained}</strong><small>Retained items</small>',
    "home retained metric",
)
replace_once(
    component,
    '<div className="lx-progress-ring" style={{ "--progress": `${overallPercent}%` } as React.CSSProperties}><strong>{session ? `${overallPercent}%` : "—"}</strong></div>',
    '<div className="lx-progress-ring" style={{ "--progress": `${progress && catalogMetadata ? overallPercent : 0}%` } as React.CSSProperties}><strong>{overallProgressLabel}</strong></div>',
    "home overall progress state",
)
replace_once(
    component,
    '<div><span>Цель на сегодня</span><strong>{session ? `${progress?.reviewsToday ?? 0} / ${progress?.dailyGoal ?? 30}` : "Войдите в аккаунт"}</strong></div>',
    '<div><span>Цель на сегодня</span><strong>{goalSummary}</strong></div>',
    "home goal summary",
)
replace_once(
    component,
    '<b>{session ? `${dailyPercent}%` : "—"}</b>',
    '<b>{goalPercentLabel}</b>',
    "home goal percentage",
)

replace_once(
    component,
    '''      setSession(null);
      setProgress(null);
      setActiveLesson(null);
      setPhraseCatalog(TECHNICAL_PHRASES);
      setHydratedUserID("");
''',
    '''      setSession(null);
      setProgress(null);
      setProgressStatus(idleResourceStatus());
      setActiveLesson(null);
      setActiveLessonStatus(idleResourceStatus());
      setPhraseCatalog(DEFAULT_PHRASE_CATALOG);
      setPhraseCatalogStatus(idleResourceStatus());
      setHydratedUserID("");
''',
    "logout resource reset",
)

replace_once(
    component,
    '''      {session ? <div className="lx-resource-stack">
        <AccountResourceNotice label="Прогресс" status={progressStatus} onRetry={() => void loadProgressResource(session)} />
        <AccountResourceNotice label="Каталог фраз" status={phraseCatalogStatus} onRetry={() => void loadPhraseCatalogResource(session)} />
        <AccountResourceNotice label="Незавершённый урок" status={activeLessonStatus} onRetry={() => void loadActiveLessonResource(session)} />
      </div> : null}
''',
    '''      {session ? <div className="lx-resource-stack">
        {navigation.view !== "progress" ? <AccountResourceNotice label="Прогресс" status={progressStatus} onRetry={() => void loadProgressResource(session)} /> : null}
        <AccountResourceNotice label="Каталог фраз" status={phraseCatalogStatus} onRetry={() => void loadPhraseCatalogResource(session)} />
        <AccountResourceNotice label="Незавершённый урок" status={activeLessonStatus} onRetry={() => void loadActiveLessonResource(session)} />
      </div> : null}
''',
    "avoid duplicate progress error UI",
)
