import { expect, test } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ context, page }) => {
  await installDeterministicRuntime(page);
  await installQualityGateAPI(context);
});

test("guest Home presents an account benefit instead of an endless progress loader", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await installDeterministicRuntime(page);
  await installQualityGateAPI(context, { authenticated: false });

  await page.goto("/");
  await expect(page.getByRole("status", { name: "Персональный прогресс доступен после входа" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
  await expect(page.getByText("Синхронизируем очередь", { exact: true })).toHaveCount(0);

  await context.close();
});

test("Home exposes one dominant next action and three unambiguous destinations", async ({ page }) => {
  const runtimeErrors = captureRuntimeErrors(page);
  await page.goto("/");

  const nextAction = page.getByRole("region", { name: "Следующее рекомендуемое действие" });
  await expect(nextAction.getByRole("button", { name: "Повторить сейчас" })).toBeVisible();
  await expect(nextAction.locator(".lx-button.primary")).toHaveCount(1);
  const staticWordPreview = nextAction.locator(".lx-word-preview");
  await expect(staticWordPreview).toHaveCount(1);
  await expect(staticWordPreview.locator(".lx-dots, [role='tablist'], [aria-roledescription='carousel']")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Назначение основных разделов" })).toContainText("Настройте урок");
  await expect(page.getByRole("region", { name: "Назначение основных разделов" })).toContainText("Найдите материал");
  await expect(page.getByRole("region", { name: "Назначение основных разделов" })).toContainText("Проверьте результат");

  const primaryLinks = page.locator('.lx-route-nav--header [data-navigation-view], .lx-route-nav--rail [data-navigation-view], .lx-route-nav--mobile [data-navigation-view]');
  await expect(primaryLinks.first()).toBeAttached();
  expect(await primaryLinks.evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("data-navigation-view")))].sort())).toEqual(["home", "learn", "library", "progress"]);
  expect(runtimeErrors).toEqual([]);
});

test("a new user can find a word without entering a duplicate lesson setup", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Найти материал" }).click();
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();

  await page.getByRole("searchbox", { name: "Поиск по словарю" }).fill("rollback");
  await page.getByRole("button", { name: "Найти" }).click();
  await page.getByRole("button", { name: "Открыть карточку: rollback" }).click();
  await expect(page).toHaveURL(/\/words\/101/);
  await expect(page.getByRole("heading", { name: "rollback" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Изучить это слово|Повторить это слово/ })).toHaveCount(0);

  await page.getByRole("button", { name: "Настроить урок по этой теме" }).click();
  await expect(page).toHaveURL(/\/learn\?source=mixed&topic=Release|\/learn\?topic=Release&source=mixed/);
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Контекст из каталога" })).toContainText("Release");
});

test("phrases are a dictionary catalog kind rather than a competing top-level section", async ({ page }) => {
  await page.goto("/dictionary");
  const switcher = page.getByRole("navigation", { name: "Тип каталога" });
  await expect(switcher.getByRole("button", { name: "Слова и термины" })).toHaveAttribute("aria-current", "page");
  await switcher.getByRole("button", { name: "Рабочие фразы" }).click();
  await expect(page).toHaveURL(/\/phrases$/);
  await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Тип каталога" }).getByRole("button", { name: "Рабочие фразы" })).toHaveAttribute("aria-current", "page");
});

test("catalog context reaches the composer and analytics sends only allow-listed dimensions", async ({ context, page }) => {
  let payload: Record<string, unknown> | null = null;
  await page.addInitScript(() => {
    window.sessionStorage.setItem("lexigo:rum-sampled:v1", "1");
  });
  await context.route("**/api/v1/product/journey", async (route) => {
    payload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 202, body: "" });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Найти материал" }).click();
  await expect.poll(() => payload).not.toBeNull();
  expect(payload).toMatchObject({
    fromRoute: "/",
    toRoute: "/dictionary",
    intent: "home_find_material",
    backtrack: false,
  });
  expect(payload).not.toHaveProperty("userId");
  expect(payload).not.toHaveProperty("sessionId");
  expect(payload).not.toHaveProperty("query");
  expect(payload).not.toHaveProperty("url");
});
