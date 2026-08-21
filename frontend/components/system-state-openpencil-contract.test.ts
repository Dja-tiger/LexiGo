import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const visualSource = readFileSync(
  new URL("../e2e/system-states-visual.spec.ts", import.meta.url),
  "utf8",
);
const firstUseVisualSource = readFileSync(
  new URL("../e2e/first-use-visual.spec.ts", import.meta.url),
  "utf8",
);
const firstUseBehaviorSource = readFileSync(
  new URL("../e2e/first-use.spec.ts", import.meta.url),
  "utf8",
);
const onboardingRuntimeSource = readFileSync(
  new URL("./lexigo-onboarding-app.tsx", import.meta.url),
  "utf8",
);

const SYSTEM_STATE_PROVENANCE = [
  {
    baseline: "compact-loading-dark",
    screenMapKey: "state.home.loading.dark",
    openPencilNode: "fig_4258",
    legacyFigmaNode: "79:69",
    route: "/",
    width: 390,
    height: 844,
    sha256: "45956af4fd18983b56d9c6ae38714b1ba5ed984a930c8ffca7472dd65a699368",
  },
  {
    baseline: "compact-empty-light",
    screenMapKey: "state.dictionary.empty.light",
    openPencilNode: "fig_4234",
    legacyFigmaNode: "79:93",
    route: "/dictionary",
    width: 390,
    height: 844,
    sha256: "e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf",
  },
  {
    baseline: "compact-error-dark",
    screenMapKey: "state.error.dark",
    openPencilNode: "fig_4222",
    legacyFigmaNode: "79:117",
    route: "shared",
    width: 390,
    height: 844,
    sha256: "84576205fe0619b9e1707f5c2e8ccf4a6ce7e6c285c5a261170709efa1549b11",
  },
  {
    baseline: "desktop-offline-dark",
    screenMapKey: "state.offline.desktop.dark",
    openPencilNode: "fig_4104",
    legacyFigmaNode: "79:194",
    route: "shared",
    width: 1440,
    height: 1024,
    sha256: "8f3b6192ba542969101166997046d92df0dc041ed9c8ec0fc7f588e951931f7a",
  },
  {
    baseline: "compact-recall-offline-dark",
    screenMapKey: "lesson.mobile.recall.offline",
    openPencilNode: "fig_3193",
    legacyFigmaNode: "75:57",
    route: "/lesson/active",
    width: 390,
    height: 844,
    sha256: "0d7393ab3793ab5d773d167f65f743d3cd53190c4da4899a2d915e1d3b01d2ae",
  },
] as const;

const FIRST_USE_SYSTEM_STATE_KEYS = [
  "firstuse.loading.mobile.light",
  "firstuse.error.mobile.light",
  "firstuse.loading.mobile.dark",
  "firstuse.error.mobile.dark",
  "firstuse.loading.desktop.light",
  "firstuse.error.desktop.light",
  "firstuse.loading.desktop.dark",
  "firstuse.error.desktop.dark",
] as const;

describe("system-state OpenPencil provenance contract", () => {
  it("keeps the visual owner fail-closed against the active repository OpenPencil map", () => {
    expect(visualSource).toContain('const relativePath = "docs/figma/openpencil-screen-map.json"');
    expect(visualSource).toContain("function loadActiveOpenPencilScreens");
    expect(visualSource).toContain("const ACTIVE_OPENPENCIL_SCREENS = loadActiveOpenPencilScreens()");
    expect(visualSource).toContain("expectActiveOpenPencilContract(baselineName)");
    expect(visualSource).toContain("screen?.openPencilNode");
    expect(visualSource).toContain("screen?.legacyFigmaNode");
    expect(visualSource).toContain("screen?.route");
    expect(visualSource).toContain("screen?.width");
    expect(visualSource).toContain("screen?.height");
  });

  it("keeps every approved shared baseline bound to OpenPencil provenance and preserves approved hashes", () => {
    for (const expected of SYSTEM_STATE_PROVENANCE) {
      expect(visualSource).toContain(`screenMapKey: "${expected.screenMapKey}"`);
      expect(visualSource).toContain(`openPencilNode: "${expected.openPencilNode}"`);
      expect(visualSource).toContain(`legacyFigmaNode: "${expected.legacyFigmaNode}"`);
      expect(visualSource).toContain(`route: "${expected.route}"`);
      expect(visualSource).toContain(`viewport: { width: ${expected.width}, height: ${expected.height} }`);
      expect(visualSource).toContain(`sha256: "${expected.sha256}"`);
    }

    expect(visualSource).toContain('type: "openpencil"');
    expect(visualSource).toContain('test.describe("System state OpenPencil visual baselines"');
  });

  it("keeps Figma identifiers archival instead of treating Figma as the active source", () => {
    expect(visualSource).toContain("legacyFigmaNode");
    expect(visualSource).not.toContain("figmaNode:");
    expect(visualSource).not.toContain('test.describe("System state Figma visual baselines"');
    expect(visualSource).not.toContain("primary Figma-approved SHA");
    expect(visualSource).not.toContain("for Figma ${baseline.");
  });

  it("keeps First Use loading/error as a separately tracked visual gap without duplicating its runtime state machine", () => {
    for (const key of FIRST_USE_SYSTEM_STATE_KEYS) {
      expect(visualSource).not.toContain(key);
    }

    expect(firstUseVisualSource).toContain('test.describe("First Use reviewed OpenPencil visual baselines"');
    expect(onboardingRuntimeSource).toContain("if (loading && !snapshot)");
    expect(onboardingRuntimeSource).toContain('className="lx-first-use-panel lx-first-use-loading"');
    expect(onboardingRuntimeSource).toContain("if (errorMessage)");
    expect(onboardingRuntimeSource).toContain('role="alert"');
    expect(onboardingRuntimeSource).toContain('retryAction ? " lx-first-use-message--recoverable" : ""');
    expect(firstUseBehaviorSource).toContain("failFirstMark: true");
    expect(firstUseBehaviorSource).toContain("temporary failure");
    expect(firstUseBehaviorSource).toContain('getByRole("button", { name: "Повторить" })');
  });
});
