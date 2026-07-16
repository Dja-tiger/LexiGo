export const CALENDAR_WEEKDAYS = [
  { code: "MO", label: "Пн", longLabel: "Понедельник", day: 1 },
  { code: "TU", label: "Вт", longLabel: "Вторник", day: 2 },
  { code: "WE", label: "Ср", longLabel: "Среда", day: 3 },
  { code: "TH", label: "Чт", longLabel: "Четверг", day: 4 },
  { code: "FR", label: "Пт", longLabel: "Пятница", day: 5 },
  { code: "SA", label: "Сб", longLabel: "Суббота", day: 6 },
  { code: "SU", label: "Вс", longLabel: "Воскресенье", day: 0 },
] as const;

export type CalendarWeekday = (typeof CALENDAR_WEEKDAYS)[number]["code"];
export type CalendarRecurrence = "daily" | "weekdays" | "custom";

export type CalendarReminderSettings = {
  time: string;
  durationMinutes: number;
  reminderMinutes: number;
  recurrence: CalendarRecurrence;
  weekdays: CalendarWeekday[];
};

export type CalendarEventOptions = {
  start: Date;
  timeZone: string;
  appURL?: string;
  generatedAt?: Date;
};

export const DEFAULT_CALENDAR_REMINDER: CalendarReminderSettings = {
  time: "19:00",
  durationMinutes: 20,
  reminderMinutes: 10,
  recurrence: "daily",
  weekdays: CALENDAR_WEEKDAYS.map((weekday) => weekday.code),
};

export const CALENDAR_EVENT_TITLE = "LexiGo — повторение английского";
export const CALENDAR_EVENT_DESCRIPTION = "Откройте LexiGo и выполните дневную цель по английскому.";

const WEEKDAY_CODES = new Set<string>(CALENDAR_WEEKDAYS.map((weekday) => weekday.code));
const WORKDAYS: CalendarWeekday[] = ["MO", "TU", "WE", "TH", "FR"];

function recordFrom(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
}

function normalizeTime(value: unknown): string {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return DEFAULT_CALENDAR_REMINDER.time;
  }
  return value;
}

function normalizeRecurrence(value: unknown): CalendarRecurrence {
  return value === "weekdays" || value === "custom" || value === "daily"
    ? value
    : DEFAULT_CALENDAR_REMINDER.recurrence;
}

function normalizeWeekdays(value: unknown): CalendarWeekday[] {
  if (!Array.isArray(value)) return [...DEFAULT_CALENDAR_REMINDER.weekdays];
  const selected = value
    .filter((weekday): weekday is CalendarWeekday => typeof weekday === "string" && WEEKDAY_CODES.has(weekday))
    .filter((weekday, index, items) => items.indexOf(weekday) === index);
  return CALENDAR_WEEKDAYS
    .map((weekday) => weekday.code)
    .filter((weekday) => selected.includes(weekday));
}

export function normalizeCalendarReminderSettings(value: unknown): CalendarReminderSettings {
  const source = recordFrom(value);
  const recurrence = normalizeRecurrence(source.recurrence);
  const normalizedWeekdays = normalizeWeekdays(source.weekdays);
  const weekdays = recurrence === "custom" && normalizedWeekdays.length === 0
    ? [...WORKDAYS]
    : normalizedWeekdays;

  return {
    time: normalizeTime(source.time),
    durationMinutes: boundedInteger(source.durationMinutes, DEFAULT_CALENDAR_REMINDER.durationMinutes, 5, 180),
    reminderMinutes: boundedInteger(source.reminderMinutes, DEFAULT_CALENDAR_REMINDER.reminderMinutes, 0, 1440),
    recurrence,
    weekdays,
  };
}

export function effectiveCalendarWeekdays(settings: CalendarReminderSettings): CalendarWeekday[] {
  if (settings.recurrence === "daily") return CALENDAR_WEEKDAYS.map((weekday) => weekday.code);
  if (settings.recurrence === "weekdays") return [...WORKDAYS];
  return settings.weekdays.length > 0 ? [...settings.weekdays] : [...WORKDAYS];
}

function weekdayCode(date: Date): CalendarWeekday {
  return CALENDAR_WEEKDAYS.find((weekday) => weekday.day === date.getDay())?.code ?? "MO";
}

export function nextCalendarOccurrence(
  value: CalendarReminderSettings,
  from = new Date(),
): Date {
  const settings = normalizeCalendarReminderSettings(value);
  const [hour, minute] = settings.time.split(":").map(Number);
  const allowedDays = new Set(effectiveCalendarWeekdays(settings));

  for (let offset = 0; offset < 15; offset += 1) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + offset);
    candidate.setHours(hour, minute, 0, 0);
    if (candidate.getTime() > from.getTime() && allowedDays.has(weekdayCode(candidate))) {
      return candidate;
    }
  }

  const fallback = new Date(from);
  fallback.setDate(from.getDate() + 1);
  fallback.setHours(hour, minute, 0, 0);
  return fallback;
}

export function buildCalendarRecurrenceRule(value: CalendarReminderSettings): string {
  const settings = normalizeCalendarReminderSettings(value);
  if (settings.recurrence === "daily") return "FREQ=DAILY";
  return `FREQ=WEEKLY;WKST=MO;BYDAY=${effectiveCalendarWeekdays(settings).join(",")}`;
}

export function describeCalendarSchedule(value: CalendarReminderSettings): string {
  const settings = normalizeCalendarReminderSettings(value);
  if (settings.recurrence === "daily") return `Каждый день в ${settings.time}`;
  if (settings.recurrence === "weekdays") return `По будням в ${settings.time}`;
  const labels = effectiveCalendarWeekdays(settings)
    .map((code) => CALENDAR_WEEKDAYS.find((weekday) => weekday.code === code)?.label)
    .filter(Boolean)
    .join(", ");
  return `${labels} в ${settings.time}`;
}

export function normalizeCalendarTimeZone(value: string | null | undefined): string {
  const candidate = value?.trim();
  if (!candidate || candidate.length > 100) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return "UTC";
  }
}

type DateParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

function dateParts(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: normalizeCalendarTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const values = Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function calendarDate(date: Date, timeZone: string): string {
  const parts = dateParts(date, timeZone);
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
}

function utcCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function eventDescription(appURL?: string): string {
  const normalizedURL = appURL?.trim();
  return normalizedURL
    ? `${CALENDAR_EVENT_DESCRIPTION}\n${normalizedURL}`
    : CALENDAR_EVENT_DESCRIPTION;
}

export function buildGoogleCalendarURL(
  value: CalendarReminderSettings,
  options: CalendarEventOptions,
): string {
  const settings = normalizeCalendarReminderSettings(value);
  const timeZone = normalizeCalendarTimeZone(options.timeZone);
  const end = new Date(options.start.getTime() + settings.durationMinutes * 60_000);
  const parameters = new URLSearchParams({
    action: "TEMPLATE",
    text: CALENDAR_EVENT_TITLE,
    dates: `${calendarDate(options.start, timeZone)}/${calendarDate(end, timeZone)}`,
    details: eventDescription(options.appURL),
    recur: `RRULE:${buildCalendarRecurrenceRule(settings)}`,
    ctz: timeZone,
    trp: "false",
  });
  return `https://calendar.google.com/calendar/render?${parameters.toString()}`;
}

function escapeICalendarText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldICalendarLine(line: string): string[] {
  const encoder = new TextEncoder();
  const folded: string[] = [];
  let current = "";
  let currentBytes = 0;

  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    const limit = folded.length === 0 ? 75 : 74;
    if (current && currentBytes + characterBytes > limit) {
      folded.push(current);
      current = ` ${character}`;
      currentBytes = 1 + characterBytes;
    } else {
      current += character;
      currentBytes += characterBytes;
    }
  }

  folded.push(current);
  return folded;
}

export function buildCalendarICS(
  value: CalendarReminderSettings,
  options: CalendarEventOptions,
): string {
  const settings = normalizeCalendarReminderSettings(value);
  const timeZone = normalizeCalendarTimeZone(options.timeZone);
  const generatedAt = options.generatedAt ?? new Date();
  const end = new Date(options.start.getTime() + settings.durationMinutes * 60_000);
  const alarmTrigger = settings.reminderMinutes === 0 ? "PT0M" : `-PT${settings.reminderMinutes}M`;
  const uid = `lexigo-${options.start.getTime()}-${settings.time.replace(":", "")}@lexigo.app`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LexiGo//Study Reminder//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcCalendarDate(generatedAt)}`,
    `DTSTART;TZID=${timeZone}:${calendarDate(options.start, timeZone)}`,
    `DTEND;TZID=${timeZone}:${calendarDate(end, timeZone)}`,
    `RRULE:${buildCalendarRecurrenceRule(settings)}`,
    `SUMMARY:${escapeICalendarText(CALENDAR_EVENT_TITLE)}`,
    `DESCRIPTION:${escapeICalendarText(eventDescription(options.appURL))}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    `TRIGGER:${alarmTrigger}`,
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICalendarText("Пора повторить английский в LexiGo")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.flatMap(foldICalendarLine).join("\r\n")}\r\n`;
}
