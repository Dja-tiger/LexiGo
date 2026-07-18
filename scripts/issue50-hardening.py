from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


# Stable imperative tab store: scroll snapshots must not trigger React renders.
tabs_path = Path("frontend/lib/navigation-tabs.ts")
tabs = tabs_path.read_text()
if "export type NavigationTabStore" in tabs:
    raise SystemExit("navigation tab store already exists")
tabs += """

export type NavigationTabStore = {
  remember: (target: NavigationTarget, scroll: NavigationScrollPosition) => void;
  destination: (view: PrimaryNavigationView) => NavigationTabSnapshot;
};

export function createNavigationTabStore(
  initial: NavigationTabSnapshots = {},
): NavigationTabStore {
  let snapshots: NavigationTabSnapshots = {};
  for (const view of PRIMARY_VIEWS) {
    const saved = initial[view];
    if (saved) snapshots = rememberNavigationTabSnapshot(snapshots, saved.target, saved.scroll);
  }

  return {
    remember(target, scroll) {
      snapshots = rememberNavigationTabSnapshot(snapshots, target, scroll);
    },
    destination(view) {
      return navigationTabDestination(snapshots, view);
    },
  };
}
"""
tabs_path.write_text(tabs)

# Store contract coverage.
tabs_test_path = Path("frontend/lib/navigation-tabs.test.ts")
tabs_test = tabs_test_path.read_text()
tabs_test = replace_once(
    tabs_test,
    'import {\n  isPrimaryNavigationView,',
    'import {\n  createNavigationTabStore,\n  isPrimaryNavigationView,',
    "store test import",
)
tabs_test = replace_once(
    tabs_test,
    """  it("recognizes only the five primary destinations", () => {
""",
    """  it("keeps frequent scroll snapshots outside React render state", () => {
    const store = createNavigationTabStore();
    store.remember({ view: "phrases", detail: "status-update" }, { x: 0, y: 640 });

    const first = store.destination("phrases");
    first.target.detail = "mutated";
    first.scroll.y = 0;

    expect(store.destination("phrases")).toEqual({
      target: { view: "phrases", detail: "status-update" },
      scroll: { x: 0, y: 640 },
    });
  });

  it("recognizes only the five primary destinations", () => {
""",
    "store test",
)
tabs_test_path.write_text(tabs_test)

# Component migration to the stable store and replace-on-exit history semantics.
component_path = Path("frontend/components/lexigo-premium-app.tsx")
component = component_path.read_text()
component = replace_once(
    component,
    """import {
  navigationTabDestination,
  rememberNavigationTabSnapshot,
  type NavigationTabSnapshots,
  type PrimaryNavigationView,
} from "../lib/navigation-tabs";
""",
    """import {
  createNavigationTabStore,
  type PrimaryNavigationView,
} from "../lib/navigation-tabs";
""",
    "tab store imports",
)
component = replace_once(
    component,
    """  const announcementCounterRef = useRef(0);
  const [navigationTabs, setNavigationTabs] = useState<NavigationTabSnapshots>({});
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigationFocus | null>(null);
""",
    """  const announcementCounterRef = useRef(0);
  const [navigationTabs] = useState(createNavigationTabStore);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigationFocus | null>(null);
""",
    "tab store state",
)
component = replace_once(
    component,
    """      setNavigationTabs((current) => rememberNavigationTabSnapshot(
        current,
        next,
        scroll,
      ));
""",
    """      navigationTabs.remember(next, scroll);
""",
    "history apply snapshot",
)
component = replace_once(
    component,
    """      setNavigationTabs((snapshots) => rememberNavigationTabSnapshot(
        snapshots,
        current,
        scroll,
      ));
""",
    """      navigationTabs.remember(current, scroll);
""",
    "history scroll snapshot",
)
component = replace_once(
    component,
    """  }, []);

  useEffect(() => {
    const target = new URL(window.location.href);
""",
    """  }, [navigationTabs]);

  useEffect(() => {
    const target = new URL(window.location.href);
""",
    "history effect dependency",
)
component = replace_once(
    component,
    """    setNavigationTabs((current) => rememberNavigationTabSnapshot(
      current,
      navigation,
      currentScroll,
    ));
""",
    """    navigationTabs.remember(navigation, currentScroll);
""",
    "manual navigation snapshot",
)
component = replace_once(
    component,
    """    const destination = navigationTabDestination(navigationTabs, view);
""",
    """    const destination = navigationTabs.destination(view);
""",
    "tab destination",
)
component = replace_once(
    component,
    """    navigate({ view: target }, false, { allowLessonExit: true });
""",
    """    navigate({ view: target }, true, { allowLessonExit: true });
""",
    "replace lesson history on exit",
)
for forbidden in ["setNavigationTabs", "NavigationTabSnapshots", "rememberNavigationTabSnapshot", "navigationTabDestination("]:
    if forbidden in component:
        raise SystemExit(f"component still contains obsolete tab state token: {forbidden}")
component_path.write_text(component)

# Keep the medium rail fully operable in short landscape viewports.
css_path = Path("frontend/app/adaptive-navigation.css")
css = css_path.read_text()
if "max-height: 600px" in css:
    raise SystemExit("short landscape CSS already exists")
css += """

@media (min-width: 720px) and (max-width: 1099px) and (max-height: 600px) {
  .lx-navigation-rail {
    top: calc(84px + env(safe-area-inset-top));
    max-height: calc(100dvh - 92px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    gap: 4px;
    padding: 6px;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
  }

  .lx-navigation-rail button {
    min-height: 48px;
    grid-template-rows: 20px auto;
    gap: 2px;
    padding: 5px 4px;
  }

  .lx-navigation-rail button.active::before {
    top: 10px;
    bottom: 10px;
  }
}
"""
css_path.write_text(css)

# Boundary, landscape containment and stale lesson history regressions.
e2e_path = Path("frontend/e2e/adaptive-navigation.spec.ts")
e2e = e2e_path.read_text()
e2e = replace_once(
    e2e,
    """test("medium width uses a labelled rail and restores the previous tab target and scroll", async ({ page }, testInfo) => {
""",
    """test("breakpoint boundaries expose exactly one labelled primary navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Breakpoint boundaries are asserted once.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  const cases = [
    { width: 719, expected: ".lx-mobile-nav" },
    { width: 720, expected: ".lx-navigation-rail" },
    { width: 1099, expected: ".lx-navigation-rail" },
    { width: 1100, expected: ".lx-nav" },
  ];

  for (const current of cases) {
    await page.setViewportSize({ width: current.width, height: 800 });
    const visibility = await page.locator(".lx-nav, .lx-navigation-rail, .lx-mobile-nav")
      .evaluateAll((elements) => elements.map((element) => ({
        className: element.className,
        visible: window.getComputedStyle(element).display !== "none",
      })));
    expect(visibility.filter((entry) => entry.visible)).toHaveLength(1);
    await expect(page.locator(current.expected)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test("medium width uses a labelled rail and restores the previous tab target and scroll", async ({ page }, testInfo) => {
""",
    "breakpoint boundary test",
)
e2e = replace_once(
    e2e,
    """  await expectMinimumNavigationTargets(page, ".lx-navigation-rail");
  await expect(rail.getByText("Прогресс", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
""",
    """  await expectMinimumNavigationTargets(page, ".lx-navigation-rail");
  await expect(rail.getByText("Прогресс", { exact: true })).toBeVisible();
  const railBox = await rail.boundingBox();
  expect(railBox).not.toBeNull();
  expect(railBox!.y + railBox!.height).toBeLessThanOrEqual(390);
  expect(await rail.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  await expectNoHorizontalOverflow(page);
});
""",
    "short landscape containment",
)
e2e = replace_once(
    e2e,
    """  await page.getByRole("button", { name: "Сохранить и выйти", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
  await expect(navigation(page, ".lx-navigation-rail")).toBeVisible();
});
""",
    """  await page.getByRole("button", { name: "Сохранить и выйти", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
  await expect(navigation(page, ".lx-navigation-rail")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/view=learn/);
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();
  await expect(page).not.toHaveURL(/view=lesson/);
});
""",
    "stale lesson history test",
)
e2e_path.write_text(e2e)
