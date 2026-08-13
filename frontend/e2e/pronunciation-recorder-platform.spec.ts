import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";
import * as ts from "typescript";

const RECORDER_SOURCE = readFileSync("lib/pronunciation-recorder.ts", "utf8");
const RECORDER_BROWSER_MODULE = `${ts.transpileModule(RECORDER_SOURCE, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText}\nglobalThis.__PronunciationRecorder = PronunciationRecorder;`;

type MediaFixtureMode = "allowed" | "denied";

type MediaFixtureSnapshot = {
  getUserMediaCalls: number;
  recorderStarts: number;
  recorderStops: number;
  trackStops: number;
  createdURLs: number;
  revokedURLs: number;
};

async function installRecorderFixture(page: Page, mode: MediaFixtureMode) {
  await page.goto("about:blank");
  await page.evaluate((fixtureMode) => {
    const stats: MediaFixtureSnapshot = {
      getUserMediaCalls: 0,
      recorderStarts: 0,
      recorderStops: 0,
      trackStops: 0,
      createdURLs: 0,
      revokedURLs: 0,
    };

    class FakeMediaRecorder {
      static isTypeSupported(mimeType: string) {
        return mimeType === "audio/webm;codecs=opus";
      }

      state: RecordingState = "inactive";
      mimeType: string;
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onstop: (() => void) | null = null;

      constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
        this.mimeType = options?.mimeType ?? "";
      }

      start() {
        stats.recorderStarts += 1;
        this.state = "recording";
      }

      stop() {
        stats.recorderStops += 1;
        this.state = "inactive";
        this.ondataavailable?.({
          data: new Blob(["voice"], { type: this.mimeType }),
        } as BlobEvent);
        this.onstop?.();
      }
    }

    Object.defineProperty(globalThis, "MediaRecorder", {
      configurable: true,
      value: FakeMediaRecorder,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        async getUserMedia(constraints: MediaStreamConstraints) {
          stats.getUserMediaCalls += 1;
          if (constraints.video !== false || constraints.audio !== true) {
            throw new Error("unexpected media constraints");
          }
          if (fixtureMode === "denied") {
            throw new DOMException("permission denied", "NotAllowedError");
          }
          return {
            getTracks() {
              return [{ stop: () => { stats.trackStops += 1; } }];
            },
          } as unknown as MediaStream;
        },
      },
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: () => {
        stats.createdURLs += 1;
        return `blob:browser-recording-${stats.createdURLs}`;
      },
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: () => { stats.revokedURLs += 1; },
    });
    Object.defineProperty(globalThis, "__recorderMediaFixture", {
      configurable: true,
      value: { stats },
    });
  }, mode);

  await page.addScriptTag({ type: "module", content: RECORDER_BROWSER_MODULE });
  await page.waitForFunction(() => "__PronunciationRecorder" in globalThis);
}

async function fixtureSnapshot(page: Page): Promise<MediaFixtureSnapshot> {
  return page.evaluate(() => (
    globalThis as typeof globalThis & {
      __recorderMediaFixture: { stats: MediaFixtureSnapshot };
    }
  ).__recorderMediaFixture.stats);
}

test.describe.configure({ timeout: 30_000 });

test("actual recorder module stays permission-idle until explicit start and cleans up the clip", async ({ page }, testInfo) => {
  test.skip(
    !["desktop-chromium", "desktop-webkit"].includes(testInfo.project.name),
    "Platform lifecycle is asserted in desktop Chromium and WebKit.",
  );
  await installRecorderFixture(page, "allowed");

  const initial = await page.evaluate(() => {
    const Recorder = (
      globalThis as typeof globalThis & { __PronunciationRecorder: new () => unknown }
    ).__PronunciationRecorder;
    const recorder = new Recorder() as {
      getSnapshot(): { state: string };
    };
    Object.defineProperty(globalThis, "__activePronunciationRecorder", {
      configurable: true,
      value: recorder,
    });
    return recorder.getSnapshot();
  });
  expect(initial.state).toBe("idle");
  expect((await fixtureSnapshot(page)).getUserMediaCalls).toBe(0);

  const recorded = await page.evaluate(async () => {
    const recorder = (
      globalThis as typeof globalThis & {
        __activePronunciationRecorder: {
          startRecording(): Promise<{ state: string }>;
          stopRecording(): Promise<{
            state: string;
            recording: { mimeType: string; size: number } | null;
          }>;
        };
      }
    ).__activePronunciationRecorder;
    await recorder.startRecording();
    return recorder.stopRecording();
  });

  expect(recorded.state).toBe("recorded");
  expect(recorded.recording?.mimeType).toBe("audio/webm;codecs=opus");
  expect(recorded.recording?.size).toBeGreaterThan(0);
  expect(await fixtureSnapshot(page)).toMatchObject({
    getUserMediaCalls: 1,
    recorderStarts: 1,
    recorderStops: 1,
    trackStops: 1,
    createdURLs: 1,
    revokedURLs: 0,
  });

  await page.evaluate(() => {
    const recorder = (
      globalThis as typeof globalThis & {
        __activePronunciationRecorder: { dispose(): void };
      }
    ).__activePronunciationRecorder;
    recorder.dispose();
  });
  expect((await fixtureSnapshot(page)).revokedURLs).toBe(1);
});

test("actual recorder module exposes denied state without creating recorder resources", async ({ page }, testInfo) => {
  test.skip(
    !["desktop-chromium", "desktop-webkit"].includes(testInfo.project.name),
    "Permission denial is asserted in desktop Chromium and WebKit.",
  );
  await installRecorderFixture(page, "denied");

  const snapshot = await page.evaluate(async () => {
    const Recorder = (
      globalThis as typeof globalThis & {
        __PronunciationRecorder: new () => {
          startRecording(): Promise<{ state: string; errorCode: string | null }>;
        };
      }
    ).__PronunciationRecorder;
    return new Recorder().startRecording();
  });

  expect(snapshot).toMatchObject({ state: "denied", errorCode: "permission-denied" });
  expect(await fixtureSnapshot(page)).toMatchObject({
    getUserMediaCalls: 1,
    recorderStarts: 0,
    recorderStops: 0,
    trackStops: 0,
    createdURLs: 0,
  });
});
