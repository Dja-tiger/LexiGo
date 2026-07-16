"use client";

import { useEffect } from "react";

import { sortCatalogEntries, type CatalogSortMode } from "../lib/catalog-sort";
import { dictionaryNavigationURL } from "../lib/dictionary-navigation";
import { extendTechnicalPhraseCatalog } from "../lib/expanded-phrases";

extendTechnicalPhraseCatalog();

type StudyView = "card" | "example" | "context";
type CollectionSource = "daily-life" | "travel" | "data-engineering" | "backend";
type CatalogKind = "phrases" | "all-items";

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
    description: "Дом, покупки, услуги, здоровье и повседневное общение",
    symbol: "A1",
    count: 55,
  },
  {
    source: "travel",
    label: "Для путешествий",
    shortLabel: "Путешествия",
    description: "Аэропорт, отель, транспорт, документы и навигация",
    symbol: "✈",
    count: 55,
  },
  {
    source: "data-engineering",
    label: "Data Engineer",
    shortLabel: "Data Engineer",
    description: "Моделирование, пайплайны, Kafka, качество и хранение данных",
    symbol: "DB",
    count: 55,
  },
  {
    source: "backend",
    label: "Backend Development",
    shortLabel: "Backend",
    description: "API, архитектура, базы данных, конкурентность и надёжность",
    symbol: "</>",
    count: 55,
  },
];

const CATALOG_COUNTS: Record<string, number> = {
  "Все слова": 799,
  "Весь словарь": 799,
  "Существительные": 383,
  "Глаголы": 179,
  "Прилагательные": 193,
  "Технические фразы": 124,
};

const SORT_STORAGE_PREFIX = "lexigo.catalog.sort.";

function navigateToCollection(source: CollectionSource) {
  const target = dictionaryNavigationURL({ collectionSource: source });
  if (target) window.location.assign(target);
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

  studyColumn.dataset.studyView = studyViewFromButton(button);
  Array.from(tabs.querySelectorAll<HTMLButtonElement>("button")).forEach((entry) => {
    const selected = entry === button;
    entry.classList.toggle("active", selected);
    entry.setAttribute("aria-selected", String(selected));
    entry.setAttribute("role", "tab");
    entry.tabIndex = selected ? 0 : -1;
  });
  tabs.setAttribute("role", "tablist");
}

function initializeStudyTabs(root: ParentNode = document) {
  const columns = Array.from(root.querySelectorAll<HTMLElement>(".lx-study-column"));
  if (root instanceof HTMLElement && root.matches(".lx-study-column")) columns.unshift(root);

  columns.forEach((studyColumn) => {
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
    showSpeechMessage("Не удалось определить слово или фразу для озвучивания", true);
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

  const icon = document.createElement("span");
  icon.className = "lx-themed-symbol";
  icon.textContent = definition.symbol;

  const copy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = variant === "home" ? definition.shortLabel : definition.label;
  const hint = document.createElement("small");
  hint.textContent = variant === "home" ? `${definition.count} слов и терминов` : definition.description;
  copy.append(title, hint);

  if (variant === "selector") {
    const count = document.createElement("b");
    count.textContent = String(definition.count);
    button.append(icon, copy, count);
  } else {
    const arrow = document.createElement("span");
    arrow.className = "lx-themed-arrow";
    arrow.textContent = "→";
    button.append(icon, copy, arrow);
  }

  return button;
}

function appendCollectionButtons(container: Element, variant: "home" | "selector" | "library") {
  COLLECTIONS.forEach((definition) => {
    if (!container.querySelector(`[data-lexigo-collection="${definition.source}"]`)) {
      container.appendChild(collectionButton(definition, variant));
    }
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
  root.querySelectorAll<HTMLElement>(
    ".lx-source-selector button, .lx-section-grid button, .lx-library-grid button",
  ).forEach((button) => {
    const label = button.querySelector("strong")?.textContent?.trim() ?? "";
    const count = CATALOG_COUNTS[label];
    if (count === undefined) return;

    const countText = String(count);
    const directCount = button.querySelector<HTMLElement>(":scope > b");
    if (directCount && directCount.textContent !== countText) directCount.textContent = countText;

    const firstSpan = button.querySelector<HTMLElement>(
      ":scope > span:not(.lx-section-icon):not(.lx-themed-symbol)",
    );
    if (
      firstSpan
      && /^\d+$/.test(firstSpan.textContent?.trim() ?? "")
      && firstSpan.textContent !== countText
    ) {
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
    if (element.childElementCount > 0) return;
    const current = element.textContent ?? "";
    const next = current.replace(/\b(?:579|699)\b/g, "799");
    if (next !== current) element.textContent = next;
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

function readSortMode(kind: CatalogKind): CatalogSortMode {
  const value = window.localStorage.getItem(`${SORT_STORAGE_PREFIX}${kind}`);
  return value === "az" || value === "za" ? value : "default";
}

function itemLabel(item: HTMLElement, kind: CatalogKind): string {
  return item.querySelector<HTMLElement>(kind === "phrases" ? "strong" : "h3")?.textContent?.trim() ?? "";
}

function itemSelector(kind: CatalogKind): string {
  return kind === "phrases" ? ":scope > button" : ":scope > article";
}

function applyCatalogSort(container: HTMLElement, kind: CatalogKind, mode: CatalogSortMode) {
  const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector(kind)));
  items.forEach((item, index) => {
    if (item.dataset.lexigoOriginalIndex === undefined) item.dataset.lexigoOriginalIndex = String(index);
  });
  const signature = items.map((item) => itemLabel(item, kind).toLocaleLowerCase("en")).sort().join("\u0000");
  if (container.dataset.lexigoSortMode === mode && container.dataset.lexigoSortSignature === signature) return;

  sortCatalogEntries(
    items,
    (item) => itemLabel(item, kind),
    (item) => Number(item.dataset.lexigoOriginalIndex ?? 0),
    mode,
  ).forEach((item) => container.appendChild(item));
  container.dataset.lexigoSortMode = mode;
  container.dataset.lexigoSortSignature = signature;
}

function buildSortToolbar(container: HTMLElement, kind: CatalogKind): HTMLDivElement {
  const toolbar = document.createElement("div");
  toolbar.className = "lx-catalog-sort";
  toolbar.dataset.lexigoSortFor = kind;

  const copy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = "Сортировка";
  const hint = document.createElement("small");
  hint.textContent = kind === "phrases"
    ? "Упорядочить фразы по английскому алфавиту"
    : "Упорядочить слова по английскому алфавиту";
  copy.append(title, hint);

  const label = document.createElement("label");
  const visuallyHidden = document.createElement("span");
  visuallyHidden.className = "lx-visually-hidden";
  visuallyHidden.textContent = "Выберите порядок сортировки";
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Сортировка каталога");
  ([
    ["default", "Порядок обучения"],
    ["az", "A–Z"],
    ["za", "Z–A"],
  ] as const).forEach(([value, text]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  });
  select.value = readSortMode(kind);
  select.addEventListener("change", () => {
    const mode = select.value as CatalogSortMode;
    window.localStorage.setItem(`${SORT_STORAGE_PREFIX}${kind}`, mode);
    container.dataset.lexigoSortMode = "";
    applyCatalogSort(container, kind, mode);
  });
  label.append(visuallyHidden, select);
  toolbar.append(copy, label);
  return toolbar;
}

function ensureSortControl(container: HTMLElement, kind: CatalogKind) {
  const parent = container.parentElement;
  if (!parent) return;

  let toolbar = parent.querySelector<HTMLDivElement>(
    `:scope > .lx-catalog-sort[data-lexigo-sort-for="${kind}"]`,
  );
  if (!toolbar) {
    toolbar = buildSortToolbar(container, kind);
    parent.insertBefore(toolbar, container);
  }
  const select = toolbar.querySelector<HTMLSelectElement>("select");
  const mode = readSortMode(kind);
  if (select && select.value !== mode) select.value = mode;
  applyCatalogSort(container, kind, mode);
}

function initializeCatalogSorting(root: ParentNode = document) {
  const phraseGrids = Array.from(root.querySelectorAll<HTMLElement>(".lx-phrase-grid"));
  if (root instanceof HTMLElement && root.matches(".lx-phrase-grid")) phraseGrids.unshift(root);
  phraseGrids.forEach((container) => ensureSortControl(container, "phrases"));

  const allItemLists = Array.from(root.querySelectorAll<HTMLElement>(".lx-all-items > div:last-child"));
  if (root instanceof HTMLElement && root.matches(".lx-all-items > div:last-child")) allItemLists.unshift(root);
  allItemLists.forEach((container) => ensureSortControl(container, "all-items"));
}

function initializeVocabularyCollections(root: ParentNode = document) {
  root.querySelectorAll(".lx-section-grid").forEach((container) => appendCollectionButtons(container, "home"));
  root.querySelectorAll(".lx-source-selector").forEach((container) => appendCollectionButtons(container, "selector"));
  root.querySelectorAll(".lx-library-grid").forEach((container) => appendCollectionButtons(container, "library"));
  updateCatalogCounts(root);
  localizeCollectionLabels(root);
  updateCollectionSelection();
}

function initializeEnhancements(root: ParentNode = document) {
  initializeStudyTabs(root);
  localizeAuthenticationError(root);
  initializeVocabularyCollections(root);
  initializeCatalogSorting(root);
}

export function EnhancedUIInteractions() {
  useEffect(() => {
    initializeEnhancements();
    window.speechSynthesis?.getVoices();

    const handleDictionaryNavigation = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(".lx-library-grid > button");
      if (!button) return;

      const target = dictionaryNavigationURL({
        collectionSource: button.dataset.lexigoCollection,
        label: button.querySelector("strong")?.textContent,
      });
      if (!target) return;

      // The themed cards are appended outside React. A client-side state transition can
      // make React reconcile a tree that WebKit has already modified, which is unstable
      // in an installed iOS PWA. Capture the click before React and load the same-origin
      // application shell normally. The query string restores the requested section.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.location.assign(target);
    };

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const collection = event.target.closest<HTMLElement>("[data-lexigo-collection]");
      if (collection?.dataset.lexigoCollection) {
        event.preventDefault();
        navigateToCollection(collection.dataset.lexigoCollection as CollectionSource);
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
      if (!(event.target instanceof HTMLButtonElement) || !event.target.matches(".lx-study-tabs button")) return;
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

    let frame = 0;
    const scheduleEnhancements = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        initializeEnhancements();
      });
    };

    const observer = new MutationObserver(scheduleEnhancements);
    document.addEventListener("click", handleDictionaryNavigation, true);
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("popstate", scheduleEnhancements);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener("click", handleDictionaryNavigation, true);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("popstate", scheduleEnhancements);
      observer.disconnect();
      document.querySelectorAll(".lx-catalog-sort").forEach((element) => element.remove());
      window.speechSynthesis?.cancel();
    };
  }, []);

  return null;
}
