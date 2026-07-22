from __future__ import annotations

from pathlib import Path

TARGET = Path("frontend/components/lexigo-premium-app.tsx")


def main() -> None:
    text = TARGET.read_text(encoding="utf-8")

    def replace_exact(label: str, old: str, new: str) -> None:
        nonlocal text
        count = text.count(old)
        if count != 1:
            raise RuntimeError(f"{label}: expected exactly one match, found {count}")
        text = text.replace(old, new, 1)

    replace_exact(
        "interface-copy import",
        '} from "../lib/learning";\nimport {\n  navigationURL,',
        '} from "../lib/learning";\nimport { learningTermCopy, topicLabel } from "../lib/interface-copy";\nimport {\n  navigationURL,',
    )

    replace_exact(
        "shared learning copy constants",
        """const DEFAULT_PHRASE_CATALOG = Array.from(
  new Map([...TECHNICAL_PHRASES, ...EXPANDED_PHRASES].map((item) => [item.id, item])).values(),
);

const COLLECTIONS: CollectionDefinition[] = [""",
        """const DEFAULT_PHRASE_CATALOG = Array.from(
  new Map([...TECHNICAL_PHRASES, ...EXPANDED_PHRASES].map((item) => [item.id, item])).values(),
);
const RECALL_COPY = learningTermCopy("recall");
const DUE_COPY = learningTermCopy("due");
const RETAINED_COPY = learningTermCopy("retained");
const CLOZE_COPY = learningTermCopy("cloze");
const CHUNK_COPY = learningTermCopy("chunk");

const COLLECTIONS: CollectionDefinition[] = [""",
    )

    replace_exact(
        "data engineering collection label",
        """  {
    source: "data-engineering",
    label: "Data Engineer",
    shortLabel: "Data Engineer",
    description: "Моделирование, пайплайны, Kafka, качество и хранение данных",
    symbol: "DB",
  },""",
        """  {
    source: "data-engineering",
    label: "Инженерия данных",
    shortLabel: "Инженерия данных",
    description: "Моделирование, пайплайны, Kafka, качество и хранение данных",
    symbol: "DB",
  },""",
    )

    replace_exact(
        "backend collection label",
        """  {
    source: "backend",
    label: "Backend Development",
    shortLabel: "Backend",
    description: "API, архитектура, базы данных, конкурентность и надёжность",
    symbol: "</>",
  },""",
        """  {
    source: "backend",
    label: "Backend-разработка",
    shortLabel: "Backend",
    description: "API, архитектура, базы данных, конкурентность и надёжность",
    symbol: "</>",
  },""",
    )

    replace_exact(
        "phrase source explanation",
        '  { value: "phrases", label: "Технические фразы", hint: "Рабочие chunks и cloze", icon: "code" },',
        '  { value: "phrases", label: "Технические фразы", hint: `${CHUNK_COPY.label}: устойчивые выражения; ${CLOZE_COPY.label.toLocaleLowerCase("ru")}: задания с пропуском`, icon: "code" },',
    )

    replace_exact(
        "recall mode copy",
        """  {
    value: "recall",
    label: "Вспомнить самому",
    hint: "Введите перевод или восстановите пропуск",
    icon: "spark",
  },""",
        """  {
    value: "recall",
    label: RECALL_COPY.label,
    hint: RECALL_COPY.explanation,
    icon: "spark",
  },""",
    )

    replace_exact(
        "localized phrase topic ordering",
        """    return ["all", ...Array.from(new Set([
      ...metadataTopics,
      ...DEFAULT_PHRASE_CATALOG.map((phrase) => phrase.topic),
      ...phraseCatalog.map((phrase) => phrase.topic),
    ]))];""",
        """    return ["all", ...Array.from(new Set([
      ...metadataTopics,
      ...DEFAULT_PHRASE_CATALOG.map((phrase) => phrase.topic),
      ...phraseCatalog.map((phrase) => phrase.topic),
    ])).sort((left, right) => topicLabel(left).localeCompare(topicLabel(right), "ru"))];""",
    )

    replace_exact(
        "home due explanation",
        '            description: "LexiGo соберёт due-очередь автоматически — режим и состав уже определены вашим прогрессом.",',
        "            description: DUE_COPY.explanation,",
    )
    replace_exact(
        "home study explanation",
        '              description: "Откройте короткий блок знакомства; ответы будут показаны сразу и не исказят active recall.",',
        '              description: "Откройте короткий блок знакомства: ответы будут видны сразу, а самостоятельное воспроизведение начнётся на следующих повторениях.",',
    )
    replace_exact(
        "home retained metric",
        '<div className="lx-progress-list"><div><span>К повторению</span><strong>{progress.dueNow}</strong></div><div><span>Retained за неделю</span><strong>{progress.retainedItemsWeek}</strong></div><div><span>Серия</span><strong>{progress.currentStreak} дн.</strong></div></div>',
        '<div className="lx-progress-list"><div><span>{DUE_COPY.label}</span><strong>{progress.dueNow}</strong></div><div><span>{RETAINED_COPY.label} за неделю</span><strong>{progress.retainedItemsWeek}</strong></div><div><span>Серия</span><strong>{progress.currentStreak} дн.</strong></div></div>',
    )
    replace_exact(
        "home guest queue explanation",
        'message={!session ? "Due-очередь, дневная цель и серия синхронизируются с аккаунтом." : progressStatus.problem?.message ?? "Получаем due-очередь и дневную цель."}',
        'message={!session ? "Материал к повторению, дневная цель и серия синхронизируются с аккаунтом." : progressStatus.problem?.message ?? "Получаем материал к повторению и дневную цель."}',
    )
    replace_exact(
        "home lesson configuration description",
        "Режим, раздел, размер и предварительный состав находятся в одном composer.",
        "Режим, раздел, размер и предварительный состав настраиваются на одном экране.",
    )
    replace_exact(
        "home progress description",
        "Due-очередь, retained items, объективная успешность и дневная цель собраны отдельно.",
        "Материал к повторению, закреплённые знания, объективная успешность и дневная цель собраны отдельно.",
    )

    replace_exact(
        "lesson heading due label",
        '<div className="lx-heading-badge"><Icon name="learn"/><span>{session && progress ? `${progress.dueNow} элементов готовы` : "Прогресс сохраняется после входа"}</span></div>',
        '<div className="lx-heading-badge"><Icon name="learn"/><span>{session && progress ? `${DUE_COPY.label}: ${progress.dueNow}` : "Прогресс сохраняется после входа"}</span></div>',
    )
    replace_exact(
        "lesson catalog context topic",
        '<strong>{sourceLabel(source)} · {lessonTopic}</strong>',
        '<strong>{sourceLabel(source)} · {topicLabel(lessonTopic)}</strong>',
    )
    replace_exact(
        "lesson all-items explanation",
        "Справочный режим не создаёт server lesson session.",
        "Справочный режим открывает список без создания учебной сессии.",
    )
    replace_exact(
        "lesson guest preview explanation",
        "Composer учитывает вашу due-очередь и доступные фразы.",
        "При расчёте учитываются материал к повторению и доступные фразы.",
    )
    replace_exact(
        "lesson loading preview explanation",
        "Проверяем due, new и доступность обоих типов.",
        "Проверяем материал к повторению, новые элементы и доступность слов и фраз.",
    )

    replace_exact(
        "phrase authentication explanation",
        'message="Backend-каталог и текущий learning status доступны только владельцу аккаунта."',
        'message="Персональный каталог и текущий статус изучения доступны только владельцу аккаунта."',
    )
    replace_exact(
        "phrase detail topic",
        '<span lang="en">{selectedPhrase.topic}</span>',
        '<span>{topicLabel(selectedPhrase.topic)}</span>',
    )
    replace_exact(
        "cloze explanation",
        '{selectedPhrase.cloze ? <div><small>Cloze practice</small><p lang="en">{selectedPhrase.cloze}</p></div> : null}',
        '{selectedPhrase.cloze ? <div><small>{CLOZE_COPY.label}</small><p>{CLOZE_COPY.explanation}</p><p lang="en">{selectedPhrase.cloze}</p></div> : null}',
    )
    replace_exact(
        "phrase catalog introduction",
        "Поиск и просмотр incident updates, architecture review, data engineering, performance и release communication. Настройка учебной сессии находится в «Обучении».",
        "Ищите формулировки для инцидентов, архитектурных обсуждений, инженерии данных, производительности и релизов. Настройка учебной сессии находится в разделе «Обучение».",
    )
    replace_exact(
        "phrase topic language attribute",
        'className={selected ? "selected" : ""} lang={topic === "all" ? "ru" : "en"} onClick=',
        'className={selected ? "selected" : ""} onClick=',
    )
    replace_exact(
        "phrase topic label",
        '>{topic === "all" ? "Все темы" : topic}</button>;',
        '>{topic === "all" ? "Все темы" : topicLabel(topic)}</button>;',
    )
    replace_exact(
        "phrase card topic",
        '<span lang="en">{phrase.topic}</span>',
        '<span>{topicLabel(phrase.topic)}</span>',
    )

    replace_exact(
        "progress guest explanation",
        "Дневная цель, due-очередь, retained items и серия синхронизируются между устройствами.",
        "Дневная цель, материал к повторению, закреплённые знания и серия синхронизируются между устройствами.",
    )
    replace_exact(
        "progress retained metric",
        '{ label: "Retained items", value: String(progress.retainedItemsWeek), hint: `${progress.retainedWordsWeek} слов · ${progress.retainedPhrasesWeek} фраз`, color: "blue" },',
        '{ label: RETAINED_COPY.label, value: String(progress.retainedItemsWeek), hint: `${progress.retainedWordsWeek} слов · ${progress.retainedPhrasesWeek} фраз`, color: "blue" },',
    )
    replace_exact(
        "progress retained explanation",
        "<p>Retained item засчитывается после повторного успешного воспроизведения.</p>",
        "<p>{RETAINED_COPY.explanation}</p>",
    )
    replace_exact(
        "progress study explanation",
        "<small>показ ответа · не active recall</small>",
        "<small>ответ показан сразу · без самостоятельного воспроизведения</small>",
    )
    replace_exact(
        "progress recall metric",
        '<div><span>Recall</span><strong>{modes.recall.successfulToday} / {modes.recall.attemptsToday}</strong><small>объективно верные сегодня</small></div>',
        '<div><span>{RECALL_COPY.label}</span><strong>{modes.recall.successfulToday} / {modes.recall.attemptsToday}</strong><small>{RECALL_COPY.explanation}</small></div>',
    )
    replace_exact(
        "progress legacy metric",
        '<div><span>Legacy</span><strong>{modes.legacy.attemptsTotal}</strong><small>исторические события без точного режима</small></div>',
        '<div><span>Без указанного режима</span><strong>{modes.legacy.attemptsTotal}</strong><small>Исторические события, сохранённые до появления точного режима.</small></div>',
    )
    replace_exact(
        "lesson mastery explanation",
        "Пассивное изучение не считается объективным воспроизведением и не повышает mastery.",
        "Пассивное изучение не считается объективным воспроизведением и не повышает уровень освоения.",
    )

    stale_ui_fragments = [
        "due-очеред",
        "Due-очеред",
        "retained items",
        "Retained item",
        "Retained за",
        "active recall",
        "Cloze practice",
        "Рабочие chunks",
        "learning status",
        "incident updates",
        "одном composer",
        "Composer учитывает",
        "server lesson session",
        "не повышает mastery",
    ]
    for fragment in stale_ui_fragments:
        if fragment in text:
            raise RuntimeError(f"stale interface fragment remains: {fragment}")

    TARGET.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
