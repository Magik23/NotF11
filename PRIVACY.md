# NotF11 Privacy Policy

**Last updated:** 2026-09-14

NotF11 is designed to do one narrow job:

> Move the current live Chromium tab between a normal browser source and a toolbar-free Clean window while preserving the browser relationship needed to return or hand off that tab safely.

NotF11 is intentionally local and does not require access to webpage contents.

---

# Data collection

NotF11 does **not** collect, sell, transmit, or monetize personal data.

NotF11 has:

- no analytics,
- no telemetry,
- no advertising,
- no tracking,
- no user account,
- no sign-in,
- no cloud backend,
- no remote database,
- no content script,
- no host permissions,
- no webpage-content collection.

NotF11 does not inspect or modify the contents of the websites you visit.

---

# Browser permission

The extension's explicit permission is:

```text
storage
```

NotF11 uses browser extension storage only for its own settings and browser-window relationship state.

Examples include:

## Persistent preferences

```text
Clean on launch
New tabs stay clean
Remember size & position
```

These preferences are stored locally so they survive browser restart.

## Runtime session state

NotF11 may retain temporary browser-session relationship information needed to understand active Clean windows, such as:

- tab identity,
- source-window association,
- source-family order,
- popup-window association,
- pinned state,
- temporary geometry information when size-and-position memory is enabled.

Runtime relationship data is about NotF11's own window/tab management. It is not a copy of webpage content.

---

# Page contents

NotF11 does not request host permissions and does not inject scripts into webpages.

It does not read:

- page text,
- form contents,
- passwords,
- cookies,
- browsing history,
- webpage DOM content,
- messages inside websites,
- account information from websites.

When NotF11 moves a tab, Chromium moves the existing live browsing context itself.

That is why the page can keep its state without NotF11 reading or recreating the page.

---

# Network communication

NotF11 does not need a remote service to perform its core function.

The extension does not send NotF11 usage data to Albenoir Studio, the developer, advertisers, analytics providers, or other third parties.

Websites inside your browser tabs can of course continue making their own normal network requests. NotF11 does not proxy or control those website requests.

---

# Keyboard shortcuts

NotF11 uses Chromium's extension command system for user-assigned shortcuts such as:

```text
Ctrl+Shift+F
Ctrl+Shift+,
Ctrl+Shift+.
```

The extension reads the shortcut assignments Chromium exposes so the popup can show the shortcuts that are actually assigned.

NotF11 does not record general keyboard activity.

---

# Window and tab metadata

NotF11 uses standard Chromium extension APIs to perform its function.

This can include browser-provided metadata required to:

- identify the current tab,
- move a live tab between windows,
- create or close browser windows,
- remember a source relationship,
- restore pinned state,
- cycle eligible tabs inside the same source family,
- preserve size and position when the user enables that setting.

This information is used locally for NotF11 behavior.

---

# Clean on launch

If **Clean on launch** is enabled, NotF11 may observe browser-window lifecycle events needed to determine when to apply the user's chosen startup behavior.

This does not require reading webpage content.

---

# New tabs stay clean

If **New tabs stay clean** is enabled, NotF11 observes browser tab creation events needed to preserve the Clean workflow and source-family relationship.

This does not require reading webpage content.

---

# Remember size & position

If **Remember size & position** is enabled, NotF11 may store or use browser-window bounds such as:

```text
left
top
width
height
```

for NotF11's own Raw / Clean transition behavior.

This is desktop window geometry, not geographic location.

If the setting is disabled, NotF11 is intended to leave placement to the operating system or window manager.

---

# Data retention

Persistent preferences remain in extension storage until they are changed, cleared, or the extension/browser profile removes that storage.

Runtime relationship state belongs to the current browser session and should not be treated as permanent user history.

Uninstalling the extension removes its extension-managed local storage according to Chromium's normal extension behavior.

---

# Third parties

NotF11 does not sell data to third parties.

NotF11 does not share browsing data with advertisers.

NotF11 does not use third-party analytics SDKs.

NotF11 does not require a third-party account.

---

# Open source

NotF11 is open source, so its runtime behavior and permission model can be inspected publicly:

https://github.com/Magik23/NotF11

---

# Contact

NotF11 is developed by Pierre Dionne through Albenoir Studio.

Project:
https://github.com/Magik23/NotF11

Studio:
https://albenoir.com

---

# Summary

NotF11's privacy model is intentionally simple:

```text
Live tabs.
Local state.
No page access.
No telemetry.
```
