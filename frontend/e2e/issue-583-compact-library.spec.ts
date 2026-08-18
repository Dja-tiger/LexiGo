import { createHash } from "node:crypto";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type Appearance = "light" | "dark";
type EvidenceRoute = "dictionary" | "phrases" | "learn";

type RectSnapshot = Readonly<{
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}>;

type LibraryGeometry = Readonly<{
  viewportWidth: number;
  viewportHeight: number;
  clientWidth: number;
  documentWidth: number;
  appPaddingLeft: string;
  appPaddingRight: string;
  catalog: RectSnapshot;
  materials: RectSnapshot;
  materialsGroup: RectSnapshot;
  materialButtons: ReadonlyArray<Readonly<{
    label: string;
    rect: RectSnapshot;
    whiteSpace: string;
    paddingLeft: string;
    paddingRight: string;
    borderRadius: string;
    fontSize: string;
  }>>;
  reminder: RectSnapshot;
  reminderLabel: Readonly<{
    position: string;
    width: string;
    height: string;
    overflow: string;
    clipPath: string;
    whiteSpace: string;
  }>;
  reminderPaint: Readonly<{
    background: string;
    color: string;
    iconColor: string;
    surface: string;
    text: string;
    primary: string;
  }>;
}>;

type Reviewed430Baseline = Readonly<{
  width: number;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
}>;

const BASELINES_430: Record<`${EvidenceRoute}.${Appearance}`, Reviewed430Baseline> = {
  "dictionary.light": { width: 0, height: 0, sha256: "REVIEW_REQUIRED", sourceRun: 0, sourceHeadSha: "REVIEW_REQUIRED" },
  "dictionary.dark": { width: 0, height: 0, sha256: "REVIEW_REQUIRED", sourceRun: 0, sourceHeadSha: "REVIEW_REQUIRED" },
  "phrases.light": { width: 0, height: 0, sha256: "REVIEW_REQUIRED", sourceRun: 0, sourceHeadSha: "REVIEW_REQUIRED" },
  "phrases.dark": { width: 0, height: 0, sha256: "REVIEW_REQUIRED", sourceRun: 0, sourceHeadSha: "REVIEW_REQUIRED" },
  "learn.light": { width: 0, height: 0, sha256: "REVIEW_REQUIRED", sourceRun: 0, sourceHeadSha: "REVIEW_REQUIRED" },
  "learn.dark": { width: 0, height: 0, sha256: "REVIEW_REQUIRED", sourceRun: 0, sourceHeadSha: "REVIEW_REQUIRED" },
};

function expectClose(actual: number, expected: number, tolerance = 1): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

function expectRectInlineParity(actual: RectSnapshot, expected: RectSnapshot): void {
  expectClose(actual.left, expected.left);
  expectClose(actual.right, expected.right);
  expectClose(actual.width, expected.width);
}

function isReviewRequiredFingerprint(value: string): boolean {
  return value === "REVIEW_REQUIRED";
}

async function installAppearance(page: Page, appearance: Appearance): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
  await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
}

async function settleRoute(page: Page, route: EvidenceRoute, appearance: Appearance): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);

  if (route === "dictionary") {
    await expect(page).toHaveURL((url) => url.pathname === "/dictionary");
    await expect(page.locator('[data-route-client-island="dictionary"]')).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Словарь", exact: true })).toBeVisible();
  } else if (route === "phrases") {
    await expect(page).toHaveURL((url) => url.pathname === "/phrases");
    await expect(page.locator('[data-route-client-island="phrases"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Находите готовые формулировки", exact: true })).toBeVisible();
  } else {
    await expect(page).toHaveURL((url) => url.pathname === "/learn");
    await expect(page.locator('[data-route-client-island="learn"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок", exact: true })).toBeVisible();
  }

  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);
}

async function readLibraryGeometry(page: Page, route: "dictionary" | "phrases"): Promise<LibraryGeometry> {
  return page.evaluate((currentRoute) => {
    const root = document.documentElement;
    const app = document.querySelector<HTMLElement>(
      currentRoute === "dictionary"
        ? '.lx-app[data-route-client-island="dictionary"]'
        : '.lx-app[data-route-client-island="phrases"]',
    );
    const catalog = document.querySelector<HTMLElement>(
      currentRoute === "dictionary" ? ".lx-dictionary-catalog" : ".lx-phrases-catalog",
    );
    const materials = document.querySelector<HTMLElement>(".lx-catalog-kind-navigation");
    const materialsGroup = materials?.querySelector<HTMLElement>(":scope > div");
    const reminder = document.querySelector<HTMLElement>(".lx-route-reminder-entry > summary");
    const reminderLabel = reminder?.querySelector<HTMLElement>(":scope > span");
    const reminderIcon = reminder?.querySelector<SVGElement>("svg");

    if (!app || !catalog || !materials || !materialsGroup || !reminder || !reminderLabel || !reminderIcon) {
      throw new Error(`Missing Issue #583 geometry owner on ${currentRoute}`);
    }

    const toRect = (node: Element) => {
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };

    const colorContext = document.createElement("canvas").getContext("2d");
    if (!colorContext) throw new Error("Canvas color normalization is unavailable");
    const rootStyle = getComputedStyle(root);
    const normalizeColor = (value: string) => {
      colorContext.fillStyle = "#000000";
      colorContext.fillStyle = value.trim();
      return colorContext.fillStyle;
    };
    const resolveColorToken = (name: string) => normalizeColor(rootStyle.getPropertyValue(name));

    const appStyle = getComputedStyle(app);
    const reminderStyle = getComputedStyle(reminder);
    const labelStyle = getComputedStyle(reminderLabel);

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      clientWidth: root.clientWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      appPaddingLeft: appStyle.paddingLeft,
      appPaddingRight: appStyle.paddingRight,
      catalog: toRect(catalog),
      materials: toRect(materials),
      materialsGroup: toRect(materialsGroup),
      materialButtons: Array.from(materials.querySelectorAll<HTMLButtonElement>("button")).map((button) => {
        const style = getComputedStyle(button);
        return {
          label: button.textContent?.trim() ?? "",
          rect: toRect(button),
          whiteSpace: style.whiteSpace,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
          borderRadius: style.borderRadius,
          fontSize: style.fontSize,
        };
      }),
      reminder: toRect(reminder),
      reminderLabel: {
        position: labelStyle.position,
        width: labelStyle.width,
        height: labelStyle.height,
        overflow: labelStyle.overflow,
        clipPath: labelStyle.clipPath,
        whiteSpace: labelStyle.whiteSpace,
      },
      reminderPaint: {
        background: normalizeColor(reminderStyle.backgroundColor),
        color: normalizeColor(reminderStyle.color),
        iconColor: normalizeColor(getComputedStyle(reminderIcon).color),
        surface: resolveColorToken("--ak-color-surface"),
        text: resolveColorToken("--ak-color-text-main"),
        primary: resolveColorToken("--ak-color-primary"),
      },
    };
  }, route);
}

function expectLibraryGeometryIsCompact(snapshot: LibraryGeometry): void {
  expect(snapshot.viewportWidth).toBe(430);
  expect(snapshot.viewportHeight).toBe(932);
  expect(snapshot.documentWidth).toBeLessThanOrEqual(snapshot.clientWidth + 1);
  expect(snapshot.materialButtons).toHaveLength(2);
  expect(snapshot.appPaddingLeft).toBe(snapshot.appPaddingRight);

  expect(snapshot.reminder.width).toBeGreaterThanOrEqual(47);
  expect(snapshot.reminder.width).toBeLessThanOrEqual(50);
  expect(snapshot.reminder.height).toBeGreaterThanOrEqual(47);
  expect(snapshot.reminder.height).toBeLessThanOrEqual(50);
  expect(snapshot.reminderLabel.position).toBe("absolute");
  expect(snapshot.reminderLabel.width).toBe("1px");
  expect(snapshot.reminderLabel.height).toBe("1px");
  expect(snapshot.reminderLabel.overflow).toBe("hidden");
  expect(snapshot.reminderLabel.clipPath).toBe("inset(50%)");
  expect(snapshot.reminderLabel.whiteSpace).toBe("nowrap");
  expect(snapshot.reminderPaint.background).toBe(snapshot.reminderPaint.surface);
  expect(snapshot.reminderPaint.color).toBe(snapshot.reminderPaint.text);
  expect(snapshot.reminderPaint.iconColor).toBe(snapshot.reminderPaint.primary);

  for (const button of snapshot.materialButtons) {
    expect(button.rect.height).toBeGreaterThanOrEqual(48);
    expect(button.whiteSpace).toBe("nowrap");
  }
  expectClose(snapshot.materialButtons[0].rect.height, snapshot.materialButtons[1].rect.height);
  expectClose(snapshot.materialButtons[0].rect.width, snapshot.materialButtons[1].rect.width);
}

function expectLibraryRoutesMatch(dictionary: LibraryGeometry, phrases: LibraryGeometry): void {
  expect(dictionary.appPaddingLeft).toBe(phrases.appPaddingLeft);
  expect(dictionary.appPaddingRight).toBe(phrases.appPaddingRight);
  expectRectInlineParity(phrases.catalog, dictionary.catalog);
  expectRectInlineParity(phrases.materials, dictionary.materials);
  expectRectInlineParity(phrases.materialsGroup, dictionary.materialsGroup);
  expectRectInlineParity(phrases.reminder, dictionary.reminder);

  expect(phrases.materialButtons.map((button) => button.label)).toEqual(
    dictionary.materialButtons.map((button) => button.label),
  );
  phrases.materialButtons.forEach((button, index) => {
    const reference = dictionary.materialButtons[index];
    expect(reference).toBeDefined();
    expectRectInlineParity(button.rect, reference.rect);
    expectClose(button.rect.height, reference.rect.height);
    expect(button.paddingLeft).toBe(reference.paddingLeft);
    expect(button.paddingRight).toBe(reference.paddingRight);
    expect(button.borderRadius).toBe(reference.borderRadius);
    expect(button.fontSize).toBe(reference.fontSize);
  });
}

async function readReminderRect(page: Page): Promise<RectSnapshot> {
  return page.locator(".lx-route-reminder-entry > summary").evaluate((summary) => {
    const rect = summary.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  });
}

async function expectLearnUsesSemanticControls(page: Page): Promise<void> {
  const configure = page.getByRole("button", { name: "Настроить урок", exact: true });
  await expect(configure).toBeVisible();
  await configure.click();
  await expect(page.locator(".lx-mode-selector")).toBeVisible();
  await expect(page.locator(".lx-source-selector")).toBeVisible();

  const result = await page.evaluate(() => {
    const switchLink = document.querySelector<HTMLElement>(".lx-learning-section-switch a.active, .lx-learning-section-switch a[aria-current='page']");
    const selectedMode = document.querySelector<HTMLElement>(".lx-mode-selector > button.selected");
    const selectedSource = document.querySelector<HTMLElement>(".lx-source-selector > button.selected");
    if (!switchLink || !selectedMode || !selectedSource) {
      throw new Error("Missing Learn semantic controls for Issue #583 proof");
    }

    const colorContext = document.createElement("canvas").getContext("2d");
    if (!colorContext) throw new Error("Canvas color normalization is unavailable");
    const rootStyle = getComputedStyle(document.documentElement);
    const normalizeColor = (value: string) => {
      colorContext.fillStyle = "#000000";
      colorContext.fillStyle = value.trim();
      return colorContext.fillStyle;
    };
    const resolve = (token: string) => normalizeColor(rootStyle.getPropertyValue(token));

    const switchStyle = getComputedStyle(switchLink);
    const modeStyle = getComputedStyle(selectedMode);
    const sourceStyle = getComputedStyle(selectedSource);
    return {
      primary: resolve("--ak-color-primary"),
      primarySoft: resolve("--ak-color-primary-soft"),
      text: resolve("--ak-color-text-main"),
      switchColor: normalizeColor(switchStyle.color),
      switchBackground: normalizeColor(switchStyle.backgroundColor),
      modeColor: normalizeColor(modeStyle.color),
      modeBackground: normalizeColor(modeStyle.backgroundColor),
      modeBorder: normalizeColor(modeStyle.borderColor),
      sourceColor: normalizeColor(sourceStyle.color),
      sourceBackground: normalizeColor(sourceStyle.backgroundColor),
      sourceBorder: normalizeColor(sourceStyle.borderColor),
    };
  });

  expect(result.switchColor).toBe(result.primary);
  expect(result.switchBackground).toBe(result.primarySoft);
  expect(result.modeColor).toBe(result.text);
  expect(result.modeBackground).toBe(result.primarySoft);
  expect(result.modeBorder).toBe(result.primary);
  expect(result.sourceColor).toBe(result.text);
  expect(result.sourceBackground).toBe(result.primarySoft);
  expect(result.sourceBorder).toBe(result.primary);
}

async function expectReminderPreviewFitsCompactViewport(page: Page): Promise<void> {
  const reminder = page.locator(".lx-route-reminder-entry");
  await reminder.locator(":scope > summary").click();
  const preview = reminder.getByRole("region", { name: "Текущее напоминание о занятии" });
  await expect(preview).toBeVisible();

  const rect = await preview.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    return {
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom,
      width: bounds.width,
      height: bounds.height,
    };
  });
  expect(rect.left).toBeGreaterThanOrEqual(13);
  expect(rect.right).toBeLessThanOrEqual(417);
  expect(rect.width).toBeGreaterThan(0);

  await reminder.locator(":scope > summary").click();
  await expect(preview).toBeHidden();
}

async function captureRouteEvidence(
  page: Page,
  testInfo: TestInfo,
  route: EvidenceRoute,
  appearance: Appearance,
): Promise<Readonly<{ width: number; height: number; sha256: string }>> {
  const profileButton = page.getByRole("button", { name: "Открыть профиль" });
  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: true,
    mask: await profileButton.count() > 0 ? [profileButton] : [],
    scale: "css",
  });
  const actual = {
    width: screenshot.readUInt32BE(16),
    height: screenshot.readUInt32BE(20),
    sha256: createHash("sha256").update(screenshot).digest("hex"),
  };
  const baseline = BASELINES_430[`${route}.${appearance}`];

  await testInfo.attach(`issue-583-${route}-${appearance}-430-webkit.png`, {
    body: screenshot,
    contentType: "image/png",
  });
  await testInfo.attach(`issue-583-${route}-${appearance}-430-webkit.json`, {
    body: Buffer.from(JSON.stringify({
      issue: 583,
      browser: "ios-webkit",
      route,
      appearance,
      viewport: { width: 430, height: 932 },
      actual,
      approved: baseline,
    }, null, 2)),
    contentType: "application/json",
  });

  if (!isReviewRequiredFingerprint(baseline.sha256)) {
    expect(actual).toEqual({
      width: baseline.width,
      height: baseline.height,
      sha256: baseline.sha256,
    });
  }

  return actual;
}

test.describe("Issue #583 compact Reminder and Library geometry", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
    await page.setViewportSize({ width: 430, height: 932 });
  });

  for (const appearance of ["light", "dark"] as const) {
    test(`430px Dictionary/Phrases/Learn continuity — ${appearance}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "ios-webkit", "Issue #583 requires real 430px iOS WebKit proof");

      await installAppearance(page, appearance);
      const runtimeErrors = captureRuntimeErrors(page);
      const evidence: Partial<Record<EvidenceRoute, Readonly<{ width: number; height: number; sha256: string }>>> = {};

      await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
      await settleRoute(page, "dictionary", appearance);
      const dictionary = await readLibraryGeometry(page, "dictionary");
      expectLibraryGeometryIsCompact(dictionary);
      evidence.dictionary = await captureRouteEvidence(page, testInfo, "dictionary", appearance);

      await page.locator(".lx-catalog-kind-navigation").getByRole("button", { name: "Рабочие фразы", exact: true }).click();
      await settleRoute(page, "phrases", appearance);
      const phrases = await readLibraryGeometry(page, "phrases");
      expectLibraryGeometryIsCompact(phrases);
      expectLibraryRoutesMatch(dictionary, phrases);
      evidence.phrases = await captureRouteEvidence(page, testInfo, "phrases", appearance);

      await page.locator(".lx-catalog-kind-navigation").getByRole("button", { name: "Слова и термины", exact: true }).click();
      await settleRoute(page, "dictionary", appearance);
      expectLibraryRoutesMatch(dictionary, await readLibraryGeometry(page, "dictionary"));

      await page.goBack();
      await settleRoute(page, "phrases", appearance);
      expectLibraryRoutesMatch(dictionary, await readLibraryGeometry(page, "phrases"));

      await page.goForward();
      await settleRoute(page, "dictionary", appearance);
      expectLibraryRoutesMatch(dictionary, await readLibraryGeometry(page, "dictionary"));

      await page.reload({ waitUntil: "domcontentloaded" });
      await settleRoute(page, "dictionary", appearance);
      expectLibraryRoutesMatch(dictionary, await readLibraryGeometry(page, "dictionary"));

      await page.goto("/phrases", { waitUntil: "domcontentloaded" });
      await settleRoute(page, "phrases", appearance);
      expectLibraryRoutesMatch(dictionary, await readLibraryGeometry(page, "phrases"));

      await page.goto("/learn", { waitUntil: "domcontentloaded" });
      await settleRoute(page, "learn", appearance);
      const learnReminder = await readReminderRect(page);
      expectRectInlineParity(learnReminder, dictionary.reminder);
      expectClose(learnReminder.height, dictionary.reminder.height);
      await expectLearnUsesSemanticControls(page);
      await expectReminderPreviewFitsCompactViewport(page);
      evidence.learn = await captureRouteEvidence(page, testInfo, "learn", appearance);

      expect(runtimeErrors).toEqual([]);

      const reviewRequired = (Object.keys(evidence) as EvidenceRoute[]).filter((route) =>
        isReviewRequiredFingerprint(BASELINES_430[`${route}.${appearance}`].sha256),
      );
      if (reviewRequired.length > 0) {
        throw new Error(
          `Issue #583 ${appearance} 430px REVIEW_REQUIRED exact Linux WebKit evidence ${JSON.stringify(evidence)}`,
        );
      }
    });
  }
});
