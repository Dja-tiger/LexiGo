"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FocusEvent,
  type PropsWithChildren,
} from "react";

import {
  INITIAL_FEEDBACK_STATE,
  createFeedbackItem,
  feedbackReducer,
  type FeedbackInput,
  type FeedbackItem,
} from "../lib/feedback";

type FeedbackController = {
  publish: (input: FeedbackInput) => string;
  dismiss: (id: string) => void;
  clearKey: (key: string) => void;
};

const FeedbackContext = createContext<FeedbackController | null>(null);

export function useFeedback(): FeedbackController {
  const controller = useContext(FeedbackContext);
  if (!controller) {
    throw new Error("useFeedback must be used inside FeedbackCenter");
  }
  return controller;
}

type FeedbackCardProps = {
  item: FeedbackItem;
  onDismiss: (id: string) => void;
  onPause?: () => void;
  onResume?: (event?: FocusEvent<HTMLElement>) => void;
  paused?: boolean;
  queuedCount?: number;
};

function FeedbackCard({
  item,
  onDismiss,
  onPause,
  onResume,
  paused = false,
  queuedCount = 0,
}: FeedbackCardProps) {
  return (
    <section
      className={`lx-feedback lx-feedback--${item.presentation} lx-feedback--${item.category}`}
      data-feedback-id={item.id}
      data-feedback-category={item.category}
      data-feedback-presentation={item.presentation}
      data-feedback-duration-ms={item.durationMs ?? "persistent"}
      data-feedback-paused={paused ? "true" : "false"}
      data-feedback-queued={queuedCount}
      role={item.role}
      aria-live={item.live}
      aria-atomic="true"
      onMouseEnter={onPause}
      onMouseLeave={() => onResume?.()}
      onFocus={onPause}
      onBlur={(event) => onResume?.(event)}
    >
      <div className="lx-feedback__copy">
        {item.title ? <strong>{item.title}</strong> : null}
        <span>{item.message}</span>
      </div>
      <div className="lx-feedback__actions">
        {item.action ? (
          <button type="button" onClick={item.action.onInvoke}>
            {item.action.label}
          </button>
        ) : null}
        {item.dismissible ? (
          <button type="button" onClick={() => onDismiss(item.id)} aria-label="Закрыть уведомление">
            Закрыть
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function FeedbackCenter({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(feedbackReducer, INITIAL_FEEDBACK_STATE);
  const [pausedToastID, setPausedToastID] = useState<string | null>(null);
  const sequenceRef = useRef(0);

  const publish = useCallback((input: FeedbackInput) => {
    sequenceRef.current += 1;
    const id = `feedback-${sequenceRef.current}`;
    dispatch({ type: "publish", item: createFeedbackItem(id, input) });
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setPausedToastID((current) => current === id ? null : current);
    dispatch({ type: "dismiss", id });
  }, []);

  const clearKey = useCallback((key: string) => {
    setPausedToastID(null);
    dispatch({ type: "clear-key", key });
  }, []);

  const controller = useMemo<FeedbackController>(() => ({ publish, dismiss, clearKey }), [clearKey, dismiss, publish]);
  const activeToast = state.activeToast;
  const toastPaused = activeToast !== null && pausedToastID === activeToast.id;

  useEffect(() => {
    if (!activeToast || activeToast.durationMs === null || toastPaused) return;
    const timer = window.setTimeout(() => {
      dispatch({ type: "dismiss", id: activeToast.id });
    }, activeToast.durationMs);
    return () => window.clearTimeout(timer);
  }, [activeToast, toastPaused]);

  const resumeToast = useCallback((event?: FocusEvent<HTMLElement>) => {
    if (event?.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setPausedToastID(null);
  }, []);

  return (
    <FeedbackContext.Provider value={controller}>
      {children}
      {state.banners.length > 0 || activeToast ? (
        <aside className="lx-feedback-center" aria-label="Системные уведомления" data-feedback-center="true">
          {state.banners.map((banner) => (
            <FeedbackCard key={banner.id} item={banner} onDismiss={dismiss} />
          ))}
          {activeToast ? (
            <FeedbackCard
              key={activeToast.id}
              item={activeToast}
              onDismiss={dismiss}
              onPause={() => setPausedToastID(activeToast.id)}
              onResume={resumeToast}
              paused={toastPaused}
              queuedCount={state.toastQueue.length}
            />
          ) : null}
        </aside>
      ) : null}
    </FeedbackContext.Provider>
  );
}
