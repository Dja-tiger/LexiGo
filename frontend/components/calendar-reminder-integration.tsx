"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  buildGoogleCalendarURL,
  CALENDAR_WEEKDAYS,
  DEFAULT_CALENDAR_REMINDER,
  describeCalendarSchedule,
  nextCalendarOccurrence,
  normalizeCalendarReminderSettings,
  type CalendarRecurrence,
  type CalendarReminderSettings,
  type CalendarWeekday,
} from "../lib/calendar-reminder";

const STORAGE_KEY = "lexigo.calendar.reminder.v1";
const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60];
const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60];

function copyDefaultSettings(): CalendarReminderSettings {
  return {
    ...DEFAULT_CALENDAR_REMINDER,
    weekdays: [...DEFAULT_CALENDAR_REMINDER.weekdays],
  };
}

function readSettings(): CalendarReminderSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeCalendarReminderSettings(JSON.parse(raw)) : copyDefaultSettings();
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return copyDefaultSettings();
  }
}

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function recurrenceLabel(recurrence: CalendarRecurrence): string {
  if (recurrence === "daily") return "Каждый день";
  if (recurrence === "weekdays") return "По будням";
  return "Выбранные дни";
}

function reminderLabel(minutes: number): string {
  if (minutes === 0) return "В момент начала";
  if (minutes === 60) return "За 1 час";
  return `За ${minutes} мин.`;
}

function createCalendarDownloadURL(settings: CalendarReminderSettings, start: Date): string {
  const parameters = new URLSearchParams({
    time: settings.time,
    duration: String(settings.durationMinutes),
    reminder: String(settings.reminderMinutes),
    recurrence: settings.recurrence,
    days: settings.weekdays.join(","),
    timezone: browserTimeZone(),
    start: String(start.getTime()),
  });
  return `/api/calendar/reminder?${parameters.toString()}`;
}

export function CalendarReminderIntegration() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<CalendarReminderSettings>(copyDefaultSettings);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSettings(readSettings()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let host: HTMLElement | null = null;
    let frame = 0;

    const syncHost = () => {
      frame = 0;
      const view = new URLSearchParams(window.location.search).get("view") ?? "home";
      const anchor = view === "progress"
        ? document.querySelector<HTMLElement>(".lx-progress-detail")
        : null;

      if (!anchor?.parentElement) {
        if (host?.isConnected) host.remove();
        host = null;
        setPortalHost((current) => current === null ? current : null);
        return;
      }

      if (!host?.isConnected) {
        const existing = anchor.parentElement.querySelector<HTMLElement>(":scope > .lx-calendar-reminder-host");
        host = existing ?? document.createElement("div");
        host.className = "lx-calendar-reminder-host";
        if (!host.isConnected) anchor.insertAdjacentElement("afterend", host);
        setPortalHost((current) => current === host ? current : host);
      }
    };

    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncHost);
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", scheduleSync);
    scheduleSync();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("popstate", scheduleSync);
      observer.disconnect();
      host?.remove();
    };
  }, []);

  useEffect(() => {
    const handleBellClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(".lx-icon-button[aria-label*='Уведомления']");
      if (!button) return;
      setStatus("");
      setOpen(true);
    };
    document.addEventListener("click", handleBellClick, true);
    return () => document.removeEventListener("click", handleBellClick, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function updateSettings(patch: Partial<CalendarReminderSettings>) {
    setSettings((current) => normalizeCalendarReminderSettings({ ...current, ...patch }));
    setStatus("");
  }

  function toggleWeekday(weekday: CalendarWeekday) {
    setSettings((current) => {
      const selected = current.weekdays.includes(weekday);
      if (selected && current.weekdays.length === 1) return current;
      const weekdays = selected
        ? current.weekdays.filter((value) => value !== weekday)
        : [...current.weekdays, weekday];
      return normalizeCalendarReminderSettings({ ...current, recurrence: "custom", weekdays });
    });
    setStatus("");
  }

  function persistSettings(): CalendarReminderSettings {
    const normalized = normalizeCalendarReminderSettings(settings);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setSettings(normalized);
    return normalized;
  }

  function addToGoogleCalendar() {
    const normalized = persistSettings();
    const start = nextCalendarOccurrence(normalized);
    const url = buildGoogleCalendarURL(normalized, {
      start,
      timeZone: browserTimeZone(),
      appURL: window.location.origin,
    });
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus("Событие подготовлено. Подтвердите сохранение и уведомление в Google Calendar.");
  }

  function addToAppleCalendar() {
    const normalized = persistSettings();
    const start = nextCalendarOccurrence(normalized);
    const anchor = document.createElement("a");
    anchor.href = createCalendarDownloadURL(normalized, start);
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setStatus("Файл календаря создан. Откройте его и подтвердите добавление события в Apple Calendar.");
  }

  const card = (
    <section className="lx-calendar-reminder-card" aria-labelledby="lexigo-calendar-card-title">
      <div className="lx-calendar-reminder-card-icon" aria-hidden="true">◷</div>
      <div className="lx-calendar-reminder-card-copy">
        <span>НАПОМИНАНИЯ</span>
        <h2 id="lexigo-calendar-card-title">Не пропускайте ежедневную практику</h2>
        <p>{describeCalendarSchedule(settings)} · {settings.durationMinutes} мин. · {reminderLabel(settings.reminderMinutes).toLowerCase()}</p>
      </div>
      <button className="lx-button primary" type="button" onClick={() => { setStatus(""); setOpen(true); }}>
        Настроить календарь
      </button>
    </section>
  );

  const modal = open ? (
    <div
      className="lx-calendar-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <section
        className="lx-calendar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lexigo-calendar-modal-title"
      >
        <header>
          <div>
            <span>КАЛЕНДАРЬ</span>
            <h2 id="lexigo-calendar-modal-title">Напоминание об английском</h2>
            <p>Создайте повторяющееся событие. Настройки хранятся только в этом браузере.</p>
          </div>
          <button type="button" className="lx-calendar-modal-close" aria-label="Закрыть" onClick={() => setOpen(false)}>×</button>
        </header>

        <div className="lx-calendar-form-grid">
          <label>
            <span>Время занятия</span>
            <input
              type="time"
              value={settings.time}
              onChange={(event) => updateSettings({ time: event.target.value })}
            />
          </label>
          <label>
            <span>Длительность</span>
            <select
              value={settings.durationMinutes}
              onChange={(event) => updateSettings({ durationMinutes: Number(event.target.value) })}
            >
              {DURATION_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} минут</option>)}
            </select>
          </label>
          <label>
            <span>Повторение</span>
            <select
              value={settings.recurrence}
              onChange={(event) => updateSettings({ recurrence: event.target.value as CalendarRecurrence })}
            >
              {(["daily", "weekdays", "custom"] as CalendarRecurrence[]).map((recurrence) => (
                <option key={recurrence} value={recurrence}>{recurrenceLabel(recurrence)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Уведомление</span>
            <select
              value={settings.reminderMinutes}
              onChange={(event) => updateSettings({ reminderMinutes: Number(event.target.value) })}
            >
              {REMINDER_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>{reminderLabel(minutes)}</option>)}
            </select>
          </label>
        </div>

        {settings.recurrence === "custom" ? (
          <fieldset className="lx-calendar-weekdays">
            <legend>Дни недели</legend>
            <div>
              {CALENDAR_WEEKDAYS.map((weekday) => {
                const selected = settings.weekdays.includes(weekday.code);
                return (
                  <button
                    key={weekday.code}
                    type="button"
                    className={selected ? "selected" : ""}
                    aria-pressed={selected}
                    title={weekday.longLabel}
                    onClick={() => toggleWeekday(weekday.code)}
                  >
                    {weekday.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="lx-calendar-preview">
          <span>Будущее расписание</span>
          <strong>{describeCalendarSchedule(settings)}</strong>
          <small>Занятие на {settings.durationMinutes} минут, уведомление: {reminderLabel(settings.reminderMinutes).toLowerCase()}.</small>
        </div>

        <div className="lx-calendar-provider-grid">
          <button type="button" className="google" onClick={addToGoogleCalendar}>
            <span aria-hidden="true">G</span>
            <div><strong>Google Calendar</strong><small>Открыть готовое повторяющееся событие</small></div>
          </button>
          <button type="button" className="apple" onClick={addToAppleCalendar}>
            <span aria-hidden="true">A</span>
            <div><strong>Apple Calendar</strong><small>Добавить через стандартный файл iCalendar</small></div>
          </button>
        </div>

        <p className="lx-calendar-privacy-note">
          LexiGo не получает доступ к вашим календарям. Финальное добавление и разрешение уведомлений подтверждаются в Google или Apple Calendar.
        </p>
        {status ? <p className="lx-calendar-status" role="status">{status}</p> : null}
      </section>
    </div>
  ) : null;

  return (
    <>
      {portalHost ? createPortal(card, portalHost) : null}
      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
