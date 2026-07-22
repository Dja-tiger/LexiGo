"use client";

import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_CALENDAR_REMINDER,
  describeCalendarSchedule,
  normalizeCalendarReminderSettings,
  type CalendarReminderSettings,
} from "../lib/calendar-reminder";
import { CalendarReminderIntegration } from "./calendar-reminder-integration";

// This key is the public browser-storage contract owned by CalendarReminderIntegration.
// Keeping it explicit here lets the route-level entry preview the saved schedule without
// opening the modal or introducing a second persistence format.
const CALENDAR_REMINDER_STORAGE_KEY = "lexigo.calendar.reminder.v1";

function defaultSettings(): CalendarReminderSettings {
  return {
    ...DEFAULT_CALENDAR_REMINDER,
    weekdays: [...DEFAULT_CALENDAR_REMINDER.weekdays],
  };
}

function readSavedSettings(): CalendarReminderSettings {
  try {
    const raw = window.localStorage.getItem(CALENDAR_REMINDER_STORAGE_KEY);
    return raw
      ? normalizeCalendarReminderSettings(JSON.parse(raw))
      : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

function CalendarReminderIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <path d="M12 14v3l2 1" />
    </svg>
  );
}

export function CalendarReminderRouteEntry() {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const [settings, setSettings] = useState<CalendarReminderSettings>(defaultSettings);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettings(readSavedSettings()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const schedule = describeCalendarSchedule(settings);

  function openDialog() {
    if (detailsRef.current) detailsRef.current.open = false;
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    // CalendarReminderIntegration persists settings before provider hand-off. Re-reading
    // keeps the route-level preview synchronized after every dialog interaction.
    setSettings(readSavedSettings());
  }

  return (
    <>
      <details ref={detailsRef} className="lx-route-reminder-entry">
        <summary aria-label={`Напоминание о занятии. ${schedule}`} title="Напоминание о занятии">
          <CalendarReminderIcon />
          <span>Напоминание</span>
        </summary>
        <section className="lx-route-reminder-preview" aria-label="Текущее напоминание о занятии">
          <span>НАПОМИНАНИЕ О ЗАНЯТИИ</span>
          <strong>{schedule}</strong>
          <p>Расписание хранится только в этом браузере. LexiGo не получает доступ к календарю.</p>
          <button className="lx-button primary" type="button" onClick={openDialog}>
            Настроить календарь
          </button>
        </section>
      </details>

      <CalendarReminderIntegration
        open={dialogOpen}
        showCard={false}
        onOpen={openDialog}
        onClose={closeDialog}
      />
    </>
  );
}
