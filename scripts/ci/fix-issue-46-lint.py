from pathlib import Path

path = Path("frontend/components/lexigo-premium-app.tsx")
content = path.read_text()

replacements = [
    (
        '''  const navigationRef = useRef(navigation);
  const pendingNavigationRef = useRef<PendingNavigationFocus | null>(null);
  const announcementCounterRef = useRef(0);
  const [routeAnnouncement, setRouteAnnouncement] = useState({ id: 0, message: "" });''',
        '''  const navigationRef = useRef(navigation);
  const announcementCounterRef = useRef(0);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigationFocus | null>(null);
  const [routeAnnouncement, setRouteAnnouncement] = useState({ id: 0, message: "" });''',
    ),
    (
        '''      pendingNavigationRef.current = {
        identity: navigationIdentity(next),
        scroll: navigationScrollFromHistory(event.state),
        behavior: "auto",
      };''',
        '''      setPendingNavigation({
        identity: navigationIdentity(next),
        scroll: navigationScrollFromHistory(event.state),
        behavior: "auto",
      });''',
    ),
    (
        '''  useLayoutEffect(() => {
    const pending = pendingNavigationRef.current;
    if (!pending || pending.identity !== navigationIdentity(navigation)) return;
    pendingNavigationRef.current = null;

    const frame = window.requestAnimationFrame(() => {''',
        '''  useLayoutEffect(() => {
    navigationRef.current = navigation;
    if (!pendingNavigation || pendingNavigation.identity !== navigationIdentity(navigation)) return;
    const pending = pendingNavigation;

    const frame = window.requestAnimationFrame(() => {''',
    ),
    (
        '''  }, [navigation]);''',
        '''  }, [navigation, pendingNavigation]);''',
    ),
    (
        '''      createNavigationHistoryState(navigationRef.current, { x: window.scrollX, y: window.scrollY }),''',
        '''      createNavigationHistoryState(navigation, { x: window.scrollX, y: window.scrollY }),''',
    ),
    (
        '''    pendingNavigationRef.current = {
      identity: navigationIdentity(target),
      scroll: { x: 0, y: 0 },
      behavior: navigationScrollBehavior(window),
    };
    navigationRef.current = target;''',
        '''    setPendingNavigation({
      identity: navigationIdentity(target),
      scroll: { x: 0, y: 0 },
      behavior: navigationScrollBehavior(window),
    });''',
    ),
]

for old, new in replacements:
    if old not in content:
        raise SystemExit(f"expected refs-lint block not found: {old[:120]}")
    content = content.replace(old, new, 1)

path.write_text(content)
