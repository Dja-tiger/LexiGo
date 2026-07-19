import { expect, test } from "@playwright/test";

test("privacy policy is public, readable and linked to the support address", async ({ page }) => {
  await page.goto("/privacy");

  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Политика конфиденциальности" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Какие данные обрабатываются" })).toBeVisible();
  await expect(page.getByRole("link", { name: "lexigo.notifications@gmail.com" }))
    .toHaveAttribute("href", "mailto:lexigo.notifications@gmail.com");
  await expect(page.getByRole("link", { name: "Условия использования" }))
    .toHaveAttribute("href", "/terms");
});

test("terms are public and legal navigation works without an account", async ({ page }) => {
  await page.goto("/terms");

  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole("heading", { name: "Условия использования" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Аккаунт" })).toBeVisible();
  await page.getByRole("link", { name: "Конфиденциальность" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Политика конфиденциальности" })).toBeVisible();
});
