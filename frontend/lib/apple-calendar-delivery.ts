import {
  CALENDAR_EVENT_TITLE,
  CALENDAR_ICS_FILE_NAME,
  CALENDAR_ICS_MEDIA_TYPE,
} from "./calendar-reminder";

const OBJECT_URL_LIFETIME_MS = 60_000;

type FileShareData = {
  files: File[];
  title?: string;
  text?: string;
};

type FileShareNavigator = {
  canShare?: (data: FileShareData) => boolean;
  share?: (data: FileShareData) => Promise<void>;
};

export type AppleCalendarShareResult = "shared" | "unsupported" | "cancelled";
export type AppleCalendarDeliveryMethod = "shared" | "downloaded" | "navigated" | "cancelled";

export type AppleCalendarDeliveryAdapters = {
  createBlob: (calendar: string) => Blob;
  createFile: (calendar: string) => File | null;
  shareFile: (file: File) => Promise<AppleCalendarShareResult>;
  downloadBlob: (blob: Blob, fileName: string) => boolean;
  navigate: (url: string) => void;
};

function errorName(error: unknown): string {
  if (typeof error !== "object" || error === null || !("name" in error)) return "";
  return typeof error.name === "string" ? error.name : "";
}

export async function shareAppleCalendarFile(
  file: File,
  shareNavigator: FileShareNavigator | null = typeof navigator === "undefined"
    ? null
    : navigator as FileShareNavigator,
): Promise<AppleCalendarShareResult> {
  if (!shareNavigator || typeof shareNavigator.canShare !== "function" || typeof shareNavigator.share !== "function") {
    return "unsupported";
  }

  const filePayload: FileShareData = { files: [file] };
  const sharePayload: FileShareData = {
    ...filePayload,
    title: CALENDAR_EVENT_TITLE,
    text: "Добавить повторяющееся напоминание LexiGo в календарь",
  };

  try {
    if (!shareNavigator.canShare(filePayload)) return "unsupported";
  } catch {
    return "unsupported";
  }

  try {
    await shareNavigator.share(sharePayload);
    return "shared";
  } catch (error) {
    return errorName(error) === "AbortError" ? "cancelled" : "unsupported";
  }
}

function triggerBrowserDownload(blob: Blob, fileName: string): boolean {
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    return false;
  }

  let objectURL = "";
  try {
    objectURL = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectURL;
    link.download = fileName;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectURL), OBJECT_URL_LIFETIME_MS);
    return true;
  } catch {
    if (objectURL) URL.revokeObjectURL(objectURL);
    return false;
  }
}

function browserDeliveryAdapters(): AppleCalendarDeliveryAdapters {
  return {
    createBlob: (calendar) => new Blob([calendar], { type: CALENDAR_ICS_MEDIA_TYPE }),
    createFile: (calendar) => typeof File === "undefined"
      ? null
      : new File([calendar], CALENDAR_ICS_FILE_NAME, {
          type: CALENDAR_ICS_MEDIA_TYPE,
          lastModified: Date.now(),
        }),
    shareFile: (file) => shareAppleCalendarFile(file),
    downloadBlob: triggerBrowserDownload,
    navigate: (url) => window.location.assign(url),
  };
}

export async function deliverAppleCalendarFile(
  calendar: string,
  fallbackURL: string,
  adapters: AppleCalendarDeliveryAdapters = browserDeliveryAdapters(),
): Promise<AppleCalendarDeliveryMethod> {
  const blob = adapters.createBlob(calendar);
  const file = adapters.createFile(calendar);

  if (file) {
    const shareResult = await adapters.shareFile(file);
    if (shareResult === "shared" || shareResult === "cancelled") return shareResult;
  }

  try {
    if (adapters.downloadBlob(blob, CALENDAR_ICS_FILE_NAME)) return "downloaded";
  } catch {
    // Navigation fallback below preserves a usable attachment flow.
  }

  adapters.navigate(fallbackURL);
  return "navigated";
}
