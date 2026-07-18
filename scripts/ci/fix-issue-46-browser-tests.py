from pathlib import Path

path = Path("frontend/e2e/route-focus-management.spec.ts")
content = path.read_text()

old_navigation = '''  await expect(page.locator(".lx-nav").getByRole("button", { name: "Обучение", exact: true }))
    .toHaveAttribute("aria-current", "page");
  await expect(page.locator(".lx-mobile-nav").getByRole("button", { name: "Учить", exact: true }))
    .toHaveAttribute("aria-current", "page");'''
new_navigation = '''  await expect(page.locator(".lx-nav").getByRole("button", {
    name: "Обучение",
    exact: true,
    includeHidden: true,
  })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".lx-mobile-nav").getByRole("button", {
    name: "Учить",
    exact: true,
    includeHidden: true,
  })).toHaveAttribute("aria-current", "page");'''

old_motion = '''  const transitionDuration = await page.getByRole("link", {
    name: "Перейти к основному содержимому",
  }).evaluate((element) => window.getComputedStyle(element).transitionDuration);
  expect(["0s", "0.00001s"]).toContain(transitionDuration);'''
new_motion = '''  const transitionDuration = await page.getByRole("link", {
    name: "Перейти к основному содержимому",
  }).evaluate((element) => window.getComputedStyle(element).transitionDuration);
  const maximumTransitionSeconds = Math.max(
    ...transitionDuration.split(",").map((duration) => Number.parseFloat(duration)),
  );
  expect(maximumTransitionSeconds).toBeLessThanOrEqual(0.00001);'''

for old, new, label in [
    (old_navigation, new_navigation, "responsive navigation assertions"),
    (old_motion, new_motion, "reduced motion duration assertion"),
]:
    if old not in content:
        raise SystemExit(f"{label}: expected block was not found")
    content = content.replace(old, new, 1)

path.write_text(content)
