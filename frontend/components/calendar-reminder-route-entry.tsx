"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import {
  describeCalendarSchedule,
  type CalendarReminderSettings,
} from "../lib/calendar-reminder";
import {
  defaultCalendarReminderSettings,
  readCalendarReminderSettings,
  subscribeCalendarReminderSettings,
} from "../lib/calendar-reminder-storage";
import { CalendarReminderIntegration } from "./calendar-reminder-integration";

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
  const summaryRef = useRef<HTMLElement | null>(null);
  const [settings, setSettings] = useState<CalendarReminderSettings>(defaultCalendarReminderSettings);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettings(readCalendarReminderSettings()), 0);
    const unsubscribe = subscribeCalendarReminderSettings(setSettings);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const schedule = describeCalendarSchedule(settings);

  function closePreviewOnEscape(event: KeyboardEvent<HTMLDetailsElement>) {
    const details = detailsRef.current;
    if (event.key !== "Escape" || !details?.open) return;
    event.preventDefault();
    details.open = false;
    summaryRef.current?.focus();
  }

  function openDialog() {
    if (detailsRef.current) detailsRef.current.open = false;
    setDialogOpen(true);
  }

  return (
    <>
      <details
        ref={detailsRef}
        className="lx-route-reminder-entry"
        onKeyDown={closePreviewOnEscape}
      >
        <summary
          ref={summaryRef}
          aria-label={`Напоминание о занятии. ${schedule}`}
          title="Напоминание о занятии"
        >
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
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
