export type CatalogSource =
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

export type CatalogMetadata = {
  catalogVersion: string;
  updatedAt: string;
  totals: { items: number; words: number; phrases: number };
  sources: {
    mixed: number;
    noun: number;
    verb: number;
    adjective: number;
    phrases: number;
    dailyLife: number;
    travel: number;
    dataEngineering: number;
    backend: number;
    academicTechnicalEnglish: number;
  };
  topics: Array<{ topic: string; count: number; words?: number; phrases?: number }>;
};

export type CatalogMetadataStatus = "loading" | "ready" | "error";

export function catalogSourceCount(metadata: CatalogMetadata, source: CatalogSource): number {
  if (source === "daily-life") return metadata.sources.dailyLife;
  if (source === "data-engineering") return metadata.sources.dataEngineering;
  if (source === "academic-technical-english") return metadata.sources.academicTechnicalEnglish;
  return metadata.sources[source];
}

export function russianCount(value: number, forms: readonly [string, string, string]): string {
  const absolute = Math.abs(value) % 100;
  const last = absolute % 10;
  const form = absolute > 10 && absolute < 20 ? forms[2] : last === 1 ? forms[0] : last >= 2 && last <= 4 ? forms[1] : forms[2];
  return `${value.toLocaleString("ru-RU")} ${form}`;
}

export function catalogCountText(
  metadata: CatalogMetadata | null,
  status: CatalogMetadataStatus,
  source: CatalogSource,
  forms: readonly [string, string, string],
): string {
  if (status === "loading") return "Загрузка…";
  if (status === "error" || !metadata) return "Количество недоступно";
  return russianCount(catalogSourceCount(metadata, source), forms);
}

export function catalogSummaryText(metadata: CatalogMetadata | null, status: CatalogMetadataStatus): string {
  if (status === "loading") return "Загружаем актуальный состав каталога…";
  if (status === "error" || !metadata) return "Не удалось загрузить состав каталога. Повторите попытку позже.";
  return `${russianCount(metadata.totals.words, ["слово", "слова", "слов"])} и ${russianCount(metadata.totals.phrases, ["техническая фраза", "технические фразы", "технических фраз"])} с общей системой повторений.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

export function isCatalogMetadataPayload(value: unknown): value is CatalogMetadata {
  if (!isRecord(value) || typeof value.catalogVersion !== "string" || !Number.isFinite(Date.parse(String(value.updatedAt)))) return false;
  if (!isRecord(value.totals) || !isRecord(value.sources) || !Array.isArray(value.topics)) return false;

  const totals = value.totals;
  const sources = value.sources;
  const topics = value.topics;
  if (![totals.items, totals.words, totals.phrases].every(isNonNegativeInteger)) return false;

  const sourceKeys: Array<keyof CatalogMetadata["sources"]> = [
    "mixed",
    "noun",
    "verb",
    "adjective",
    "phrases",
    "dailyLife",
    "travel",
    "dataEngineering",
    "backend",
    "academicTechnicalEnglish",
  ];
  if (!sourceKeys.every((key) => isNonNegativeInteger(sources[key]))) return false;
  return topics.every((entry) => isRecord(entry)
    && typeof entry.topic === "string"
    && isNonNegativeInteger(entry.count)
    && (entry.words === undefined || isNonNegativeInteger(entry.words))
    && (entry.phrases === undefined || isNonNegativeInteger(entry.phrases)));
}
