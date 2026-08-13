import { describe, expect, it, vi } from "vitest";

import {
  PRONUNCIATION_RECORDER_MAX_DURATION_MS,
  PronunciationRecorder,
} from "./pronunciation-recorder";

type FakeTrack = { stop: ReturnType<typeof vi.fn> };
type GetUserMedia = (constraints: MediaStreamConstraints) => Promise<MediaStream>;

type FakeStreamBundle = {
  stream: MediaStream;
  track: FakeTrack;
};

class FakeMediaRecorder {
  state: RecordingState = "inactive";
  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(mimeType: string) {
    this.mimeType = mimeType;
  }

  start(): void {
    this.state = "recording";
  }

  stop(): void {
    if (this.state === "inactive") throw new DOMException("inactive", "InvalidStateError");
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["voice"], { type: this.mimeType }) } as BlobEvent);
    this.onstop?.();
  }

  fail(): void {
    this.onerror?.(new Event("error"));
  }
}

function fakeStream(): FakeStreamBundle {
  const track = { stop: vi.fn() };
  return {
    track,
    stream: { getTracks: () => [track] } as unknown as MediaStream,
  };
}

function recorderHarness(options: {
  getUserMedia?: GetUserMedia;
  supportedTypes?: string[];
  maxDurationMs?: number;
} = {}) {
  const { stream, track } = fakeStream();
  const recorders: FakeMediaRecorder[] = [];
  const createdURLs: string[] = [];
  const revokedURLs: string[] = [];
  let now = 1_000;

  const getUserMedia = options.getUserMedia ?? vi.fn(async () => stream);
  const recorder = new PronunciationRecorder({
    maxDurationMs: options.maxDurationMs,
    dependencies: {
      getUserMedia,
      isMimeTypeSupported: (mimeType) => (
        options.supportedTypes ?? ["audio/webm;codecs=opus"]
      ).includes(mimeType),
      createRecorder: (_stream, mimeType) => {
        const value = new FakeMediaRecorder(mimeType);
        recorders.push(value);
        return value as unknown as MediaRecorder;
      },
      createObjectURL: () => {
        const value = `blob:recording-${createdURLs.length + 1}`;
        createdURLs.push(value);
        return value;
      },
      revokeObjectURL: (url) => revokedURLs.push(url),
      now: () => now,
    },
  });

  return {
    recorder,
    getUserMedia,
    stream,
    track,
    recorders,
    createdURLs,
    revokedURLs,
    advanceTime(ms: number) {
      now += ms;
    },
  };
}

describe("PronunciationRecorder", () => {
  it("does not request microphone access during construction", () => {
    const getUserMedia = vi.fn(async () => fakeStream().stream);
    const harness = recorderHarness({ getUserMedia });

    expect(harness.recorder.getSnapshot().state).toBe("idle");
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("reports unsupported without requesting access when required APIs are unavailable", async () => {
    const getUserMedia = vi.fn(async () => fakeStream().stream);
    const recorder = new PronunciationRecorder({
      dependencies: {
        getUserMedia,
        createRecorder: null,
        isMimeTypeSupported: null,
        createObjectURL: null,
        revokeObjectURL: null,
      },
    });

    expect(recorder.getSnapshot()).toEqual({
      state: "unsupported",
      recording: null,
      errorCode: "unsupported",
    });
    await expect(recorder.startRecording()).resolves.toEqual(recorder.getSnapshot());
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("requests audio only from explicit start and records one local clip", async () => {
    const harness = recorderHarness();
    await harness.recorder.startRecording();

    expect(harness.getUserMedia).toHaveBeenCalledTimes(1);
    expect(harness.getUserMedia).toHaveBeenCalledWith({ audio: true, video: false });
    expect(harness.recorder.getSnapshot().state).toBe("recording");
    expect(harness.recorders[0]?.mimeType).toBe("audio/webm;codecs=opus");

    harness.advanceTime(1_250);
    const stopped = await harness.recorder.stopRecording();
    expect(stopped.state).toBe("recorded");
    expect(stopped.recording).toMatchObject({
      url: "blob:recording-1",
      mimeType: "audio/webm;codecs=opus",
      size: 5,
      durationMs: 1_250,
    });
    expect(harness.track.stop).toHaveBeenCalledTimes(1);
  });

  it("prefers the first supported allowlisted recording format", async () => {
    const harness = recorderHarness({ supportedTypes: ["audio/mp4", "audio/ogg;codecs=opus"] });
    await harness.recorder.startRecording();
    expect(harness.recorders[0]?.mimeType).toBe("audio/mp4");
  });

  it("does not request access when no allowlisted format is supported", async () => {
    const harness = recorderHarness({ supportedTypes: [] });
    const snapshot = await harness.recorder.startRecording();
    expect(snapshot.state).toBe("unsupported");
    expect(harness.getUserMedia).not.toHaveBeenCalled();
  });

  it("maps permission denial to a recoverable denied state", async () => {
    const getUserMedia = vi.fn(async () => {
      throw new DOMException("denied", "NotAllowedError");
    });
    const harness = recorderHarness({ getUserMedia });

    const snapshot = await harness.recorder.startRecording();
    expect(snapshot).toEqual({
      state: "denied",
      recording: null,
      errorCode: "permission-denied",
    });
    expect(harness.recorders).toHaveLength(0);
  });

  it("prevents concurrent starts while permission is pending", async () => {
    let resolvePermission!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn(() => new Promise<MediaStream>((resolve) => {
      resolvePermission = resolve;
    }));
    const harness = recorderHarness({ getUserMedia });

    const first = harness.recorder.startRecording();
    const second = await harness.recorder.startRecording();
    expect(second.state).toBe("requesting");
    expect(getUserMedia).toHaveBeenCalledTimes(1);

    resolvePermission(harness.stream);
    await first;
    expect(harness.recorder.getSnapshot().state).toBe("recording");
  });

  it("stops a late permission stream after cancel without starting a recorder", async () => {
    let resolvePermission!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn(() => new Promise<MediaStream>((resolve) => {
      resolvePermission = resolve;
    }));
    const harness = recorderHarness({ getUserMedia });

    const pending = harness.recorder.startRecording();
    expect(harness.recorder.cancel().state).toBe("idle");
    resolvePermission(harness.stream);
    await pending;

    expect(harness.track.stop).toHaveBeenCalledTimes(1);
    expect(harness.recorders).toHaveLength(0);
    expect(harness.recorder.getSnapshot().state).toBe("idle");
  });

  it("cancels an active recording, stops tracks and never creates a URL", async () => {
    const harness = recorderHarness();
    await harness.recorder.startRecording();

    expect(harness.recorder.cancel().state).toBe("idle");
    expect(harness.track.stop).toHaveBeenCalledTimes(1);
    expect(harness.createdURLs).toEqual([]);
  });

  it("revokes an owned recording URL when cleared or disposed", async () => {
    const first = recorderHarness();
    await first.recorder.startRecording();
    await first.recorder.stopRecording();
    first.recorder.clearRecording();
    expect(first.revokedURLs).toEqual(["blob:recording-1"]);

    const second = recorderHarness();
    await second.recorder.startRecording();
    await second.recorder.stopRecording();
    second.recorder.dispose();
    expect(second.revokedURLs).toEqual(["blob:recording-1"]);
  });

  it("cleans up tracks when MediaRecorder reports an error", async () => {
    const harness = recorderHarness();
    await harness.recorder.startRecording();
    harness.recorders[0]?.fail();

    expect(harness.recorder.getSnapshot().state).toBe("error");
    expect(harness.track.stop).toHaveBeenCalledTimes(1);
    expect(harness.createdURLs).toEqual([]);
  });

  it("auto-stops at the product maximum duration", async () => {
    vi.useFakeTimers();
    try {
      const harness = recorderHarness({
        maxDurationMs: PRONUNCIATION_RECORDER_MAX_DURATION_MS * 10,
      });
      await harness.recorder.startRecording();
      harness.advanceTime(PRONUNCIATION_RECORDER_MAX_DURATION_MS + 5_000);

      await vi.advanceTimersByTimeAsync(PRONUNCIATION_RECORDER_MAX_DURATION_MS);

      expect(harness.recorder.getSnapshot().state).toBe("recorded");
      expect(harness.recorder.getSnapshot().recording?.durationMs).toBe(
        PRONUNCIATION_RECORDER_MAX_DURATION_MS,
      );
      expect(harness.track.stop).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
