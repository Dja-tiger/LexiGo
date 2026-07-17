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
    '''  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const cardStartedAt = useRef(Date.now());
  const reviewInFlightRef = useRef(false);
  const speechNoticeTimer = useRef<number | null>(null);
''',
    '''  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [cardStartedAt, setCardStartedAt] = useState(0);
  const reviewInFlightRef = useRef(false);
''',
    "purity-safe state",
)

replace_once(
    '''    return () => {
      window.clearTimeout(storageTimer);
      if (speechNoticeTimer.current !== null) window.clearTimeout(speechNoticeTimer.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);
''',
    '''    return () => {
      window.clearTimeout(storageTimer);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!lessonStarted) return;
    const timer = window.setTimeout(() => setCardStartedAt(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, [lessonStarted, currentIndex, studyMode]);

  useEffect(() => {
    if (!speechNotice) return;
    const timer = window.setTimeout(() => setSpeechNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [speechNotice]);

  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);
''',
    "effect-owned timing",
)

replace_once(
    '''  useEffect(() => {
    if (!session || hydratedUserID === session.user.id) return;
    let cancelled = false;
    void hydrateAccount(session).then(() => {
      if (!cancelled) setHydratedUserID(session.user.id);
    });
    return () => {
      cancelled = true;
    };
  }, [session, hydratedUserID, hydrateAccount]);
''',
    '''  useEffect(() => {
    if (!session || hydratedUserID === session.user.id) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void hydrateAccount(session).then(() => {
        if (!cancelled) setHydratedUserID(session.user.id);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [session, hydratedUserID, hydrateAccount]);
''',
    "deferred account hydration",
)

replace_once(
    '''  function showSpeechNotice(message: string, speechError = false) {
    if (speechNoticeTimer.current !== null) window.clearTimeout(speechNoticeTimer.current);
    setSpeechNotice({ message, error: speechError });
    speechNoticeTimer.current = window.setTimeout(() => {
      speechNoticeTimer.current = null;
      setSpeechNotice(null);
    }, 2200);
  }
''',
    '''  function showSpeechNotice(message: string, speechError = false) {
    setSpeechNotice({ message, error: speechError });
  }
''',
    "effect-owned speech notice",
)

replace_once(
    '''    setSelectedAnswer("");
    setTypedAnswer("");
    cardStartedAt.current = Date.now();
  }
''',
    '''    setSelectedAnswer("");
    setTypedAnswer("");
  }
''',
    "pure card reset",
)

replace_once(
    'responseMs: Math.max(0, Date.now() - cardStartedAt.current),',
    'responseMs: Math.max(0, Date.now() - cardStartedAt),',
    "state-backed response timing",
)

path.write_text(text)
print("issue 36 React purity fix applied")
