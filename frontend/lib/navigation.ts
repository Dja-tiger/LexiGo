import { isScenarioSlug } from "./scenarios";

export type AppView = "home" | "learn" | "phrases" | "library" | "progress" | "profile" | "onboarding" | "lesson" | "scenario";

export type CatalogStatus = "new" | "learning" | "review" | "mastered";
export type CatalogSort = "default" | "az" | "za";

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
    | "backend"
    | "academic-technical-english";
  topic?: string;
  status?: CatalogStatus;
  query?: string;
  sort?: CatalogSort;
  page?: number;
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

const VIEWS = new Set<AppView>(["home", "learn", "phrases", "library", "progress", "profile", "onboarding", "lesson", "scenario"]);
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
  "academic-technical-english",
]);
const CATALOG_STATUSES = new Set<CatalogStatus>(["new", "learning", "review", "mastered"]);
const CATALOG_SORTS = new Set<CatalogSort>(["default", "az", "za"]);
const MAX_ROUTE_VALUE_LENGTH = 120;

const PRIMARY_PATHS: Record<Exclude<AppView, "lesson" | "scenario">, string> = {
  home: "/",
  learn: "/learn",
  phrases: "/phrases",
  library: "/dictionary",
  progress: "/progress",
  profile: "/profile",
  onboarding: "/onboarding",
};

export const PRIMARY_NAVIGATION: Array<{ view: AppView; label: string; shortLabel: string }> = [
  { view: "home", label: "Главная", shortLabel: "Главная" },
  { view: "learn", label: "Обучение", shortLabel: "Учить" },
  { view: "library", label: "Словарь", shortLabel: "Словарь" },
  { view: "progress", label: "Прогресс", shortLabel: "Прогресс" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized && normalized.length <= MAX_ROUTE_VALUE_LENGTH ? normalized : undefined;
}

function normalizedPage(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function normalizeNavigation(candidate: unknown): NavigationTarget | null {
  if (!isRecord(candidate)) return null;
  const value = candidate as Record<string, unknown>;
  if (typeof value.view !== "string" || !VIEWS.has(value.view as AppView)) return null;
  if (value.source !== undefined && (typeof value.source !== "string" || !SOURCES.has(value.source as NavigationSource))) {
    return null;
  }
  if (value.status !== undefined && (typeof value.status !== "string" || !CATALOG_STATUSES.has(value.status as CatalogStatus))) {
    return null;
  }
  if (value.sort !== undefined && (typeof value.sort !== "string" || !CATALOG_SORTS.has(value.sort as CatalogSort))) {
    return null;
  }
  if (value.page !== undefined && normalizedPage(value.page) === undefined) return null;
  for (const key of ["topic", "query", "detail"] as const) {
    if (value[key] !== undefined && normalizedText(value[key]) === undefined) return null;
  }

  const topic = normalizedText(value.topic);
  const query = normalizedText(value.query);
  const detail = normalizedText(value.detail);
  const page = normalizedPage(value.page);
  return {
    view: value.view as AppView,
    ...(value.source ? { source: value.source as NavigationSource } : {}),
    ...(topic ? { topic } : {}),
    ...(value.status ? { status: value.status as CatalogStatus } : {}),
    ...(query ? { query } : {}),
    ...(value.sort ? { sort: value.sort as CatalogSort } : {}),
    ...(page && page > 1 ? { page } : {}),
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

function normalizePathname(value: string): string {
  const pathname = value.trim() || "/";
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

function safeDecodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

function encodedPathSegment(value: string): string {
  const normalized = normalizedText(value);
  return normalized ? encodeURIComponent(normalized) : "";
}

function pathnameTarget(pathname: string): NavigationTarget {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") return { view: "home" };
  if (normalized === "/learn") return { view: "learn" };
  if (normalized === "/phrases") return { view: "phrases" };
  if (normalized === "/dictionary") return { view: "library" };
  if (normalized === "/progress") return { view: "progress" };
  if (normalized === "/profile") return { view: "profile" };
  if (normalized === "/onboarding") return { view: "onboarding" };
  if (normalized === "/scenarios") return { view: "scenario" };

  const phraseDetail = normalized.match(/^\/phrases\/([^/]+)$/);
  if (phraseDetail) {
    const detail = normalizedText(safeDecodePathSegment(phraseDetail[1]));
    return detail ? { view: "phrases", detail } : { view: "phrases" };
  }

  const wordDetail = normalized.match(/^\/words\/([1-9]\d*)$/);
  if (wordDetail) return { view: "library", detail: wordDetail[1] };

  const lessonDetail = normalized.match(/^\/lesson\/([^/]+)$/);
  if (lessonDetail) {
    const detail = normalizedText(safeDecodePathSegment(lessonDetail[1]));
    return { view: "lesson", ...(detail ? { detail } : {}) };
  }

  const scenarioDetail = normalized.match(/^\/scenarios\/([^/]+)$/);
  if (scenarioDetail) {
    const detail = normalizedText(safeDecodePathSegment(scenarioDetail[1]));
    return detail && isScenarioSlug(detail) ? { view: "scenario", detail } : { view: "home" };
  }

  return { view: "home" };
}

function browserPathname(): string {
  return typeof window === "undefined" ? "/" : window.location.pathname;
}

export function parseNavigation(search: string, pathname = browserPathname()): NavigationTarget {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fromPath = pathnameTarget(pathname);
  const rawView = params.get("view") as AppView | null;
  const rawSource = params.get("source") as NavigationSource | null;
  const rawStatus = params.get("status") as CatalogStatus | null;
  const rawSort = params.get("sort") as CatalogSort | null;
  const topic = normalizedText(params.get("topic")) ?? fromPath.topic;
  const query = normalizedText(params.get("query")) ?? fromPath.query;
  const detail = normalizedText(params.get("detail")) ?? fromPath.detail;
  const page = normalizedPage(params.get("page")) ?? fromPath.page;

  return {
    view: rawView && VIEWS.has(rawView) ? rawView : fromPath.view,
    ...(rawSource && SOURCES.has(rawSource) ? { source: rawSource } : fromPath.source ? { source: fromPath.source } : {}),
    ...(topic ? { topic } : {}),
    ...(rawStatus && CATALOG_STATUSES.has(rawStatus) ? { status: rawStatus } : fromPath.status ? { status: fromPath.status } : {}),
    ...(query ? { query } : {}),
    ...(rawSort && CATALOG_SORTS.has(rawSort) ? { sort: rawSort } : fromPath.sort ? { sort: fromPath.sort } : {}),
    ...(page && page > 1 ? { page } : {}),
    ...(detail ? { detail } : {}),
  };
}

export function parseNavigationLocation(location: Pick<Location, "pathname" | "search">): NavigationTarget {
  return parseNavigation(location.search, location.pathname);
}

export function routePath(target: NavigationTarget): string {
  const normalized = normalizeNavigation(target) ?? { view: "home" };
  if (normalized.view === "lesson") {
    return `/lesson/${encodedPathSegment(normalized.detail || "active")}`;
  }
  if (normalized.view === "scenario") {
    return normalized.detail && isScenarioSlug(normalized.detail)
      ? `/scenarios/${encodedPathSegment(normalized.detail)}`
      : "/scenarios";
  }
  if (normalized.view === "library" && normalized.detail && /^\d+$/.test(normalized.detail)) {
    return `/words/${normalized.detail}`;
  }
  if (normalized.view === "phrases" && normalized.detail) {
    return `/phrases/${encodedPathSegment(normalized.detail)}`;
  }
  return PRIMARY_PATHS[normalized.view];
}

export function navigationURL(target: NavigationTarget): string {
  const normalized = normalizeNavigation(target) ?? { view: "home" };
  const params = new URLSearchParams();
  if (normalized.source) params.set("source", normalized.source);
  if (normalized.topic) params.set("topic", normalized.topic);
  if (normalized.status) params.set("status", normalized.status);
  if (normalized.query) params.set("query", normalized.query);
  if (normalized.sort && normalized.sort !== "default") params.set("sort", normalized.sort);
  if (normalized.page && normalized.page > 1) params.set("page", String(normalized.page));
  const query = params.toString();
  const pathname = routePath(normalized);
  return query ? `${pathname}?${query}` : pathname;
}

export function canonicalURLFromLegacySearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!params.has("view")) return null;
  return navigationURL(parseNavigation(search, "/"));
}

export function isCanonicalRoutePath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  const scenarioMatch = /^\/scenarios\/([^/]+)$/.exec(normalized);
  return normalized === "/"
    || normalized === "/scenarios"
    || Object.values(PRIMARY_PATHS).includes(normalized)
    || /^\/phrases\/[^/]+$/.test(normalized)
    || /^\/words\/[1-9]\d*$/.test(normalized)
    || normalized === "/lesson/active"
    || Boolean(scenarioMatch && isScenarioSlug(safeDecodePathSegment(scenarioMatch[1])));
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
    case "onboarding":
      return "Первичная настройка";
    case "lesson":
      return "Урок";
    case "scenario":
      return "Сценарий";
    default:
      return "Главная";
  }
}