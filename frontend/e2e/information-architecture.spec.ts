import { expect, test, type Page } from "@playwright/test";

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

async function clickPrimaryNavigation(page: Page, view: "learn" | "library" | "progress") {
  const links = page.locator(`.lx-route-nav [data-navigation-view="${view}"]`);
  const count = await links.count();
  for (let index = 0; index < count; index += 1) {
    const link = links.nth(index);
    if (await link.isVisible()) {
      await link.click();
      return;
    }
  }
  throw new Error(`No visible primary navigation for ${view}`);
}

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

test("Home exposes one dominant next action and delegates destinations to the application shell", async ({ page }) => {
  const runtimeErrors = captureRuntimeErrors(page);
  await page.goto("/");

  const nextAction = page.getByRole("region", { name: "Следующее рекомендуемое действие" });
  await expect(nextAction.getByRole("button", { name: "Повторить 4", exact: true })).toBeVisible();
  await expect(nextAction.locator(".lx-button.primary")).toHaveCount(1);
  const secondaryProcesses = nextAction.getByRole("group", { name: "Другие доступные учебные процессы" });
  await expect(secondaryProcesses.getByRole("button")).toHaveCount(2);
  await expect(secondaryProcesses.getByRole("button", { name: "Разобрать 2 слабых мест", exact: true })).toBeVisible();
  await expect(secondaryProcesses.getByRole("button", { name: "Изучить 15 новых из 18", exact: true })).toBeVisible();

  // Home is not a dashboard or a duplicate catalogue. The route shell owns
  // access to Learn, Dictionary and Progress, while Home owns the next action.
  await expect(nextAction.locator(".lx-word-preview")).toBeHidden();
  await expect(page.getByRole("region", { name: "Назначение основных разделов" })).toBeHidden();

  const primaryLinks = page.locator(
    ".lx-route-nav--header [data-navigation-view], "
    + ".lx-route-nav--rail [data-navigation-view], "
    + ".lx-route-nav--mobile [data-navigation-view]",
  );
  await expect(primaryLinks.first()).toBeAttached();
  expect(await primaryLinks.evaluateAll((links) => (
    [...new Set(links.map((link) => link.getAttribute("data-navigation-view")))].sort()
  ))).toEqual(["home", "learn", "library", "progress"]);
  expect(runtimeErrors).toEqual([]);
});

test("a new user can find a word through the application shell without entering lesson setup", async ({ page }) => {
  await page.goto("/");
  await clickPrimaryNavigation(page, "library");
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.getByRole("heading", { level: 1, name: "Словарь" })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Поиск по словарю" });
  await search.fill("rollback");
  await search.press("Enter");
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
  const switcher = page.getByRole("navigation", { name: "Быстрые фильтры словаря" });
  await expect(switcher.getByRole("button", { name: "Слова", exact: true })).toHaveAttribute("aria-current", "page");
  await switcher.getByRole("button", { name: "Фразы", exact: true }).click();
  await expect(page).toHaveURL(/\/phrases$/);
  await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Тип каталога" }).getByRole("button", { name: "Рабочие фразы" })).toHaveAttribute("aria-current", "page");
});

test("shell navigation analytics sends only allow-listed dimensions", async ({ context, page }) => {
  let payload: Record<string, unknown> | null = null;
  await page.addInitScript(() => {
    window.sessionStorage.setItem("lexigo:rum-sampled:v1", "1");
  });
  await context.route("**/api/v1/product/journey", async (route) => {
    payload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 202, body: "" });
  });

  await page.goto("/");
  await clickPrimaryNavigation(page, "library");
  await expect.poll(() => payload).not.toBeNull();
  expect(payload).toMatchObject({
    fromRoute: "/",
    toRoute: "/dictionary",
    intent: "primary_navigation",
    backtrack: false,
  });
  expect(payload).not.toHaveProperty("userId");
  expect(payload).not.toHaveProperty("sessionId");
  expect(payload).not.toHaveProperty("query");
  expect(payload).not.toHaveProperty("url");
});
