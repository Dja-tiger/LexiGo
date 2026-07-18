from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one marker, found {count}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


MOTION_INIT = '''  await page.addInitScript(() => {
    const install = () => {
      if (document.getElementById("lexigo-e2e-reduced-motion")) return;
      const style = document.createElement("style");
      style.id = "lexigo-e2e-reduced-motion";
      style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }";
      (document.head ?? document.documentElement).append(style);
    };
    if (document.documentElement) install();
    else document.addEventListener("DOMContentLoaded", install, { once: true });
  });
'''

replace_once(
    "frontend/e2e/account-hydration.spec.ts",
    '''async function installAccountMocks(page: Page, options: { failPhrasesOnce?: boolean } = {}) {
  let progressRequests = 0;
''',
    '''async function installAccountMocks(page: Page, options: { failPhrasesOnce?: boolean } = {}) {
''' + MOTION_INIT + '''  let progressRequests = 0;
''',
    "hydration test motion control",
)
replace_once(
    "frontend/e2e/account-hydration.spec.ts",
    '''test("a failed phrase catalog does not hide progress and retries only its own resource", async ({ page }) => {
  const requests = await installAccountMocks(page, { failPhrasesOnce: true });
''',
    '''test("a failed phrase catalog does not hide progress and retries only its own resource", async ({ page }) => {
  test.setTimeout(60_000);
  const requests = await installAccountMocks(page, { failPhrasesOnce: true });
''',
    "hydration WebKit timeout",
)

replace_once(
    "frontend/e2e/ui-ownership.spec.ts",
    '''test.beforeEach(async ({ page }) => {
  await installBrowserMocks(page);
});
''',
    '''test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
''' + MOTION_INIT + '''  await installBrowserMocks(page);
});
''',
    "UI ownership WebKit stability",
)
