"use client";

import { useEffect } from "react";

import { clearLexigoRuntimeState, isVersionMismatchError } from "@/lib/service-worker-update";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const versionMismatch = isVersionMismatchError(error);

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
      <body style={{ margin: 0, background: "#050914", color: "#f7f9ff", fontFamily: "system-ui, sans-serif" }}>
        <main
          role="alert"
          style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", boxSizing: "border-box" }}
        >
          <section style={{ width: "min(560px, 100%)", padding: "28px", border: "1px solid #33415c", borderRadius: "24px", background: "#0c1324" }}>
            <div aria-hidden="true" style={{ fontSize: "36px", marginBottom: "12px" }}>!</div>
            <small style={{ letterSpacing: "0.12em" }}>{versionMismatch ? "ОБНОВЛЕНИЕ ИНТЕРФЕЙСА" : "ОШИБКА ПРИЛОЖЕНИЯ"}</small>
            <h1 style={{ margin: "12px 0", fontSize: "clamp(28px, 6vw, 42px)" }}>
              {versionMismatch ? "Загружены файлы разных версий" : "LexiGo не смог открыть страницу"}
            </h1>
            <p style={{ color: "#b7c2d8", lineHeight: 1.6 }}>
              {versionMismatch
                ? "Устаревший кэш будет очищен, после чего приложение загрузится заново. Учебный прогресс хранится на сервере."
                : "Повторите загрузку. Сессия и уже сохранённые ответы не удалены."}
            </p>
            {error.digest ? <code style={{ display: "block", marginBottom: "16px" }}>{error.digest}</code> : null}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => void recover()} style={{ minHeight: "44px", padding: "0 18px", border: 0, borderRadius: "12px", fontWeight: 700 }}>
                {versionMismatch ? "Очистить кэш и обновить" : "Повторить"}
              </button>
              <button type="button" onClick={() => window.location.assign("/")} style={{ minHeight: "44px", padding: "0 18px", border: "1px solid #66738e", borderRadius: "12px", background: "transparent", color: "inherit" }}>
                На главную
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
