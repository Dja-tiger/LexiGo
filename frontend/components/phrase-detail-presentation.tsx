"use client";

import type { ResourceStatus } from "../lib/account-resources";
import { learningTermCopy } from "../lib/interface-copy";
import { phraseStatusLabel, phraseTopicLabel, type PhraseItem } from "../lib/phrases";
import { AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";
import { SpeechPlayerButton } from "./speech-player-button";

type PhraseDetailPresentationProps = {
  authenticated: boolean;
  phrase: PhraseItem | null;
  status: ResourceStatus;
  onBack: () => void;
  onRetry: () => void;
  onConfigureLesson: () => void;
  onRequireAuthentication: () => void;
};

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18 6a8 8 0 0 1 0 12" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function PhraseContent({ phrase }: { phrase: PhraseItem }) {
  const examples = phrase.examples.filter((example) => example.trim()).slice(0, 3);
  const clozeCopy = learningTermCopy("cloze");
  return (
    <>
      <header className="lx-phrase-detail-hero">
        <div className="lx-phrase-detail-kicker">
          <span>{phraseTopicLabel(phrase.topic)}</span>
          <span data-phrase-status={phrase.status}>{phraseStatusLabel(phrase.status)}</span>
        </div>
        <div className="lx-phrase-detail-title-row">
          <div>
            <h1 lang="en">{phrase.prompt}</h1>
            <p>{phrase.answer}</p>
            {phrase.phonetic ? <small lang="en">{phrase.phonetic}</small> : null}
          </div>
          <SpeechPlayerButton text={phrase.prompt} className="lx-phrase-listen">
            <SoundIcon />
            <span>Прослушать</span>
          </SpeechPlayerButton>
        </div>
      </header>

      <section className="lx-phrase-detail-section" aria-labelledby="phrase-meaning-heading">
        <span className="lx-phrase-detail-section-icon" aria-hidden="true">Aa</span>
        <div>
          <h2 id="phrase-meaning-heading">Смысл и употребление</h2>
          <p>{phrase.note || "Используйте эту формулировку целиком, сохраняя естественный порядок слов и контекст."}</p>
        </div>
      </section>

      {phrase.cloze ? (
        <section className="lx-phrase-detail-section lx-phrase-cloze" aria-labelledby="phrase-cloze-heading">
          <span className="lx-phrase-detail-section-icon" aria-hidden="true">…</span>
          <div>
            <h2 id="phrase-cloze-heading">{clozeCopy.label}</h2>
            <p className="lx-phrase-cloze-explanation">{clozeCopy.explanation}</p>
            <p lang="en">{phrase.cloze}</p>
            {phrase.clozeAnswer ? <small>Ответ: <span lang="en">{phrase.clozeAnswer}</span></small> : null}
          </div>
        </section>
      ) : null}

      <section className="lx-phrase-detail-section" aria-labelledby="phrase-examples-heading">
        <span className="lx-phrase-detail-section-icon"><BookIcon /></span>
        <div>
          <h2 id="phrase-examples-heading">Примеры в контексте</h2>
          {examples.length > 0 ? (
            <ul>
              {examples.map((example) => <li key={example} lang="en">{example}</li>)}
            </ul>
          ) : <p>Для этой фразы пока нет отдельного примера.</p>}
        </div>
      </section>

      <aside className="lx-phrase-usage-note" aria-label="Подсказка по использованию">
        <strong>Подсказка</strong>
        <p>Произнесите фразу вслух, затем воспроизведите её без подсказки в похожей рабочей или бытовой ситуации.</p>
      </aside>
    </>
  );
}

export function PhraseDetailPresentation({
  authenticated,
  phrase,
  status,
  onBack,
  onRetry,
  onConfigureLesson,
  onRequireAuthentication,
}: PhraseDetailPresentationProps) {
  return (
    <section className="lx-phrase-detail" aria-label="Карточка фразы">
      <button className="lx-phrase-detail-back" type="button" onClick={onBack}>
        <BackIcon />
        <span>К списку фраз</span>
      </button>

      {status.phase === "loading" ? <AsyncSkeletonGrid label="Загружаем карточку фразы" count={3} /> : null}
      {status.phase === "error" && status.problem ? (
        <AsyncStatePanel
          label="Карточка фразы: ошибка загрузки"
          kind="error"
          title={status.problem.title}
          message={status.problem.message}
          actionLabel={status.problem.retryable ? "Повторить" : undefined}
          onAction={status.problem.retryable ? onRetry : undefined}
          secondaryActionLabel={!authenticated ? "Войти" : "Вернуться к каталогу"}
          onSecondaryAction={!authenticated ? onRequireAuthentication : onBack}
          reference={status.problem.correlationId || status.problem.code}
        />
      ) : null}

      {status.phase === "ready" && phrase ? (
        <div className="lx-detail-card lx-phrase-detail-layout">
          <article className="lx-phrase-detail-main">
            <PhraseContent phrase={phrase} />
            <div className="lx-phrase-detail-actions">
              <button className="lx-phrase-detail-primary" type="button" onClick={onConfigureLesson}>Настроить урок</button>
              <button className="lx-phrase-detail-secondary" type="button" onClick={onBack}>К другим фразам</button>
            </div>
          </article>
          <aside className="lx-phrase-detail-side" aria-label="Практика фразы">
            <span>{phraseTopicLabel(phrase.topic)}</span>
            <strong lang="en">{phrase.prompt}</strong>
            <p>{phraseStatusLabel(phrase.status)}. Добавьте тему в сфокусированный урок, чтобы закрепить формулировку.</p>
            <button type="button" onClick={onConfigureLesson}>Начать практику</button>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
