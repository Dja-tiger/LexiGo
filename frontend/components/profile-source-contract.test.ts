import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

async function source(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

describe("Profile route ownership", () => {
  it("uses the authenticated Profile island without replacing guest authentication", async () => {
    const [layout, bootstrap, profile, premium] = await Promise.all([
      source("../app/layout.tsx"),
      source("./lexigo-bootstrapped-app.tsx"),
      source("./lexigo-profile-app.tsx"),
      source("./lexigo-premium-app.tsx"),
    ]);

    expect(layout).toContain('import "./appearance.css";');
    expect(layout).toContain('import "./profile.css";');
    expect(layout).toContain('id="lexigo-appearance-bootstrap"');
    expect(layout.indexOf('id="lexigo-appearance-bootstrap"'))
      .toBeLessThan(layout.indexOf('id="lexigo-build-version-guard"'));

    expect(bootstrap).toContain('import("./lexigo-profile-app")');
    expect(bootstrap).toContain('pathname === "/profile"');
    expect(bootstrap).toContain('isProfileRoute(pathname) && initialSession !== null');
    expect(bootstrap.match(/<LexigoProfileApp\b/g)).toHaveLength(1);
    expect(bootstrap.match(/<LexigoPremiumApp\b/g)).toHaveLength(1);

    expect(profile).toContain('data-route-client-island="profile"');
    expect(profile).toContain('"/api/v1/progress?timezoneOffsetMinutes=');
    expect(profile).toContain('"/api/v1/progress/goal?timezoneOffsetMinutes=');
    expect(profile).toContain('"/api/v1/auth/logout"');
    expect(profile).toContain("CalendarReminderIntegration");
    expect(profile).toContain("setAppearancePreference");
    expect(profile).not.toContain("accessToken\"");

    expect(premium).toContain("function renderProfile()");
    expect(premium).toContain('authMode === "login"');
    expect(premium).toContain('authMode === "register"');
    expect(premium).toContain('authMode === "forgot"');
    expect(premium).toContain('authMode === "reset"');
  });

  it("keeps sensitive account operations in their existing confirmed owners", async () => {
    const [profile, security, email, data] = await Promise.all([
      source("./lexigo-profile-app.tsx"),
      source("./account-security-panel.tsx"),
      source("./account-email-panel.tsx"),
      source("./account-data-panel.tsx"),
    ]);

    expect(profile).not.toContain('"/api/v1/auth/password"');
    expect(profile).not.toContain('"/api/v1/auth/sessions/revoke-others"');
    expect(profile).not.toContain('"/api/v1/account/email-change/request"');
    expect(profile).not.toContain('"/api/v1/account/export"');
    expect(profile).not.toContain('method: "DELETE"');

    expect(security).toContain('"/api/v1/auth/password"');
    expect(security).toContain('"/api/v1/auth/sessions/revoke-others"');
    expect(email).toContain('"/api/v1/account/email-change/request"');
    expect(data).toContain('"/api/v1/account/export"');
    expect(data).toContain('method: "DELETE"');

    expect(profile).toContain('document.getElementById("account-security-title")');
    expect(profile).toContain('document.getElementById("account-email-title")');
    expect(profile).toContain('document.getElementById("account-data-title")');
    expect(profile).toContain('scrollIntoView({ block: "start", behavior: "auto" })');
  });

  it("persists appearance independently from authentication state", async () => {
    const [appearance, session] = await Promise.all([
      source("../lib/appearance-preference.ts"),
      source("../lib/auth-session.ts"),
    ]);

    expect(appearance).toContain('"lexigo.appearance.v1"');
    expect(appearance).toContain('type AppearancePreference = "auto" | "light" | "dark"');
    expect(appearance).not.toContain("accessToken");
    expect(appearance).not.toContain("refreshToken");
    expect(appearance).not.toContain("lexigo.session.v1");
    expect(session).toContain('const LEGACY_SESSION_KEY = "lexigo.session.v1"');
  });
});
