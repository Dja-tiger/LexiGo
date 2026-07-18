from pathlib import Path

path = Path("frontend/components/lexigo-premium-app.tsx")
text = path.read_text()

old = """      setLessonQueueNotice("Чтобы перейти в другой раздел, нажмите «Сохранить и выйти».");
      window.requestAnimationFrame(() => mainContentRef.current?.focus({ preventScroll: true }));
      return;
"""
new = """      setLessonQueueNotice("Чтобы перейти в другой раздел, нажмите «Сохранить и выйти».");
      setPendingNavigation({
        identity: navigationIdentity(navigation),
        scroll: { x: window.scrollX, y: window.scrollY },
        behavior: "auto",
      });
      return;
"""

count = text.count(old)
if count != 1:
    raise SystemExit(f"lesson navigation focus correction: expected one match, found {count}")

text = text.replace(old, new, 1)
if "requestAnimationFrame(() => mainContentRef.current" in text:
    raise SystemExit("render callback still closes over mainContentRef")

path.write_text(text)
