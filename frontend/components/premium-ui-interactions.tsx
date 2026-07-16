"use client";

import { useEffect } from "react";

type StudyView = "card" | "example" | "context";

function navigateToProgress() {
  const target = "/?view=progress";
  if (window.location.pathname + window.location.search === target) return;
  window.history.pushState({ lexigo: true, view: "progress" }, "", target);
  window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
}

function studyViewFromButton(button: HTMLButtonElement): StudyView {
  const label = button.textContent?.trim() ?? "";
  if (label.includes("Пример")) return "example";
  if (label.includes("Контекст")) return "context";
  return "card";
}

function activateStudyTab(button: HTMLButtonElement) {
  const tabs = button.closest<HTMLElement>(".lx-study-tabs");
  const studyColumn = button.closest<HTMLElement>(".lx-study-column");
  if (!tabs || !studyColumn) return;

  const selectedView = studyViewFromButton(button);
  studyColumn.dataset.studyView = selectedView;

  const buttons = Array.from(tabs.querySelectorAll<HTMLButtonElement>("button"));
  buttons.forEach((entry) => {
    const selected = entry === button;
    entry.classList.toggle("active", selected);
    entry.setAttribute("aria-selected", String(selected));
    entry.setAttribute("role", "tab");
    entry.tabIndex = selected ? 0 : -1;
  });
  tabs.setAttribute("role", "tablist");
}

function initializeStudyTabs(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(".lx-study-column").forEach((studyColumn) => {
    if (studyColumn.dataset.studyView) return;
    const active = studyColumn.querySelector<HTMLButtonElement>(".lx-study-tabs button.active")
      ?? studyColumn.querySelector<HTMLButtonElement>(".lx-study-tabs button");
    if (active) activateStudyTab(active);
  });
}

function speechText(button: HTMLButtonElement): string {
  const container = button.closest<HTMLElement>(".lx-word-preview, .lx-main-word-card, .lx-detail-card");
  return container?.querySelector<HTMLElement>("h1, h3")?.textContent?.trim() ?? "";
}

function showSpeechMessage(message: string, error = false) {
  let toast = document.querySelector<HTMLDivElement>(".lx-speech-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "lx-speech-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("error", error);
  toast.classList.add("visible");
  window.setTimeout(() => toast?.classList.remove("visible"), 2200);
}

function pronounce(button: HTMLButtonElement) {
  const text = speechText(button);
  if (!text) {
    showSpeechMessage("Не удалось определить слово для озвучивания", true);
    return;
  }
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    showSpeechMessage("Озвучивание не поддерживается этим браузером", true);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb"))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us"))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
    ?? null;
  utterance.lang = utterance.voice?.lang || "en-US";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  utterance.onstart = () => {
    button.classList.add("speaking");
    button.setAttribute("aria-label", `Остановить произношение: ${text}`);
  };
  utterance.onend = () => {
    button.classList.remove("speaking");
    button.setAttribute("aria-label", `Произнести: ${text}`);
  };
  utterance.onerror = () => {
    button.classList.remove("speaking");
    showSpeechMessage("Не удалось воспроизвести произношение", true);
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  window.speechSynthesis.speak(utterance);
}

function localizeAuthenticationError(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(".lx-error").forEach((element) => {
    const value = element.textContent?.trim().toLowerCase() ?? "";
    if (value.includes("invalid credentials") || value.includes("invalid token")) {
      element.textContent = "Неверный email или пароль. Проверьте данные и попробуйте снова.";
    }
  });
}

export function PremiumUIInteractions() {
  useEffect(() => {
    initializeStudyTabs();
    localizeAuthenticationError();
    window.speechSynthesis?.getVoices();

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const notifications = event.target.closest<HTMLButtonElement>(".lx-icon-button");
      if (notifications) {
        event.preventDefault();
        navigateToProgress();
        return;
      }

      const speechButton = event.target.closest<HTMLButtonElement>(
        "button[aria-label*='Произнести'], .lx-word-title-row button",
      );
      if (speechButton) {
        event.preventDefault();
        pronounce(speechButton);
        return;
      }

      const studyTab = event.target.closest<HTMLButtonElement>(".lx-study-tabs button");
      if (studyTab) {
        event.preventDefault();
        activateStudyTab(studyTab);
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (!(event.target instanceof HTMLButtonElement)) return;
      if (!event.target.matches(".lx-study-tabs button")) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      const tabs = Array.from(
        event.target.closest(".lx-study-tabs")?.querySelectorAll<HTMLButtonElement>("button") ?? [],
      );
      const currentIndex = tabs.indexOf(event.target);
      if (currentIndex < 0 || tabs.length === 0) return;

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(currentIndex + direction + tabs.length) % tabs.length];
      next.focus();
      activateStudyTab(next);
    };

    const observer = new MutationObserver((entries) => {
      entries.forEach((entry) => {
        entry.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          initializeStudyTabs(node);
          localizeAuthenticationError(node);
        });
      });
      localizeAuthenticationError();
    });

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
      observer.disconnect();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return null;
}
