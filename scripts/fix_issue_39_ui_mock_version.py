from pathlib import Path

path = Path("frontend/e2e/ui-ownership.spec.ts")
source = path.read_text(encoding="utf-8")
old = '''          lessonSize: input.lessonSize,
          currentIndex: 0,
          status: "active",
'''
new = '''          lessonSize: input.lessonSize,
          currentIndex: 0,
          version: 1,
          status: "active",
'''
count = source.count(old)
if count != 1:
    raise RuntimeError(f"expected one UI lesson fixture, found {count}")
path.write_text(source.replace(old, new), encoding="utf-8")
print("Issue 39 UI ownership lesson version fixed")
