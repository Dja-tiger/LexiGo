from __future__ import annotations

from pathlib import Path

TARGET = Path("frontend/components/lexigo-premium-app.tsx")


def main() -> None:
    text = TARGET.read_text(encoding="utf-8")
    old = """  const phraseTopics = useMemo(() => {
    const metadataTopics = catalogMetadata?.topics
      .filter((entry) => (entry.phrases ?? 0) > 0)
      .map((entry) => entry.topic) ?? [];
    return ["all", ...Array.from(new Set([
      ...metadataTopics,
      ...DEFAULT_PHRASE_CATALOG.map((phrase) => phrase.topic),
      ...phraseCatalog.map((phrase) => phrase.topic),
    ])).sort((left, right) => topicLabel(left).localeCompare(topicLabel(right), "ru"))];
  }, [catalogMetadata, phraseCatalog]);"""
    new = """  const phraseTopics = useMemo(() => {
    const metadataTopics = catalogMetadata?.topics
      .filter((entry) => (entry.phrases ?? 0) > 0)
      .map((entry) => entry.topic) ?? [];
    const availableTopics = session
      ? [...metadataTopics, ...phraseCatalog.map((phrase) => phrase.topic)]
      : DEFAULT_PHRASE_CATALOG.map((phrase) => phrase.topic);
    return ["all", ...Array.from(new Set(availableTopics))
      .sort((left, right) => topicLabel(left).localeCompare(topicLabel(right), "ru"))];
  }, [catalogMetadata, phraseCatalog, session]);"""

    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"phrase topic source: expected exactly one match, found {count}")

    updated = text.replace(old, new, 1)
    if "...DEFAULT_PHRASE_CATALOG.map((phrase) => phrase.topic),\n      ...phraseCatalog.map" in updated:
        raise RuntimeError("guest and account phrase topic sources remain mixed")

    TARGET.write_text(updated, encoding="utf-8")


if __name__ == "__main__":
    main()
