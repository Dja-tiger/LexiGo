from pathlib import Path

path = Path("frontend/e2e/speech-player.spec.ts")
source = path.read_text()
old = '  await page.getByRole("button", { name: "Технические фразы" }).click();\n'
new = '  await page.locator(\'[data-navigation-view="phrases"]:visible\').click();\n'
count = source.count(old)
if count != 1:
    raise RuntimeError(f"speech navigation locator: expected one match, found {count}")
path.write_text(source.replace(old, new, 1))
