# NotF11

## Any browser tab, toolbar-free.

**Turn the tab you already have open into a clean desktop window — without reopening the page.**

NotF11 moves the current live Chromium tab into a clean popup-style window with the browser chrome removed:

- no tab strip,
- no address bar,
- no bookmarks bar,
- no navigation buttons,
- no extension toolbar.

What remains is the same live page in a normal desktop window that can still be moved, resized, maximized, snapped, tiled, or arranged alongside other applications.

Unlike F11 fullscreen, NotF11 does not take over the entire display.

**One shortcut in. The same shortcut out.**

---

# The same live tab, with more room

Press:

```text
Ctrl+Shift+F
```

and NotF11 moves the current live tab into a Clean window.

Press it again and the same live tab returns to a normal browser source.

NotF11 moves the existing Chromium tab rather than rebuilding the page from its URL, so browser and page state can remain with it, including where Chromium permits:

- scroll position,
- entered text,
- login/session state,
- navigation history,
- in-page progress,
- active web-app state.

NotF11 does **not** create a duplicate copy of the page.

---

# Clean, but still a real desktop window

NotF11 removes browser chrome, not the operating system's window management.

A Clean window remains:

- movable,
- resizable,
- maximizable,
- compatible with Windows Snap,
- compatible with tools such as Microsoft PowerToys FancyZones,
- usable across multiple monitors,
- compatible with compositor-managed tiling workflows.

This gives the page more room without forcing fullscreen.

---

# Three simple settings

Click the NotF11 extension icon to open the compact control panel.

## Clean on launch

**Default: Off**

When enabled, NotF11 can start the first eligible browser surface in Clean mode.

NotF11 checks that the Clean/Raw toggle shortcut is actually assigned before allowing this feature to create an unsafe recovery situation.

## New tabs stay clean

**Default: Off**

When a new tab is created from a Clean NotF11 workflow:

- Off → the new tab remains Raw in the same logical source family.
- On → the new tab becomes another Clean window in that same family.

This setting applies to tabs created from a Clean workflow. Ordinary Ctrl+T behavior from a normal browser window remains ordinary Chromium behavior.

## Remember size & position

**Default: On**

When enabled, NotF11 asks Chromium to preserve the previous desktop footprint when moving between Raw and Clean surfaces.

Turn it off when you prefer the operating system, tiling window manager, or compositor to decide placement completely.

Typical examples:

```text
Windows / ordinary desktop workflow → On
Hyprland / compositor-owned tiling   → Off
```

The setting affects future transitions. Changing it does not intentionally rearrange windows that are already open.

---

# Default shortcuts

```text
Ctrl+Shift+F  — Enter or exit Clean mode
Ctrl+Shift+,  — Previous eligible source tab
Ctrl+Shift+.  — Next eligible source tab
```

The Previous / Next commands are not global browser-tab cycling.

They hand the Clean role to another eligible Raw tab from the same remembered source family.

Shortcuts can be changed from the browser's extension-shortcut settings:

- Brave: `brave://extensions/shortcuts`
- Chrome: `chrome://extensions/shortcuts`

The popup displays the shortcuts that Chromium actually assigned.

---

# Source families

A core NotF11 rule is:

> **Clean changes the surface, not the family.**

When a tab moves from a normal browser window into a Clean window, NotF11 remembers the logical browser relationship it came from.

Example:

```text
Source family
├─ A → Clean
├─ B → Raw
└─ C → Raw
```

Previous / Next can hand the Clean role between eligible Raw members of that same family.

If another family exists in another browser window, NotF11 should not cross into it.

---

# Multiple Clean windows

NotF11 can track multiple Clean windows at the same time.

A family can contain a mixture of Raw and Clean members:

```text
Family X
├─ A → Clean
├─ B → Raw
├─ C → Clean
└─ D → Raw
```

Tabs that are already Clean are normally skipped during Previous / Next handoff because they already occupy their own Clean surfaces.

---

# New tabs from a Clean window

New tabs created from a Clean workflow preserve family lineage.

With **New tabs stay clean = Off**:

```text
A Clean
  └─ creates B

A remains Clean
B joins A's family as Raw
```

With **New tabs stay clean = On**:

```text
A Clean
  └─ creates B

A remains Clean
B joins A's family as Clean
```

The setting changes the child's initial representation, not its logical ancestry.

---

# One-tab source recovery

A normal browser window can naturally disappear when its only tab is moved into a Clean popup.

That is not automatically an error.

Example:

```text
Normal source
└─ A

A → Clean

original normal source disappears
```

If a new Raw tab is later created from A's Clean workflow, that new tab can become the legitimate replacement source for the family.

NotF11 does **not** adopt an unrelated browser window merely because one exists.

---

# Recovery behavior

NotF11 includes recovery behavior for browser-window lifecycle changes.

## If the remembered source still exists

The same live tab returns to that normal browser source.

## If the remembered source is gone

NotF11 creates a real normal replacement and moves the live tab there.

It should not silently attach the tab to an unrelated browser window.

## If a Clean popup is manually closed

The associated runtime Clean session is cleaned up.

## If the Manifest V3 service worker restarts

Runtime relationship state is stored for the current browser session so valid Clean sessions can continue after ordinary service-worker suspension/reload.

## After a complete browser restart

Runtime tab/window IDs are session-specific.

If Chromium restores an old popup without a current NotF11 relationship record, the popup can be recovered safely into a normal browser surface rather than guessing an old source relationship.

---

# Pinned tabs

Pinned tabs are supported where the current NotF11 relationship model can restore them safely.

When a pinned tab enters Clean mode, NotF11 remembers its pinned state and restores it when returning to its normal source.

Native Chromium **tab groups are intentionally not supported** at this time because repeatedly detaching grouped tabs can damage or lose group semantics.

---

# Windows, FancyZones, and tiling window managers

NotF11 is one Chromium extension with two placement styles.

## Windows-style footprint preservation

With:

```text
Remember size & position = On
```

NotF11 requests the previous window footprint so Raw ↔ Clean can feel like the same page transformed in place.

Windows or Chromium may still clamp bounds slightly at screen edges.

## Hyprland and compositor-owned placement

With:

```text
Remember size & position = Off
```

NotF11 does not try to own placement.

The extension manages:

- the live tab,
- Raw / Clean representation,
- source-family relationships,
- Previous / Next handoff.

The compositor manages:

- tiling,
- workspace placement,
- scratchpad,
- grouping,
- physical topology.

An advanced Hyprland workflow is to keep a normal source browser in scratchpad and use Clean windows as workspace surfaces.

NotF11 does not require Hyprland, FancyZones, or any native helper.

---

# Built for pages that deserve their own space

NotF11 works especially well with:

- ChatGPT and other AI tools,
- web apps and dashboards,
- documentation and reference pages,
- browser-based editors,
- productivity tools,
- video and media,
- reading,
- monitoring pages,
- any website you want to treat more like a desktop application.

---

# Small, focused, and private

NotF11 does not inject scripts into websites and does not read or modify webpage content.

It has:

- no analytics,
- no telemetry,
- no ads,
- no tracking,
- no account requirement,
- no cloud service,
- no host permissions,
- no content scripts,
- no webpage-content collection.

The extension's explicit permission remains:

```text
storage
```

Storage is used for NotF11's own settings and relationship/session state.

Window, tab, keyboard-command, and popup behavior use standard Chromium extension APIs.

See [`PRIVACY.md`](../PRIVACY.md) for the repository privacy policy.

---

# Compatibility

NotF11 uses Chromium Manifest V3 APIs.

The product has been developed and tested around:

- Brave Desktop,
- Google Chrome,
- Windows 11,
- Windows Snap,
- Microsoft PowerToys FancyZones,
- Linux / Hyprland workflows developed through the former NotF11 Tile branch of the project,
- multiple normal browser windows,
- multiple simultaneous Clean windows.

Other Chromium-based desktop browsers that expose the same APIs may work as well.

The unified release should always be re-tested against the current acceptance checklist before publication.

---

# Known behavior and limitations

- The operating system's title bar remains visible. This is intentional.
- Chromium cannot perfectly mutate a normal browser window into a popup in place; Raw ↔ Clean can involve top-level window replacement.
- Tiling window managers can visibly reflow when Chromium creates or removes top-level windows.
- Native Chromium tab groups are not currently supported.
- Heavy web applications may briefly redraw while Chromium moves the live tab between windows.
- Windows and Chromium can clamp requested geometry by a few pixels at display edges.
- Browser-reserved shortcuts or conflicts with other extensions can leave suggested shortcuts unassigned.
- `Remember size & position = Off` intentionally leaves placement to the desktop environment.
- Unexpected physical placement does not automatically mean the source-family relationship is wrong.

---

# What NotF11 is not

- **Not fullscreen:** it does not take over the entire display.
- **Not picture-in-picture:** it works with ordinary webpages, not only video.
- **Not app mode:** no separate site installation is required.
- **Not a duplicate page:** it keeps the live tab you already have open.
- **Not a webpage modification:** it does not inject UI or scripts into the site.
- **Not a window manager:** it does not own your entire desktop layout.
- **Not a workspace router:** it does not choose Hyprland workspaces.
- **Not a FancyZones plugin:** FancyZones is optional.

---

# Open source

NotF11 is open source.

- [Source code](https://github.com/Magik23/NotF11)
- [Report an issue](https://github.com/Magik23/NotF11/issues)
- [Releases](https://github.com/Magik23/NotF11/releases)

Created by [Pierre Dionne](https://github.com/Magik23) through [Albenoir Studio](https://albenoir.com).

Released under the MIT License.

---

Open the page you want.

Press:

```text
Ctrl+Shift+F
```

Keep the page. Lose the browser clutter.

**NotF11 — Any browser tab, toolbar-free.**
