"use client";

import type { CSSProperties } from "react";

import { learningTermCopy, partOfSpeechLabel, topicLabel } from "../lib/interface-copy";
import {
  dueReviewLessonCount,
  normalizedProgressModes,
  normalizedWeeklyEvidence,
  type DailyRecallEvidence,
  type ProgressSummary,
  type ScenarioRecommendation,
} from "../lib/progress";

export type DueReviewFilter = {
  topic?: string;
  source?: string;
  label?: string;
};

type ProgressEvidenceDashboardProps = {
  progress: ProgressSummary;
  busy: boolean;
  onStartDueReview: (filter?: DueReviewFilter) => void;
  onConfigureLesson: () => void;
  onOpenScenario: (slug: string) => void;
};

type WeakArea = {
  key: string;
  kind: "topic" | "part-of-speech";
  label: string;
  attempts: number;
  successful: number;
  errors: number;
  rate: number;
  filter: DueReviewFilter;
};

const RETAINED_COPY = learningTermCopy("retained");
const RECALL_COPY = learningTermCopy("recall");
const RETAINED_METRIC_DESCRIPTION = "Количество элементов, подтверждённых успешным самостоятельным воспроизведением после интервала.";
const DUE_EXPLANATION = "Готово к повторению означает, что наступил следующий интервал проверки памяти.";

function scenarioActionCopy(recommendation: ScenarioRecommendation): { title: string; label: string } {
  if (recommendation.reason === "resume_in_progress") {
    return {
      title: `Продолжите сценарий «${recommendation.title}» с сохранённого шага`,
      label: "Продолжить сценарий",
    };
  }
  if (recommendation.reason === "least_recently_completed") {
    return {
      title: `Вернитесь к сценарию «${recommendation.title}» для нового применения`,
      label: "Начать заново",
    };
  }
  return {
    title: `Начните рабочий сценарий «${recommendation.title}»`,
    label: "Начать сценарий",
  };
}

export function ProgressEvidenceDashboard({
  progress,
  busy,
  onStartDueReview,
  onConfigureLesson,
  onOpenScenario,
}: ProgressEvidenceDashboardProps) {
  const weekly = normalizedWeeklyEvidence(progress);
  const modes = normalizedProgressModes(progress);
  const hasRecallEvidence = weekly.recallAttempts > 0;
  const hasComparableWeeks = weekly.recallAttempts >= 3 && weekly.previousRecallAttempts >= 3;
  const weakAreas = buildWeakAreas(weekly);
  const dueLessonCount = dueReviewLessonCount(progress.dueNow);
  const scenarioRecommendation = progress.scenarios?.recommendation;
  const scenarioCopy = scenarioRecommendation ? scenarioActionCopy(scenarioRecommendation) : null;
  const dueLabel = dueLessonCount > 0
    ? progress.dueNow > dueLessonCount
      ? `Повторить первые ${dueLessonCount}`
      : `Повторить ${dueLessonCount} ${russianPlural(dueLessonCount, ["элемент", "элемента", "элементов"])}`
    : "Настроить следующий урок";
  const nextActionKind = dueLessonCount > 0
    ? "due-recall"
    : scenarioRecommendation
      ? "scenario"
      : "configure-lesson";
  const nextActionTitle = dueLessonCount > 0
    ? progress.dueNow > dueLessonCount
      ? `Сессия самостоятельного воспроизведения: первые ${dueLessonCount} из ${progress.dueNow} готовых элементов`
      : "Короткая сессия самостоятельного воспроизведения по готовой очереди"
    : scenarioCopy?.title ?? "Соберите следующий сфокусированный урок";
  const nextActionLabel = dueLessonCount > 0 ? dueLabel : scenarioCopy?.label ?? dueLabel;

  return (
    <section
      className="lx-progress-evidence"
      aria-labelledby="progress-evidence-title"
      data-progress-evidence-state={progress.reviewsTotal > 0 ? "ready" : "empty"}
    >
      <header className="lx-progress-evidence__heading">
        <p className="lx-progress-evidence__eyebrow">ПРОГРЕСС</p>
        <h1 id="progress-evidence-title">Прогресс</h1>
        <p>Доказательства долгосрочного удержания знаний</p>
      </header>

      {progress.reviewsTotal === 0 ? (
        <section className="lx-progress-evidence__empty" aria-labelledby="progress-empty-title">
          <span>НЕДОСТАТОЧНО ДАННЫХ</span>
          <h2 id="progress-empty-title">Сначала пройдите отложенную проверку</h2>
          <p>
            Открытая карточка и пассивное изучение не доказывают, что материал сохранился.
            После первой проверки «{RECALL_COPY.label}» здесь появятся недельная динамика и слабые области.
          </p>
          <button type="button" onClick={onConfigureLesson}>Настроить урок на самостоятельное воспроизведение</button>
        </section>
      ) : (
        <>
          <div className="lx-progress-evidence__dashboard">
            <article className="lx-progress-evidence__weekly" aria-labelledby="weekly-report-title">
              <p className="lx-progress-evidence__eyebrow">НЕДЕЛЬНЫЙ ОТЧЁТ</p>
              <h2 id="weekly-report-title">
                {progress.retainedItemsWeek} {russianPlural(progress.retainedItemsWeek, ["элемент сохранился", "элемента сохранились", "элементов сохранились"])} в памяти
              </h2>
              <p className="lx-progress-evidence__weekly-summary">
                {hasComparableWeeks
                  ? `Самостоятельное воспроизведение: ${weekly.previousRecallRate}% → ${weekly.recallRate}%.`
                  : hasRecallEvidence
                    ? `Самостоятельное воспроизведение за текущую неделю: ${weekly.recallRate}%. Для сравнения недель нужно минимум три попытки в каждой.`
                    : "На этой неделе ещё нет проверок самостоятельного воспроизведения. Поддержанное узнавание не заменяет воспроизведение."}
                {weekly.strongTopic ? ` Сильная тема: ${topicLabel(weekly.strongTopic.topic)}.` : ""}
              </p>

              <dl className="lx-progress-evidence__metrics">
                <Metric
                  value={progress.retainedItemsWeek}
                  label={RETAINED_COPY.label}
                  tone="retained"
                  description={RETAINED_METRIC_DESCRIPTION}
                />
                <Metric
                  value={progress.dueNow}
                  label="готово сейчас"
                  tone="retained"
                  description={DUE_EXPLANATION}
                />
                <Metric
                  value={weakAreas.length}
                  label="слабые области"
                  tone="weak"
                  description="Слабая область определяется по ошибкам самостоятельного воспроизведения за текущую неделю. Показывается не более трёх рекомендаций."
                />
              </dl>

              <div className="lx-progress-evidence__next-action" data-progress-next-action={nextActionKind}>
                <div>
                  <span>СЛЕДУЮЩЕЕ ДЕЙСТВИЕ</span>
                  <strong>{nextActionTitle}</strong>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (dueLessonCount > 0) {
                      onStartDueReview();
                    } else if (scenarioRecommendation) {
                      onOpenScenario(scenarioRecommendation.slug);
                    } else {
                      onConfigureLesson();
                    }
                  }}
                >
                  {busy ? "Готовим…" : nextActionLabel}
                </button>
              </div>

              <p className="lx-progress-evidence__definition">
                <strong>Что считается закреплённым:</strong>{" "}
                <span>{RETAINED_COPY.explanation}</span>
              </p>
            </article>

            <article className="lx-progress-evidence__trend" aria-labelledby="recall-trend-title">
              <h2 id="recall-trend-title">Воспроизведение за 7 дней</h2>
              <RecallTrend points={weekly.trend} />
              <strong className="lx-progress-evidence__rate">{weekly.recallRate}%</strong>
              <p>самостоятельное воспроизведение</p>
              <small>
                {weekly.recallSuccessful} из {weekly.recallAttempts} попыток самостоятельного воспроизведения выполнены без показа ответа.
              </small>
            </article>
          </div>

          <div className="lx-progress-evidence__secondary">
            <article className="lx-progress-evidence__weak" aria-labelledby="weak-areas-title">
              <h2 id="weak-areas-title">Слабые области</h2>
              {weakAreas.length > 0 ? (
                <ul>
                  {weakAreas.map((area, index) => (
                    <li key={area.key}>
                      <div>
                        <strong>
                          {area.kind === "topic" ? "Тема" : "Часть речи"}: {area.label}
                        </strong>
                        <small>{area.successful} из {area.attempts} попыток самостоятельного воспроизведения верны</small>
                      </div>
                      <span className={`lx-progress-evidence__topic-status ${index === 0 ? "weak" : "milestone"}`}>
                        {area.errors} {russianPlural(area.errors, ["ошибка", "ошибки", "ошибок"])}
                      </span>
                      {dueLessonCount > 0 ? (
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={area.kind === "topic"
                            ? `Повторить тему ${area.label}`
                            : `Повторить часть речи ${area.label}`}
                          onClick={() => onStartDueReview(area.filter)}
                        >
                          Повторить
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="lx-progress-evidence__positive">
                  В текущей неделе нет тем или частей речи с ошибками самостоятельного воспроизведения. Продолжайте отложенные проверки, чтобы подтвердить устойчивость результата.
                </p>
              )}
            </article>

            <article className="lx-progress-evidence__activity" aria-labelledby="activity-title">
              <h2 id="activity-title">Активность отдельно от знания</h2>
              <p className="lx-progress-evidence__activity-total">
                {weekly.reviews} ответов · {weekly.lessons} {russianPlural(weekly.lessons, ["занятие", "занятия", "занятий"])}
                {progress.scenarios ? ` · ${progress.scenarios.completedThisWeek} ${russianPlural(progress.scenarios.completedThisWeek, ["сценарий", "сценария", "сценариев"])}` : ""}
                {` · ${weekly.activeMinutes} мин.`}
              </p>
              <p>Эти данные объясняют усилие, но не заменяют отложенную проверку.</p>
              <details>
                <summary>Разделение по режимам</summary>
                <dl>
                  <div>
                    <dt>{RECALL_COPY.label}</dt>
                    <dd>
                      {weekly.recallSuccessful} / {weekly.recallAttempts} · {weekly.recallRate}%
                      <br />
                      <small>{RECALL_COPY.explanation}</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Поддержанное узнавание</dt>
                    <dd>{weekly.choiceSuccessful} / {weekly.choiceAttempts} · {weekly.choiceRate}%</dd>
                  </div>
                  <div>
                    <dt>Пассивное изучение</dt>
                    <dd>{modes.study.attemptsToday} сегодня · не входит в показатель «{RETAINED_COPY.label}»</dd>
                  </div>
                </dl>
              </details>
            </article>
          </div>
        </>
      )}
    </section>
  );
}

function buildWeakAreas(weekly: ReturnType<typeof normalizedWeeklyEvidence>): WeakArea[] {
  const topicAreas: WeakArea[] = weekly.weakTopics.map((topic) => {
    const label = topicLabel(topic.topic);
    return {
      key: `topic:${topic.topic}`,
      kind: "topic",
      label,
      attempts: topic.attempts,
      successful: topic.successful,
      errors: topic.errors,
      rate: topic.rate,
      filter: { topic: topic.topic, label },
    };
  });
  const partOfSpeechAreas: WeakArea[] = weekly.weakPartsOfSpeech.map((part) => {
    const label = partOfSpeechLabel(part.partOfSpeech);
    return {
      key: `part-of-speech:${part.partOfSpeech}`,
      kind: "part-of-speech",
      label,
      attempts: part.attempts,
      successful: part.successful,
      errors: part.errors,
      rate: part.rate,
      filter: { source: part.partOfSpeech, label },
    };
  });

  const selected: WeakArea[] = [];
  if (topicAreas[0]) selected.push(topicAreas[0]);
  if (partOfSpeechAreas[0]) selected.push(partOfSpeechAreas[0]);

  const remaining = [...topicAreas.slice(1), ...partOfSpeechAreas.slice(1)]
    .sort((left, right) => right.errors - left.errors
      || left.rate - right.rate
      || right.attempts - left.attempts
      || left.label.localeCompare(right.label, "ru"));
  return [...selected, ...remaining].slice(0, 3);
}

function Metric({
  value,
  label,
  tone,
  description,
}: {
  value: number;
  label: string;
  tone: "retained" | "weak";
  description: string;
}) {
  return (
    <div className={`lx-progress-evidence__metric ${tone}`}>
      <dt>
        {label}
        <span className="lx-progress-evidence__sr-only">. {description}</span>
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function RecallTrend({ points }: { points: DailyRecallEvidence[] }) {
  return (
    <figure className="lx-progress-evidence__chart">
      <figcaption className="lx-progress-evidence__sr-only">
        Процент успешного самостоятельного воспроизведения по дням текущей недели.
      </figcaption>
      <ol>
        {points.map((point, index) => {
          const label = dayLabel(point, index);
          const height = point.attempts > 0 ? Math.max(10, point.rate) : 0;
          return (
            <li
              key={`${point.date || "day"}-${index}`}
              aria-label={`${label}: ${point.successful} из ${point.attempts}, ${point.rate}%`}
            >
              <span className="lx-progress-evidence__bar-value">{point.attempts > 0 ? `${point.rate}%` : "—"}</span>
              <span
                className="lx-progress-evidence__bar"
                aria-hidden="true"
                style={{ "--lx-progress-bar": `${height}%` } as CSSProperties}
              />
              <span className="lx-progress-evidence__day">{label}</span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

function dayLabel(point: DailyRecallEvidence, index: number): string {
  if (point.date) {
    const date = new Date(`${point.date}T12:00:00Z`);
    if (Number.isFinite(date.getTime())) {
      return new Intl.DateTimeFormat("ru-RU", { weekday: "short" })
        .format(date)
        .replace(".", "");
    }
  }
  return ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][index] ?? `День ${index + 1}`;
}

function russianPlural(value: number, forms: [string, string, string]): string {
  const absolute = Math.abs(value) % 100;
  const last = absolute % 10;
  if (absolute > 10 && absolute < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}
