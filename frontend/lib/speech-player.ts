export type SpeechPlaybackState = "idle" | "loading" | "playing" | "error" | "unsupported";

export type SpeechVoiceCandidate = Pick<
  SpeechSynthesisVoice,
  "default" | "lang" | "localService" | "name"
>;

const PREFERRED_ENGLISH_LOCALES = ["en-GB", "en-US"] as const;

export function normalizeSpeechText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizedLocale(value: string): string {
  return value.trim().replace(/_/g, "-").toLowerCase();
}

export function selectEnglishVoice<T extends SpeechVoiceCandidate>(voices: readonly T[]): T | null {
  const englishVoices = voices.filter((voice) => normalizedLocale(voice.lang).startsWith("en"));
  if (englishVoices.length === 0) return null;

  for (const preferredLocale of PREFERRED_ENGLISH_LOCALES) {
    const locale = normalizedLocale(preferredLocale);
    const exact = englishVoices.filter((voice) => normalizedLocale(voice.lang) === locale);
    const local = exact.find((voice) => voice.localService);
    if (local) return local;
    const defaultVoice = exact.find((voice) => voice.default);
    if (defaultVoice) return defaultVoice;
    if (exact[0]) return exact[0];
  }

  return englishVoices.find((voice) => voice.localService)
    ?? englishVoices.find((voice) => voice.default)
    ?? englishVoices[0]
    ?? null;
}

export function isSpeechCancellationError(error: string | undefined): boolean {
  const normalized = error?.trim().toLowerCase();
  return normalized === "canceled"
    || normalized === "cancelled"
    || normalized === "interrupted";
}

export function speechControlLabel(state: SpeechPlaybackState, text: string): string {
  const value = normalizeSpeechText(text) || "текст";
  if (state === "loading" || state === "playing") return `Остановить произношение: ${value}`;
  if (state === "error") return `Повторить произношение: ${value}`;
  if (state === "unsupported") return `Произношение недоступно: ${value}`;
  return `Произнести: ${value}`;
}
