import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { captureRuntimeErrors, installQualityGateAPI } from "./support/quality-gates";
import {
  CANONICAL_WORD_DETAIL,
  installCanonicalWordDetailFixture,
} from "./support/word-detail-fixture";

type CalibrationResult = {
  route: "/words/101";
  initialRequests: number;
  javascriptBytes: number;
  apiRequests: string[];
  javascriptAssets: Array<{ path: string; bytes: number }>;
};

async function createCalibrationPage(browser: Browser): Promise<{
  context: BrowserContext;
  page: Page;
}> {
  const context = await browser.newContext({
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  await installQualityGateAPI(context);
  const page = await context.newPage();
  await installCanonicalWordDetailFixture(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 100,
    downloadThroughput: 200_000,
    uploadThroughput: 100_000,
    connectionType: "cellular3g",
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  return { context, page };
}

async function measureWordDetail(browser: Browser): Promise<CalibrationResult> {
  const { context, page } = await createCalibrationPage(browser);
  const runtimeErrors = captureRuntimeErrors(page);
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/v1/")) {
      apiRequests.push(`${request.method()} ${url.pathname}${url.search}`);
    }
  });

  try {
    await page.goto("/words/101?source=backend&topic=Release&status=review&page=2", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();
    await expect(page.getByRole("list", { name: "Связанные фразы" })).toBeVisible();
    await page.waitForTimeout(1_500);

    const measurement = await page.evaluate(() => {
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const transferredBytes = (resource: PerformanceResourceTiming) => Math.max(
        resource.transferSize,
        resource.encodedBodySize,
      );
      const javascriptAssets = resources
        .filter((resource) => (
          resource.initiatorType === "script"
          || /\/_next\/static\/chunks\/.*\.js(?:\?|$)/.test(resource.name)
        ))
        .map((resource) => ({
          path: new URL(resource.name).pathname,
          bytes: transferredBytes(resource),
        }))
        .sort((left, right) => left.path.localeCompare(right.path));
      return {
        initialRequests: resources.length + 1,
        javascriptAssets,
      };
    });

    expect(runtimeErrors).toEqual([]);
    expect(apiRequests.some((request) => request.includes("/api/v1/catalog/metadata"))).toBe(false);
    expect(apiRequests.some((request) => request.includes("/api/v1/progress"))).toBe(false);
    expect(apiRequests.some((request) => /\/api\/v1\/words\?.*kind=word/.test(request))).toBe(false);

    return {
      route: "/words/101",
      initialRequests: measurement.initialRequests,
      javascriptBytes: measurement.javascriptAssets.reduce((total, asset) => total + asset.bytes, 0),
      apiRequests,
      javascriptAssets: measurement.javascriptAssets,
    };
  } finally {
    await context.close();
  }
}

test("calibrate canonical Word Detail cold-route budget", async ({ browser }) => {
  test.setTimeout(120_000);
  const result = await measureWordDetail(browser);
  await test.info().attach("word-detail-performance-calibration.json", {
    body: Buffer.from(`${JSON.stringify(result, null, 2)}\n`, "utf8"),
    contentType: "application/json",
  });

  expect(
    {
      initialRequests: result.initialRequests,
      javascriptBytes: result.javascriptBytes,
    },
    "Promote the manually reviewed Linux calibration into bundle-budgets.json and the canonical route matrix.",
  ).toEqual({
    initialRequests: 0,
    javascriptBytes: 0,
  });
});
