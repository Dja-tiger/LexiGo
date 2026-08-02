import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const bootstrap = readFileSync(new URL("./lexigo-bootstrapped-app.tsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("./lexigo-profile-app.tsx", import.meta.url), "utf8");
const premium = readFileSync(new URL("./lexigo-premium-app.tsx", import.meta.url), "utf8");

function sourceIndex(source: string, marker: string): number {
  const index = source.indexOf(marker);
  expect(index, `missing source marker ${marker}`).toBeGreaterThanOrEqual(0);
  return index;
}

function sourceSlice(source: string, startMarker: string, endMarker: string): string {
  const start = sourceIndex(source, startMarker);
  const end = sourceIndex(source.slice(start + startMarker.length), endMarker)
    + start
    + startMarker.length;
  expect(end, `invalid source boundary ${startMarker} -> ${endMarker}`).toBeGreaterThan(start);
  return source.slice(start, end);
}

function occurrences(source: string, marker: string): number {
  return source.split(marker).length - 1;
}

describe("authenticated Profile compatibility fallback reachability", () => {
  it("selects the canonical authenticated Profile island before the compatibility fallback", () => {
    expect(bootstrap).toContain('return normalizedPathname(pathname) === "/profile";');
    expect(bootstrap).toContain(
      "const useProfileIsland = isProfileRoute(pathname) && initialSession !== null;",
    );

    const canonicalProfileRender = sourceIndex(bootstrap, "<LexigoProfileApp");
    const compatibilityFallbackRender = sourceIndex(bootstrap, "<LexigoPremiumApp");
    expect(compatibilityFallbackRender).toBeGreaterThan(canonicalProfileRender);
  });

  it("keeps the guest Profile fallback and all authentication recovery contracts live", () => {
    const renderProfile = sourceSlice(
      premium,
      "function renderProfile()",
      "function renderAllItems()",
    );

    const guestPresentationMarkers = [
      "if (!session) {",
      'className="lx-auth-card"',
      'id="auth-mode-tab-login"',
      'id="auth-mode-tab-register"',
      'onSubmit={submitAuth}',
      "Забыли пароль?",
      'id="auth-token"',
    ] as const;

    for (const marker of guestPresentationMarkers) {
      expect(renderProfile, `guest Profile marker ${marker}`).toContain(marker);
    }

    const guestRuntimeMarkers = [
      "async function submitAuth",
      "validateAuthValues(authMode, values)",
      "presentAuthFailure(requestError)",
      "passwordRequirements(password)",
      '"/api/v1/auth/password-reset/request"',
      '"/api/v1/auth/password-reset/confirm"',
      'authMode === "login"',
      'authMode === "register"',
      'authMode === "forgot"',
      'authMode === "reset"',
    ] as const;

    for (const marker of guestRuntimeMarkers) {
      expect(premium, `guest authentication contract ${marker}`).toContain(marker);
    }

    expect(renderProfile.trimEnd()).toMatch(/return null;\s*}$/);
  });

  it("keeps the proven authenticated duplicate and helper family physically absent", () => {
    const renderProfile = sourceSlice(
      premium,
      "function renderProfile()",
      "function renderAllItems()",
    );

    const removedPresentationMarkers = [
      "const profileProgressPending =",
      'className="lx-profile-grid"',
      "formatAccountDate(session.user.createdAt)",
      "onClick={logout}",
      'navigate({ view: "progress" })',
      "Настройки обучения и синхронизация между устройствами.",
    ] as const;

    for (const marker of removedPresentationMarkers) {
      expect(renderProfile, `removed authenticated duplicate marker ${marker}`).not.toContain(marker);
    }

    expect(occurrences(premium, "function formatAccountDate(")).toBe(0);
    expect(occurrences(premium, "formatAccountDate(")).toBe(0);
    expect(occurrences(premium, "async function logout()")).toBe(0);
    expect(occurrences(premium, "onClick={logout}")).toBe(0);
    expect(occurrences(premium, "async function updateDailyGoal(")).toBe(0);
    expect(occurrences(premium, "updateDailyGoal(")).toBe(0);
    expect(occurrences(premium, '"/api/v1/auth/logout"')).toBe(0);
    expect(occurrences(premium, "/api/v1/progress/goal?timezoneOffsetMinutes=")).toBe(0);
  });

  it("keeps authenticated Profile mutations in the canonical owner", () => {
    const canonicalMarkers = [
      'data-route-client-island="profile"',
      'requestJSON<void>("/api/v1/auth/logout"',
      "/api/v1/progress/goal?timezoneOffsetMinutes=",
      "CalendarReminderIntegration",
      "setAppearancePreference",
      "onLoggedOut();",
    ] as const;

    for (const marker of canonicalMarkers) {
      expect(profile, `canonical authenticated Profile marker ${marker}`).toContain(marker);
    }
  });

  it("retains the guest Profile dispatch and unrelated live compatibility owners", () => {
    expect(occurrences(premium, "function renderProfile()")).toBe(1);
    expect(premium).toContain('navigation.view === "profile" ? renderProfile()');
    expect(premium).toContain('navigation.view === "library" ? renderLibrary()');
    expect(premium).toContain("renderLesson()");
  });
});
