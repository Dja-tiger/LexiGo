import { describe, expect, it } from "vitest";

import {
  DICTIONARY_NAVIGATION_CASES,
  dictionaryNavigationTarget,
  dictionaryNavigationURL,
} from "./dictionary-navigation";
import { parseNavigation } from "./navigation";

describe("dictionary navigation", () => {
  it.each(DICTIONARY_NAVIGATION_CASES)(
    "opens $label through a valid application URL",
    ({ label, collectionSource, target }) => {
      const resolvedTarget = dictionaryNavigationTarget({ label, collectionSource });
      const url = dictionaryNavigationURL({ label, collectionSource });

      expect(resolvedTarget).toEqual(target);
      expect(url).not.toBeNull();
      const location = new URL(url as string, "https://lexigo.local");
      expect(parseNavigation(location.search, location.pathname)).toEqual(target);
    },
  );

  it("prefers the stable collection source over localized visible text", () => {
    expect(dictionaryNavigationTarget({
      label: "Текст интерфейса может измениться",
      collectionSource: "data-engineering",
    })).toEqual({ view: "learn", source: "data-engineering" });
  });

  it("does not navigate an unknown or malformed card", () => {
    expect(dictionaryNavigationTarget({ label: "Неизвестный раздел" })).toBeNull();
    expect(dictionaryNavigationTarget({ collectionSource: "../../outside" })).toBeNull();
    expect(dictionaryNavigationURL({ label: "" })).toBeNull();
  });

  it("keeps all dictionary destinations unique", () => {
    const urls = DICTIONARY_NAVIGATION_CASES.map(({ label, collectionSource }) =>
      dictionaryNavigationURL({ label, collectionSource }),
    );

    expect(new Set(urls).size).toBe(urls.length);
  });
});
