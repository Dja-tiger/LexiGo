import {
  buildCalendarICS,
  CALENDAR_ICS_FILE_NAME,
  CALENDAR_ICS_MEDIA_TYPE,
  nextCalendarOccurrence,
  normalizeCalendarReminderSettings,
  normalizeCalendarTimeZone,
} from "../../../../lib/calendar-reminder";

export const dynamic = "force-dynamic";

const MAX_START_DISTANCE_MS = 400 * 24 * 60 * 60 * 1_000;

function parseStart(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return fallback;
  if (Math.abs(timestamp - fallback.getTime()) > MAX_START_DISTANCE_MS) return fallback;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const search = url.searchParams;
  const settings = normalizeCalendarReminderSettings({
    time: search.get("time"),
    durationMinutes: search.get("duration"),
    reminderMinutes: search.get("reminder"),
    recurrence: search.get("recurrence"),
    weekdays: search.get("days")?.split(",").filter(Boolean),
  });
  const timeZone = normalizeCalendarTimeZone(search.get("timezone"));
  const fallbackStart = nextCalendarOccurrence(settings);
  const start = parseStart(search.get("start"), fallbackStart);
  const calendar = buildCalendarICS(settings, {
    start,
    timeZone,
    appURL: url.origin,
  });

  return new Response(calendar, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${CALENDAR_ICS_FILE_NAME}"`,
      "Content-Type": `${CALENDAR_ICS_MEDIA_TYPE}; charset=utf-8`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
