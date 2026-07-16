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

const VIEWS = new Set<AppView>(["home", "learn", "phrases", "library", "progress", "profile", "lesson"]);
const SOURCES = new Set<NonNullable<NavigationTarget["source"]>>([
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

export function parseNavigation(search: string): NavigationTarget {
  const params = new URLSearchParams(search);
  const rawView = params.get("view") as AppView | null;
  const rawSource = params.get("source") as NavigationTarget["source"] | null;
  const detail = params.get("detail")?.trim() || undefined;

  return {
    view: rawView && VIEWS.has(rawView) ? rawView : "home",
    ...(rawSource && SOURCES.has(rawSource) ? { source: rawSource } : {}),
    ...(detail ? { detail } : {}),
  };
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
