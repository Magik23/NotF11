# NotF11

## Any browser tab, toolbar-free.

**Turn it into a clean, resizable window.**

NotF11 is a lightweight, open-source Chromium extension that turns the current browser tab into a clean desktop window—without the tab strip, address bar, bookmarks bar, navigation buttons, or extension controls.

It keeps the same live tab and page state while giving the page more room. The window remains movable, resizable, maximizable, and compatible with normal desktop window-management tools.

Not fullscreen. Not picture-in-picture. Not app mode. Just the page you were already using, with less browser clutter around it.

## Why NotF11?

F11 fullscreen removes the browser interface, but it also takes over the entire display. NotF11 provides a middle ground: a toolbar-free browser view that still behaves like a regular desktop window.

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
- Returns the tab to its original browser window and tab position
- Preserves the clean window's current geometry while cycling between tabs
- Supports multiple tracked clean windows
- Cycles through tabs from the original browser window while remaining in clean-window mode
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

NotF11 is intentionally keyboard-driven and does not add a toolbar button.

## How it works

When you enter clean-window mode, NotF11 records the active tab's original window, tab position, and relevant window geometry. It then moves that live tab into a Chromium popup window.

When you exit, NotF11 moves the same tab back to its original browser window and position. Because the tab itself is moved—not recreated—the active webpage remains intact.

The previous and next commands let the clean window act as a focused viewport for tabs in the source browser window.

## Install from source

Until packaged releases and browser-store installation are available, NotF11 can be loaded directly from the repository.

1. Clone or download this repository:

   ```powershell
   git clone https://github.com/Magik23/NotF11.git
   cd NotF11
   ```

2. Open your browser's extension manager:

   - Brave: `brave://extensions`
   - Chrome: `chrome://extensions`

3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository folder containing `manifest.json`.

NotF11 currently uses plain Manifest V3 extension files and requires no build step.

## Privacy and permissions

NotF11 is intentionally small and auditable. It does not:

- Inject scripts into websites
- Read or modify webpage content
- Send browsing data anywhere
- Include analytics or telemetry
- Require an account or cloud service

Its browser access is limited to what is required to manage tabs, windows, keyboard commands, and its own clean-window session state.

## Compatibility

NotF11 is designed and tested primarily with:

- Brave Desktop
- Windows 11
- Microsoft PowerToys FancyZones

The underlying Manifest V3 APIs are also supported by Google Chrome and other Chromium-based browsers, although current validation has focused on Brave and Windows 11. Additional browser and operating-system testing is welcome.

## Current status

NotF11 is a functional pre-release. The core workflow has been implemented and validated:

- Entering and exiting clean-window mode
- Returning the live tab to its original window and index
- Preserving active page state
- Preserving clean-window geometry during previous/next tab handoffs
- Cycling through source-window tabs
- Managing multiple clean-window sessions
- Working inside a FancyZones desktop layout

The remaining path toward a stable release focuses on broader compatibility testing, recovery hardening, packaging, documentation, and browser-store preparation.

## Known behavior and limitations

- The operating system's title bar remains visible. This is intentional: it keeps the window movable, resizable, maximizable, and compatible with desktop window managers.
- Grouped tabs are not supported yet. NotF11 currently enters and cycles through ungrouped tabs only.
- Heavy web applications may briefly flash or redraw while Chromium moves the live tab between windows. The page is not reopened, and its active state is preserved.
- Window bounds may differ by a few pixels when a window touches a screen edge because Windows and Chromium can clamp edge geometry.
- Browser-reserved shortcuts or conflicts with other extensions may require changing the default key combinations.

## Technical documentation

The project's architecture, API investigation, implementation decisions, validation results, edge cases, and roadmap are maintained in:

[`docs/NOTF11_CANONICAL_AI_HANDOFF_V4.md`](docs/NOTF11_CANONICAL_AI_HANDOFF_V4.md)

## Contributing and support

Bug reports, compatibility results, and focused contributions are welcome.

- [Report an issue](https://github.com/Magik23/NotF11/issues)
- [View releases](https://github.com/Magik23/NotF11/releases)
- [Browse the source](https://github.com/Magik23/NotF11)

## Creator

NotF11 was created by [Pierre Dionne](https://github.com/Magik23) through [Albenoir Studio](https://albenoir.com).

## License

Released under the [MIT License](LICENSE).
