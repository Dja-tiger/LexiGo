"use client";

import type { ResourceStatus } from "../lib/account-resources";
import { partOfSpeechLabel, topicLabel } from "../lib/interface-copy";
import type { LearningItem } from "../lib/learning";
import {
  wordDetailSchedule,
  wordDetailStatus,
  type WordDetailItem,
} from "../lib/word-detail";
import { AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";
import { SpeechPlayerButton } from "./speech-player-button";

type WordDetailPresentationProps = {
  item: WordDetailItem | null;
  status: ResourceStatus;
  relatedPhrases: LearningItem[];
  relatedStatus: ResourceStatus;
  practiceStatus: ResourceStatus;
  onBack: () => void;
  onRetry: () => void;
  onRetryRelated: () => void;
  onPractice: (item: WordDetailItem) => void;
  onOpenPhrase: (phrase: LearningItem) => void;
};

function WordDetailRouteHeader({
  statusLabel,
  statusTone,
  onBack,
}: {
  statusLabel?: string;
  statusTone?: string;
  onBack: () => void;
}) {
  return (
    <header className="lx-word-detail-route-header">
      <button className="lx-word-detail-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        <span className="lx-word-detail-back-mobile">Слово</span>
        <span className="lx-word-detail-back-desktop">Словарь</span>
      </button>
      {statusLabel ? (
        <span className="lx-word-detail-status-chip" data-tone={statusTone}>
          {statusLabel}
        </span>
      ) : null}
    </header>
  );
}

function RelatedPhrases({
  phrases,
  status,
  onRetry,
  onOpen,
}: {
  phrases: LearningItem[];
  status: ResourceStatus;
  onRetry: () => void;
  onOpen: (phrase: LearningItem) => void;
}) {
  const problem = status.problem;
  return (
    <section className="lx-word-detail-related" aria-labelledby="word-detail-related-title">
      <h2 id="word-detail-related-title">Связанные фразы</h2>
      {status.phase === "loading" || status.phase === "idle" ? (
        <p className="lx-word-detail-inline-status" role="status" aria-live="polite">
          Ищем фразы с этим словом…
        </p>
      ) : null}
      {status.phase === "error" ? (
        <div className="lx-word-detail-inline-error" role="status">
          <span>{problem?.message ?? "Связанные фразы временно недоступны."}</span>
          {problem?.retryable ? <button type="button" onClick={onRetry}>Повторить</button> : null}
        </div>
      ) : null}
      {status.phase === "ready" && phrases.length === 0 ? (
        <p className="lx-word-detail-inline-status">Для этого слова пока нет связанных фраз.</p>
      ) : null}
      {phrases.length > 0 ? (
        <div className="lx-word-detail-phrase-list" role="list" aria-label="Связанные фразы">
          {phrases.map((phrase) => (
            <button
              key={phrase.id}
              type="button"
              role="listitem"
              lang="en"
              onClick={() => onOpen(phrase)}
            >
              {phrase.prompt}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function WordDetailPresentation({
  item,
  status,
  relatedPhrases,
  relatedStatus,
  practiceStatus,
  onBack,
  onRetry,
  onRetryRelated,
  onPractice,
  onOpenPhrase,
}: WordDetailPresentationProps) {
  if (!item) {
    const problem = status.problem;
    return (
      <section className="lx-word-detail" aria-label="Карточка слова">
        <WordDetailRouteHeader onBack={onBack} />
        {status.phase === "loading" || status.phase === "idle" ? (
          <AsyncSkeletonGrid label="Загружаем карточку слова" count={1} />
        ) : (
          <AsyncStatePanel
            label="Карточка слова недоступна"
            kind="error"
            title={problem?.title ?? "Не удалось открыть слово"}
            message={problem?.message ?? "Проверьте ссылку или вернитесь в словарь."}
            reference={problem?.correlationId}
            actionLabel={problem?.retryable ? "Повторить" : "Вернуться в словарь"}
            onAction={problem?.retryable ? onRetry : onBack}
          />
        )}
      </section>
    );
  }

  const learningStatus = wordDetailStatus(item.status);
  const schedule = wordDetailSchedule(item);
  const practiceProblem = practiceStatus.problem;
  const practicePending = practiceStatus.phase === "loading";

  return (
    <section className="lx-word-detail" aria-labelledby="word-detail-title">
      <WordDetailRouteHeader
        statusLabel={learningStatus.label}
        statusTone={learningStatus.tone}
        onBack={onBack}
      />

      <div className="lx-word-detail-layout">
        <article className="lx-word-detail-card">
          <header className="lx-word-detail-hero">
            <div className="lx-word-detail-term">
              <h1 id="word-detail-title" lang="en">{item.prompt}</h1>
              <p className="lx-word-detail-phonetic" lang="en">{item.phonetic || "Транскрипция не указана"}</p>
              <p className="lx-word-detail-taxonomy">
                <span>{partOfSpeechLabel(item.partOfSpeech || "word")}</span>
                <span>{topicLabel(item.topic)}</span>
              </p>
            </div>
            <SpeechPlayerButton className="lx-word-detail-speech" text={item.prompt}>
              Прослушать
            </SpeechPlayerButton>
          </header>

          <section className="lx-word-detail-meaning" aria-labelledby="word-detail-meaning-title">
            <h2 id="word-detail-meaning-title">Значение</h2>
            <p lang="ru">{item.answer}</p>
          </section>

          {item.examples.length > 0 ? (
            <section className="lx-word-detail-example" aria-labelledby="word-detail-example-title">
              <h2 id="word-detail-example-title">Пример</h2>
              <div className="lx-word-detail-example-list">
                {item.examples.map((example) => <p key={example} lang="en">{example}</p>)}
              </div>
            </section>
          ) : null}

          {item.aliases?.length ? (
            <section className="lx-word-detail-secondary-section" aria-labelledby="word-detail-aliases-title">
              <h2 id="word-detail-aliases-title">Варианты написания</h2>
              <p lang="en">{item.aliases.join(", ")}</p>
            </section>
          ) : null}

          <RelatedPhrases
            phrases={relatedPhrases}
            status={relatedStatus}
            onRetry={onRetryRelated}
            onOpen={onOpenPhrase}
          />

          {item.note ? (
            <section className="lx-word-detail-context" aria-labelledby="word-detail-context-title">
              <h2 id="word-detail-context-title">Контекст</h2>
              <p>{item.note}</p>
            </section>
          ) : null}

          <div className="lx-word-detail-actions">
            <button
              className="lx-word-detail-practice"
              type="button"
              disabled={practicePending}
              aria-busy={practicePending}
              onClick={() => onPractice(item)}
            >
              {practicePending ? "Создаём практику…" : learningStatus.action}
            </button>
          </div>

          {practiceStatus.phase === "error" ? (
            <div className="lx-word-detail-action-error" role="alert">
              <strong>{practiceProblem?.title ?? "Не удалось начать практику"}</strong>
              <span>{practiceProblem?.message ?? "Повторите попытку."}</span>
              {practiceProblem?.correlationId ? <code>{practiceProblem.correlationId}</code> : null}
            </div>
          ) : null}
        </article>

        <aside className="lx-word-detail-knowledge" aria-labelledby="word-detail-knowledge-title">
          <h2 id="word-detail-knowledge-title">Статус знания</h2>
          <strong data-tone={learningStatus.tone}>{learningStatus.label}</strong>
          <p>{learningStatus.description}</p>
          <dl>
            <div>
              <dt>Следующее повторение</dt>
              <dd>{schedule.due}</dd>
            </div>
            <div>
              <dt>Текущий интервал</dt>
              <dd>{schedule.interval}</dd>
            </div>
            <div>
              <dt>Повторений</dt>
              <dd>{schedule.repetitions}</dd>
            </div>
            <div>
              <dt>Последнее повторение</dt>
              <dd>{schedule.lastReviewed}</dd>
            </div>
          </dl>
          <button
            type="button"
            disabled={practicePending}
            aria-busy={practicePending}
            onClick={() => onPractice(item)}
          >
            {practicePending ? "Создаём практику…" : learningStatus.action}
          </button>
        </aside>
      </div>
    </section>
  );
}
