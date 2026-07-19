"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import {
  SERVICE_WORKER_SKIP_WAITING,
  createServiceWorkerRecoverySnapshot,
  isLessonRoute,
  isVersionMismatchError,
  writeServiceWorkerRecovery,
} from "../lib/service-worker-update";

type ApplicationErrorBoundaryProps = {
  children: ReactNode;
};

type ApplicationErrorBoundaryState = {
  hasError: boolean;
  failureKind: "render" | "version-mismatch";
};

const BUILD_ID = process.env.NEXT_PUBLIC_APP_BUILD_ID ?? "local";

export class ApplicationErrorBoundary extends Component<
  ApplicationErrorBoundaryProps,
  ApplicationErrorBoundaryState
> {
  state: ApplicationErrorBoundaryState = { hasError: false, failureKind: "render" };

  static getDerivedStateFromError(error: unknown): ApplicationErrorBoundaryState {
    return {
      hasError: true,
      failureKind: isVersionMismatchError(error) ? "version-mismatch" : "render",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[LexiGo] Unhandled application render error", {
      code: isVersionMismatchError(error) ? "UI_VERSION_MISMATCH" : "UI_RENDER_FAILURE",
      buildID: BUILD_ID,
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private reloadApplication = () => {
    window.location.reload();
  };

  private recoverVersionMismatch = async () => {
    const lessonActive = isLessonRoute(window.location.search);
    const snapshot = createServiceWorkerRecoverySnapshot({
      reason: "version-mismatch",
      buildID: BUILD_ID,
      href: window.location.href,
      lessonActive,
    });
    writeServiceWorkerRecovery(window.sessionStorage, snapshot);

    let reloading = false;
    const reload = () => {
      if (reloading) return;
      reloading = true;
      if (snapshot.resumeHref === "/") window.location.assign("/");
      else window.location.reload();
    };

    try {
      if (!("serviceWorker" in navigator)) {
        reload();
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration("/");
      await registration?.update();
      const waiting = registration?.waiting;
      if (!waiting) {
        reload();
        return;
      }

      navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
      waiting.postMessage({ type: SERVICE_WORKER_SKIP_WAITING });
      window.setTimeout(reload, 5000);
    } catch (recoveryError) {
      console.error("[LexiGo] Version mismatch recovery failed", {
        buildID: BUILD_ID,
        error: recoveryError,
      });
      reload();
    }
  };

  private returnHome = () => {
    try {
      window.localStorage.removeItem("lexigo.navigation.v1");
      window.localStorage.removeItem("lexigo.navigation.v2");
    } catch {
      // Recovery must remain available when storage access is restricted.
    }
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const versionMismatch = this.state.failureKind === "version-mismatch";
    return (
      <main className="lx-fatal-error" role="alert" data-testid="application-error-boundary">
        <div className="lx-fatal-error-mark" aria-hidden="true">!</div>
        <span>{versionMismatch ? "ОБНОВЛЕНИЕ ИНТЕРФЕЙСА" : "ОШИБКА ИНТЕРФЕЙСА"}</span>
        <h1>{versionMismatch ? "Открыта устаревшая версия LexiGo" : "LexiGo не смог отобразить этот экран"}</h1>
        <p>
          {versionMismatch
            ? "Браузер загрузил файлы разных версий. LexiGo активирует согласованный набор ресурсов и безопасно перезапустит приложение."
            : "Приложение остановило повреждённый render, чтобы не показывать пустой экран. Учебный прогресс хранится на сервере и не удалён."}
        </p>
        <code>{versionMismatch ? "UI_VERSION_MISMATCH" : "UI_RENDER_FAILURE"}</code>
        <div className="lx-fatal-error-actions">
          <button
            className="lx-button primary"
            type="button"
            onClick={versionMismatch ? this.recoverVersionMismatch : this.reloadApplication}
          >
            {versionMismatch ? "Обновить приложение" : "Повторить"}
          </button>
          <button className="lx-button ghost" type="button" onClick={this.returnHome}>
            На главную
          </button>
        </div>
      </main>
    );
  }
}
