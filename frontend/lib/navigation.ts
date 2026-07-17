export type AppView = "home" | "learn" | "phrases" | "library" | "progress" | "profile" | "lesson";

export type NavigationTarget = {
  view: AppView;
  source?:
    | "mixed"
    | "noun"
    | "verb"
    | "adjective"
    | "phrases"
    | "daily-life"
    | "travel"
    | "data-engineering"
    | "backend";
  detail?: string;
};

type NavigationSource = NonNullable<NavigationTarget["source"]>;

export const NAVIGATION_STORAGE_KEY = "lexigo.navigation.v1";

const VIEWS = new Set<AppView>(["home", "learn", "phrases", "library", "progress", "profile", "lesson"]);
const RESTORABLE_VIEWS = new Set<AppView>(["home", "learn", "phrases", "library", "progress"]);
const SOURCES = new Set<NavigationSource>([
  "mixed",
  "noun",
  "verb",
  "adjective",
  "phrases",
  "daily-life",
  "travel",
  "data-engineering",
  "backend",
]);

export const PRIMARY_NAVIGATION: Array<{ view: AppView; label: string; shortLabel: string }> = [
  { view: "home", label: "Главная", shortLabel: "Главная" },
  { view: "learn", label: "Обучение", shortLabel: "Учить" },
  { view: "phrases", label: "Фразы", shortLabel: "Фразы" },
  { view: "library", label: "Словарь", shortLabel: "Словарь" },
  { view: "progress", label: "Прогресс", shortLabel: "Прогресс" },
];

function normalizeNavigation(candidate: unknown): NavigationTarget | null {
  if (!candidate || typeof candidate !== "object") return null;
  const value = candidate as { view?: unknown; source?: unknown; detail?: unknown };
  if (typeof value.view !== "string" || !VIEWS.has(value.view as AppView)) return null;
  if (value.source !== undefined && (typeof value.source !== "string" || !SOURCES.has(value.source as NavigationSource))) {
    return null;
  }
  if (value.detail !== undefined && typeof value.detail !== "string") return null;

  const detail = typeof value.detail === "string" ? value.detail.trim() || undefined : undefined;
  return {
    view: value.view as AppView,
    ...(value.source ? { source: value.source as NavigationSource } : {}),
    ...(detail ? { detail } : {}),
  };
}

export function parseNavigation(search: string): NavigationTarget {
  const params = new URLSearchParams(search);
  const rawView = params.get("view") as AppView | null;
  const rawSource = params.get("source") as NavigationSource | null;
  const detail = params.get("detail")?.trim() || undefined;

  return {
    view: rawView && VIEWS.has(rawView) ? rawView : "home",
    ...(rawSource && SOURCES.has(rawSource) ? { source: rawSource } : {}),
    ...(detail ? { detail } : {}),
  };
}

export function parseStoredNavigation(raw: string | null): NavigationTarget | null {
  if (!raw) return null;
  try {
    const target = normalizeNavigation(JSON.parse(raw));
    return target && RESTORABLE_VIEWS.has(target.view) ? target : null;
  } catch {
    return null;
  }
}

export function isRestorableNavigation(target: NavigationTarget): boolean {
  return RESTORABLE_VIEWS.has(target.view);
}

export function navigationURL(target: NavigationTarget): string {
  const params = new URLSearchParams();
  if (target.view !== "home") params.set("view", target.view);
  if (target.source) params.set("source", target.source);
  if (target.detail) params.set("detail", target.detail);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function viewTitle(view: AppView): string {
  switch (view) {
    case "learn":
      return "Обучение";
    case "phrases":
      return "Технические фразы";
    case "library":
      return "Словарь";
    case "progress":
      return "Прогресс";
    case "profile":
      return "Профиль";
    case "lesson":
      return "Урок";
    default:
      return "Главная";
  }
}
