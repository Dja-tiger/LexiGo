from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one marker, found {count}")
    return text.replace(old, new, 1)


component_path = Path("frontend/components/lexigo-premium-app.tsx")
text = component_path.read_text(encoding="utf-8")

text = replace_once(
    text,
    'import { sortCatalogEntries, type CatalogSortMode } from "../lib/catalog-sort";\n',
    'import { sortCatalogEntries, type CatalogSortMode } from "../lib/catalog-sort";\n'
    'import { catalogCountText, catalogSummaryText, type CatalogMetadata, type CatalogMetadataStatus } from "../lib/catalog-metadata";\n',
    "catalog metadata import",
)
text = replace_once(
    text,
    '''type CollectionDefinition = {
  source: CollectionSource;
  label: string;
  shortLabel: string;
  description: string;
  symbol: string;
  count: number;
};''',
    '''type CollectionDefinition = {
  source: CollectionSource;
  label: string;
  shortLabel: string;
  description: string;
  symbol: string;
};''',
    "collection count type",
)
text = replace_once(text, 'const WORD_CATALOG_COUNT = 799;\n', '', "word total constant")
text = re.sub(r'^\s+count: 55,\n', '', text, flags=re.MULTILINE)
text = replace_once(
    text,
    '''const SOURCE_OPTIONS: Array<{
  value: LessonSource;
  label: string;
  hint: string;
  icon: IconName;
  count: number;
}> = [''',
    '''const SOURCE_OPTIONS: Array<{
  value: LessonSource;
  label: string;
  hint: string;
  icon: IconName;
}> = [''',
    "source option count type",
)
for old in (
    ', count: WORD_CATALOG_COUNT + DEFAULT_PHRASE_CATALOG.length',
    ', count: 383',
    ', count: 179',
    ', count: 193',
    ', count: DEFAULT_PHRASE_CATALOG.length',
):
    text = replace_once(text, old, '', f"source literal {old}")

text = replace_once(
    text,
    '''function CollectionCard({
  definition,
  variant,
  selected = false,
  onSelect,
}: {
  definition: CollectionDefinition;
  variant: "home" | "selector" | "library";
  selected?: boolean;
  onSelect: () => void;
}) {
  const title = variant === "home" ? definition.shortLabel : definition.label;
  const hint = variant === "home" ? `${definition.count} слов и терминов` : definition.description;''',
    '''function CollectionCard({
  definition,
  variant,
  countText,
  selected = false,
  onSelect,
}: {
  definition: CollectionDefinition;
  variant: "home" | "selector" | "library";
  countText: string;
  selected?: boolean;
  onSelect: () => void;
}) {
  const title = variant === "home" ? definition.shortLabel : definition.label;
  const hint = variant === "home" ? countText : definition.description;''',
    "CollectionCard signature",
)
text = replace_once(
    text,
    '{variant === "selector" ? <b>{definition.count}</b> : <span className="lx-themed-arrow" aria-hidden="true">→</span>}',
    '{variant === "selector" ? <b data-catalog-count-state={countText === "Загрузка…" ? "loading" : undefined}>{countText}</b> : <span className="lx-themed-arrow" aria-hidden="true">→</span>}',
    "CollectionCard count output",
)

text = replace_once(
    text,
    '  const [progress, setProgress] = useState<ProgressSummary | null>(null);\n',
    '  const [progress, setProgress] = useState<ProgressSummary | null>(null);\n'
    '  const [catalogMetadata, setCatalogMetadata] = useState<CatalogMetadata | null>(null);\n'
    '  const [catalogMetadataStatus, setCatalogMetadataStatus] = useState<CatalogMetadataStatus>("loading");\n',
    "metadata state",
)
metadata_effect = '''  useEffect(() => {
    const controller = new AbortController();
    setCatalogMetadataStatus("loading");
    requestJSON<CatalogMetadata>("/api/v1/catalog/metadata", { signal: controller.signal })
      .then((metadata) => {
        setCatalogMetadata(metadata);
        setCatalogMetadataStatus("ready");
      })
      .catch((metadataError) => {
        if (controller.signal.aborted) return;
        console.error("catalog metadata request failed", metadataError);
        setCatalogMetadata(null);
        setCatalogMetadataStatus("error");
      });
    return () => controller.abort();
  }, []);

'''
text = replace_once(
    text,
    '  useEffect(() => {\n    const applyNavigation = (next: NavigationTarget) => {\n',
    metadata_effect + '  useEffect(() => {\n    const applyNavigation = (next: NavigationTarget) => {\n',
    "metadata effect",
)
text = replace_once(
    text,
    '''  const overallPercent = progress && progress.totalWords + progress.totalPhrases > 0
    ? Math.round(((progress.masteredWords + progress.masteredPhrases) / (progress.totalWords + progress.totalPhrases)) * 100)
    : 0;''',
    '''  const overallPercent = progress && catalogMetadata && catalogMetadata.totals.items > 0
    ? Math.round(((progress.masteredWords + progress.masteredPhrases) / catalogMetadata.totals.items) * 100)
    : 0;''',
    "overall progress denominator",
)

source_count_expression = '''catalogCountText(
                      catalogMetadata,
                      catalogMetadataStatus,
                      option.value,
                      option.value === "mixed"
                        ? ["элемент", "элемента", "элементов"]
                        : option.value === "phrases"
                          ? ["фраза", "фразы", "фраз"]
                          : ["слово", "слова", "слов"],
                    )'''
text = text.replace(
    '{option.count} {option.value === "phrases" ? "фразы" : "слов"}',
    '{' + source_count_expression + '}',
)
text = text.replace(
    '<b>{option.count}</b>',
    '<b data-catalog-count-state={catalogMetadataStatus}>{catalogCountText(catalogMetadata, catalogMetadataStatus, option.value, ["элемент", "элемента", "элементов"])}</b>',
)

for variant, forms in (
    ("home", '["слово и термин", "слова и термина", "слов и терминов"]'),
    ("selector", '["элемент", "элемента", "элементов"]'),
    ("library", '["слово и термин", "слова и термина", "слов и терминов"]'),
):
    marker = f'              variant="{variant}"\n'
    if variant == "selector":
        marker = f'                  variant="{variant}"\n'
    count_text = f'              countText={{catalogCountText(catalogMetadata, catalogMetadataStatus, definition.source, {forms})}}\n'
    if variant == "selector":
        count_text = f'                  countText={{catalogCountText(catalogMetadata, catalogMetadataStatus, definition.source, {forms})}}\n'
    text = replace_once(text, marker, marker + count_text, f"{variant} collection count")

text = replace_once(
    text,
    '{progress?.totalWords ?? WORD_CATALOG_COUNT} слов и {progress?.totalPhrases ?? DEFAULT_PHRASE_CATALOG.length} технических фраз с общей системой повторений.',
    '{catalogSummaryText(catalogMetadata, catalogMetadataStatus)}',
    "library summary",
)
text = replace_once(
    text,
    '<small>из {progress.totalWords}</small>',
    '<small>{catalogMetadataStatus === "ready" && catalogMetadata ? `из ${catalogMetadata.totals.words.toLocaleString("ru-RU")}` : catalogMetadataStatus === "loading" ? "каталог загружается" : "total недоступен"}</small>',
    "mastered word total",
)
text = replace_once(
    text,
    '<small>из {progress.totalPhrases}</small>',
    '<small>{catalogMetadataStatus === "ready" && catalogMetadata ? `из ${catalogMetadata.totals.phrases.toLocaleString("ru-RU")}` : catalogMetadataStatus === "loading" ? "каталог загружается" : "total недоступен"}</small>',
    "mastered phrase total",
)
text = replace_once(
    text,
    'Incident updates, architecture review, data engineering, performance и release communication.</p>',
    'Incident updates, architecture review, data engineering, performance и release communication. <span data-catalog-count-state={catalogMetadataStatus}>{catalogCountText(catalogMetadata, catalogMetadataStatus, "phrases", ["фраза", "фразы", "фраз"])} в каталоге.</span></p>',
    "phrase total copy",
)

for forbidden in (
    'WORD_CATALOG_COUNT',
    'option.count',
    'definition.count',
    'count: 383',
    'count: 179',
    'count: 193',
    'count: 55',
    'progress.totalWords + progress.totalPhrases',
):
    if forbidden in text:
        raise SystemExit(f"hardcoded catalog counter remains: {forbidden}")
component_path.write_text(text, encoding="utf-8")

metadata_mock = '''    if (path === "/api/v1/catalog/metadata") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        catalogVersion: "sha256:e2e-catalog",
        updatedAt: "2026-07-18T00:00:00Z",
        totals: { items: 6, words: 3, phrases: 3 },
        sources: { mixed: 6, noun: 1, verb: 1, adjective: 1, phrases: 3, dailyLife: 1, travel: 1, dataEngineering: 1, backend: 1 },
        topics: [{ topic: "Backend", count: 2 }],
      }) });
      return;
    }
'''
for spec_path in (
    "frontend/e2e/ui-ownership.spec.ts",
    "frontend/e2e/lesson-flow.spec.ts",
    "frontend/e2e/dictionary-pwa.spec.ts",
):
    spec = Path(spec_path)
    source = spec.read_text(encoding="utf-8")
    if '/api/v1/catalog/metadata' not in source:
        marker = '    if (path === '
        index = source.find(marker)
        if index < 0:
            raise SystemExit(f"{spec_path}: API route marker missing")
        source = source[:index] + metadata_mock + source[index:]
    spec.write_text(source, encoding="utf-8")

ui_path = Path("frontend/e2e/ui-ownership.spec.ts")
ui = ui_path.read_text(encoding="utf-8")
if 'catalog counters come from public metadata' not in ui:
    ui += '''

test("catalog counters come from public metadata without DOM rewriting", async ({ page }) => {
  await page.goto("/?view=library");
  await expect(page.getByText("3 слова и 3 технические фразы с общей системой повторений.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("799");
  await expect(page.locator("body")).not.toContainText("579");
});
'''
ui_path.write_text(ui, encoding="utf-8")

Path("frontend/components/catalog-count-source.test.ts").write_text('''import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./lexigo-premium-app.tsx", import.meta.url), "utf8");

describe("catalog count ownership", () => {
  it("does not contain historical product totals", () => {
    for (const forbidden of ["WORD_CATALOG_COUNT", "count: 799", "count: 579", "count: 383", "count: 179", "count: 193", "count: 55", "option.count", "definition.count"]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("loads public catalog metadata and never mutates count text through the DOM", () => {
    expect(source).toContain("/api/v1/catalog/metadata");
    expect(source).not.toContain("textContent");
    expect(source).not.toMatch(/replace\\([^)]*\\d/);
  });
});
''', encoding="utf-8")

openapi = Path("api/openapi.yaml")
yaml = openapi.read_text(encoding="utf-8")
yaml = replace_once(yaml, '  version: 0.6.0\n', '  version: 0.7.0\n', "OpenAPI version")
yaml = replace_once(
    yaml,
    '  /api/v1/auth/register:\n',
    '''  /api/v1/catalog/metadata:
    get:
      operationId: catalogMetadata
      tags: [catalog]
      summary: Публичные агрегаты и версия каталога.
      parameters:
        - in: header
          name: If-None-Match
          schema:
            type: string
      responses:
        "200":
          description: Актуальный snapshot каталога.
          headers:
            ETag:
              schema: { type: string }
            Cache-Control:
              schema: { type: string }
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/CatalogMetadata"
        "304":
          description: Версия каталога не изменилась.
  /api/v1/auth/register:
''',
    "OpenAPI metadata path",
)
yaml = replace_once(
    yaml,
    '  schemas:\n',
    '''  schemas:
    CatalogMetadata:
      type: object
      required: [catalogVersion, updatedAt, totals, sources, topics]
      properties:
        catalogVersion: { type: string }
        updatedAt: { type: string, format: date-time }
        totals: { $ref: "#/components/schemas/CatalogTotals" }
        sources: { $ref: "#/components/schemas/CatalogSourceTotals" }
        topics:
          type: array
          items: { $ref: "#/components/schemas/CatalogTopicTotal" }
    CatalogTotals:
      type: object
      required: [items, words, phrases]
      properties:
        items: { type: integer, minimum: 0 }
        words: { type: integer, minimum: 0 }
        phrases: { type: integer, minimum: 0 }
    CatalogSourceTotals:
      type: object
      required: [mixed, noun, verb, adjective, phrases, dailyLife, travel, dataEngineering, backend]
      properties:
        mixed: { type: integer, minimum: 0 }
        noun: { type: integer, minimum: 0 }
        verb: { type: integer, minimum: 0 }
        adjective: { type: integer, minimum: 0 }
        phrases: { type: integer, minimum: 0 }
        dailyLife: { type: integer, minimum: 0 }
        travel: { type: integer, minimum: 0 }
        dataEngineering: { type: integer, minimum: 0 }
        backend: { type: integer, minimum: 0 }
    CatalogTopicTotal:
      type: object
      required: [topic, count]
      properties:
        topic: { type: string }
        count: { type: integer, minimum: 0 }
''',
    "OpenAPI metadata schemas",
)
openapi.write_text(yaml, encoding="utf-8")
