"use client";

import { useEffect } from "react";

type StudyView = "card" | "example" | "context";
type CollectionSource = "daily-life" | "travel" | "data-engineering" | "backend";

type CollectionDefinition = {
  source: CollectionSource;
  label: string;
  shortLabel: string;
  description: string;
  symbol: string;
  count: number;
};

const COLLECTIONS: CollectionDefinition[] = [
  {
    source: "daily-life",
    label: "Бытовой английский",
    shortLabel: "Для жизни",
    description: "Самые нужные слова для дома, покупок, услуг и повседневного общения",
    symbol: "A1",
    count: 30,
  },
  {
    source: "travel",
    label: "Для путешествий",
    shortLabel: "Путешествия",
    description: "Аэропорт, отель, транспорт, документы, бронирования и навигация",
    symbol: "✈",
    count: 30,
  },
  {
    source: "data-engineering",
    label: "Data Engineer",
    shortLabel: "Data Engineer",
    description: "Пайплайны, хранилища, обработка, качество данных и архитектура",
    symbol: "DB",
    count: 30,
  },
  {
    source: "backend",
    label: "Backend Development",
    shortLabel: "Backend",
    description: "API, базы данных, очереди, кэширование, надёжность и observability",
    symbol: "</>",
    count: 30,
  },
];

const CATALOG_COUNTS: Record<string, number> = {
  "Все слова": 699,
  "Весь словарь": 699,
  "Существительные": 293,
  "Глаголы": 169,
  "Прилагательные": 193,
};

function navigateToProgress() {
  const target = "/?view=progress";
  if (window.location.pathname + window.location.search === target) return;
  window.history.pushState({ lexigo: true, view: "progress" }, "", target);
  window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
}

function navigateToCollection(source: CollectionSource) {
  const target = `/?view=learn&source=${source}`;
  if (window.location.pathname + window.location.search !== target) {
    window.history.pushState({ lexigo: true, view: "learn", source }, "", target);
  }
  window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  window.setTimeout(() => {
    initializeVocabularyCollections();
    document.querySelector<HTMLElement>(`.lx-themed-selector[data-lexigo-collection="${source}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 0);
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

function collectionButton(definition: CollectionDefinition, variant: "home" | "selector" | "library") {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.lexigoCollection = definition.source;
  button.className = `lx-themed-${variant} lx-collection-${definition.source}`;

  if (variant === "selector") {
    const icon = document.createElement("span");
    icon.className = "lx-themed-symbol";
    icon.textContent = definition.symbol;
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = definition.label;
    const hint = document.createElement("small");
    hint.textContent = definition.description;
    copy.append(title, hint);
    const count = document.createElement("b");
    count.textContent = String(definition.count);
    button.append(icon, copy, count);
    return button;
  }

  const icon = document.createElement("span");
  icon.className = "lx-themed-symbol";
  icon.textContent = definition.symbol;
  const copy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = variant === "home" ? definition.shortLabel : definition.label;
  const hint = document.createElement("small");
  hint.textContent = variant === "home"
    ? `${definition.count} слов и терминов`
    : definition.description;
  copy.append(title, hint);
  const arrow = document.createElement("span");
  arrow.className = "lx-themed-arrow";
  arrow.textContent = "→";
  button.append(icon, copy, arrow);
  return button;
}

function appendCollectionButtons(container: Element, variant: "home" | "selector" | "library") {
  COLLECTIONS.forEach((definition) => {
    const selector = `[data-lexigo-collection="${definition.source}"]`;
    if (!container.querySelector(selector)) container.appendChild(collectionButton(definition, variant));
  });
}

function updateCollectionSelection() {
  const source = new URLSearchParams(window.location.search).get("source");
  document.querySelectorAll<HTMLElement>("[data-lexigo-collection]").forEach((button) => {
    const selected = button.dataset.lexigoCollection === source;
    button.classList.toggle("selected", selected);
    if (button.getAttribute("aria-pressed") !== String(selected)) {
      button.setAttribute("aria-pressed", String(selected));
    }
  });
}

function updateCatalogCounts(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(".lx-source-selector button, .lx-section-grid button, .lx-library-grid button").forEach((button) => {
    const label = button.querySelector("strong")?.textContent?.trim() ?? "";
    const count = CATALOG_COUNTS[label];
    if (count === undefined) return;
    const countText = String(count);

    const directCount = button.querySelector<HTMLElement>(":scope > b");
    if (directCount && directCount.textContent !== countText) directCount.textContent = countText;

    const firstSpan = button.querySelector<HTMLElement>(":scope > span:not(.lx-section-icon):not(.lx-themed-symbol)");
    if (firstSpan && /^\d+$/.test(firstSpan.textContent?.trim() ?? "") && firstSpan.textContent !== countText) {
      firstSpan.textContent = countText;
    }

    const small = button.querySelector<HTMLElement>("small");
    if (small && /^\d+\s/.test(small.textContent?.trim() ?? "")) {
      const current = small.textContent ?? "";
      const next = current.replace(/^\d+/, countText);
      if (next !== current) small.textContent = next;
    }
  });

  root.querySelectorAll<HTMLElement>(".lx-view h1, .lx-view p, .lx-view small").forEach((element) => {
    const current = element.textContent ?? "";
    if (element.childElementCount === 0 && current.includes("579")) {
      const next = current.replace(/\b579\b/g, "699");
      if (next !== current) element.textContent = next;
    }
  });
}

function localizeCollectionLabels(root: ParentNode = document) {
  const labels: Record<CollectionSource, string> = {
    "daily-life": "Бытовой английский",
    travel: "Путешествия",
    "data-engineering": "Data Engineer",
    backend: "Backend Development",
  };
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const value = node.nodeValue?.trim() as CollectionSource | undefined;
    if (value && labels[value]) node.nodeValue = node.nodeValue?.replace(value, labels[value]) ?? labels[value];
    node = walker.nextNode();
  }
}

function initializeVocabularyCollections(root: ParentNode = document) {
  root.querySelectorAll(".lx-section-grid").forEach((container) => appendCollectionButtons(container, "home"));
  root.querySelectorAll(".lx-source-selector").forEach((container) => appendCollectionButtons(container, "selector"));
  root.querySelectorAll(".lx-library-grid").forEach((container) => appendCollectionButtons(container, "library"));
  updateCatalogCounts(root);
  localizeCollectionLabels(root);
  updateCollectionSelection();
}

export function PremiumUIInteractions() {
  useEffect(() => {
    initializeStudyTabs();
    localizeAuthenticationError();
    initializeVocabularyCollections();
    window.speechSynthesis?.getVoices();

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const collection = event.target.closest<HTMLElement>("[data-lexigo-collection]");
      if (collection?.dataset.lexigoCollection) {
        event.preventDefault();
        navigateToCollection(collection.dataset.lexigoCollection as CollectionSource);
        return;
      }

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

    const handlePopState = () => window.setTimeout(() => initializeVocabularyCollections(), 0);
    const observer = new MutationObserver((entries) => {
      entries.forEach((entry) => {
        entry.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          initializeStudyTabs(node);
          localizeAuthenticationError(node);
          initializeVocabularyCollections(node);
        });
      });
      localizeAuthenticationError();
      initializeVocabularyCollections();
    });

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("popstate", handlePopState);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("popstate", handlePopState);
      observer.disconnect();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return null;
}
