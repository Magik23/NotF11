console.log("Chromium Clean Window service worker started.");

const TOGGLE_COMMAND = "toggle-clean-window";

const CLEAN_STATE_KEYS = [
  "liveTabId",
  "originalWindowId",
  "originalTabIndex",
  "popupWindowId"
];


async function enterCleanMode(activeTab) {
  const originalWindowId = activeTab.windowId;
  const originalTabIndex = activeTab.index;

  const originalWindow = await chrome.windows.get(originalWindowId);

  console.log("Entering clean mode.");
  console.log("Active tab ID:", activeTab.id);
  console.log("Original window ID:", originalWindowId);
  console.log("Original tab index:", originalTabIndex);

  const popupWindow = await chrome.windows.create({
    tabId: activeTab.id,
    type: "popup",
    focused: true,
    left: originalWindow.left,
    top: originalWindow.top,
    width: originalWindow.width,
    height: originalWindow.height
  });

  if (!popupWindow || popupWindow.id === undefined) {
    throw new Error("Popup window could not be created.");
  }

  // Reapply the original bounds after creation.
  // Chromium may adjust popup geometry at screen edges during creation.
  await chrome.windows.update(popupWindow.id, {
    left: originalWindow.left,
    top: originalWindow.top,
    width: originalWindow.width,
    height: originalWindow.height
  });

  await chrome.storage.session.set({
    liveTabId: activeTab.id,
    originalWindowId,
    originalTabIndex,
    popupWindowId: popupWindow.id
  });

  console.log("Clean popup window created:", popupWindow.id);
  console.log("Clean mode state saved.");
}


async function exitCleanMode(activeTab, savedState) {
  console.log("Exiting clean mode.");
  console.log("Returning tab to original window.");

  const bridgeWindow = await chrome.windows.create({
    tabId: activeTab.id,
    type: "normal",
    focused: false,
    state: "minimized"
  });

  if (!bridgeWindow || bridgeWindow.id === undefined) {
    throw new Error("Temporary normal window could not be created.");
  }

  await chrome.tabs.move(activeTab.id, {
    windowId: savedState.originalWindowId,
    index: savedState.originalTabIndex
  });

  await chrome.tabs.update(activeTab.id, {
    active: true
  });

  await chrome.windows.update(savedState.originalWindowId, {
    focused: true
  });

  await chrome.storage.session.remove(CLEAN_STATE_KEYS);

  console.log("Tab returned to original window.");
  console.log("Clean mode state removed.");
}


async function toggleCleanWindow(activeTab) {
  if (!activeTab) {
    console.log("No active tab found.");
    return;
  }

  const savedState =
    await chrome.storage.session.get(CLEAN_STATE_KEYS);

  const isCleanMode =
    savedState.liveTabId === activeTab.id &&
    savedState.popupWindowId === activeTab.windowId;

  if (isCleanMode) {
    await exitCleanMode(activeTab, savedState);
    return;
  }

  await enterCleanMode(activeTab);
}


chrome.action.onClicked.addListener(async (tab) => {
  try {
    await toggleCleanWindow(tab);
  } catch (error) {
    console.error("Clean window toggle failed:", error);
  }
});


chrome.commands.onCommand.addListener(async (command) => {
  if (command !== TOGGLE_COMMAND) {
    return;
  }

  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    const activeTab = tabs[0];

    await toggleCleanWindow(activeTab);
  } catch (error) {
    console.error("Clean window toggle failed:", error);
  }
});
