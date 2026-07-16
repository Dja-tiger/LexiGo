import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("Apple Calendar reminder endpoint", () => {
  it("returns a downloadable iCalendar event instead of a 404 response", async () => {
    const request = new Request(
      "https://lexigo.example/api/calendar/reminder"
        + "?time=19%3A00"
        + "&duration=20"
        + "&reminder=10"
        + "&recurrence=weekdays"
        + "&days=MO%2CTU%2CWE%2CTH%2CFR"
        + "&timezone=UTC"
        + "&start=1784304000000",
    );

    const response = await GET(request);
    const calendar = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    expect(response.headers.get("content-disposition"))
      .toBe('attachment; filename="lexigo-study-reminder.ics"');
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    expect(calendar).toContain("BEGIN:VCALENDAR\r\n");
    expect(calendar).toContain("BEGIN:VEVENT\r\n");
    expect(calendar).toContain("RRULE:FREQ=WEEKLY;WKST=MO;BYDAY=MO,TU,WE,TH,FR\r\n");
    expect(calendar).toContain("BEGIN:VALARM\r\n");
    expect(calendar).toMatch(/END:VCALENDAR\r\n$/);
  });

  it("normalizes malformed query parameters and still returns a valid calendar", async () => {
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
    expect(calendar).toContain("DTSTART;TZID=UTC:");
    expect(calendar).toContain("RRULE:FREQ=DAILY\r\n");
    expect(calendar).toContain("TRIGGER:PT0M\r\n");
  });
});
