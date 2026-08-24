"use client";

import { useLayoutEffect, useState } from "react";

import { consumeLearnHandoffFallbackNotice } from "../lib/lesson-composition-handoff";
import {
  lessonResultOutcomeState,
  type LessonResultContinuation,
  type LessonResultSnapshot,
} from "../lib/lesson-result";

const LESSON_RESULT_NOTICE_EVENT = "lexigo:lesson-result-handoff-notice";

type LessonResultPresentationProps = {
  snapshot: LessonResultSnapshot;
  continuation: LessonResultContinuation;
  sourceLabel: string;
  busy: boolean;
  celebrate: boolean;
  onHome: () => void;
  onProgress: () => void;
  onNextLesson: () => void;
  onDueReview: () => void;
  onStay: () => void;
};

type ResultCopy = {
  state: string;
  symbol: string;
  eyebrow: string;
  title: string;
  body: string;
  actionEyebrow: string;
  actionTitle: string;
  actionBody: string;
  detailTitle: string;
  detailBody: string;
  primaryLabel: string;
  secondaryLabel: string;
  primaryAction: "home" | "next" | "due" | "none";
  secondaryAction: "home" | "progress" | "stay";
};

function objectiveEvidenceSummary(snapshot: LessonResultSnapshot): string {
  const outcomeState = lessonResultOutcomeState(snapshot);
  const attempted = snapshot.evidence.recall.attempted + snapshot.evidence.recognition.attempted;
  const correct = snapshot.evidence.recall.correct + snapshot.evidence.recognition.correct;
  const unavailable = snapshot.evidence.recall.unavailable + snapshot.evidence.recognition.unavailable;

  if (outcomeState === "empty") {
    return "Сохранённых ответов для итоговой оценки нет. LexiGo не показывает результат, которого сервер не подтвердил.";
  }
  if (outcomeState === "study") {
    return `${snapshot.evidence.activity.reviewed} просмотров сохранены. В режиме изучения объективная проверка не выполняется.`;
  }
  if (outcomeState === "skipped") {
    return `Сохранено ${snapshot.evidence.activity.reviewed} действий; пропущено ${snapshot.skipped}. Пропуски не считаются знанием.`;
  }
  if (outcomeState === "partial") {
    return `Объективная проверка доступна для ${attempted} ответов; ещё ${unavailable} восстановлены без сохранённого результата проверки.`;
  }
  return `${correct} из ${attempted} объективных ответов подтверждены серверной проверкой.`;
}

function formatNextDueAt(value: string | null): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function reviewTiming(snapshot: LessonResultSnapshot): { title: string; body: string } {
  const nextDue = formatNextDueAt(snapshot.nextDueAt);
  if (snapshot.dueNow > 0 && nextDue) {
    return {
      title: `${snapshot.dueNow} элементов готовы сейчас`,
      body: `Следующий срок в очереди: ${nextDue}. Время взято из серверного расписания.`,
    };
  }
  if (snapshot.dueNow > 0) {
    return {
      title: `${snapshot.dueNow} элементов готовы сейчас`,
      body: "Ближайший последующий срок сервер пока не вернул.",
    };
  }
  if (nextDue) {
    return {
      title: "Ближайшее повторение назначено",
      body: `${nextDue} по времени этого устройства. Срок сохранён сервером.`,
    };
  }
  return {
    title: "Очередь повторения актуальна",
    body: "Новых элементов к повторению сейчас нет; следующий срок появится из серверного расписания.",
  };
}

function resultCopy(
  snapshot: LessonResultSnapshot,
  continuation: LessonResultContinuation,
  sourceLabel: string,
): ResultCopy {
  const outcomeBody = objectiveEvidenceSummary(snapshot);
  const timing = reviewTiming(snapshot);

  if (continuation.kind === "sync-pending") {
    return {
      state: "sync-pending",
      symbol: "↻",
      eyebrow: "РЕЗУЛЬТАТ СОХРАНЁН",
      title: "Синхронизация выполнится позже",
      body: "Ответ сохранён сервером, но свежая сводка прогресса недоступна. Экран не дополняет её локальными предположениями.",
      actionEyebrow: "ОЖИДАЕТ СИНХРОНИЗАЦИИ",
      actionTitle: `${snapshot.evidence.activity.reviewed} ответов подтверждены в уроке`,
      actionBody: "Повторная отправка review не требуется и не создаст второй результат.",
      detailTitle: "Расписание не подменяется",
      detailBody: "Ближайший срок и дневные показатели обновятся после успешной загрузки server progress.",
      primaryLabel: "На главную",
      secondaryLabel: "Остаться на экране",
      primaryAction: "home",
      secondaryAction: "stay",
    };
  }

  if (continuation.kind === "daily-goal") {
    const dailyEvidence = snapshot.objectiveReviewsToday !== null
      ? `${snapshot.objectiveReviewsToday} объективных проверок сегодня`
      : `${snapshot.reviewsAfter ?? snapshot.evidence.activity.reviewed} сохранённых повторений сегодня`;
    return {
      state: "daily-goal",
      symbol: "★",
      eyebrow: "ДНЕВНАЯ ЦЕЛЬ",
      title: "Цель дня достигнута",
      body: outcomeBody,
      actionEyebrow: "СЕГОДНЯ",
      actionTitle: dailyEvidence,
      actionBody: snapshot.currentStreak !== null
        ? `Текущая серия: ${snapshot.currentStreak}. Значение получено из server progress.`
        : "Дневная цель подтверждена server progress; серия не вычисляется на клиенте.",
      detailTitle: timing.title,
      detailBody: timing.body,
      primaryLabel: "На главную",
      secondaryLabel: "Посмотреть прогресс",
      primaryAction: "home",
      secondaryAction: "progress",
    };
  }

  if (continuation.kind === "next") {
    return {
      state: "next",
      symbol: "→",
      eyebrow: "УРОК ЗАВЕРШЁН",
      title: "Готов следующий блок",
      body: outcomeBody,
      actionEyebrow: "СЛЕДУЮЩИЙ БЛОК",
      actionTitle: continuation.title || sourceLabel,
      actionBody: `${continuation.itemCount} элементов · около ${continuation.estimatedMinutes} минут`,
      detailTitle: timing.title,
      detailBody: timing.body,
      primaryLabel: "Следующий урок",
      secondaryLabel: "На главную",
      primaryAction: "next",
      secondaryAction: "home",
    };
  }

  if (continuation.kind === "due") {
    const dueBlockCount = Math.min(15, continuation.dueCount);
    const hasRemainingBacklog = continuation.dueCount > dueBlockCount;
    return {
      state: "due",
      symbol: "↻",
      eyebrow: "УРОК ЗАВЕРШЁН",
      title: "Сначала закрепим материал",
      body: outcomeBody,
      actionEyebrow: "ГОТОВО К ПОВТОРЕНИЮ",
      actionTitle: hasRemainingBacklog
        ? `Повторить ${dueBlockCount} из ${continuation.dueCount}`
        : `${continuation.dueCount} элементов требуют проверки`,
      actionBody: hasRemainingBacklog
        ? `Сейчас к повторению: ${continuation.dueCount}. Следующий блок ограничен ${dueBlockCount} элементами; остаток останется в очереди.`
        : "Это уже наступивший server-owned срок, поэтому повторение полезнее нового блока.",
      detailTitle: timing.title,
      detailBody: timing.body,
      primaryLabel: hasRemainingBacklog
        ? `Повторить ${dueBlockCount} из ${continuation.dueCount}`
        : `Повторить ${dueBlockCount} элементов`,
      secondaryLabel: "На главную",
      primaryAction: "due",
      secondaryAction: "home",
    };
  }

  if (continuation.kind === "checking") {
    return {
      state: "checking",
      symbol: "✓",
      eyebrow: "УРОК ЗАВЕРШЁН",
      title: "Блок завершён",
      body: outcomeBody,
      actionEyebrow: "СЛЕДУЮЩИЙ ШАГ",
      actionTitle: "Проверяем учебную очередь",
      actionBody: "Новый блок или возвращение к плану будут выбраны по актуальным серверным данным.",
      detailTitle: timing.title,
      detailBody: timing.body,
      primaryLabel: "Подбираем следующий шаг…",
      secondaryLabel: "Посмотреть прогресс",
      primaryAction: "none",
      secondaryAction: "progress",
    };
  }

  return {
    state: "complete",
    symbol: "✓",
    eyebrow: "УРОК ЗАВЕРШЁН",
    title: "Блок завершён",
    body: outcomeBody,
    actionEyebrow: "ДАЛЬШЕ",
    actionTitle: "Вернуться к плану",
    actionBody: snapshot.dailyGoalReached
      ? "Полезная работа на сегодня выполнена; следующая рекомендация придёт из актуального плана."
      : "Следующая рекомендация появится на главной с учётом сохранённого результата.",
    detailTitle: timing.title,
    detailBody: timing.body,
    primaryLabel: "На главную",
    secondaryLabel: "Посмотреть прогресс",
    primaryAction: "home",
    secondaryAction: "progress",
  };
}

function metricValue(correct: number, attempted: number): string {
  return attempted > 0 ? `${correct} / ${attempted}` : "—";
}

function unavailableLabel(count: number): string {
  return count > 0 ? ` · ${count} без сохранённой проверки` : "";
}

export function LessonResultPresentation({
  snapshot,
  continuation,
  sourceLabel,
  busy,
  celebrate,
  onHome,
  onProgress,
  onNextLesson,
  onDueReview,
  onStay,
}: LessonResultPresentationProps) {
  const [handoffNotice] = useState(() => consumeLearnHandoffFallbackNotice(snapshot.source));
  const copy = resultCopy(snapshot, continuation, sourceLabel);
  const evidenceState = lessonResultOutcomeState(snapshot);
  const primaryAction = copy.primaryAction === "next"
    ? onNextLesson
    : copy.primaryAction === "due"
      ? onDueReview
      : copy.primaryAction === "home"
        ? onHome
        : undefined;
  const secondaryAction = copy.secondaryAction === "home"
    ? onHome
    : copy.secondaryAction === "stay"
      ? onStay
      : onProgress;
  const statusLabel = snapshot.syncPending ? "Сводка ожидает синхронизации" : "Сохранено";

  useLayoutEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        window.dispatchEvent(new CustomEvent(LESSON_RESULT_NOTICE_EVENT, { detail: handoffNotice }));
      }
    });
    return () => {
      cancelled = true;
      window.dispatchEvent(new CustomEvent(LESSON_RESULT_NOTICE_EVENT, { detail: "" }));
    };
  }, [handoffNotice]);

  return (
    <section
      className={`lx-lesson-result lx-lesson-result--${copy.state}${celebrate ? " lx-lesson-result--celebrate" : ""}`}
      data-lesson-result-state={copy.state}
      data-lesson-result-evidence-state={evidenceState}
      aria-labelledby="lesson-result-title"
    >
      <header className="lx-lesson-result__topbar">
        <strong className="lx-lesson-result__brand">LexiGo</strong>
        <span className="lx-lesson-result__route">Результат урока</span>
        <span className="lx-lesson-result__save-status" role="status" aria-live="polite">{statusLabel}</span>
      </header>

      <main className="lx-lesson-result__workspace">
        <article className="lx-lesson-result__evidence-card">
          <div className="lx-lesson-result__outcome">
            <span className="lx-lesson-result__outcome-icon" aria-hidden="true">{copy.symbol}</span>
            <div>
              <span className="lx-lesson-result__eyebrow">{copy.eyebrow}</span>
              <h1 id="lesson-result-title" tabIndex={-1}>{copy.title}</h1>
              <p>{copy.body}</p>
            </div>
          </div>

          <section className="lx-lesson-result__evidence" aria-labelledby="lesson-result-evidence-title">
            <h2 id="lesson-result-evidence-title">Подтверждённый результат</h2>
            <div className="lx-lesson-result__metrics">
              <article>
                <strong>{metricValue(snapshot.evidence.recall.correct, snapshot.evidence.recall.attempted)}</strong>
                <span>Самостоятельно</span>
                <small>объективный recall{unavailableLabel(snapshot.evidence.recall.unavailable)}</small>
              </article>
              <article>
                <strong>{metricValue(snapshot.evidence.recognition.correct, snapshot.evidence.recognition.attempted)}</strong>
                <span>С выбором</span>
                <small>поддержанное узнавание{unavailableLabel(snapshot.evidence.recognition.unavailable)}</small>
              </article>
              <article>
                <strong>{snapshot.evidence.activity.reviewed}</strong>
                <span>Просмотрено</span>
                <small>сохранённая активность отдельно</small>
              </article>
            </div>
            <div className="lx-lesson-result__evidence-note">
              <strong>Объективная проверка и самооценка не смешиваются.</strong>
              <span>Пропущено: {snapshot.skipped}. Самооценка: {snapshot.confidence.known} знал · {snapshot.confidence.almost} почти · {snapshot.confidence.again} не знал.</span>
            </div>
          </section>
        </article>

        <aside className="lx-lesson-result__action-card" aria-label="Следующее рекомендуемое действие">
          <span className="lx-lesson-result__action-eyebrow">{copy.actionEyebrow}</span>
          <h2>{copy.actionTitle}</h2>
          <p>{copy.actionBody}</p>
          <div className="lx-lesson-result__action-detail">
            <strong>{copy.detailTitle}</strong>
            <span>{copy.detailBody}</span>
          </div>
          <button
            className="lx-lesson-result__primary"
            type="button"
            disabled={busy || !primaryAction}
            onClick={primaryAction}
          >
            {busy ? "Выполняем…" : copy.primaryLabel}
          </button>
          <button
            className="lx-lesson-result__secondary"
            type="button"
            disabled={busy}
            onClick={secondaryAction}
          >
            {copy.secondaryLabel}
          </button>
        </aside>

        <p className="lx-lesson-result__restore-note">
          Результат восстанавливается после reload и history navigation без повторной отправки review.
        </p>
      </main>
      <span className="lx-lesson-result__celebration" aria-hidden="true">★</span>
    </section>
  );
}
