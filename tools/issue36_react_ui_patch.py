from pathlib import Path


APP = Path("frontend/components/lexigo-premium-app.tsx")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


text = APP.read_text()

text = replace_once(
    text,
    '''import { apiUrl } from "../lib/api";
import { csrfTokenFromCookie, refreshSession, type Session } from "../lib/auth-session";
import { decideLessonAdvance, summarizePersistedLesson } from "../lib/lesson-flow";
''',
    '''import { apiUrl } from "../lib/api";
import { csrfTokenFromCookie, refreshSession, type Session } from "../lib/auth-session";
import { sortCatalogEntries, type CatalogSortMode } from "../lib/catalog-sort";
import { EXPANDED_PHRASES } from "../lib/expanded-phrases";
import { decideLessonAdvance, summarizePersistedLesson } from "../lib/lesson-flow";
''',
    "catalog imports",
)

text = replace_once(
    text,
    '''import { TECHNICAL_PHRASES } from "../lib/technical-phrases";
''',
    '''import { TECHNICAL_PHRASES } from "../lib/technical-phrases";
import { CalendarReminderIntegration } from "./calendar-reminder-integration";
''',
    "calendar import",
)

text = replace_once(
    text,
    '''type LessonSource = WordSection | "phrases";
type StudyMode = AnswerMode | "study" | "all";
''',
    '''type LessonSource = WordSection | "phrases";
type StudyMode = AnswerMode | "study" | "all";
type StudyView = "card" | "example" | "context";
type CollectionSource = Extract<WordSection, "daily-life" | "travel" | "data-engineering" | "backend">;
type CatalogKind = "phrases" | "all-items";

type CollectionDefinition = {
  source: CollectionSource;
  label: string;
  shortLabel: string;
  description: string;
  symbol: string;
  count: number;
};
''',
    "ui types",
)

text = replace_once(
    text,
    '''const PRESENTATION_PREFIX = "lexigo.lesson.presentation.";

const SOURCE_OPTIONS: Array<{
''',
    '''const PRESENTATION_PREFIX = "lexigo.lesson.presentation.";
const SORT_STORAGE_PREFIX = "lexigo.catalog.sort.";
const WORD_CATALOG_COUNT = 799;
const DEFAULT_PHRASE_CATALOG = Array.from(
  new Map([...TECHNICAL_PHRASES, ...EXPANDED_PHRASES].map((item) => [item.id, item])).values(),
);

const COLLECTIONS: CollectionDefinition[] = [
  {
    source: "daily-life",
    label: "Бытовой английский",
    shortLabel: "Для жизни",
    description: "Дом, покупки, услуги, здоровье и повседневное общение",
    symbol: "A1",
    count: 55,
  },
  {
    source: "travel",
    label: "Для путешествий",
    shortLabel: "Путешествия",
    description: "Аэропорт, отель, транспорт, документы и навигация",
    symbol: "✈",
    count: 55,
  },
  {
    source: "data-engineering",
    label: "Data Engineer",
    shortLabel: "Data Engineer",
    description: "Моделирование, пайплайны, Kafka, качество и хранение данных",
    symbol: "DB",
    count: 55,
  },
  {
    source: "backend",
    label: "Backend Development",
    shortLabel: "Backend",
    description: "API, архитектура, базы данных, конкурентность и надёжность",
    symbol: "</>",
    count: 55,
  },
];

const STUDY_TABS: Array<{ value: StudyView; label: string; icon: IconName }> = [
  { value: "card", label: "Карточка", icon: "book" },
  { value: "example", label: "Пример", icon: "phrases" },
  { value: "context", label: "Контекст", icon: "library" },
];

const SOURCE_OPTIONS: Array<{
''',
    "catalog constants",
)

text = replace_once(
    text,
    '''  { value: "mixed", label: "Все слова", hint: "Смешанный порядок и разные темы", icon: "shuffle", count: 579 },
  { value: "noun", label: "Существительные", hint: "Системы, объекты и метрики", icon: "cube", count: 183 },
  { value: "verb", label: "Глаголы", hint: "Действия, процессы и операции", icon: "bolt", count: 159 },
  { value: "adjective", label: "Прилагательные", hint: "Состояния и характеристики", icon: "spark", count: 193 },
  { value: "phrases", label: "Технические фразы", hint: "Рабочие chunks и cloze", icon: "code", count: 24 },
''',
    '''  { value: "mixed", label: "Все слова", hint: "Смешанный порядок и разные темы", icon: "shuffle", count: WORD_CATALOG_COUNT },
  { value: "noun", label: "Существительные", hint: "Системы, объекты и метрики", icon: "cube", count: 383 },
  { value: "verb", label: "Глаголы", hint: "Действия, процессы и операции", icon: "bolt", count: 179 },
  { value: "adjective", label: "Прилагательные", hint: "Состояния и характеристики", icon: "spark", count: 193 },
  { value: "phrases", label: "Технические фразы", hint: "Рабочие chunks и cloze", icon: "code", count: DEFAULT_PHRASE_CATALOG.length },
''',
    "catalog counts",
)

text = replace_once(
    text,
    '''  return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.3-4 4-6 8-6s6.7 2 8 6"/></svg>;
}

class APIError extends Error {
''',
    '''  return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.3-4 4-6 8-6s6.7 2 8 6"/></svg>;
}

function CollectionCard({
  definition,
  variant,
  selected = false,
  onSelect,
}: {
  definition: CollectionDefinition;
  variant: "home" | "selector" | "library";
  selected?: boolean;
  onSelect: () => void;
}) {
  const title = variant === "home" ? definition.shortLabel : definition.label;
  const hint = variant === "home" ? `${definition.count} слов и терминов` : definition.description;
  return (
    <button
      type="button"
      data-lexigo-collection={definition.source}
      className={`lx-themed-${variant} lx-collection-${definition.source}${selected ? " selected" : ""}`}
      aria-pressed={variant === "selector" ? selected : undefined}
      onClick={onSelect}
    >
      <span className="lx-themed-symbol">{definition.symbol}</span>
      <div><strong>{title}</strong><small>{hint}</small></div>
      {variant === "selector" ? <b>{definition.count}</b> : <span className="lx-themed-arrow" aria-hidden="true">→</span>}
    </button>
  );
}

function CatalogSortControl({
  kind,
  mode,
  onChange,
}: {
  kind: CatalogKind;
  mode: CatalogSortMode;
  onChange: (mode: CatalogSortMode) => void;
}) {
  const itemLabel = kind === "phrases" ? "фразы" : "слова";
  return (
    <div className="lx-catalog-sort" data-lexigo-sort-for={kind}>
      <div><strong>Сортировка</strong><small>Упорядочить {itemLabel} по английскому алфавиту</small></div>
      <label>
        <span className="lx-visually-hidden">Выберите порядок сортировки</span>
        <select
          aria-label="Сортировка каталога"
          value={mode}
          onChange={(event) => onChange(event.target.value as CatalogSortMode)}
        >
          <option value="default">Порядок обучения</option>
          <option value="az">A–Z</option>
          <option value="za">Z–A</option>
        </select>
      </label>
    </div>
  );
}

function readStoredCatalogSort(kind: CatalogKind): CatalogSortMode {
  try {
    const value = window.localStorage.getItem(`${SORT_STORAGE_PREFIX}${kind}`);
    return value === "az" || value === "za" ? value : "default";
  } catch {
    return "default";
  }
}

function sortLearningItems(items: readonly LearningItem[], mode: CatalogSortMode): LearningItem[] {
  const originalIndexes = new Map(items.map((item, index) => [item.id, index]));
  return sortCatalogEntries(
    items,
    (item) => item.prompt,
    (item) => originalIndexes.get(item.id) ?? 0,
    mode,
  );
}

function localizeAPIMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (normalized.includes("invalid credentials") || normalized.includes("invalid token")) {
    return "Неверный email или пароль. Проверьте данные и попробуйте снова.";
  }
  return message;
}

class APIError extends Error {
''',
    "react helper components",
)

text = replace_once(
    text,
    '''    throw new APIError(response.status, message);
''',
    '''    throw new APIError(response.status, localizeAPIMessage(message));
''',
    "localized api errors",
)

text = replace_once(
    text,
    '''function sourceLabel(source: LessonSource): string {
  return SOURCE_OPTIONS.find((option) => option.value === source)?.label ?? source;
}
''',
    '''function sourceLabel(source: LessonSource): string {
  return SOURCE_OPTIONS.find((option) => option.value === source)?.label
    ?? COLLECTIONS.find((collection) => collection.source === source)?.label
    ?? source;
}
''',
    "collection source labels",
)

text = replace_once(
    text,
    '''  const [phraseCatalog, setPhraseCatalog] = useState<LearningItem[]>(TECHNICAL_PHRASES);
''',
    '''  const [phraseCatalog, setPhraseCatalog] = useState<LearningItem[]>(DEFAULT_PHRASE_CATALOG);
''',
    "default phrase catalog",
)

text = replace_once(
    text,
    '''  const [studyMode, setStudyMode] = useState<StudyMode>("study");
  const [phraseTopic, setPhraseTopic] = useState("all");

  const [items, setItems] = useState<LearningItem[]>([]);
''',
    '''  const [studyMode, setStudyMode] = useState<StudyMode>("study");
  const [studyView, setStudyView] = useState<StudyView>("card");
  const [phraseTopic, setPhraseTopic] = useState("all");
  const [phraseSortMode, setPhraseSortMode] = useState<CatalogSortMode>("default");
  const [allItemsSortMode, setAllItemsSortMode] = useState<CatalogSortMode>("default");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [speakingText, setSpeakingText] = useState("");
  const [speechNotice, setSpeechNotice] = useState<{ message: string; error: boolean } | null>(null);

  const [items, setItems] = useState<LearningItem[]>([]);
''',
    "declarative ui state",
)

text = replace_once(
    text,
    '''  const cardStartedAt = useRef(Date.now());
  const reviewInFlightRef = useRef(false);

  useEffect(() => {
''',
    '''  const cardStartedAt = useRef(Date.now());
  const reviewInFlightRef = useRef(false);
  const speechNoticeTimer = useRef<number | null>(null);

  useEffect(() => {
''',
    "speech timer ref",
)

text = replace_once(
    text,
    '''  }, []);

  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
''',
    '''  }, []);

  useEffect(() => {
    setPhraseSortMode(readStoredCatalogSort("phrases"));
    setAllItemsSortMode(readStoredCatalogSort("all-items"));
    return () => {
      if (speechNoticeTimer.current !== null) window.clearTimeout(speechNoticeTimer.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
''',
    "strict mode safe ui hydration",
)

text = replace_once(
    text,
    '''  const visiblePhrases = useMemo(
    () => phraseTopic === "all" ? phraseCatalog : phraseCatalog.filter((phrase) => phrase.topic === phraseTopic),
    [phraseCatalog, phraseTopic],
  );
  const selectedPhrase = navigation.detail
    ? phraseCatalog.find((phrase) => itemKey(phrase) === navigation.detail)
      ?? TECHNICAL_PHRASES.find((phrase) => phrase.id === navigation.detail)
    : undefined;
''',
    '''  const visiblePhrases = useMemo(
    () => phraseTopic === "all" ? phraseCatalog : phraseCatalog.filter((phrase) => phrase.topic === phraseTopic),
    [phraseCatalog, phraseTopic],
  );
  const sortedVisiblePhrases = useMemo(
    () => sortLearningItems(visiblePhrases, phraseSortMode),
    [visiblePhrases, phraseSortMode],
  );
  const sortedAllItems = useMemo(
    () => sortLearningItems(items, allItemsSortMode),
    [items, allItemsSortMode],
  );
  const selectedPhrase = navigation.detail
    ? phraseCatalog.find((phrase) => itemKey(phrase) === navigation.detail)
      ?? DEFAULT_PHRASE_CATALOG.find((phrase) => phrase.id === navigation.detail)
    : undefined;
''',
    "sorted catalogs",
)

text = replace_once(
    text,
    '''  function resetCardState(mode = studyMode, rated = false) {
    setRevealed(rated || mode === "study");
''',
    '''  function updateCatalogSort(kind: CatalogKind, mode: CatalogSortMode) {
    if (kind === "phrases") setPhraseSortMode(mode);
    else setAllItemsSortMode(mode);
    try {
      window.localStorage.setItem(`${SORT_STORAGE_PREFIX}${kind}`, mode);
    } catch {
      // Sorting remains available for the current session when storage is restricted.
    }
  }

  function showSpeechNotice(message: string, speechError = false) {
    if (speechNoticeTimer.current !== null) window.clearTimeout(speechNoticeTimer.current);
    setSpeechNotice({ message, error: speechError });
    speechNoticeTimer.current = window.setTimeout(() => {
      speechNoticeTimer.current = null;
      setSpeechNotice(null);
    }, 2200);
  }

  function pronounceText(text: string) {
    const value = text.trim();
    if (!value) {
      showSpeechNotice("Не удалось определить слово или фразу для озвучивания", true);
      return;
    }
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      showSpeechNotice("Озвучивание не поддерживается этим браузером", true);
      return;
    }
    if (speakingText === value) {
      window.speechSynthesis.cancel();
      setSpeakingText("");
      showSpeechNotice("Озвучивание остановлено");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(value);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb"))
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us"))
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
      ?? null;
    utterance.lang = utterance.voice?.lang || "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setSpeakingText(value);
      showSpeechNotice(`Воспроизводим: ${value}`);
    };
    utterance.onend = () => setSpeakingText((current) => current === value ? "" : current);
    utterance.onerror = () => {
      setSpeakingText((current) => current === value ? "" : current);
      showSpeechNotice("Не удалось воспроизвести произношение", true);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }

  function handleStudyTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, view: StudyView) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const currentIndex = STUDY_TABS.findIndex((tab) => tab.value === view);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + direction + STUDY_TABS.length) % STUDY_TABS.length;
    const buttons = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    setStudyView(STUDY_TABS[nextIndex].value);
    buttons[nextIndex]?.focus();
  }

  function resetCardState(mode = studyMode, rated = false) {
    setStudyView("card");
    setRevealed(rated || mode === "study");
''',
    "declarative interactions",
)

text = replace_once(
    text,
    '''          <button className="lx-icon-button" type="button" aria-label="Уведомления">
            <Icon name="bell" />
          </button>
''',
    '''          <button className="lx-icon-button" type="button" aria-label="Уведомления" onClick={() => setCalendarOpen(true)}>
            <Icon name="bell" />
          </button>
''',
    "calendar bell",
)

text = replace_once(
    text,
    '''            <div className="lx-preview-heading"><span>Пример карточки слова</span><button type="button" aria-label="Произнести слово"><Icon name="volume" /></button></div>
''',
    '''            <div className="lx-preview-heading"><span>Пример карточки слова</span><button type="button" className={speakingText === WORD_PREVIEW.prompt ? "speaking" : ""} aria-label={`${speakingText === WORD_PREVIEW.prompt ? "Остановить произношение" : "Произнести"}: ${WORD_PREVIEW.prompt}`} onClick={() => pronounceText(WORD_PREVIEW.prompt)}><Icon name="volume" /></button></div>
''',
    "home speech button",
)

text = replace_once(
    text,
    '''        <section className="lx-section-grid">
          {SOURCE_OPTIONS.filter((option) => option.value !== "mixed").map((option) => (
            <button key={option.value} type="button" onClick={() => navigate(option.value === "phrases" ? { view: "phrases" } : { view: "learn", source: option.value })}>
              <span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span>
              <div><strong>{option.label}</strong><small>{option.count} {option.value === "phrases" ? "фразы" : "слов"}</small></div>
              <Icon name="arrow" size={17}/>
            </button>
          ))}
        </section>
''',
    '''        <section className="lx-section-grid">
          {SOURCE_OPTIONS.filter((option) => option.value !== "mixed").map((option) => (
            <button key={option.value} type="button" onClick={() => navigate(option.value === "phrases" ? { view: "phrases" } : { view: "learn", source: option.value })}>
              <span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span>
              <div><strong>{option.label}</strong><small>{option.count} {option.value === "phrases" ? "фразы" : "слов"}</small></div>
              <Icon name="arrow" size={17}/>
            </button>
          ))}
          {COLLECTIONS.map((definition) => (
            <CollectionCard
              key={definition.source}
              definition={definition}
              variant="home"
              onSelect={() => navigate({ view: "learn", source: definition.source })}
            />
          ))}
        </section>
''',
    "home collections",
)

text = replace_once(
    text,
    '''              {SOURCE_OPTIONS.map((option) => (
                <button key={option.value} type="button" className={source === option.value ? "selected" : ""} onClick={() => setSource(option.value)}>
                  <span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span>
                  <div><strong>{option.label}</strong><small>{option.hint}</small></div>
                  <b>{option.count}</b>
                </button>
              ))}
''',
    '''              {SOURCE_OPTIONS.map((option) => (
                <button key={option.value} type="button" className={source === option.value ? "selected" : ""} onClick={() => setSource(option.value)}>
                  <span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span>
                  <div><strong>{option.label}</strong><small>{option.hint}</small></div>
                  <b>{option.count}</b>
                </button>
              ))}
              {COLLECTIONS.map((definition) => (
                <CollectionCard
                  key={definition.source}
                  definition={definition}
                  variant="selector"
                  selected={source === definition.source}
                  onSelect={() => setSource(definition.source)}
                />
              ))}
''',
    "learn collections",
)

text = replace_once(
    text,
    '''        <div className="lx-topic-filter">{phraseTopics.map((topic) => <button key={topic} type="button" className={phraseTopic === topic ? "selected" : ""} onClick={() => setPhraseTopic(topic)}>{topic === "all" ? "Все темы" : topic}</button>)}</div>
        <section className="lx-phrase-grid">{visiblePhrases.map((phrase) => <button key={itemKey(phrase)} type="button" onClick={() => navigate({ view: "phrases", detail: itemKey(phrase) })}><span>{phrase.topic}</span><strong>{phrase.prompt}</strong><small>{phrase.answer}</small><em>Открыть карточку <Icon name="arrow" size={15}/></em></button>)}</section>
        <div className="lx-page-actions"><button className="lx-button ghost" type="button" onClick={() => startLesson(session, { source: "phrases", size: "all", mode: "all", items: visiblePhrases })}>Посмотреть выбранные</button><button className="lx-button primary" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "study", items: visiblePhrases })}>Изучать выбранную тему</button></div>
''',
    '''        <div className="lx-topic-filter">{phraseTopics.map((topic) => <button key={topic} type="button" className={phraseTopic === topic ? "selected" : ""} onClick={() => setPhraseTopic(topic)}>{topic === "all" ? "Все темы" : topic}</button>)}</div>
        <CatalogSortControl kind="phrases" mode={phraseSortMode} onChange={(mode) => updateCatalogSort("phrases", mode)} />
        <section className="lx-phrase-grid">{sortedVisiblePhrases.map((phrase) => <button key={itemKey(phrase)} type="button" onClick={() => navigate({ view: "phrases", detail: itemKey(phrase) })}><span>{phrase.topic}</span><strong>{phrase.prompt}</strong><small>{phrase.answer}</small><em>Открыть карточку <Icon name="arrow" size={15}/></em></button>)}</section>
        <div className="lx-page-actions"><button className="lx-button ghost" type="button" onClick={() => startLesson(session, { source: "phrases", size: "all", mode: "all", items: sortedVisiblePhrases })}>Посмотреть выбранные</button><button className="lx-button primary" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "study", items: sortedVisiblePhrases })}>Изучать выбранную тему</button></div>
''',
    "declarative phrase sorting",
)

text = replace_once(
    text,
    '''        <section className="lx-page-heading"><div><span>СЛОВАРЬ</span><h1>Материалы, организованные по учебной задаче</h1><p>579 слов и {progress?.totalPhrases ?? TECHNICAL_PHRASES.length} технических фраз с общей системой повторений.</p></div><div className="lx-heading-badge"><Icon name="library"/><span>{progress ? `${progress.masteredWords + progress.masteredPhrases} освоено` : "Откройте раздел"}</span></div></section>
        <section className="lx-library-grid">{SOURCE_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => option.value === "phrases" ? navigate({ view: "phrases" }) : navigate({ view: "learn", source: option.value })}><span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span><strong>{option.label}</strong><small>{option.count} {option.value === "phrases" ? "фразы" : "слов"}</small><p>{option.hint}</p><em>Открыть <Icon name="arrow" size={15}/></em></button>)}</section>
''',
    '''        <section className="lx-page-heading"><div><span>СЛОВАРЬ</span><h1>Материалы, организованные по учебной задаче</h1><p>{progress?.totalWords ?? WORD_CATALOG_COUNT} слов и {progress?.totalPhrases ?? DEFAULT_PHRASE_CATALOG.length} технических фраз с общей системой повторений.</p></div><div className="lx-heading-badge"><Icon name="library"/><span>{progress ? `${progress.masteredWords + progress.masteredPhrases} освоено` : "Откройте раздел"}</span></div></section>
        <section className="lx-library-grid">
          {SOURCE_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => option.value === "phrases" ? navigate({ view: "phrases" }) : navigate({ view: "learn", source: option.value })}><span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span><strong>{option.label}</strong><small>{option.count} {option.value === "phrases" ? "фразы" : "слов"}</small><p>{option.hint}</p><em>Открыть <Icon name="arrow" size={15}/></em></button>)}
          {COLLECTIONS.map((definition) => (
            <CollectionCard
              key={definition.source}
              definition={definition}
              variant="library"
              onSelect={() => navigate({ view: "learn", source: definition.source })}
            />
          ))}
        </section>
''',
    "library collections and counts",
)

text = replace_once(
    text,
    '''  function renderAllItems() {
    return (
      <section className="lx-all-items">
        <div className="lx-lesson-top"><button className="lx-button ghost" type="button" onClick={() => navigate({ view: source === "phrases" ? "phrases" : "learn", source })}>← Назад</button><strong>{items.length} элементов · {sourceLabel(source)}</strong></div>
        <div>{items.map((item, index) => <article key={item.id}><span>{index + 1}</span><div><small>{item.partOfSpeech} · {item.topic}</small><h3>{item.prompt}</h3>{item.cloze ? <p>{item.cloze}</p> : null}<strong>{item.answer}</strong>{item.examples[0] ? <p>{item.examples[0]}</p> : null}</div></article>)}</div>
      </section>
    );
  }
''',
    '''  function renderAllItems() {
    return (
      <section className="lx-all-items">
        <div className="lx-lesson-top"><button className="lx-button ghost" type="button" onClick={() => navigate({ view: source === "phrases" ? "phrases" : "learn", source })}>← Назад</button><strong>{items.length} элементов · {sourceLabel(source)}</strong></div>
        <CatalogSortControl kind="all-items" mode={allItemsSortMode} onChange={(mode) => updateCatalogSort("all-items", mode)} />
        <div>{sortedAllItems.map((item, index) => <article key={item.id}><span>{index + 1}</span><div><small>{item.partOfSpeech} · {item.topic}</small><h3>{item.prompt}</h3>{item.cloze ? <p>{item.cloze}</p> : null}<strong>{item.answer}</strong>{item.examples[0] ? <p>{item.examples[0]}</p> : null}</div></article>)}</div>
      </section>
    );
  }
''',
    "declarative all-items sorting",
)

text = replace_once(
    text,
    '''          <main className="lx-study-column">
            <div className="lx-study-tabs"><button type="button" className="active"><Icon name="book"/>Карточка</button><button type="button"><Icon name="phrases"/>Пример</button><button type="button"><Icon name="library"/>Контекст</button></div>
''',
    '''          <main className="lx-study-column" data-study-view={studyView}>
            <div className="lx-study-tabs" role="tablist" aria-label="Представление учебной карточки">
              {STUDY_TABS.map((tab) => {
                const selected = studyView === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    className={selected ? "active" : ""}
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setStudyView(tab.value)}
                    onKeyDown={(event) => handleStudyTabKeyDown(event, tab.value)}
                  >
                    <Icon name={tab.icon}/>{tab.label}
                  </button>
                );
              })}
            </div>
''',
    "declarative study tabs",
)

text = replace_once(
    text,
    '''                  <div className="lx-word-title-row"><div><h1>{currentItem.prompt}</h1>{currentItem.phonetic ? <p>{currentItem.phonetic}</p> : null}</div><button type="button" aria-label="Произнести"><Icon name="volume"/></button></div>
''',
    '''                  <div className="lx-word-title-row"><div><h1>{currentItem.prompt}</h1>{currentItem.phonetic ? <p>{currentItem.phonetic}</p> : null}</div><button type="button" className={speakingText === currentItem.prompt ? "speaking" : ""} aria-label={`${speakingText === currentItem.prompt ? "Остановить произношение" : "Произнести"}: ${currentItem.prompt}`} onClick={() => pronounceText(currentItem.prompt)}><Icon name="volume"/></button></div>
''',
    "lesson speech button",
)

text = replace_once(
    text,
    '''      {error ? <p className="lx-error" role="alert">{error}</p> : null}
      <div className="lx-view">{view}</div>
      <nav className="lx-mobile-nav" aria-label="Мобильная навигация">
        {PRIMARY_NAVIGATION.map((entry) => <button key={entry.view} type="button" className={navigation.view === entry.view ? "active" : ""} onClick={() => navigate({ view: entry.view })}><Icon name={navigationIcon(entry.view)}/><span>{entry.shortLabel}</span></button>)}
      </nav>
''',
    '''      {error ? <p className="lx-error" role="alert">{error}</p> : null}
      <div className="lx-view">
        {view}
        <CalendarReminderIntegration
          open={calendarOpen}
          showCard={navigation.view === "progress" && Boolean(session && progress)}
          onOpen={() => setCalendarOpen(true)}
          onClose={() => setCalendarOpen(false)}
        />
      </div>
      <nav className="lx-mobile-nav" aria-label="Мобильная навигация">
        {PRIMARY_NAVIGATION.map((entry) => <button key={entry.view} type="button" className={navigation.view === entry.view ? "active" : ""} onClick={() => navigate({ view: entry.view })}><Icon name={navigationIcon(entry.view)}/><span>{entry.shortLabel}</span></button>)}
      </nav>
      {speechNotice ? <div className={`lx-speech-toast visible${speechNotice.error ? " error" : ""}`} role="status">{speechNotice.message}</div> : null}
''',
    "declarative calendar and speech output",
)

APP.write_text(text)
print("issue 36 premium app patch applied")
