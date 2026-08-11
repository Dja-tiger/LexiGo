"use client";

import { useEffect, useRef, useState } from "react";

import { deliverAppleCalendarFile, type AppleCalendarDeliveryMethod } from "../lib/apple-calendar-delivery";
import {
  buildCalendarICS,
  buildGoogleCalendarURL,
  CALENDAR_ICS_FILE_NAME,
  CALENDAR_WEEKDAYS,
  describeCalendarSchedule,
  nextCalendarOccurrence,
  normalizeCalendarReminderSettings,
  type CalendarRecurrence,
  type CalendarReminderSettings,
  type CalendarWeekday,
} from "../lib/calendar-reminder";
import {
  defaultCalendarReminderSettings,
  persistCalendarReminderSettings,
  readCalendarReminderSettings,
  subscribeCalendarReminderSettings,
  type CalendarReminderPersistenceResult,
} from "../lib/calendar-reminder-storage";
import { AccessibleDialog } from "./accessible-dialog";
import { useFeedback } from "./feedback-center";

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60];
const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60];

type CalendarReminderIntegrationProps = {
  open: boolean;
  showCard: boolean;
  onOpen: () => void;
  onClose: () => void;
};

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

function appleCalendarStatus(method: AppleCalendarDeliveryMethod): string {
  if (method === "shared") {
    return "Файл передан выбранному приложению. В Apple Calendar подтвердите добавление события и уведомления.";
  }
  if (method === "downloaded") {
    return `Файл ${CALENDAR_ICS_FILE_NAME} загружен. Откройте его и подтвердите добавление события в Apple Calendar.`;
  }
  if (method === "navigated") {
    return "Открыт файл iCalendar. Подтвердите добавление события и уведомления в Apple Calendar.";
  }
  return "Добавление отменено. Apple Calendar не изменён.";
}

function sessionOnlyStatus(message: string, persisted: boolean): string {
  return persisted
    ? message
    : `${message} Браузер запретил локальное сохранение, поэтому настройки действуют только в текущей сессии.`;
}

export function CalendarReminderIntegration({
  open,
  showCard,
  onOpen,
  onClose,
}: CalendarReminderIntegrationProps) {
  const { publish } = useFeedback();
  const [settings, setSettings] = useState<CalendarReminderSettings>(defaultCalendarReminderSettings);
  const [appleCalendarPending, setAppleCalendarPending] = useState(false);
  const appleCalendarPendingRef = useRef(false);
  const dialogTitleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettings(readCalendarReminderSettings()), 0);
    const unsubscribe = subscribeCalendarReminderSettings(setSettings);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  function openSettings() {
    onOpen();
  }

  function updateSettings(patch: Partial<CalendarReminderSettings>) {
    setSettings((current) => normalizeCalendarReminderSettings({ ...current, ...patch }));
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
  }

  function persistSettings(): CalendarReminderPersistenceResult {
    const result = persistCalendarReminderSettings(settings);
    setSettings(result.settings);
    return result;
  }

  function addToGoogleCalendar() {
    const persistence = persistSettings();
    const start = nextCalendarOccurrence(persistence.settings);
    const url = buildGoogleCalendarURL(persistence.settings, {
      start,
      timeZone: browserTimeZone(),
      appURL: window.location.origin,
    });
    window.open(url, "_blank", "noopener,noreferrer");
    publish({
      category: "info",
      title: "Google Calendar открыт",
      message: sessionOnlyStatus(
        "Событие подготовлено. Подтвердите сохранение и уведомление в Google Calendar.",
        persistence.persisted,
      ),
    });
  }

  async function addToAppleCalendar() {
    if (appleCalendarPendingRef.current) return;
    appleCalendarPendingRef.current = true;
    setAppleCalendarPending(true);

    try {
      const persistence = persistSettings();
      const start = nextCalendarOccurrence(persistence.settings);
      const timeZone = browserTimeZone();
      const calendar = buildCalendarICS(persistence.settings, {
        start,
        timeZone,
        appURL: window.location.origin,
      });
      const method = await deliverAppleCalendarFile(
        calendar,
        createCalendarDownloadURL(persistence.settings, start),
      );
      publish({
        category: "info",
        title: method === "cancelled" ? "Добавление отменено" : "Apple Calendar подготовлен",
        message: sessionOnlyStatus(appleCalendarStatus(method), persistence.persisted),
      });
    } catch {
      publish({
        category: "error",
        title: "Не удалось открыть Apple Calendar",
        message: "Не удалось запустить импорт. Откройте LexiGo в Safari и повторите попытку.",
      });
    } finally {
      appleCalendarPendingRef.current = false;
      setAppleCalendarPending(false);
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

      <AccessibleDialog
        open={open}
        className="lx-calendar-modal"
        backdropClassName="lx-calendar-modal-backdrop"
        labelledBy="lexigo-calendar-modal-title"
        describedBy="lexigo-calendar-modal-description"
        initialFocusRef={dialogTitleRef}
        onClose={onClose}
      >
        <header>
          <div>
            <span>КАЛЕНДАРЬ</span>
            <h2 id="lexigo-calendar-modal-title" ref={dialogTitleRef} tabIndex={-1}>Напоминание об английском</h2>
            <p id="lexigo-calendar-modal-description">Создайте повторяющееся событие. Настройки хранятся только в этом браузере.</p>
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
          <button
            type="button"
            className="apple"
            disabled={appleCalendarPending}
            aria-busy={appleCalendarPending}
            onClick={() => void addToAppleCalendar()}
          >
            <span aria-hidden="true">A</span>
            <div>
              <strong>Apple Calendar</strong>
              <small>{appleCalendarPending ? "Открываем системный импорт…" : "Добавить через стандартный файл iCalendar"}</small>
            </div>
          </button>
        </div>

        <p className="lx-calendar-privacy-note">
          LexiGo не получает доступ к вашим календарям. Финальное добавление и разрешение уведомлений подтверждаются в Google или Apple Calendar.
        </p>
      </AccessibleDialog>
    </>
  );
}
