function exactTabURL(tabURL, targetURL) {
  if (!tabURL) {
    return false;
  }

  try {
    return new URL(tabURL).href === new URL(targetURL).href;
  } catch {
    return false;
  }
}

async function resolveUniqueTargetTab(targetURL) {
  const matchingTabs = (await chrome.tabs.query({})).filter((tab) => (
    typeof tab.id === "number" && exactTabURL(tab.url, targetURL)
  ));

  if (matchingTabs.length !== 1) {
    throw new Error(
      `Expected exactly one browser-zoom target tab for ${targetURL}; found ${matchingTabs.length}.`,
    );
  }

  return matchingTabs[0];
}

async function setZoomForURL(targetURL, zoomFactor) {
  if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) {
    throw new Error(`Invalid browser zoom factor: ${zoomFactor}.`);
  }

  const tab = await resolveUniqueTargetTab(targetURL);
  const previousZoom = await chrome.tabs.getZoom(tab.id);

  await chrome.tabs.setZoomSettings(tab.id, {
    mode: "automatic",
    scope: "per-tab",
  });
  await chrome.tabs.setZoom(tab.id, zoomFactor);

  const [zoom, settings] = await Promise.all([
    chrome.tabs.getZoom(tab.id),
    chrome.tabs.getZoomSettings(tab.id),
  ]);

  return {
    tabId: tab.id,
    url: tab.url,
    previousZoom,
    zoom,
    mode: settings.mode ?? null,
    scope: settings.scope ?? null,
  };
}

Object.defineProperty(globalThis, "lexigoBrowserZoomController", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: Object.freeze({ setZoomForURL }),
});
