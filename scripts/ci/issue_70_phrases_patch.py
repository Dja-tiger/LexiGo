#!/usr/bin/env python3
"""Apply the exact Issue #70 Phrases compatibility deletion.

This file is temporary and branch-scoped. Every edit is fail-closed: an anchor must
match exactly once, retired route markers must disappear, and shared phrase lesson
contracts must remain present.
"""

from __future__ import annotations

import re
from pathlib import Path


SOURCE_PATH = Path("frontend/components/lexigo-premium-app.tsx")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    print(f"{label}: literal matches={count}")
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one literal anchor, found {count}")
    return text.replace(old, new, 1)


def sub_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.DOTALL)
    print(f"{label}: regex matches={count}")
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one regex match, found {count}")
    return updated


def main() -> None:
    source = SOURCE_PATH.read_text(encoding="utf-8")

    # Route-only imports and types. Shared catalog sorting remains live in
    # loadCatalogBrowsePage for guest phrase lesson browsing.
    for line, label in [
        ('import { phraseCatalogFilters, phraseCatalogTarget } from "../lib/phrase-navigation";\n', "phrase navigation import"),
        ('import { CatalogKindNavigation } from "./catalog-kind-navigation";\n', "catalog kind navigation import"),
        ('import { SpeechPlayerButton } from "./speech-player-button";\n', "speech player import"),
        ('type CatalogKind = "phrases" | "all-items";\n', "catalog kind type"),
        ('  | "volume"\n', "volume icon type"),
        ('  if (name === "volume") return <svg {...common}><path d="M5 10v4h4l5 4V6L9 10H5Z"/><path d="M17 9c1.4 1.5 1.4 4.5 0 6M19.5 6.5c3.1 3 3.1 8 0 11"/></svg>;\n', "volume icon branch"),
    ]:
        source = replace_once(source, line, "", label)

    catalog_helpers = "\n".join(
        [
            "function CatalogSortControl({",
            "  mode,",
            "  onChange,",
            "}: {",
            "  mode: CatalogSortMode;",
            "  onChange: (mode: CatalogSortMode) => void;",
            "}) {",
            "  return (",
            '    <div className="lx-catalog-sort" data-lexigo-sort-for="all-items">',
            "      <div><strong>Сортировка</strong><small>Упорядочить слова по английскому алфавиту</small></div>",
            "      <label>",
            '        <span className="lx-visually-hidden">Выберите порядок сортировки</span>',
            "        <select",
            '          aria-label="Сортировка каталога"',
            "          value={mode}",
            "          onChange={(event) => onChange(event.target.value as CatalogSortMode)}",
            "        >",
            '          <option value="default">Порядок обучения</option>',
            '          <option value="az">A–Z</option>',
            '          <option value="za">Z–A</option>',
            "        </select>",
            "      </label>",
            "    </div>",
            "  );",
            "}",
            "",
            "function readStoredCatalogSort(): CatalogSortMode {",
            "  try {",
            "    const value = window.localStorage.getItem(`${SORT_STORAGE_PREFIX}all-items`);",
            '    return value === "az" || value === "za" ? value : "default";',
            "  } catch {",
            '    return "default";',
            "  }",
            "}",
            "",
            "function sortLearningItems",
        ]
    )
    source = sub_once(
        source,
        r"function CatalogSortControl\(\{.*?\n\}\n\nfunction sortLearningItems",
        catalog_helpers,
        "catalog helpers",
    )
    source = sub_once(
        source,
        r"\nfunction itemKey\(item: LearningItem\): string \{\n  return item\.slug \|\| item\.id;\n\}\n",
        "\n",
        "route itemKey helper",
    )

    # Route-only state and URL-backed catalog synchronization.
    source = sub_once(
        source,
        r'  const \[phraseCatalog, setPhraseCatalog\].*?  const \[phraseSearch, setPhraseSearch\] = useState\(""\);\n\n',
        "",
        "phrase route state",
    )
    source = sub_once(
        source,
        r'  const \[phraseTopic, setPhraseTopic\] = useState\("all"\);\n  const \[phraseSortMode, setPhraseSortMode\] = useState<CatalogSortMode>\("default"\);\n',
        "",
        "phrase filter state",
    )

    stored_sort_effect = "\n".join(
        [
            "  useEffect(() => {",
            "    const storageTimer = window.setTimeout(() => {",
            "      setAllItemsSortMode(readStoredCatalogSort());",
            "    }, 0);",
            "    return () => window.clearTimeout(storageTimer);",
            "  }, []);",
        ]
    )
    source = sub_once(
        source,
        r'  useEffect\(\(\) => \{\n    const storageTimer = window\.setTimeout\(\(\) => \{\n      setPhraseSortMode\(readStoredCatalogSort\("phrases"\)\);\n      setAllItemsSortMode\(readStoredCatalogSort\("all-items"\)\);\n    \}, 0\);\n    return \(\) => window\.clearTimeout\(storageTimer\);\n  \}, \[\]\);',
        stored_sort_effect,
        "stored sort effect",
    )
    source = sub_once(
        source,
        r'\n  useEffect\(\(\) => \{\n    if \(navigation\.view !== "phrases"\) return;.*?\n  \}, \[navigation\]\);\n',
        "\n",
        "phrase URL synchronization",
    )
    source = sub_once(
        source,
        r"  const phraseTopics = useMemo\(\(\) => \{.*?  const successRate = objectiveSuccessRate\(progress\);",
        "  const sortedAllItems = items;\n  const successRate = objectiveSuccessRate(progress);",
        "phrase derived route values",
    )

    # Route-only loaders, effects and lifecycle resets.
    source = sub_once(
        source,
        r"  const loadPhraseCatalogResource = useCallback\(async \(.*?\n  const loadActiveLessonResource = useCallback",
        "  const loadActiveLessonResource = useCallback",
        "phrase API loaders",
    )
    source = sub_once(
        source,
        r'      setPhraseCatalog\(\[\]\);\n      setRemotePhraseDetail\(null\);\n      setPhraseDetailStatus\(\{ slug: "", status: idleResourceStatus\(\) \}\);\n      setPhraseCatalogPageInfo\(paginateCatalogEntries\(DEFAULT_PHRASE_CATALOG, 1\)\.info\);\n      setPhrasePage\(1\);\n      setPhraseCatalogStatus\(idleResourceStatus\(\)\);\n',
        "",
        "hydration phrase resets",
    )
    source = sub_once(
        source,
        r'  useEffect\(\(\) => \{\n    if \(!session \|\| navigation\.view !== "phrases" \|\| navigation\.detail\) return;.*?\n  useEffect\(\(\) => \{\n    if \(!session \|\| navigation\.view !== "learn"',
        '  useEffect(() => {\n    if (!session || navigation.view !== "learn"',
        "phrase catalog and detail effects",
    )

    update_all_items_sort = "\n".join(
        [
            "  function updateAllItemsSort(mode: CatalogSortMode) {",
            "    setAllItemsSortMode(mode);",
            "    try {",
            "      window.localStorage.setItem(`${SORT_STORAGE_PREFIX}all-items`, mode);",
            "    } catch {",
            "      // Sorting remains available for the current session when storage is restricted.",
            "    }",
            "  }",
            "",
            "  function selectRovingControl",
        ]
    )
    source = sub_once(
        source,
        r"  function updateCatalogSort\(kind: CatalogKind, mode: CatalogSortMode\) \{.*?\n  \}\n\n  function selectRovingControl",
        update_all_items_sort,
        "catalog sort mutation",
    )
    source = sub_once(
        source,
        r'      setPhraseCatalog\(\[\]\);\n      setRemotePhraseDetail\(null\);\n      setPhraseDetailStatus\(\{ slug: "", status: idleResourceStatus\(\) \}\);\n      setPhraseCatalogPageInfo\(paginateCatalogEntries\(DEFAULT_PHRASE_CATALOG, 1\)\.info\);\n      setPhrasePage\(1\);\n      setPhraseSearchInput\(""\);\n      setPhraseSearch\(""\);\n      setPhraseCatalogStatus\(idleResourceStatus\(\)\);\n',
        "",
        "logout phrase resets",
    )

    # Route-only handlers and presentation.
    source = sub_once(
        source,
        r"  function openPhraseDetail\(phrase: LearningItem\) \{.*?\n  async function changeAllItemsPage",
        "  async function changeAllItemsPage",
        "phrase route handlers",
    )
    source = replace_once(
        source,
        '    updateCatalogSort("all-items", mode);',
        "    updateAllItemsSort(mode);",
        "all-items sort call",
    )
    source = sub_once(
        source,
        r"  function renderPhrases\(\) \{.*?\n  function renderLibrary\(\) \{",
        "  function renderLibrary() {",
        "phrase route presentation",
    )
    source = replace_once(
        source,
        '<CatalogSortControl kind="all-items" mode={allItemsSortMode} onChange={changeAllItemsSort} />',
        '<CatalogSortControl mode={allItemsSortMode} onChange={changeAllItemsSort} />',
        "all-items sort control",
    )
    source = sub_once(
        source,
        r'  const view = navigation\.view === "home" \? renderHome\(\)\n    : navigation\.view === "learn" \? renderLearn\(\)\n      : navigation\.view === "phrases" \? renderPhrases\(\)\n        : navigation\.view === "library" \? renderLibrary\(\)',
        '  const view = navigation.view === "home" ? renderHome()\n    : navigation.view === "learn" ? renderLearn()\n      : navigation.view === "library" ? renderLibrary()',
        "view selection",
    )
    source = sub_once(
        source,
        r'          <AsyncResourceNotice label="Каталог фраз"[^\n]+\n',
        "",
        "phrase resource notice",
    )

    retired_markers = [
        "const [phraseCatalog, setPhraseCatalog]",
        "const [phraseCatalogStatus, setPhraseCatalogStatus]",
        "const [remotePhraseDetail, setRemotePhraseDetail]",
        "const [phraseDetailStatus, setPhraseDetailStatus]",
        "const [phraseCatalogPageInfo, setPhraseCatalogPageInfo]",
        "const [phrasePage, setPhrasePage]",
        "const [phraseSearchInput, setPhraseSearchInput]",
        "const [phraseSearch, setPhraseSearch]",
        "const [phraseTopic, setPhraseTopic]",
        "const [phraseSortMode, setPhraseSortMode]",
        "const phraseTopics",
        "const guestPhrasePage",
        "const sortedVisiblePhrases",
        "const activePhrasePageInfo",
        "const selectedPhrase",
        "loadPhraseCatalogResource",
        "loadPhraseDetailResource",
        "function openPhraseDetail",
        "function backToPhraseCatalog",
        "function changePhrasePage",
        "function applyPhraseSearch",
        "function clearPhraseSearch",
        "function renderPhrases",
        "phraseCatalogFilters",
        "phraseCatalogTarget",
        "CatalogKindNavigation",
        "SpeechPlayerButton",
        '<AsyncResourceNotice label="Каталог фраз"',
        'navigation.view === "phrases" ? renderPhrases()',
    ]
    required_markers = [
        'import { sortCatalogEntries, type CatalogSortMode } from "../lib/catalog-sort";',
        "function sortLearningItems",
        "paginateCatalogEntries(sortLearningItems(available, query.sort ?? \"default\"), requestedPage)",
        'type LessonSource = WordSection | "phrases";',
        '{ value: "phrases", label: "Технические фразы"',
        "const DEFAULT_PHRASE_CATALOG",
        "? DEFAULT_PHRASE_CATALOG.find",
        "mixedLessonFallbackMessage",
        'exerciseKind: currentItem.kind === "phrase" ? "cloze" : "translation"',
        'source === "phrases" ? "phrases" : "learn"',
    ]

    remaining = [marker for marker in retired_markers if marker in source]
    missing = [marker for marker in required_markers if marker not in source]
    if remaining:
        raise SystemExit(f"retired markers remain: {remaining}")
    if missing:
        raise SystemExit(f"shared phrase contracts missing: {missing}")

    SOURCE_PATH.write_text(source, encoding="utf-8")
    print(f"updated {SOURCE_PATH}: {len(source.encode('utf-8'))} bytes, {source.count(chr(10)) + 1} lines")


if __name__ == "__main__":
    main()
