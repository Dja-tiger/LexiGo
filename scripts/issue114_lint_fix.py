#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "frontend/components/lexigo-premium-app.tsx"
content = path.read_text(encoding="utf-8")
old = '''  useEffect(() => {\n    if (navigation.view !== "phrases") return;\n    const filters = phraseCatalogFilters(navigation);\n    setPhraseTopic(filters.topic);\n    setPhrasePage(filters.page);\n    setPhraseSearchInput(filters.query);\n    setPhraseSearch(filters.query);\n    setPhraseSortMode(filters.sort);\n  }, [navigation.page, navigation.query, navigation.sort, navigation.topic, navigation.view]);'''
new = '''  useEffect(() => {\n    if (navigation.view !== "phrases") return;\n    const timer = window.setTimeout(() => {\n      const filters = phraseCatalogFilters(navigation);\n      setPhraseTopic(filters.topic);\n      setPhrasePage(filters.page);\n      setPhraseSearchInput(filters.query);\n      setPhraseSearch(filters.query);\n      setPhraseSortMode(filters.sort);\n    }, 0);\n    return () => window.clearTimeout(timer);\n  }, [navigation]);'''
count = content.count(old)
if count != 1:
    raise RuntimeError(f"expected one route hydration block, found {count}")
path.write_text(content.replace(old, new, 1), encoding="utf-8")
print("Issue #114 route hydration lint fix applied")
