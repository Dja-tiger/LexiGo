from pathlib import Path

path = Path("frontend/components/lexigo-premium-app.tsx")
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    text = text.replace(old, new, 1)


replace_once(
    '''  useEffect(() => {
    if (!speechNotice) return;
    const timer = window.setTimeout(() => setSpeechNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [speechNotice]);

  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);
''',
    '''  useEffect(() => {
    if (!speechNotice) return;
    const timer = window.setTimeout(() => setSpeechNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [speechNotice]);

  useEffect(() => {
    if (!speakingText) return;
    const wordCount = Math.max(1, speakingText.trim().split(/\\s+/).length);
    const timeoutMs = Math.min(10_000, Math.max(1_500, wordCount * 700));
    const timer = window.setTimeout(() => setSpeakingText(""), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [speakingText]);

  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);
''',
    "speech fallback lifecycle",
)

replace_once(
    '''    utterance.lang = utterance.voice?.lang || "en-US";
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
''',
    '''    utterance.lang = utterance.voice?.lang || "en-US";
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
''',
    "optimistic speech state",
)

path.write_text(text)
print("issue 36 speech lifecycle fix applied")
