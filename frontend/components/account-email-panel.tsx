"use client";

import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AccountRequestError, accountRequest } from "../lib/account-api";
import type { Session } from "../lib/auth-session";

export function AccountEmailPanel({
  session,
  onSessionExpired,
}: {
  session: Session;
  onSessionExpired: () => void;
}) {
  const pathname = usePathname();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (pathname !== "/profile") return null;

  async function requestEmailChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setFieldErrors({});

    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.currentPassword = "Введите текущий пароль";
    if (!newEmail.trim()) nextErrors.newEmail = "Введите новый email";
    if (newEmail.trim().toLowerCase() === session.user.email.trim().toLowerCase()) {
      nextErrors.newEmail = "Новый email должен отличаться от текущего";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setBusy(true);
    try {
      await accountRequest<{ accepted: boolean }>(
        "/api/v1/account/email-change/request",
        session.tokens.accessToken,
        {
          method: "POST",
          body: JSON.stringify({ currentPassword, newEmail: newEmail.trim() }),
        },
      );
      setCurrentPassword("");
      setNewEmail("");
      setNotice("Письмо с одноразовой ссылкой отправлено на новый email.");
    } catch (requestError) {
      if (requestError instanceof AccountRequestError) {
        if (requestError.code === "unauthorized" || requestError.code === "current_session_required") {
          onSessionExpired();
          return;
        }
        if (requestError.field) {
          setFieldErrors({ [requestError.field]: requestError.message });
          return;
        }
        setError(requestError.message);
      } else {
        setError(requestError instanceof Error ? requestError.message : "Не удалось отправить письмо подтверждения");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="lx-account-security lx-account-email" aria-labelledby="account-email-title">
      <div className="lx-account-security-heading">
        <div>
          <span>EMAIL АККАУНТА</span>
          <h2 id="account-email-title">Изменить email</h2>
          <p>
            Новый адрес начнёт действовать только после открытия одноразовой ссылки.
            После подтверждения все активные сессии будут завершены.
          </p>
        </div>
      </div>

      {notice ? <div className="lx-account-notice success" role="status">{notice}</div> : null}
      {error ? <div className="lx-account-notice error" role="alert">{error}</div> : null}

      <article className="lx-account-card lx-account-email-card">
        <div className="lx-account-card-heading">
          <div>
            <h3>Новый адрес для входа</h3>
            <p>Текущий email: {session.user.email}</p>
          </div>
        </div>
        <form className="lx-account-form" onSubmit={requestEmailChange} noValidate>
          <label>
            <span>Текущий пароль</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.currentPassword)}
              aria-describedby={fieldErrors.currentPassword ? "email-current-password-error" : undefined}
            />
          </label>
          {fieldErrors.currentPassword ? (
            <small id="email-current-password-error" role="alert">{fieldErrors.currentPassword}</small>
          ) : null}
          <label>
            <span>Новый email</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              aria-invalid={Boolean(fieldErrors.newEmail)}
              aria-describedby={fieldErrors.newEmail ? "new-email-error" : "new-email-description"}
            />
          </label>
          <small id="new-email-description">Ссылка подтверждения не содержит token в query string.</small>
          {fieldErrors.newEmail ? <small id="new-email-error" role="alert">{fieldErrors.newEmail}</small> : null}
          <button className="lx-button primary" type="submit" disabled={busy}>
            {busy ? "Отправляем…" : "Отправить ссылку подтверждения"}
          </button>
        </form>
      </article>
    </section>
  );
}
