import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PUBLIC_URL?.trim();
if (!baseURL || !/^https:\/\/[A-Za-z0-9.-]+$/.test(baseURL)) {
  throw new Error("PUBLIC_URL must be an HTTPS origin without paths");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "public-runtime-smoke.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  timeout: 45_000,
  reporter: [["line"]],
  expect: {
    timeout: 12_000,
  },
  use: {
    baseURL,
    serviceWorkers: "allow",
    contextOptions: {
      reducedMotion: "reduce",
    },
    // Playwright recorders inject a transient inline stylesheet in Chromium
    // and WebKit. Public rollout checks must not create false CSP telemetry.
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "public-desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "public-ios-webkit", use: { ...devices["iPhone 13"] } },
  ],
});
