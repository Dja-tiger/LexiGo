from __future__ import annotations

from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    content = path.read_text(encoding="utf-8")
    if old not in content:
        if new in content:
            return
        raise RuntimeError(f"Expected fragment was not found in {path}: {old[:120]!r}")
    path.write_text(content.replace(old, new, 1), encoding="utf-8")


root = Path(__file__).resolve().parents[1]
interactions = root / "frontend/components/enhanced-ui-interactions.tsx"
workflow = root / ".github/workflows/ci.yml"
service_worker = root / "frontend/public/sw.js"

replace_once(
    interactions,
    'import { sortCatalogEntries, type CatalogSortMode } from "../lib/catalog-sort";\n',
    'import { sortCatalogEntries, type CatalogSortMode } from "../lib/catalog-sort";\n'
    'import { dictionaryNavigationURL } from "../lib/dictionary-navigation";\n',
)

replace_once(
    interactions,
    '''function navigateToCollection(source: CollectionSource) {
  const target = `/?view=learn&source=${source}`;
  if (window.location.pathname + window.location.search !== target) {
    window.history.pushState({ lexigo: true, view: "learn", source }, "", target);
  }
  window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  window.setTimeout(() => {
    initializeEnhancements();
    document.querySelector<HTMLElement>(`.lx-themed-selector[data-lexigo-collection="${source}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 0);
}
''',
    '''function navigateToCollection(source: CollectionSource) {
  const target = dictionaryNavigationURL({ collectionSource: source });
  if (target) window.location.assign(target);
}
''',
)

replace_once(
    interactions,
    '''    initializeEnhancements();
    window.speechSynthesis?.getVoices();
    const handleClick = (event: MouseEvent) => {
''',
    '''    initializeEnhancements();
    window.speechSynthesis?.getVoices();

    // The dictionary grid contains React-owned buttons and collection buttons that are
    // appended by this compatibility layer. On iOS standalone PWAs, changing the React
    // tree while those foreign nodes are still mounted can terminate the WebKit page.
    // Capture the click before React handles it and perform a normal same-origin
    // navigation. The server and service worker both serve the same application shell,
    // so this is reliable online, after a deployment, and from the installed PWA.
    const handleDictionaryNavigation = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(".lx-library-grid > button");
      if (!button) return;

      const target = dictionaryNavigationURL({
        collectionSource: button.dataset.lexigoCollection,
        label: button.querySelector("strong")?.textContent,
      });
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.location.assign(target);
    };

    const handleClick = (event: MouseEvent) => {
''',
)

replace_once(
    interactions,
    '''    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);
''',
    '''    document.addEventListener("click", handleDictionaryNavigation, true);
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);
''',
)

replace_once(
    interactions,
    '''      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
''',
    '''      document.removeEventListener("click", handleDictionaryNavigation, true);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
''',
)

replace_once(
    workflow,
    '''      - name: Production build
        run: npm run build
      - name: Production dependency audit
''',
    '''      - name: Production build
        run: npm run build
      - name: Dictionary navigation browser smoke
        run: |
          npm run start -- --hostname 127.0.0.1 > /tmp/lexigo-next.log 2>&1 &
          app_pid=$!
          cleanup() {
            kill "$app_pid" >/dev/null 2>&1 || true
          }
          trap cleanup EXIT

          ready=0
          for attempt in $(seq 1 60); do
            if curl --fail --silent --show-error http://127.0.0.1:3000/ >/dev/null; then
              ready=1
              break
            fi
            sleep 1
          done
          if [ "$ready" -ne 1 ]; then
            cat /tmp/lexigo-next.log
            exit 1
          fi

          bash scripts/dictionary-navigation-smoke.sh
      - name: Production dependency audit
''',
)

replace_once(
    service_worker,
    'const CACHE = "lexigo-shell-v12";',
    'const CACHE = "lexigo-shell-v13";',
)
