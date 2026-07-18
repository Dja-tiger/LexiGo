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
type NavigationStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type PersistedNavigation = {
  version: 2;
  target: NavigationTarget;
};

export const NAVIGATION_STORAGE_VERSION = 2 as const;
export const NAVIGATION_STORAGE_KEY = "lexigo.navigation.v2";
export const LEGACY_NAVIGATION_STORAGE_KEY = "lexigo.navigation.v1";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeNavigation(candidate: unknown): NavigationTarget | null {
  if (!isRecord(candidate)) return null;
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

function parseJSON(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function restorableTarget(candidate: unknown): NavigationTarget | null {
  const target = normalizeNavigation(candidate);
  return target && RESTORABLE_VIEWS.has(target.view) ? target : null;
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

export function serializeStoredNavigation(target: NavigationTarget): string {
  if (!isRestorableNavigation(target)) {
    throw new TypeError(`View ${target.view} cannot be persisted`);
  }
  const envelope: PersistedNavigation = {
    version: NAVIGATION_STORAGE_VERSION,
    target,
  };
  return JSON.stringify(envelope);
}

export function parseStoredNavigation(raw: string | null): NavigationTarget | null {
  const value = parseJSON(raw);
  if (!isRecord(value) || value.version !== NAVIGATION_STORAGE_VERSION) return null;
  return restorableTarget(value.target);
}

export function parseLegacyStoredNavigation(raw: string | null): NavigationTarget | null {
  return restorableTarget(parseJSON(raw));
}

export function readPersistedNavigation(storage: NavigationStorage): NavigationTarget | null {
  try {
    const currentRaw = storage.getItem(NAVIGATION_STORAGE_KEY);
    if (currentRaw !== null) {
      const current = parseStoredNavigation(currentRaw);
      if (current) return current;
      storage.removeItem(NAVIGATION_STORAGE_KEY);
    }

    const legacyRaw = storage.getItem(LEGACY_NAVIGATION_STORAGE_KEY);
    if (legacyRaw === null) return null;
    const legacy = parseLegacyStoredNavigation(legacyRaw);
    storage.removeItem(LEGACY_NAVIGATION_STORAGE_KEY);
    if (!legacy) return null;
    storage.setItem(NAVIGATION_STORAGE_KEY, serializeStoredNavigation(legacy));
    return legacy;
  } catch {
    return null;
  }
}

export function writePersistedNavigation(storage: NavigationStorage, target: NavigationTarget): void {
  try {
    if (!isRestorableNavigation(target)) {
      storage.removeItem(NAVIGATION_STORAGE_KEY);
      return;
    }
    storage.setItem(NAVIGATION_STORAGE_KEY, serializeStoredNavigation(target));
    storage.removeItem(LEGACY_NAVIGATION_STORAGE_KEY);
  } catch {
    // Navigation remains usable when private mode or browser policy blocks storage.
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
