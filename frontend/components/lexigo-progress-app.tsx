"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  failedResourceStatus,
  isActiveLessonPayload,
  isItemsResponsePayload,
  isProgressSummaryPayload,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import { authorizedJSON } from "../lib/authorized-json";
import type { Session } from "../lib/auth-session";
import { navigationURL, viewTitle } from "../lib/navigation";
import {
  dueReviewLessonCount,
  type ProgressSummary,
} from "../lib/progress";
import { AsyncResourceNotice, AsyncStatePanel } from "./async-state";
import { ProgressEvidenceDashboard } from "./progress-evidence-dashboard";

type DueItem = {
  id: number;
};

type DueItemsResponse = {
  items: DueItem[];
  count: number;
  total?: number;
};

type LessonSessionResponse = {
  id: string;
  source: string;
  studyMode: string;
  lessonSize: string;
  currentIndex: number;
  version: number;
  status: string;
  items: Array<DueItem & { position: number }>;
  createdAt: string;
  updatedAt: string;
};

type LexigoProgressAppProps = {
  initialSession: Session | null;
  onSessionUpdated: (session: Session) => void;
};

function boundedLessonSize(count: number): 15 | 30 | 60 {
  if (count <= 15) return 15;
  if (count <= 30) return 30;
  return 60;
}

function dueQuery(progress: ProgressSummary, topic?: string): string {
  const parameters = new URLSearchParams({
    kind: "all",
    limit: String(Math.max(15, dueReviewLessonCount(progress.dueNow))),
  });
  if (topic?.trim()) parameters.set("topic", topic.trim());
  return `/api/v1/words/due?${parameters.toString()}`;
}

export function LexigoProgressApp({ initialSession, onSessionUpdated }: LexigoProgressAppProps) {
  const router = useRouter();
  const session = initialSession;
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [progressStatus, setProgressStatus] = useState<ResourceStatus>(() => (
    session ? loadingResourceStatus() : readyResourceStatus()
  ));
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const adoptSession = useCallback((next: Session) => {
    if (session?.tokens.accessToken !== next.tokens.accessToken) onSessionUpdated(next);
  }, [onSessionUpdated, session?.tokens.accessToken]);

  const loadProgress = useCallback(async (activeSession: Session, signal?: AbortSignal) => {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedJSON<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${new Date().getTimezoneOffset()}`,
        { signal },
        isProgressSummaryPayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      setProgress(null);
      setProgressStatus(failedResourceStatus(error, "прогресс"));
    }
  }, [adoptSession]);

  useEffect(() => {
    if (!session) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadProgress(session, controller.signal), 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadProgress, session]);

  const initial = useMemo(() => session?.user.displayName.trim().charAt(0).toUpperCase()
    || session?.user.email.charAt(0).toUpperCase()
    || "L", [session]);

  const configureLesson = useCallback(() => {
    router.push(navigationURL({ view: "learn", source: "mixed" }), { scroll: false });
  }, [router]);

  const requireAuthentication = useCallback(() => {
    router.push("/profile?session=required&return_to=%2Fprogress", { scroll: false });
  }, [router]);

  const startDueReview = useCallback(async (topic?: string) => {
    if (!session || !progress || busy) return;

    setBusy(true);
    setActionError("");
    try {
      const due = await authorizedJSON<DueItemsResponse>(
        session,
        dueQuery(progress, topic),
        {},
        isItemsResponsePayload,
      );
      adoptSession(due.activeSession);
      const wordIds = due.data.items
        .map((item) => item.id)
        .filter((id) => Number.isInteger(id) && id > 0);

      if (wordIds.length === 0) {
        setActionError(topic
          ? `В теме «${topic}» сейчас нет элементов с наступившим интервалом.`
          : "Очередь повторения уже пуста.");
        await loadProgress(due.activeSession);
        return;
      }

      const lessonSize = boundedLessonSize(wordIds.length);
      const lesson = await authorizedJSON<LessonSessionResponse>(
        due.activeSession,
        "/api/v1/lessons",
        {
          method: "POST",
          body: JSON.stringify({
            source: "mixed",
            studyMode: "recall",
            lessonSize: String(lessonSize),
            wordIds,
          }),
        },
        isActiveLessonPayload,
      );
      adoptSession(lesson.activeSession);
      router.push(navigationURL({ view: "lesson", detail: "active" }), { scroll: false });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось подготовить очередь повторения");
    } finally {
      setBusy(false);
    }
  }, [adoptSession, busy, loadProgress, progress, router, session]);

  return (
    <div className="lx-app" data-route-client-island="progress">
      <header className="lx-header">
        <div className="lx-header-tools">
          <button
            className="lx-avatar"
            type="button"
            aria-label="Открыть профиль"
            onClick={() => router.push("/profile", { scroll: false })}
          >
            {initial}
          </button>
        </div>
      </header>

      <div className="lx-app-shell">
        <main
          id="lexigo-main-content"
          className="lx-main-content"
          tabIndex={-1}
          aria-label={viewTitle("progress")}
        >
          {session ? (
            <div className="lx-resource-stack">
              <AsyncResourceNotice
                label="Прогресс"
                status={progressStatus}
                onRetry={() => void loadProgress(session)}
              />
            </div>
          ) : null}

          <div className="lx-view">
            {actionError ? (
              <AsyncStatePanel
                label="Ошибка текущего действия"
                kind="error"
                title="Действие не выполнено"
                message={actionError}
                compact
              />
            ) : null}

            {!session ? (
              <section className="lx-empty">
                <span>ПРОГРЕСС</span>
                <h1>Войдите, чтобы видеть результат обучения</h1>
                <p>Недельные доказательства удержания, очередь Recall и слабые темы синхронизируются между устройствами.</p>
                <button className="lx-button primary" type="button" onClick={requireAuthentication}>
                  Войти и открыть прогресс
                </button>
              </section>
            ) : !progress ? (
              <AsyncStatePanel
                label={progressStatus.phase === "loading" || progressStatus.phase === "idle" ? "Загрузка прогресса" : "Прогресс недоступен"}
                kind={progressStatus.phase === "loading" || progressStatus.phase === "idle" ? "loading" : "error"}
                title={progressStatus.phase === "loading" || progressStatus.phase === "idle" ? "Загружаем прогресс…" : progressStatus.problem?.title ?? "Прогресс недоступен"}
                message={progressStatus.problem?.message ?? "Получаем недельные доказательства удержания, очередь и активность."}
                reference={progressStatus.problem?.correlationId}
                actionLabel={progressStatus.problem?.retryable ? "Повторить загрузку" : undefined}
                onAction={progressStatus.problem?.retryable ? () => void loadProgress(session) : undefined}
                focusResult={progressStatus.phase !== "loading" && progressStatus.phase !== "idle"}
              />
            ) : (
              <ProgressEvidenceDashboard
                progress={progress}
                busy={busy}
                onStartDueReview={(topic) => void startDueReview(topic)}
                onConfigureLesson={configureLesson}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
