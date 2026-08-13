export type PronunciationRecorderState =
  | "unsupported"
  | "idle"
  | "requesting"
  | "recording"
  | "stopping"
  | "recorded"
  | "denied"
  | "error";

export type PronunciationRecording = {
  url: string;
  mimeType: string;
  size: number;
  durationMs: number;
};

export type PronunciationRecorderSnapshot = {
  state: PronunciationRecorderState;
  recording: PronunciationRecording | null;
  errorCode: "permission-denied" | "recording-failed" | "unsupported" | null;
};

export type PronunciationRecorderListener = (snapshot: PronunciationRecorderSnapshot) => void;

export const PRONUNCIATION_RECORDER_MAX_DURATION_MS = 30_000;

const RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
] as const;

type RecorderDependencies = {
  getUserMedia: ((constraints: MediaStreamConstraints) => Promise<MediaStream>) | null;
  createRecorder: ((stream: MediaStream, mimeType: string) => MediaRecorder) | null;
  isMimeTypeSupported: ((mimeType: string) => boolean) | null;
  createObjectURL: ((blob: Blob) => string) | null;
  revokeObjectURL: ((url: string) => void) | null;
  setTimeout: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
  now: () => number;
};

export type PronunciationRecorderOptions = {
  maxDurationMs?: number;
  dependencies?: Partial<RecorderDependencies>;
};

function browserDependencies(): RecorderDependencies {
  const mediaDevices = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
  const recorderConstructor = typeof MediaRecorder === "undefined" ? undefined : MediaRecorder;
  const urlConstructor = typeof URL === "undefined" ? undefined : URL;

  return {
    getUserMedia: mediaDevices?.getUserMedia
      ? (constraints) => mediaDevices.getUserMedia(constraints)
      : null,
    createRecorder: recorderConstructor
      ? (stream, mimeType) => new recorderConstructor(stream, { mimeType })
      : null,
    isMimeTypeSupported: recorderConstructor?.isTypeSupported
      ? (mimeType) => recorderConstructor.isTypeSupported(mimeType)
      : null,
    createObjectURL: urlConstructor?.createObjectURL
      ? (blob) => urlConstructor.createObjectURL(blob)
      : null,
    revokeObjectURL: urlConstructor?.revokeObjectURL
      ? (url) => urlConstructor.revokeObjectURL(url)
      : null,
    setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    clearTimeout: (timer) => clearTimeout(timer),
    now: () => Date.now(),
  };
}

function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      // Cleanup remains best-effort for browser tracks that are already ended.
    }
  }
}

function isPermissionDenied(error: unknown): boolean {
  if (typeof DOMException === "undefined" || !(error instanceof DOMException)) return false;
  return error.name === "NotAllowedError" || error.name === "SecurityError";
}

function selectRecordingMimeType(
  isMimeTypeSupported: ((mimeType: string) => boolean) | null,
): string | null {
  if (!isMimeTypeSupported) return null;
  for (const mimeType of RECORDING_MIME_TYPES) {
    try {
      if (isMimeTypeSupported(mimeType)) return mimeType;
    } catch {
      // A broken capability probe must not trigger recording with an unknown format.
    }
  }
  return null;
}

export class PronunciationRecorder {
  private readonly dependencies: RecorderDependencies;
  private readonly maxDurationMs: number;
  private readonly listeners = new Set<PronunciationRecorderListener>();

  private snapshot: PronunciationRecorderSnapshot;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private recordingURL: string | null = null;
  private lifecycle = 0;
  private permissionRequestPending = false;
  private disposed = false;
  private stopPromise: Promise<PronunciationRecorderSnapshot> | null = null;
  private resolveStop: ((snapshot: PronunciationRecorderSnapshot) => void) | null = null;

  constructor(options: PronunciationRecorderOptions = {}) {
    const defaults = browserDependencies();
    this.dependencies = { ...defaults, ...options.dependencies };
    this.maxDurationMs = Math.max(
      1_000,
      Math.min(
        PRONUNCIATION_RECORDER_MAX_DURATION_MS,
        options.maxDurationMs ?? PRONUNCIATION_RECORDER_MAX_DURATION_MS,
      ),
    );

    const supported = Boolean(
      this.dependencies.getUserMedia
      && this.dependencies.createRecorder
      && this.dependencies.isMimeTypeSupported
      && this.dependencies.createObjectURL
      && this.dependencies.revokeObjectURL,
    );
    this.snapshot = {
      state: supported ? "idle" : "unsupported",
      recording: null,
      errorCode: supported ? null : "unsupported",
    };
  }

  getSnapshot(): PronunciationRecorderSnapshot {
    return this.snapshot;
  }

  subscribe(listener: PronunciationRecorderListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async startRecording(): Promise<PronunciationRecorderSnapshot> {
    if (this.disposed) return this.publishError();
    if (this.snapshot.state === "unsupported") return this.snapshot;
    if (this.permissionRequestPending || this.recorder) return this.snapshot;

    const mimeType = selectRecordingMimeType(this.dependencies.isMimeTypeSupported);
    if (!mimeType) {
      return this.publish({ state: "unsupported", recording: null, errorCode: "unsupported" });
    }

    const token = ++this.lifecycle;
    this.permissionRequestPending = true;
    this.publish({ state: "requesting", recording: this.snapshot.recording, errorCode: null });

    let stream: MediaStream;
    try {
      stream = await this.dependencies.getUserMedia!({ audio: true, video: false });
    } catch (error) {
      this.permissionRequestPending = false;
      if (token !== this.lifecycle || this.disposed) return this.snapshot;
      if (isPermissionDenied(error)) {
        return this.publish({
          state: "denied",
          recording: this.snapshot.recording,
          errorCode: "permission-denied",
        });
      }
      return this.publishError();
    }
    this.permissionRequestPending = false;

    if (token !== this.lifecycle || this.disposed) {
      stopMediaStream(stream);
      return this.snapshot;
    }

    let recorder: MediaRecorder;
    try {
      recorder = this.dependencies.createRecorder!(stream, mimeType);
    } catch {
      stopMediaStream(stream);
      return this.publishError();
    }

    this.revokeRecordingURL();
    this.stream = stream;
    this.recorder = recorder;
    this.chunks = [];
    this.startedAt = this.dependencies.now();

    recorder.ondataavailable = (event: BlobEvent) => {
      if (token !== this.lifecycle || this.recorder !== recorder || event.data.size === 0) return;
      this.chunks.push(event.data);
    };
    recorder.onerror = () => {
      if (token !== this.lifecycle || this.recorder !== recorder) return;
      this.failActiveRecording();
    };
    recorder.onstop = () => {
      if (token !== this.lifecycle || this.recorder !== recorder) return;
      this.finishRecording(mimeType);
    };

    try {
      recorder.start();
    } catch {
      this.failActiveRecording();
      return this.snapshot;
    }

    this.publish({ state: "recording", recording: null, errorCode: null });
    this.timeout = this.dependencies.setTimeout(() => {
      void this.stopRecording();
    }, this.maxDurationMs);
    return this.snapshot;
  }

  stopRecording(): Promise<PronunciationRecorderSnapshot> {
    if (!this.recorder || this.snapshot.state !== "recording") {
      return Promise.resolve(this.snapshot);
    }
    if (this.stopPromise) return this.stopPromise;

    this.publish({ state: "stopping", recording: null, errorCode: null });
    const promise = new Promise<PronunciationRecorderSnapshot>((resolve) => {
      this.resolveStop = resolve;
    });
    this.stopPromise = promise;

    try {
      this.recorder.stop();
    } catch {
      this.failActiveRecording();
    }
    return promise;
  }

  cancel(): PronunciationRecorderSnapshot {
    this.lifecycle += 1;
    this.cancelTimeout();
    const recorder = this.recorder;
    this.detachRecorder();
    try {
      if (recorder && recorder.state !== "inactive") recorder.stop();
    } catch {
      // The stream is still stopped below even if MediaRecorder rejects stop().
    }
    stopMediaStream(this.stream);
    this.stream = null;
    this.chunks = [];
    const idle: PronunciationRecorderSnapshot = { state: "idle", recording: null, errorCode: null };
    this.resolvePendingStop(idle);
    this.revokeRecordingURL();
    return this.publish(idle);
  }

  clearRecording(): PronunciationRecorderSnapshot {
    this.revokeRecordingURL();
    if (this.snapshot.recording) {
      return this.publish({ state: "idle", recording: null, errorCode: null });
    }
    return this.snapshot;
  }

  dispose(): void {
    if (this.disposed) return;
    this.cancel();
    this.disposed = true;
    this.listeners.clear();
  }

  private finishRecording(mimeType: string): void {
    const durationMs = Math.max(
      0,
      Math.min(this.maxDurationMs, this.dependencies.now() - this.startedAt),
    );
    const chunks = this.chunks;
    this.cancelTimeout();
    stopMediaStream(this.stream);
    this.stream = null;
    this.detachRecorder();
    this.chunks = [];

    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size === 0) {
      this.resolvePendingStop(this.publishError());
      return;
    }

    let url: string;
    try {
      url = this.dependencies.createObjectURL!(blob);
    } catch {
      this.resolvePendingStop(this.publishError());
      return;
    }
    this.recordingURL = url;
    const snapshot = this.publish({
      state: "recorded",
      recording: { url, mimeType, size: blob.size, durationMs },
      errorCode: null,
    });
    this.resolvePendingStop(snapshot);
  }

  private failActiveRecording(): PronunciationRecorderSnapshot {
    this.lifecycle += 1;
    this.cancelTimeout();
    const recorder = this.recorder;
    this.detachRecorder();
    try {
      if (recorder && recorder.state !== "inactive") recorder.stop();
    } catch {
      // Cleanup continues through MediaStream tracks.
    }
    stopMediaStream(this.stream);
    this.stream = null;
    this.chunks = [];
    const snapshot = this.publishError();
    this.resolvePendingStop(snapshot);
    return snapshot;
  }

  private detachRecorder(): void {
    if (!this.recorder) return;
    this.recorder.ondataavailable = null;
    this.recorder.onerror = null;
    this.recorder.onstop = null;
    this.recorder = null;
  }

  private cancelTimeout(): void {
    if (this.timeout === null) return;
    this.dependencies.clearTimeout(this.timeout);
    this.timeout = null;
  }

  private revokeRecordingURL(): void {
    if (!this.recordingURL) return;
    const url = this.recordingURL;
    this.recordingURL = null;
    try {
      this.dependencies.revokeObjectURL?.(url);
    } catch {
      // Application ownership is released even if browser revocation reports an error.
    }
  }

  private resolvePendingStop(snapshot: PronunciationRecorderSnapshot): void {
    const resolve = this.resolveStop;
    this.resolveStop = null;
    this.stopPromise = null;
    resolve?.(snapshot);
  }

  private publishError(): PronunciationRecorderSnapshot {
    return this.publish({
      state: "error",
      recording: this.snapshot.recording,
      errorCode: "recording-failed",
    });
  }

  private publish(snapshot: PronunciationRecorderSnapshot): PronunciationRecorderSnapshot {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener(snapshot);
    return snapshot;
  }
}

export function createPronunciationRecorder(
  options: PronunciationRecorderOptions = {},
): PronunciationRecorder {
  return new PronunciationRecorder(options);
}
