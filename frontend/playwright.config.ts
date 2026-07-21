import { defineConfig, devices } from "@playwright/test";

const securityJourneyMode = process.env.CSP_SECURITY_E2E === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    serviceWorkers: "block",
    contextOptions: {
      reducedMotion: "reduce",
    },
    trace: securityJourneyMode ? "off" : "retain-on-failure",
    screenshot: securityJourneyMode ? "off" : "only-on-failure",
    video: securityJourneyMode ? "off" : "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "desktop-webkit", use: { ...devices["Desktop Safari"] } },
    { name: "android-chromium", use: { ...devices["Pixel 5"] } },
    { name: "ios-webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
