from pathlib import Path

path = Path("frontend/e2e/lesson-flow.spec.ts")
source = path.read_text(encoding="utf-8")
old = '  await expect(second.getByRole("alert")).toContainText("Урок изменён на другом устройстве");'
new = '  await expect(second.locator(".lx-error[role=\\"alert\\"]")).toContainText("Урок изменён на другом устройстве");'
count = source.count(old)
if count != 1:
    raise RuntimeError(f"expected one stale-device alert locator, found {count}")
path.write_text(source.replace(old, new), encoding="utf-8")
print("Issue 39 Playwright alert locator fixed")
