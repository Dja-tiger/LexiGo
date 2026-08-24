"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";

import {
  activeLessonChoiceState,
  activeLessonConfidenceAvailable,
  activeLessonEyebrow,
  activeLessonFeedbackKind,
  activeLessonModeLabel,
  activeLessonSelectionReasonText,
  type ActiveLessonFeedbackKind,
} from "../lib/active-lesson-presentation";
import {
  exercisePromptLabel,
  normalizeAnswer,
  type LearningItem,
} from "../lib/learning";
import {
  ratingLabel,
  type AnswerMode,
  type ReviewRating,
} from "../lib/progress";
import { SpeechPlayerButton } from "./speech-player-button";

const LESSON_EXIT_REQUEST_EVENT = "lexigo:request-lesson-exit";
const LESSON_REVIEW_QUEUED_EVENT = "lexigo:lesson-review-queued";

type LessonReviewQueuedDetail = {
  wordId: number;
};

export type ActiveLessonReviewFeedback = {
  requestedRating: ReviewRating;
  effectiveRating: ReviewRating;
  correct?: boolean;
  judgementReason: string;
  matchedAnswer?: string;
  suggestionAvailable: boolean;
};

export type ActiveLessonAdvance = {
  canAdvance: boolean;
  label: string;
};

type ActiveLessonPresentationProps = {
  mode: AnswerMode;
  item: LearningItem;
  currentIndex: number;
  itemCount: number;
  progressPercent: number;
  typedAnswer: string;
  selectedAnswer: string;
  expectedAnswer: string;
  answerOptions: string[];
  revealed: boolean;
  localCorrect: boolean;
  currentRating?: ReviewRating;
  reviewing: boolean;
  reviewFeedback: ActiveLessonReviewFeedback | null;
  suggestionStatus: "idle" | "submitting" | "submitted" | "error";
  suggestionError: string;
  advance: ActiveLessonAdvance;
  advanceButtonRef: RefObject<HTMLButtonElement | null>;
  onTypedAnswerChange: (value: string) => void;
  onReveal: () => void;
  onChoice: (answer: string) => void;
  onRate: (rating: ReviewRating, submittedAt: number, restoreFocusAfterSave: boolean) => void;
  onAdvance: () => void;
  onExit: () => void;
  onSubmitSuggestion: () => void;
};

function feedbackTitle(kind: ActiveLessonFeedbackKind): string {
  if (kind === "correct") return "Ответ принят";
  if (kind === "incorrect") return "Ответ не принят";
  if (kind === "study") return "Изучение готово к сохранению";
  return "Ответ подготовлен";
}

function feedbackMessage(
  kind: ActiveLessonFeedbackKind,
  feedback: ActiveLessonReviewFeedback | null,
): string {
  if (kind === "correct") {
    return feedback?.judgementReason === "accepted_normalized"
      ? "Ответ принят после нормализации регистра, пробелов и пунктуации."
      : "Формулировка совпала с допустимым вариантом.";
  }
  if (kind === "incorrect") {
    if (feedback?.judgementReason === "rejected_no_answer") {
      return "Ответ не был введён. Для расписания применено «Не знал».";
    }
    return feedback
      ? `Самооценка «${ratingLabel(feedback.requestedRating)}» сохранена, для расписания применено «${ratingLabel(feedback.effectiveRating)}».`
      : "Покажем правильный вариант и вернём элемент позже.";
  }
  if (kind === "study") {
    return feedback
      ? "Пассивное изучение сохранено отдельно и не считается объективным воспроизведением."
      : "Выберите уверенность: изучение не будет засчитано как самостоятельное воспроизведение.";
  }
  return "Выберите уверенность, чтобы сервер сохранил результат и вычислил следующую позицию.";
}

function FeedbackIcon({ kind }: { kind: ActiveLessonFeedbackKind }) {
  return (
    <span className="lx-active-lesson__feedback-icon" aria-hidden="true">
      {kind === "correct" ? "✓" : kind === "incorrect" ? "!" : kind === "study" ? "i" : "→"}
    </span>
  );
}

function isQueuedReviewDetail(value: unknown): value is LessonReviewQueuedDetail {
  if (!value || typeof value !== "object") return false;
  const detail = value as Partial<LessonReviewQueuedDetail>;
  return Number.isSafeInteger(detail.wordId);
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ));
}

export function ActiveLessonPresentation({
  mode,
  item,
  currentIndex,
  itemCount,
  progressPercent,
  typedAnswer,
  selectedAnswer,
  expectedAnswer,
  answerOptions,
  revealed,
  localCorrect,
  currentRating,
  reviewing,
  reviewFeedback,
  suggestionStatus,
  suggestionError,
  advance,
  advanceButtonRef,
  onTypedAnswerChange,
  onReveal,
  onChoice,
  onRate,
  onAdvance,
  onExit,
  onSubmitSuggestion,
}: ActiveLessonPresentationProps) {
  const [exitOpen, setExitOpen] = useState(false);
  const [queuedReviewWordId, setQueuedReviewWordId] = useState<number | null>(null);
  const exitDialogRef = useRef<HTMLElement | null>(null);
  const cancelExitRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const queuedFeedbackRef = useRef<HTMLDivElement | null>(null);
  const modeLabel = activeLessonModeLabel(mode);
  const feedbackKind = activeLessonFeedbackKind(mode, revealed, reviewFeedback?.correct);
  const confidenceAvailable = activeLessonConfidenceAvailable(mode, revealed);
  const selectionReasonText = activeLessonSelectionReasonText(item.selectionReason);
  const phraseCloze = item.kind === "phrase" && Boolean(item.cloze);
  const answerLanguage = phraseCloze ? "en" : "ru";
  const answerSubmitted = typedAnswer.trim() || selectedAnswer.trim();
  const queuedReview = item.wordId !== undefined && queuedReviewWordId === item.wordId;

  const requestExit = useCallback((trigger?: HTMLElement | null) => {
    returnFocusRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setExitOpen(true);
  }, []);

  const cancelExit = useCallback(() => {
    setExitOpen(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus({ preventScroll: true }));
  }, []);

  useLayoutEffect(() => {
    const handleExternalExitRequest = () => requestExit();
    window.addEventListener(LESSON_EXIT_REQUEST_EVENT, handleExternalExitRequest);
    return () => window.removeEventListener(LESSON_EXIT_REQUEST_EVENT, handleExternalExitRequest);
  }, [requestExit]);

  useEffect(() => {
    const handleQueuedReview = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isQueuedReviewDetail(event.detail)) return;
      if (item.wordId === undefined || event.detail.wordId !== item.wordId) return;
      setQueuedReviewWordId(event.detail.wordId);
    };
    window.addEventListener(LESSON_REVIEW_QUEUED_EVENT, handleQueuedReview);
    return () => window.removeEventListener(LESSON_REVIEW_QUEUED_EVENT, handleQueuedReview);
  }, [item.wordId]);

  useEffect(() => {
    if (!exitOpen) return;
    cancelExitRef.current?.focus({ preventScroll: true });
  }, [exitOpen]);

  useEffect(() => {
    if (!revealed || mode === "study" || queuedReview) return;
    feedbackRef.current?.focus({ preventScroll: true });
  }, [item.id, mode, queuedReview, revealed]);

  useEffect(() => {
    if (!queuedReview) return;
    queuedFeedbackRef.current?.focus({ preventScroll: true });
  }, [queuedReview]);

  function handleRecallKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !typedAnswer.trim() || queuedReview) return;
    event.preventDefault();
    onReveal();
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelExit();
      return;
    }
    if (event.key !== "Tab") return;
    const dialog = exitDialogRef.current;
    if (!dialog) return;
    const controls = focusableElements(dialog);
    if (controls.length === 0) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && event.target === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleRating(event: MouseEvent<HTMLButtonElement>) {
    if (queuedReview) return;
    const value = event.currentTarget.dataset.rating;
    if (value !== "again" && value !== "almost" && value !== "known") return;
    onRate(value, event.timeStamp, document.activeElement === event.currentTarget);
  }

  const renderFeedback = () => {
    if (feedbackKind === "idle") return null;
    return (
      <div
        ref={feedbackRef}
        className={`lx-active-lesson__feedback lx-active-lesson__feedback--${feedbackKind}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        data-feedback-kind={feedbackKind}
      >
        <FeedbackIcon kind={feedbackKind} />
        <div>
          <strong>{feedbackTitle(feedbackKind)}</strong>
          <p>{feedbackMessage(feedbackKind, reviewFeedback)}</p>
          {reviewFeedback?.matchedAnswer ? (
            <small>Принятая форма: <span lang={answerLanguage}>{reviewFeedback.matchedAnswer}</span></small>
          ) : null}
          {reviewFeedback?.suggestionAvailable && suggestionStatus !== "submitted" ? (
            <button
              className="lx-active-lesson__text-action"
              type="button"
              disabled={suggestionStatus === "submitting"}
              onClick={onSubmitSuggestion}
            >
              {suggestionStatus === "submitting" ? "Отправляем…" : "Мой вариант тоже верный"}
            </button>
          ) : null}
          {suggestionStatus === "submitted" ? (
            <small className="lx-active-lesson__suggestion-success">Вариант отправлен на проверку. Текущий результат и расписание не изменены.</small>
          ) : null}
          {suggestionStatus === "error" ? (
            <small className="lx-active-lesson__suggestion-error" role="alert">{suggestionError}</small>
          ) : null}
        </div>
      </div>
    );
  };

  const renderQueuedReview = () => queuedReview ? (
    <div
      ref={queuedFeedbackRef}
      className="lx-active-lesson__queued-review"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={-1}
      data-review-queued="true"
    >
      <span aria-hidden="true">⌁</span>
      <div>
        <strong>Ответ сохранён на устройстве</strong>
        <p>Введённый ответ и оценка остаются на этой карточке. Следующая карточка откроется после восстановления сети и подтверждения серверной позиции.</p>
      </div>
    </div>
  ) : null;

  return (
    <section
      className="lx-active-lesson"
      data-active-lesson-mode={mode}
      data-active-lesson-state={queuedReview ? "queued" : reviewFeedback ? feedbackKind : revealed ? "revealed" : "prompt"}
      aria-labelledby="active-lesson-mode-title"
    >
      <header className="lx-active-lesson__topbar">
        <strong className="lx-active-lesson__brand" aria-label="LexiGo">LexiGo</strong>
        <button
          className="lx-active-lesson__mobile-back"
          type="button"
          aria-label="Назад — сохранить и выйти из урока"
          onClick={(event) => requestExit(event.currentTarget)}
        >
          <span aria-hidden="true">←</span>
        </button>
        <strong id="active-lesson-mode-title" className="lx-active-lesson__mode">{modeLabel}</strong>
        <span
          className="lx-active-lesson__saved"
          aria-label={queuedReview ? "Ответ сохранён только на этом устройстве и ожидает синхронизации" : "Прогресс сохранён до текущей карточки"}
        >
          {queuedReview ? "На устройстве" : "Сохранено"}
        </span>
        <button
          className="lx-active-lesson__mobile-close"
          type="button"
          onClick={(event) => requestExit(event.currentTarget)}
        >
          Закрыть
        </button>
      </header>

      <div className="lx-active-lesson__workspace">
        <div className="lx-active-lesson__progress-row">
          <div className="lx-active-lesson__progress-copy">
            <span className="lx-visually-hidden">Прогресс урока</span>
            <div
              className="lx-active-lesson__progress-track"
              role="progressbar"
              aria-label="Прогресс урока"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-valuetext={`${currentIndex + 1} из ${itemCount} элементов`}
            >
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <span>{currentIndex + 1} из {itemCount}</span>
          </div>
          <button
            className="lx-active-lesson__desktop-close"
            type="button"
            onClick={(event) => requestExit(event.currentTarget)}
          >
            Закрыть урок
          </button>
        </div>

        <article className="lx-active-lesson__card" aria-labelledby="active-lesson-prompt">
          <span className="lx-active-lesson__eyebrow">
            {activeLessonEyebrow(mode, item.kind)}
            {selectionReasonText ? ` · ${selectionReasonText}` : ""}
          </span>

          {mode === "study" ? (
            <div className="lx-active-lesson__study">
              <h1 id="active-lesson-prompt" lang="en">{item.prompt}</h1>
              {item.phonetic ? <p className="lx-active-lesson__phonetic" lang="en">{item.phonetic}</p> : null}
              <div className="lx-active-lesson__example">
                {item.examples[0] ? <strong lang="en">{item.examples[0]}</strong> : <strong lang="en">{item.prompt}</strong>}
                <span lang="ru">{item.answer}</span>
              </div>
              <div className="lx-active-lesson__utilities">
                <SpeechPlayerButton text={item.prompt}>Прослушать</SpeechPlayerButton>
                {item.note ? <span>{item.note}</span> : null}
              </div>
            </div>
          ) : mode === "recall" ? (
            <div className="lx-active-lesson__recall">
              <p>{exercisePromptLabel(item)}</p>
              <h1 id="active-lesson-prompt" lang="en">{phraseCloze ? item.cloze : item.prompt}</h1>
              <label htmlFor="premium-answer" className="lx-visually-hidden">Введите ответ</label>
              <input
                id="premium-answer"
                lang={answerLanguage}
                value={typedAnswer}
                readOnly={Boolean(currentRating) || reviewing || queuedReview}
                aria-describedby={revealed ? "active-lesson-feedback-note" : undefined}
                onInput={(event) => onTypedAnswerChange(event.currentTarget.value)}
                onKeyDown={handleRecallKeyDown}
                placeholder="Введите ответ…"
                autoComplete="off"
              />
              {!revealed ? (
                <div className="lx-active-lesson__answer-actions">
                  <button
                    className="lx-active-lesson__text-action"
                    type="button"
                    disabled={queuedReview}
                    onClick={onReveal}
                  >
                    Не помню — показать ответ
                  </button>
                  <button
                    className="lx-active-lesson__primary"
                    type="button"
                    aria-label="Сверить ответ"
                    disabled={!typedAnswer.trim() || queuedReview}
                    onClick={onReveal}
                  >
                    Проверить ответ
                  </button>
                </div>
              ) : null}
              {revealed ? (
                <p id="active-lesson-feedback-note" className="lx-active-lesson__expected-answer">
                  Правильный ответ: <strong lang={answerLanguage}>{expectedAnswer}</strong>
                  {answerSubmitted ? <span>{localCorrect ? "Предварительно совпадает." : "Есть различие; итог определит сервер."}</span> : null}
                </p>
              ) : null}
              {renderFeedback()}
            </div>
          ) : (
            <div className="lx-active-lesson__choice">
              <h1 id="active-lesson-prompt" lang="en">{phraseCloze ? item.cloze : item.prompt}</h1>
              <p>Выберите наиболее точный технический эквивалент.</p>
              <div className="lx-active-lesson__options" role="group" aria-label="Варианты ответа">
                {answerOptions.map((answer) => {
                  const state = activeLessonChoiceState(
                    answer,
                    selectedAnswer,
                    expectedAnswer,
                    revealed,
                    normalizeAnswer,
                  );
                  const stateLabel = state === "correct"
                    ? "верный вариант"
                    : state === "incorrect"
                      ? "выбран неверно"
                      : state === "selected"
                        ? "выбрано"
                        : "";
                  return (
                    <button
                      key={answer}
                      type="button"
                      lang={answerLanguage}
                      className={`lx-active-lesson__option lx-active-lesson__option--${state}`}
                      aria-pressed={normalizeAnswer(answer) === normalizeAnswer(selectedAnswer)}
                      aria-label={stateLabel ? `${answer}: ${stateLabel}` : answer}
                      disabled={Boolean(currentRating) || reviewing || queuedReview}
                      onClick={() => onChoice(answer)}
                    >
                      <span>{answer}</span>
                      {stateLabel ? <small>{stateLabel}</small> : null}
                    </button>
                  );
                })}
              </div>
              {renderFeedback()}
            </div>
          )}

          {mode === "study" ? renderFeedback() : null}
          {renderQueuedReview()}

          {queuedReview ? (
            <button
              ref={advanceButtonRef}
              className="lx-active-lesson__primary lx-active-lesson__advance"
              type="button"
              disabled
            >
              Ожидаем синхронизацию
            </button>
          ) : currentRating ? (
            <button
              ref={advanceButtonRef}
              className="lx-active-lesson__primary lx-active-lesson__advance"
              type="button"
              disabled={!advance.canAdvance}
              onClick={onAdvance}
            >
              {advance.label}
            </button>
          ) : mode === "study" ? (
            <button
              ref={advanceButtonRef}
              className="lx-active-lesson__primary lx-active-lesson__advance"
              type="button"
              disabled
            >
              Сначала выберите уверенность
            </button>
          ) : null}
        </article>

        <fieldset
          className="lx-active-lesson__confidence"
          disabled={!confidenceAvailable || Boolean(currentRating) || reviewing || queuedReview}
          aria-describedby="active-lesson-confidence-note"
          aria-busy={reviewing}
        >
          <legend>Насколько уверенно вы вспомнили?</legend>
          <div>
            <button className="lx-active-lesson__rating lx-active-lesson__rating--again" type="button" data-rating="again" onClick={handleRating}>Не знал</button>
            <button className="lx-active-lesson__rating lx-active-lesson__rating--almost" type="button" data-rating="almost" onClick={handleRating}>Почти</button>
            <button className="lx-active-lesson__rating lx-active-lesson__rating--known" type="button" data-rating="known" onClick={handleRating}>{reviewing ? "Сохраняем…" : "Знал"}</button>
          </div>
        </fieldset>
        <p id="active-lesson-confidence-note" className="lx-active-lesson__confidence-note">
          {queuedReview
            ? "Оценка сохранена на устройстве и недоступна для повторной отправки до синхронизации."
            : currentRating
              ? `Самооценка сохранена: ${ratingLabel(currentRating)}. Ответ оценивается отдельно от уверенности.`
              : "Ответ оценивается отдельно от уверенности."}
        </p>

        <button
          className="lx-visually-hidden"
          type="button"
          disabled
          aria-label="← Предыдущее недоступно"
          title="Активный урок проходит в серверном порядке"
        >
          ← Предыдущее недоступно
        </button>
        <p className="lx-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          {queuedReview
            ? "Ответ сохранён на устройстве и ожидает синхронизации."
            : reviewing
              ? "Сохраняем оценку."
              : currentRating
                ? `Оценка сохранена: ${ratingLabel(currentRating)}.`
                : ""}
        </p>
      </div>

      {exitOpen ? (
        <div className="lx-active-lesson__dialog-backdrop" role="presentation">
          <section
            ref={exitDialogRef}
            className="lx-active-lesson__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="active-lesson-exit-title"
            aria-describedby="active-lesson-exit-description"
            onKeyDown={handleDialogKeyDown}
          >
            <span className="lx-active-lesson__eyebrow">БЕЗОПАСНЫЙ ВЫХОД</span>
            <h2 id="active-lesson-exit-title">Закрыть урок?</h2>
            <p id="active-lesson-exit-description">
              {queuedReview
                ? "Ответ текущей карточки сохранён на этом устройстве и будет отправлен после восстановления соединения. Продолжение останется на этой позиции до подтверждения сервера."
                : "Уже отправленные оценки сохранены. Несохранённый ответ текущей карточки будет сброшен, а продолжение начнётся с этой же позиции."}
            </p>
            <div>
              <button ref={cancelExitRef} className="lx-active-lesson__secondary" type="button" onClick={cancelExit}>Продолжить урок</button>
              <button className="lx-active-lesson__primary" type="button" onClick={onExit}>Сохранить и выйти</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
