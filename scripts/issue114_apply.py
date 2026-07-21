#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one literal match, found {count}")
    write(path, content.replace(old, new, 1))


def sub_once(path: str, pattern: str, replacement: str) -> None:
    content = read(path)
    updated, count = re.subn(pattern, replacement, content, count=1, flags=re.DOTALL)
    if count != 1:
        raise RuntimeError(f"{path}: expected one regex match, found {count}")
    write(path, updated)


APP = "frontend/components/lexigo-premium-app.tsx"

replace_once(
    APP,
    '''import {\n  createNavigationTabStore,\n  type PrimaryNavigationView,\n} from "../lib/navigation-tabs";\n''',
    '''import {\n  createNavigationTabStore,\n  type PrimaryNavigationView,\n} from "../lib/navigation-tabs";\nimport { phraseCatalogFilters, phraseCatalogTarget } from "../lib/phrase-navigation";\n''',
)

replace_once(
    APP,
    '''  const [phraseCatalog, setPhraseCatalog] = useState<LearningItem[]>([]);\n  const [phraseCatalogStatus, setPhraseCatalogStatus] = useState<ResourceStatus>(idleResourceStatus);\n  const [phraseCatalogPageInfo, setPhraseCatalogPageInfo] = useState<CatalogPageInfo>(() => paginateCatalogEntries(DEFAULT_PHRASE_CATALOG, 1).info);''',
    '''  const [phraseCatalog, setPhraseCatalog] = useState<LearningItem[]>([]);\n  const [phraseCatalogStatus, setPhraseCatalogStatus] = useState<ResourceStatus>(idleResourceStatus);\n  const [remotePhraseDetail, setRemotePhraseDetail] = useState<{ slug: string; item: LearningItem } | null>(null);\n  const [phraseDetailStatus, setPhraseDetailStatus] = useState<{ slug: string; status: ResourceStatus }>({\n    slug: "",\n    status: idleResourceStatus(),\n  });\n  const [phraseCatalogPageInfo, setPhraseCatalogPageInfo] = useState<CatalogPageInfo>(() => paginateCatalogEntries(DEFAULT_PHRASE_CATALOG, 1).info);''',
)

replace_once(
    APP,
    '''  useEffect(() => {\n    const storageTimer = window.setTimeout(() => {\n      setPhraseSortMode(readStoredCatalogSort("phrases"));\n      setAllItemsSortMode(readStoredCatalogSort("all-items"));\n    }, 0);\n    return () => window.clearTimeout(storageTimer);\n  }, []);''',
    '''  useEffect(() => {\n    const storageTimer = window.setTimeout(() => {\n      setPhraseSortMode(readStoredCatalogSort("phrases"));\n      setAllItemsSortMode(readStoredCatalogSort("all-items"));\n    }, 0);\n    return () => window.clearTimeout(storageTimer);\n  }, []);\n\n  useEffect(() => {\n    if (navigation.view !== "phrases") return;\n    const filters = phraseCatalogFilters(navigation);\n    setPhraseTopic(filters.topic);\n    setPhrasePage(filters.page);\n    setPhraseSearchInput(filters.query);\n    setPhraseSearch(filters.query);\n    setPhraseSortMode(filters.sort);\n  }, [navigation.page, navigation.query, navigation.sort, navigation.topic, navigation.view]);''',
)

replace_once(
    APP,
    '''  const loadActiveLessonResource = useCallback(async (\n''',
    '''  const loadPhraseDetailResource = useCallback(async (\n    activeSession: Session,\n    slug: string,\n    signal?: AbortSignal,\n  ): Promise<Session | null> => {\n    setPhraseDetailStatus({ slug, status: loadingResourceStatus() });\n    try {\n      const result = await authorizedRequest<APIItem>(\n        activeSession,\n        `/api/v1/phrases/${encodeURIComponent(slug)}`,\n        { signal },\n        (value) => isLearningItemPayload(value)\n          && (value as APIItem).kind === "phrase"\n          && (value as APIItem).slug === slug,\n      );\n      if (signal?.aborted) return null;\n      setRemotePhraseDetail({ slug, item: toLearningItem(result.data) });\n      setPhraseDetailStatus({ slug, status: readyResourceStatus() });\n      setSession((current) => current?.tokens.accessToken === result.activeSession.tokens.accessToken ? current : result.activeSession);\n      return result.activeSession;\n    } catch (requestError) {\n      if (signal?.aborted) return null;\n      setRemotePhraseDetail((current) => current?.slug === slug ? null : current);\n      setPhraseDetailStatus({ slug, status: failedResourceStatus(requestError, "карточку фразы") });\n      return null;\n    }\n  }, []);\n\n  const loadActiveLessonResource = useCallback(async (\n''',
)

replace_once(
    APP,
    '''  useEffect(() => {\n    if (!session || navigation.view !== "learn" || studyMode === "all") return;''',
    '''  useEffect(() => {\n    if (!session || navigation.view !== "phrases" || !navigation.detail) return;\n    const slug = navigation.detail;\n    const availableLocally = phraseCatalog.some((phrase) => itemKey(phrase) === slug)\n      || DEFAULT_PHRASE_CATALOG.some((phrase) => phrase.id === slug);\n    if (availableLocally || remotePhraseDetail?.slug === slug) return;\n\n    const controller = new AbortController();\n    const timer = window.setTimeout(() => {\n      void loadPhraseDetailResource(session, slug, controller.signal);\n    }, 0);\n    return () => {\n      controller.abort();\n      window.clearTimeout(timer);\n    };\n  }, [\n    loadPhraseDetailResource,\n    navigation.detail,\n    navigation.view,\n    phraseCatalog,\n    remotePhraseDetail?.slug,\n    session,\n  ]);\n\n  useEffect(() => {\n    if (!session || navigation.view !== "learn" || studyMode === "all") return;''',
)

replace_once(
    APP,
    '''  const selectedPhrase = navigation.detail\n    ? phraseCatalog.find((phrase) => itemKey(phrase) === navigation.detail)\n      ?? DEFAULT_PHRASE_CATALOG.find((phrase) => phrase.id === navigation.detail)\n    : undefined;''',
    '''  const selectedPhrase = navigation.detail\n    ? phraseCatalog.find((phrase) => itemKey(phrase) === navigation.detail)\n      ?? DEFAULT_PHRASE_CATALOG.find((phrase) => phrase.id === navigation.detail)\n      ?? (remotePhraseDetail?.slug === navigation.detail ? remotePhraseDetail.item : undefined)\n    : undefined;''',
)

replace_once(
    APP,
    '''      setPhraseCatalog([]);\n      setPhraseCatalogPageInfo(paginateCatalogEntries(DEFAULT_PHRASE_CATALOG, 1).info);''',
    '''      setPhraseCatalog([]);\n      setRemotePhraseDetail(null);\n      setPhraseDetailStatus({ slug: "", status: idleResourceStatus() });\n      setPhraseCatalogPageInfo(paginateCatalogEntries(DEFAULT_PHRASE_CATALOG, 1).info);''',
)

replace_once(
    APP,
    '''  function openPhraseDetail(phrase: LearningItem) {\n    navigate({ view: "phrases", detail: itemKey(phrase) });\n  }\n\n  function backToPhraseCatalog() {\n    const destination = navigationTabs.destination("phrases");\n    navigate({ view: "phrases" }, true, { scroll: destination.scroll });\n  }\n\n  function changePhrasePage(page: number) {\n    setPhrasePage(page);\n    window.requestAnimationFrame(() => document.getElementById("phrase-catalog-results")?.scrollIntoView({ block: "start", behavior: navigationScrollBehavior(window) }));\n  }\n\n  function applyPhraseSearch() {\n    setPhrasePage(1);\n    setPhraseSearch(phraseSearchInput.trim());\n  }\n\n  function clearPhraseSearch() {\n    setPhraseSearchInput("");\n    setPhraseSearch("");\n    setPhrasePage(1);\n  }''',
    '''  function openPhraseDetail(phrase: LearningItem) {\n    navigate(phraseCatalogTarget(phraseCatalogFilters(navigation), itemKey(phrase)));\n  }\n\n  function backToPhraseCatalog() {\n    const destination = navigationTabs.destination("phrases");\n    navigate(phraseCatalogTarget(phraseCatalogFilters(navigation)), true, { scroll: destination.scroll });\n  }\n\n  function changePhrasePage(page: number) {\n    setPhrasePage(page);\n    navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), page }));\n    window.requestAnimationFrame(() => document.getElementById("phrase-catalog-results")?.scrollIntoView({ block: "start", behavior: navigationScrollBehavior(window) }));\n  }\n\n  function applyPhraseSearch() {\n    const query = phraseSearchInput.trim();\n    setPhrasePage(1);\n    setPhraseSearch(query);\n    navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), query, page: 1 }));\n  }\n\n  function clearPhraseSearch() {\n    setPhraseSearchInput("");\n    setPhraseSearch("");\n    setPhrasePage(1);\n    navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), query: "", page: 1 }));\n  }''',
)

replace_once(
    APP,
    '''  function renderPhrases() {\n    if (selectedPhrase) {''',
    '''  function renderPhrases() {\n    if (navigation.detail && !selectedPhrase) {\n      const activeStatus = phraseDetailStatus.slug === navigation.detail\n        ? phraseDetailStatus.status\n        : idleResourceStatus();\n      const loading = Boolean(session) && (activeStatus.phase === "idle" || activeStatus.phase === "loading");\n      return (\n        <section className="lx-detail-card">\n          <button className="lx-button ghost" type="button" onClick={backToPhraseCatalog}>← Все фразы</button>\n          {loading ? <AsyncSkeletonGrid label="Загружаем карточку фразы" count={1} /> : null}\n          {!session ? (\n            <AsyncStatePanel\n              label="Карточка фразы доступна после входа"\n              kind="empty"\n              title="Войдите, чтобы открыть персональную фразу"\n              message="Backend-каталог и текущий learning status доступны только владельцу аккаунта."\n              actionLabel="Войти"\n              onAction={() => requestAuthentication("phrases")}\n            />\n          ) : !loading ? (\n            <AsyncStatePanel\n              label="Карточка фразы недоступна"\n              kind="error"\n              title={activeStatus.problem?.title ?? "Фраза не найдена"}\n              message={activeStatus.problem?.message ?? "Проверьте ссылку или вернитесь к каталогу фраз."}\n              reference={activeStatus.problem?.correlationId}\n              actionLabel="К каталогу фраз"\n              onAction={backToPhraseCatalog}\n            />\n          ) : null}\n        </section>\n      );\n    }\n    if (selectedPhrase) {''',
)

replace_once(
    APP,
    '''onClick={() => { setPhraseTopic(topic); setPhrasePage(1); }} onKeyDown={(event) => selectRovingControl(event, phraseTopics, topic, (next) => { setPhraseTopic(next); setPhrasePage(1); }, "horizontal")}>{topic === "all" ? "Все темы" : topic}</button>;''',
    '''onClick={() => { setPhraseTopic(topic); setPhrasePage(1); navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), topic, page: 1 })); }} onKeyDown={(event) => selectRovingControl(event, phraseTopics, topic, (next) => { setPhraseTopic(next); setPhrasePage(1); navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), topic: next, page: 1 })); }, "horizontal")}>{topic === "all" ? "Все темы" : topic}</button>;''',
)

replace_once(
    APP,
    '''        <CatalogSortControl kind="phrases" mode={phraseSortMode} onChange={(mode) => { updateCatalogSort("phrases", mode); setPhrasePage(1); }} />''',
    '''        <CatalogSortControl kind="phrases" mode={phraseSortMode} onChange={(mode) => { updateCatalogSort("phrases", mode); setPhrasePage(1); navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), sort: mode, page: 1 })); }} />''',
)

OLD_GRID = '''        <section id="phrase-catalog-results" className="lx-phrase-grid" role="list" aria-label="Результаты каталога фраз" aria-busy={phrasesPending}>{sortedVisiblePhrases.map((phrase, index) => <div key={itemKey(phrase)} role="listitem" aria-posinset={(phrasePageInfo.page - 1) * phrasePageInfo.pageSize + index + 1} aria-setsize={phrasePageInfo.total}><button type="button" onClick={() => openPhraseDetail(phrase)}><span lang="en">{phrase.topic}</span><strong lang="en">{phrase.prompt}</strong><small lang="ru">{phrase.answer}</small><em>Открыть карточку <Icon name="arrow" size={15}/></em></button></div>)}</section>'''
NEW_GRID = '''        <section id="phrase-catalog-results" className="lx-phrase-grid" role="list" aria-label="Результаты каталога фраз" aria-busy={phrasesPending}>{sortedVisiblePhrases.map((phrase, index) => {\n          const detailTarget = phraseCatalogTarget(phraseCatalogFilters(navigation), itemKey(phrase));\n          return <div key={itemKey(phrase)} role="listitem" aria-posinset={(phrasePageInfo.page - 1) * phrasePageInfo.pageSize + index + 1} aria-setsize={phrasePageInfo.total}><a href={navigationURL(detailTarget)} onClick={(event) => {\n            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;\n            event.preventDefault();\n            openPhraseDetail(phrase);\n          }}><span lang="en">{phrase.topic}</span><strong lang="en">{phrase.prompt}</strong><small lang="ru">{phrase.answer}</small><em>Открыть карточку <Icon name="arrow" size={15}/></em></a></div>;\n        })}</section>'''
replace_once(APP, OLD_GRID, NEW_GRID)

replace_once(
    "frontend/app/premium-ui.css",
    '''.lx-phrase-grid button { display: flex; min-height: 205px; flex-direction: column; align-items: flex-start; border-radius: 20px; padding: 20px; color: var(--lx-text); text-align: left; transition: transform 150ms ease, border-color 150ms ease; }\n.lx-phrase-grid button:hover { transform: translateY(-3px); border-color: rgba(120, 94, 255, .38); }''',
    '''.lx-phrase-grid button,\n.lx-phrase-grid a { display: flex; min-height: 205px; flex-direction: column; align-items: flex-start; border: 1px solid var(--lx-border); border-radius: 20px; padding: 20px; color: var(--lx-text); background: rgba(255,255,255,.025); text-align: left; text-decoration: none; transition: transform 150ms ease, border-color 150ms ease; }\n.lx-phrase-grid button:hover,\n.lx-phrase-grid a:hover { transform: translateY(-3px); border-color: rgba(120, 94, 255, .38); }''',
)

# OpenAPI endpoint and contract tests.
replace_once("api/openapi.yaml", "  version: 0.10.0", "  version: 0.11.0")
PHRASE_PATH = '''  /api/v1/phrases/{slug}:\n    get:\n      operationId: getPhraseBySlug\n      tags: [learning]\n      summary: Full phrase card assigned to the current user, addressed by canonical slug.\n      security:\n        - bearerAuth: []\n      parameters:\n        - name: slug\n          in: path\n          required: true\n          schema:\n            type: string\n            minLength: 1\n            maxLength: 120\n            pattern: "^[a-z0-9]+(-[a-z0-9]+)*$"\n      responses:\n        "200":\n          description: Full phrase card with the current user learning status.\n          content:\n            application/json:\n              schema:\n                $ref: "#/components/schemas/UserWord"\n        "401":\n          $ref: "#/components/responses/Unauthorized"\n        "404":\n          description: Slug is invalid, absent, or the phrase is not assigned to the current user.\n'''
replace_once(
    "api/openapi.yaml",
    "  /api/v1/words/{wordID}/review:\n",
    PHRASE_PATH + "  /api/v1/words/{wordID}/review:\n",
)

replace_once(
    "backend/internal/words/openapi_contract_test.go",
    '''\t\t"  /api/v1/words/{wordID}:\\n",\n\t\t"      operationId: getWord",''',
    '''\t\t"  /api/v1/words/{wordID}:\\n",\n\t\t"      operationId: getWord",\n\t\t"  /api/v1/phrases/{slug}:\\n",\n\t\t"      operationId: getPhraseBySlug",\n\t\t"            pattern: \\\"^[a-z0-9]+(-[a-z0-9]+)*$\\\"",''',
)

# Architecture documentation.
replace_once(
    "docs/architecture.md",
    '''- `/dictionary` доступен как канонический shell без сессии, но персональный список, learning status и due queue не отдаются до успешной аутентификации; guest smoke проверяет явный authentication gate, а не приватные данные;''',
    '''- `/dictionary` доступен как канонический shell без сессии, но персональный список, learning status и due queue не отдаются до успешной аутентификации; guest smoke проверяет явный authentication gate, а не приватные данные;\n- `/phrases/[slug]` разрешается адресным user-scoped API lookup по каноническому lowercase kebab-case slug; lookup использует unique functional PostgreSQL index и не перебирает страницы каталога;\n- detail route фразы имеет независимые loading/error states, поэтому cold start, reload и новая вкладка не зависят от ранее загруженной catalog page;''',
)

# Browser regression coverage.
E2E = "frontend/e2e/app-router-routes.spec.ts"
replace_once(
    E2E,
    '''const PHRASE = { id: 201, kind: "phrase", slug: "route-contract", lemma: "Keep the route stable", translation: "сохранять маршрут стабильным", phonetic: "", partOfSpeech: "phrase", topic: "Frontend Architecture", examples: ["Keep the route stable across reloads."], note: "Back and Forward must restore the screen.", status: "new" };''',
    '''const PHRASE = { id: 201, kind: "phrase", slug: "backend-route-contract", lemma: "Keep the route stable", translation: "сохранять маршрут стабильным", phonetic: "", partOfSpeech: "phrase", topic: "Frontend Architecture", examples: ["Keep the route stable across reloads."], note: "Back and Forward must restore the screen.", status: "review" };''',
)
replace_once(
    E2E,
    '''    if (path === "/api/v1/words/101") return json(route, 200, WORD);\n    if (path === "/api/v1/words" || path === "/api/v1/words/due") {\n      const items = url.searchParams.get("kind") === "phrase" ? [PHRASE] : [WORD];\n      return json(route, 200, { items, count: items.length, total: items.length, page: 1, pageSize: 48, totalPages: 1, hasPrevious: false, hasNext: false });\n    }''',
    '''    if (path === "/api/v1/words/101") return json(route, 200, WORD);\n    if (path === "/api/v1/phrases/backend-route-contract") return json(route, 200, PHRASE);\n    if (path.startsWith("/api/v1/phrases/")) return json(route, 404, { error: { code: "phrase_not_found", message: "not found" } });\n    if (path === "/api/v1/words" || path === "/api/v1/words/due") {\n      const items = url.searchParams.get("kind") === "phrase" ? [PHRASE] : [WORD];\n      const requestedPage = Math.max(1, Number(url.searchParams.get("page") ?? "1"));\n      const totalPages = requestedPage > 1 ? requestedPage : 1;\n      return json(route, 200, { items, count: items.length, total: Math.max(items.length, totalPages * items.length), page: requestedPage, pageSize: 48, totalPages, hasPrevious: requestedPage > 1, hasNext: false });\n    }''',
)

replace_once(
    E2E,
    '''  await page.goto("/phrases/phrase-root-cause");\n  await expect(page).toHaveURL(/\\/phrases\\/phrase-root-cause$/);\n  await expect(page.getByRole("heading", { name: "We need to identify the root cause." })).toBeVisible();\n  await page.reload();\n  await expect(page.getByRole("heading", { name: "We need to identify the root cause." })).toBeVisible();''',
    '''  await page.goto("/phrases/backend-route-contract");\n  await expect(page).toHaveURL(/\\/phrases\\/backend-route-contract$/);\n  await expect(page.getByRole("heading", { name: "Keep the route stable" })).toBeVisible();\n  await page.reload();\n  await expect(page.getByRole("heading", { name: "Keep the route stable" })).toBeVisible();''',
)

NEW_TESTS = r'''

test("backend phrase links open in a new tab without a catalog warm-up", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Native middle-click tab creation is deterministic in Chromium.");
  await page.goto("/phrases?topic=Frontend+Architecture&query=stable&sort=az&page=2");
  const link = page.getByRole("link", { name: /Keep the route stable/ });
  await expect(link).toHaveAttribute("href", "/phrases/backend-route-contract?topic=Frontend+Architecture&query=stable&sort=az&page=2");

  const tabPromise = context.waitForEvent("page");
  await link.click({ button: "middle" });
  const tab = await tabPromise;
  await tab.waitForLoadState("domcontentloaded");
  await expect(tab).toHaveURL(/\/phrases\/backend-route-contract\?topic=Frontend\+Architecture&query=stable&sort=az&page=2$/);
  await expect(tab.getByRole("heading", { name: "Keep the route stable" })).toBeVisible();
  await tab.close();
});

test("phrase Back restores catalog filters, page and scroll", async ({ page }) => {
  await page.goto("/phrases?topic=Frontend+Architecture&query=stable&sort=az&page=2");
  const link = page.getByRole("link", { name: /Keep the route stable/ });
  await expect(link).toBeVisible();
  await page.evaluate(() => {
    document.body.style.minHeight = "2800px";
    window.scrollTo({ top: 720, behavior: "auto" });
    window.dispatchEvent(new Event("scroll"));
  });
  await page.waitForTimeout(120);
  await link.click();
  await expect(page.getByRole("heading", { name: "Keep the route stable" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/phrases\?topic=Frontend\+Architecture&query=stable&sort=az&page=2$/);
  await expect(page.getByRole("link", { name: /Keep the route stable/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(500);
});
'''
replace_once(
    E2E,
    '''test("a guest lesson deep link is protected and preserves its return target", async ({ browser }) => {''',
    NEW_TESTS + '''\ntest("a guest lesson deep link is protected and preserves its return target", async ({ browser }) => {''',
)

print("Issue #114 patch applied successfully")
