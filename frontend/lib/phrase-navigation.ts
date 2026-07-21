import type { CatalogSort, NavigationTarget } from "./navigation";

export type PhraseCatalogFilters = {
  topic: string;
  query: string;
  sort: CatalogSort;
  page: number;
};

export function phraseCatalogFilters(target: NavigationTarget): PhraseCatalogFilters {
  return {
    topic: target.topic?.trim() || "all",
    query: target.query?.trim() || "",
    sort: target.sort ?? "default",
    page: Number.isSafeInteger(target.page) && (target.page ?? 0) > 1 ? target.page as number : 1,
  };
}

export function phraseCatalogTarget(
  filters: PhraseCatalogFilters,
  detail?: string,
): NavigationTarget {
  const normalizedTopic = filters.topic.trim();
  const normalizedQuery = filters.query.trim();
  const normalizedDetail = detail?.trim();
  return {
    view: "phrases",
    ...(normalizedTopic && normalizedTopic !== "all" ? { topic: normalizedTopic } : {}),
    ...(normalizedQuery ? { query: normalizedQuery } : {}),
    ...(filters.sort !== "default" ? { sort: filters.sort } : {}),
    ...(filters.page > 1 ? { page: filters.page } : {}),
    ...(normalizedDetail ? { detail: normalizedDetail } : {}),
  };
}
