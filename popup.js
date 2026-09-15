const cleanOnLaunch = document.querySelector("#clean-on-launch");
const newTabsStayClean = document.querySelector("#new-tabs-stay-clean");
const rememberWindowGeometry = document.querySelector("#remember-window-geometry");
const toggleButton = document.querySelector("#toggle-button");
const toggleLabel = document.querySelector("#toggle-label");
const message = document.querySelector("#message");
const manageShortcutsButton = document.querySelector("#manage-shortcuts");
const documentationButton = document.querySelector("#open-documentation");
const primaryShortcut = document.querySelector("#shortcut-toggle-primary");

let messageTimer = null;
let contextNotice = {
  text: "",
  tone: "info"
};

const shortcutElements = {
  "toggle-clean-window": document.querySelector("#shortcut-toggle"),
  "next-clean-tab": document.querySelector("#shortcut-next"),
  "previous-clean-tab": document.querySelector("#shortcut-previous")
};

function renderMessage(text = "", tone = "info") {
  message.textContent = text;
  message.classList.remove(
    "message--success",
    "message--warning",
    "message--error"
  );

  if (text && tone !== "info") {
    message.classList.add(`message--${tone}`);
  }
}

function setContextNotice(text = "", tone = "info") {
  contextNotice = { text, tone };

  if (messageTimer === null) {
    renderMessage(text, tone);
  }
}

function showTransientMessage(text = "", tone = "info", autoClearMs = 0) {
  if (messageTimer !== null) {
    clearTimeout(messageTimer);
    messageTimer = null;
  }

  renderMessage(text, tone);

  if (text && autoClearMs > 0) {
    messageTimer = setTimeout(() => {
      messageTimer = null;
      renderMessage(contextNotice.text, contextNotice.tone);
    }, autoClearMs);
  }
}

async function send(messageBody) {
  const response = await chrome.runtime.sendMessage(messageBody);

  if (!response?.ok) {
    throw new Error(response?.error || "NotF11 request failed.");
  }

  return response;
}

async function getCurrentContextTabId() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tab?.id ?? null;
}

function formatShortcut(shortcut) {
  if (!shortcut) {
    return "Unassigned";
  }

  return shortcut
    .replaceAll("Command", "Cmd")
    .replaceAll("MacCtrl", "Ctrl")
    .replaceAll("+", " ");
}

async function refreshShortcuts() {
  const commands = await chrome.commands.getAll();
  const byName = new Map(
    commands.map((command) => [command.name, command])
  );

  const missingNames = [];

  for (const [name, element] of Object.entries(shortcutElements)) {
    const shortcut = byName.get(name)?.shortcut ?? "";
    const assigned = shortcut.length > 0;
    const formatted = formatShortcut(shortcut);

    element.textContent = formatted;
    element.classList.toggle("is-unassigned", !assigned);

    if (name === "toggle-clean-window") {
      primaryShortcut.textContent = formatted;
      primaryShortcut.classList.toggle("is-unassigned", !assigned);
    }

    if (!assigned) {
      missingNames.push(name);
    }
  }

  return {
    missingNames,
    missingCount: missingNames.length,
    toggleAssigned: !missingNames.includes("toggle-clean-window")
  };
}

function renderState(state) {
  cleanOnLaunch.checked = Boolean(state.settings.cleanOnLaunch);
  newTabsStayClean.checked = Boolean(state.settings.newTabsStayClean);
  rememberWindowGeometry.checked = Boolean(
    state.settings.rememberWindowGeometry
  );

  if (state.grouped) {
    toggleLabel.textContent = "Grouped tab not supported";
    toggleButton.disabled = true;
    return;
  }

  toggleButton.disabled = false;

  if (state.mode === "clean") {
    toggleLabel.textContent = "Return current tab";
  } else if (state.mode === "popup") {
    toggleLabel.textContent = "Recover normal browser";
  } else {
    toggleLabel.textContent = "Open current tab clean";
  }
}

function getContextNotice(state, shortcutState) {
  if (state.recoveryNotice?.type === "clean-on-launch-disabled") {
    return {
      text: "Clean on launch was turned off because Toggle clean mode is unassigned.",
      tone: "warning"
    };
  }

  if (state.grouped) {
    return {
      text: "Grouped tabs aren't supported.",
      tone: "warning"
    };
  }

  if (!shortcutState.toggleAssigned) {
    return {
      text: "Toggle clean mode is unassigned. Clean on launch requires it.",
      tone: "warning"
    };
  }

  if (shortcutState.missingCount > 0) {
    const count = shortcutState.missingCount;

    return {
      text: `${count} keyboard shortcut${count === 1 ? " is" : "s are"} unassigned.`,
      tone: "warning"
    };
  }

  if (state.mode === "popup") {
    return {
      text: "This popup can be recovered safely.",
      tone: "info"
    };
  }

  return {
    text: "",
    tone: "info"
  };
}

async function refresh() {
  const tabId = await getCurrentContextTabId();
  const [response, shortcutState] = await Promise.all([
    send({ type: "get-popup-state", tabId }),
    refreshShortcuts()
  ]);

  renderState(response.state);

  const notice = getContextNotice(response.state, shortcutState);
  setContextNotice(notice.text, notice.tone);
}

async function changeSetting(key, value, input) {
  input.disabled = true;

  try {
    const response = await send({
      type: "set-setting",
      key,
      value
    });

    input.checked = Boolean(response.settings[key]);
    showTransientMessage("Saved.", "success", 1400);
  } catch (error) {
    input.checked = !value;
    showTransientMessage(error.message, "error");
  } finally {
    input.disabled = false;
  }
}

cleanOnLaunch.addEventListener("change", () => {
  void changeSetting(
    "cleanOnLaunch",
    cleanOnLaunch.checked,
    cleanOnLaunch
  );
});

newTabsStayClean.addEventListener("change", () => {
  void changeSetting(
    "newTabsStayClean",
    newTabsStayClean.checked,
    newTabsStayClean
  );
});

rememberWindowGeometry.addEventListener("change", () => {
  void changeSetting(
    "rememberWindowGeometry",
    rememberWindowGeometry.checked,
    rememberWindowGeometry
  );
});

toggleButton.addEventListener("click", async () => {
  toggleButton.disabled = true;

  try {
    const tabId = await getCurrentContextTabId();
    await send({ type: "toggle-focused", tabId });
    window.close();
  } catch (error) {
    showTransientMessage(error.message, "error");
    toggleButton.disabled = false;
  }
});

manageShortcutsButton.addEventListener("click", async () => {
  try {
    await chrome.tabs.create({
      url: "chrome://extensions/shortcuts"
    });
    window.close();
  } catch (_error) {
    showTransientMessage(
      "Open your browser extension shortcuts page to assign commands.",
      "error"
    );
  }
});

documentationButton.addEventListener("click", async () => {
  try {
    await chrome.tabs.create({
      url: chrome.runtime.getURL("help.html")
    });
    window.close();
  } catch (_error) {
    showTransientMessage(
      "Could not open NotF11 help.",
      "error"
    );
  }
});

refresh().catch((error) => {
  showTransientMessage(error.message, "error");
});
