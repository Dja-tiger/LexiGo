import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const componentsDirectory = path.join(process.cwd(), "components");

function readComponent(file: string): string {
  return readFileSync(path.join(componentsDirectory, file), "utf8");
}

describe("Progress route client-island ownership", () => {
  it("loads the dedicated Progress entry only from the persistent bootstrap layer", () => {
    const bootstrappedApp = readComponent("lexigo-bootstrapped-app.tsx");
    const progressEntryConsumers = readdirSync(componentsDirectory)
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => readComponent(file).includes("lexigo-progress-app"))
      .sort();

    expect(progressEntryConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(bootstrappedApp).toMatch(
      /const LexigoProgressApp = dynamic\([\s\S]*import\("\.\/lexigo-progress-app"\)[\s\S]*module\.LexigoProgressApp/,
    );
    expect(bootstrappedApp.match(/<LexigoProgressApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<ReviewOutboxRuntime\b/g)).toHaveLength(1);
    expect(bootstrappedApp).toContain("restoreBootstrappedSession()");
  });

  it("keeps Progress API and evidence behavior inside the island without shared runtime owners", () => {
    const progressApp = readComponent("lexigo-progress-app.tsx");

    expect(progressApp).toContain('from "../lib/authorized-json"');
    expect(progressApp).toContain('from "./progress-evidence-dashboard"');
    expect(progressApp).toContain('data-route-client-island="progress"');
    expect(progressApp).toContain("/api/v1/progress?timezoneOffsetMinutes=");
    expect(progressApp).not.toContain("lexigo-premium-app");
    expect(progressApp).not.toContain("restoreBootstrappedSession");
    expect(progressApp).not.toContain("refreshSession");
    expect(progressApp).not.toContain("ReviewOutboxRuntime");
    expect(progressApp).not.toContain("navigator.serviceWorker");
  });
});
