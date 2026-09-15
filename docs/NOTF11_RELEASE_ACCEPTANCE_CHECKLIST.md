# NotF11 — Unified Release Acceptance Checklist

**Purpose:** Real-browser acceptance testing for the unified NotF11 extension before packaging or Chrome Web Store submission.

**Rule:** Do not redesign architecture because a result merely looks unusual. First classify the issue as:

```text
tab identity
source-family relationship
Raw / Clean representation
geometry behavior
desktop placement
```

A spatial result is not automatically a lineage bug.

---

# 1. Test environment

Record before testing:

```text
Browser:
Browser version:
OS:
Window manager / compositor:
NotF11 version:
Commit:
Unpacked or store build:
```

Recommended coverage:

- Brave on Windows 11
- Chrome on Windows 11
- Brave on Linux / Hyprland
- at least one clean browser profile with no competing NotF11/Tile install

---

# 2. Installation / startup sanity

- [ ] Extension loads with no manifest error.
- [ ] Service worker starts with no immediate console error.
- [ ] Popup opens from the extension icon.
- [ ] New NotF11 icon appears correctly at 16 / 32 / 48 browser UI sizes.
- [ ] Popup uses the current cyan / graphite palette.
- [ ] Popup displays all three settings.
- [ ] Popup displays actual assigned shortcuts.
- [ ] Manage Shortcuts opens the Chromium shortcut page.
- [ ] `Saved.` feedback appears and clears after roughly 1.4 seconds.

---

# 3. Default settings

Fresh install / reset state:

- [ ] `Clean on launch = OFF`
- [ ] `New tabs stay clean = OFF`
- [ ] `Remember size & position = ON`

Changing any setting:

- [ ] persists after popup close/reopen.
- [ ] persists after browser restart.
- [ ] does not immediately move already-open windows.

---

# 4. Basic Raw → Clean → Raw

Start:

```text
Normal source
├─ A
├─ B
└─ C
```

Test B:

- [ ] Focus B.
- [ ] Press `Ctrl+Shift+F`.
- [ ] B becomes Clean.
- [ ] B is the same live tab / page state survives.
- [ ] A and C remain in the source.
- [ ] Press `Ctrl+Shift+F` again.
- [ ] B returns to the correct source family.
- [ ] B returns at a sensible logical position.
- [ ] No unrelated browser window is involved.

---

# 5. Live-page preservation

Before toggling Clean, put visible state into the page:

- [ ] scroll to a distinctive position.
- [ ] enter text in a field.
- [ ] navigate within a web app if appropriate.

Then toggle Raw ↔ Clean:

- [ ] scroll position survives where Chromium permits.
- [ ] entered text survives.
- [ ] login/session survives.
- [ ] page is not recreated from its URL.

---

# 6. Lone-tab source

Start:

```text
Normal source
└─ A
```

- [ ] Toggle A Clean.
- [ ] A stays the same live tab.
- [ ] The old normal source may disappear without corrupting the session.
- [ ] Toggle A Raw.
- [ ] A safely becomes Raw in a legitimate normal replacement.
- [ ] No unrelated normal window is adopted.

---

# 7. Lone Clean + Ctrl+T — New Tabs Stay Clean OFF

State:

```text
A Clean
original one-tab source gone
New tabs stay clean = OFF
```

Action:

```text
Ctrl+T
```

Expected:

- [ ] A remains Clean.
- [ ] B becomes Raw.
- [ ] B belongs to A's logical family.
- [ ] B becomes the legitimate replacement normal source.
- [ ] If unrelated `X | Y` exists, X and Y remain untouched.

Then:

- [ ] Toggle A Raw.
- [ ] A rejoins B's normal source family.
- [ ] A does not land in unrelated X | Y.

**Release-critical.**

---

# 8. Clean parent + Ctrl+T — source alive, setting OFF

State:

```text
Source family alive
A Clean
B Raw
New tabs stay clean = OFF
```

- [ ] Ctrl+T from A creates C.
- [ ] A remains Clean.
- [ ] C is Raw.
- [ ] C belongs to A's source family.
- [ ] Previous / Next can later reach C.

---

# 9. Clean parent + Ctrl+T — setting ON

State:

```text
A Clean
New tabs stay clean = ON
```

- [ ] Ctrl+T creates B.
- [ ] A remains Clean.
- [ ] B becomes Clean.
- [ ] B inherits A's source family.
- [ ] No parent displacement occurs.

---

# 10. Raw parent + Ctrl+T while setting ON

State:

```text
A Raw
New tabs stay clean = ON
```

- [ ] Ctrl+T behaves like ordinary Chromium.
- [ ] B remains Raw.
- [ ] No Clean conversion occurs merely because the setting is ON.

---

# 11. Previous / Next handoff

State:

```text
Family X
├─ A → Clean
├─ B → Raw
└─ C → Raw
```

- [ ] Next from A selects B.
- [ ] A returns Raw.
- [ ] B becomes Clean.
- [ ] Next continues through eligible Raw members in logical order.
- [ ] Previous works in the opposite direction.
- [ ] Handoff preserves live page state.

---

# 12. Already-Clean members are skipped

State:

```text
Family X
├─ A → Clean
├─ B → Raw
├─ C → Clean
└─ D → Clean
```

- [ ] Cycling from D can select B.
- [ ] A and C are not casually stolen out of their existing Clean windows.

Return C Raw:

- [ ] C immediately becomes eligible again.

---

# 13. Independent source-family isolation

Create:

```text
Family X
├─ A
├─ B
└─ C

Family Y
├─ D
├─ E
└─ F
```

- [ ] Create at least one Clean member from X.
- [ ] Create at least one Clean member from Y.
- [ ] Previous / Next from X never enters Y.
- [ ] Previous / Next from Y never enters X.
- [ ] Focus changes between families do not merge them.

**Release-critical.**

---

# 14. Command target stress

Create:

```text
A Clean
B Clean
```

Repeat:

```text
focus A → Toggle
focus B → Toggle
```

- [ ] Command always acts on the tab associated with the keyboard event.
- [ ] No A/B substitution.
- [ ] Rapid focus changes do not target the previously focused Clean window.

Repeat similar stress with:

- [ ] Previous
- [ ] Next

**Release-critical.**

---

# 15. Explicit target disappearance

Trigger a command and close/remove the target as aggressively as practical.

- [ ] NotF11 does not silently fall through to an unrelated focused tab.
- [ ] Failure is safe.
- [ ] No unrelated family is mutated.

---

# 16. Source disappearance with unrelated window present

State:

```text
A Clean
A's remembered source closed

Unrelated normal window:
├─ X
└─ Y
```

- [ ] Toggle A Raw.
- [ ] NotF11 creates a legitimate normal replacement.
- [ ] A becomes Raw there.
- [ ] X | Y remains unrelated.

**Release-critical.**

---

# 17. Geometry ON — Windows

Set:

```text
Remember size & position = ON
```

Test:

- [ ] Raw → Clean requests approximately the same desktop footprint.
- [ ] Clean → Raw preserves the intended footprint where Windows/Chromium allows.
- [ ] Repeated toggles do not accumulate obvious drift.
- [ ] Edge-touching windows remain within acceptable Chromium/Windows clamping behavior.
- [ ] Multiple-monitor geometry remains sensible.
- [ ] Previous / Next keeps the current Clean footprint when handing off the Clean role.

---

# 18. Geometry OFF

Set:

```text
Remember size & position = OFF
```

Expected:

- [ ] Raw → Clean does not force old `left`.
- [ ] Raw → Clean does not force old `top`.
- [ ] Raw → Clean does not force old `width`.
- [ ] Raw → Clean does not force old `height`.
- [ ] No later geometry reapply overrides the desktop environment.
- [ ] Clean → Raw does not use stale footprint data as placement policy.
- [ ] Source-family behavior remains identical to geometry ON.

On Hyprland:

- [ ] compositor chooses tiling position.
- [ ] NotF11 does not fight Dwindle placement.
- [ ] reflow is treated separately from relationship correctness.

**Release-critical for unified OG + Tile consolidation.**

---

# 19. Change geometry setting mid-session

Create Clean A.

Switch:

```text
ON → OFF
```

- [ ] A is not immediately yanked to a new position.
- [ ] Next transition uses OFF semantics.

Switch:

```text
OFF → ON
```

- [ ] current windows are not instantly rearranged.
- [ ] next relevant transition uses ON semantics.

---

# 20. Clean on launch OFF

- [ ] Close and reopen the browser normally.
- [ ] Browser launches normally.
- [ ] No surprise Clean conversion occurs.

---

# 21. Clean on launch ON

- [ ] Enable the setting.
- [ ] Fully exercise real browser close / reopen behavior.
- [ ] First eligible browser surface becomes Clean.
- [ ] Restored sessions do not explode into many Clean windows.
- [ ] Startup does not depend on page-load completion.
- [ ] Browser already running with no visible windows behaves safely.

---

# 22. Shortcut safety

Unassign the main Toggle shortcut.

- [ ] Popup detects the real missing assignment.
- [ ] Clean on launch is disabled or cannot be unsafely re-enabled.
- [ ] User receives a clear warning / recovery explanation.
- [ ] Reassign Toggle.
- [ ] Clean on launch can be enabled again.

---

# 23. Grouped-tab guard

Create a native Chromium tab group.

- [ ] Attempting Clean on a grouped tab is safely blocked.
- [ ] Group membership is not silently corrupted.
- [ ] Popup explains grouped-tab limitation.

---

# 24. Pinned tabs

- [ ] Pin A.
- [ ] Toggle A Clean.
- [ ] Toggle A Raw.
- [ ] A returns pinned.
- [ ] A remains within Chromium's pinned region.
- [ ] Logical family order remains coherent.

---

# 25. Multiple simultaneous Clean windows

- [ ] Create multiple Clean tabs from one family.
- [ ] Create Clean tabs from another family.
- [ ] Close one manually.
- [ ] Only that Clean session is removed.
- [ ] Other Clean windows remain functional.
- [ ] Previous / Next candidate eligibility updates correctly.

---

# 26. Untracked popup recovery

Create or simulate an untracked popup where practical.

- [ ] Popup can recover to a normal browser surface.
- [ ] Same live tab survives.
- [ ] No unrelated normal window is adopted.
- [ ] Recovery is visible and understandable.

---

# 27. Service-worker lifecycle

With active Clean sessions:

- [ ] allow / force MV3 worker suspension where practical.
- [ ] reload the extension during development.
- [ ] active valid session state survives within the browser session where intended.
- [ ] Toggle / Previous / Next continue functioning.

---

# 28. Full browser restart

With Clean windows present:

- [ ] fully terminate Chromium/Brave.
- [ ] restart with session restoration.
- [ ] stale runtime IDs are not treated as valid source relationships.
- [ ] restored untracked popup can be recovered safely.
- [ ] no old source window is guessed incorrectly.

---

# 29. Popup UI

- [ ] Current state text is accurate.
- [ ] Clean session count is accurate.
- [ ] Toggle button label matches Raw / Clean / recovery state.
- [ ] Grouped-tab state disables the unsafe action.
- [ ] Cyan focus rings are visible.
- [ ] Toggle ON state is clearly distinguishable.
- [ ] Warning red remains visually distinct from cyan branding.
- [ ] Popup does not jump noticeably when transient messages appear.

---

# 30. Privacy / permission audit

Manifest:

- [ ] Manifest V3.
- [ ] only intended permission(s) remain.
- [ ] no host permissions.
- [ ] no content scripts.
- [ ] no scripting permission.
- [ ] no browsing-history permission.
- [ ] no clipboard permission.
- [ ] no native messaging.
- [ ] no external network service.
- [ ] no analytics / telemetry code.

Documentation:

- [ ] `PRIVACY.md` matches runtime behavior.
- [ ] extension/store copy does not claim page-content access.
- [ ] public copy accurately describes local state.

---

# 31. Release packaging

Before ZIP:

- [ ] `git status` is clean.
- [ ] manifest version is correct.
- [ ] icons are current.
- [ ] popup CSS is current cyan production version.
- [ ] README / docs describe the unified app, not separate Tile behavior.
- [ ] no experimental debug files are packaged.
- [ ] no old Tile branding is accidentally included.
- [ ] no `_lo` icon comparison files are included.
- [ ] release ZIP contains `manifest.json` at its root.

---

# 32. Final smoke test from exact release package

Load the **exact folder/ZIP contents that will be released**.

Run:

- [ ] popup opens.
- [ ] Toggle works.
- [ ] Previous works.
- [ ] Next works.
- [ ] new-tab OFF works.
- [ ] new-tab ON works.
- [ ] geometry ON works.
- [ ] geometry OFF works.
- [ ] source-missing recovery works.
- [ ] shortcut warning works.

Only after this should the package be tagged / uploaded.

---

# 33. Release gate

Do not ship if any of these fail:

```text
wrong command target
cross-family Previous / Next
unrelated-window source adoption
Clean parent kicked Raw by Ctrl+T
geometry applied while OFF
unsafe Clean-on-launch without Toggle shortcut
live tab lost during recovery
grouped tab silently corrupted
```

Visual compositor reflow by itself is **not** a release blocker if family and command semantics remain correct.
