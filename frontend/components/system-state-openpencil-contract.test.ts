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

const FIRST_USE_SYSTEM_STATE_PROVENANCE = [
  {
    baseline: "loading-compact-light",
    screenMapKey: "firstuse.loading.mobile.light",
    openPencilNode: "n117",
    route: "/onboarding",
    width: 390,
    height: 844,
    sha256: "5ac755583ae348e92dd14af1e28ae97874c3072fb7f6825c36b5a9ef7df9fb8b",
  },
  {
    baseline: "loading-compact-dark",
    screenMapKey: "firstuse.loading.mobile.dark",
    openPencilNode: "n277",
    route: "/onboarding",
    width: 390,
    height: 844,
    sha256: "643dcc73be33f1878765f2b6826d41e689f7ebec277ac0ce9777b9161f6d97e3",
  },
  {
    baseline: "loading-desktop-light",
    screenMapKey: "firstuse.loading.desktop.light",
    openPencilNode: "n442",
    route: "/onboarding",
    width: 1440,
    height: 900,
    sha256: "448d90d81985018b383454f905371379831f475fbc24be3b1e95822bf11b814d",
  },
  {
    baseline: "loading-desktop-dark",
    screenMapKey: "firstuse.loading.desktop.dark",
    openPencilNode: "n614",
    route: "/onboarding",
    width: 1440,
    height: 900,
    sha256: "f9f88c3000aad5445d4bd1139cf81face075838b82d3f776d80227aa7c511a9e",
  },
  {
    baseline: "error-compact-light",
    screenMapKey: "firstuse.error.mobile.light",
    openPencilNode: "n128",
    route: "/onboarding",
    width: 390,
    height: 844,
    sha256: "e4b0f198fff3a41acdca84f23b07b82250affae262a3c95719fed43c1c402e49",
  },
  {
    baseline: "error-compact-dark",
    screenMapKey: "firstuse.error.mobile.dark",
    openPencilNode: "n288",
    route: "/onboarding",
    width: 390,
    height: 844,
    sha256: "03983eea1fc462f0e667deba5246952bfcf247da24a3cef4c3f33eec3320a7b3",
  },
  {
    baseline: "error-desktop-light",
    screenMapKey: "firstuse.error.desktop.light",
    openPencilNode: "n456",
    route: "/onboarding",
    width: 1440,
    height: 900,
    sha256: "1175fc95ac3085e4fc3b748cc4ffd6f4f032fe4dfe29a46d209d18bd1569a3fa",
  },
  {
    baseline: "error-desktop-dark",
    screenMapKey: "firstuse.error.desktop.dark",
    openPencilNode: "n628",
    route: "/onboarding",
    width: 1440,
    height: 900,
    sha256: "6cfbf773756e934a50e8b30a30a896399d3efd328fd2c101539d020b89682a06",
  },
] as const;

function firstUseBaselineBlock(baselineName: string): string {
  const marker = `"${baselineName}": {`;
  const start = firstUseVisualSource.indexOf(marker);
  expect(start, `First Use visual owner must contain baseline ${baselineName}`).toBeGreaterThanOrEqual(0);

  const end = firstUseVisualSource.indexOf("\n  },", start);
  expect(end, `First Use baseline ${baselineName} must have a bounded contract block`).toBeGreaterThan(start);
  return firstUseVisualSource.slice(start, end + "\n  },".length);
}

describe("system-state OpenPencil provenance contract", () => {
  it("keeps the shared visual owner fail-closed against the active repository OpenPencil map", () => {
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
    expect(SYSTEM_STATE_PROVENANCE).toHaveLength(5);

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

  it("delegates delivered First Use loading/error parity to its authoritative OpenPencil visual owner", () => {
    expect(FIRST_USE_SYSTEM_STATE_PROVENANCE).toHaveLength(8);
    expect(firstUseVisualSource).toContain('test.describe("First Use reviewed OpenPencil visual baselines"');
    expect(firstUseVisualSource).toContain('const relativePath = "docs/figma/openpencil-screen-map.json"');
    expect(firstUseVisualSource).toContain("const ACTIVE_OPENPENCIL_SCREENS = loadActiveOpenPencilScreens()");
    expect(firstUseVisualSource).toContain("expectActiveOpenPencilContract(baselineName)");
    expect(firstUseVisualSource).toContain("screen?.openPencilNode");
    expect(firstUseVisualSource).toContain("screen?.route");
    expect(firstUseVisualSource).toContain("{ width: screen?.width, height: screen?.height }");

    for (const expected of FIRST_USE_SYSTEM_STATE_PROVENANCE) {
      expect(
        visualSource,
        `${expected.screenMapKey} belongs to the First Use visual owner and must not be duplicated by shared system-state visuals`,
      ).not.toContain(`screenMapKey: "${expected.screenMapKey}"`);

      const block = firstUseBaselineBlock(expected.baseline);
      expect(block).toContain(`screenMapKey: "${expected.screenMapKey}"`);
      expect(block).toContain(`openPencilNode: "${expected.openPencilNode}"`);
      expect(block).toContain(`route: "${expected.route}"`);
      expect(block).toContain(`viewport: { width: ${expected.width}, height: ${expected.height} }`);
      expect(block).toContain(`sha256: "${expected.sha256}"`);
    }
  });

  it("preserves independent First Use runtime and retry owners without duplicating their state machines", () => {
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
