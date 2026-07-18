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
    """  const navigationRef = useRef(navigation);
  const navigationTabsRef = useRef<NavigationTabSnapshots>({});
  const lessonNavigationLockRef = useRef(false);
  const announcementCounterRef = useRef(0);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigationFocus | null>(null);
  const [routeAnnouncement, setRouteAnnouncement] = useState({ id: 0, message: "" });
""",
    """  const navigationRef = useRef(navigation);
  const lessonNavigationLockRef = useRef(false);
  const announcementCounterRef = useRef(0);
  const [navigationTabs, setNavigationTabs] = useState<NavigationTabSnapshots>({});
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigationFocus | null>(null);
  const [routeAnnouncement, setRouteAnnouncement] = useState({ id: 0, message: "" });
""",
    "navigation snapshot state",
)

replace_once(
    """      navigationTabsRef.current = rememberNavigationTabSnapshot(
        navigationTabsRef.current,
        next,
        scroll,
      );
""",
    """      setNavigationTabs((current) => rememberNavigationTabSnapshot(
        current,
        next,
        scroll,
      ));
""",
    "history apply snapshot",
)

replace_once(
    """      navigationTabsRef.current = rememberNavigationTabSnapshot(
        navigationTabsRef.current,
        current,
        scroll,
      );
""",
    """      setNavigationTabs((snapshots) => rememberNavigationTabSnapshot(
        snapshots,
        current,
        scroll,
      ));
""",
    "history scroll snapshot",
)

replace_once(
    """    navigationTabsRef.current = rememberNavigationTabSnapshot(
      navigationTabsRef.current,
      navigation,
      currentScroll,
    );
""",
    """    setNavigationTabs((current) => rememberNavigationTabSnapshot(
      current,
      navigation,
      currentScroll,
    ));
""",
    "manual navigation snapshot",
)

replace_once(
    """    const destination = navigationTabDestination(navigationTabsRef.current, view);
""",
    """    const destination = navigationTabDestination(navigationTabs, view);
""",
    "tab destination state",
)

if "navigationTabsRef" in text:
    raise SystemExit("navigationTabsRef remained after state migration")

path.write_text(text)
