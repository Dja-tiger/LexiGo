from pathlib import Path

component = Path("frontend/components/dictionary-catalog.tsx")
text = component.read_text()

old_search = '''  useEffect(() => {
    setSearchInput(filters.query);
  }, [filters.query]);
'''
new_search = '''  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSearchInput(filters.query));
    return () => window.cancelAnimationFrame(frame);
  }, [filters.query]);
'''
if old_search not in text:
    raise SystemExit("search synchronization effect was not found")
text = text.replace(old_search, new_search, 1)

page_start = text.index('  useEffect(() => {\n    if (!authenticated) {')
page_end_marker = '  }, [authenticated, filters, loadPage]);'
page_end = text.index(page_end_marker, page_start) + len(page_end_marker)
new_page_effect = '''  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();

    async function run() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setPageStatus(loadingResourceStatus());
      try {
        const result = await loadPage(filters, controller.signal);
        if (controller.signal.aborted) return;
        setItems(result.items);
        setPageInfo(result.info);
        setPageStatus(readyResourceStatus());
      } catch (error) {
        if (controller.signal.aborted) return;
        setItems([]);
        setPageInfo(EMPTY_PAGE);
        setPageStatus(failedResourceStatus(error, "словарь"));
      }
    }

    void run();
    return () => controller.abort();
  }, [authenticated, filters, loadPage]);'''
text = text[:page_start] + new_page_effect + text[page_end:]

old_state = '''  const [remoteDetail, setRemoteDetail] = useState<LearningItem | null>(null);
  const [detailStatus, setDetailStatus] = useState<ResourceStatus>(idleResourceStatus);
'''
new_state = '''  const [remoteDetail, setRemoteDetail] = useState<{ key: string; item: LearningItem } | null>(null);
  const [detailStatus, setDetailStatus] = useState<{ key: string; status: ResourceStatus }>({
    key: "",
    status: idleResourceStatus(),
  });
'''
if old_state not in text:
    raise SystemExit("detail state declarations were not found")
text = text.replace(old_state, new_state, 1)

detail_start = text.index('  const localDetail = navigation.detail')
detail_end_marker = '  }, [authenticated, loadDetail, localDetail, navigation.detail]);'
detail_end = text.index(detail_end_marker, detail_start) + len(detail_end_marker)
new_detail = '''  const localDetail = navigation.detail
    ? items.find((item) => String(item.wordId) === navigation.detail) ?? null
    : null;
  const selectedItem = localDetail
    ?? (remoteDetail?.key === navigation.detail ? remoteDetail.item : null);
  const activeDetailStatus = detailStatus.key === navigation.detail
    ? detailStatus.status
    : idleResourceStatus();

  useEffect(() => {
    if (!authenticated || !navigation.detail || localDetail) return;
    const detailKey = navigation.detail;
    const controller = new AbortController();

    async function run() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      const wordID = Number(detailKey);
      if (!Number.isSafeInteger(wordID) || wordID <= 0) {
        setDetailStatus({
          key: detailKey,
          status: failedResourceStatus(new Error("Некорректная ссылка на слово"), "карточку слова"),
        });
        return;
      }

      setDetailStatus({ key: detailKey, status: loadingResourceStatus() });
      try {
        const item = await loadDetail(wordID, controller.signal);
        if (controller.signal.aborted) return;
        setRemoteDetail({ key: detailKey, item });
        setDetailStatus({ key: detailKey, status: readyResourceStatus() });
      } catch (error) {
        if (controller.signal.aborted) return;
        setDetailStatus({ key: detailKey, status: failedResourceStatus(error, "карточку слова") });
      }
    }

    void run();
    return () => controller.abort();
  }, [authenticated, loadDetail, localDetail, navigation.detail]);'''
text = text[:detail_start] + new_detail + text[detail_end:]

text = text.replace(
    '    const loading = detailStatus.phase === "loading" || (detailStatus.phase === "idle" && !selectedItem);\n    const problem = detailStatus.problem;',
    '    const loading = !localDetail && (activeDetailStatus.phase === "loading" || (activeDetailStatus.phase === "idle" && !selectedItem));\n    const problem = activeDetailStatus.problem;',
    1,
)
component.write_text(text)

app = Path("frontend/components/lexigo-premium-app.tsx")
app_text = app.read_text()
old_import = "  catalogCountText,\n  catalogSummaryText,\n"
if old_import not in app_text:
    raise SystemExit("obsolete catalogSummaryText import was not found")
app.write_text(app_text.replace(old_import, "  catalogCountText,\n", 1))
