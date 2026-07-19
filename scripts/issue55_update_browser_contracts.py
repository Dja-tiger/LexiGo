from pathlib import Path

ui = Path("frontend/e2e/ui-ownership.spec.ts")
text = ui.read_text()
old_test = '''test("collections remain unique through repeated React navigation and rerenders", async ({ page }) => {
  const runtimeErrors = watchRuntimeErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await expect(page.locator('[data-lexigo-collection]')).toHaveCount(4);

    await visibleNavigation(page).getByRole("button", { name: "Словарь", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Материалы, организованные по учебной задаче" })).toBeVisible();
    await expect(page.locator('[data-lexigo-collection]')).toHaveCount(4);

    await visibleNavigation(page).getByRole("button", { name: "Главная", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();
  }

  await page.getByRole("button", { name: /Путешествия/ }).click();
  await expect(page).toHaveURL(/view=learn&source=travel/);
  await expect(page.locator('[data-lexigo-collection]')).toHaveCount(4);
  await expect(page.locator('[data-lexigo-collection="travel"]')).toHaveAttribute("aria-checked", "true");
  expect(runtimeErrors).toEqual([]);
});'''
new_test = '''test("home collections and the dictionary catalog remain unique through React navigation", async ({ page }) => {
  const runtimeErrors = watchRuntimeErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await expect(page.locator('[data-lexigo-collection]')).toHaveCount(4);

    await visibleNavigation(page).getByRole("button", { name: "Словарь", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Каталог слов и терминов" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Результаты словаря" }).getByRole("listitem")).toHaveCount(3);
    await expect(page.locator(".lx-dictionary-toolbar")).toHaveCount(1);

    await visibleNavigation(page).getByRole("button", { name: "Главная", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();
  }

  await page.getByRole("button", { name: /Путешествия/ }).click();
  await expect(page).toHaveURL(/view=learn&source=travel/);
  await expect(page.locator('[data-lexigo-collection]')).toHaveCount(4);
  await expect(page.locator('[data-lexigo-collection="travel"]')).toHaveAttribute("aria-checked", "true");
  expect(runtimeErrors).toEqual([]);
});'''
if old_test not in text:
    raise SystemExit("old UI ownership dictionary test was not found")
text = text.replace(old_test, new_test, 1)

old_counter = '''test("catalog counters come from public metadata without DOM rewriting", async ({ page }) => {
  await page.goto("/?view=library");
  await expect(page.getByText("3 слова и 3 технические фразы с общей системой повторений.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("799");
  await expect(page.locator("body")).not.toContainText("579");
});'''
new_counter = '''test("dictionary counts come from authenticated resources without fallback DOM rewriting", async ({ page }) => {
  await page.goto("/?view=library");
  await expect(page.getByRole("heading", { name: "Каталог слов и терминов" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Результаты словаря" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.getByText("0 слов освоено", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("799");
  await expect(page.locator("body")).not.toContainText("579");
});'''
if old_counter not in text:
    raise SystemExit("old catalog counter test was not found")
ui.write_text(text.replace(old_counter, new_counter, 1))

accessibility = Path("frontend/e2e/accessibility-keyboard.spec.ts")
text = accessibility.read_text()
old_heading = '{ name: "library", url: "/?view=library", heading: "Материалы, организованные по учебной задаче" },'
new_heading = '{ name: "library", url: "/?view=library", heading: "Каталог слов и терминов" },'
if old_heading not in text:
    raise SystemExit("old accessibility dictionary heading was not found")
text = text.replace(old_heading, new_heading, 1)

marker = 'test("progress indicators expose names, ranges and current values", async ({ page }) => {'
if marker not in text:
    raise SystemExit("accessibility insertion marker was not found")
keyboard_test = '''test("dictionary filters and item cards remain keyboard operable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Native select and deep-link focus flow are asserted once in Chromium.");
  await page.goto("/?view=library");
  await expect(page.getByRole("heading", { name: "Каталог слов и терминов" })).toBeVisible();

  const source = page.getByRole("combobox", { name: "Раздел словаря" });
  await source.focus();
  await source.selectOption("backend");
  await expect(page).toHaveURL(/source=backend/);

  const firstCard = page.getByRole("button", { name: /Открыть карточку:/ }).first();
  await firstCard.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/detail=/);
  await expect(page.locator(".lx-dictionary-detail-card h1")).toHaveAttribute("lang", "en");

  const back = page.getByRole("button", { name: "← К результатам" });
  await back.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/view=library/);
  await expect(page).toHaveURL(/source=backend/);
  await expect(page.getByRole("list", { name: "Результаты словаря" })).toBeVisible();
  await expectNoPositiveTabIndex(page);
});

'''
text = text.replace(marker, keyboard_test + marker, 1)
accessibility.write_text(text)
