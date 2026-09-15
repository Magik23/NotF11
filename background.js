console.log("NotF11 service worker started.");

const TOGGLE_COMMAND = "toggle-clean-window";
const NEXT_CLEAN_TAB_COMMAND = "next-clean-tab";
const PREVIOUS_CLEAN_TAB_COMMAND = "previous-clean-tab";

const SESSIONS_KEY = "cleanSessions";
const SETTINGS_KEY = "notF11Settings";
const FOCUS_STATE_KEY = "notF11FocusState";
const LAUNCH_STATE_KEY = "notF11LaunchState";
const RECOVERY_STATE_KEY = "notF11RecoveryState";

const TAB_GROUP_ID_NONE = -1;
const NEW_TAB_FOCUS_TRANSITION_MS = 120;

const DEFAULT_SETTINGS = Object.freeze({
  cleanOnLaunch: false,
  newTabsStayClean: false,
  rememberWindowGeometry: true
});

let operationQueue = Promise.resolve();

function enqueueOperation(operation) {
  const run = operationQueue.then(operation, operation);
  operationQueue = run.catch(() => {});
  return run;
}

function keyForTab(tabId) {
  return String(tabId);
}

function normalizeSettings(value = {}) {
  return {
    cleanOnLaunch:
      typeof value.cleanOnLaunch === "boolean"
        ? value.cleanOnLaunch
        : DEFAULT_SETTINGS.cleanOnLaunch,
    newTabsStayClean:
      typeof value.newTabsStayClean === "boolean"
        ? value.newTabsStayClean
        : DEFAULT_SETTINGS.newTabsStayClean,
    rememberWindowGeometry:
      typeof value.rememberWindowGeometry === "boolean"
        ? value.rememberWindowGeometry
        : DEFAULT_SETTINGS.rememberWindowGeometry
  };
}

async function loadSettings() {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(result[SETTINGS_KEY]);
}

async function saveSettings(settings) {
  const normalized = normalizeSettings(settings);

  await chrome.storage.local.set({
    [SETTINGS_KEY]: normalized
  });

  return normalized;
}

async function loadRecoveryState() {
  const result = await chrome.storage.local.get(RECOVERY_STATE_KEY);
  return result[RECOVERY_STATE_KEY] ?? null;
}

async function saveRecoveryState(state) {
  await chrome.storage.local.set({
    [RECOVERY_STATE_KEY]: state
  });
}

async function consumeRecoveryState() {
  const state = await loadRecoveryState();

  if (state) {
    await chrome.storage.local.remove(RECOVERY_STATE_KEY);
  }

  return state;
}

async function isToggleShortcutAssigned() {
  const commands = await chrome.commands.getAll();
  const toggleCommand = commands.find(
    (command) => command.name === TOGGLE_COMMAND
  );

  return Boolean(toggleCommand?.shortcut);
}

async function disableUnsafeCleanOnLaunch(settings, reason) {
  if (!settings.cleanOnLaunch || await isToggleShortcutAssigned()) {
    return false;
  }

  settings.cleanOnLaunch = false;
  await saveSettings(settings);
  await chrome.storage.session.remove(LAUNCH_STATE_KEY);
  await saveRecoveryState({
    type: "clean-on-launch-disabled",
    reason,
    at: Date.now()
  });

  console.warn(
    "Clean on launch was disabled because the Toggle clean mode shortcut is unassigned."
  );

  return true;
}

async function updateSetting(key, value) {
  if (!(key in DEFAULT_SETTINGS) || typeof value !== "boolean") {
    throw new Error("Invalid NotF11 setting.");
  }

  if (
    key === "cleanOnLaunch" &&
    value === true &&
    !(await isToggleShortcutAssigned())
  ) {
    throw new Error(
      "Assign the Toggle clean mode shortcut before enabling Clean on launch."
    );
  }

  const settings = await loadSettings();
  settings[key] = value;

  const saved = await saveSettings(settings);

  if (key === "cleanOnLaunch") {
    await chrome.storage.local.remove(RECOVERY_STATE_KEY);

    if (value === false) {
      await chrome.storage.session.remove(LAUNCH_STATE_KEY);
    }
  }

  return saved;
}

async function loadSessions() {
  const result = await chrome.storage.session.get(SESSIONS_KEY);
  return result[SESSIONS_KEY] ?? {};
}

async function saveSessions(sessions) {
  await chrome.storage.session.set({
    [SESSIONS_KEY]: sessions
  });
}

async function loadFocusState() {
  const result = await chrome.storage.session.get(FOCUS_STATE_KEY);
  return result[FOCUS_STATE_KEY] ?? null;
}

async function saveFocusState(state) {
  await chrome.storage.session.set({
    [FOCUS_STATE_KEY]: state
  });
}

async function ensureFocusState() {
  const existing = await loadFocusState();

  if (existing) {
    return {
      state: existing,
      hadHistory: true
    };
  }

  let focusedWindow = null;

  try {
    focusedWindow = await chrome.windows.getLastFocused();
  } catch {
    focusedWindow = null;
  }

  const state = {
    currentWindowId: focusedWindow?.id ?? null,
    previousWindowId: null,
    changedAt: 0
  };

  await saveFocusState(state);

  return {
    state,
    hadHistory: false
  };
}

async function recordWindowFocus(
  windowId,
  eventAt = Date.now()
) {
  const { state } = await ensureFocusState();

  if (
    Number.isFinite(state.changedAt) &&
    eventAt < state.changedAt
  ) {
    return;
  }

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (state.currentWindowId === null) {
      return;
    }

    await saveFocusState({
      currentWindowId: null,
      previousWindowId: state.currentWindowId,
      changedAt: eventAt
    });

    return;
  }

  if (state.currentWindowId === windowId) {
    return;
  }

  await saveFocusState({
    currentWindowId: windowId,
    previousWindowId: state.currentWindowId,
    changedAt: eventAt
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

function getGeometry(window) {
  const values = [
    window?.left,
    window?.top,
    window?.width,
    window?.height
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

async function getFocusedTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  return tabs[0] ?? null;
}

async function resolveTargetTab(tabLike = null, explicitTabId = null) {
  const tabId = explicitTabId ?? tabLike?.id;

  if (Number.isInteger(tabId)) {
    // A command or popup action that names a concrete tab must never
    // fall through to a different focused tab if that target disappears.
    return getTabIfExists(tabId);
  }

  return getFocusedTab();
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

function getSourceOrder(sourceWindowId, sourceTabs, sessions) {
  const currentIds = sourceTabs
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((tab) => tab.id);

  const siblingSession = Object.values(sessions).find(
    (session) => session.sourceWindowId === sourceWindowId
  );

  if (!siblingSession) {
    return currentIds;
  }

  const detachedIds = new Set(
    Object.values(sessions)
      .filter((session) => session.sourceWindowId === sourceWindowId)
      .map((session) => session.tabId)
  );

  const validIds = new Set([
    ...currentIds,
    ...detachedIds
  ]);

  const rememberedOrder = Array.isArray(siblingSession.sourceOrder)
    ? siblingSession.sourceOrder
    : currentIds;

  const order = rememberedOrder.filter(
    (tabId) => validIds.has(tabId)
  );

  for (let position = 0; position < currentIds.length; position += 1) {
    const tabId = currentIds[position];

    if (order.includes(tabId)) {
      continue;
    }

    const nextKnownId = currentIds
      .slice(position + 1)
      .find((id) => order.includes(id));

    if (nextKnownId !== undefined) {
      order.splice(order.indexOf(nextKnownId), 0, tabId);
      continue;
    }

    const previousKnownId = currentIds
      .slice(0, position)
      .reverse()
      .find((id) => order.includes(id));

    if (previousKnownId !== undefined) {
      order.splice(order.indexOf(previousKnownId) + 1, 0, tabId);
      continue;
    }

    order.push(tabId);
  }

  for (const sibling of Object.values(sessions)) {
    if (sibling.sourceWindowId === sourceWindowId) {
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

  const sourceOrder = Array.isArray(session.sourceOrder)
    ? session.sourceOrder
    : [session.tabId];

  const position = sourceOrder.indexOf(session.tabId);

  let targetIndex = Math.min(
    session.originalIndex,
    tabs.length
  );

  if (position !== -1) {
    let anchorFound = false;

    for (let i = position + 1; i < sourceOrder.length; i += 1) {
      const nextTab = tabsById.get(sourceOrder[i]);

      if (nextTab) {
        targetIndex = nextTab.index;
        anchorFound = true;
        break;
      }
    }

    if (!anchorFound) {
      for (let i = position - 1; i >= 0; i -= 1) {
        const previousTab = tabsById.get(sourceOrder[i]);

        if (previousTab) {
          targetIndex = previousTab.index + 1;
          break;
        }
      }
    }
  }

  const pinnedCount = tabs.filter((tab) => tab.pinned).length;

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

  const eligibleIds = new Set(
    sourceTabs
      .filter((tab) => tab.groupId === TAB_GROUP_ID_NONE)
      .map((tab) => tab.id)
  );

  if (eligibleIds.size === 0) {
    return null;
  }

  let currentPosition = sourceOrder.indexOf(cleanTab.id);

  if (currentPosition === -1) {
    currentPosition = Math.min(
      session.originalIndex,
      sourceOrder.length
    );

    sourceOrder.splice(currentPosition, 0, cleanTab.id);
    session.sourceOrder = [...sourceOrder];
  }

  for (let step = 1; step <= sourceOrder.length; step += 1) {
    const candidatePosition =
      (
        currentPosition +
        direction * step +
        sourceOrder.length
      ) % sourceOrder.length;

    const candidateId = sourceOrder[candidatePosition];

    if (eligibleIds.has(candidateId)) {
      return candidateId;
    }
  }

  return null;
}

async function enterCleanMode(
  activeTab,
  sessions,
  {
    focused = true,
    cleanGeometry = null
  } = {}
) {
  if (!activeTab || activeTab.id === undefined) {
    console.log("No active tab found.");
    return null;
  }

  const sourceWindow = await chrome.windows.get(activeTab.windowId);

  if (sourceWindow.type !== "normal") {
    console.log(
      "Clean mode can only start from a normal browser window."
    );
    return null;
  }

  if (activeTab.groupId !== TAB_GROUP_ID_NONE) {
    console.log("Grouped tabs are not supported yet.");
    return null;
  }

  const [sourceTabs, settings] = await Promise.all([
    chrome.tabs.query({
      windowId: sourceWindow.id
    }),
    loadSettings()
  ]);

  const sourceOrder = getSourceOrder(
    sourceWindow.id,
    sourceTabs,
    sessions
  );

  const rememberGeometry = settings.rememberWindowGeometry;
  const sourceGeometry = rememberGeometry
    ? getGeometry(sourceWindow)
    : null;

  const popupGeometry = rememberGeometry
    ? (cleanGeometry ?? sourceGeometry)
    : null;

  const createData = {
    tabId: activeTab.id,
    type: "popup",
    focused
  };

  if (popupGeometry) {
    Object.assign(createData, popupGeometry);
  }

  const popupWindow = await chrome.windows.create(createData);

  if (!popupWindow || popupWindow.id === undefined) {
    throw new Error("Clean window could not be created.");
  }

  sessions[keyForTab(activeTab.id)] = {
    tabId: activeTab.id,
    popupWindowId: popupWindow.id,
    sourceWindowId: sourceWindow.id,
    sourceWasSingleTab: sourceTabs.length === 1,
    sourceOrder,
    originalIndex: activeTab.index,
    wasPinned: activeTab.pinned,
    sourceGeometry
  };

  await saveSessions(sessions);

  /*
   * Chromium can slightly adjust popup bounds near screen edges.
   * When geometry memory is enabled, reapply the requested footprint
   * after creation so the Clean window visually replaces its source.
   */
  if (popupGeometry) {
    try {
      await chrome.windows.update(
        popupWindow.id,
        popupGeometry
      );
    } catch (error) {
      console.debug(
        "Clean-window geometry reapply was not honored:",
        error
      );
    }
  }

  if (focused) {
    await recordWindowFocus(
      popupWindow.id,
      Date.now()
    );
  }

  console.log(
    `Tab ${activeTab.id} entered clean mode from window ${sourceWindow.id}.`
  );

  return popupWindow;
}

async function recoverFailedCleanExit(
  cleanTabId,
  recoveryWindowId,
  session,
  sessions,
  settings
) {
  const tab = await getTabIfExists(cleanTabId);

  if (!tab) {
    delete sessions[keyForTab(cleanTabId)];
    await saveSessions(sessions);
    return null;
  }

  let currentWindow = await getWindowIfExists(tab.windowId);

  /*
   * Once a live tab has left its Clean popup, fail toward a visible
   * ordinary Chromium window. Never leave it trapped in a minimized
   * bridge or with a stale Clean session.
   */
  if (!currentWindow || currentWindow.type !== "normal") {
    const createData = {
      tabId: cleanTabId,
      type: "normal",
      focused: true
    };

    if (
      settings.rememberWindowGeometry &&
      session.sourceGeometry
    ) {
      Object.assign(createData, session.sourceGeometry);
    }

    try {
      currentWindow = await chrome.windows.create(createData);
    } catch (error) {
      console.error(
        "Clean-exit fallback normal window could not be created:",
        error
      );
      currentWindow = null;
    }
  }

  if (currentWindow && currentWindow.type === "normal") {
    try {
      if (currentWindow.state === "minimized") {
        await chrome.windows.update(currentWindow.id, {
          state: "normal"
        });
      }
    } catch (error) {
      console.debug(
        "Recovery window state could not be normalized:",
        error
      );
    }

    if (
      settings.rememberWindowGeometry &&
      session.sourceGeometry &&
      currentWindow.id === recoveryWindowId
    ) {
      try {
        await chrome.windows.update(
          currentWindow.id,
          session.sourceGeometry
        );
      } catch (error) {
        console.debug(
          "Recovery geometry could not be reapplied:",
          error
        );
      }
    }

    try {
      await chrome.tabs.update(cleanTabId, {
        pinned: session.wasPinned,
        active: true
      });
    } catch (error) {
      console.debug(
        "Recovery tab state could not be fully restored:",
        error
      );
    }

    try {
      await chrome.windows.update(currentWindow.id, {
        focused: true
      });
    } catch (error) {
      console.debug(
        "Recovery window could not be focused:",
        error
      );
    }

    const originalSource = await getWindowIfExists(
      session.sourceWindowId
    );

    if (!originalSource || originalSource.type !== "normal") {
      for (const sibling of Object.values(sessions)) {
        if (sibling.sourceWindowId === session.sourceWindowId) {
          sibling.sourceWindowId = currentWindow.id;
        }
      }
    }
  }

  delete sessions[keyForTab(cleanTabId)];
  await saveSessions(sessions);

  return currentWindow?.id ?? null;
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
  const settings = await loadSettings();
  let sourceWindow = await getWindowIfExists(session.sourceWindowId);
  let destinationWindowId = null;
  let recoveryWindowId = null;

  try {
    if (sourceWindow && sourceWindow.type === "normal") {
      /*
       * Chromium cannot move a tab directly from a popup into an
       * existing normal window. Use a temporary normal bridge.
       *
       * With geometry memory ON (the normal Windows default), keep
       * that bridge minimized to avoid a visible flash. With it OFF,
       * do not impose a minimized state; a tiling/window manager is
       * free to own the temporary top-level client.
       */
      const bridgeCreateData = {
        tabId: cleanTab.id,
        type: "normal",
        focused: false
      };

      if (settings.rememberWindowGeometry) {
        bridgeCreateData.state = "minimized";
      }

      const bridgeWindow = await chrome.windows.create(
        bridgeCreateData
      );

      if (!bridgeWindow || bridgeWindow.id === undefined) {
        throw new Error(
          "Temporary normal bridge window could not be created."
        );
      }

      recoveryWindowId = bridgeWindow.id;

      await chrome.tabs.update(cleanTab.id, {
        pinned: session.wasPinned
      });

      /*
       * The source can disappear between the first lookup and bridge
       * creation. Re-check it before moving the live tab.
       */
      sourceWindow = await getWindowIfExists(session.sourceWindowId);

      if (sourceWindow && sourceWindow.type === "normal") {
        const sourceTabs = await chrome.tabs.query({
          windowId: sourceWindow.id
        });

        const targetIndex = getReturnIndex(
          session,
          sourceTabs
        );

        await chrome.tabs.move(cleanTab.id, {
          windowId: sourceWindow.id,
          index: targetIndex
        });

        await chrome.tabs.update(cleanTab.id, {
          pinned: session.wasPinned
        });

        await chrome.tabs.move(cleanTab.id, {
          windowId: sourceWindow.id,
          index: targetIndex
        });

        destinationWindowId = sourceWindow.id;

        if (activateReturnedTab) {
          await chrome.tabs.update(cleanTab.id, {
            active: true
          });
        }

        if (focusSource) {
          await chrome.windows.update(sourceWindow.id, {
            focused: true
          });
        }
      } else {
        const oldSourceWindowId = session.sourceWindowId;

        destinationWindowId = bridgeWindow.id;

        if (settings.rememberWindowGeometry) {
          await chrome.windows.update(bridgeWindow.id, {
            state: "normal"
          });

          if (session.sourceGeometry) {
            await chrome.windows.update(
              bridgeWindow.id,
              session.sourceGeometry
            );
          }
        }

        for (const sibling of Object.values(sessions)) {
          if (sibling.sourceWindowId === oldSourceWindowId) {
            sibling.sourceWindowId = bridgeWindow.id;
          }
        }

        if (activateReturnedTab) {
          await chrome.tabs.update(cleanTab.id, {
            active: true
          });
        }

        if (focusSource) {
          await chrome.windows.update(bridgeWindow.id, {
            focused: true
          });
        }

        console.log(
          `Source window ${oldSourceWindowId} disappeared during return; window ${bridgeWindow.id} became the replacement source.`
        );
      }
    } else {
      /*
       * If the source is already gone, do not manufacture a bridge.
       * Turn the same live tab directly into its replacement normal
       * source window.
       */
      const oldSourceWindowId = session.sourceWindowId;

      const createData = {
        tabId: cleanTab.id,
        type: "normal",
        focused: Boolean(focusSource)
      };

      if (
        settings.rememberWindowGeometry &&
        session.sourceGeometry
      ) {
        Object.assign(createData, session.sourceGeometry);
      }

      const replacementWindow = await chrome.windows.create(
        createData
      );

      if (!replacementWindow || replacementWindow.id === undefined) {
        throw new Error(
          "Replacement normal source window could not be created."
        );
      }

      recoveryWindowId = replacementWindow.id;

      await chrome.tabs.update(cleanTab.id, {
        pinned: session.wasPinned
      });

      destinationWindowId = replacementWindow.id;

      if (
        settings.rememberWindowGeometry &&
        session.sourceGeometry
      ) {
        try {
          await chrome.windows.update(
            replacementWindow.id,
            session.sourceGeometry
          );
        } catch (error) {
          console.debug(
            "Replacement source geometry could not be reapplied:",
            error
          );
        }
      }

      for (const sibling of Object.values(sessions)) {
        if (sibling.sourceWindowId === oldSourceWindowId) {
          sibling.sourceWindowId = replacementWindow.id;
        }
      }

      if (activateReturnedTab) {
        await chrome.tabs.update(cleanTab.id, {
          active: true
        });
      }

      if (focusSource && !replacementWindow.focused) {
        await chrome.windows.update(replacementWindow.id, {
          focused: true
        });
      }

      console.log(
        `Source window ${oldSourceWindowId} no longer existed; window ${replacementWindow.id} became the replacement source.`
      );
    }

    delete sessions[keyForTab(cleanTab.id)];
    await saveSessions(sessions);

    return destinationWindowId;
  } catch (error) {
    if (recoveryWindowId !== null) {
      try {
        await recoverFailedCleanExit(
          cleanTab.id,
          recoveryWindowId,
          session,
          sessions,
          settings
        );
      } catch (recoveryError) {
        console.error(
          "Clean-exit emergency recovery also failed:",
          recoveryError
        );
      }
    }

    throw error;
  }
}

async function switchCleanTab(direction, commandTab = null) {
  const cleanTab = await resolveTargetTab(commandTab);

  if (!cleanTab || cleanTab.id === undefined) {
    console.log("No active tab found.");
    return;
  }

  let sessions = await loadSessions();
  sessions = await pruneStaleSessions(sessions);

  const session = sessions[keyForTab(cleanTab.id)];

  if (!session || session.popupWindowId !== cleanTab.windowId) {
    console.log(
      "Tab switching is only available from a tracked clean window."
    );
    return;
  }

  const [sourceWindow, settings, cleanPopup] = await Promise.all([
    getWindowIfExists(session.sourceWindowId),
    loadSettings(),
    getWindowIfExists(session.popupWindowId)
  ]);

  if (!sourceWindow || sourceWindow.type !== "normal") {
    console.log(
      "The source browser no longer exists. Toggle this clean tab home before switching tabs."
    );
    return;
  }

  const cleanGeometry =
    settings.rememberWindowGeometry && cleanPopup
      ? getGeometry(cleanPopup)
      : null;

  const sourceTabs = await chrome.tabs.query({
    windowId: sourceWindow.id
  });

  const targetTabId = findSwitchTargetId(
    cleanTab,
    session,
    sourceTabs,
    sessions,
    direction
  );

  if (targetTabId === null) {
    console.log("No other eligible source tab is available.");
    return;
  }

  const destinationWindowId = await exitCleanMode(
    cleanTab,
    session,
    sessions,
    {
      focusSource: false,
      activateReturnedTab: false
    }
  );

  const targetTab = await getTabIfExists(targetTabId);

  if (
    !targetTab ||
    targetTab.windowId !== destinationWindowId ||
    targetTab.groupId !== TAB_GROUP_ID_NONE
  ) {
    const returnedTab = await getTabIfExists(cleanTab.id);

    if (returnedTab && returnedTab.windowId === destinationWindowId) {
      await enterCleanMode(
        returnedTab,
        sessions,
        { cleanGeometry }
      );
    }

    console.log(
      "Clean-tab switch was canceled because the target tab changed."
    );
    return;
  }

  try {
    await enterCleanMode(
      targetTab,
      sessions,
      { cleanGeometry }
    );
  } catch (error) {
    const returnedTab = await getTabIfExists(cleanTab.id);

    if (returnedTab && returnedTab.windowId === destinationWindowId) {
      try {
        await enterCleanMode(
          returnedTab,
          sessions,
          { cleanGeometry }
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

async function recoverUntrackedPopup(tab) {
  const popupWindow = await getWindowIfExists(tab.windowId);
  const settings = await loadSettings();

  const geometry =
    settings.rememberWindowGeometry && popupWindow
      ? getGeometry(popupWindow)
      : null;

  const createData = {
    tabId: tab.id,
    type: "normal",
    focused: true
  };

  if (geometry) {
    Object.assign(createData, geometry);
  }

  const normalWindow = await chrome.windows.create(createData);

  if (!normalWindow || normalWindow.id === undefined) {
    throw new Error(
      "Untracked popup could not be recovered into a normal browser window."
    );
  }

  if (geometry) {
    try {
      await chrome.windows.update(
        normalWindow.id,
        geometry
      );
    } catch (error) {
      console.debug(
        "Recovered normal-window geometry could not be reapplied:",
        error
      );
    }
  }

  console.log(
    `Untracked popup tab ${tab.id} recovered into normal window ${normalWindow.id}.`
  );

  return normalWindow;
}

async function toggleTab(tab) {
  if (!tab || tab.id === undefined) {
    console.log("No active tab found.");
    return;
  }

  let sessions = await loadSessions();
  sessions = await pruneStaleSessions(sessions);

  const session = sessions[keyForTab(tab.id)];

  if (session && session.popupWindowId === tab.windowId) {
    await exitCleanMode(tab, session, sessions);
    console.log(`Tab ${tab.id} returned from clean mode.`);
    return;
  }

  const currentWindow = await chrome.windows.get(tab.windowId);

  if (currentWindow.type === "popup") {
    await recoverUntrackedPopup(tab);
    return;
  }

  if (currentWindow.type !== "normal") {
    console.log("This Chromium window type is not supported by NotF11.");
    return;
  }

  await enterCleanMode(tab, sessions);
}

async function toggleFocusedTab(commandTab = null, explicitTabId = null) {
  const activeTab = await resolveTargetTab(commandTab, explicitTabId);
  await toggleTab(activeTab);
}

async function removeClosedCleanSession(tabId) {
  const sessions = await loadSessions();
  const key = keyForTab(tabId);

  if (!sessions[key]) {
    return;
  }

  delete sessions[key];
  await saveSessions(sessions);

  console.log(
    `Closed clean tab ${tabId} removed from NotF11 sessions.`
  );
}

async function findCleanSessionForNewTab(
  newTab,
  sessions,
  createdAt
) {
  /*
   * Strongest signal: tabs opened directly by a Clean tab carry
   * openerTabId. This covers link-created children without guessing
   * from focus.
   */
  if (newTab.openerTabId !== undefined) {
    const openerSession =
      sessions[keyForTab(newTab.openerTabId)];

    if (openerSession) {
      return openerSession;
    }
  }

  const { state: focusState } = await ensureFocusState();

  /*
   * Native Ctrl+T usually has no openerTabId. If the Clean popup is
   * still the recorded focused Chromium window, associate the new tab
   * with that Clean source family.
   */
  const currentCleanSession = Object.values(sessions).find(
    (session) =>
      session.popupWindowId === focusState.currentWindowId
  );

  if (currentCleanSession) {
    return currentCleanSession;
  }

  /*
   * Chromium can focus the newly created normal tab just before
   * tabs.onCreated reaches the extension. Accept that transition only
   * inside a deliberately tiny event-time window.
   */
  const transitionAge =
    createdAt - focusState.changedAt;

  if (
    transitionAge < 0 ||
    transitionAge > NEW_TAB_FOCUS_TRANSITION_MS ||
    focusState.currentWindowId !== newTab.windowId
  ) {
    return null;
  }

  const previousCleanSession = Object.values(sessions).find(
    (session) =>
      session.popupWindowId === focusState.previousWindowId
  );

  if (!previousCleanSession) {
    return null;
  }

  /*
   * When the remembered source still exists, a no-opener Ctrl+T
   * should resolve into that source browser. Requiring that relation
   * prevents a fast focus transition in an unrelated browser window
   * from being mistaken for a Clean-origin new tab.
   */
  const sourceWindow = await getWindowIfExists(
    previousCleanSession.sourceWindowId
  );

  if (
    sourceWindow &&
    sourceWindow.type === "normal" &&
    newTab.windowId !== sourceWindow.id
  ) {
    return null;
  }

  return previousCleanSession;
}

function buildFamilyOrderWithNewTab(
  originSession,
  newTabId
) {
  const order = Array.isArray(originSession.sourceOrder)
    ? [...originSession.sourceOrder]
    : [originSession.tabId];

  if (!order.includes(originSession.tabId)) {
    order.push(originSession.tabId);
  }

  if (!order.includes(newTabId)) {
    const originPosition = order.indexOf(originSession.tabId);
    order.splice(originPosition + 1, 0, newTabId);
  }

  return order;
}

async function attachRawNewTabToCleanFamily(
  targetTab,
  originSession,
  sessions,
  settings
) {
  const oldSourceWindowId = originSession.sourceWindowId;
  const originSourceWindow = await getWindowIfExists(
    oldSourceWindowId
  );

  if (originSourceWindow?.type === "normal") {
    /*
     * Normally Chromium has already placed B in A's surviving source.
     * If it has not, normalize B into that real source rather than
     * adopting whichever unrelated window Chromium happened to use.
     */
    if (targetTab.windowId !== originSourceWindow.id) {
      await chrome.tabs.move(targetTab.id, {
        windowId: originSourceWindow.id,
        index: -1
      });

      targetTab = await getTabIfExists(targetTab.id);

      if (!targetTab) {
        return null;
      }
    }

    const sourceTabs = await chrome.tabs.query({
      windowId: originSourceWindow.id
    });

    getSourceOrder(
      originSourceWindow.id,
      sourceTabs,
      sessions
    );

    await saveSessions(sessions);
    return originSourceWindow.id;
  }

  /*
   * A's source disappeared because its last tab became Clean.
   *
   * The newly created Raw tab B now gives us a legitimate replacement
   * source. If Chromium put B into an unrelated existing browser, move
   * B into a dedicated normal window first. Never adopt X|Y merely
   * because Chromium happened to create B beside them.
   */
  let targetWindow = await getWindowIfExists(targetTab.windowId);

  if (!targetWindow || targetWindow.type !== "normal") {
    return null;
  }

  const hostTabs = await chrome.tabs.query({
    windowId: targetWindow.id
  });

  let replacementWindowId = targetWindow.id;

  const targetIsOnlyTab =
    hostTabs.length === 1 &&
    hostTabs[0]?.id === targetTab.id;

  if (!targetIsOnlyTab) {
    const createData = {
      tabId: targetTab.id,
      type: "normal",
      focused: Boolean(targetTab.active)
    };

    if (
      settings.rememberWindowGeometry &&
      originSession.sourceGeometry
    ) {
      Object.assign(
        createData,
        originSession.sourceGeometry
      );
    }

    const replacementWindow = await chrome.windows.create(
      createData
    );

    if (
      !replacementWindow ||
      replacementWindow.id === undefined
    ) {
      throw new Error(
        "The new tab could not create its clean family's replacement source."
      );
    }

    replacementWindowId = replacementWindow.id;
    targetWindow = replacementWindow;
  }

  if (
    settings.rememberWindowGeometry &&
    originSession.sourceGeometry
  ) {
    try {
      await chrome.windows.update(
        replacementWindowId,
        originSession.sourceGeometry
      );
    } catch (error) {
      console.debug(
        "Replacement source geometry could not be reapplied:",
        error
      );
    }
  }

  const familyOrder = buildFamilyOrderWithNewTab(
    originSession,
    targetTab.id
  );

  for (const sibling of Object.values(sessions)) {
    if (sibling.sourceWindowId === oldSourceWindowId) {
      sibling.sourceWindowId = replacementWindowId;
      sibling.sourceOrder = [...familyOrder];
    }
  }

  await saveSessions(sessions);

  console.log(
    `New Raw tab ${targetTab.id} became replacement source window ${replacementWindowId} for the Clean family.`
  );

  return replacementWindowId;
}

async function handleNewTabFromClean(
  newTab,
  createdAt
) {
  if (!newTab || newTab.id === undefined) {
    return;
  }

  const newWindow = await getWindowIfExists(newTab.windowId);

  if (!newWindow || newWindow.type !== "normal") {
    return;
  }

  let sessions = await loadSessions();
  sessions = await pruneStaleSessions(sessions);

  if (Object.keys(sessions).length === 0) {
    return;
  }

  const originSession = await findCleanSessionForNewTab(
    newTab,
    sessions,
    createdAt
  );

  if (!originSession) {
    return;
  }

  let targetTab = await getTabIfExists(newTab.id);

  if (
    !targetTab ||
    targetTab.groupId !== TAB_GROUP_ID_NONE
  ) {
    return;
  }

  const settings = await loadSettings();

  /*
   * OFF means "new child stays Raw", not "forget its family".
   * This is the repaired version of OG's original one-tab Ctrl+T edge
   * case: parent A stays Clean and Raw B becomes/rejoins A's source.
   */
  if (!settings.newTabsStayClean) {
    await attachRawNewTabToCleanFamily(
      targetTab,
      originSession,
      sessions,
      settings
    );

    return;
  }

  const shouldFocusNewClean = Boolean(newTab.active);

  const originSourceWindow = await getWindowIfExists(
    originSession.sourceWindowId
  );

  const originSourceIsAlive =
    originSourceWindow?.type === "normal";

  /*
   * If A's real source survives, B belongs there before it becomes
   * Clean. That preserves family ordering and return semantics.
   */
  if (
    originSourceIsAlive &&
    targetTab.windowId !== originSourceWindow.id
  ) {
    await chrome.tabs.move(targetTab.id, {
      windowId: originSourceWindow.id,
      index: -1
    });

    targetTab = await getTabIfExists(targetTab.id);
  }

  if (!targetTab) {
    return;
  }

  const targetWindow = await getWindowIfExists(targetTab.windowId);

  if (!targetWindow || targetWindow.type !== "normal") {
    return;
  }

  await enterCleanMode(
    targetTab,
    sessions,
    {
      focused: shouldFocusNewClean
    }
  );

  /*
   * If A's original source is already gone, the normal host Chromium
   * temporarily used for B may disappear as B becomes Clean. Keep A
   * and B attached to the same remembered family ID. The first member
   * returned Raw will create the replacement source and redirect its
   * Clean siblings.
   */
  if (!originSourceIsAlive) {
    const newSession = sessions[keyForTab(targetTab.id)];

    if (newSession) {
      const familyOrder = buildFamilyOrderWithNewTab(
        originSession,
        targetTab.id
      );

      newSession.sourceWindowId = originSession.sourceWindowId;
      newSession.sourceWasSingleTab =
        originSession.sourceWasSingleTab;
      newSession.sourceOrder = [...familyOrder];

      if (originSession.sourceGeometry) {
        newSession.sourceGeometry = {
          ...originSession.sourceGeometry
        };
      }

      for (const sibling of Object.values(sessions)) {
        if (
          sibling.sourceWindowId === originSession.sourceWindowId
        ) {
          sibling.sourceOrder = [...familyOrder];
        }
      }

      await saveSessions(sessions);
    }
  }

  console.log(
    `New tab ${targetTab.id} stayed clean in the same source family.`
  );
}

async function loadLaunchState() {
  const result = await chrome.storage.session.get(LAUNCH_STATE_KEY);
  return result[LAUNCH_STATE_KEY] ?? null;
}

async function setLaunchPending() {
  await chrome.storage.session.set({
    [LAUNCH_STATE_KEY]: {
      pending: true
    }
  });
}

async function clearLaunchPending() {
  await chrome.storage.session.remove(LAUNCH_STATE_KEY);
}

async function armCleanOnLaunchIfBrowserIsClosed() {
  const settings = await loadSettings();

  if (!settings.cleanOnLaunch) {
    await clearLaunchPending();
    return false;
  }

  if (await disableUnsafeCleanOnLaunch(settings, "shortcut-unassigned")) {
    return false;
  }

  const windows = await chrome.windows.getAll();
  const browserWindows = windows.filter(
    (window) =>
      window.type === "normal" ||
      window.type === "popup"
  );

  if (browserWindows.length !== 0) {
    return false;
  }

  await setLaunchPending();
  return true;
}

async function tryCleanOnLaunchFromTab(tab) {
  const launchState = await loadLaunchState();

  if (!launchState?.pending) {
    return false;
  }

  const settings = await loadSettings();

  if (!settings.cleanOnLaunch) {
    await clearLaunchPending();
    return false;
  }

  /*
   * Fast startup path:
   * chrome.tabs.onCreated gives us a concrete live tab
   * earlier than a full windows.getAll({ populate: true })
   * scan can resolve the browser state. If this is the
   * first active tab of a newly opened normal Chromium
   * window, hand it to NotF11 immediately.
   *
   * If Chromium is still assembling/restoring the window
   * and the move is not ready yet, leave launch pending.
   * The normal fallback listeners will retry safely.
   */
  if (
    !tab ||
    tab.id === undefined ||
    tab.windowId === undefined ||
    tab.active !== true
  ) {
    return false;
  }

  if (tab.groupId !== TAB_GROUP_ID_NONE) {
    await clearLaunchPending();
    console.log(
      "Clean on launch skipped because the active tab belongs to a Chromium tab group."
    );
    return false;
  }

  const sourceWindow = await getWindowIfExists(tab.windowId);

  if (!sourceWindow || sourceWindow.type !== "normal") {
    return false;
  }

  let sessions = await loadSessions();
  sessions = await pruneStaleSessions(sessions);

  try {
    const popupWindow = await enterCleanMode(tab, sessions);

    if (!popupWindow) {
      return false;
    }
  } catch (error) {
    console.debug(
      "Early clean-on-launch handoff deferred until Chromium finishes creating the window:",
      error
    );
    return false;
  }

  await clearLaunchPending();

  console.log(
    `Clean on launch used the early tab handoff for tab ${tab.id}.`
  );

  return true;
}

async function tryCleanOnLaunch() {
  const launchState = await loadLaunchState();

  if (!launchState?.pending) {
    return false;
  }

  const settings = await loadSettings();

  if (!settings.cleanOnLaunch) {
    await clearLaunchPending();
    return false;
  }

  const windows = await chrome.windows.getAll({
    populate: true
  });

  /*
   * Clean on launch converts exactly one eligible tab.
   * Other popup windows are not treated as evidence that
   * this launch was already handled because they may be
   * unrelated Chromium/PWA/extension windows.
   */
  const normalWindows = windows.filter(
    (window) => window.type === "normal"
  );

  if (normalWindows.length === 0) {
    return false;
  }

  let sourceWindow = normalWindows.find((window) => window.focused);

  if (!sourceWindow) {
    try {
      const lastFocused = await chrome.windows.getLastFocused({
        populate: true
      });

      if (lastFocused?.type === "normal") {
        sourceWindow = lastFocused;
      }
    } catch {
      sourceWindow = null;
    }
  }

  sourceWindow ??= normalWindows[0];

  const activeTab = sourceWindow.tabs?.find((tab) => tab.active) ?? null;

  if (!activeTab || activeTab.id === undefined) {
    return false;
  }

  if (activeTab.groupId !== TAB_GROUP_ID_NONE) {
    await clearLaunchPending();
    console.log(
      "Clean on launch skipped because the active tab belongs to a Chromium tab group."
    );
    return false;
  }

  let sessions = await loadSessions();
  sessions = await pruneStaleSessions(sessions);

  await enterCleanMode(activeTab, sessions);
  await clearLaunchPending();

  console.log(
    `Clean on launch created clean tab ${activeTab.id}.`
  );

  return true;
}

async function initializeSettings() {
  const result = await chrome.storage.local.get(SETTINGS_KEY);

  // Older development builds stored runtime session IDs in storage.local.
  // Runtime session state now lives in storage.session and should never
  // survive a browser restart.
  await chrome.storage.local.remove(SESSIONS_KEY);

  if (result[SETTINGS_KEY] === undefined) {
    await saveSettings(DEFAULT_SETTINGS);
    return;
  }

  const normalized = normalizeSettings(result[SETTINGS_KEY]);
  await saveSettings(normalized);
}

async function getPopupState(explicitTabId = null) {
  const [settings, rawSessions, focusedTab, recoveryNotice] = await Promise.all([
    loadSettings(),
    loadSessions(),
    resolveTargetTab(null, explicitTabId),
    consumeRecoveryState()
  ]);

  const sessions = await pruneStaleSessions(rawSessions);

  let mode = "normal";

  if (focusedTab?.id !== undefined) {
    const session = sessions[keyForTab(focusedTab.id)];

    if (session && session.popupWindowId === focusedTab.windowId) {
      mode = "clean";
    } else {
      const currentWindow = await getWindowIfExists(focusedTab.windowId);
      if (currentWindow?.type === "popup") {
        mode = "popup";
      }
    }
  }

  return {
    settings,
    mode,
    grouped:
      focusedTab?.groupId !== undefined &&
      focusedTab.groupId !== TAB_GROUP_ID_NONE,
    cleanSessionCount: Object.keys(sessions).length,
    recoveryNotice
  };
}

chrome.commands.onCommand.addListener((command, commandTab) => {
  let operation = null;

  if (command === TOGGLE_COMMAND) {
    operation = () => toggleFocusedTab(commandTab);
  } else if (command === NEXT_CLEAN_TAB_COMMAND) {
    operation = () => switchCleanTab(1, commandTab);
  } else if (command === PREVIOUS_CLEAN_TAB_COMMAND) {
    operation = () => switchCleanTab(-1, commandTab);
  }

  if (!operation) {
    return;
  }

  enqueueOperation(operation).catch((error) => {
    console.error("NotF11 command failed:", error);
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  /*
   * Capture creation time before the serialized operation queue can
   * introduce delay. Focus-transition matching uses event time, not
   * whatever the clock says after earlier operations finish.
   */
  const createdAt = Date.now();

  enqueueOperation(async () => {
    /*
     * Clean-on-launch gets first chance at a brand-new active tab.
     * If this is not a launch handoff, apply normal Clean-parent
     * lineage behavior.
     */
    const launchedClean = await tryCleanOnLaunchFromTab(tab);

    if (launchedClean) {
      return;
    }

    await handleNewTabFromClean(
      tab,
      createdAt
    );

    await tryCleanOnLaunch();
  }).catch((error) => {
    console.error(
      "New-tab NotF11 lifecycle handling failed:",
      error
    );
  });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  enqueueOperation(async () => {
    const activeTab = await getTabIfExists(activeInfo.tabId);

    if (activeTab && await tryCleanOnLaunchFromTab(activeTab)) {
      return;
    }

    await tryCleanOnLaunch();
  }).catch((error) => {
    console.error("Clean-on-launch tab activation check failed:", error);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  enqueueOperation(() => removeClosedCleanSession(tabId)).catch((error) => {
    console.error("NotF11 session cleanup failed:", error);
  });
});

chrome.windows.onCreated.addListener((window) => {
  if (window.type !== "normal") {
    return;
  }

  /*
   * Let the concrete tabs.onCreated / tabs.onActivated fast
   * paths run first. A short delayed full-state scan remains
   * as the safety net for unusual Chromium restore timing.
   */
  setTimeout(() => {
    enqueueOperation(tryCleanOnLaunch).catch((error) => {
      console.error("Clean-on-launch window fallback failed:", error);
    });
  }, 120);
});

chrome.windows.onRemoved.addListener(() => {
  enqueueOperation(armCleanOnLaunchIfBrowserIsClosed).catch((error) => {
    console.error("Clean-on-launch arming failed:", error);
  });
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  const eventAt = Date.now();

  enqueueOperation(
    () => recordWindowFocus(windowId, eventAt)
  ).catch((error) => {
    console.error("NotF11 focus tracking failed:", error);
  });
});

chrome.runtime.onInstalled.addListener(() => {
  enqueueOperation(async () => {
    await initializeSettings();

    const settings = await loadSettings();
    await disableUnsafeCleanOnLaunch(
      settings,
      "shortcut-unassigned-at-install"
    );
  }).catch((error) => {
    console.error("NotF11 install initialization failed:", error);
  });
});

chrome.runtime.onStartup.addListener(() => {
  enqueueOperation(async () => {
    await chrome.storage.session.remove([
      SESSIONS_KEY,
      FOCUS_STATE_KEY,
      LAUNCH_STATE_KEY
    ]);

    await initializeSettings();

    const settings = await loadSettings();

    if (
      settings.cleanOnLaunch &&
      !(await disableUnsafeCleanOnLaunch(settings, "shortcut-unassigned"))
    ) {
      await setLaunchPending();

      /*
       * Do not immediately run the slower full-window scan.
       * Give Chromium's tab creation/activation events a chance
       * to hand off the first live tab through the fast path.
       * The delayed scan protects startup/restore edge cases in
       * which those events have already happened.
       */
      setTimeout(() => {
        enqueueOperation(tryCleanOnLaunch).catch((error) => {
          console.error(
            "Clean-on-launch startup fallback failed:",
            error
          );
        });
      }, 180);
    }
  }).catch((error) => {
    console.error("NotF11 startup initialization failed:", error);
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  if (message.type === "get-popup-state") {
    enqueueOperation(() => getPopupState(message.tabId))
      .then((state) => sendResponse({ ok: true, state }))
      .catch((error) => {
        console.error("Popup state query failed:", error);
        sendResponse({ ok: false, error: error.message });
      });

    return true;
  }

  if (message.type === "set-setting") {
    enqueueOperation(() => updateSetting(message.key, message.value))
      .then((settings) => sendResponse({ ok: true, settings }))
      .catch((error) => {
        console.error("NotF11 setting update failed:", error);
        sendResponse({ ok: false, error: error.message });
      });

    return true;
  }

  if (message.type === "toggle-focused") {
    enqueueOperation(() => toggleFocusedTab(null, message.tabId))
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error("Popup toggle failed:", error);
        sendResponse({ ok: false, error: error.message });
      });

    return true;
  }

  return false;
});

initializeSettings().catch((error) => {
  console.error("NotF11 settings initialization failed:", error);
});

ensureFocusState().catch((error) => {
  console.error("NotF11 focus initialization failed:", error);
});
