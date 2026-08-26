import { defineConfig } from "@playwright/test";

const sharedUse = {
  baseURL: "http://127.0.0.1:3000",
  browserName: "chromium" as const,
  colorScheme: "light" as const,
  locale: "ru-RU",
  reducedMotion: "reduce" as const,
  serviceWorkers: "block" as const,
  trace: "retain-on-failure" as const,
  screenshot: "only-on-failure" as const,
  video: "retain-on-failure" as const,
};

export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    "visual-regression.spec.ts",
    "home-browser-zoom.spec.ts",
    "home-tablet-progress-visual.spec.ts",
    "learn-browser-zoom.spec.ts",
    "active-lesson-browser-zoom.spec.ts",
    "word-detail-visual.spec.ts",
    "profile-visual.spec.ts",
    "profile-email-confirmation-visual.spec.ts",
    "system-states-visual.spec.ts",
    "phrases-visual.spec.ts",
    "first-use-visual.spec.ts",
    "tablet-layout-visual.spec.ts",
    "route-tablet-parity.spec.ts",
    "route-browser-zoom-parity.spec.ts",
    "route-transition-runtime-visual.spec.ts",
    "issue-603-browser-zoom-reflow.spec.ts",
    "issue-684-zoom-compact-semantic.spec.ts",
  ],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.005,
      scale: "css",
    },
  },
  projects: [
    {
      name: "visual-compact",
      testIgnore: ["**/route-browser-zoom-parity.spec.ts"],
      use: {
        ...sharedUse,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "visual-medium",
      testIgnore: ["**/route-browser-zoom-parity.spec.ts"],
      use: {
        ...sharedUse,
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "visual-desktop",
      use: {
        ...sharedUse,
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
      },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
