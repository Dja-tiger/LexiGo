#!/usr/bin/env python3
"""Wire session scroll snapshots into the dictionary route island."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMPONENT = ROOT / "frontend/components/lexigo-dictionary-app.tsx"
E2E = ROOT / "frontend/e2e/dictionary-pwa.spec.ts"


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old in source:
        return source.replace(old, new, 1)
    if new in source:
        return source
    raise SystemExit(f"{label} did not match expected source")


def patch_component() -> None:
    source = COMPONENT.read_text(encoding="utf-8")
    source = replace_once(
        source,
        'import { scheduleNavigationScrollRestoration } from "../lib/navigation-scroll-restoration";\n',
        '''import {
  readNavigationScrollSnapshot,
  removeNavigationScrollSnapshot,
  scheduleNavigationScrollRestoration,
  writeNavigationScrollSnapshot,
} from "../lib/navigation-scroll-restoration";
''',
        "scroll restoration import",
    )
    source = replace_once(
        source,
        '''  const [initialNavigationState] = useState(() => {
    const target = parseNavigationLocation(window.location);
    const scroll = navigationScrollFromHistory(window.history.state);
    return {
      target,
      pending: scroll.x === 0 && scroll.y === 0
        ? null
        : { identity: navigationIdentity(target), scroll },
    } satisfies { target: NavigationTarget; pending: PendingNavigation | null };
  });
''',
        '''  const [initialNavigationState] = useState(() => {
    const target = parseNavigationLocation(window.location);
    const identity = navigationIdentity(target);
    const historyScroll = navigationScrollFromHistory(window.history.state);
    const fallbackScroll = readNavigationScrollSnapshot(window.sessionStorage, identity);
    const scroll = historyScroll.x === 0 && historyScroll.y === 0
      ? fallbackScroll ?? historyScroll
      : historyScroll;
    return {
      target,
      pending: scroll.x === 0 && scroll.y === 0
        ? null
        : { identity, scroll },
    } satisfies { target: NavigationTarget; pending: PendingNavigation | null };
  });
''',
        "initial navigation state",
    )
    source = replace_once(
        source,
        '''      () => {
        setPendingNavigation((current) => (current === pending ? null : current));
      },
''',
        '''      (result) => {
        if (result.restored) {
          removeNavigationScrollSnapshot(window.sessionStorage, pending.identity);
        }
        setPendingNavigation((current) => (current === pending ? null : current));
      },
''',
        "restoration completion callback",
    )
    source = replace_once(
        source,
        '''    const url = navigationURL(target);
    if (target.view !== "library") {
      window.dispatchEvent(new Event(PRODUCT_ROUTE_GRAPH_EVENT));
''',
        '''    const url = navigationURL(target);
    if (target.view !== "library") {
      writeNavigationScrollSnapshot(
        window.sessionStorage,
        navigationIdentity(current),
        currentScroll,
      );
      window.dispatchEvent(new Event(PRODUCT_ROUTE_GRAPH_EVENT));
''',
        "detail navigation snapshot",
    )
    COMPONENT.write_text(source, encoding="utf-8")


def patch_e2e() -> None:
    source = E2E.read_text(encoding="utf-8")
    source = replace_once(
        source,
        '  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(scrollBefore);\n',
        '''  await expect.poll(() => page.evaluate(
    (expected) => Math.abs(window.scrollY - expected),
    scrollBefore,
  )).toBeLessThanOrEqual(64);
''',
        "history scroll assertion",
    )
    E2E.write_text(source, encoding="utf-8")


def main() -> None:
    patch_component()
    patch_e2e()
    print("Wired session scroll fallback into dictionary history restoration")


if __name__ == "__main__":
    main()
