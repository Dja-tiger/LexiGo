import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type PackageManifest = {
  scripts?: Record<string, string>;
};

const packageManifest = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
) as PackageManifest;

const IOS_PWA_SCENARIOS = [
  ["test:e2e:pwa:dictionary", "e2e/dictionary-pwa.spec.ts"],
  ["test:e2e:pwa:calendar", "e2e/apple-calendar-pwa.spec.ts"],
  ["test:e2e:pwa:navigation", "e2e/adaptive-navigation.spec.ts"],
  ["test:e2e:pwa:speech", "e2e/speech-player.spec.ts"],
  ["test:e2e:pwa:session", "e2e/session-resume-pwa.spec.ts"],
] as const;

describe("Playwright script resource contracts", () => {
  it("runs every iOS PWA spec in a separate single-worker WebKit process", () => {
    const scripts = packageManifest.scripts ?? {};
    const expectedGate = IOS_PWA_SCENARIOS
      .map(([scriptName]) => `npm run ${scriptName}`)
      .join(" && ");

    expect(scripts["test:e2e:pwa"]).toBe(expectedGate);

    for (const [scriptName, spec] of IOS_PWA_SCENARIOS) {
      expect(scripts[scriptName]).toBe(
        `playwright test ${spec} --project=ios-webkit --workers=1`,
      );
    }
  });
});
