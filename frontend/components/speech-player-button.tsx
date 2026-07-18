"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  isSpeechCancellationError,
  normalizeSpeechText,
  selectEnglishVoice,
  speechControlLabel,
  type SpeechPlaybackState,
} from "../lib/speech-player";

type SpeechPlayerButtonProps = {
  text: string;
  children: ReactNode;
  className?: string;
  lang?: string;
  rate?: number;
};

type SpeechPlaybackSnapshot = {
  text: string;
  state: SpeechPlaybackState;
  message: string;
};

const UNSUPPORTED_MESSAGE = "Озвучивание недоступно в этом браузере. Используйте системный переводчик или другой браузер.";

function playbackFailureMessage(): string {
  return "Не удалось воспроизвести произношение. Проверьте звук и повторите попытку.";
}

export function SpeechPlayerButton({
  text,
  children,
  className = "",
  lang = "en-US",
  rate = 0.88,
}: SpeechPlayerButtonProps) {
  const value = normalizeSpeechText(text);
  const feedbackID = useId();
  const [playback, setPlayback] = useState<SpeechPlaybackSnapshot>(() => ({
    text: value,
    state: "idle",
    message: "",
  }));
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const sequenceRef = useRef(0);
  const mountedRef = useRef(false);
  const currentPlayback = playback.text === value
    ? playback
    : { text: value, state: "idle" as const, message: "" };
  const state = currentPlayback.state;
  const message = currentPlayback.message;

  const publish = useCallback((nextState: SpeechPlaybackState, nextMessage: string) => {
    if (!mountedRef.current) return;
    setPlayback({ text: value, state: nextState, message: nextMessage });
  }, [value]);

  const detachUtterance = useCallback(() => {
    const utterance = utteranceRef.current;
    if (!utterance) return;
    utterance.onstart = null;
    utterance.onend = null;
    utterance.onerror = null;
    utteranceRef.current = null;
  }, []);

  const stop = useCallback((announce = true) => {
    sequenceRef.current += 1;
    detachUtterance();
    try {
      synthesisRef.current?.cancel();
    } catch {
      // State is still restored even when a browser rejects cancel().
    }
    publish("idle", announce ? "Озвучивание остановлено." : "");
  }, [detachUtterance, publish]);

  useEffect(() => {
    mountedRef.current = true;
    const lifecycleToken = sequenceRef.current + 1;
    sequenceRef.current = lifecycleToken;
    let unsupportedTimer = 0;

    if (
      typeof window === "undefined"
      || !("speechSynthesis" in window)
      || typeof window.SpeechSynthesisUtterance !== "function"
    ) {
      synthesisRef.current = null;
      voicesRef.current = [];
      unsupportedTimer = window.setTimeout(() => {
        if (!mountedRef.current || sequenceRef.current !== lifecycleToken) return;
        setPlayback({ text: value, state: "unsupported", message: UNSUPPORTED_MESSAGE });
      }, 0);
      return () => {
        mountedRef.current = false;
        sequenceRef.current += 1;
        window.clearTimeout(unsupportedTimer);
      };
    }

    const synthesis = window.speechSynthesis;
    synthesisRef.current = synthesis;

    const refreshVoices = () => {
      try {
        voicesRef.current = synthesis.getVoices();
      } catch {
        voicesRef.current = [];
      }
    };

    refreshVoices();
    const supportsEventTarget = typeof synthesis.addEventListener === "function";
    const previousVoicesChanged = synthesis.onvoiceschanged;
    if (supportsEventTarget) synthesis.addEventListener("voiceschanged", refreshVoices);
    else synthesis.onvoiceschanged = refreshVoices;

    return () => {
      mountedRef.current = false;
      sequenceRef.current += 1;
      if (supportsEventTarget) synthesis.removeEventListener("voiceschanged", refreshVoices);
      else synthesis.onvoiceschanged = previousVoicesChanged;
      detachUtterance();
      try {
        synthesis.cancel();
      } catch {
        // The component is already unmounted; no user-facing recovery is required.
      }
      synthesisRef.current = null;
      voicesRef.current = [];
    };
  }, [detachUtterance, value]);

  const toggle = useCallback(() => {
    if (state === "loading" || state === "playing") {
      stop();
      return;
    }

    if (!value) {
      publish("error", "Не удалось определить слово или фразу для озвучивания.");
      return;
    }

    if (
      typeof window === "undefined"
      || !("speechSynthesis" in window)
      || typeof window.SpeechSynthesisUtterance !== "function"
    ) {
      publish("unsupported", UNSUPPORTED_MESSAGE);
      return;
    }

    const synthesis = synthesisRef.current ?? window.speechSynthesis;
    synthesisRef.current = synthesis;
    const token = sequenceRef.current + 1;
    sequenceRef.current = token;

    detachUtterance();
    try {
      if (synthesis.speaking || synthesis.pending) synthesis.cancel();
    } catch {
      // A stale browser queue must not prevent a new user-initiated attempt.
    }

    let availableVoices = voicesRef.current;
    try {
      const currentVoices = synthesis.getVoices();
      if (currentVoices.length > 0) {
        availableVoices = currentVoices;
        voicesRef.current = currentVoices;
      }
    } catch {
      // The utterance can still use its lang when the voice list is temporarily unavailable.
    }

    const utterance = new window.SpeechSynthesisUtterance(value);
    const selectedVoice = selectEnglishVoice(availableVoices);
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice?.lang || lang;
    utterance.rate = Math.min(1.4, Math.max(0.5, rate));
    utterance.pitch = 1;

    const isCurrent = () => mountedRef.current
      && sequenceRef.current === token
      && utteranceRef.current === utterance;

    utterance.onstart = () => {
      if (!isCurrent()) return;
      publish("playing", `Воспроизводим: ${value}`);
    };
    utterance.onend = () => {
      if (!isCurrent()) return;
      utteranceRef.current = null;
      publish("idle", "Произношение завершено.");
    };
    utterance.onerror = (event) => {
      if (!isCurrent()) return;
      utteranceRef.current = null;
      if (isSpeechCancellationError(event.error)) {
        publish("idle", "Озвучивание остановлено.");
        return;
      }
      publish("error", playbackFailureMessage());
    };

    utteranceRef.current = utterance;
    publish("loading", `Подготавливаем произношение: ${value}`);

    try {
      if (synthesis.paused) synthesis.resume();
      synthesis.speak(utterance);
    } catch {
      if (!isCurrent()) return;
      utteranceRef.current = null;
      publish("error", playbackFailureMessage());
    }
  }, [detachUtterance, lang, publish, rate, state, stop, value]);

  const active = state === "loading" || state === "playing";
  const visibleFeedback = state === "error" || state === "unsupported";
  const buttonClassName = [
    className,
    active ? "speaking" : "",
    state === "loading" ? "speech-loading" : "",
    state === "error" ? "speech-error" : "",
    state === "unsupported" ? "speech-unsupported" : "",
  ].filter(Boolean).join(" ");

  return (
    <span className="lx-speech-player" data-speech-state={state} data-speech-text={value}>
      <button
        type="button"
        className={buttonClassName}
        aria-label={speechControlLabel(state, value)}
        aria-pressed={active}
        aria-busy={state === "loading"}
        aria-describedby={message ? feedbackID : undefined}
        disabled={state === "unsupported" || !value}
        onClick={toggle}
      >
        {children}
      </button>
      <span
        id={feedbackID}
        className={visibleFeedback ? `lx-speech-feedback ${state}` : "lx-visually-hidden"}
        role={state === "error" ? "alert" : "status"}
        aria-live={state === "error" ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {message}
      </span>
    </span>
  );
}
