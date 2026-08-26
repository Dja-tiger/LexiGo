import { createHash } from "node:crypto";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type ExplicitAppearance = "light" | "dark";
type ConfirmationVisualKey =
  | "compact-light"
  | "compact-dark"
  | "desktop-light"
  | "desktop-dark";

type ConfirmationVisualCase = Readonly<{
  key: ConfirmationVisualKey;
  project: "visual-compact" | "visual-desktop";
  appearance: ExplicitAppearance;
  width: number;
  height: number;
  openPencilNode: "fig_4305" | "fig_4157";
  designContract: string;
  approvedSha256: readonly string[];
}>;

const CASES: readonly ConfirmationVisualCase[] = [
  {
    key: "compact-light",
    project: "visual-compact",
    appearance: "light",
    width: 390,
    height: 844,
    openPencilNode: "fig_4305",
    designContract: "Profile mobile Light / Foundation semantic confirmation surface",
    approvedSha256: ["pending-linux-review-compact-light"],
  },
  {
    key: "compact-dark",
    project: "visual-compact",
    appearance: "dark",
    width: 390,
    height: 844,
    openPencilNode: "fig_4305",
    designContract: "Profile mobile Dark token-derived confirmation surface",
    approvedSha256: ["pending-linux-review-compact-dark"],
  },
  {
    key: "desktop-light",
    project: "visual-desktop",
    appearance: "light",
    width: 1440,
    height: 1024,
    openPencilNode: "fig_4157",
    designContract: "Profile desktop Light / Foundation semantic confirmation surface",
    approvedSha256: ["pending-linux-review-desktop-light"],
  },
  {
    key: "desktop-dark",
    project: "visual-desktop",
    appearance: "dark",
    width: 1440,
    height: 1024,
    openPencilNode: "fig_4157",
    designContract: "Profile desktop Dark token-derived confirmation surface",
    approvedSha256: ["pending-linux-review-desktop-dark"],
  },
] as const;

async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
  await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
}

async function openStableConfirmation(page: Page, visualCase: ConfirmationVisualCase): Promise<void> {
  await page.setViewportSize({ width: visualCase.width, height: visualCase.height });
  await installAppearance(page, visualCase.appearance);
  await page.goto("/profile#email_change_token=visual-proof", { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", visualCase.appearance);
  await expect(page.locator("html")).toHaveAttribute(
    "data-lexigo-resolved-appearance",
    visualCase.appearance,
  );
  await expect(page.locator('[data-route-client-island="profile"]')).toBeVisible();
  await expect(page.getByRole("region", { name: "Подтвердить новый адрес" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Подтвердить новый адрес" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Подтвердить email", exact: true })).toBeEnabled();

  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });

  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function expectApprovedLinuxFingerprint(
  page: Page,
  testInfo: TestInfo,
  visualCase: ConfirmationVisualCase,
): Promise<void> {
  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    scale: "css",
  });
  await testInfo.attach(`profile-email-confirmation-${visualCase.key}.png`, {
    body: screenshot,
    contentType: "image/png",
  });

  const actualSha256 = createHash("sha256").update(screenshot).digest("hex");
  expect(
    visualCase.approvedSha256,
    `Profile email confirmation ${visualCase.key} changed from the reviewed OpenPencil ${visualCase.openPencilNode} / Foundation semantic contract; actual sha256=${actualSha256}`,
  ).toContain(actualSha256);
}

test.describe("Issue #698 Profile email confirmation Linux visual evidence", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const visualCase of CASES) {
    test(`${visualCase.key} matches reviewed semantic confirmation evidence`, async ({ context, page }, testInfo) => {
      test.skip(
        testInfo.project.name !== visualCase.project,
        `${visualCase.key} is authoritative only in ${visualCase.project}`,
      );

      testInfo.annotations.push({
        type: "openpencil",
        description: `${visualCase.openPencilNode}: ${visualCase.designContract}`,
      });

      await installDeterministicRuntime(page);
      await installQualityGateAPI(context);
      const runtimeErrors = captureRuntimeErrors(page);

      await openStableConfirmation(page, visualCase);
      await expectApprovedLinuxFingerprint(page, testInfo, visualCase);
      expect(runtimeErrors).toEqual([]);
    });
  }
});
