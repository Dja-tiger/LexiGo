"use client";

import { useRouter } from "next/navigation";
import { useCallback, useLayoutEffect } from "react";

import { authenticationURL } from "../lib/auth-return";
import { navigationURL, viewTitle } from "../lib/navigation";

const GUEST_VALUES = [
  {
    title: "Рабочий контекст",
    body: "Data, backend, platform и management",
  },
  {
    title: "10 минут",
    body: "Небольшая практика без длинных курсов",
  },
  {
    title: "Без fake progress",
    body: "Сначала настройка — затем реальные результаты",
  },
] as const;

export function LexigoGuestHomeApp() {
  const router = useRouter();

  useLayoutEffect(() => {
    const shell = document.querySelector<HTMLElement>('[data-app-router-shell="true"]');
    if (!shell) return;
    shell.dataset.firstUseFocus = "guest";
    return () => {
      if (shell.dataset.firstUseFocus === "guest") delete shell.dataset.firstUseFocus;
    };
  }, []);

  const startFirstUse = useCallback(() => {
    router.push(authenticationURL({ view: "onboarding" }), { scroll: false });
  }, [router]);

  const openDemo = useCallback(() => {
    router.push(navigationURL({ view: "learn" }), { scroll: false });
  }, [router]);

  const openSignIn = useCallback(() => {
    router.push(navigationURL({ view: "profile" }), { scroll: false });
  }, [router]);

  return (
    <div className="lx-first-use lx-first-use--guest" data-route-client-island="guest-home">
      <header className="lx-first-use-header">
        <strong className="lx-first-use-brand">LexiGo</strong>
        <button type="button" className="lx-first-use-sign-in" onClick={openSignIn}>
          Войти
        </button>
      </header>

      <main
        id="lexigo-main-content"
        className="lx-first-use-main lx-first-use-guest-main"
        tabIndex={-1}
        aria-label={viewTitle("home")}
      >
        <section className="lx-first-use-guest-copy" aria-labelledby="first-use-guest-title">
          <span className="lx-first-use-kicker lx-first-use-kicker--mobile">ТЕХНИЧЕСКИЙ АНГЛИЙСКИЙ</span>
          <span className="lx-first-use-kicker lx-first-use-kicker--desktop">ТЕХНИЧЕСКИЙ АНГЛИЙСКИЙ ДЛЯ РАБОТЫ</span>
          <h1 id="first-use-guest-title">
            <span className="lx-first-use-copy-mobile">Английский, который помогает в работе</span>
            <span className="lx-first-use-copy-desktop">Первый полезный урок — без длинной настройки</span>
          </h1>
          <p>
            <span className="lx-first-use-copy-mobile">Короткие практики под вашу роль. Диагностика сразу уберёт уже знакомый материал.</span>
            <span className="lx-first-use-copy-desktop">Выберите рабочий контекст, быстро отметьте знакомые термины и получите персональную очередь.</span>
          </p>

          <div className="lx-first-use-guest-values" aria-label="Что даст первый урок">
            {GUEST_VALUES.map((value) => (
              <article key={value.title} className="lx-first-use-value-card">
                <strong>{value.title}</strong>
                <span>{value.body}</span>
              </article>
            ))}
          </div>

          <div className="lx-first-use-guest-actions">
            <button type="button" className="lx-first-use-button lx-first-use-button--primary" onClick={startFirstUse}>
              Настроить первый урок
            </button>
            <button type="button" className="lx-first-use-text-action" onClick={openDemo}>
              Посмотреть демо
            </button>
          </div>
          <small className="lx-first-use-guest-note lx-first-use-copy-mobile">
            Аккаунт можно создать после знакомства с форматом.
          </small>
          <small className="lx-first-use-guest-note lx-first-use-copy-desktop">
            Никаких пустых progress cards до первой реальной практики.
          </small>
        </section>

        <section className="lx-first-use-practice-preview" aria-label="Превью первой практики">
          <span className="lx-first-use-kicker">ПРЕВЬЮ ПЕРВОЙ ПРАКТИКИ</span>
          <strong className="lx-first-use-preview-term">schema evolution</strong>
          <p>Контекст из типичной задачи Data Engineering.</p>
          <div className="lx-first-use-preview-choices" aria-hidden="true">
            <span>Знаю</span>
            <span className="selected">Не уверен</span>
            <span>Новое</span>
          </div>
          <small>Ответ показывается только после вашей отметки.</small>
        </section>
      </main>
    </div>
  );
}
