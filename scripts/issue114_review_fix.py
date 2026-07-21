#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    content = target.read_text(encoding="utf-8")
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}")
    target.write_text(content.replace(old, new, 1), encoding="utf-8")


replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''onAction={() => { setPhraseTopic("all"); clearPhraseSearch(); }}''',
    '''onAction={() => {\n          setPhraseTopic("all");\n          setPhraseSearchInput("");\n          setPhraseSearch("");\n          setPhrasePage(1);\n          navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), topic: "all", query: "", page: 1 }));\n        }}''',
)

replace_once(
    "backend/integration/phrase_slug_lookup_test.go",
    '''\tif phrase.Status != "review" || phrase.Repetitions != 2 {\n\t\tt.Fatalf("personalized learning state was not returned: %+v", phrase)\n\t}\n\n\tassertPhraseLookupError''',
    '''\tif phrase.Status != "review" || phrase.Repetitions != 2 {\n\t\tt.Fatalf("personalized learning state was not returned: %+v", phrase)\n\t}\n\n\tif _, err := pg.Exec(ctx, `\n\t\tinsert into words(\n\t\t\tlemma, translation, part_of_speech, topic, examples, source, note,\n\t\t\tkind, slug, cloze, cloze_answer\n\t\t) values (\n\t\t\t'Duplicate route.', 'Дубликат маршрута.', 'phrase', 'Frontend Architecture',\n\t\t\t'[]'::jsonb, 'lexigo-technical-phrases-v1', '',\n\t\t\t'phrase', 'backend-route-contract', 'Duplicate _____.', 'route'\n\t\t)\n\t`); err == nil {\n\t\tt.Fatal("duplicate canonical phrase slug was accepted")\n\t}\n\tif _, err := pg.Exec(ctx, `\n\t\tinsert into words(\n\t\t\tlemma, translation, part_of_speech, topic, examples, source, note,\n\t\t\tkind, slug, cloze, cloze_answer\n\t\t) values (\n\t\t\t'Invalid route.', 'Некорректный маршрут.', 'phrase', 'Frontend Architecture',\n\t\t\t'[]'::jsonb, 'lexigo-technical-phrases-v1', '',\n\t\t\t'phrase', 'Invalid-Route', 'Invalid _____.', 'route'\n\t\t)\n\t`); err == nil {\n\t\tt.Fatal("non-canonical phrase slug was accepted")\n\t}\n\n\tassertPhraseLookupError''',
)

print("Issue #114 self-review fixes applied")
