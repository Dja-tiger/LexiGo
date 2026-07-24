#!/usr/bin/env python3
"""Apply the one-time dictionary history scroll restoration source patch."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DICTIONARY_PATH = ROOT / "frontend/components/lexigo-dictionary-app.tsx"
E2E_PATH = ROOT / "frontend/e2e/dictionary-pwa.spec.ts"


def lines(*values: str) -> str:
    return "\n".join(values) + "\n"


def patch_dictionary() -> None:
    source = DICTIONARY_PATH.read_text(encoding="utf-8")
    import_anchor = 'import { createScrollSnapshotScheduler } from "../lib/navigation-scroll-snapshot";\n'
    import_line = 'import { scheduleNavigationScrollRestoration } from "../lib/navigation-scroll-restoration";\n'
    if import_line not in source:
        if source.count(import_anchor) != 1:
            raise SystemExit("dictionary import anchor was not found exactly once")
        source = source.replace(import_anchor, import_anchor + import_line, 1)

    old_effect = lines(
        "  useLayoutEffect(() => {",
        "    navigationRef.current = navigation;",
        "    if (!pendingNavigation || pendingNavigation.identity !== navigationIdentity(navigation)) return;",
        "    const frame = window.requestAnimationFrame(() => {",
        "      mainContentRef.current?.focus({ preventScroll: true });",
        "      window.scrollTo({",
        "        left: pendingNavigation.scroll.x,",
        "        top: pendingNavigation.scroll.y,",
        '        behavior: "auto",',
        "      });",
        "    });",
        "    return () => window.cancelAnimationFrame(frame);",
        "  }, [navigation, pendingNavigation]);",
    )
    new_effect = lines(
        "  useLayoutEffect(() => {",
        "    navigationRef.current = navigation;",
        "    if (!pendingNavigation || pendingNavigation.identity !== navigationIdentity(navigation)) return;",
        "",
        "    const pending = pendingNavigation;",
        "    mainContentRef.current?.focus({ preventScroll: true });",
        "    return scheduleNavigationScrollRestoration(",
        "      pending.scroll,",
        "      {",
        "        readPosition: () => ({ x: window.scrollX, y: window.scrollY }),",
        "        writePosition: (position) => {",
        "          window.scrollTo({",
        "            left: position.x,",
        "            top: position.y,",
        '            behavior: "auto",',
        "          });",
        "        },",
        "        requestFrame: (callback) => window.requestAnimationFrame(callback),",
        "        cancelFrame: (frameID) => window.cancelAnimationFrame(frameID),",
        "      },",
        "      () => {",
        "        setPendingNavigation((current) => (current === pending ? null : current));",
        "      },",
        "    );",
        "  }, [navigation, pendingNavigation]);",
    )
    if old_effect in source:
        source = source.replace(old_effect, new_effect, 1)
    elif new_effect not in source:
        raise SystemExit("dictionary scroll restoration effect did not match expected source")
    DICTIONARY_PATH.write_text(source, encoding="utf-8")


def patch_e2e() -> None:
    source = E2E_PATH.read_text(encoding="utf-8")
    source = source.replace(
        'test("iOS standalone dictionary restores filters and result scroll across relaunch", async ({ context, page }, testInfo) => {',
        'test("iOS standalone dictionary restores result scroll on history return and filters across relaunch", async ({ context, page }, testInfo) => {',
        1,
    )

    scroll_anchor = "  const scrollBefore = await page.evaluate(() => window.scrollY);\n"
    scroll_assertion = "  expect(scrollBefore).toBeGreaterThan(0);\n"
    if scroll_assertion not in source:
        if source.count(scroll_anchor) != 1:
            raise SystemExit("dictionary PWA scroll snapshot anchor was not found exactly once")
        source = source.replace(scroll_anchor, scroll_anchor + scroll_assertion, 1)

    history_anchor = lines(
        "  await expect(page).toHaveURL(/status=review/);",
        "  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(scrollBefore);",
    )
    history_replacement = lines(
        "  await expect(page).toHaveURL(/status=review/);",
        '  await expect(page.getByRole("listitem")).toHaveCount(12);',
        "  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(scrollBefore);",
    )
    if history_anchor in source:
        source = source.replace(history_anchor, history_replacement, 1)
    elif history_replacement not in source:
        raise SystemExit("dictionary PWA history assertion anchor was not found")
    E2E_PATH.write_text(source, encoding="utf-8")


def main() -> None:
    patch_dictionary()
    patch_e2e()
    print("Applied dictionary history scroll restoration patch")


if __name__ == "__main__":
    main()
