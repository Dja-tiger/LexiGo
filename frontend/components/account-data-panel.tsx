"use client";

import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AccountRequestError, accountResponse } from "../lib/account-api";
import type { Session } from "../lib/auth-session";

function exportFilename(response: Response): string {
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1]?.trim() || `lexigo-export-${new Date().toISOString().slice(0, 10)}.json`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function AccountDataPanel({
  session,
  onSessionExpired,
}: {
  session: Session;
  onSessionExpired: () => void;
}) {
  const pathname = usePathname();
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  if (pathname !== "/profile") return null;

  async function exportData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setFieldError("");
    if (!currentPassword) {
      setFieldError("Введите текущий пароль");
      return;
    }

    setBusy(true);
    try {
      const response = await accountResponse("/api/v1/account/export", session.tokens.accessToken, {
        method: "POST",
        body: JSON.stringify({ currentPassword }),
      });
      const blob = await response.blob();
      downloadBlob(blob, exportFilename(response));
      setCurrentPassword("");
      setNotice("Выгрузка сформирована и передана браузеру.");
    } catch (requestError) {
      if (requestError instanceof AccountRequestError) {
        if (requestError.code === "unauthorized" || requestError.code === "current_session_required") {
          onSessionExpired();
          return;
        }
        if (requestError.field === "currentPassword") {
          setFieldError(requestError.message);
          return;
        }
        setError(requestError.message);
      } else {
        setError(requestError instanceof Error ? requestError.message : "Не удалось сформировать выгрузку");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="lx-account-security lx-account-data" aria-labelledby="account-data-title">
      <div className="lx-account-security-heading">
        <div>
          <span>ДАННЫЕ И КОНФИДЕНЦИАЛЬНОСТЬ</span>
          <h2 id="account-data-title">Выгрузка данных аккаунта</h2>
          <p>
            JSON содержит профиль, настройки обучения, статусы слов, историю ответов и журнал безопасности.
            Пароль, refresh-токены и внутренние секреты не включаются.
          </p>
        </div>
      </div>

      {notice ? <div className="lx-account-notice success" role="status">{notice}</div> : null}
      {error ? <div className="lx-account-notice error" role="alert">{error}</div> : null}

      <article className="lx-account-card lx-account-export-card">
        <div className="lx-account-card-heading">
          <div>
            <h3>Скачать JSON</h3>
            <p>Перед формированием выгрузки необходимо повторно подтвердить текущий пароль.</p>
          </div>
          <span className="lx-account-schema">schema v1</span>
        </div>
        <form className="lx-account-form" onSubmit={exportData} noValidate>
          <label>
            <span>Текущий пароль</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "export-password-error" : "export-description"}
            />
          </label>
          <small id="export-description">Файл создаётся только для текущего пользователя и не кэшируется.</small>
          {fieldError ? <small id="export-password-error" role="alert">{fieldError}</small> : null}
          <button className="lx-button primary" type="submit" disabled={busy}>
            {busy ? "Формируем…" : "Скачать мои данные"}
          </button>
        </form>
      </article>
    </section>
  );
}
