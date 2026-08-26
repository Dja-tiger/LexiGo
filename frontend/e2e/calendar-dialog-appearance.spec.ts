import { expect, test, type Page } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type Appearance = "light" | "dark";

type DialogAppearanceSnapshot = Readonly<{
  appearance: Appearance;
  geometry: Readonly<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
  clientWidth: number;
  documentWidth: number;
  backdrop: string;
  modal: Readonly<{ background: string; color: string }>;
  input: Readonly<{ background: string; color: string }>;
  select: Readonly<{ background: string; color: string; colorScheme: string }>;
  weekday: Readonly<{ background: string; color: string; border: string }>;
  preview: Readonly<{ background: string; label: string; copy: string }>;
  google: Readonly<{ background: string; color: string }>;
  apple: Readonly<{ background: string; color: string }>;
  privacy: Readonly<{ background: string; color: string }>;
  tokens: Readonly<{
    surface: string;
    subtle: string;
    primary: string;
    primarySoft: string;
    text: string;
    muted: string;
  }>;
}>;

async function installInitialAppearance(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("lexigo.appearance.v1", "light");
    localStorage.setItem("lexigo.calendar.reminder.v1", JSON.stringify({
      time: "19:00",
      durationMinutes: 20,
      reminderMinutes: 10,
      recurrence: "custom",
      weekdays: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
    }));
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
}

async function switchAppearance(page: Page, appearance: Appearance): Promise<void> {
  await page.evaluate((value) => {
    localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
  await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function openCalendarDialog(page: Page): Promise<void> {
  const reminder = page.locator(".lx-route-reminder-entry");
  const disclosure = reminder.locator(":scope > summary");
  await expect(disclosure).toBeVisible();
  await disclosure.click();

  const preview = reminder.getByRole("region", { name: "Текущее напоминание о занятии" });
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: "Настроить календарь", exact: true }).click();

  await expect(page.getByRole("dialog", { name: "Напоминание об английском" })).toBeVisible();
}

async function snapshotDialog(page: Page, appearance: Appearance): Promise<DialogAppearanceSnapshot> {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await expect(page.getByRole("heading", { level: 1, name: "Прогресс", exact: true })).toBeVisible();

  await openCalendarDialog(page);
  await expect(page.locator(".lx-calendar-weekdays button.selected").first()).toBeVisible();

  return page.evaluate((currentAppearance) => {
    const root = document.documentElement;
    const modal = document.querySelector<HTMLElement>(".lx-calendar-modal");
    const backdrop = document.querySelector<HTMLElement>(".lx-calendar-modal-backdrop");
    const input = document.querySelector<HTMLInputElement>(".lx-calendar-form-grid input");
    const select = document.querySelector<HTMLSelectElement>(".lx-calendar-form-grid select");
    const weekday = document.querySelector<HTMLButtonElement>(".lx-calendar-weekdays button.selected");
    const preview = document.querySelector<HTMLElement>(".lx-calendar-preview");
    const previewLabel = preview?.querySelector<HTMLElement>(":scope > span");
    const previewCopy = preview?.querySelector<HTMLElement>(":scope > small");
    const google = document.querySelector<HTMLElement>(".lx-calendar-provider-grid .google > span");
    const apple = document.querySelector<HTMLElement>(".lx-calendar-provider-grid .apple > span");
    const privacy = document.querySelector<HTMLElement>(".lx-calendar-privacy-note");

    if (
      !modal || !backdrop || !input || !select || !weekday || !preview
      || !previewLabel || !previewCopy || !google || !apple || !privacy
    ) {
      throw new Error("Missing Calendar appearance owner");
    }

    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Canvas color normalization is unavailable");

    const normalizeColor = (value: string) => {
      context.fillStyle = "#000000";
      context.fillStyle = value.trim();
      return context.fillStyle;
    };
    const rootStyle = getComputedStyle(root);
    const token = (name: string) => normalizeColor(rootStyle.getPropertyValue(name));
    const paint = (element: Element) => {
      const style = getComputedStyle(element);
      return {
        background: normalizeColor(style.backgroundColor),
        color: normalizeColor(style.color),
      };
    };
    const rect = modal.getBoundingClientRect();
    const weekdayStyle = getComputedStyle(weekday);
    const selectStyle = getComputedStyle(select);

    return {
      appearance: currentAppearance,
      geometry: {
        left: Math.round(rect.left * 100) / 100,
        top: Math.round(rect.top * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
      },
      clientWidth: root.clientWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      backdrop: normalizeColor(getComputedStyle(backdrop).backgroundColor),
      modal: paint(modal),
      input: paint(input),
      select: {
        ...paint(select),
        colorScheme: selectStyle.colorScheme,
      },
      weekday: {
        ...paint(weekday),
        border: normalizeColor(weekdayStyle.borderTopColor),
      },
      preview: {
        background: normalizeColor(getComputedStyle(preview).backgroundColor),
        label: normalizeColor(getComputedStyle(previewLabel).color),
        copy: normalizeColor(getComputedStyle(previewCopy).color),
      },
      google: paint(google),
      apple: paint(apple),
      privacy: paint(privacy),
      tokens: {
        surface: token("--ak-color-surface"),
        subtle: token("--ak-color-subtle"),
        primary: token("--ak-color-primary"),
        primarySoft: token("--ak-color-primary-soft"),
        text: token("--ak-color-text-main"),
        muted: token("--ak-color-text-muted"),
      },
    } satisfies DialogAppearanceSnapshot;
  }, appearance);
}

function expectSemanticPaint(snapshot: DialogAppearanceSnapshot): void {
  expect(snapshot.documentWidth).toBeLessThanOrEqual(snapshot.clientWidth + 1);

  expect(snapshot.modal.background).toBe(snapshot.tokens.surface);
  expect(snapshot.modal.color).toBe(snapshot.tokens.text);
  expect(snapshot.input.background).toBe(snapshot.tokens.surface);
  expect(snapshot.input.color).toBe(snapshot.tokens.text);
  expect(snapshot.select.background).toBe(snapshot.tokens.surface);
  expect(snapshot.select.color).toBe(snapshot.tokens.text);
  expect(snapshot.select.colorScheme).not.toBe("dark");

  expect(snapshot.weekday.background).toBe(snapshot.tokens.primarySoft);
  expect(snapshot.weekday.color).toBe(snapshot.tokens.text);
  expect(snapshot.weekday.border).toBe(snapshot.tokens.primary);

  expect(snapshot.preview.label).toBe(snapshot.tokens.primary);
  expect(snapshot.preview.copy).toBe(snapshot.tokens.muted);
  expect(snapshot.google.background).toBe(snapshot.tokens.primarySoft);
  expect(snapshot.google.color).toBe(snapshot.tokens.primary);
  expect(snapshot.apple.background).toBe(snapshot.tokens.subtle);
  expect(snapshot.apple.color).toBe(snapshot.tokens.muted);
  expect(snapshot.privacy.color).toBe(snapshot.tokens.muted);

  expect(snapshot.backdrop).not.toBe("rgba(0, 0, 0, 0)");
  expect(snapshot.preview.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(snapshot.privacy.background).not.toBe("rgba(0, 0, 0, 0)");
}

test.describe("Issue #695 Calendar dialog semantic appearance", () => {
  test.describe.configure({ timeout: 90_000 });

  test("opened Calendar dialog follows explicit Light/Dark tokens without geometry drift", async ({ context, page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
    await page.setViewportSize({ width: 390, height: 844 });
    await installInitialAppearance(page);

    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    const light = await snapshotDialog(page, "light");
    expectSemanticPaint(light);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Напоминание об английском" })).toBeHidden();

    await switchAppearance(page, "dark");
    const dark = await snapshotDialog(page, "dark");
    expectSemanticPaint(dark);

    expect(dark.geometry).toEqual(light.geometry);
    expect(dark.backdrop).not.toBe(light.backdrop);
    expect(dark.modal.background).not.toBe(light.modal.background);
    expect(dark.preview.background).not.toBe(light.preview.background);
    expect(dark.privacy.background).not.toBe(light.privacy.background);
    expect(runtimeErrors).toEqual([]);
  });
});