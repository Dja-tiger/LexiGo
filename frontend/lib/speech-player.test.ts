import { describe, expect, it } from "vitest";

import {
  isSpeechCancellationError,
  normalizeSpeechText,
  selectEnglishVoice,
  speechControlLabel,
  type SpeechVoiceCandidate,
} from "./speech-player";

function voice(
  lang: string,
  options: Partial<SpeechVoiceCandidate> = {},
): SpeechVoiceCandidate {
  return {
    default: false,
    lang,
    localService: false,
    name: lang,
    ...options,
  };
}

describe("speech player helpers", () => {
  it("normalizes whitespace without changing the spoken words", () => {
    expect(normalizeSpeechText("  keep\n  the   cache warm  ")).toBe("keep the cache warm");
  });

  it("prefers a local en-GB voice, then en-US and then any English voice", () => {
    const voices = [
      voice("ru-RU", { localService: true }),
      voice("en-US", { default: true }),
      voice("en_GB", { localService: true, name: "Local British" }),
      voice("en-AU", { localService: true }),
    ];

    expect(selectEnglishVoice(voices)?.name).toBe("Local British");
    expect(selectEnglishVoice([voice("en-US"), voice("en-AU", { localService: true })])?.lang)
      .toBe("en-US");
    expect(selectEnglishVoice([voice("de-DE"), voice("en-AU", { default: true })])?.lang)
      .toBe("en-AU");
  });

  it("returns null when no English voice is available", () => {
    expect(selectEnglishVoice([voice("ru-RU"), voice("de-DE")])).toBeNull();
  });

  it("recognizes browser cancellation errors separately from playback failures", () => {
    expect(isSpeechCancellationError("canceled")).toBe(true);
    expect(isSpeechCancellationError("interrupted")).toBe(true);
    expect(isSpeechCancellationError("audio-busy")).toBe(false);
  });

  it("builds stable accessible labels for every playback state", () => {
    expect(speechControlLabel("idle", "cache")).toBe("Произнести: cache");
    expect(speechControlLabel("loading", "cache")).toBe("Остановить произношение: cache");
    expect(speechControlLabel("playing", "cache")).toBe("Остановить произношение: cache");
    expect(speechControlLabel("error", "cache")).toBe("Повторить произношение: cache");
    expect(speechControlLabel("unsupported", "cache")).toBe("Произношение недоступно: cache");
  });
});
