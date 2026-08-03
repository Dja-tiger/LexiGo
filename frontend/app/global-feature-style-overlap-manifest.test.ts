import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

type ConflictClassification = "protected" | "intentional" | "requires-proof";

type ManifestItem = Readonly<{
  id: string;
  classification: ConflictClassification;
  evidence: string;
}>;

type ExpectedGroup = Readonly<{
  classification: ConflictClassification;
  count: number;
}>;

const manifestUrl = new URL("./global-feature-style-overlap-manifest.json", import.meta.url);
const rawManifest: unknown = JSON.parse(readFileSync(manifestUrl, "utf8"));

const EXPECTED_GROUPS = new Map<string, ExpectedGroup>([
  [
    "account-security.css -> adaptive-knowledge-coach-home.css",
    { classification: "requires-proof", count: 1 },
  ],
  [
    "adaptive-navigation.css -> system-states.css",
    { classification: "requires-proof", count: 1 },
  ],
  [
    "premium-ui.css -> mobile-pwa-fixes.css",
    { classification: "requires-proof", count: 10 },
  ],
  [
    "mobile-pwa-fixes.css -> adaptive-navigation.css",
    { classification: "requires-proof", count: 6 },
  ],
  [
    "premium-ui.css -> adaptive-navigation.css",
    { classification: "requires-proof", count: 21 },
  ],
  [
    "scenario-catalog.css -> learning-section-switch.css",
    { classification: "requires-proof", count: 8 },
  ],
  [
    "adaptive-lesson-composer.css -> adaptive-lesson-composer-accessibility.css",
    { classification: "intentional", count: 5 },
  ],
  ["premium-ui.css -> phrases.css", { classification: "requires-proof", count: 4 }],
  [
    "progress-evidence.css -> progress-evidence-accessibility.css",
    { classification: "intentional", count: 4 },
  ],
  [
    "adaptive-knowledge-coach-home.css -> adaptive-knowledge-coach-accessibility.css",
    { classification: "intentional", count: 1 },
  ],
  [
    "scenario-lessons.css -> scenario-lessons-accessibility.css",
    { classification: "intentional", count: 40 },
  ],
  [
    "premium-ui.css -> adaptive-layout.css",
    { classification: "requires-proof", count: 6 },
  ],
]);

function isClassification(value: unknown): value is ConflictClassification {
  return value === "protected" || value === "intentional" || value === "requires-proof";
}

function parseManifest(value: unknown): readonly ManifestItem[] {
  if (!Array.isArray(value)) {
    throw new Error("Global feature-style overlap manifest must be an array");
  }

  return value.map((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error(`Manifest item ${index} must be an object`);
    }

    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || record.id.trim().length === 0) {
      throw new Error(`Manifest item ${index} requires a non-empty id`);
    }
    if (!isClassification(record.classification)) {
      throw new Error(`Manifest item ${index} has an invalid classification`);
    }
    if (typeof record.evidence !== "string" || record.evidence.trim().length === 0) {
      throw new Error(`Manifest item ${index} requires non-empty evidence`);
    }

    return {
      id: record.id,
      classification: record.classification,
      evidence: record.evidence,
    };
  });
}

function ownerPair(id: string): string {
  const match = id.match(
    / -> ([a-z0-9-]+\.css) \[[^\]]+\] = .* -> ([a-z0-9-]+\.css) \[[^\]]+\] = /,
  );
  if (match === null) {
    throw new Error(`Conflict id does not contain a canonical stylesheet pair: ${id}`);
  }
  return `${match[1]} -> ${match[2]}`;
}

const manifest = parseManifest(rawManifest);

describe("global feature-style overlap classification manifest", () => {
  it("keeps the complete reviewed inventory unique and explicitly evidenced", () => {
    expect(manifest).toHaveLength(107);
    expect(new Set(manifest.map((item) => item.id)).size).toBe(107);
    expect(manifest.every((item) => item.evidence.trim().length > 40)).toBe(true);
  });

  it("keeps the reviewed classification totals exact", () => {
    const counts = new Map<ConflictClassification, number>([
      ["protected", 0],
      ["intentional", 0],
      ["requires-proof", 0],
    ]);

    for (const item of manifest) {
      counts.set(item.classification, (counts.get(item.classification) ?? 0) + 1);
    }

    expect(Object.fromEntries(counts)).toEqual({
      protected: 0,
      intentional: 50,
      "requires-proof": 57,
    });
  });

  it("fails closed on unknown pairs, pair-count drift or pair reclassification", () => {
    const actualGroups = new Map<string, { classification: ConflictClassification; count: number }>();

    for (const item of manifest) {
      const pair = ownerPair(item.id);
      const expected = EXPECTED_GROUPS.get(pair);
      expect(expected, `unreviewed stylesheet pair ${pair}`).toBeDefined();
      expect(item.classification, `classification for ${pair}`).toBe(expected?.classification);

      const actual = actualGroups.get(pair);
      if (actual === undefined) {
        actualGroups.set(pair, { classification: item.classification, count: 1 });
      } else {
        expect(item.classification, `mixed classifications for ${pair}`).toBe(actual.classification);
        actual.count += 1;
      }
    }

    expect(actualGroups.size).toBe(EXPECTED_GROUPS.size);
    for (const [pair, expected] of EXPECTED_GROUPS) {
      expect(actualGroups.get(pair), `reviewed group ${pair}`).toEqual(expected);
    }
  });
});
