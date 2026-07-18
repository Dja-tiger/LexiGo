import { describe, expect, it } from "vitest";

import {
  buildCalendarICS,
  buildCalendarRecurrenceRule,
  buildGoogleCalendarURL,
  DEFAULT_CALENDAR_REMINDER,
  describeCalendarSchedule,
  nextCalendarOccurrence,
  normalizeCalendarReminderSettings,
  type CalendarReminderSettings,
} from "./calendar-reminder";

function settings(overrides: Partial<CalendarReminderSettings> = {}): CalendarReminderSettings {
  return normalizeCalendarReminderSettings({ ...DEFAULT_CALENDAR_REMINDER, ...overrides });
}

function contentLines(calendar: string): string[] {
  return calendar.split("\r\n").filter(Boolean);
}

describe("calendar reminders", () => {
  it("normalizes invalid values and keeps custom weekdays in calendar order", () => {
    expect(normalizeCalendarReminderSettings({
      time: "27:70",
      durationMinutes: 999,
      reminderMinutes: -10,
      recurrence: "custom",
      weekdays: ["FR", "MO", "FR", "INVALID"],
    })).toEqual({
      time: "19:00",
      durationMinutes: 180,
      reminderMinutes: 0,
      recurrence: "custom",
      weekdays: ["MO", "FR"],
    });
  });

  it("builds daily, weekday and custom recurrence rules", () => {
    expect(buildCalendarRecurrenceRule(settings({ recurrence: "daily" }))).toBe("FREQ=DAILY");
    expect(buildCalendarRecurrenceRule(settings({ recurrence: "weekdays" })))
      .toBe("FREQ=WEEKLY;WKST=MO;BYDAY=MO,TU,WE,TH,FR");
    expect(buildCalendarRecurrenceRule(settings({ recurrence: "custom", weekdays: ["MO", "WE", "SA"] })))
      .toBe("FREQ=WEEKLY;WKST=MO;BYDAY=MO,WE,SA");
  });

  it("finds the next selected local occurrence", () => {
    const from = new Date(2026, 6, 16, 19, 30, 0, 0);
    const occurrence = nextCalendarOccurrence(settings({
      time: "19:00",
      recurrence: "custom",
      weekdays: ["FR"],
    }), from);

    expect(occurrence.getDay()).toBe(5);
    expect(occurrence.getHours()).toBe(19);
    expect(occurrence.getMinutes()).toBe(0);
    expect(occurrence.getTime()).toBeGreaterThan(from.getTime());
  });

  it("creates a recurring Google Calendar template", () => {
    const url = new URL(buildGoogleCalendarURL(settings({ recurrence: "weekdays" }), {
      start: new Date("2026-07-17T16:00:00.000Z"),
      timeZone: "UTC",
      appURL: "https://lexigo.example",
    }));

    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe("20260717T160000/20260717T162000");
    expect(url.searchParams.get("recur")).toBe("RRULE:FREQ=WEEKLY;WKST=MO;BYDAY=MO,TU,WE,TH,FR");
    expect(url.searchParams.get("ctz")).toBe("UTC");
    expect(url.searchParams.get("details")).toContain("https://lexigo.example");
  });

  it("creates a recurring iCalendar event with a complete DST timezone definition", () => {
    const calendar = buildCalendarICS(settings({
      time: "19:00",
      recurrence: "custom",
      weekdays: ["TU", "TH"],
      reminderMinutes: 15,
    }), {
      start: new Date("2027-03-27T18:00:00.000Z"),
      generatedAt: new Date("2027-03-20T12:00:00.000Z"),
      timeZone: "Europe/Berlin",
      appURL: "https://lexigo.example",
    });

    expect(calendar).toContain("BEGIN:VCALENDAR\r\n");
    expect(calendar).toContain("BEGIN:VTIMEZONE\r\nTZID:Europe/Berlin\r\n");
    expect(calendar).toContain("X-LIC-LOCATION:Europe/Berlin\r\n");
    expect(calendar).toContain("TZOFFSETFROM:+0100\r\nTZOFFSETTO:+0200\r\n");
    expect(calendar).toContain("TZOFFSETFROM:+0200\r\nTZOFFSETTO:+0100\r\n");
    expect(calendar.indexOf("BEGIN:VTIMEZONE")).toBeLessThan(calendar.indexOf("BEGIN:VEVENT"));
    expect(calendar).toContain("DTSTART;TZID=Europe/Berlin:20270327T190000\r\n");
    expect(calendar).toContain("DTEND;TZID=Europe/Berlin:20270327T192000\r\n");
    expect(calendar).toContain("RRULE:FREQ=WEEKLY;WKST=MO;BYDAY=TU,TH\r\n");
    expect(calendar).toContain("BEGIN:VALARM\r\nTRIGGER:-PT15M\r\nACTION:DISPLAY\r\n");
    expect(calendar).toMatch(/END:VCALENDAR\r\n$/);
  });

  it("uses unambiguous UTC date-times without a redundant VTIMEZONE", () => {
    const calendar = buildCalendarICS(settings({ recurrence: "daily" }), {
      start: new Date("2026-07-16T16:00:00.000Z"),
      generatedAt: new Date("2026-07-16T12:00:00.000Z"),
      timeZone: "UTC",
    });

    expect(calendar).not.toContain("BEGIN:VTIMEZONE");
    expect(calendar).toContain("X-WR-TIMEZONE:UTC\r\n");
    expect(calendar).toContain("DTSTART:20260716T160000Z\r\n");
    expect(calendar).toContain("DTEND:20260716T162000Z\r\n");
  });

  it("emits CRLF-terminated and RFC-sized content lines", () => {
    const calendar = buildCalendarICS(settings({ recurrence: "daily" }), {
      start: new Date("2027-07-16T17:00:00.000Z"),
      generatedAt: new Date("2027-07-16T12:00:00.000Z"),
      timeZone: "Europe/Berlin",
      appURL: "https://lexigo.example/очень-длинный-путь-для-проверки-складывания-строк",
    });
    const encoder = new TextEncoder();

    expect(calendar.replaceAll("\r\n", "")).not.toContain("\n");
    expect(calendar.endsWith("\r\n")).toBe(true);
    for (const line of contentLines(calendar)) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("describes the selected schedule in Russian", () => {
    expect(describeCalendarSchedule(settings({ recurrence: "daily", time: "20:30" })))
      .toBe("Каждый день в 20:30");
    expect(describeCalendarSchedule(settings({ recurrence: "custom", weekdays: ["MO", "WE"] })))
      .toBe("Пн, Ср в 19:00");
  });
});
