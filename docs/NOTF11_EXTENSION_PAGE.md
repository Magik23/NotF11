# NotF11

## Any browser tab, toolbar-free.

**Turn it into a clean, resizable window.**

NotF11 removes the browser interface around your current tab—no tab strip, address bar, bookmarks bar, navigation buttons, or extension controls.

What remains is the same live page inside a clean desktop window you can move, resize, maximize, snap, and arrange alongside your other applications.

Unlike F11 fullscreen, NotF11 does not take over your entire display.

**One shortcut in. The same shortcut out.**

## The same live tab, with more room

Press `Ctrl+Shift+F` and NotF11 moves the current live tab into a clean Chromium window.

Press it again and the same tab returns to its source browser window.

Because NotF11 moves the existing tab instead of reopening its URL, active page state stays with it—including:

- Scroll position
- Entered text
- Login sessions
- In-page progress
- Active web-app state

NotF11 does not recreate the page.

## Toolbar-free, still a real desktop window

NotF11 removes the browser controls, not the operating system's window frame.

The clean window remains:

- Movable
- Resizable
- Maximizable
- Compatible with Windows Snap
- Compatible with Microsoft PowerToys FancyZones
- Usable across multiple monitors

This gives the page more room without locking you into fullscreen.

## Built for pages that deserve their own space

NotF11 works especially well with:

- ChatGPT and other AI tools
- Web apps and dashboards
- Documentation and reference pages
- Browser-based editors and productivity tools
- Video, media, and reading
- Any website you want to treat more like a desktop application

## Default shortcuts

- `Ctrl+Shift+F` — Enter or exit the clean window
- `Ctrl+Shift+,` — Switch to the previous eligible browser tab
- `Ctrl+Shift+.` — Switch to the next eligible browser tab

The previous and next shortcuts allow the clean window to behave like a focused viewport over tabs in its source browser window.

Shortcuts can be changed from the browser's extension-shortcut settings:

- Brave: `brave://extensions/shortcuts`
- Chrome: `chrome://extensions/shortcuts`

NotF11 is intentionally keyboard-driven.

Chromium may display the NotF11 icon in its Extensions menu or allow the icon to be pinned to the browser toolbar. The icon currently has no click action; the keyboard shortcuts are the controls for NotF11.

## Multiple clean windows

NotF11 can track multiple independent clean windows at the same time.

Each clean tab keeps its own return information, including its source browser window and logical tab position.

Tabs already detached into other clean windows are skipped while cycling through the remaining source tabs.

## Pinned tabs

Browser-pinned tabs are supported.

If a pinned tab enters clean mode, NotF11 remembers its pinned state and restores it when the tab returns to its source browser window.

Logical placement is reconstructed against the current tab strip, so the tab remains inside Chromium's pinned-tab region even if the source window changes while the tab is away.

## Recovery behavior

NotF11 includes recovery behavior for several browser-window lifecycle situations.

### If the source browser window is closed

If a clean tab's original source browser window disappears while the browser is still running, NotF11 preserves the live tab and recovers it into a replacement normal browser window when it returns from clean mode.

Sibling clean tabs that belonged to the same missing source are redirected to that replacement window.

### If a clean popup is manually closed

The corresponding stored NotF11 session is automatically removed.

### If the extension service worker reloads

Valid live clean-window sessions are stored locally and can continue operating after the Manifest V3 service worker restarts or the unpacked extension is reloaded.

### After a complete browser restart

Return tickets from the previous browser session are intentionally discarded because Chromium tab and window IDs belong to the browser session in which they were created.

Chromium may still restore a previous clean popup.

If that happens, press:

`Ctrl+Shift+F`

NotF11 will move the same restored live tab into a normal browser window so the address bar and browser controls are available again.

NotF11 does not attempt to guess the tab's previous source window or tab index across a complete browser restart.

## Small, focused, and private

NotF11 does not inject scripts into websites or read or modify webpage content.

It has:

- No analytics or telemetry
- No ads or tracking
- No account or sign-in
- No cloud service
- No host permissions
- No content scripts
- No webpage-content collection

The extension currently requests only the `storage` permission, which is used for NotF11's own clean-window session state.

Window, tab, keyboard-command, and extension-icon behavior use standard Chromium extension APIs.

## Compatibility

NotF11 has been tested with:

- Brave Desktop on Windows 11
- Google Chrome on Windows 11

Its window-management workflow has also been extensively tested with:

- Microsoft PowerToys FancyZones
- Windows desktop snapping
- Multiple browser windows
- Multiple clean windows

NotF11 uses standard Chromium Manifest V3 APIs and is expected to work with other Chromium-based desktop browsers that provide the same APIs.

Additional browser and operating-system testing is welcome.

## Known behavior and limitations

- The operating system's title bar remains visible. This is intentional so the window remains movable, resizable, maximizable, and compatible with normal desktop window-management tools.
- Native Chromium tab groups are not currently supported.
- Heavy web applications may briefly flash or redraw while Chromium moves the live tab between windows. The page itself is not reopened.
- Windows and Chromium may clamp window geometry by a few pixels when a window touches a display edge.
- After a complete browser restart, a restored clean popup no longer knows its previous source relationship. `Ctrl+Shift+F` safely recovers it into a normal browser window instead.
- Browser-reserved shortcuts or conflicts with other extensions may require changing the default shortcuts.
- The extension icon has no click action. The current NotF11 interface is intentionally keyboard-driven.

## What NotF11 is not

- **Not fullscreen:** it does not occupy or take over the entire display.
- **Not picture-in-picture:** it works with regular webpages, not only video.
- **Not app mode:** no special site installation or separate launch command is required.
- **Not a duplicate page:** it keeps the live tab you already have open.
- **Not a webpage modification:** it does not inject UI or scripts into the site.

## Open source

NotF11 is open source.

- [Source code](https://github.com/Magik23/NotF11)
- [Report an issue](https://github.com/Magik23/NotF11/issues)
- [Releases](https://github.com/Magik23/NotF11/releases)

Created by [Pierre Dionne](https://github.com/Magik23) through [Albenoir Studio](https://albenoir.com).

Released under the MIT License.

---

Open the page you want.

Press `Ctrl+Shift+F`.

Keep the page. Lose the browser clutter.

**NotF11 — Any browser tab, toolbar-free.**
