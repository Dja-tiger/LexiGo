import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const bootstrap = readFileSync(new URL("./lexigo-bootstrapped-app.tsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("./lexigo-profile-app.tsx", import.meta.url), "utf8");
const premium = readFileSync(new URL("./lexigo-premium-app.tsx", import.meta.url), "utf8");

function sourceIndex(source: string, marker: string): number {
  const index = source.lastIndexOf(marker);
  expect(index, `missing source marker ${marker}`).toBeGreaterThanOrEqual(0);
  return index;
}

describe("Profile route island source contract", () => {
  it("loads one dedicated authenticated Profile entry", () => {
    expect(bootstrap).toContain('import("./lexigo-profile-app")');
    expect(bootstrap).toContain('return normalizedPathname(pathname) === "/profile";');
    expect(bootstrap).toContain("useProfileIsland");
    expect(bootstrap).toContain("<LexigoProfileApp");
  });

  it("selects the canonical Profile island before the compatibility fallback only for authenticated sessions", () => {
    expect(bootstrap).toContain(
      "const useProfileIsland = isProfileRoute(pathname) && initialSession !== null;",
    );
    expect(profile).toContain("initialSession: Session;");

    const profileRender = sourceIndex(bootstrap, "<LexigoProfileApp");
    const compatibilityFallback = sourceIndex(bootstrap, "<LexigoPremiumApp");
    expect(compatibilityFallback).toBeGreaterThan(profileRender);
  });

  it("keeps account settings and logout behavior in the canonical authenticated owner", () => {
    const canonicalContracts = [
      'data-route-client-island="profile"',
      "/api/v1/progress/goal?timezoneOffsetMinutes=",
      'requestJSON<void>("/api/v1/auth/logout"',
      "setAppearancePreference",
      "CalendarReminderIntegration",
      "onLoggedOut();",
    ] as const;

    for (const marker of canonicalContracts) {
      expect(profile, `canonical Profile contract ${marker}`).toContain(marker);
    }
  });

  it("preserves the guest Profile compatibility boundary for authentication and account recovery", () => {
    expect(bootstrap).toContain("isProfileRoute(pathname) && initialSession !== null");
    expect(bootstrap).toContain('moveToSessionScreen("required")');

    const liveCompatibilityMarkers = [
      "function renderProfile()",
      "requestAuthentication",
      "presentAuthFailure",
      "validateAuthValues",
      "passwordRequirements",
    ] as const;

    for (const marker of liveCompatibilityMarkers) {
      expect(premium, `live guest Profile compatibility marker ${marker}`).toContain(marker);
    }
  });

  it("does not duplicate persistent bootstrap and outbox owners", () => {
    expect(profile).not.toContain("ReviewOutboxRuntime");
    expect(profile).not.toContain("restoreBootstrappedSession");
    expect(profile).not.toContain("ServiceWorkerRegistration");
  });
});
