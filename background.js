console.log("Chromium Clean Window service worker started.");

const TOGGLE_COMMAND = "toggle-clean-window";
const STORAGE_KEY = "cleanSessions";
const TAB_GROUP_ID_NONE = -1;

let operationQueue = Promise.resolve();

function enqueueOperation(operation) {
  const run = operationQueue.then(operation, operation);
  operationQueue = run.catch(() => {});
  return run;
}

function keyForTab(tabId) {
  return String(tabId);
}

async function loadSessions() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] ?? {};
}

async function saveSessions(sessions) {
  await chrome.storage.local.set({
    [STORAGE_KEY]: sessions
  });
}

async function getTabIfExists(tabId) {
  try {
    return await chrome.tabs.get(tabId);
  } catch {
    return null;
  }
}

async function getWindowIfExists(windowId) {
  try {
    return await chrome.windows.get(windowId);
  } catch {
    return null;
  }
}

async function pruneStaleSessions(sessions) {
  let changed = false;

  for (const [key, session] of Object.entries(sessions)) {
    const tab = await getTabIfExists(session.tabId);
    const popup = await getWindowIfExists(session.popupWindowId);

    const isValid =
      tab &&
      popup &&
      popup.type === "popup" &&
      tab.windowId === session.popupWindowId;

    if (!isValid) {
      delete sessions[key];
      changed = true;
    }
  }

  if (changed) {
    await saveSessions(sessions);
  }

  return sessions;
}

function getGeometry(window) {
  const values = [
    window.left,
    window.top,
    window.width,
    window.height
  ];

  if (!values.every(Number.isFinite)) {
    return null;
  }

  return {
    left: window.left,
    top: window.top,
    width: window.width,
    height: window.height
  };
}

function getSourceOrder(sourceWindowId, sourceTabs, sessions) {
  const currentIds = sourceTabs
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((tab) => tab.id);

  const siblingSession = Object.values(sessions).find(
    (session) =>
      session.sourceWindowId === sourceWindowId
  );

  if (!siblingSession) {
    return currentIds;
  }

  const detachedIds = new Set(
    Object.values(sessions)
      .filter(
        (session) =>
          session.sourceWindowId === sourceWindowId
      )
      .map((session) => session.tabId)
  );

  const validIds = new Set([
    ...currentIds,
    ...detachedIds
  ]);

  const order = siblingSession.sourceOrder.filter(
    (tabId) => validIds.has(tabId)
  );

  for (
    let position = 0;
    position < currentIds.length;
    position += 1
  ) {
    const tabId = currentIds[position];

    if (order.includes(tabId)) {
      continue;
    }

    const nextKnownId = currentIds
      .slice(position + 1)
      .find((id) => order.includes(id));

    if (nextKnownId !== undefined) {
      order.splice(
        order.indexOf(nextKnownId),
        0,
        tabId
      );

      continue;
    }

    const previousKnownId = currentIds
      .slice(0, position)
      .reverse()
      .find((id) => order.includes(id));

    if (previousKnownId !== undefined) {
      order.splice(
        order.indexOf(previousKnownId) + 1,
        0,
        tabId
      );

      continue;
    }

    order.push(tabId);
  }

  for (const sibling of Object.values(sessions)) {
    if (
      sibling.sourceWindowId === sourceWindowId
    ) {
      sibling.sourceOrder = [...order];
    }
  }

  return order;
}

function getReturnIndex(session, sourceTabs) {
  const tabs = sourceTabs
    .slice()
    .sort((a, b) => a.index - b.index);

  const tabsById = new Map(
    tabs.map((tab) => [tab.id, tab])
  );

  const position =
    session.sourceOrder.indexOf(session.tabId);

  let targetIndex = Math.min(
    session.originalIndex,
    tabs.length
  );

  if (position !== -1) {
    let anchorFound = false;

    for (
      let i = position + 1;
      i < session.sourceOrder.length;
      i += 1
    ) {
      const nextTab =
        tabsById.get(session.sourceOrder[i]);

      if (nextTab) {
        targetIndex = nextTab.index;
        anchorFound = true;
        break;
      }
    }

    if (!anchorFound) {
      for (
        let i = position - 1;
        i >= 0;
        i -= 1
      ) {
        const previousTab =
          tabsById.get(session.sourceOrder[i]);

        if (previousTab) {
          targetIndex =
            previousTab.index + 1;

          break;
        }
      }
    }
  }

  const pinnedCount =
    tabs.filter((tab) => tab.pinned).length;

  return session.wasPinned
    ? Math.min(targetIndex, pinnedCount)
    : Math.max(targetIndex, pinnedCount);
}

async function enterCleanMode(
  activeTab,
  sessions
) {
  const sourceWindow =
    await chrome.windows.get(activeTab.windowId);

  if (sourceWindow.type !== "normal") {
    console.log(
      "Clean mode can only start from a normal browser window."
    );

    return;
  }

  if (
    activeTab.groupId !== TAB_GROUP_ID_NONE
  ) {
    console.log(
      "Grouped tabs are not supported yet."
    );

    return;
  }

  const sourceTabs =
    await chrome.tabs.query({
      windowId: sourceWindow.id
    });

  const sourceOrder = getSourceOrder(
    sourceWindow.id,
    sourceTabs,
    sessions
  );

  const sourceGeometry =
    getGeometry(sourceWindow);

  const createData = {
    tabId: activeTab.id,
    type: "popup",
    focused: true
  };

  if (sourceGeometry) {
    Object.assign(
      createData,
      sourceGeometry
    );
  }

  const popupWindow =
    await chrome.windows.create(createData);

  if (
    !popupWindow ||
    popupWindow.id === undefined
  ) {
    throw new Error(
      "Popup window could not be created."
    );
  }

  sessions[keyForTab(activeTab.id)] = {
    tabId: activeTab.id,
    popupWindowId: popupWindow.id,
    sourceWindowId: sourceWindow.id,
    sourceOrder,
    originalIndex: activeTab.index,
    wasPinned: activeTab.pinned,
    sourceGeometry
  };

  await saveSessions(sessions);

  /*
   * Chromium may adjust popup bounds during
   * creation when the requested geometry touches
   * a screen edge.
   *
   * Reapplying the bounds afterward preserves
   * the exact geometry we already tested.
   */
  if (sourceGeometry) {
    await chrome.windows.update(
      popupWindow.id,
      sourceGeometry
    );
  }

  console.log(
    `Tab ${activeTab.id} entered clean mode from window ${sourceWindow.id}.`
  );
}

async function exitCleanMode(
  cleanTab,
  session,
  sessions
) {
  /*
   * Chromium only permits tabs.move() to/from
   * normal browser windows.
   *
   * So the clean tab first enters this temporary
   * minimized normal bridge window.
   */
  const bridgeWindow =
    await chrome.windows.create({
      tabId: cleanTab.id,
      type: "normal",
      focused: false,
      state: "minimized"
    });

  if (
    !bridgeWindow ||
    bridgeWindow.id === undefined
  ) {
    throw new Error(
      "Temporary normal window could not be created."
    );
  }

  /*
   * Make sure pinned state is preserved before
   * the tab is moved back into a normal tab strip.
   */
  await chrome.tabs.update(
    cleanTab.id,
    {
      pinned: session.wasPinned
    }
  );

  const sourceWindow =
    await getWindowIfExists(
      session.sourceWindowId
    );

  if (
    sourceWindow &&
    sourceWindow.type === "normal"
  ) {
    const sourceTabs =
      await chrome.tabs.query({
        windowId: sourceWindow.id
      });

    const targetIndex =
      getReturnIndex(
        session,
        sourceTabs
      );

    await chrome.tabs.move(
      cleanTab.id,
      {
        windowId: sourceWindow.id,
        index: targetIndex
      }
    );

    await chrome.tabs.update(
      cleanTab.id,
      {
        active: true
      }
    );

    await chrome.windows.update(
      sourceWindow.id,
      {
        focused: true
      }
    );
  } else {
    /*
     * This happens if the original source window
     * was closed, or if its final remaining tab
     * was detached and Chromium closed the empty
     * normal browser window.
     *
     * In that case the bridge becomes the new
     * source browser.
     */
    const oldSourceWindowId =
      session.sourceWindowId;

    await chrome.windows.update(
      bridgeWindow.id,
      {
        state: "normal"
      }
    );

    if (session.sourceGeometry) {
      await chrome.windows.update(
        bridgeWindow.id,
        session.sourceGeometry
      );
    }

    await chrome.windows.update(
      bridgeWindow.id,
      {
        focused: true
      }
    );

    await chrome.tabs.update(
      cleanTab.id,
      {
        active: true
      }
    );

    /*
     * Other clean tabs that came from the old
     * source window now return to this replacement
     * browser instead.
     */
    for (
      const sibling of
      Object.values(sessions)
    ) {
      if (
        sibling.sourceWindowId ===
        oldSourceWindowId
      ) {
        sibling.sourceWindowId =
          bridgeWindow.id;
      }
    }

    console.log(
      `Source window ${oldSourceWindowId} no longer existed; window ${bridgeWindow.id} became the replacement source.`
    );
  }

  delete sessions[
    keyForTab(cleanTab.id)
  ];

  await saveSessions(sessions);

  console.log(
    `Tab ${cleanTab.id} returned from clean mode.`
  );
}

async function toggleTab(tab) {
  if (
    !tab ||
    tab.id === undefined
  ) {
    console.log(
      "No active tab found."
    );

    return;
  }

  let sessions =
    await loadSessions();

  sessions =
    await pruneStaleSessions(
      sessions
    );

  const session =
    sessions[keyForTab(tab.id)];

  /*
   * If THIS exact tab is currently inside the
   * popup recorded in its own return ticket,
   * return this tab home.
   */
  if (
    session &&
    session.popupWindowId === tab.windowId
  ) {
    await exitCleanMode(
      tab,
      session,
      sessions
    );

    return;
  }

  const currentWindow =
    await chrome.windows.get(
      tab.windowId
    );

  /*
   * Don't treat arbitrary browser popups, PWAs,
   * DevTools windows, etc. as our clean windows.
   */
  if (
    currentWindow.type !== "normal"
  ) {
    console.log(
      "This popup is not one of our tracked clean windows."
    );

    return;
  }

  await enterCleanMode(
    tab,
    sessions
  );
}

async function toggleFocusedTab() {
  const tabs =
    await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

  await toggleTab(tabs[0]);
}

async function removeClosedCleanSession(
  tabId
) {
  const sessions =
    await loadSessions();

  const key =
    keyForTab(tabId);

  if (!sessions[key]) {
    return;
  }

  delete sessions[key];

  await saveSessions(sessions);

  console.log(
    `Closed clean tab ${tabId} removed from stored sessions.`
  );
}

chrome.commands.onCommand.addListener(
  (command) => {
    if (
      command !== TOGGLE_COMMAND
    ) {
      return;
    }

    enqueueOperation(
      toggleFocusedTab
    ).catch((error) => {
      console.error(
        "Clean-window toggle failed:",
        error
      );
    });
  }
);

chrome.tabs.onRemoved.addListener(
  (tabId) => {
    enqueueOperation(
      () =>
        removeClosedCleanSession(
          tabId
        )
    ).catch((error) => {
      console.error(
        "Clean-session cleanup failed:",
        error
      );
    });
  }
);

chrome.runtime.onStartup.addListener(
  () => {
    /*
     * Tab and window IDs only belong to the
     * current browser session.
     *
     * Local storage survives extension reloads,
     * but old return tickets should not survive a
     * full browser restart.
     */
    enqueueOperation(
      () =>
        chrome.storage.local.remove(
          STORAGE_KEY
        )
    ).catch((error) => {
      console.error(
        "Startup clean-session reset failed:",
        error
      );
    });
  }
);
