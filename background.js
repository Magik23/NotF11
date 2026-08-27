console.log("NotF11 service worker started.");

const TOGGLE_COMMAND = "toggle-clean-window";
const NEXT_CLEAN_TAB_COMMAND = "next-clean-tab";
const PREVIOUS_CLEAN_TAB_COMMAND = "previous-clean-tab";

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

async function getFocusedTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0] ?? null;
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

function findSwitchTargetId(
  cleanTab,
  session,
  sourceTabs,
  sessions,
  direction
) {
  const sourceOrder = getSourceOrder(
    session.sourceWindowId,
    sourceTabs,
    sessions
  );

  session.sourceOrder = [...sourceOrder];

  /*
   * Only tabs still physically present in the source
   * browser are eligible.
   *
   * Tabs already detached into other clean popups
   * are therefore skipped automatically.
   */
  const eligibleIds = new Set(
    sourceTabs
      .filter(
        (tab) =>
          tab.groupId === TAB_GROUP_ID_NONE
      )
      .map((tab) => tab.id)
  );

  if (eligibleIds.size === 0) {
    return null;
  }

  let currentPosition =
    sourceOrder.indexOf(cleanTab.id);

  if (currentPosition === -1) {
    currentPosition = Math.min(
      session.originalIndex,
      sourceOrder.length
    );

    sourceOrder.splice(
      currentPosition,
      0,
      cleanTab.id
    );

    session.sourceOrder = [...sourceOrder];
  }

  for (
    let step = 1;
    step <= sourceOrder.length;
    step += 1
  ) {
    const candidatePosition =
      (
        currentPosition +
        direction * step +
        sourceOrder.length
      ) % sourceOrder.length;

    const candidateId =
      sourceOrder[candidatePosition];

    if (eligibleIds.has(candidateId)) {
      return candidateId;
    }
  }

  return null;
}

async function enterCleanMode(
  activeTab,
  sessions,
  cleanGeometry = null
) {
  if (
    !activeTab ||
    activeTab.id === undefined
  ) {
    console.log("No active tab found.");
    return null;
  }

  const sourceWindow =
    await chrome.windows.get(activeTab.windowId);

  if (sourceWindow.type !== "normal") {
    console.log(
      "Clean mode can only start from a normal browser window."
    );

    return null;
  }

  if (
    activeTab.groupId !== TAB_GROUP_ID_NONE
  ) {
    console.log(
      "Grouped tabs are not supported yet."
    );

    return null;
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

  /*
   * Normal entry:
   * use the source browser's current geometry.
   *
   * Clean-tab handoff:
   * use the previous clean popup's current geometry.
   */
  const popupGeometry =
    cleanGeometry ?? sourceGeometry;

  const createData = {
    tabId: activeTab.id,
    type: "popup",
    focused: true
  };

  if (popupGeometry) {
    Object.assign(
      createData,
      popupGeometry
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
   * Chromium may adjust popup bounds during creation
   * at a screen edge. Reapply the requested bounds.
   */
  if (popupGeometry) {
    await chrome.windows.update(
      popupWindow.id,
      popupGeometry
    );
  }

  console.log(
    `Tab ${activeTab.id} entered clean mode from window ${sourceWindow.id}.`
  );

  return popupWindow;
}

async function exitCleanMode(
  cleanTab,
  session,
  sessions,
  {
    focusSource = true,
    activateReturnedTab = true
  } = {}
) {
  /*
   * tabs.move() only supports moves to/from normal
   * windows, so the popup tab first enters a
   * temporary minimized normal bridge window.
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
   * Restore the tab's original pin state while it
   * is inside the normal bridge.
   *
   * Chromium may change that state again during a
   * cross-window move, so the destination branch
   * below restores it a second time after the move.
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

  let destinationWindowId;

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

    /*
     * First move the live tab back into its source
     * browser.
     */
    await chrome.tabs.move(
      cleanTab.id,
      {
        windowId: sourceWindow.id,
        index: targetIndex
      }
    );

    /*
     * A cross-window move can cause Chromium to
     * drop or reposition the pinned state.
     *
     * Restore the original state only after the
     * tab has reached its final destination.
     */
    await chrome.tabs.update(
      cleanTab.id,
      {
        pinned: session.wasPinned
      }
    );

    /*
     * Pinning or unpinning can itself change the
     * tab's index. Reapply the logical return index
     * after the pin state has been restored.
     */
    await chrome.tabs.move(
      cleanTab.id,
      {
        windowId: sourceWindow.id,
        index: targetIndex
      }
    );

    destinationWindowId =
      sourceWindow.id;

    if (activateReturnedTab) {
      await chrome.tabs.update(
        cleanTab.id,
        {
          active: true
        }
      );
    }

    if (focusSource) {
      await chrome.windows.update(
        sourceWindow.id,
        {
          focused: true
        }
      );
    }
  } else {
    /*
     * If the original source browser disappeared,
     * the bridge becomes its replacement.
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

    destinationWindowId =
      bridgeWindow.id;

    /*
     * Any sibling clean windows that belonged to
     * the dead source browser now return here too.
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

    if (activateReturnedTab) {
      await chrome.tabs.update(
        cleanTab.id,
        {
          active: true
        }
      );
    }

    if (focusSource) {
      await chrome.windows.update(
        bridgeWindow.id,
        {
          focused: true
        }
      );
    }

    console.log(
      `Source window ${oldSourceWindowId} no longer existed; window ${bridgeWindow.id} became the replacement source.`
    );
  }

  delete sessions[
    keyForTab(cleanTab.id)
  ];

  await saveSessions(sessions);

  return destinationWindowId;
}

async function switchCleanTab(direction) {
  const cleanTab =
    await getFocusedTab();

  if (
    !cleanTab ||
    cleanTab.id === undefined
  ) {
    console.log("No active tab found.");
    return;
  }

  let sessions =
    await loadSessions();

  sessions =
    await pruneStaleSessions(
      sessions
    );

  const session =
    sessions[keyForTab(cleanTab.id)];

  if (
    !session ||
    session.popupWindowId !==
      cleanTab.windowId
  ) {
    console.log(
      "Tab switching is only available from a tracked clean popup."
    );

    return;
  }

  /*
   * Capture the clean popup's CURRENT geometry.
   *
   * If the user moved or resized it, the next
   * clean tab must appear exactly there.
   */
  const cleanPopup =
    await getWindowIfExists(
      session.popupWindowId
    );

  if (!cleanPopup) {
    console.log(
      "The clean popup no longer exists."
    );

    return;
  }

  const cleanGeometry =
    getGeometry(cleanPopup);

  /*
   * Resolve the source browser by identity.
   *
   * Its own position may also have changed while
   * the clean popup was open.
   */
  const sourceWindow =
    await getWindowIfExists(
      session.sourceWindowId
    );

  if (
    !sourceWindow ||
    sourceWindow.type !== "normal"
  ) {
    console.log(
      "The source browser no longer exists. Toggle this clean tab home before switching tabs."
    );

    return;
  }

  const sourceTabs =
    await chrome.tabs.query({
      windowId: sourceWindow.id
    });

  const targetTabId =
    findSwitchTargetId(
      cleanTab,
      session,
      sourceTabs,
      sessions,
      direction
    );

  if (targetTabId === null) {
    console.log(
      "No other eligible source tab is available."
    );

    return;
  }

  /*
   * Return the current clean tab WITHOUT focusing
   * the source browser.
   *
   * This is an internal handoff, not a real exit
   * from clean mode.
   */
  const destinationWindowId =
    await exitCleanMode(
      cleanTab,
      session,
      sessions,
      {
        focusSource: false,
        activateReturnedTab: false
      }
    );

  /*
   * Refresh the target AFTER the return.
   *
   * Its index may have changed when the old clean
   * tab was inserted back into the source tab strip.
   */
  const targetTab =
    await getTabIfExists(
      targetTabId
    );

  if (
    !targetTab ||
    targetTab.windowId !==
      destinationWindowId ||
    targetTab.groupId !==
      TAB_GROUP_ID_NONE
  ) {
    /*
     * Best-effort recovery:
     * put the old clean tab back into clean mode
     * instead of unexpectedly dropping the user
     * into the normal browser.
     */
    const returnedTab =
      await getTabIfExists(
        cleanTab.id
      );

    if (
      returnedTab &&
      returnedTab.windowId ===
        destinationWindowId
    ) {
      await enterCleanMode(
        returnedTab,
        sessions,
        cleanGeometry
      );
    }

    console.log(
      "Clean tab switch was canceled because the target tab changed."
    );

    return;
  }

  try {
    await enterCleanMode(
      targetTab,
      sessions,
      cleanGeometry
    );
  } catch (error) {
    /*
     * If opening the next clean popup fails,
     * try to restore the previous clean tab at
     * the same geometry.
     */
    const returnedTab =
      await getTabIfExists(
        cleanTab.id
      );

    if (
      returnedTab &&
      returnedTab.windowId ===
        destinationWindowId
    ) {
      try {
        await enterCleanMode(
          returnedTab,
          sessions,
          cleanGeometry
        );
      } catch (rollbackError) {
        console.error(
          "Clean-tab rollback also failed:",
          rollbackError
        );
      }
    }

    throw error;
  }

  console.log(
    `Clean view switched from tab ${cleanTab.id} to tab ${targetTab.id}.`
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
   * If THIS exact tab is inside the popup recorded
   * in its own return ticket, return it home.
   */
  if (
    session &&
    session.popupWindowId ===
      tab.windowId
  ) {
    await exitCleanMode(
      tab,
      session,
      sessions
    );

    console.log(
      `Tab ${tab.id} returned from clean mode.`
    );

    return;
  }

  const currentWindow =
    await chrome.windows.get(
      tab.windowId
    );

  /*
   * Do not treat unrelated popups, PWAs, DevTools,
   * etc. as our clean windows.
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
  const activeTab =
    await getFocusedTab();

  await toggleTab(activeTab);
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
    let operation = null;

    if (command === TOGGLE_COMMAND) {
      operation = toggleFocusedTab;
    } else if (
      command === NEXT_CLEAN_TAB_COMMAND
    ) {
      operation =
        () => switchCleanTab(1);
    } else if (
      command === PREVIOUS_CLEAN_TAB_COMMAND
    ) {
      operation =
        () => switchCleanTab(-1);
    }

    if (!operation) {
      return;
    }

    enqueueOperation(
      operation
    ).catch((error) => {
      console.error(
        "Clean-window command failed:",
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
     * Tab and window IDs belong to the current
     * browser session.
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
