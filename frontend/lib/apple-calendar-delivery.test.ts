import { describe, expect, it, vi } from "vitest";

import {
  deliverAppleCalendarFile,
  shareAppleCalendarFile,
  type AppleCalendarDeliveryAdapters,
  type AppleCalendarShareResult,
} from "./apple-calendar-delivery";

const calendar = "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n";
const fallbackURL = "/api/calendar/reminder?time=19%3A00";
const file = { name: "lexigo-study-reminder.ics", type: "text/calendar" } as File;
const blob = { type: "text/calendar" } as Blob;

function adapters(
  shareResult: AppleCalendarShareResult,
  downloadResult = true,
): AppleCalendarDeliveryAdapters & {
  createBlob: ReturnType<typeof vi.fn>;
  createFile: ReturnType<typeof vi.fn>;
  shareFile: ReturnType<typeof vi.fn>;
  downloadBlob: ReturnType<typeof vi.fn>;
  navigate: ReturnType<typeof vi.fn>;
} {
  return {
    createBlob: vi.fn(() => blob),
    createFile: vi.fn(() => file),
    shareFile: vi.fn(async () => shareResult),
    downloadBlob: vi.fn(() => downloadResult),
    navigate: vi.fn(),
  };
}

describe("Apple Calendar delivery", () => {
  it("uses native file sharing without triggering a download or navigation", async () => {
    const delivery = adapters("shared");

    await expect(deliverAppleCalendarFile(calendar, fallbackURL, delivery)).resolves.toBe("shared");

    expect(delivery.createBlob).toHaveBeenCalledWith(calendar);
    expect(delivery.createFile).toHaveBeenCalledWith(calendar);
    expect(delivery.shareFile).toHaveBeenCalledWith(file);
    expect(delivery.downloadBlob).not.toHaveBeenCalled();
    expect(delivery.navigate).not.toHaveBeenCalled();
  });

  it("treats user cancellation as final and does not start another flow", async () => {
    const delivery = adapters("cancelled");

    await expect(deliverAppleCalendarFile(calendar, fallbackURL, delivery)).resolves.toBe("cancelled");

    expect(delivery.downloadBlob).not.toHaveBeenCalled();
    expect(delivery.navigate).not.toHaveBeenCalled();
  });

  it("downloads the file when file sharing is unsupported", async () => {
    const delivery = adapters("unsupported");

    await expect(deliverAppleCalendarFile(calendar, fallbackURL, delivery)).resolves.toBe("downloaded");

    expect(delivery.downloadBlob).toHaveBeenCalledWith(blob, "lexigo-study-reminder.ics");
    expect(delivery.navigate).not.toHaveBeenCalled();
  });

  it("navigates to the attachment endpoint only when sharing and download are unavailable", async () => {
    const delivery = adapters("unsupported", false);

    await expect(deliverAppleCalendarFile(calendar, fallbackURL, delivery)).resolves.toBe("navigated");

    expect(delivery.navigate).toHaveBeenCalledWith(fallbackURL);
  });

  it("falls back to navigation when the download adapter throws", async () => {
    const delivery = adapters("unsupported");
    delivery.downloadBlob.mockImplementation(() => {
      throw new Error("download blocked");
    });

    await expect(deliverAppleCalendarFile(calendar, fallbackURL, delivery)).resolves.toBe("navigated");

    expect(delivery.navigate).toHaveBeenCalledWith(fallbackURL);
  });
});

describe("native Apple Calendar file sharing", () => {
  it("validates and shares the iCalendar file", async () => {
    const canShare = vi.fn(() => true);
    const share = vi.fn(async () => undefined);

    await expect(shareAppleCalendarFile(file, { canShare, share })).resolves.toBe("shared");

    expect(canShare).toHaveBeenCalledWith(expect.objectContaining({ files: [file] }));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: [file] }));
  });

  it("does not call share when the browser rejects the file type", async () => {
    const share = vi.fn(async () => undefined);

    await expect(shareAppleCalendarFile(file, { canShare: () => false, share }))
      .resolves.toBe("unsupported");

    expect(share).not.toHaveBeenCalled();
  });

  it("preserves an explicit share-sheet cancellation", async () => {
    const share = vi.fn(async () => {
      throw { name: "AbortError" };
    });

    await expect(shareAppleCalendarFile(file, { canShare: () => true, share }))
      .resolves.toBe("cancelled");
  });

  it("allows download fallback after a non-cancellation share error", async () => {
    const share = vi.fn(async () => {
      throw new Error("share unavailable");
    });

    await expect(shareAppleCalendarFile(file, { canShare: () => true, share }))
      .resolves.toBe("unsupported");
  });
});
