"use client";

import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AccountRequestError, accountRequest, accountResponse } from "../lib/account-api";
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
  onAccountDeleted,
}: {
  session: Session;
  onSessionExpired: () => void;
  onAccountDeleted: () => void;
}) {
  const pathname = usePathname();
  const [exportPassword, setExportPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [deletionAcknowledged, setDeletionAcknowledged] = useState(false);
  const [busyAction, setBusyAction] = useState<"export" | "delete" | "">("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (pathname !== "/profile") return null;

  function handleRequestError(requestError: unknown, fallback: string) {
    if (requestError instanceof AccountRequestError) {
      if (requestError.code === "unauthorized" || requestError.code === "current_session_required") {
        onSessionExpired();
        return;
      }
      if (requestError.field) {
        setFieldErrors((current) => ({ ...current, [requestError.field!]: requestError.message }));
        return;
      }
      setError(requestError.message);
      return;
    }
    setError(requestError instanceof Error ? requestError.message : fallback);
  }

  async function exportData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setFieldErrors({});
    if (!exportPassword) {
      setFieldErrors({ exportPassword: "Введите текущий пароль" });
      return;
    }

    setBusyAction("export");
    try {
      const response = await accountResponse("/api/v1/account/export", session.tokens.accessToken, {
        method: "POST",
        body: JSON.stringify({ currentPassword: exportPassword }),
      });
      const blob = await response.blob();
      downloadBlob(blob, exportFilename(response));
      setExportPassword("");
      setNotice("Выгрузка сформирована и передана браузеру.");
    } catch (requestError) {
      if (requestError instanceof AccountRequestError && requestError.field === "currentPassword") {
        setFieldErrors({ exportPassword: requestError.message });
      } else {
        handleRequestError(requestError, "Не удалось сформировать выгрузку");
      }
    } finally {
      setBusyAction("");
    }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setFieldErrors({});

    const nextErrors: Record<string, string> = {};
    if (!deletePassword) nextErrors.deletePassword = "Введите текущий пароль";
    if (!confirmationEmail) {
      nextErrors.confirmationEmail = "Введите email аккаунта";
    } else if (confirmationEmail.trim().toLowerCase() !== session.user.email.trim().toLowerCase()) {
      nextErrors.confirmationEmail = "Email не совпадает с адресом аккаунта";
    }
    if (!deletionAcknowledged) nextErrors.deletionAcknowledged = "Подтвердите, что понимаете последствия";
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setBusyAction("delete");
    try {
      await accountRequest<void>("/api/v1/account", session.tokens.accessToken, {
        method: "DELETE",
        body: JSON.stringify({
          currentPassword: deletePassword,
          confirmationEmail: confirmationEmail.trim(),
        }),
      });
      onAccountDeleted();
    } catch (requestError) {
      if (requestError instanceof AccountRequestError) {
        const mappedField = requestError.field === "currentPassword"
          ? "deletePassword"
          : requestError.field;
        if (mappedField) {
          setFieldErrors({ [mappedField]: requestError.message });
        } else {
          handleRequestError(requestError, "Не удалось удалить аккаунт");
        }
      } else {
        handleRequestError(requestError, "Не удалось удалить аккаунт");
      }
    } finally {
      setBusyAction("");
    }
  }

  return (
    <section className="lx-account-security lx-account-data" aria-labelledby="account-data-title">
      <div className="lx-account-security-heading">
        <div>
          <span>ДАННЫЕ И КОНФИДЕНЦИАЛЬНОСТЬ</span>
          <h2 id="account-data-title">Данные и удаление аккаунта</h2>
          <p>
            Сначала скачайте машиночитаемую копию данных. Удаление аккаунта необратимо и
            очищает профиль, прогресс, историю ответов, уроки и активные сессии.
          </p>
        </div>
      </div>

      {notice ? <div className="lx-account-notice success" role="status">{notice}</div> : null}
      {error ? <div className="lx-account-notice error" role="alert">{error}</div> : null}

      <div className="lx-account-security-grid">
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
                value={exportPassword}
                onChange={(event) => setExportPassword(event.target.value)}
                aria-invalid={Boolean(fieldErrors.exportPassword)}
                aria-describedby={fieldErrors.exportPassword ? "export-password-error" : "export-description"}
              />
            </label>
            <small id="export-description">Файл создаётся только для текущего пользователя и не кэшируется.</small>
            {fieldErrors.exportPassword ? <small id="export-password-error" role="alert">{fieldErrors.exportPassword}</small> : null}
            <button className="lx-button primary" type="submit" disabled={busyAction !== ""}>
              {busyAction === "export" ? "Формируем…" : "Скачать мои данные"}
            </button>
          </form>
        </article>

        <article className="lx-account-card lx-account-danger-card">
          <div className="lx-account-card-heading">
            <div>
              <h3>Удалить аккаунт</h3>
              <p>После подтверждения восстановить аккаунт и учебный прогресс будет невозможно.</p>
            </div>
          </div>
          <form className="lx-account-form" onSubmit={deleteAccount} noValidate>
            <label>
              <span>Текущий пароль</span>
              <input
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                aria-invalid={Boolean(fieldErrors.deletePassword)}
                aria-describedby={fieldErrors.deletePassword ? "delete-password-error" : undefined}
              />
            </label>
            {fieldErrors.deletePassword ? <small id="delete-password-error" role="alert">{fieldErrors.deletePassword}</small> : null}
            <label>
              <span>Введите {session.user.email}</span>
              <input
                type="email"
                autoComplete="email"
                value={confirmationEmail}
                onChange={(event) => setConfirmationEmail(event.target.value)}
                aria-invalid={Boolean(fieldErrors.confirmationEmail)}
                aria-describedby={fieldErrors.confirmationEmail ? "delete-email-error" : undefined}
              />
            </label>
            {fieldErrors.confirmationEmail ? <small id="delete-email-error" role="alert">{fieldErrors.confirmationEmail}</small> : null}
            <label className="lx-account-confirmation">
              <input
                type="checkbox"
                checked={deletionAcknowledged}
                onChange={(event) => setDeletionAcknowledged(event.target.checked)}
                aria-invalid={Boolean(fieldErrors.deletionAcknowledged)}
                aria-describedby={fieldErrors.deletionAcknowledged ? "delete-acknowledgement-error" : undefined}
              />
              <span>Я понимаю, что данные и прогресс будут удалены без возможности восстановления.</span>
            </label>
            {fieldErrors.deletionAcknowledged ? <small id="delete-acknowledgement-error" role="alert">{fieldErrors.deletionAcknowledged}</small> : null}
            <button className="lx-button danger" type="submit" disabled={busyAction !== ""}>
              {busyAction === "delete" ? "Удаляем…" : "Удалить аккаунт навсегда"}
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}
