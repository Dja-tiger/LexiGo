"use client";

import { useState } from "react";

import { consumeLearnHandoffFallbackNotice } from "../lib/lesson-composition-handoff";
import type { LessonResultContinuation, LessonResultSnapshot } from "../lib/lesson-result";

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

function resultCopy(
  snapshot: LessonResultSnapshot,
  continuation: LessonResultContinuation,
  sourceLabel: string,
): ResultCopy {
  if (continuation.kind === "sync-pending") {
    return {
      state: "sync-pending",
      symbol: "↻",
      eyebrow: "РЕЗУЛЬТАТ СОХРАНЁН",
      title: "Синхронизация выполнится позже",
      body: "Ответы находятся на устройстве. Экран можно закрыть без потери завершённого результата.",
      actionEyebrow: "ОЖИДАЕТ СИНХРОНИЗАЦИИ",
      actionTitle: `${snapshot.evidence.activity.reviewed} ответов сохранены локально`,
      actionBody: "Повторная отправка не создаст второй результат.",
      detailTitle: "Завершённый блок защищён",
      detailBody: "После восстановления сети сервер получит тот же итог без повторного прохождения.",
      primaryLabel: "На главную",
      secondaryLabel: "Остаться на экране",
      primaryAction: "home",
      secondaryAction: "stay",
    };
  }

  if (continuation.kind === "daily-goal") {
    return {
      state: "daily-goal",
      symbol: "★",
      eyebrow: "ДНЕВНАЯ ЦЕЛЬ",
      title: "Цель дня достигнута",
      body: "Результат подтверждён сохранёнными ответами. Достижение показано отдельно от активности.",
      actionEyebrow: "СЕГОДНЯ",
      actionTitle: `${snapshot.reviewsAfter ?? snapshot.evidence.activity.reviewed} объективных ответов`,
      actionBody: "Серия и время занятия остаются дополнительным контекстом.",
      detailTitle: "Результат зафиксирован",
      detailBody: "Статичный знак успеха сохраняет смысл при Reduce Motion.",
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
      body: "Текущий блок завершён и не будет открыт повторно через действие продолжения.",
      actionEyebrow: "СЛЕДУЮЩИЙ БЛОК",
      actionTitle: continuation.title || sourceLabel,
      actionBody: `${continuation.itemCount} элементов · около ${continuation.estimatedMinutes} минут`,
      detailTitle: "Новый идентификатор блока",
      detailBody: "Действие создаст следующий доступный блок, а не переоткроет завершённый.",
      primaryLabel: "Следующий урок",
      secondaryLabel: "На главную",
      primaryAction: "next",
      secondaryAction: "home",
    };
  }

  if (continuation.kind === "due") {
    return {
      state: "due",
      symbol: "↻",
      eyebrow: "УРОК ЗАВЕРШЁН",
      title: "Новых блоков пока нет",
      body: "Результат сохранён. Следующее полезное действие — проверить элементы, срок которых наступил.",
      actionEyebrow: "ГОТОВО К ПОВТОРЕНИЮ",
      actionTitle: `${continuation.dueCount} элементов требуют проверки`,
      actionBody: "Очередь основана на сроке и предыдущих объективных ответах.",
      detailTitle: "Без лишнего нового материала",
      detailBody: "Сначала закрепляем слабые формулировки, затем рекомендуем новый блок.",
      primaryLabel: `Повторить ${continuation.dueCount} элементов`,
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
      body: "Ответы сохранены. LexiGo определяет следующий доступный шаг по актуальной очереди.",
      actionEyebrow: "СЛЕДУЮЩИЙ ШАГ",
      actionTitle: "Проверяем учебную очередь",
      actionBody: "Новый блок, повторение или возвращение к плану будут выбраны по серверным данным.",
      detailTitle: "Результат уже зафиксирован",
      detailBody: "Проверка следующего шага не отправляет ответы повторно.",
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
    body: "Результат сохранён отдельно от общей активности и доступен после возвращения на экран.",
    actionEyebrow: "ДАЛЬШЕ",
    actionTitle: "Вернуться к плану",
    actionBody: "Следующая рекомендация появится на главной с учётом этого результата.",
    detailTitle: `${Math.max(0, snapshot.confidence.almost + snapshot.confidence.again)} элемента требуют внимания`,
    detailBody: "Повторение проверит, сохранились ли формулировки в памяти.",
    primaryLabel: "На главную",
    secondaryLabel: "Посмотреть прогресс",
    primaryAction: "home",
    secondaryAction: "progress",
  };
}

function metricValue(correct: number, attempted: number): string {
  return attempted > 0 ? `${correct} / ${attempted}` : "—";
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
  const statusLabel = snapshot.syncPending ? "На устройстве" : "Сохранено";

  return (
    <>
      {handoffNotice ? (
        <p className="lx-queue-notice lx-queue-notice--lesson-result-handoff" role="status">
          {handoffNotice}
        </p>
      ) : null}
      <section
        className={`lx-lesson-result lx-lesson-result--${copy.state}${celebrate ? " lx-lesson-result--celebrate" : ""}`}
        data-lesson-result-state={copy.state}
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
                  <small>объективный recall</small>
                </article>
                <article>
                  <strong>{metricValue(snapshot.evidence.recognition.correct, snapshot.evidence.recognition.attempted)}</strong>
                  <span>С выбором</span>
                  <small>поддержанное узнавание</small>
                </article>
                <article>
                  <strong>{snapshot.evidence.activity.reviewed}</strong>
                  <span>Просмотрено</span>
                  <small>активность отдельно</small>
                </article>
              </div>
              <div className="lx-lesson-result__evidence-note">
                <strong>Объективные ответы, узнавание и активность не смешиваются.</strong>
                <span>Пропущено: {snapshot.skipped}. Уверенность: {snapshot.confidence.known} знал · {snapshot.confidence.almost} почти · {snapshot.confidence.again} не знал.</span>
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
            Результат восстанавливается после reload и history navigation без повторной отправки.
          </p>
        </main>
        <span className="lx-lesson-result__celebration" aria-hidden="true">★</span>
      </section>
    </>
  );
}
