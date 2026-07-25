"use client";

import type { CSSProperties } from "react";

import {
  normalizedProgressModes,
  normalizedWeeklyEvidence,
  type DailyRecallEvidence,
  type ProgressSummary,
} from "../lib/progress";

type ProgressEvidenceDashboardProps = {
  progress: ProgressSummary;
  busy: boolean;
  onStartDueReview: (topic?: string) => void;
  onConfigureLesson: () => void;
};

const RETAINED_EXPLANATION = "Элемент засчитывается только после успешного более позднего самостоятельного воспроизведения.";
const DUE_EXPLANATION = "Готово к повторению означает, что наступил следующий интервал проверки памяти.";

export function ProgressEvidenceDashboard({
  progress,
  busy,
  onStartDueReview,
  onConfigureLesson,
}: ProgressEvidenceDashboardProps) {
  const weekly = normalizedWeeklyEvidence(progress);
  const modes = normalizedProgressModes(progress);
  const hasRecallEvidence = weekly.recallAttempts > 0;
  const hasComparableWeeks = weekly.recallAttempts >= 3 && weekly.previousRecallAttempts >= 3;
  const weakTopics = weekly.weakTopics.slice(0, 3);
  const primaryTopic = weakTopics[0]?.topic;
  const dueLabel = progress.dueNow > 0
    ? `Повторить ${progress.dueNow} ${russianPlural(progress.dueNow, ["элемент", "элемента", "элементов"])}`
    : "Настроить следующий урок";

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
            После первого самостоятельного Recall здесь появятся недельная динамика и слабые темы.
          </p>
          <button type="button" onClick={onConfigureLesson}>Настроить Recall-урок</button>
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
                    : "На этой неделе ещё нет самостоятельных Recall-проверок. Поддержанное узнавание не заменяет воспроизведение."}
                {weekly.strongTopic ? ` Сильная тема: ${weekly.strongTopic.topic}.` : ""}
              </p>

              <dl className="lx-progress-evidence__metrics">
                <Metric
                  value={progress.retainedItemsWeek}
                  label="сохранено"
                  tone="retained"
                  description={RETAINED_EXPLANATION}
                />
                <Metric
                  value={progress.dueNow}
                  label="готово сейчас"
                  tone="retained"
                  description={DUE_EXPLANATION}
                />
                <Metric
                  value={weakTopics.length}
                  label="слабые темы"
                  tone="weak"
                  description="Слабая тема определяется по ошибкам самостоятельного Recall за текущую неделю."
                />
              </dl>

              <div className="lx-progress-evidence__next-action">
                <div>
                  <span>СЛЕДУЮЩЕЕ ДЕЙСТВИЕ</span>
                  <strong>
                    {progress.dueNow > 0
                      ? primaryTopic
                        ? `Короткая Recall-сессия по теме ${primaryTopic}`
                        : "Короткая Recall-сессия по готовой очереди"
                      : "Соберите следующий сфокусированный урок"}
                  </strong>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => progress.dueNow > 0 ? onStartDueReview(primaryTopic) : onConfigureLesson()}
                >
                  {busy ? "Готовим…" : dueLabel}
                </button>
              </div>

              <p className="lx-progress-evidence__definition">
                <strong>Что считается сохранённым:</strong> {RETAINED_EXPLANATION}
              </p>
            </article>

            <article className="lx-progress-evidence__trend" aria-labelledby="recall-trend-title">
              <h2 id="recall-trend-title">Воспроизведение за 7 дней</h2>
              <RecallTrend points={weekly.trend} />
              <strong className="lx-progress-evidence__rate">{weekly.recallRate}%</strong>
              <p>самостоятельное воспроизведение</p>
              <small>
                {weekly.recallSuccessful} из {weekly.recallAttempts} Recall-попыток выполнены без показа ответа.
              </small>
            </article>
          </div>

          <div className="lx-progress-evidence__secondary">
            <article className="lx-progress-evidence__weak" aria-labelledby="weak-topics-title">
              <h2 id="weak-topics-title">Слабые темы</h2>
              {weakTopics.length > 0 ? (
                <ul>
                  {weakTopics.map((topic, index) => (
                    <li key={topic.topic}>
                      <div>
                        <strong>{topic.topic}</strong>
                        <small>{topic.successful} из {topic.attempts} Recall-попыток верны</small>
                      </div>
                      <span className={`lx-progress-evidence__topic-status ${index === 0 ? "weak" : "milestone"}`}>
                        {topic.errors} {russianPlural(topic.errors, ["ошибка", "ошибки", "ошибок"])}
                      </span>
                      {progress.dueNow > 0 ? (
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={`Повторить тему ${topic.topic}`}
                          onClick={() => onStartDueReview(topic.topic)}
                        >
                          Повторить
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="lx-progress-evidence__positive">
                  В текущей неделе нет тем с ошибками Recall. Продолжайте отложенные проверки, чтобы подтвердить устойчивость результата.
                </p>
              )}
            </article>

            <article className="lx-progress-evidence__activity" aria-labelledby="activity-title">
              <h2 id="activity-title">Активность отдельно от знания</h2>
              <p className="lx-progress-evidence__activity-total">
                {weekly.reviews} ответов · {weekly.lessons} {russianPlural(weekly.lessons, ["занятие", "занятия", "занятий"])} · {weekly.activeMinutes} мин.
              </p>
              <p>Эти данные объясняют усилие, но не заменяют отложенную проверку.</p>
              <details>
                <summary>Разделение по режимам</summary>
                <dl>
                  <div>
                    <dt>Самостоятельный Recall</dt>
                    <dd>{weekly.recallSuccessful} / {weekly.recallAttempts} · {weekly.recallRate}%</dd>
                  </div>
                  <div>
                    <dt>Поддержанное узнавание</dt>
                    <dd>{weekly.choiceSuccessful} / {weekly.choiceAttempts} · {weekly.choiceRate}%</dd>
                  </div>
                  <div>
                    <dt>Пассивное изучение</dt>
                    <dd>{modes.study.attemptsToday} сегодня · не входит в retained</dd>
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
      <dt>{label}</dt>
      <dd>{value}</dd>
      <span className="lx-progress-evidence__sr-only">{description}</span>
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
