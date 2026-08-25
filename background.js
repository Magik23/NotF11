console.log("Chromium Clean Window service worker started.");

chrome.action.onClicked.addListener((tab) => {
  console.log("Extension action clicked.");
  console.log("Active tab ID:", tab.id);
  console.log("Active window ID:", tab.windowId);
});
