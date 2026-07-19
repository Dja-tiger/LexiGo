export const CATALOG_PAGE_SIZE = 48;

export type CatalogPageInfo = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type PaginatedCatalog<T> = {
  items: T[];
  info: CatalogPageInfo;
};

type CatalogPageShape = {
  count: number;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

function positiveInteger(value: unknown, fallback: number): number {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}

export function catalogPageInfo(payload: CatalogPageShape, fallbackPageSize = CATALOG_PAGE_SIZE): CatalogPageInfo {
  const pageSize = positiveInteger(payload.pageSize, fallbackPageSize);
  const total = Number.isInteger(payload.total) && Number(payload.total) >= 0 ? Number(payload.total) : payload.count;
  const totalPages = Number.isInteger(payload.totalPages) && Number(payload.totalPages) >= 0
    ? Number(payload.totalPages)
    : total === 0 ? 0 : Math.ceil(total / pageSize);
  const page = totalPages === 0 ? 1 : Math.min(positiveInteger(payload.page, 1), totalPages);
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasPrevious: typeof payload.hasPrevious === "boolean" ? payload.hasPrevious : page > 1,
    hasNext: typeof payload.hasNext === "boolean" ? payload.hasNext : totalPages > 0 && page < totalPages,
  };
}

export function paginateCatalogEntries<T>(items: readonly T[], requestedPage: number, pageSize = CATALOG_PAGE_SIZE): PaginatedCatalog<T> {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const page = totalPages === 0 ? 1 : Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    info: {
      total,
      page,
      pageSize,
      totalPages,
      hasPrevious: page > 1,
      hasNext: totalPages > 0 && page < totalPages,
    },
  };
}

export function catalogRangeText(info: CatalogPageInfo): string {
  if (info.total === 0) return "Результаты не найдены";
  const start = (info.page - 1) * info.pageSize + 1;
  const end = Math.min(info.total, start + info.pageSize - 1);
  return `Показано ${start.toLocaleString("ru-RU")}–${end.toLocaleString("ru-RU")} из ${info.total.toLocaleString("ru-RU")}`;
}
