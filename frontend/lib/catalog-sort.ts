export type CatalogSortMode = "default" | "az" | "za";

export function sortCatalogEntries<T>(
  items: readonly T[],
  getLabel: (item: T) => string,
  getOriginalIndex: (item: T) => number,
  mode: CatalogSortMode,
): T[] {
  return [...items].sort((left, right) => {
    const originalOrder = getOriginalIndex(left) - getOriginalIndex(right);
    if (mode === "default") return originalOrder;

    const comparison = getLabel(left).localeCompare(getLabel(right), "en", {
      sensitivity: "base",
      numeric: true,
    });
    return (mode === "az" ? comparison : -comparison) || originalOrder;
  });
}
