import { expect, test, type Page } from "@playwright/test";

type VoiceInput = {
  default?: boolean;
  lang: string;
  localService?: boolean;
  name: string;
};

type SpeechSnapshot = {
  cancelCount: number;
  speakCount: number;
  spoken: Array<{ lang: string; text: string; voice: string | null }>;
};

async function installCatalogMock(page: Page) {
  await page.route("**/api/v1/catalog/metadata", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        catalogVersion: "sha256:speech-e2e",
        updatedAt: "2026-07-19T00:00:00Z",
        totals: { items: 802, words: 799, phrases: 3 },
        sources: {
          mixed: 802,
          noun: 200,
          verb: 200,
          adjective: 199,
          phrases: 3,
          dailyLife: 100,
          travel: 100,
          dataEngineering: 100,
          backend: 100,
        },
        topics: [{ topic: "Incidents", count: 3 }],
      }),
    });
  });
}

async function installSpeechMock(page: Page, initialVoices: VoiceInput[] = []) {
  await page.addInitScript((voicesInput) => {
    type MockVoice = SpeechSynthesisVoice;
    type MockError = { error: string };
    type MockUtterance = {
      lang: string;
      onend: (() => void) | null;
      onerror: ((event: MockError) => void) | null;
      onstart: (() => void) | null;
      pitch: number;
      rate: number;
      text: string;
      voice: MockVoice | null;
    };

    class MockSpeechSynthesisUtterance implements MockUtterance {
      lang = "";
      onend: (() => void) | null = null;
      onerror: ((event: MockError) => void) | null = null;
      onstart: (() => void) | null = null;
      pitch = 1;
      rate = 1;
      text: string;
      voice: MockVoice | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    const toVoice = (voice: VoiceInput): MockVoice => ({
      default: Boolean(voice.default),
      lang: voice.lang,
      localService: Boolean(voice.localService),
      name: voice.name,
      voiceURI: `mock:${voice.name}`,
    });

    let voices = voicesInput.map(toVoice);
    let active: MockUtterance | null = null;
    let cancelCount = 0;
    const spoken: SpeechSnapshot["spoken"] = [];
    const listeners = new Set<() => void>();

    const synthesis = {
      get paused() { return false; },
      get pending() { return false; },
      get speaking() { return active !== null; },
      addEventListener(name: string, listener: () => void) {
        if (name === "voiceschanged") listeners.add(listener);
      },
      cancel() {
        cancelCount += 1;
        const utterance = active;
        active = null;
        utterance?.onerror?.({ error: "canceled" });
      },
      getVoices() {
        return [...voices];
      },
      removeEventListener(name: string, listener: () => void) {
        if (name === "voiceschanged") listeners.delete(listener);
      },
      resume() {},
      speak(utterance: MockUtterance) {
        active = utterance;
        spoken.push({
          lang: utterance.lang,
          text: utterance.text,
          voice: utterance.voice?.name ?? null,
        });
        utterance.onstart?.();
      },
    };

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: MockSpeechSynthesisUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: synthesis,
    });
    Object.defineProperty(window, "__speechMock", {
      configurable: true,
      value: {
        fail(error: string) {
          const utterance = active;
          active = null;
          utterance?.onerror?.({ error });
        },
        finish() {
          const utterance = active;
          active = null;
          utterance?.onend?.();
        },
        setVoices(nextVoices: VoiceInput[]) {
          voices = nextVoices.map(toVoice);
          listeners.forEach((listener) => listener());
        },
        snapshot(): SpeechSnapshot {
          return {
            cancelCount,
            speakCount: spoken.length,
            spoken: [...spoken],
          };
        },
      },
    });
  }, initialVoices);
}

async function speechSnapshot(page: Page): Promise<SpeechSnapshot> {
  return page.evaluate(() => (
    window as unknown as { __speechMock: { snapshot: () => SpeechSnapshot } }
  ).__speechMock.snapshot());
}

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  await installCatalogMock(page);
});

test("voiceschanged selects a deterministic English voice and a second click stops playback", async ({ page }) => {
  await installSpeechMock(page);
  await page.goto("/");
  const speech = page.locator('[data-speech-text="incident"] button');
  await expect(speech).toHaveAttribute("aria-label", "Произнести: incident");

  await page.evaluate(() => (
    window as unknown as { __speechMock: { setVoices: (voices: VoiceInput[]) => void } }
  ).__speechMock.setVoices([
    { lang: "en-US", name: "Remote US", default: true },
    { lang: "en-GB", name: "Local British", localService: true },
    { lang: "en-AU", name: "Local Australian", localService: true },
  ]));

  await speech.click();
  await expect(speech).toHaveAttribute("aria-label", "Остановить произношение: incident");
  await expect(speech).toHaveAttribute("aria-pressed", "true");
  expect(await speechSnapshot(page)).toEqual({
    cancelCount: 0,
    speakCount: 1,
    spoken: [{ lang: "en-GB", text: "incident", voice: "Local British" }],
  });

  await speech.click();
  await expect(speech).toHaveAttribute("aria-label", "Произнести: incident");
  await expect(speech).toHaveAttribute("aria-pressed", "false");
  const stopped = await speechSnapshot(page);
  expect(stopped.speakCount).toBe(1);
  expect(stopped.cancelCount).toBe(1);
});

test("end and error restore state while navigation cancels the owned utterance", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-webkit", "Lifecycle regression is asserted in WebKit.");
  await installSpeechMock(page, [{ lang: "en-US", name: "English US", localService: true }]);
  await page.goto("/");
  const speech = page.locator('[data-speech-text="incident"] button');

  await speech.click();
  await page.evaluate(() => (
    window as unknown as { __speechMock: { finish: () => void } }
  ).__speechMock.finish());
  await expect(speech).toHaveAttribute("aria-label", "Произнести: incident");

  await speech.click();
  await page.evaluate(() => (
    window as unknown as { __speechMock: { fail: (error: string) => void } }
  ).__speechMock.fail("audio-busy"));
  await expect(speech).toHaveAttribute("aria-label", "Повторить произношение: incident");
  await expect(page.locator(".lx-speech-feedback.error")).toContainText("Не удалось воспроизвести");

  await speech.click();
  await page.locator('[data-navigation-view="phrases"]:visible').click();
  await expect(page).toHaveURL(/\/phrases$/);
  expect((await speechSnapshot(page)).cancelCount).toBeGreaterThanOrEqual(1);
});

test("phrase detail speaks the text supplied through props", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Phrase binding is asserted once.");
  await installSpeechMock(page, [{ lang: "en-US", name: "English US", localService: true }]);
  await page.goto("/phrases/phrase-root-cause");
  await expect(page.getByRole("heading", { name: "We need to identify the root cause." })).toBeVisible();

  const speech = page.locator('[data-speech-text="We need to identify the root cause."] button');
  await speech.click();
  expect((await speechSnapshot(page)).spoken.at(-1)?.text).toBe("We need to identify the root cause.");
});

test("unsupported browsers expose a disabled control and a visible explanation", async ({ page }, testInfo) => {
  test.skip(!["ios-webkit", "android-chromium"].includes(testInfo.project.name), "Mobile unsupported contract.");
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: undefined });
  });
  await page.goto("/");

  const player = page.locator('[data-speech-text="incident"]');
  await expect(player).toHaveAttribute("data-speech-state", "unsupported");
  await expect(player.getByRole("button")).toBeDisabled();
  await expect(player.locator(".lx-speech-feedback.unsupported")).toContainText("Озвучивание недоступно");
});
