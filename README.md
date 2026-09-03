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
- Returns the tab to its original browser window and logical tab position
- Preserves pinned-tab state when returning home
- Preserves the clean window's current geometry while cycling between tabs
- Supports multiple independent tracked clean windows
- Cycles through eligible tabs from the original browser window while remaining in clean-window mode
- Handles source-window removal by recovering the live tab into a replacement normal browser window
- Recovers browser-restored orphan clean popups back into normal windows with `Ctrl+Shift+F`
- Uses standard Chromium extension APIs
- Requires no content scripts or webpage modification
- Includes no analytics, telemetry, ads, accounts, or external services
- Lets you enter clean-window mode by clicking the toolbar icon

## Default shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+F` | Enter or exit the clean window |
| `Ctrl+Shift+,` | Switch to the previous browser tab |
| `Ctrl+Shift+.` | Switch to the next browser tab |

Shortcuts can be changed from the browser's extension-shortcut settings:

- Brave: `brave://extensions/shortcuts`
- Chrome: `chrome://extensions/shortcuts`

Click the NotF11 toolbar icon to enter clean-window mode. Keyboard shortcuts remain available for entering, exiting, and switching tabs.

## How it works

When you enter clean-window mode, NotF11 records the active tab's source browser window, logical tab position, pinned state, and relevant window geometry.

It then moves that same live tab into a Chromium popup window.

When you exit, NotF11 moves the same tab back to its source browser window and restores its logical position and pinned state.

Because the tab itself is moved—not recreated—the active webpage remains intact.

The previous and next commands let the clean window act as a focused viewport for eligible tabs in the source browser window.

### Browser restart behavior

NotF11 return tickets are valid only for the current browser session.

After a complete browser restart, Chromium may restore a previous clean popup without its original NotF11 return ticket. In that situation, pressing `Ctrl+Shift+F` converts the same restored live tab back into a normal browser window with the browser interface available again.

NotF11 does not attempt to guess the tab's previous source window or tab index across a full browser restart.

## Install from source

Until packaged releases and browser-store installation are available, NotF11 can be loaded directly from the repository.

1. Clone or download this repository:

   ```powershell
   git clone https://github.com/Magik23/NotF11.git
   cd NotF11
