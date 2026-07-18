from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


component_path = Path("frontend/components/lexigo-premium-app.tsx")
component = component_path.read_text()

component = replace_once(
    component,
    'import { CalendarReminderIntegration } from "./calendar-reminder-integration";\n',
    'import { CalendarReminderIntegration } from "./calendar-reminder-integration";\nimport { SpeechPlayerButton } from "./speech-player-button";\n',
    "speech component import",
)

component = replace_once(
    component,
    '  const [calendarOpen, setCalendarOpen] = useState(false);\n  const [speakingText, setSpeakingText] = useState("");\n  const [speechNotice, setSpeechNotice] = useState<{ message: string; error: boolean } | null>(null);\n',
    '  const [calendarOpen, setCalendarOpen] = useState(false);\n',
    "legacy speech state",
)

component = replace_once(
    component,
    '''  function showSpeechNotice(message: string, speechError = false) {
    setSpeechNotice({ message, error: speechError });
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
    utterance.onend = () => setSpeakingText((current) => current === value ? "" : current);
    utterance.onerror = () => {
      setSpeakingText((current) => current === value ? "" : current);
      showSpeechNotice("Не удалось воспроизвести произношение", true);
    };

    setSpeakingText(value);
    showSpeechNotice(`Воспроизводим: ${value}`);
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingText("");
      showSpeechNotice("Не удалось воспроизвести произношение", true);
    }
  }

''',
    '',
    "legacy speech helper",
)

component = replace_once(
    component,
    '            <div className="lx-preview-heading"><span>Пример карточки слова</span><button type="button" className={speakingText === WORD_PREVIEW.prompt ? "speaking" : ""} aria-label={`${speakingText === WORD_PREVIEW.prompt ? "Остановить произношение" : "Произнести"}: ${WORD_PREVIEW.prompt}`} onClick={() => pronounceText(WORD_PREVIEW.prompt)}><Icon name="volume" /></button></div>',
    '            <div className="lx-preview-heading"><span>Пример карточки слова</span><SpeechPlayerButton text={WORD_PREVIEW.prompt}><Icon name="volume" /></SpeechPlayerButton></div>',
    "home speech control",
)

component = replace_once(
    component,
    '          <div className="lx-detail-content"><span lang="en">{selectedPhrase.topic}</span><h1 lang="en">{selectedPhrase.prompt}</h1><strong lang="ru">{selectedPhrase.answer}</strong>{selectedPhrase.cloze ? <div><small>Cloze practice</small><p lang="en">{selectedPhrase.cloze}</p></div> : null}{selectedPhrase.examples[0] ? <div><small>Рабочий пример</small><p lang="en">{selectedPhrase.examples[0]}</p></div> : null}{selectedPhrase.note ? <div><small>Как использовать</small><p>{selectedPhrase.note}</p></div> : null}<div className="lx-hero-actions"><button className="lx-button primary" type="button" onClick={startSelectedPhraseLesson}>Изучить эту фразу</button><button className="lx-button ghost" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "recall" })}>Повторить due-фразы</button></div></div>',
    '''          <div className="lx-detail-content">
            <span lang="en">{selectedPhrase.topic}</span>
            <div className="lx-detail-speech-row">
              <h1 lang="en">{selectedPhrase.prompt}</h1>
              <SpeechPlayerButton text={selectedPhrase.prompt}><Icon name="volume" /></SpeechPlayerButton>
            </div>
            <strong lang="ru">{selectedPhrase.answer}</strong>
            {selectedPhrase.cloze ? <div><small>Cloze practice</small><p lang="en">{selectedPhrase.cloze}</p></div> : null}
            {selectedPhrase.examples[0] ? <div><small>Рабочий пример</small><p lang="en">{selectedPhrase.examples[0]}</p></div> : null}
            {selectedPhrase.note ? <div><small>Как использовать</small><p>{selectedPhrase.note}</p></div> : null}
            <div className="lx-hero-actions"><button className="lx-button primary" type="button" onClick={startSelectedPhraseLesson}>Изучить эту фразу</button><button className="lx-button ghost" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "recall" })}>Повторить due-фразы</button></div>
          </div>''',
    "phrase detail speech control",
)

component = replace_once(
    component,
    '                  <div className="lx-word-title-row"><div><h1 lang="en">{currentItem.prompt}</h1>{currentItem.phonetic ? <p lang="en">{currentItem.phonetic}</p> : null}</div><button type="button" className={speakingText === currentItem.prompt ? "speaking" : ""} aria-label={`${speakingText === currentItem.prompt ? "Остановить произношение" : "Произнести"}: ${currentItem.prompt}`} onClick={() => pronounceText(currentItem.prompt)}><Icon name="volume"/></button></div>',
    '                  <div className="lx-word-title-row"><div><h1 lang="en">{currentItem.prompt}</h1>{currentItem.phonetic ? <p lang="en">{currentItem.phonetic}</p> : null}</div><SpeechPlayerButton text={currentItem.prompt}><Icon name="volume"/></SpeechPlayerButton></div>',
    "study lesson speech control",
)

component = replace_once(
    component,
    '                  {phraseCloze && !revealed ? <><span>ВОССТАНОВИТЕ АНГЛИЙСКИЙ ПРОПУСК</span><h1 lang="en">{currentItem.cloze}</h1></> : <><span>{currentItem.kind === "phrase" ? "ТЕХНИЧЕСКАЯ ФРАЗА" : "ПЕРЕВЕДИТЕ СЛОВО"}</span><h1 lang="en">{currentItem.prompt}</h1>{currentItem.phonetic ? <p lang="en">{currentItem.phonetic}</p> : null}</>}',
    '                  {phraseCloze && !revealed ? <><span>ВОССТАНОВИТЕ АНГЛИЙСКИЙ ПРОПУСК</span><div className="lx-test-prompt-row"><h1 lang="en">{currentItem.cloze}</h1></div></> : <><span>{currentItem.kind === "phrase" ? "ТЕХНИЧЕСКАЯ ФРАЗА" : "ПЕРЕВЕДИТЕ СЛОВО"}</span><div className="lx-test-prompt-row"><div><h1 lang="en">{currentItem.prompt}</h1>{currentItem.phonetic ? <p lang="en">{currentItem.phonetic}</p> : null}</div><SpeechPlayerButton text={currentItem.prompt}><Icon name="volume"/></SpeechPlayerButton></div></>}',
    "recall lesson speech control",
)

component = replace_once(
    component,
    '      {speechNotice ? <div className={`lx-speech-toast visible${speechNotice.error ? " error" : ""}`} role="status">{speechNotice.message}</div> : null}\n',
    '',
    "legacy speech toast",
)

component_path.write_text(component)

ownership_path = Path("frontend/e2e/ui-ownership.spec.ts")
ownership = ownership_path.read_text()
ownership = replace_once(
    ownership,
    '  const speech = page.locator(".lx-word-title-row > button");',
    '  const speech = page.locator(\'[data-speech-text="absolute"] > button\');',
    "ownership speech locator",
)
ownership = replace_once(
    ownership,
    '  await expect(page.getByRole("status").filter({ hasText: "Воспроизводим: absolute" })).toBeVisible();',
    '  await expect(page.locator(\'[data-speech-text="absolute"] [role="status"]\')).toContainText("Воспроизводим: absolute");',
    "ownership speech status",
)
ownership_path.write_text(ownership)

mobile_css_path = Path("frontend/app/mobile-pwa-fixes.css")
mobile_css = mobile_css_path.read_text()
mobile_css = replace_once(
    mobile_css,
    '''.lx-speech-toast {
  position: fixed;
  z-index: 400;
  right: 18px;
  bottom: calc(env(safe-area-inset-bottom) + 92px);
  max-width: min(340px, calc(100% - 36px));
  transform: translateY(18px);
  border: 1px solid rgba(86, 211, 166, 0.28);
  border-radius: 14px;
  padding: 12px 15px;
  opacity: 0;
  color: #bdf5df;
  background: rgba(11, 54, 42, 0.95);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.36);
  transition: opacity 160ms ease, transform 160ms ease;
  pointer-events: none;
}

.lx-speech-toast.visible { transform: translateY(0); opacity: 1; }
.lx-speech-toast.error { border-color: rgba(255, 91, 119, 0.28); color: #ffb8c3; background: rgba(78, 20, 35, 0.96); }

''',
    '',
    "legacy speech toast css",
)
mobile_css_path.write_text(mobile_css)
