export type ReviewOutboxState = "pending" | "failed" | "synced";

export type LessonReviewRating = "again" | "almost" | "known";
export type LessonReviewAnswerMode = "study" | "recall" | "choice";

export type LessonReviewPayload = {
  lessonVersion: number;
  rating: LessonReviewRating;
  responseMs?: number;
  answerMode: LessonReviewAnswerMode;
  submittedAnswer?: string;
  correct?: boolean;
  answerRevealed?: boolean;
  timezoneOffsetMinutes: number;
};

export type ReviewEndpoint = {
  lessonId: string;
  wordId: number;
};

export type ReviewOutboxRecord = {
  operationKey: string;
  idempotencyKey: string;
  userId: string;
  endpoint: string;
  lessonId: string;
  wordId: number;
  lessonVersion: number;
  requestBody: string;
  status: ReviewOutboxState;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastErrorCode: string;
  lastErrorMessage: string;
};

export type ReviewOutboxSummary = {
  pending: number;
  failed: number;
  synced: number;
  latestSyncedAt: string;
};

export type ReviewResponseDisposition = "synced" | "retry" | "failed" | "refresh-session";

const DATABASE_NAME = "lexigo-review-outbox";
const DATABASE_VERSION = 1;
const REVIEW_STORE = "lesson-reviews";
const SYNCED_RETENTION_MS = 24 * 60 * 60 * 1000;
const REVIEW_ENDPOINT_PATTERN = /\/api\/v1\/lessons\/([0-9a-f-]{36})\/words\/(\d+)\/review\/?$/i;
const MAX_SUBMITTED_ANSWER_CHARACTERS = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function isRating(value: unknown): value is LessonReviewRating {
  return value === "again" || value === "almost" || value === "known";
}

function isAnswerMode(value: unknown): value is LessonReviewAnswerMode {
  return value === "study" || value === "recall" || value === "choice";
}

function submittedAnswerLength(value: string): number {
  return Array.from(value).length;
}

export function parseLessonReviewPayload(value: unknown): LessonReviewPayload | null {
  if (!isRecord(value)) return null;
  if (!isFiniteInteger(value.lessonVersion) || value.lessonVersion <= 0) return null;
  if (!isRating(value.rating) || !isAnswerMode(value.answerMode)) return null;
  if (!isFiniteInteger(value.timezoneOffsetMinutes)) return null;
  if (value.responseMs !== undefined && (!isFiniteInteger(value.responseMs) || value.responseMs < 0)) return null;
  if (value.submittedAnswer !== undefined && (
    typeof value.submittedAnswer !== "string"
    || submittedAnswerLength(value.submittedAnswer) > MAX_SUBMITTED_ANSWER_CHARACTERS
  )) return null;
  if (value.correct !== undefined && typeof value.correct !== "boolean") return null;
  if (value.answerRevealed !== undefined && typeof value.answerRevealed !== "boolean") return null;
  if (value.answerMode === "study" && (value.submittedAnswer !== undefined || value.correct !== undefined)) return null;
  if (value.submittedAnswer !== undefined && value.correct !== undefined) return null;

  return {
    lessonVersion: value.lessonVersion,
    rating: value.rating,
    ...(value.responseMs === undefined ? {} : { responseMs: value.responseMs }),
    answerMode: value.answerMode,
    ...(value.submittedAnswer === undefined ? {} : { submittedAnswer: value.submittedAnswer }),
    ...(value.correct === undefined ? {} : { correct: value.correct }),
    ...(value.answerRevealed === undefined ? {} : { answerRevealed: value.answerRevealed }),
    timezoneOffsetMinutes: value.timezoneOffsetMinutes,
  };
}

export function parseLessonReviewEndpoint(value: string): ReviewEndpoint | null {
  let pathname: string;
  try {
    pathname = new URL(value, typeof window === "undefined" ? "https://lexigo.invalid" : window.location.origin).pathname;
  } catch {
    return null;
  }
  const match = pathname.match(REVIEW_ENDPOINT_PATTERN);
  if (!match) return null;
  const wordId = Number(match[2]);
  if (!Number.isSafeInteger(wordId) || wordId <= 0) return null;
  return { lessonId: match[1].toLowerCase(), wordId };
}

export function reviewOperationKey(
  userId: string,
  endpoint: ReviewEndpoint,
  lessonVersion: number,
): string {
  return `${userId}:${endpoint.lessonId}:${endpoint.wordId}:${lessonVersion}`;
}

export function reviewResponseDisposition(status: number): ReviewResponseDisposition {
  if (status >= 200 && status < 300) return "synced";
  if (status === 401) return "refresh-session";
  if (status === 408 || status === 425 || status === 429 || status >= 500) return "retry";
  return "failed";
}

function createUUID(): string {
  const cryptography = globalThis.crypto;
  if (!cryptography) throw new Error("Secure random generation is unavailable");
  if (typeof cryptography.randomUUID === "function") return cryptography.randomUUID();

  const bytes = new Uint8Array(16);
  cryptography.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isReviewOutboxRecord(value: unknown): value is ReviewOutboxRecord {
  if (!isRecord(value)) return false;
  return typeof value.operationKey === "string"
    && typeof value.idempotencyKey === "string"
    && typeof value.userId === "string"
    && typeof value.endpoint === "string"
    && typeof value.lessonId === "string"
    && isFiniteInteger(value.wordId)
    && isFiniteInteger(value.lessonVersion)
    && typeof value.requestBody === "string"
    && (value.status === "pending" || value.status === "failed" || value.status === "synced")
    && isFiniteInteger(value.attempts)
    && typeof value.createdAt === "string"
    && typeof value.updatedAt === "string"
    && typeof value.lastErrorCode === "string"
    && typeof value.lastErrorMessage === "string";
}

function openReviewDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (database.objectStoreNames.contains(REVIEW_STORE)) return;
      const store = database.createObjectStore(REVIEW_STORE, { keyPath: "operationKey" });
      store.createIndex("userId", "userId", { unique: false });
      store.createIndex("userStatus", ["userId", "status"], { unique: false });
      store.createIndex("updatedAt", "updatedAt", { unique: false });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open review outbox"));
    request.onblocked = () => reject(new Error("Review outbox upgrade is blocked by another tab"));
  });
}

function transactionResult<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void,
): Promise<T> {
  return openReviewDatabase().then((database) => new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(REVIEW_STORE, mode);
    const store = transaction.objectStore(REVIEW_STORE);
    let result: T | undefined;
    let resolved = false;

    const capture = (value: T) => {
      result = value;
      resolved = true;
    };
    transaction.oncomplete = () => {
      database.close();
      if (!resolved) reject(new Error("Review outbox transaction completed without a result"));
      else resolve(result as T);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Review outbox transaction failed"));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Review outbox transaction was aborted"));
    };

    try {
      operation(store, capture, (reason) => {
        try {
          transaction.abort();
        } catch {
          database.close();
        }
        reject(reason);
      });
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        database.close();
      }
      reject(error);
    }
  }));
}

export function enqueueLessonReview(input: {
  userId: string;
  endpoint: string;
  reviewEndpoint: ReviewEndpoint;
  payload: LessonReviewPayload;
  requestBody: string;
}): Promise<ReviewOutboxRecord> {
  const operationKey = reviewOperationKey(input.userId, input.reviewEndpoint, input.payload.lessonVersion);
  return transactionResult<ReviewOutboxRecord>("readwrite", (store, resolve, reject) => {
    const getRequest = store.get(operationKey);
    getRequest.onerror = () => reject(getRequest.error ?? new Error("Unable to read queued review"));
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (isReviewOutboxRecord(existing)) {
        resolve(existing);
        return;
      }
      const now = new Date().toISOString();
      const record: ReviewOutboxRecord = {
        operationKey,
        idempotencyKey: createUUID(),
        userId: input.userId,
        endpoint: input.endpoint,
        lessonId: input.reviewEndpoint.lessonId,
        wordId: input.reviewEndpoint.wordId,
        lessonVersion: input.payload.lessonVersion,
        requestBody: input.requestBody,
        status: "pending",
        attempts: 0,
        createdAt: now,
        updatedAt: now,
        lastErrorCode: "",
        lastErrorMessage: "",
      };
      const putRequest = store.put(record);
      putRequest.onerror = () => reject(putRequest.error ?? new Error("Unable to queue review"));
      putRequest.onsuccess = () => resolve(record);
    };
  });
}

export function updateLessonReview(
  operationKey: string,
  changes: Partial<Pick<ReviewOutboxRecord, "status" | "attempts" | "lastErrorCode" | "lastErrorMessage">>,
): Promise<ReviewOutboxRecord | null> {
  return transactionResult<ReviewOutboxRecord | null>("readwrite", (store, resolve, reject) => {
    const getRequest = store.get(operationKey);
    getRequest.onerror = () => reject(getRequest.error ?? new Error("Unable to read queued review"));
    getRequest.onsuccess = () => {
      if (!isReviewOutboxRecord(getRequest.result)) {
        resolve(null);
        return;
      }
      const next: ReviewOutboxRecord = {
        ...getRequest.result,
        ...changes,
        updatedAt: new Date().toISOString(),
      };
      const putRequest = store.put(next);
      putRequest.onerror = () => reject(putRequest.error ?? new Error("Unable to update queued review"));
      putRequest.onsuccess = () => resolve(next);
    };
  });
}

export function listLessonReviews(userId: string): Promise<ReviewOutboxRecord[]> {
  return transactionResult<ReviewOutboxRecord[]>("readonly", (store, resolve, reject) => {
    const request = store.index("userId").getAll(userId);
    request.onerror = () => reject(request.error ?? new Error("Unable to list queued reviews"));
    request.onsuccess = () => {
      const records = Array.isArray(request.result)
        ? request.result.filter(isReviewOutboxRecord).sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        : [];
      resolve(records);
    };
  });
}

export async function reviewOutboxSummary(userId: string): Promise<ReviewOutboxSummary> {
  const records = await listLessonReviews(userId);
  let latestSyncedAt = "";
  const summary = records.reduce<ReviewOutboxSummary>((current, record) => {
    current[record.status] += 1;
    if (record.status === "synced" && record.updatedAt > latestSyncedAt) latestSyncedAt = record.updatedAt;
    return current;
  }, { pending: 0, failed: 0, synced: 0, latestSyncedAt: "" });
  summary.latestSyncedAt = latestSyncedAt;
  return summary;
}

export function pruneSyncedLessonReviews(now = Date.now()): Promise<number> {
  return transactionResult<number>("readwrite", (store, resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error ?? new Error("Unable to prune synced reviews"));
    request.onsuccess = () => {
      const records = Array.isArray(request.result) ? request.result.filter(isReviewOutboxRecord) : [];
      const expired = records.filter((record) => record.status === "synced"
        && now - Date.parse(record.updatedAt) >= SYNCED_RETENTION_MS);
      if (expired.length === 0) {
        resolve(0);
        return;
      }
      let remaining = expired.length;
      for (const record of expired) {
        const deleteRequest = store.delete(record.operationKey);
        deleteRequest.onerror = () => reject(deleteRequest.error ?? new Error("Unable to delete synced review"));
        deleteRequest.onsuccess = () => {
          remaining -= 1;
          if (remaining === 0) resolve(expired.length);
        };
      }
    };
  });
}
