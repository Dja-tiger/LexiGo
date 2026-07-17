"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ApplicationErrorBoundaryProps = {
  children: ReactNode;
};

type ApplicationErrorBoundaryState = {
  hasError: boolean;
};

export class ApplicationErrorBoundary extends Component<
  ApplicationErrorBoundaryProps,
  ApplicationErrorBoundaryState
> {
  state: ApplicationErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ApplicationErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[LexiGo] Unhandled application render error", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private reloadApplication = () => {
    window.location.reload();
  };

  private returnHome = () => {
    try {
      window.localStorage.removeItem("lexigo.navigation.v1");
    } catch {
      // Recovery must remain available when storage access is restricted.
    }
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="lx-fatal-error" role="alert" data-testid="application-error-boundary">
        <div className="lx-fatal-error-mark" aria-hidden="true">!</div>
        <span>ОШИБКА ИНТЕРФЕЙСА</span>
        <h1>LexiGo не смог отобразить этот экран</h1>
        <p>
          Приложение остановило повреждённый render, чтобы не показывать пустой экран.
          Учебный прогресс хранится на сервере и не удалён.
        </p>
        <code>UI_RENDER_FAILURE</code>
        <div className="lx-fatal-error-actions">
          <button className="lx-button primary" type="button" onClick={this.reloadApplication}>
            Повторить
          </button>
          <button className="lx-button ghost" type="button" onClick={this.returnHome}>
            На главную
          </button>
        </div>
      </main>
    );
  }
}
