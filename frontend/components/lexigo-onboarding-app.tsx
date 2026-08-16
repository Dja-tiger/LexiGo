"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { authorizedJSON } from "../lib/authorized-json";
import type { Session } from "../lib/auth-session";
import { navigationURL, viewTitle } from "../lib/navigation";
import {
  diagnosticMarkLabel,
  isDiagnosticMarkResultPayload,
  isOnboardingSnapshotPayload,
  type DiagnosticMarkResult,
  type DiagnosticSelfMark,
  type OnboardingSnapshot,
} from "../lib/onboarding";
import { RequestFailure } from "../lib/request-failure";

const PRODUCT_ROUTE_GRAPH_EVENT = "lexigo:product-route-graph";
const ROLE_OPTIONS = [
  "Data Engineer",
  "Backend Engineer",
  "SRE / Platform",
  "Technical Manager",
] as const;
type FirstUseRole = typeof ROLE_OPTIONS[number];
type RetryAction = "load" | "start" | "mark" | "complete" | "skip" | null;

type LexigoOnboardingAppProps = {
  initialSession: Session;
  onSessionUpdated: (session: Session) => void;
};

type RevealState = {
  mark: DiagnosticSelfMark;
  result: DiagnosticMarkResult;
};

function roleSource(role: FirstUseRole) {
  if (role === "Data Engineer") return "data-engineering" as const;
  if (role === "Backend Engineer") return "backend" as const;
  return "mixed" as const;
}

function diagnosticPosition(snapshot: OnboardingSnapshot): number {
  if (snapshot.total <= 0) return 0;
  return Math.min(snapshot.marked + 1, snapshot.total);
}

function progressPercent(snapshot: OnboardingSnapshot): number {
  if (snapshot.total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((snapshot.marked / snapshot.total) * 100)));
}

function FirstUseHeader({ step }: { step?: string }) {
  return (
    <header className="lx-first-use-header">
      <strong className="lx-first-use-brand">LexiGo</strong>
      {step ? <span className="lx-first-use-step">{step}</span> : null}
    </header>
  );
}

export function LexigoOnboardingApp({ initialSession, onSessionUpdated }: LexigoOnboardingAppProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
  const [selectedRole, setSelectedRole] = useState<FirstUseRole>("Data Engineer");
  const [selectedMark, setSelectedMark] = useState<DiagnosticSelfMark | null>(null);
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryAction, setRetryAction] = useState<RetryAction>(null);
  const [noCandidates, setNoCandidates] = useState(false);

  const resume = Boolean(snapshot?.state === "in_progress" && snapshot.marked > 0 && !reveal);
  const position = snapshot ? diagnosticPosition(snapshot) : 0;
  const progress = snapshot ? progressPercent(snapshot) : 0;
  const current = snapshot?.current;

  const activeRoleSource = useMemo(() => roleSource(selectedRole), [selectedRole]);

  function adoptSession(next: Session) {
    setSession(next);
    if (next.tokens.accessToken !== session.tokens.accessToken) onSessionUpdated(next);
  }

  function clearError() {
    setErrorMessage("");
    setRetryAction(null);
    setNoCandidates(false);
  }

  function presentFailure(error: unknown, retry: RetryAction) {
    if (error instanceof RequestFailure && error.code === "onboarding_no_candidates") {
      setNoCandidates(true);
      setErrorMessage("Для диагностики пока нет доступных учебных элементов. Откройте обучение и добавьте материал в свою очередь.");
      setRetryAction(null);
      return;
    }
    setNoCandidates(false);
    setErrorMessage(error instanceof Error ? error.message : "Не удалось продолжить настройку");
    setRetryAction(retry);
  }

  async function loadStatus() {
    setLoading(true);
    clearError();
    try {
      const result = await authorizedJSON<OnboardingSnapshot>(
        session,
        "/api/v1/onboarding",
        {},
        isOnboardingSnapshotPayload,
      );
      adoptSession(result.activeSession);
      setSnapshot(result.data);
      setSelectedMark(null);
      setReveal(null);
      setSkipConfirm(false);
    } catch (error) {
      presentFailure(error, "load");
    } finally {
      setLoading(false);
    }
  }

  async function startDiagnostic() {
    if (busy) return;
    setBusy(true);
    clearError();
    try {
      const result = await authorizedJSON<OnboardingSnapshot>(
        session,
        "/api/v1/onboarding/start",
        { method: "POST" },
        isOnboardingSnapshotPayload,
      );
      adoptSession(result.activeSession);
      setSnapshot(result.data);
      setSelectedMark(null);
      setReveal(null);
    } catch (error) {
      presentFailure(error, "start");
    } finally {
      setBusy(false);
    }
  }

  async function saveMark() {
    if (busy || !snapshot?.current || !selectedMark || reveal) return;
    const wordID = snapshot.current.id;
    const mark = selectedMark;
    setBusy(true);
    clearError();
    try {
      const result = await authorizedJSON<DiagnosticMarkResult>(
        session,
        `/api/v1/onboarding/items/${wordID}/mark`,
        {
          method: "POST",
          body: JSON.stringify({ mark }),
        },
        isDiagnosticMarkResultPayload,
      );
      adoptSession(result.activeSession);
      if (result.data.reveal.id !== wordID) {
        throw new Error("Сервер вернул ответ для другого диагностического элемента");
      }
      setReveal({ mark, result: result.data });
    } catch (error) {
      setReveal(null);
      presentFailure(error, "mark");
    } finally {
      setBusy(false);
    }
  }

  async function completeDiagnostic() {
    if (busy) return;
    setBusy(true);
    clearError();
    try {
      const result = await authorizedJSON<OnboardingSnapshot>(
        session,
        "/api/v1/onboarding/complete",
        { method: "POST" },
        isOnboardingSnapshotPayload,
      );
      adoptSession(result.activeSession);
      setSnapshot(result.data);
      setSelectedMark(null);
      setReveal(null);
    } catch (error) {
      presentFailure(error, "complete");
    } finally {
      setBusy(false);
    }
  }

  async function continueAfterReveal() {
    if (!reveal || busy) return;
    if (reveal.result.completeReady) {
      await completeDiagnostic();
      return;
    }
    await loadStatus();
  }

  async function skipDiagnostic() {
    if (busy) return;
    setBusy(true);
    clearError();
    try {
      const result = await authorizedJSON<OnboardingSnapshot>(
        session,
        "/api/v1/onboarding/skip",
        { method: "POST" },
        isOnboardingSnapshotPayload,
      );
      adoptSession(result.activeSession);
      setSnapshot(result.data);
      setSelectedMark(null);
      setReveal(null);
      setSkipConfirm(false);
    } catch (error) {
      presentFailure(error, "skip");
    } finally {
      setBusy(false);
    }
  }

  function openLearn() {
    const target = navigationURL({ view: "learn", source: activeRoleSource });
    window.dispatchEvent(new CustomEvent(PRODUCT_ROUTE_GRAPH_EVENT, {
      detail: { routeGraph: "learn", pathname: "/learn" },
    }));
    router.push(target, { scroll: false });
  }

  function retry() {
    if (retryAction === "load") void loadStatus();
    else if (retryAction === "start") void startDiagnostic();
    else if (retryAction === "mark") void saveMark();
    else if (retryAction === "complete") void completeDiagnostic();
    else if (retryAction === "skip") void skipDiagnostic();
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timer);
    // The authoritative status is loaded once for each bootstrapped session owner.
    // Token refreshes are adopted inside authorizedJSON without restarting this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSession.user.id]);

  if (loading && !snapshot) {
    return (
      <div className="lx-first-use lx-first-use--onboarding" data-route-client-island="onboarding">
        <FirstUseHeader />
        <main id="lexigo-main-content" className="lx-first-use-main" tabIndex={-1} aria-label={viewTitle("onboarding")} aria-busy="true">
          <section className="lx-first-use-panel lx-first-use-loading" aria-live="polite">
            <span className="lx-first-use-kicker">ЗАГРУЗКА</span>
            <h1>Подготавливаем диагностику</h1>
            <p className="lx-first-use-copy-mobile">Загружаем текущую позицию и сохраняем безопасный resume.</p>
            <p className="lx-first-use-copy-desktop">Восстанавливаем first-use state и текущую диагностическую позицию.</p>
            <div className="lx-first-use-skeletons" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
            <div className="lx-first-use-note">Никакие ответы не раскрываются во время загрузки.</div>
          </section>
        </main>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="lx-first-use lx-first-use--onboarding" data-route-client-island="onboarding">
        <FirstUseHeader />
        <main id="lexigo-main-content" className="lx-first-use-main" tabIndex={-1} aria-label={viewTitle("onboarding")}>
          <section className="lx-first-use-panel lx-first-use-message" role="alert">
            <span className="lx-first-use-state-icon lx-first-use-state-icon--error" aria-hidden="true">!</span>
            <h1>{noCandidates ? "Диагностика пока недоступна" : "Не удалось продолжить"}</h1>
            <p>{errorMessage}</p>
            {retryAction ? (
              <button type="button" className="lx-first-use-button lx-first-use-button--primary" onClick={retry} disabled={busy}>
                Повторить
              </button>
            ) : (
              <button type="button" className="lx-first-use-button lx-first-use-button--primary" onClick={openLearn}>
                Перейти к обучению
              </button>
            )}
            <button type="button" className="lx-first-use-button lx-first-use-button--secondary" onClick={() => router.back()}>
              Вернуться назад
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (skipConfirm) {
    return (
      <div className="lx-first-use lx-first-use--onboarding" data-route-client-island="onboarding">
        <FirstUseHeader />
        <main id="lexigo-main-content" className="lx-first-use-main" tabIndex={-1} aria-label={viewTitle("onboarding")}>
          <section className="lx-first-use-panel lx-first-use-message">
            <span className="lx-first-use-state-icon" aria-hidden="true">→</span>
            <h1>Пропустить диагностику?</h1>
            <p>Вы сможете начать обучение сразу. Пропуск не меняет scheduler и не блокирует дальнейшие уроки.</p>
            <button type="button" className="lx-first-use-button lx-first-use-button--primary" onClick={() => void skipDiagnostic()} disabled={busy}>
              {busy ? "Сохраняем…" : "Продолжить без диагностики"}
            </button>
            <button type="button" className="lx-first-use-button lx-first-use-button--secondary" onClick={() => setSkipConfirm(false)} disabled={busy}>
              Вернуться к диагностике
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (snapshot?.state === "completed" || snapshot?.state === "skipped") {
    const completed = snapshot.state === "completed";
    return (
      <div className="lx-first-use lx-first-use--onboarding" data-route-client-island="onboarding">
        <FirstUseHeader />
        <main id="lexigo-main-content" className="lx-first-use-main" tabIndex={-1} aria-label={viewTitle("onboarding")}>
          <section className="lx-first-use-panel lx-first-use-message" aria-live="polite">
            <span className="lx-first-use-state-icon lx-first-use-state-icon--success" aria-hidden="true">✓</span>
            <h1>{completed ? "Персональная очередь готова" : "Диагностика пропущена"}</h1>
            <p>
              {completed
                ? "Диагностические отметки сохранены. Начните с короткой практики — направление можно изменить в обучении."
                : "Настройка сохранена. Первый урок будет собран без диагностических отметок."}
            </p>
            {completed ? <div className="lx-first-use-note"><strong>ГОТОВО</strong><span>Стартовая очередь собрана без fake progress.</span></div> : null}
            <button type="button" className="lx-first-use-button lx-first-use-button--primary" onClick={openLearn}>
              {completed ? "Начать первый урок" : "Перейти к первому уроку"}
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (snapshot?.state === "in_progress") {
    if (!current && snapshot.total > 0 && snapshot.marked >= snapshot.total) {
      return (
        <div className="lx-first-use lx-first-use--onboarding" data-route-client-island="onboarding">
          <FirstUseHeader step="3 из 3" />
          <main id="lexigo-main-content" className="lx-first-use-main" tabIndex={-1} aria-label={viewTitle("onboarding")}>
            <section className="lx-first-use-panel lx-first-use-message">
              <span className="lx-first-use-state-icon lx-first-use-state-icon--success" aria-hidden="true">✓</span>
              <h1>Все отметки сохранены</h1>
              <p>Завершите настройку, чтобы сервер применил диагностический результат к стартовой очереди.</p>
              <button type="button" className="lx-first-use-button lx-first-use-button--primary" onClick={() => void completeDiagnostic()} disabled={busy}>
                {busy ? "Завершаем…" : "Завершить настройку"}
              </button>
            </section>
          </main>
        </div>
      );
    }

    if (!current) {
      return (
        <div className="lx-first-use lx-first-use--onboarding" data-route-client-island="onboarding">
          <FirstUseHeader step="2 из 3" />
          <main id="lexigo-main-content" className="lx-first-use-main" tabIndex={-1} aria-label={viewTitle("onboarding")}>
            <section className="lx-first-use-panel lx-first-use-message">
              <h1>Текущая позиция недоступна</h1>
              <p>Повторно загрузите серверное состояние диагностики.</p>
              <button type="button" className="lx-first-use-button lx-first-use-button--primary" onClick={() => void loadStatus()}>
                Повторить
              </button>
            </section>
          </main>
        </div>
      );
    }

    return (
      <div className="lx-first-use lx-first-use--onboarding" data-route-client-island="onboarding">
        <FirstUseHeader step="2 из 3" />
        <main id="lexigo-main-content" className="lx-first-use-main" tabIndex={-1} aria-label={viewTitle("onboarding")}>
          <section className="lx-first-use-panel lx-first-use-diagnostic" aria-busy={busy}>
            <div
              className="lx-first-use-progress"
              role="progressbar"
              aria-label="Диагностический прогресс"
              aria-valuemin={0}
              aria-valuemax={snapshot.total}
              aria-valuenow={snapshot.marked}
              aria-valuetext={`${snapshot.marked} из ${snapshot.total} ответов сохранено`}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <span className="lx-first-use-kicker">{position} из {snapshot.total}</span>
            <h1>{resume ? "Продолжим диагностику" : reveal ? "Перевод открыт после отметки" : "Что уже знакомо?"}</h1>
            <p>Сначала отметьте знакомство. Перевод появится только после выбора.</p>

            <article className="lx-first-use-diagnostic-card">
              <strong>{current.lemma}</strong>
              {current.phonetic ? <span>{current.phonetic}</span> : null}
              <p>{current.topic ? `Контекст: ${current.topic}` : "Термин из вашей учебной очереди"}</p>
              {reveal ? (
                <div className="lx-first-use-reveal" aria-live="polite">
                  <strong>{reveal.result.reveal.translation}</strong>
                  <span>Вы отметили: {diagnosticMarkLabel(reveal.mark)}</span>
                </div>
              ) : null}
            </article>

            {resume && !reveal ? (
              <div className="lx-first-use-note">Прогресс сохранён: {snapshot.marked} ответов. Этот термин — следующий.</div>
            ) : null}

            <div className="lx-first-use-mark-group" role="radiogroup" aria-label="Насколько знаком термин">
              {(["known", "unsure", "new"] as const).map((mark) => {
                const selected = (reveal?.mark ?? selectedMark) === mark;
                return (
                  <button
                    key={mark}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={selected ? "selected" : ""}
                    onClick={() => !reveal && setSelectedMark(mark)}
                    disabled={Boolean(reveal) || busy}
                  >
                    {diagnosticMarkLabel(mark)}
                  </button>
                );
              })}
            </div>

            {reveal ? (
              <>
                <button type="button" className="lx-first-use-button lx-first-use-button--primary" onClick={() => void continueAfterReveal()} disabled={busy}>
                  {busy ? "Загружаем…" : "Продолжить"}
                </button>
                <small className="lx-first-use-hint">Следующий термин откроется после продолжения.</small>
              </>
            ) : (
              <>
                <button type="button" className="lx-first-use-button lx-first-use-button--primary" onClick={() => void saveMark()} disabled={!selectedMark || busy}>
                  {busy ? "Сохраняем…" : "Сохранить отметку"}
                </button>
                <button type="button" className="lx-first-use-text-action" onClick={() => setSkipConfirm(true)} disabled={busy}>
                  Пропустить диагностику
                </button>
              </>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="lx-first-use lx-first-use--onboarding" data-route-client-island="onboarding">
      <FirstUseHeader step="1 из 3" />
      <main id="lexigo-main-content" className="lx-first-use-main" tabIndex={-1} aria-label={viewTitle("onboarding")}>
        <section className="lx-first-use-panel lx-first-use-role" aria-busy={busy}>
          <div
            className="lx-first-use-progress"
            role="progressbar"
            aria-label="Шаг настройки"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={1}
            aria-valuetext="Шаг 1 из 3"
          >
            <span style={{ width: "33.333%" }} />
          </div>
          <span className="lx-first-use-kicker">ШАГ 1 ИЗ 3</span>
          <h1>Настроим полезный первый урок</h1>
          <p className="lx-first-use-copy-mobile">Три коротких шага. Настройки можно изменить позже.</p>
          <p className="lx-first-use-copy-desktop">Выберите рабочий контекст — он задаст направление первого урока после диагностики.</p>
          <strong className="lx-first-use-field-label">Ваша рабочая роль</strong>
          <div className="lx-first-use-role-group" role="radiogroup" aria-label="Ваша рабочая роль">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role}
                type="button"
                role="radio"
                aria-checked={selectedRole === role}
                className={selectedRole === role ? "selected" : ""}
                onClick={() => setSelectedRole(role)}
                disabled={busy}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="lx-first-use-note">
            <strong>ДАЛЬШЕ</strong>
            <span>Короткая диагностика уберёт уже знакомый материал. Серверный scheduler изменится только после ваших отметок.</span>
          </div>
          <button type="button" className="lx-first-use-button lx-first-use-button--primary" onClick={() => void startDiagnostic()} disabled={busy}>
            {busy ? "Подготавливаем…" : "Продолжить"}
          </button>
          <button type="button" className="lx-first-use-text-action" onClick={() => setSkipConfirm(true)} disabled={busy}>
            Пропустить настройку
          </button>
        </section>
      </main>
    </div>
  );
}
