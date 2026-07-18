from pathlib import Path
import re


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one marker, found {count}: {old[:80]!r}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


component = Path("frontend/components/lexigo-premium-app.tsx")
text = component.read_text(encoding="utf-8")
text = text.replace(
    'import { sortCatalogEntries, type CatalogSortMode } from "../lib/catalog-sort";\n',
    'import { sortCatalogEntries, type CatalogSortMode } from "../lib/catalog-sort";\n'
    'import { catalogCountText, catalogSummaryText, type CatalogMetadata, type CatalogMetadataStatus } from "../lib/catalog-metadata";\n',
    1,
)
text = text.replace('  count: number;\n', '', 1)
text = text.replace('const WORD_CATALOG_COUNT = 799;\n', '', 1)
for value in ('    count: 55,\n',):
    text = text.replace(value, '')
text = text.replace('  count: number;\n}> = [', '}> = [', 1)
text = re.sub(r', count: WORD_CATALOG_COUNT \+ DEFAULT_PHRASE_CATALOG\.length', '', text, count=1)
text = re.sub(r', count: 383', '', text, count=1)
text = re.sub(r', count: 179', '', text, count=1)
text = re.sub(r', count: 193', '', text, count=1)
text = re.sub(r', count: DEFAULT_PHRASE_CATALOG\.length', '', text, count=1)
old_collection = '''function CollectionCard({
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
  const hint = variant === "home" ? `${definition.count} слов и терминов` : definition.description;
'''
new_collection = '''function CollectionCard({
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
  const hint = variant === "home" ? countText : definition.description;
'''
if text.count(old_collection) != 1:
    raise SystemExit("CollectionCard marker mismatch")
text = text.replace(old_collection, new_collection, 1)
text = text.replace('{variant === "selector" ? <b>{definition.count}</b>', '{variant === "selector" ? <b>{countText}</b>', 1)
state_marker = '  const [progress, setProgress] = useState<ProgressSummary | null>(null);\n'
if text.count(state_marker) != 1:
    raise SystemExit("progress state marker mismatch")
text = text.replace(state_marker, state_marker + '  const [catalogMetadata, setCatalogMetadata] = useState<CatalogMetadata | null>(null);\n  const [catalogMetadataStatus, setCatalogMetadataStatus] = useState<CatalogMetadataStatus>("loading");\n', 1)
effect_marker = '  useEffect(() => {\n    const applyNavigation = (next: NavigationTarget) => {\n'
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
if text.count(effect_marker) != 1:
    raise SystemExit("effect marker mismatch")
text = text.replace(effect_marker, metadata_effect + effect_marker, 1)
text = text.replace(
    '  const overallPercent = progress && progress.totalWords + progress.totalPhrases > 0\n    ? Math.round(((progress.masteredWords + progress.masteredPhrases) / (progress.totalWords + progress.totalPhrases)) * 100)\n    : 0;',
    '  const overallPercent = progress && catalogMetadata && catalogMetadata.totals.items > 0\n    ? Math.round(((progress.masteredWords + progress.masteredPhrases) / catalogMetadata.totals.items) * 100)\n    : 0;',
    1,
)
# Source counters on Home, Learn and Library.
text = text.replace('{option.count} {option.value === "phrases" ? "фразы" : "слов"}', '{catalogCountText(catalogMetadata, catalogMetadataStatus, option.value, option.value === "phrases" ? ["фраза", "фразы", "фраз"] : ["слово", "слова", "слов"])}')
text = text.replace('<b>{option.count}</b>', '<b>{catalogCountText(catalogMetadata, catalogMetadataStatus, option.value, ["элемент", "элемента", "элементов"])}</b>')
# Collection cards in all three surfaces.
text = text.replace('              variant="home"\n              onSelect=', '              variant="home"\n              countText={catalogCountText(catalogMetadata, catalogMetadataStatus, definition.source, ["слово и термин", "слова и термина", "слов и терминов"])}\n              onSelect=', 1)
text = text.replace('                  variant="selector"\n                  selected=', '                  variant="selector"\n                  countText={catalogCountText(catalogMetadata, catalogMetadataStatus, definition.source, ["элемент", "элемента", "элементов"])}\n                  selected=', 1)
text = text.replace('              variant="library"\n              onSelect=', '              variant="library"\n              countText={catalogCountText(catalogMetadata, catalogMetadataStatus, definition.source, ["слово и термин", "слова и термина", "слов и терминов"])}\n              onSelect=', 1)
text = text.replace('{progress?.totalWords ?? WORD_CATALOG_COUNT} слов и {progress?.totalPhrases ?? DEFAULT_PHRASE_CATALOG.length} технических фраз с общей системой повторений.', '{catalogSummaryText(catalogMetadata, catalogMetadataStatus)}', 1)
text = text.replace('<small>из {progress.totalWords}</small>', '<small>{catalogMetadataStatus === "ready" && catalogMetadata ? `из ${catalogMetadata.totals.words.toLocaleString("ru-RU")}` : catalogMetadataStatus === "loading" ? "каталог загружается" : "total недоступен"}</small>', 1)
text = text.replace('<small>из {progress.totalPhrases}</small>', '<small>{catalogMetadataStatus === "ready" && catalogMetadata ? `из ${catalogMetadata.totals.phrases.toLocaleString("ru-RU")}` : catalogMetadataStatus === "loading" ? "каталог загружается" : "total недоступен"}</small>', 1)
text = text.replace('Incident updates, architecture review, data engineering, performance и release communication.</p>', 'Incident updates, architecture review, data engineering, performance и release communication. {catalogCountText(catalogMetadata, catalogMetadataStatus, "phrases", ["фраза", "фразы", "фраз"])} в каталоге.</p>', 1)
# Ensure no product count properties remain.
for forbidden in ('WORD_CATALOG_COUNT', 'option.count', 'definition.count', 'count: 383', 'count: 179', 'count: 193', 'count: 55'):
    if forbidden in text:
        raise SystemExit(f"hardcoded catalog counter remains: {forbidden}")
component.write_text(text, encoding="utf-8")

# Public metadata mocks for all browser suites that own API routing.
metadata_response = '''    if (path === "/api/v1/catalog/metadata") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        catalogVersion: "sha256:e2e-catalog", updatedAt: "2026-07-18T00:00:00Z",
        totals: { items: 6, words: 3, phrases: 3 },
        sources: { mixed: 6, noun: 1, verb: 1, adjective: 1, phrases: 3, dailyLife: 1, travel: 1, dataEngineering: 1, backend: 1 },
        topics: [{ topic: "Backend", count: 2 }],
      }) });
      return;
    }
'''
for path in ("frontend/e2e/ui-ownership.spec.ts", "frontend/e2e/lesson-flow.spec.ts", "frontend/e2e/dictionary-pwa.spec.ts"):
    file = Path(path)
    source = file.read_text(encoding="utf-8")
    if '/api/v1/catalog/metadata' in source:
        continue
    marker = '    if (path === "/api/v1/auth/refresh") {'
    if marker not in source:
        raise SystemExit(f"{path}: API marker missing")
    file.write_text(source.replace(marker, metadata_response + marker, 1), encoding="utf-8")

ui = Path("frontend/e2e/ui-ownership.spec.ts")
ui_text = ui.read_text(encoding="utf-8")
if 'catalog counters come from public metadata' not in ui_text:
    ui_text += '''

test("catalog counters come from public metadata without DOM rewriting", async ({ page }) => {
  await page.goto("/?view=library");
  await expect(page.getByText("3 слова и 3 технические фразы с общей системой повторений.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("799");
  await expect(page.locator("body")).not.toContainText("579");
  const version = await page.evaluate(async () => (await fetch("/api/v1/catalog/metadata")).json().then((value) => value.catalogVersion));
  expect(version).toBe("sha256:e2e-catalog");
});
'''
ui.write_text(ui_text, encoding="utf-8")

# OpenAPI 0.7 catalog metadata contract.
openapi = Path("api/openapi.yaml")
yaml = openapi.read_text(encoding="utf-8")
yaml = yaml.replace('  version: 0.6.0\n', '  version: 0.7.0\n', 1)
path_marker = '  /api/v1/auth/register:\n'
path_contract = '''  /api/v1/catalog/metadata:
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
              schema:
                type: string
            Cache-Control:
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/CatalogMetadata"
        "304":
          description: Версия каталога не изменилась.
'''
if path_marker not in yaml:
    raise SystemExit("OpenAPI paths marker missing")
yaml = yaml.replace(path_marker, path_contract + path_marker, 1)
schema_marker = '  schemas:\n'
schema_contract = '''  schemas:
    CatalogMetadata:
      type: object
      required: [catalogVersion, updatedAt, totals, sources, topics]
      properties:
        catalogVersion:
          type: string
        updatedAt:
          type: string
          format: date-time
        totals:
          $ref: "#/components/schemas/CatalogTotals"
        sources:
          $ref: "#/components/schemas/CatalogSourceTotals"
        topics:
          type: array
          items:
            $ref: "#/components/schemas/CatalogTopicTotal"
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
'''
if yaml.count(schema_marker) != 1:
    raise SystemExit("OpenAPI schemas marker mismatch")
yaml = yaml.replace(schema_marker, schema_contract, 1)
openapi.write_text(yaml, encoding="utf-8")

Path("docs/catalog-metadata.md").write_text('''# Catalog metadata\n\n`GET /api/v1/catalog/metadata` is the single source of truth for product catalog counters. It is public because Home, Learning, Phrases and Dictionary render before authentication. The repository reads totals and topics in one read-only repeatable-read snapshot.\n\n`catalogVersion` is a SHA-256 digest of the snapshot timestamp and all aggregates. The HTTP handler exposes it as `ETag`, accepts weak or strong `If-None-Match`, and returns `304` when unchanged. Clients must show loading or explicit unavailable copy; they must not fall back to embedded catalog lengths or historical constants.\n\nThe endpoint aggregates by `kind`, supported lesson sources and topic. Adding or updating catalog rows changes the snapshot automatically without a frontend release. User progress remains user-specific; catalog capacity always comes from metadata.\n''', encoding="utf-8")
