import { expect, test, type Page } from "@playwright/test";

// Playwright's WebKit trace/screenshot recorder injects a transient inline
// stylesheet. Disable recording here so the harness cannot create the CSP
// violation that this spec is intended to detect.
test.use({ screenshot: "off", trace: "off", video: "off" });

const REQUIRED_DIRECTIVES = [
  "default-src 'self'",
  "script-src-attr 'none'",
  "connect-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
] as const;

async function captureCSPViolations(page: Page): Promise<string[]> {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.defineProperty(window, "__lexigoCSPViolations", {
      configurable: true,
      value: violations,
    });
    document.addEventListener("securitypolicyviolation", (event) => {
      violations.push(`${event.effectiveDirective}:${event.blockedURI}`);
    });
  });
  return consoleErrors;
}

async function cspViolations(page: Page): Promise<string[]> {
  return page.evaluate(() => Reflect.get(window, "__lexigoCSPViolations") as string[] ?? []);
}

test("production pages enforce nonce-based CSP without browser violations", async ({ page }) => {
  const consoleErrors = await captureCSPViolations(page);
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response).not.toBeNull();
  const policy = response?.headers()["content-security-policy"] ?? "";
  expect(policy).toContain("script-src 'self' 'nonce-");
  expect(policy).toContain("style-src 'self' 'nonce-");
  expect(policy).toContain("style-src-elem 'self' 'nonce-");
  expect(policy).toContain("style-src-attr 'unsafe-inline'");
  for (const directive of REQUIRED_DIRECTIVES) expect(policy).toContain(directive);
  expect(policy).not.toContain("'unsafe-eval'");
  expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  expect(policy.match(/'unsafe-inline'/g)).toHaveLength(1);
  expect(response?.headers()["content-security-policy-report-only"]).toBeUndefined();

  await expect(page.locator('[data-app-router-shell="true"]')).toBeVisible();
  expect(await page.evaluate(() => (
    Array.from(document.scripts)
      .filter((script) => !script.src)
      .every((script) => Boolean(script.nonce))
  ))).toBe(true);
  expect(await page.evaluate(() => (
    Array.from(document.querySelectorAll("style"))
      .every((style) => Boolean(style.nonce))
  ))).toBe(true);
  await page.waitForTimeout(500);
  expect(await cspViolations(page)).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("offline recovery page uses external assets accepted by the same policy", async ({ page }) => {
  const consoleErrors = await captureCSPViolations(page);
  const response = await page.goto("/offline.html?return=%2Fdictionary", { waitUntil: "load" });

  expect(response?.headers()["content-security-policy"]).toContain("script-src 'self' 'nonce-");
  await expect(page.getByRole("heading", { name: "LexiGo временно недоступен" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/Соединение доступно|Нет подключения/);
  expect(await page.locator("script:not([src]), style").count()).toBe(0);
  await page.waitForTimeout(500);
  expect(await cspViolations(page)).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
