import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type PackageManifest = {
  scripts?: Record<string, string>;
};

const packageManifest = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
) as PackageManifest;

const IOS_PWA_SPECS = [
  "e2e/dictionary-pwa.spec.ts",
  "e2e/apple-calendar-pwa.spec.ts",
  "e2e/adaptive-navigation.spec.ts",
  "e2e/speech-player.spec.ts",
  "e2e/session-resume-pwa.spec.ts",
] as const;

describe("Playwright script resource contracts", () => {
  it("keeps the complete iOS PWA gate on one WebKit worker", () => {
    const script = packageManifest.scripts?.["test:e2e:pwa"];

    expect(script).toBeTypeOf("string");
    expect(script).toContain("--project=ios-webkit");
    expect(script).toMatch(/(?:^|\s)--workers=1(?:\s|$)/);

    for (const spec of IOS_PWA_SPECS) {
      expect(script).toContain(spec);
    }
  });
});
