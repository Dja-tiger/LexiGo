#!/usr/bin/env python3
"""Initialize dictionary scroll restoration from the mounted history entry."""

from __future__ import annotations

from pathlib import Path

PATH = Path(__file__).resolve().parents[2] / "frontend/components/lexigo-dictionary-app.tsx"

OLD = '''  const [navigation, setNavigation] = useState<NavigationTarget>(() => parseNavigationLocation(window.location));
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
'''

NEW = '''  const [initialNavigationState] = useState(() => {
    const target = parseNavigationLocation(window.location);
    const scroll = navigationScrollFromHistory(window.history.state);
    return {
      target,
      pending: scroll.x === 0 && scroll.y === 0
        ? null
        : { identity: navigationIdentity(target), scroll },
    } satisfies { target: NavigationTarget; pending: PendingNavigation | null };
  });
  const [navigation, setNavigation] = useState<NavigationTarget>(initialNavigationState.target);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(initialNavigationState.pending);
'''


def main() -> None:
    source = PATH.read_text(encoding="utf-8")
    if OLD in source:
        source = source.replace(OLD, NEW, 1)
    elif NEW not in source:
        raise SystemExit("dictionary initial navigation state did not match expected source")
    PATH.write_text(source, encoding="utf-8")
    print("Initialized dictionary pending scroll from history state")


if __name__ == "__main__":
    main()
