import { expect, test } from "@playwright/test";

import {
  captureRuntimeErrors,
  installQualityGateAPI,
} from "./support/quality-gates";

test("dictionary route island keeps one session bootstrap across route transitions", async ({ context, page }) => {
  await installQualityGateAPI(context);
  const runtimeErrors = captureRuntimeErrors(page);
  let refreshRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/v1/auth/refresh") refreshRequests += 1;
  });

  await page.goto("/dictionary");

  await expect(page.locator('[data-route-client-island="dictionary"]')).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "Находите и изучайте материал в контексте" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Результаты словаря" }).getByRole("listitem")).toHaveCount(3);
  await expect.poll(() => refreshRequests).toBe(1);

  const routeNavigation = page.locator(".lx-route-nav:visible");
  await routeNavigation.getByRole("link", { name: "Главная", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-route-client-island="dictionary"]')).toHaveCount(0);
  await expect(page.getByRole("heading", {
    level: 1,
    name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/,
  })).toBeVisible();

  await routeNavigation.getByRole("link", { name: "Словарь", exact: true }).click();
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.locator('[data-route-client-island="dictionary"]')).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "Находите и изучайте материал в контексте" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.locator('[data-route-client-island="dictionary"]')).toHaveCount(1);

  expect(refreshRequests).toBe(1);
  expect(runtimeErrors).toEqual([]);
});
