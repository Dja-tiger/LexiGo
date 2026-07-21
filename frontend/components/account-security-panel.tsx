"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { AccountRequestError, accountRequest } from "../lib/account-api";
import type { Session } from "../lib/auth-session";

type AccountSession = {
  id: string;
  current: boolean;
  userAgent: string;
  ipAddress?: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

type AccountAuditEvent = {
  id: number;
  type: "password_changed" | "other_sessions_revoked" | "email_changed" | string;
  userAgent: string;
  ipAddress?: string;
  metadata: Record<string, string>;
  createdAt: string;
};

function dateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("ru", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function browserLabel(userAgent: string): string {
  if (/iPhone|iPad/i.test(userAgent)) return "Safari на iOS";
  if (/Android/i.test(userAgent)) return "Браузер на Android";
  if (/Firefox/i.test(userAgent)) return "Firefox";
  if (/Edg/i.test(userAgent)) return "Microsoft Edge";
  if (/Chrome|Chromium/i.test(userAgent)) return "Chrome";
  if (/Safari/i.test(userAgent)) return "Safari";
  return userAgent.trim() || "Неизвестное устройство";
}

function auditLabel(type: string): string {
  if (type === "password_changed") return "Пароль изменён";
  if (type === "other_sessions_revoked") return "Остальные сессии завершены";
  if (type === "email_changed") return "Email изменён";
  return type;
}

export function AccountSecurityPanel({
  session,
  onSessionExpired,
  onSessionUpdated,
}: {
  session: Session;
  onSessionExpired: () => void;
  onSessionUpdated: (session: Session) => void;
}) {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [auditEvents, setAuditEvents] = useState<AccountAuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<"password" | "sessions" | "">("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionsPassword, setSessionsPassword] = useState("");

  const handleRequestError = useCallback((requestError: unknown) => {
    if (requestError instanceof AccountRequestError) {
      if (requestError.code === "unauthorized" || requestError.code === "current_session_required") {
        onSessionExpired();
        return;
      }
      if (requestError.field) {
        setPasswordErrors((current) => ({ ...current, [requestError.field!]: requestError.message }));
        return;
      }
      setError(requestError.message);
      return;
    }
    setError(requestError instanceof Error ? requestError.message : "Не удалось выполнить операцию");
  }, [onSessionExpired]);

  const loadSecurityData = useCallback(async (accessToken = session.tokens.accessToken) => {
    setLoading(true);
    setError("");
    try {
      const [sessionPayload, auditPayload] = await Promise.all([
        accountRequest<{ sessions: AccountSession[] }>(
          "/api/v1/auth/sessions",
          accessToken,
        ),
        accountRequest<{ events: AccountAuditEvent[] }>(
          "/api/v1/auth/audit-events",
          accessToken,
        ),
      ]);
      setSessions(sessionPayload.sessions);
      setAuditEvents(auditPayload.events);
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setLoading(false);
    }
  }, [handleRequestError, session.tokens.accessToken]);

  useEffect(() => {
    if (pathname !== "/profile") return;
    const timer = window.setTimeout(() => {
      void loadSecurityData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSecurityData, pathname]);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setPasswordErrors({});

    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.currentPassword = "Введите текущий пароль";
    if (newPassword.length < 12) nextErrors.newPassword = "Новый пароль должен содержать не менее 12 символов";
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = "Пароли не совпадают";
    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors);
      return;
    }

    setBusyAction("password");
    try {
      const updatedSession = await accountRequest<Session>(
        "/api/v1/auth/password",
        session.tokens.accessToken,
        {
          method: "PUT",
          body: JSON.stringify({ currentPassword, newPassword }),
        },
      );
      onSessionUpdated(updatedSession);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Пароль изменён. Остальные сессии завершены.");
      await loadSecurityData(updatedSession.tokens.accessToken);
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setBusyAction("");
    }
  }

  async function revokeOtherSessions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setPasswordErrors({});
    if (!sessionsPassword) {
      setPasswordErrors({ sessionsPassword: "Введите текущий пароль" });
      return;
    }

    setBusyAction("sessions");
    try {
      const updatedSession = await accountRequest<Session>(
        "/api/v1/auth/sessions/revoke-others",
        session.tokens.accessToken,
        {
          method: "POST",
          body: JSON.stringify({ currentPassword: sessionsPassword }),
        },
      );
      onSessionUpdated(updatedSession);
      setSessionsPassword("");
      setNotice("Остальные сессии завершены.");
      await loadSecurityData(updatedSession.tokens.accessToken);
    } catch (requestError) {
      if (requestError instanceof AccountRequestError && requestError.field === "currentPassword") {
        setPasswordErrors({ sessionsPassword: requestError.message });
      } else {
        handleRequestError(requestError);
      }
    } finally {
      setBusyAction("");
    }
  }

  if (pathname !== "/profile") return null;

  return (
    <section className="lx-account-security" aria-labelledby="account-security-title">
      <div className="lx-account-security-heading">
        <div>
          <span>БЕЗОПАСНОСТЬ АККАУНТА</span>
          <h2 id="account-security-title">Пароль и активные устройства</h2>
          <p>Чувствительные действия подтверждаются текущим паролем и записываются в журнал безопасности.</p>
        </div>
        <button type="button" className="lx-button ghost" disabled={loading} onClick={() => void loadSecurityData()}>
          {loading ? "Обновляем…" : "Обновить"}
        </button>
      </div>

      {notice ? <div className="lx-account-notice success" role="status">{notice}</div> : null}
      {error ? <div className="lx-account-notice error" role="alert">{error}</div> : null}

      <div className="lx-account-security-grid">
        <article className="lx-account-card">
          <div className="lx-account-card-heading">
            <div>
              <h3>Активные сессии</h3>
              <p>Текущая session family сохраняется при смене пароля.</p>
            </div>
            <strong>{loading ? "…" : sessions.length}</strong>
          </div>
          <div className="lx-session-list" aria-live="polite" aria-busy={loading}>
            {sessions.map((item) => (
              <div className="lx-session-row" key={item.id}>
                <div>
                  <strong>{browserLabel(item.userAgent)}</strong>
                  <span>{item.ipAddress || "IP не определён"} · последний вход {dateTime(item.lastSeenAt)}</span>
                </div>
                <span className={item.current ? "current" : "other"}>{item.current ? "Текущая" : "Другая"}</span>
              </div>
            ))}
            {!loading && sessions.length === 0 ? <p>Активные сессии не найдены.</p> : null}
          </div>
          <form className="lx-account-form" onSubmit={revokeOtherSessions} noValidate>
            <label>
              <span>Текущий пароль</span>
              <input
                type="password"
                autoComplete="current-password"
                value={sessionsPassword}
                onChange={(event) => setSessionsPassword(event.target.value)}
                aria-invalid={Boolean(passwordErrors.sessionsPassword)}
                aria-describedby={passwordErrors.sessionsPassword ? "sessions-password-error" : undefined}
              />
            </label>
            {passwordErrors.sessionsPassword ? <small id="sessions-password-error" role="alert">{passwordErrors.sessionsPassword}</small> : null}
            <button className="lx-button ghost" type="submit" disabled={busyAction !== "" || sessions.length <= 1}>
              {busyAction === "sessions" ? "Завершаем…" : "Завершить остальные сессии"}
            </button>
          </form>
        </article>

        <article className="lx-account-card">
          <div className="lx-account-card-heading">
            <div>
              <h3>Сменить пароль</h3>
              <p>Новый пароль завершит остальные refresh-сессии и аннулирует ссылки восстановления.</p>
            </div>
          </div>
          <form className="lx-account-form" onSubmit={changePassword} noValidate>
            <label>
              <span>Текущий пароль</span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                aria-invalid={Boolean(passwordErrors.currentPassword)}
                aria-describedby={passwordErrors.currentPassword ? "current-password-error" : undefined}
              />
            </label>
            {passwordErrors.currentPassword ? <small id="current-password-error" role="alert">{passwordErrors.currentPassword}</small> : null}
            <label>
              <span>Новый пароль</span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                aria-invalid={Boolean(passwordErrors.newPassword)}
                aria-describedby={passwordErrors.newPassword ? "new-password-error" : undefined}
              />
            </label>
            {passwordErrors.newPassword ? <small id="new-password-error" role="alert">{passwordErrors.newPassword}</small> : null}
            <label>
              <span>Повторите новый пароль</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-invalid={Boolean(passwordErrors.confirmPassword)}
                aria-describedby={passwordErrors.confirmPassword ? "confirm-password-error" : undefined}
              />
            </label>
            {passwordErrors.confirmPassword ? <small id="confirm-password-error" role="alert">{passwordErrors.confirmPassword}</small> : null}
            <button className="lx-button primary" type="submit" disabled={busyAction !== ""}>
              {busyAction === "password" ? "Сохраняем…" : "Изменить пароль"}
            </button>
          </form>
        </article>
      </div>

      <article className="lx-account-card lx-account-audit">
        <div className="lx-account-card-heading">
          <div>
            <h3>Журнал безопасности</h3>
            <p>Последние критичные изменения аккаунта.</p>
          </div>
        </div>
        <div className="lx-audit-list">
          {auditEvents.map((item) => (
            <div key={item.id}>
              <strong>{auditLabel(item.type)}</strong>
              <span>{dateTime(item.createdAt)} · {browserLabel(item.userAgent)}{item.ipAddress ? ` · ${item.ipAddress}` : ""}</span>
            </div>
          ))}
          {!loading && auditEvents.length === 0 ? <p>Критичных изменений пока не было.</p> : null}
        </div>
      </article>
    </section>
  );
}
