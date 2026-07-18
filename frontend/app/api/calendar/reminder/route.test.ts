import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("Apple Calendar reminder endpoint", () => {
  it("returns a downloadable timezone-complete iCalendar event instead of an error page", async () => {
    const request = new Request(
      "https://lexigo.example/api/calendar/reminder"
        + "?time=19%3A00"
        + "&duration=20"
        + "&reminder=10"
        + "&recurrence=weekdays"
        + "&days=MO%2CTU%2CWE%2CTH%2CFR"
        + "&timezone=Europe%2FBerlin"
        + "&start=1815930000000",
    );

    const response = await GET(request);
    const calendar = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    expect(response.headers.get("content-disposition"))
      .toBe('attachment; filename="lexigo-study-reminder.ics"');
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(calendar).toContain("BEGIN:VCALENDAR\r\n");
    expect(calendar).toContain("BEGIN:VTIMEZONE\r\nTZID:Europe/Berlin\r\n");
    expect(calendar).toContain("DTSTART;TZID=Europe/Berlin:");
    expect(calendar).toContain("BEGIN:VEVENT\r\n");
    expect(calendar).toContain("RRULE:FREQ=WEEKLY;WKST=MO;BYDAY=MO,TU,WE,TH,FR\r\n");
    expect(calendar).toContain("BEGIN:VALARM\r\n");
    expect(calendar).toMatch(/END:VCALENDAR\r\n$/);
  });

  it("normalizes malformed query parameters and still returns a valid UTC calendar", async () => {
    const response = await GET(new Request(
      "https://lexigo.example/api/calendar/reminder"
        + "?time=99%3A99"
        + "&duration=invalid"
        + "&reminder=-100"
        + "&recurrence=unknown"
        + "&timezone=Invalid%2FZone"
        + "&start=not-a-timestamp",
    ));

    const calendar = await response.text();

    expect(response.status).toBe(200);
    expect(calendar).not.toContain("BEGIN:VTIMEZONE");
    expect(calendar).toMatch(/DTSTART:\d{8}T\d{6}Z\r\n/);
    expect(calendar).toContain("RRULE:FREQ=DAILY\r\n");
    expect(calendar).toContain("TRIGGER:PT0M\r\n");
  });

  it("rejects an extreme start timestamp instead of formatting an unsupported year", async () => {
    const response = await GET(new Request(
      "https://lexigo.example/api/calendar/reminder"
        + "?time=19%3A00"
        + "&timezone=Europe%2FBerlin"
        + "&start=8640000000000000",
    ));
    const calendar = await response.text();
    const start = calendar.match(/DTSTART;TZID=Europe\/Berlin:(\d{4})\d{4}T\d{6}/);

    expect(response.status).toBe(200);
    expect(start).not.toBeNull();
    expect(Math.abs(Number(start?.[1]) - new Date().getFullYear())).toBeLessThanOrEqual(2);
    expect(calendar).not.toContain("275760");
  });
});
