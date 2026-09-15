const cleanOnLaunch = document.querySelector("#clean-on-launch");
const newTabsStayClean = document.querySelector("#new-tabs-stay-clean");
const rememberWindowGeometry = document.querySelector("#remember-window-geometry");
const toggleButton = document.querySelector("#toggle-button");
const toggleLabel = document.querySelector("#toggle-label");
const statusText = document.querySelector("#status-text");
const sessionCount = document.querySelector("#session-count");
const message = document.querySelector("#message");
const shortcutWarning = document.querySelector("#shortcut-warning");
const manageShortcutsButton = document.querySelector("#manage-shortcuts");
const documentationButton = document.querySelector("#open-documentation");
const primaryShortcut = document.querySelector("#shortcut-toggle-primary");

let messageTimer = null;

const shortcutElements = {
  "toggle-clean-window": document.querySelector("#shortcut-toggle"),
  "next-clean-tab": document.querySelector("#shortcut-next"),
  "previous-clean-tab": document.querySelector("#shortcut-previous")
};

function setMessage(text = "", isError = false, autoClearMs = 0) {
  if (messageTimer !== null) {
    clearTimeout(messageTimer);
    messageTimer = null;
  }

  message.textContent = text;
  message.classList.toggle("message--error", isError);

  if (text && !isError && autoClearMs > 0) {
    messageTimer = setTimeout(() => {
      message.textContent = "";
      message.classList.remove("message--error");
      messageTimer = null;
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

  let missingCount = 0;

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
      missingCount += 1;
    }
  }

  shortcutWarning.textContent = missingCount
    ? `${missingCount} keyboard shortcut${missingCount === 1 ? " is" : "s are"} unassigned.`
    : "";
}

function renderState(state) {
  cleanOnLaunch.checked = Boolean(state.settings.cleanOnLaunch);
  newTabsStayClean.checked = Boolean(state.settings.newTabsStayClean);
  rememberWindowGeometry.checked = Boolean(
    state.settings.rememberWindowGeometry
  );

  const count = Number(state.cleanSessionCount) || 0;
  sessionCount.textContent = count > 0 ? `${count} clean` : "";

  if (state.grouped) {
    statusText.textContent = "Grouped tabs stay in Chromium";
    toggleLabel.textContent = "Grouped tab unsupported";
    toggleButton.disabled = true;
    return;
  }

  toggleButton.disabled = false;

  if (state.mode === "clean") {
    statusText.textContent = "Current tab is clean";
    toggleLabel.textContent = "Return current tab";
  } else if (state.mode === "popup") {
    statusText.textContent = "Untracked popup can be recovered";
    toggleLabel.textContent = "Recover normal browser";
  } else {
    statusText.textContent = state.settings.rememberWindowGeometry
      ? "Size & position memory is on"
      : "Window manager controls placement";
    toggleLabel.textContent = "Open current tab clean";
  }
}

async function refresh() {
  const tabId = await getCurrentContextTabId();
  const [response] = await Promise.all([
    send({ type: "get-popup-state", tabId }),
    refreshShortcuts()
  ]);

  renderState(response.state);

  if (response.state.recoveryNotice?.type === "clean-on-launch-disabled") {
    setMessage(
      "Clean on launch was turned off because Toggle clean mode is unassigned. Assign it, then re-enable Clean on launch if you want."
    );
  }
}

async function changeSetting(key, value, input) {
  input.disabled = true;
  setMessage();

  try {
    const response = await send({
      type: "set-setting",
      key,
      value
    });

    input.checked = Boolean(response.settings[key]);
    setMessage("Saved.", false, 1400);
  } catch (error) {
    input.checked = !value;
    setMessage(error.message, true);
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
  setMessage();

  try {
    const tabId = await getCurrentContextTabId();
    await send({ type: "toggle-focused", tabId });
    window.close();
  } catch (error) {
    setMessage(error.message, true);
    toggleButton.disabled = false;
  }
});

manageShortcutsButton.addEventListener("click", async () => {
  setMessage();

  try {
    await chrome.tabs.create({
      url: "chrome://extensions/shortcuts"
    });
    window.close();
  } catch (error) {
    setMessage(
      "Open your browser extension shortcuts page to assign commands.",
      true
    );
  }
});

documentationButton.addEventListener("click", async () => {
  setMessage();

  try {
    await chrome.tabs.create({
      url: chrome.runtime.getURL("help.html")
    });
    window.close();
  } catch (error) {
    setMessage(
      "Could not open NotF11 help.",
      true
    );
  }
});

refresh().catch((error) => {
  setMessage(error.message, true);
});
