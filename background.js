console.log("Chromium Clean Window service worker started.");

chrome.action.onClicked.addListener((tab) => {
  console.log("Extension action clicked.");
  console.log("Active tab ID:", tab.id);
  console.log("Active window ID:", tab.windowId);
});

chrome.commands.onCommand.addListener(async (command) => {
  console.log("Keyboard command received:", command);

  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  const activeTab = tabs[0];

  if (!activeTab) {
    console.log("No active tab found.");
    return;
  }

  console.log("Active tab ID:", activeTab.id);
  console.log("Active window ID:", activeTab.windowId);
});
