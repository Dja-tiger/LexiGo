"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

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
const MODAL_FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type CalendarReminderIntegrationProps = {
  open: boolean;
  showCard: boolean;
  onOpen: () => void;
  onClose: () => void;
};

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
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Restricted storage keeps the in-memory defaults.
    }
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

export function CalendarReminderIntegration({
  open,
  showCard,
  onOpen,
  onClose,
}: CalendarReminderIntegrationProps) {
  const [settings, setSettings] = useState<CalendarReminderSettings>(copyDefaultSettings);
  const [status, setStatus] = useState("");
  const modalRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettings(readSettings()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      wasOpenRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        const firstControl = modalRef.current?.querySelector<HTMLElement>(MODAL_FOCUSABLE_SELECTOR);
        (firstControl ?? modalRef.current)?.focus({ preventScroll: true });
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    const focusTarget = previousFocusRef.current;
    previousFocusRef.current = null;
    if (!focusTarget?.isConnected) return;
    const frame = window.requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  function openSettings() {
    setStatus("");
    onOpen();
  }

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
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      setStatus("Настройки применены для текущей сессии, но браузер запретил локальное сохранение.");
    }
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
    const url = createCalendarDownloadURL(normalized, start);
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(url);
    setStatus("Файл календаря создан. Откройте его и подтвердите добавление события в Apple Calendar.");
  }

  function handleModalKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const controls = Array.from(
      modalRef.current?.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR) ?? [],
    ).filter((element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");

    if (controls.length === 0) {
      event.preventDefault();
      modalRef.current?.focus({ preventScroll: true });
      return;
    }

    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !modalRef.current?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      {showCard ? (
        <section className="lx-calendar-reminder-card" aria-labelledby="lexigo-calendar-card-title">
          <div className="lx-calendar-reminder-card-icon" aria-hidden="true">◷</div>
          <div className="lx-calendar-reminder-card-copy">
            <span>НАПОМИНАНИЯ</span>
            <h2 id="lexigo-calendar-card-title">Не пропускайте ежедневную практику</h2>
            <p>{describeCalendarSchedule(settings)} · {settings.durationMinutes} мин. · {reminderLabel(settings.reminderMinutes).toLowerCase()}</p>
          </div>
          <button className="lx-button primary" type="button" onClick={openSettings}>
            Настроить календарь
          </button>
        </section>
      ) : null}

      {open ? (
        <div
          className="lx-calendar-modal-backdrop"
          role="presentation"
          onKeyDown={handleModalKeyDown}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <section
            ref={modalRef}
            className="lx-calendar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lexigo-calendar-modal-title"
            tabIndex={-1}
          >
            <header>
              <div>
                <span>КАЛЕНДАРЬ</span>
                <h2 id="lexigo-calendar-modal-title">Напоминание об английском</h2>
                <p>Создайте повторяющееся событие. Настройки хранятся только в этом браузере.</p>
              </div>
              <button type="button" className="lx-calendar-modal-close" aria-label="Закрыть" onClick={onClose}>×</button>
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
      ) : null}
    </>
  );
}
