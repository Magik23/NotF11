# NotF11

## Any browser tab, toolbar-free.

**Turn it into a clean, resizable window.**

NotF11 is a lightweight, open-source Chromium extension that turns the current browser tab into a clean desktop window—without the tab strip, address bar, bookmarks bar, navigation buttons, or extension controls.

It keeps the same live tab and page state while giving the page more room. The window remains movable, resizable, maximizable, and compatible with normal desktop window-management tools.

Not fullscreen. Not picture-in-picture. Not app mode. Just the page you were already using, with less browser clutter around it.

## Why NotF11?

F11 fullscreen removes the browser interface, but it also takes over the entire display.

NotF11 provides a middle ground: a toolbar-free browser view that still behaves like a regular desktop window.

That makes it useful for:

- ChatGPT and other AI tools
- Web apps and dashboards
- Documentation and reference pages
- Browser-based editors and productivity tools
- Video, media, and reading
- Focused layouts across multiple monitors
- Windows Snap Layouts and Microsoft PowerToys FancyZones

## Features

- Moves the existing live tab instead of reopening its URL
- Preserves scroll position, entered text, login sessions, and active page state
- Returns the tab to its remembered browser source and logical position, or creates a legitimate replacement source when needed
- Preserves pinned-tab state when returning home
- Can preserve the Clean window's desktop footprint when **Remember size & position** is enabled
- Supports multiple independent tracked clean windows
- Cycles through eligible Raw tabs from the same source family while remaining in the Clean-window workflow
- Handles source-window removal by recovering the live tab into a replacement normal browser window
- Recovers browser-restored orphan clean popups back into normal windows with `Ctrl+Shift+F`
- Uses standard Chromium extension APIs
- Requires no content scripts or webpage modification
- Includes no analytics, telemetry, ads, accounts, or external services

## Default shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+F` | Enter or exit the clean window |
| `Ctrl+Shift+,` | Switch to the previous browser tab |
| `Ctrl+Shift+.` | Switch to the next browser tab |

Shortcuts can be changed from the browser's extension-shortcut settings:

- Brave: `brave://extensions/shortcuts`
- Chrome: `chrome://extensions/shortcuts`

NotF11 is intentionally keyboard-driven.

Chromium may display the NotF11 icon in its Extensions menu or allow it to be pinned to the toolbar. Clicking the icon opens the NotF11 settings/help popup; keyboard shortcuts remain the primary Clean-window controls.


## Localization

NotF11 uses Chromium's native internationalization system. The v0.1.1 release includes English plus Spanish, French, Brazilian Portuguese, German, Italian, Dutch, Polish, Turkish, Japanese, Korean, Simplified Chinese, Traditional Chinese, Indonesian, and Vietnamese.

The popup, built-in Help page, manifest description, command descriptions, warnings, and user-visible errors are localized. English remains the fallback locale.

## How it works

When you enter clean-window mode, NotF11 records the active tab's source browser window, logical tab position, pinned state, and relevant window geometry.

It then moves that same live tab into a Chromium popup window.

When you exit, NotF11 moves the same tab back to its remembered source when that source still exists, restoring logical position and pinned state. If the source is gone, NotF11 creates a legitimate normal replacement instead of adopting an unrelated browser window.

Because the tab itself is moved—not recreated—the active webpage remains intact.

The previous and next commands hand the Clean role between eligible Raw tabs in the same source family.

### Browser restart behavior

NotF11 return tickets are valid only for the current browser session.

After a complete browser restart, Chromium may restore a previous clean popup without its original NotF11 return ticket. In that situation, pressing `Ctrl+Shift+F` converts the same restored live tab back into a normal browser window with the browser interface available again.

NotF11 does not attempt to guess the tab's previous source window or tab index across a full browser restart.

## Install from source

For development or manual installation, NotF11 can be loaded directly from the repository.

1. Clone or download this repository:

   ```powershell
   git clone https://github.com/Magik23/NotF11.git
   cd NotF11
