#!/usr/bin/env python3
"""Apply confirmed Issue #193 fixes from frontend-core diagnostics."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRESENTATION = ROOT / "frontend" / "components" / "active-lesson-presentation.tsx"
PREMIUM = ROOT / "frontend" / "components" / "lexigo-premium-app.tsx"
CONTRACT = ROOT / "frontend" / "app" / "active-lesson.test.ts"


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


def main() -> None:
    source = PRESENTATION.read_text(encoding="utf-8")
    global_listener = '''  useEffect(() => {
    if (!exitOpen) return;
    cancelExitRef.current?.focus({ preventScroll: true });
    const dialog = exitDialogRef.current;
    if (!dialog) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelExit();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusableElements(dialog);
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [cancelExit, exitOpen]);
'''
    local_focus = '''  useEffect(() => {
    if (!exitOpen) return;
    cancelExitRef.current?.focus({ preventScroll: true });
  }, [exitOpen]);
'''
    source = replace_once(source, global_listener, local_focus, "global keydown listener")

    recall_handler = '''  function handleRecallKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !typedAnswer.trim()) return;
    event.preventDefault();
    onReveal();
  }
'''
    dialog_handler = recall_handler + '''
  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelExit();
      return;
    }
    if (event.key !== "Tab") return;
    const dialog = exitDialogRef.current;
    if (!dialog) return;
    const controls = focusableElements(dialog);
    if (controls.length === 0) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && event.target === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      first.focus();
    }
  }
'''
    source = replace_once(source, recall_handler, dialog_handler, "React dialog keydown handler")
    source = replace_once(
        source,
        '            aria-describedby="active-lesson-exit-description"\n          >',
        '            aria-describedby="active-lesson-exit-description"\n            onKeyDown={handleDialogKeyDown}\n          >',
        "dialog keydown binding",
    )
    PRESENTATION.write_text(source, encoding="utf-8")

    premium = PREMIUM.read_text(encoding="utf-8")
    premium = replace_once(premium, "  ratingLabel,\n", "", "unused ratingLabel import")
    premium = replace_once(
        premium,
        '''  function handleRatingClick(event: MouseEvent<HTMLButtonElement>) {
    const rating = event.currentTarget.dataset.rating;
    if (rating === "again" || rating === "almost" || rating === "known") {
      void rateCurrent(rating, event.timeStamp, document.activeElement === event.currentTarget);
    }
  }

''',
        "",
        "unused legacy rating handler",
    )
    PREMIUM.write_text(premium, encoding="utf-8")

    contract = CONTRACT.read_text(encoding="utf-8")
    contract = replace_once(
        contract,
        '    expect(styleSource).not.toMatch(/#[0-9a-f]{3,8}\\b/i);',
        '    const cssWithoutComments = styleSource.replace(/\\/\\*[\\s\\S]*?\\*\\//g, "");\n'
        '    expect(cssWithoutComments).not.toMatch(/#[0-9a-f]{3,8}\\b/i);',
        "CSS color assertion",
    )
    CONTRACT.write_text(contract, encoding="utf-8")


if __name__ == "__main__":
    main()
