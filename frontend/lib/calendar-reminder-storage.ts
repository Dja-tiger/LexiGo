import {
  DEFAULT_CALENDAR_REMINDER,
  normalizeCalendarReminderSettings,
  type CalendarReminderSettings,
} from "./calendar-reminder";

export const CALENDAR_REMINDER_STORAGE_KEY = "lexigo.calendar.reminder.v1";
export const CALENDAR_REMINDER_UPDATED_EVENT = "lexigo:calendar-reminder-updated";

export type CalendarReminderPersistenceResult = {
  settings: CalendarReminderSettings;
  persisted: boolean;
};

export function defaultCalendarReminderSettings(): CalendarReminderSettings {
  return {
    ...DEFAULT_CALENDAR_REMINDER,
    weekdays: [...DEFAULT_CALENDAR_REMINDER.weekdays],
  };
}

export function readCalendarReminderSettings(): CalendarReminderSettings {
  if (typeof window === "undefined") return defaultCalendarReminderSettings();

  try {
    const raw = window.localStorage.getItem(CALENDAR_REMINDER_STORAGE_KEY);
    return raw
      ? normalizeCalendarReminderSettings(JSON.parse(raw))
      : defaultCalendarReminderSettings();
  } catch {
    try {
      window.localStorage.removeItem(CALENDAR_REMINDER_STORAGE_KEY);
    } catch {
      // Restricted browser storage keeps the in-memory defaults.
    }
    return defaultCalendarReminderSettings();
  }
}

export function persistCalendarReminderSettings(
  value: CalendarReminderSettings,
): CalendarReminderPersistenceResult {
  const settings = normalizeCalendarReminderSettings(value);
  let persisted = false;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CALENDAR_REMINDER_STORAGE_KEY, JSON.stringify(settings));
      persisted = true;
    } catch {
      // The caller presents a session-only fallback message.
    }

    window.dispatchEvent(new CustomEvent<CalendarReminderSettings>(
      CALENDAR_REMINDER_UPDATED_EVENT,
      { detail: settings },
    ));
  }

  return { settings, persisted };
}

export function subscribeCalendarReminderSettings(
  listener: (settings: CalendarReminderSettings) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleUpdate = (event: Event) => {
    const detail = event instanceof CustomEvent ? event.detail : undefined;
    listener(detail
      ? normalizeCalendarReminderSettings(detail)
      : readCalendarReminderSettings());
  };

  window.addEventListener(CALENDAR_REMINDER_UPDATED_EVENT, handleUpdate);
  return () => window.removeEventListener(CALENDAR_REMINDER_UPDATED_EVENT, handleUpdate);
}
