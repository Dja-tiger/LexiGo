import { describe, expect, it } from "vitest";

import {
  APPEARANCE_STORAGE_KEY,
  APPEARANCE_THEME_COLORS,
  applyAppearancePreference,
  createAppearanceBootstrapScript,
  normalizeAppearancePreference,
  persistAppearancePreference,
  readAppearancePreference,
  resolveAppearance,
} from "./appearance-preference";

describe("appearance preference", () => {
  it("normalizes untrusted storage values to Auto", () => {
    expect(normalizeAppearancePreference("auto")).toBe("auto");
    expect(normalizeAppearancePreference("light")).toBe("light");
    expect(normalizeAppearancePreference("dark")).toBe("dark");
    expect(normalizeAppearancePreference("sepia")).toBe("auto");
    expect(normalizeAppearancePreference(null)).toBe("auto");
  });

  it("resolves Auto from the operating-system preference", () => {
    expect(resolveAppearance("auto", false)).toBe("light");
    expect(resolveAppearance("auto", true)).toBe("dark");
    expect(resolveAppearance("light", true)).toBe("light");
    expect(resolveAppearance("dark", false)).toBe("dark");
  });

  it("reads and persists only the appearance preference", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(readAppearancePreference(storage)).toBe("auto");
    expect(persistAppearancePreference("dark", storage)).toBe(true);
    expect(values.get(APPEARANCE_STORAGE_KEY)).toBe("dark");
    expect(readAppearancePreference(storage)).toBe("dark");
  });

  it("degrades to Auto when browser storage is denied", () => {
    const denied = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };

    expect(readAppearancePreference(denied)).toBe("auto");
    expect(persistAppearancePreference("light", denied)).toBe(false);
  });

  it("applies resolved appearance to the document and PWA theme color", () => {
    const dataset: Record<string, string> = {};
    const style: Record<string, string> = {};
    const metas = [
      { content: "", dataset: {} as Record<string, string> },
      { content: "", dataset: {} as Record<string, string> },
    ];
    const fakeDocument = {
      documentElement: { dataset, style },
      querySelectorAll: () => metas,
    } as unknown as Document;

    expect(applyAppearancePreference("auto", {
      document: fakeDocument,
      systemPrefersDark: true,
    })).toBe("dark");
    expect(dataset.lexigoAppearance).toBe("auto");
    expect(dataset.lexigoResolvedAppearance).toBe("dark");
    expect(style.colorScheme).toBe("dark");
    expect(metas.every((meta) => meta.content === APPEARANCE_THEME_COLORS.dark)).toBe(true);
    expect(metas.every((meta) => meta.dataset.lexigoResolvedAppearance === "dark")).toBe(true);
  });

  it("builds a synchronous no-flash bootstrap without interpolating user data", () => {
    const script = createAppearanceBootstrapScript();

    expect(script).toContain(APPEARANCE_STORAGE_KEY);
    expect(script).toContain("data");
    expect(script).toContain("lexigoAppearance");
    expect(script).toContain("lexigoResolvedAppearance");
    expect(script).toContain("matchMedia");
    expect(script).toContain('meta[name="theme-color"]');
    expect(script).not.toContain("accessToken");
    expect(script).not.toContain("sessionStorage");
  });
});
