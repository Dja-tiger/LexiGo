import { navigationURL, type NavigationTarget } from "./navigation";

export type DictionaryCollectionSource =
  | "daily-life"
  | "travel"
  | "data-engineering"
  | "backend";

const COLLECTION_SOURCES = new Set<DictionaryCollectionSource>([
  "daily-life",
  "travel",
  "data-engineering",
  "backend",
]);

const LABEL_TARGETS: Readonly<Record<string, NavigationTarget>> = {
  "все слова": { view: "learn", source: "mixed" },
  "существительные": { view: "learn", source: "noun" },
  "глаголы": { view: "learn", source: "verb" },
  "прилагательные": { view: "learn", source: "adjective" },
  "технические фразы": { view: "phrases" },
};

export const DICTIONARY_NAVIGATION_CASES: ReadonlyArray<{
  label: string;
  collectionSource?: DictionaryCollectionSource;
  target: NavigationTarget;
}> = [
  { label: "Все слова", target: { view: "learn", source: "mixed" } },
  { label: "Существительные", target: { view: "learn", source: "noun" } },
  { label: "Глаголы", target: { view: "learn", source: "verb" } },
  { label: "Прилагательные", target: { view: "learn", source: "adjective" } },
  { label: "Технические фразы", target: { view: "phrases" } },
  { label: "Бытовой английский", collectionSource: "daily-life", target: { view: "learn", source: "daily-life" } },
  { label: "Для путешествий", collectionSource: "travel", target: { view: "learn", source: "travel" } },
  { label: "Data Engineer", collectionSource: "data-engineering", target: { view: "learn", source: "data-engineering" } },
  { label: "Backend Development", collectionSource: "backend", target: { view: "learn", source: "backend" } },
];

function normalizeLabel(value: string | null | undefined): string {
  return value?.trim().toLocaleLowerCase("ru-RU").replace(/\s+/g, " ") ?? "";
}

export function dictionaryNavigationTarget(input: {
  label?: string | null;
  collectionSource?: string | null;
}): NavigationTarget | null {
  const collectionSource = input.collectionSource?.trim() as DictionaryCollectionSource | undefined;
  if (collectionSource && COLLECTION_SOURCES.has(collectionSource)) {
    return { view: "learn", source: collectionSource };
  }

  return LABEL_TARGETS[normalizeLabel(input.label)] ?? null;
}

export function dictionaryNavigationURL(input: {
  label?: string | null;
  collectionSource?: string | null;
}): string | null {
  const target = dictionaryNavigationTarget(input);
  return target ? navigationURL(target) : null;
}
