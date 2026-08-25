"use client";

import { useEffect } from "react";

import { interfaceActionLabel } from "@/lib/interface-copy";
import { subscribeAppearanceRuntime } from "@/lib/appearance-preference";
import { clearLexigoRuntimeState, isVersionMismatchError } from "@/lib/service-worker-update";

import "./global-error.css";

const RETRY_ACTION_LABEL = interfaceActionLabel("retry");
const HOME_ACTION_LABEL = interfaceActionLabel("home");

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const versionMismatch = isVersionMismatchError(error);

  useEffect(() => subscribeAppearanceRuntime(), []);

  useEffect(() => {
    console.error("[LexiGo] Root layout failure", {
      code: versionMismatch ? "ROOT_VERSION_MISMATCH" : "ROOT_RENDER_FAILURE",
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error, versionMismatch]);

  async function recover() {
    if (!versionMismatch) {
      reset();
      return;
    }

    try {
      const registrations = "serviceWorker" in navigator && typeof navigator.serviceWorker.getRegistrations === "function"
        ? await navigator.serviceWorker.getRegistrations()
        : [];
      await clearLexigoRuntimeState(registrations, "caches" in window ? window.caches : undefined);
    } catch (recoveryError) {
      console.error("[LexiGo] Root recovery cleanup failed", recoveryError);
    }
    window.location.reload();
  }

  return (
    <html lang="ru">
      <body className="lx-global-error-body">
        <main className="lx-global-error" role="alert">
          <section className="lx-global-error-card">
            <div className="lx-global-error-mark" aria-hidden="true">!</div>
            <small className="lx-global-error-label">
              {versionMismatch ? "ОБНОВЛЕНИЕ ИНТЕРФЕЙСА" : "ОШИБКА ПРИЛОЖЕНИЯ"}
            </small>
            <h1 className="lx-global-error-title">
              {versionMismatch ? "Загружены файлы разных версий" : "LexiGo не смог открыть страницу"}
            </h1>
            <p className="lx-global-error-copy">
              {versionMismatch
                ? "Устаревший кэш будет очищен, после чего приложение загрузится заново. Учебный прогресс хранится на сервере."
                : "Повторите загрузку. Сессия и уже сохранённые ответы не удалены."}
            </p>
            {error.digest ? <code className="lx-global-error-code">{error.digest}</code> : null}
            <div className="lx-global-error-actions">
              <button
                className="lx-global-error-action lx-global-error-action--primary"
                type="button"
                onClick={() => void recover()}
              >
                {versionMismatch ? "Очистить кэш и обновить" : RETRY_ACTION_LABEL}
              </button>
              <button
                className="lx-global-error-action lx-global-error-action--secondary"
                type="button"
                onClick={() => window.location.assign("/")}
              >
                {HOME_ACTION_LABEL}
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
