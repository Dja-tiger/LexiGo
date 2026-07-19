"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  SERVICE_WORKER_ACTIVATED,
  SERVICE_WORKER_SKIP_WAITING,
  clearDeferredServiceWorkerBuild,
  consumeServiceWorkerRecovery,
  createServiceWorkerRecoverySnapshot,
  isLessonRoute,
  readDeferredServiceWorkerBuild,
  serviceWorkerBuildFromURL,
  serviceWorkerScriptURL,
  writeDeferredServiceWorkerBuild,
  writeServiceWorkerRecovery,
} from "../lib/service-worker-update";

type UpdatePhase = "idle" | "available" | "deferred" | "applying" | "error" | "updated";

type UpdatePresentation = {
  phase: UpdatePhase;
  waitingBuild?: string;
  message?: string;
};

const BUILD_ID = process.env.NEXT_PUBLIC_APP_BUILD_ID ?? "local";
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
const ACTIVATION_TIMEOUT_MS = 12_000;

export function ServiceWorkerRegistration() {
  const [presentation, setPresentation] = useState<UpdatePresentation>({ phase: "idle" });
  const [lessonActive, setLessonActive] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const reloadRequestedRef = useRef(false);
  const reloadTargetRef = useRef("");
  const activationTimeoutRef = useRef<number | null>(null);

  const publishWaitingWorker = useCallback((registration: ServiceWorkerRegistration, worker: ServiceWorker) => {
    if (!navigator.serviceWorker.controller) return;
    const waitingBuild = serviceWorkerBuildFromURL(worker.scriptURL) ?? "next";
    waitingWorkerRef.current = worker;
    registrationRef.current = registration;
    const activeLesson = isLessonRoute(window.location.search);
    const deferred = readDeferredServiceWorkerBuild(window.sessionStorage) === waitingBuild;
    setLessonActive(activeLesson);
    setPresentation({ phase: deferred ? "deferred" : "available", waitingBuild });
  }, []);

  const applyWaitingUpdate = useCallback(() => {
    const registration = registrationRef.current;
    const worker = registration?.waiting ?? waitingWorkerRef.current;
    if (!worker) {
      setPresentation({
        phase: "error",
        message: "Новая версия больше не ожидает активации. Выполните повторную проверку позже.",
      });
      return;
    }

    const activeLesson = isLessonRoute(window.location.search);
    const snapshot = createServiceWorkerRecoverySnapshot({
      reason: "service-worker-update",
      buildID: BUILD_ID,
      href: window.location.href,
      lessonActive: activeLesson,
    });
    writeServiceWorkerRecovery(window.sessionStorage, snapshot);
    clearDeferredServiceWorkerBuild(window.sessionStorage);
    reloadRequestedRef.current = true;
    reloadTargetRef.current = snapshot.resumeHref;
    setLessonActive(activeLesson);
    setPresentation({
      phase: "applying",
      waitingBuild: serviceWorkerBuildFromURL(worker.scriptURL) ?? "next",
    });

    try {
      worker.postMessage({ type: SERVICE_WORKER_SKIP_WAITING });
      activationTimeoutRef.current = window.setTimeout(() => {
        if (!reloadRequestedRef.current) return;
        reloadRequestedRef.current = false;
        setPresentation({
          phase: "error",
          message: "Браузер не подтвердил активацию новой версии. Прогресс не потерян; повторите обновление позже.",
        });
      }, ACTIVATION_TIMEOUT_MS);
    } catch (activationError) {
      reloadRequestedRef.current = false;
      console.error("[LexiGo] Service worker activation request failed", {
        buildID: BUILD_ID,
        error: activationError,
      });
      setPresentation({
        phase: "error",
        message: "Не удалось передать браузеру команду обновления. Прогресс не потерян.",
      });
    }
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let disposed = false;
    const workerStateCleanups: Array<() => void> = [];

    Promise.resolve().then(() => {
      if (disposed) return;
      const recovery = consumeServiceWorkerRecovery(window.sessionStorage);
      if (recovery) {
        setPresentation({
          phase: "updated",
          message: recovery.lessonActive
            ? "Приложение обновлено. Незавершённый урок сохранён на сервере и доступен для продолжения."
            : "Приложение обновлено до актуальной версии.",
        });
      }
    });

    const handleControllerChange = () => {
      if (!reloadRequestedRef.current) return;
      reloadRequestedRef.current = false;
      if (activationTimeoutRef.current !== null) {
        window.clearTimeout(activationTimeoutRef.current);
        activationTimeoutRef.current = null;
      }
      const target = reloadTargetRef.current;
      if (target === "/") window.location.assign(target);
      else window.location.reload();
    };

    const handleWorkerMessage = (event: MessageEvent<unknown>) => {
      const data = event.data;
      if (!data || typeof data !== "object" || !("type" in data) || data.type !== SERVICE_WORKER_ACTIVATED) return;
      console.info("[LexiGo] Service worker activated", data);
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    navigator.serviceWorker.addEventListener("message", handleWorkerMessage);

    void navigator.serviceWorker.register(serviceWorkerScriptURL(BUILD_ID), {
      scope: "/",
      updateViaCache: "none",
    }).then((registration) => {
      if (
        disposed ||
        !registration ||
        typeof registration.addEventListener !== "function" ||
        typeof registration.removeEventListener !== "function" ||
        typeof registration.update !== "function"
      ) {
        return;
      }
      registrationRef.current = registration;

      const watchInstallingWorker = () => {
        const installing = registration.installing;
        if (!installing) return;
        const handleStateChange = () => {
          if (disposed || installing.state !== "installed") return;
          const waiting = registration.waiting ?? installing;
          publishWaitingWorker(registration, waiting);
        };
        installing.addEventListener("statechange", handleStateChange);
        workerStateCleanups.push(() => installing.removeEventListener("statechange", handleStateChange));
      };

      const handleUpdateFound = () => watchInstallingWorker();
      registration.addEventListener("updatefound", handleUpdateFound);
      workerStateCleanups.push(() => registration.removeEventListener("updatefound", handleUpdateFound));

      if (registration.waiting) publishWaitingWorker(registration, registration.waiting);
      if (registration.installing) watchInstallingWorker();

      const checkForUpdate = () => {
        void registration.update().catch((updateError) => {
          console.error("[LexiGo] Service worker update check failed", {
            buildID: BUILD_ID,
            error: updateError,
          });
        });
      };
      window.addEventListener("online", checkForUpdate);
      window.addEventListener("focus", checkForUpdate);
      const updateTimer = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
      workerStateCleanups.push(() => {
        window.removeEventListener("online", checkForUpdate);
        window.removeEventListener("focus", checkForUpdate);
        window.clearInterval(updateTimer);
      });
    }).catch((registrationError) => {
      if (disposed) return;
      console.error("[LexiGo] Service worker registration failed", {
        buildID: BUILD_ID,
        error: registrationError,
      });
      setPresentation({
        phase: "error",
        message: "Автоматическое обновление временно недоступно. Приложение продолжит работать в текущей версии.",
      });
    });

    return () => {
      disposed = true;
      workerStateCleanups.forEach((cleanup) => cleanup());
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      navigator.serviceWorker.removeEventListener("message", handleWorkerMessage);
      if (activationTimeoutRef.current !== null) window.clearTimeout(activationTimeoutRef.current);
    };
  }, [publishWaitingWorker]);

  useEffect(() => {
    if (presentation.phase !== "available" && presentation.phase !== "deferred") return;

    const synchronizeRoute = () => {
      const activeLesson = isLessonRoute(window.location.search);
      setLessonActive(activeLesson);
      if (!activeLesson && presentation.phase === "deferred") applyWaitingUpdate();
    };

    const initialTimer = window.setTimeout(synchronizeRoute, 0);
    const routeTimer = window.setInterval(synchronizeRoute, 1000);
    window.addEventListener("popstate", synchronizeRoute);
    window.addEventListener("pageshow", synchronizeRoute);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(routeTimer);
      window.removeEventListener("popstate", synchronizeRoute);
      window.removeEventListener("pageshow", synchronizeRoute);
    };
  }, [applyWaitingUpdate, presentation.phase]);

  function deferUntilLessonEnds() {
    const waitingBuild = presentation.waitingBuild ?? "next";
    writeDeferredServiceWorkerBuild(window.sessionStorage, waitingBuild);
    setPresentation({ phase: "deferred", waitingBuild });
  }

  if (presentation.phase === "idle") return null;

  if (presentation.phase === "updated") {
    return (
      <aside className="lx-sw-update lx-sw-update--success" role="status" aria-live="polite">
        <div>
          <strong>LexiGo обновлён</strong>
          <span>{presentation.message}</span>
        </div>
        <button type="button" onClick={() => setPresentation({ phase: "idle" })}>Закрыть</button>
      </aside>
    );
  }

  if (presentation.phase === "error") {
    return (
      <aside className="lx-sw-update lx-sw-update--error" role="alert" data-testid="service-worker-error">
        <div>
          <strong>Проверка обновления не завершена</strong>
          <span>{presentation.message}</span>
        </div>
        <button type="button" onClick={() => setPresentation({ phase: "idle" })}>Закрыть</button>
      </aside>
    );
  }

  const applying = presentation.phase === "applying";
  const deferred = presentation.phase === "deferred";
  const description = applying
    ? "Активируем новую версию. Страница перезагрузится после подтверждения браузера."
    : deferred
      ? "Обновление будет применено автоматически после выхода из урока."
      : lessonActive
        ? "Прогресс до последней сохранённой оценки уже находится на сервере. Можно обновить сейчас или дождаться выхода из урока."
        : "Новая версия готова. Обновление будет применено контролируемо после вашего подтверждения.";

  return (
    <aside className="lx-sw-update" role="status" aria-live="polite" data-testid="service-worker-update">
      <div>
        <strong>Доступно обновление LexiGo</strong>
        <span>{description}</span>
      </div>
      <div className="lx-sw-update__actions">
        <button type="button" disabled={applying} onClick={applyWaitingUpdate}>
          {applying ? "Обновляем…" : "Обновить сейчас"}
        </button>
        {lessonActive && !deferred && !applying ? (
          <button type="button" className="secondary" onClick={deferUntilLessonEnds}>
            После урока
          </button>
        ) : null}
        {!applying ? (
          <button type="button" className="quiet" onClick={() => setPresentation({ phase: "idle" })}>
            Позже
          </button>
        ) : null}
      </div>
    </aside>
  );
}
