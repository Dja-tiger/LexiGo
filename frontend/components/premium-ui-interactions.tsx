"use client";

import { useEffect } from "react";

function navigateToProgress() {
  const target = "/?view=progress";
  if (window.location.pathname + window.location.search === target) return;
  window.history.pushState({ lexigo: true, view: "progress" }, "", target);
  window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
}

function activateStudyTab(button: HTMLButtonElement) {
  const tabs = button.closest<HTMLElement>(".lx-study-tabs");
  const studyColumn = button.closest<HTMLElement>(".lx-study-column");
  if (!tabs || !studyColumn) return;

  const buttons = Array.from(tabs.querySelectorAll<HTMLButtonElement>("button"));
  buttons.forEach((entry) => {
    const selected = entry === button;
    entry.classList.toggle("active", selected);
    entry.setAttribute("aria-selected", String(selected));
    entry.tabIndex = selected ? 0 : -1;
  });

  const label = button.textContent?.trim() ?? "";
  const target = label.includes("Пример")
    ? studyColumn.querySelector<HTMLElement>(".lx-simple-word dd.example, .lx-answer-reveal blockquote")
    : label.includes("Контекст")
      ? studyColumn.querySelector<HTMLElement>(".lx-simple-word dd.note, .lx-cloze-note, .lx-answer-reveal small")
      : studyColumn.querySelector<HTMLElement>(".lx-word-title-row, .lx-test-word > h1, .lx-main-word-card");

  target?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function PremiumUIInteractions() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const notifications = event.target.closest<HTMLButtonElement>(".lx-icon-button");
      if (notifications) {
        event.preventDefault();
        navigateToProgress();
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

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  return null;
}
