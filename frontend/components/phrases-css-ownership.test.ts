import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layoutUrl = new URL("../app/layout.tsx", import.meta.url);
const phrasesCssUrl = new URL("../app/phrases.css", import.meta.url);
const compatibilityCssUrl = new URL("../app/phrases-compat.css", import.meta.url);

const layout = readFileSync(layoutUrl, "utf8");
const phrasesCss = readFileSync(phrasesCssUrl, "utf8");

function occurrences(source: string, marker: string): number {
  return source.split(marker).length - 1;
}

describe("Phrases CSS ownership", () => {
  it("keeps one canonical stylesheet after the shared catalog base", () => {
    expect(layout).toContain('import "./catalog-enhancements.css";');
    expect(layout).toContain('import "./phrases.css";');
    expect(layout).not.toContain('import "./phrases-compat.css";');
    expect(occurrences(layout, 'import "./phrases.css";')).toBe(1);
    expect(layout.indexOf('import "./catalog-enhancements.css";')).toBeLessThan(
      layout.indexOf('import "./phrases.css";'),
    );
    expect(existsSync(compatibilityCssUrl)).toBe(false);
  });

  it("owns the route-scoped computed cascade in phrases.css", () => {
    const canonicalMarker = "/* Issue #70: canonical Phrases computed-cascade ownership. */";
    const catalogSelector = '.lx-app[data-route-client-island="phrases"] .lx-catalog-sort {';
    const selectedTopicSelector =
      '.lx-app[data-route-client-island="phrases"] .lx-phrases-topic-chips button[aria-pressed="true"] {';
    const resultsSelector = '.lx-app[data-route-client-island="phrases"] .lx-phrases-results {';

    expect(occurrences(phrasesCss, canonicalMarker)).toBe(1);
    expect(occurrences(phrasesCss, catalogSelector)).toBe(1);
    expect(occurrences(phrasesCss, selectedTopicSelector)).toBe(2);
    expect(occurrences(phrasesCss, resultsSelector)).toBe(1);
    expect(phrasesCss).not.toContain(
      "/* Issue #199 compatibility overrides verified against the full browser/axe matrix. */",
    );
  });

  it("preserves the exact catalog, contrast, spacing and forced-colors values", () => {
    const requiredDeclarations = [
      "border-color: var(--lx-phrases-border);",
      "color: var(--ak-color-text-main);",
      "background: var(--ak-color-surface);",
      "box-shadow: var(--ak-elevation-1);",
      "backdrop-filter: none;",
      "color: var(--ak-color-text-muted);",
      "color: #10211d;",
      "font-weight: 700;",
      "padding-top: 24px;",
      "@media (forced-colors: active)",
      "border: 1px solid CanvasText;",
      "color: CanvasText;",
      "background: Canvas;",
      "box-shadow: none;",
      "color: HighlightText;",
      "background: Highlight;",
    ] as const;

    for (const declaration of requiredDeclarations) {
      expect(phrasesCss, `canonical declaration ${declaration}`).toContain(declaration);
    }
  });
});
