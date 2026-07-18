from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


path = Path("frontend/components/lexigo-premium-app.tsx")
source = path.read_text()
source = replace_once(
    source,
    '''    return () => {
      window.clearTimeout(storageTimer);
      window.speechSynthesis?.cancel();
    };
''',
    '''    return () => window.clearTimeout(storageTimer);
''',
    "global speech cleanup",
)
source = replace_once(
    source,
    '''  useEffect(() => {
    if (!speechNotice) return;
    const timer = window.setTimeout(() => setSpeechNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [speechNotice]);

  useEffect(() => {
    if (!speakingText) return;
    const wordCount = Math.max(1, speakingText.trim().split(/\s+/).length);
    const timeoutMs = Math.min(10_000, Math.max(1_500, wordCount * 700));
    const timer = window.setTimeout(() => setSpeakingText(""), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [speakingText]);

''',
    "",
    "legacy speech effects",
)
path.write_text(source)
