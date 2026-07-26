"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";

import {
  failedResourceStatus,
  isProgressSummaryPayload,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import {
  readAppearancePreference,
  setAppearancePreference,
  subscribeAppearanceRuntime,
  type AppearancePreference,
} from "../lib/appearance-preference";
import { authorizedJSON, requestJSON } from "../lib/authorized-json";
import type { Session } from "../lib/auth-session";
import { describeCalendarSchedule, type CalendarReminderSettings } from "../lib/calendar-reminder";
import {
  defaultCalendarReminderSettings,
  readCalendarReminderSettings,
  subscribeCalendarReminderSettings,
} from "../lib/calendar-reminder-storage";
import { viewTitle } from "../lib/navigation";
import type { ProgressSummary } from "../lib/progress";
import { AsyncStatePanel } from "./async-state";
import { CalendarReminderIntegration } from "./calendar-reminder-integration";

const GOAL_OPTIONS = [15, 30, 60] as const;
const APPEARANCE_OPTIONS: ReadonlyArray<{
  value: AppearancePreference;
  label: string;
  description: string;
}> = [
  { value: "auto", label: "Авто", description: "Как в системе" },
  { value: "light", label: "Светлая", description: "Всегда светлая" },
  { value: "dark", label: "Тёмная", description: "Всегда тёмная" },
];
const APPEARANCE_VALUES = APPEARANCE_OPTIONS.map((option) => option.value);

type ProfileSection = "security" | "email" | "data" | "delete";

type LexigoProfileAppProps = {
  initialSession: Session;
  onSessionUpdated: (session: Session) => void;
  onLoggedOut: () => void;
};

function accountDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не определена";
  return new Intl.DateTimeFormat("ru", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function userInitials(session: Session): string {
  const source = session.user.displayName.trim() || session.user.email.split("@")[0] || "L";
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part.charAt(0).toLocaleUpperCase("ru")).join("") || "L";
}

function moveRovingSelection<T extends string | number>(
  event: KeyboardEvent<HTMLButtonElement>,
  values: readonly T[],
  current: string | number,
  select: (value: T) => void,
): void {
  const rawIndex = values.findIndex((value) => value === current);
  const currentIndex = rawIndex >= 0 ? rawIndex : 0;
  let nextIndex = currentIndex;

  if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % values.length;
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + values.length) % values.length;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = values.length - 1;
  else return;

  event.preventDefault();
  const group = event.currentTarget.parentElement;
  const nextValue = values[nextIndex];
  if (nextValue === undefined) return;
  select(nextValue);
  window.requestAnimationFrame(() => {
    group?.querySelectorAll<HTMLButtonElement>('[role="radio"]').item(nextIndex).focus();
  });
}

function accountSectionTarget(section: ProfileSection): HTMLElement | null {
  if (section === "security") return document.getElementById("account-security-title");
  if (section === "email") return document.getElementById("account-email-title");
  if (section === "data") return document.getElementById("account-data-title");
  return document.querySelector<HTMLElement>(".lx-account-danger-card h3");
}

function focusAccountSection(section: ProfileSection): void {
  const findTarget = (attempt: number) => {
    const target = accountSectionTarget(section);
    if (!target && attempt < 4) {
      window.requestAnimationFrame(() => findTarget(attempt + 1));
      return;
    }
    if (!target) return;
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start", behavior: "auto" });
  };
  findTarget(0);
}

export function LexigoProfileApp({
  initialSession,
  onSessionUpdated,
  onLoggedOut,
}: LexigoProfileAppProps) {
  const session = initialSession;
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [progressStatus, setProgressStatus] = useState<ResourceStatus>(() => loadingResourceStatus());
  const [busyAction, setBusyAction] = useState<"goal" | "logout" | "">("");
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState<CalendarReminderSettings>(() => (
    typeof window === "undefined" ? defaultCalendarReminderSettings() : readCalendarReminderSettings()
  ));
  const [appearance, setAppearance] = useState<AppearancePreference>(() => readAppearancePreference());
  const [appearancePersisted, setAppearancePersisted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine !== false);

  const adoptSession = useCallback((nextSession: Session) => {
    if (nextSession.tokens.accessToken !== session.tokens.accessToken) onSessionUpdated(nextSession);
  }, [onSessionUpdated, session.tokens.accessToken]);

  const loadProgress = useCallback(async (activeSession: Session, signal?: AbortSignal) => {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedJSON<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${new Date().getTimezoneOffset()}`,
        { signal },
        isProgressSummaryPayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      setProgress(null);
      setProgressStatus(failedResourceStatus(error, "настройки обучения"));
    }
  }, [adoptSession]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadProgress(session, controller.signal), 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadProgress, session]);

  useEffect(() => subscribeCalendarReminderSettings(setCalendarSettings), []);
  useEffect(() => subscribeAppearanceRuntime((preference) => setAppearance(preference)), []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    const updateOnline = () => setOnline(navigator.onLine !== false);
    updateMotion();
    updateOnline();
    mediaQuery.addEventListener("change", updateMotion);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      mediaQuery.removeEventListener("change", updateMotion);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const initials = useMemo(() => userInitials(session), [session]);
  const displayName = session.user.displayName.trim() || "Ваш аккаунт";
  const configuredGoal = progress?.dailyGoal ?? GOAL_OPTIONS[0];
  const goalHasPreset = GOAL_OPTIONS.some((goal) => goal === configuredGoal);

  async function updateDailyGoal(dailyGoal: number) {
    if (busyAction) return;
    setBusyAction("goal");
    setActionError("");
    setActionNotice("");
    try {
      const result = await authorizedJSON<ProgressSummary>(
        session,
        `/api/v1/progress/goal?timezoneOffsetMinutes=${new Date().getTimezoneOffset()}`,
        {
          method: "PUT",
          body: JSON.stringify({ dailyGoal }),
        },
        isProgressSummaryPayload,
      );
      adoptSession(result.activeSession);
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
      setActionNotice(`Дневная цель сохранена: ${dailyGoal} ответов.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось сохранить дневную цель");
    } finally {
      setBusyAction("");
    }
  }

  function updateAppearance(nextAppearance: AppearancePreference) {
    const result = setAppearancePreference(nextAppearance);
    setAppearance(nextAppearance);
    setAppearancePersisted(result.persisted);
    setActionError("");
    setActionNotice(result.persisted
      ? `Оформление изменено: ${APPEARANCE_OPTIONS.find((option) => option.value === nextAppearance)?.label ?? nextAppearance}.`
      : "Оформление применено только для текущей вкладки: браузер запретил локальное сохранение.");
  }

  async function logout() {
    if (busyAction) return;
    setBusyAction("logout");
    setActionError("");
    setActionNotice("");
    try {
      await requestJSON<void>("/api/v1/auth/logout", { method: "POST" });
      onLoggedOut();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось завершить выход");
      setBusyAction("");
    }
  }

  return (
    <div className="lx-app lx-profile-app" data-route-client-island="profile">
      <header className="lx-header">
        <div className="lx-header-tools">
          <span className="lx-avatar" aria-hidden="true">{initials.slice(0, 1)}</span>
        </div>
      </header>

      <main id="lexigo-main-content" className="lx-main-content" tabIndex={-1} aria-label={viewTitle("profile")}>
        <div className="lx-profile-view">
          <section className="lx-profile-heading" aria-labelledby="profile-title">
            <span>Профиль</span>
            <h1 id="profile-title">Профиль</h1>
            <p>Настройки аккаунта, обучения и приложения.</p>
          </section>

          {actionError ? <p className="lx-profile-notice error" role="alert">{actionError}</p> : null}
          {actionNotice ? <p className="lx-profile-notice" role="status">{actionNotice}</p> : null}

          <section className="lx-profile-identity" aria-label="Данные профиля">
            <span className="lx-profile-initials" aria-hidden="true">{initials}</span>
            <div className="lx-profile-identity-copy">
              <strong role="heading" aria-level={2}>{displayName}</strong>
              <span>{session.user.email}</span>
              <span>Аккаунт создан {accountDate(session.user.createdAt)}</span>
            </div>
            <button className="lx-profile-secondary-button" type="button" onClick={() => focusAccountSection("email")}>
              Изменить email
            </button>
          </section>

          <div className="lx-profile-layout">
            <section className="lx-profile-card" aria-labelledby="profile-learning-title">
              <header className="lx-profile-card-heading">
                <span>Обучение</span>
                <h2 id="profile-learning-title">Параметры практики</h2>
              </header>

              <div className="lx-profile-row">
                <div className="lx-profile-row-copy">
                  <strong>Дневная цель</strong>
                  <span>{progress ? `${progress.reviewsToday} из ${progress.dailyGoal} ответов сегодня` : "Загружаем цель аккаунта"}</span>
                </div>
                {progress ? (
                  <div className="lx-profile-goal-options" role="radiogroup" aria-label="Дневная цель" aria-orientation="horizontal">
                    {GOAL_OPTIONS.map((goal, index) => {
                      const selected = progress.dailyGoal === goal;
                      return (
                        <button
                          key={goal}
                          className="lx-profile-goal-option"
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          tabIndex={selected || (!goalHasPreset && index === 0) ? 0 : -1}
                          disabled={Boolean(busyAction)}
                          onClick={() => void updateDailyGoal(goal)}
                          onKeyDown={(event) => moveRovingSelection(event, GOAL_OPTIONS, configuredGoal, (next) => void updateDailyGoal(next))}
                        >
                          {goal}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="lx-profile-status" aria-live="polite">
                    {progressStatus.phase === "error" ? "Цель недоступна" : "Загружаем…"}
                  </span>
                )}
              </div>

              <div className="lx-profile-row">
                <div className="lx-profile-row-copy">
                  <strong>Напоминания</strong>
                  <span>{describeCalendarSchedule(calendarSettings)}</span>
                </div>
                <button className="lx-profile-secondary-button" type="button" onClick={() => setCalendarOpen(true)}>
                  Настроить
                </button>
              </div>

              {progressStatus.phase === "error" && progressStatus.problem ? (
                <div className="lx-profile-row">
                  <AsyncStatePanel
                    label="Настройки обучения недоступны"
                    kind="error"
                    title={progressStatus.problem.title}
                    message={progressStatus.problem.message}
                    reference={progressStatus.problem.correlationId}
                    actionLabel={progressStatus.problem.retryable ? "Повторить" : undefined}
                    onAction={progressStatus.problem.retryable ? () => void loadProgress(session) : undefined}
                    compact
                  />
                </div>
              ) : null}
            </section>

            <section className="lx-profile-card" aria-labelledby="profile-application-title">
              <header className="lx-profile-card-heading">
                <span>Приложение</span>
                <h2 id="profile-application-title">Интерфейс и устройство</h2>
              </header>

              <div className="lx-profile-row">
                <div className="lx-profile-row-copy">
                  <strong>Оформление</strong>
                  <span>{appearancePersisted ? "Сохраняется в этом браузере" : "Только текущая вкладка"}</span>
                </div>
                <div className="lx-profile-appearance-options" role="radiogroup" aria-label="Оформление приложения" aria-orientation="horizontal">
                  {APPEARANCE_OPTIONS.map((option) => {
                    const selected = appearance === option.value;
                    return (
                      <button
                        key={option.value}
                        className="lx-profile-appearance-option"
                        type="button"
                        role="radio"
                        aria-label={`${option.label}: ${option.description}`}
                        aria-checked={selected}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => updateAppearance(option.value)}
                        onKeyDown={(event) => moveRovingSelection(event, APPEARANCE_VALUES, appearance, updateAppearance)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lx-profile-row">
                <div className="lx-profile-row-copy">
                  <strong>Анимация</strong>
                  <span>Учитывает системную настройку уменьшения движения</span>
                </div>
                <span className="lx-profile-status">{reducedMotion ? "Сокращена" : "Системная"}</span>
              </div>

              <div className="lx-profile-row">
                <div className="lx-profile-row-copy">
                  <strong>Работа без сети</strong>
                  <span>Активные ответы сохраняются в защищённой очереди устройства</span>
                </div>
                <span className="lx-profile-status" role="status">{online ? "В сети" : "Нет подключения"}</span>
              </div>
            </section>

            <section className="lx-profile-card lx-profile-card--wide" aria-labelledby="profile-account-title">
              <header className="lx-profile-card-heading">
                <span>Аккаунт и данные</span>
                <h2 id="profile-account-title">Безопасность и конфиденциальность</h2>
              </header>

              <div className="lx-profile-account-actions">
                <button className="lx-profile-link-button" type="button" onClick={() => focusAccountSection("security")}>
                  <strong>Пароль и активные устройства</strong>
                  <small>Сессии, смена пароля и журнал безопасности</small>
                </button>
                <button className="lx-profile-link-button" type="button" onClick={() => focusAccountSection("email")}>
                  <strong>Email аккаунта</strong>
                  <small>Подтверждаемая смена адреса для входа</small>
                </button>
                <button className="lx-profile-link-button" type="button" onClick={() => focusAccountSection("data")}>
                  <strong>Скачать мои данные</strong>
                  <small>Машиночитаемый JSON после повторного подтверждения</small>
                </button>
                <button className="lx-profile-link-button danger" type="button" onClick={() => focusAccountSection("delete")}>
                  <strong>Удалить аккаунт</strong>
                  <small>Необратимое действие с подтверждением паролем и email</small>
                </button>
              </div>

              <div className="lx-profile-row">
                <div className="lx-profile-row-copy">
                  <strong>Текущая сессия</strong>
                  <span>Выход завершит только текущую сессию на устройстве</span>
                </div>
                <button
                  className="lx-profile-secondary-button"
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={() => void logout()}
                >
                  {busyAction === "logout" ? "Выходим…" : "Выйти"}
                </button>
              </div>
            </section>
          </div>
        </div>

        <CalendarReminderIntegration
          open={calendarOpen}
          showCard={false}
          onOpen={() => setCalendarOpen(true)}
          onClose={() => setCalendarOpen(false)}
        />
      </main>
    </div>
  );
}
