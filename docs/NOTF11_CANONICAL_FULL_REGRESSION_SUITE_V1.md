# NotF11 — Canonical Full Regression Suite

**Project:** NotF11  
**Tagline:** *Any browser tab, toolbar-free.*  
**Purpose:** Long-term, production-grade regression checklist for every meaningful NotF11 release.  
**Status:** Canonical full regression suite  
**Scope:** Brave / Chrome, Windows / Hyprland, unified NotF11 architecture  
**Core invariant:** **Clean changes the surface, not the family.**  
**Placement rule:** **NotF11 owns browser relationships. The OS/window manager owns placement unless `Remember size & position` is enabled.**

---

# How to use this suite

This is the **full regression suite**. It is intentionally broader than the short pre-release smoke test.

Run the entire suite when:

- shipping a meaningful NotF11 update,
- changing `background.js`,
- changing source-family logic,
- changing new-tab behavior,
- changing Previous / Next behavior,
- changing recovery behavior,
- changing startup behavior,
- changing geometry behavior,
- consolidating platform behavior,
- or after fixing a regression in a release-critical area.

For a tiny UI-only change, a shorter smoke test may be enough during development, but the **exact release package must still receive the final smoke test in Step 30**.

If a result looks strange, classify it before changing code:

```text
1. Tab identity
2. Source-family relationship
3. Raw / Clean representation
4. Geometry behavior
5. Desktop placement
```

A spatial oddity is **not automatically a lineage bug**.

---

# Release-blocking failures

**Do not ship** if any of these occur:

```text
❌ Wrong command target
❌ Previous / Next crosses source families
❌ Missing source adopts an unrelated browser window
❌ Clean parent is kicked Raw by Ctrl+T
❌ Geometry is applied while Remember size & position = OFF
❌ Clean on launch can trap the user without Toggle assigned
❌ Live tab is lost during recovery
❌ Grouped tab is silently corrupted
```

Visual compositor reflow alone is **not** a release blocker if family, command, and representation semantics remain correct.

---

# Recommended coverage matrix

At minimum, record:

```text
Release version:
Commit:
Release candidate path:
Date:

Brave / Windows 11:
Chrome / Windows 11:
Brave / Linux / Hyprland:
```

Recommended final settings for ordinary Windows validation:

```text
Clean on launch          OFF
New tabs stay clean      OFF
Remember size & position ON
```

Recommended Hyprland validation:

```text
Clean on launch          OFF
New tabs stay clean      OFF
Remember size & position OFF
```

Use a clean browser profile where practical and ensure no old NotF11 / NotF11 Tile build is simultaneously responding to shortcuts.

---

# 1. Freeze and identify the test candidate

Before testing:

```bash
git status
git log -5 --oneline
```

Record:

```text
Browser:
Browser version:
OS:
Window manager / compositor:
NotF11 version:
Commit:
Build type: unpacked / release package
```

Pass criteria:

- [ ] The commit under test is known.
- [ ] No accidental uncommitted production changes exist.
- [ ] Only one NotF11 build is active.
- [ ] The candidate being tested is the intended release candidate.

---

# 2. Installation and startup sanity

Load NotF11 from the candidate folder.

Verify:

- [ ] Extension loads with no manifest error.
- [ ] MV3 service worker starts without immediate errors.
- [ ] Popup opens from the extension icon.
- [ ] Current production icon appears correctly.
- [ ] Popup uses the production graphite / cyan visual language.
- [ ] Built-in Help opens correctly.
- [ ] Manage Shortcuts opens the Chromium shortcut page.
- [ ] No legacy NotF11 Tile branding appears.
- [ ] No unexpected permission prompt appears.

---

# 3. Default settings and persistence

Fresh-install defaults must be:

```text
Clean on launch          OFF
New tabs stay clean      OFF
Remember size & position ON
```

Verify:

- [ ] Each toggle visually reflects its state.
- [ ] Changing a setting produces transient `Saved.` feedback.
- [ ] `Saved.` clears after roughly 1.4 seconds.
- [ ] Closing/reopening the popup preserves the setting.
- [ ] Browser restart preserves the setting.
- [ ] Changing a setting does not immediately reposition already-open windows.
- [ ] Normal popup state has no redundant permanent geometry/status banner.

Return to production defaults after testing.

---

# 4. Basic Raw → Clean → Raw

Start:

```text
Normal source
├─ A
├─ B
└─ C
```

Focus B.

Action:

```text
Ctrl+Shift+F
```

Expected:

```text
Normal source
├─ A
└─ C

Clean
└─ B
```

Verify:

- [ ] B becomes Clean.
- [ ] B is the same live tab.
- [ ] A and C remain Raw.
- [ ] No unrelated window is involved.

Toggle B again.

Verify:

- [ ] B returns Raw.
- [ ] B returns to the correct source family.
- [ ] Logical order remains sensible.
- [ ] No unrelated window is adopted.

---

# 5. Live-page preservation

Before toggling, create obvious live state:

- scroll to a distinctive position,
- enter text into a field,
- use an authenticated page if convenient,
- navigate inside a web app if appropriate.

Toggle Raw → Clean → Raw.

Verify:

- [ ] Scroll position survives where Chromium permits.
- [ ] Entered text survives.
- [ ] Login/session survives.
- [ ] In-page state survives where Chromium permits.
- [ ] Page is not reconstructed from its URL.
- [ ] Same actual Chromium tab remains alive.

---

# 6. Lone-tab source

Start:

```text
Normal source
└─ A
```

Toggle A Clean.

Expected:

```text
A Clean
```

The original one-tab normal source may disappear naturally.

Verify:

- [ ] A remains the same live tab.
- [ ] Source disappearance does not corrupt the session.
- [ ] Toggle A Raw safely creates/uses a legitimate normal replacement.
- [ ] A does not join an unrelated normal window.
- [ ] Same page state survives.

---

# 7. Lone Clean + Ctrl+T — New tabs stay clean OFF

Set:

```text
New tabs stay clean = OFF
```

Create:

```text
A Clean
original one-tab source gone

Unrelated normal window
├─ X
└─ Y
```

From A Clean:

```text
Ctrl+T
```

Expected:

```text
A remains Clean

New B becomes Raw
B belongs to A's family
B becomes the legitimate replacement normal source

X | Y remain unrelated
```

Then toggle A Raw.

Expected:

```text
A | B
```

Verify:

- [ ] A remains Clean when B is created.
- [ ] B is Raw.
- [ ] B inherits A's family.
- [ ] B becomes a valid replacement source.
- [ ] X/Y are untouched.
- [ ] A later rejoins B, not X/Y.

**Release-critical.**

---

# 8. Clean parent + Ctrl+T — OFF with source alive

State:

```text
Family X
A Clean
B Raw

New tabs stay clean = OFF
```

From A:

```text
Ctrl+T
```

Expected:

```text
A Clean
B Raw
C Raw
```

Verify:

- [ ] A remains Clean.
- [ ] C is Raw.
- [ ] C belongs to family X.
- [ ] C joins the legitimate source relationship.
- [ ] Previous / Next can later reach C.

---

# 9. Clean parent + Ctrl+T — setting ON

Set:

```text
New tabs stay clean = ON
```

State:

```text
A Clean
```

From A:

```text
Ctrl+T
```

Expected:

```text
A Clean
B Clean
```

Verify:

- [ ] A remains Clean.
- [ ] B becomes Clean.
- [ ] B inherits A's family.
- [ ] Parent A is not displaced.
- [ ] Multiple Clean descendants can coexist.

---

# 10. Raw parent + Ctrl+T while setting ON

Keep:

```text
New tabs stay clean = ON
```

From a normal Raw tab A:

```text
Ctrl+T
```

Expected:

```text
A Raw | B Raw
```

Verify:

- [ ] Ordinary Chromium behavior remains ordinary.
- [ ] B remains Raw.
- [ ] The setting does not globally hijack new tabs.
- [ ] No Clean conversion occurs merely because the preference is enabled.

Return `New tabs stay clean` to OFF after this test unless needed later.

---

# 11. Previous / Next handoff

Start:

```text
Family X
├─ A Clean
├─ B Raw
└─ C Raw
```

Press Next.

Expected:

```text
A Raw
B Clean
C Raw
```

Press Next again.

Expected:

```text
A Raw
B Raw
C Clean
```

Press Previous.

Expected:

```text
B Clean
C Raw
```

Verify:

- [ ] Handoff stays inside family X.
- [ ] Correct logical order is used.
- [ ] Outgoing Clean member returns Raw.
- [ ] Incoming eligible Raw member becomes Clean.
- [ ] Live page state survives handoff.
- [ ] With geometry ON, the Clean footprint remains sensible.

---

# 12. Already-Clean members are skipped

Create:

```text
Family X
├─ A Clean
├─ B Raw
├─ C Clean
└─ D Clean
```

From D, cycle Previous and Next.

If B is the only eligible Raw member, B may be selected in either direction.

Verify:

- [ ] A is not casually stolen from its existing Clean window.
- [ ] C is not casually stolen from its existing Clean window.
- [ ] B is treated as the eligible Raw candidate.
- [ ] Returning C Raw makes C eligible again.

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

Create at least one Clean member in each family.

Verify:

- [ ] Previous / Next from X never enters Y.
- [ ] Previous / Next from Y never enters X.
- [ ] Focus changes do not merge families.
- [ ] Spatial proximity does not affect family identity.
- [ ] Recent focus does not override lineage.

**Release-critical.**

---

# 14. Command-target stress

Create two distinct Clean windows:

```text
A Clean
B Clean
```

Rapidly repeat:

```text
focus A → Toggle
focus B → Toggle
focus A → Toggle
focus B → Toggle
```

Repeat similar rapid focus switching with Previous and Next.

Verify:

- [ ] The command acts on the tab associated with the keyboard event.
- [ ] No A/B substitution occurs.
- [ ] Later focus changes do not override the explicit command target.
- [ ] Rapid interaction does not mutate the wrong family.

**Release-critical.**

---

# 15. Explicit target disappearance

As aggressively as practical:

1. trigger a NotF11 command on A,
2. immediately close/remove A or its window.

Verify:

- [ ] NotF11 does not fall through to a newly focused unrelated tab.
- [ ] Failure is safe.
- [ ] No unrelated family is mutated.
- [ ] No unrelated browser tab is unexpectedly toggled or cycled.

---

# 16. Source disappearance with unrelated window present

Create:

```text
A Clean
A's remembered source is closed

Unrelated normal window
├─ X
└─ Y
```

Toggle A Raw.

Expected:

```text
A becomes Raw in a legitimate new normal replacement
X | Y remain unrelated
```

Verify:

- [ ] A is recovered safely.
- [ ] Same live tab survives.
- [ ] X/Y are not adopted as A's source.
- [ ] Recovery is visible and deterministic.

**Release-critical.**

---

# 17. Geometry ON — Windows

Set:

```text
Remember size & position = ON
```

Use ordinary Windows placement and, if available, FancyZones.

Verify:

- [ ] Raw → Clean requests approximately the same footprint.
- [ ] Clean → Raw preserves intended footprint where Windows/Chromium allows.
- [ ] Repeated toggles do not visibly accumulate drift.
- [ ] Edge-touching windows remain sensible.
- [ ] Multiple-monitor placement remains sensible.
- [ ] Previous / Next preserves the Clean working footprint reasonably.
- [ ] Small Chromium/Windows edge clamping differences are treated as platform behavior, not lineage errors.

---

# 18. Geometry OFF — compositor / OS ownership

Set:

```text
Remember size & position = OFF
```

Verify:

- [ ] Raw → Clean does not force remembered `left`.
- [ ] Raw → Clean does not force remembered `top`.
- [ ] Raw → Clean does not force remembered `width`.
- [ ] Raw → Clean does not force remembered `height`.
- [ ] No later stale geometry is reapplied.
- [ ] Clean → Raw does not use old footprint as placement policy.
- [ ] Source-family behavior remains identical to geometry ON.

On Hyprland:

- [ ] Hyprland chooses tiling position.
- [ ] Dwindle reflow is allowed.
- [ ] NotF11 does not fight the compositor.
- [ ] Spatial reflow is evaluated separately from lineage correctness.

**Release-critical for unified NotF11.**

---

# 19. Change geometry setting mid-session

Create A Clean.

Test:

```text
ON → OFF
```

Verify:

- [ ] A does not immediately move.
- [ ] The next relevant transition uses OFF semantics.

Then:

```text
OFF → ON
```

Verify:

- [ ] Current windows do not instantly rearrange.
- [ ] The next relevant transition uses ON semantics.

Return to the platform-appropriate production preference afterward.

---

# 20. Clean on launch OFF

Set:

```text
Clean on launch = OFF
```

Fully close the browser.

Restart normally.

Verify:

- [ ] Browser launches normally.
- [ ] No surprise Clean conversion occurs.
- [ ] No startup loop occurs.
- [ ] Normal browsing is immediately available.

---

# 21. Clean on launch ON

Assign the Toggle shortcut first.

Set:

```text
Clean on launch = ON
```

Fully close and reopen the browser.

Verify:

- [ ] First eligible browser surface becomes Clean.
- [ ] Restored sessions do not explode into many Clean windows.
- [ ] Startup does not depend on page-load completion.
- [ ] Repeated close/reopen remains stable.
- [ ] Browser remains recoverable.
- [ ] No orphan Clean loop appears.

Return to OFF after testing unless the release test specifically requires ON.

---

# 22. Shortcut safety

Go to Chromium extension shortcuts.

Temporarily unassign the main Toggle command.

Verify:

- [ ] Popup detects the real missing assignment.
- [ ] Toggle shortcut displays as `Unassigned`.
- [ ] Clean on launch cannot be unsafely enabled.
- [ ] If already enabled, recovery/safety logic disables or protects it appropriately.
- [ ] User receives clear warning text.
- [ ] Primary popup button still behaves safely where supported.
- [ ] Reassigning Toggle restores normal availability.

Also briefly unassign a secondary shortcut.

Verify:

- [ ] Missing shortcut warning appears.
- [ ] `Saved.` can temporarily appear and the persistent warning returns afterward.

Restore all production shortcuts.

---

# 23. Grouped-tab guard

Create a native Chromium tab group.

Focus a grouped tab and attempt Clean.

Verify:

- [ ] Toggle is safely blocked.
- [ ] Group membership is not corrupted.
- [ ] Popup communicates that grouped tabs are unsupported.
- [ ] Disabled action is visually clear.
- [ ] No hidden partial Clean session is created.

**Grouped tabs remain unsupported until explicitly engineered.**

---

# 24. Pinned tabs

Pin A.

Toggle:

```text
A Raw → Clean → Raw
```

Verify:

- [ ] A returns pinned.
- [ ] A remains inside Chromium's pinned region.
- [ ] Logical family order remains coherent.
- [ ] Previous / Next behavior does not silently destroy pinned state.

---

# 25. Multiple simultaneous Clean windows

Create multiple Clean tabs from one family and at least one Clean tab from another family.

Then manually close one Clean window.

Verify:

- [ ] Only that Clean session is removed.
- [ ] Other Clean windows remain functional.
- [ ] Other families remain unaffected.
- [ ] Previous / Next candidate eligibility updates correctly.
- [ ] Closing one Clean window does not poison runtime state.

---

# 26. Untracked popup recovery

Where practical, create or reproduce an untracked popup state, such as after a reload/restart scenario.

Verify:

- [ ] Popup can be recovered to a normal browser surface.
- [ ] Same live tab survives.
- [ ] No unrelated normal window is adopted.
- [ ] Recovery is visible and understandable.
- [ ] No fake/minimized bridge becomes stranded.

---

# 27. MV3 service-worker lifecycle / extension reload

With active Clean sessions:

1. allow the MV3 worker to suspend naturally where practical,
2. or reload the extension from `brave://extensions` / `chrome://extensions`.

Then test:

```text
Toggle
Previous
Next
```

Verify:

- [ ] Valid session-backed relationship state survives where intended.
- [ ] Commands continue functioning.
- [ ] No stale in-memory-only assumption causes cross-family behavior.
- [ ] Popup still opens cleanly.
- [ ] No service-worker error appears.

---

# 28. Full browser restart and session restoration

With Clean windows present:

1. fully terminate Brave/Chrome,
2. restart with session restoration.

Verify:

- [ ] Old runtime tab/window IDs are not blindly trusted.
- [ ] Restored untracked popup can recover safely.
- [ ] No old source window is guessed incorrectly.
- [ ] No unrelated family is adopted.
- [ ] Live restored page survives where Chromium supports restoration.
- [ ] Clean-on-launch behavior remains consistent with its current setting.

---

# 29. Popup UI, privacy, and permission audit

## Popup UI

Verify:

- [ ] No permanent redundant geometry/status banner appears in normal state.
- [ ] `Saved.` is transient.
- [ ] Persistent warnings appear only when relevant.
- [ ] Grouped-tab warning is clear.
- [ ] Missing-shortcut warning is clear.
- [ ] Primary button label matches Raw / Clean / recovery state.
- [ ] Toggle ON/OFF states are visually obvious.
- [ ] Cyan focus rings remain visible.
- [ ] Warning/error styling remains distinct from cyan branding.
- [ ] Built-in Help opens.
- [ ] Popup does not noticeably jump when transient feedback appears.

## Privacy / permissions

Verify the manifest/runtime still have only intended capabilities:

- [ ] Manifest V3.
- [ ] Only intended permission(s) remain.
- [ ] No host permissions.
- [ ] No content scripts.
- [ ] No `scripting` permission.
- [ ] No browsing-history permission.
- [ ] No clipboard permission.
- [ ] No native messaging.
- [ ] No external network service.
- [ ] No analytics.
- [ ] No telemetry.

Documentation:

- [ ] `PRIVACY.md` matches runtime behavior.
- [ ] README/help/store copy do not claim page-content access.
- [ ] Public copy accurately describes local/session state.
- [ ] Unified NotF11 language is used; no obsolete Tile product split remains.

---

# 30. Release packaging + exact-package smoke test

This is the final gate.

Before packaging:

```bash
git status
```

Verify:

- [ ] Working tree is clean.
- [ ] Manifest version is correct.
- [ ] Production icons are current.
- [ ] Popup CSS/JS/HTML are current.
- [ ] Built-in Help files are included.
- [ ] README/docs describe unified NotF11.
- [ ] No experimental/debug files are packaged.
- [ ] No old Tile branding is packaged.
- [ ] No icon-comparison assets are packaged.
- [ ] `manifest.json` is at the ZIP root.

Create the exact release ZIP.

Then:

1. extract the ZIP into a completely fresh folder,
2. disable/remove the development copy,
3. load the freshly extracted release folder as unpacked.

Run this final smoke test **from the exact release package**:

- [ ] Popup opens.
- [ ] Built-in Help opens.
- [ ] Toggle works.
- [ ] Previous works.
- [ ] Next works.
- [ ] New-tab OFF works.
- [ ] New-tab ON works.
- [ ] Geometry ON works.
- [ ] Geometry OFF works.
- [ ] Missing-source recovery works.
- [ ] Shortcut warning/safety works.
- [ ] Grouped-tab guard works.
- [ ] No new service-worker error appears.

Only after this exact-package smoke test passes should the release be tagged, published on GitHub, or uploaded to the Chrome Web Store.

---

# Final release record

Use this block at the end of every full regression run:

```text
NOTF11 FULL REGRESSION RESULT

Version:
Commit:
Date:

Brave / Windows 11 ............. PASS / FAIL
Chrome / Windows 11 ............ PASS / FAIL
Brave / Hyprland ............... PASS / FAIL

01 Candidate freeze ............ PASS / FAIL
02 Installation/startup ........ PASS / FAIL
03 Defaults/persistence ........ PASS / FAIL
04 Raw ↔ Clean ................. PASS / FAIL
05 Live-page preservation ...... PASS / FAIL
06 Lone source ................. PASS / FAIL
07 Lone Clean Ctrl+T OFF ....... PASS / FAIL
08 Clean Ctrl+T OFF ............ PASS / FAIL
09 Clean Ctrl+T ON ............. PASS / FAIL
10 Raw Ctrl+T ON ............... PASS / FAIL
11 Previous / Next ............. PASS / FAIL
12 Already-Clean skip .......... PASS / FAIL
13 Family isolation ............ PASS / FAIL
14 Command targeting ........... PASS / FAIL
15 Target disappearance ........ PASS / FAIL
16 Source recovery ............. PASS / FAIL
17 Geometry ON ................. PASS / FAIL
18 Geometry OFF ................ PASS / FAIL
19 Geometry mid-session ........ PASS / FAIL
20 Clean launch OFF ............ PASS / FAIL
21 Clean launch ON ............. PASS / FAIL
22 Shortcut safety ............. PASS / FAIL
23 Grouped-tab guard ........... PASS / FAIL
24 Pinned tabs ................. PASS / FAIL
25 Multiple Clean windows ...... PASS / FAIL
26 Untracked recovery .......... PASS / FAIL
27 MV3 lifecycle ............... PASS / FAIL
28 Browser restart ............. PASS / FAIL
29 UI / privacy audit .......... PASS / FAIL
30 Exact release package ....... PASS / FAIL

RELEASE BLOCKERS FOUND:
- none / describe

SHIP:
YES / NO
```

---

# Canonical engineering invariants

These are the rules the regression suite exists to protect:

1. **Same live tab, not recreated URL.**
2. **Clean changes surface, not family.**
3. **Source lineage survives Raw ↔ Clean.**
4. **Child from Clean parent inherits coherent lineage.**
5. **New tabs stay clean changes representation, not genealogy.**
6. **Clean parent remains Clean when creating a child.**
7. **Raw-parent new tabs remain ordinary Raw tabs.**
8. **Already-Clean members are not casually stolen by cycling.**
9. **Previous / Next stays inside the source family.**
10. **Concrete command target beats later focus.**
11. **Explicit target never falls through to unrelated focus.**
12. **Missing source never adopts an unrelated browser window.**
13. **A child created from a lone Clean workflow can become the legitimate replacement source.**
14. **No fake minimized bridge recovery architecture.**
15. **Grouped tabs remain guarded until properly engineered.**
16. **Persistent preferences and runtime lineage remain separate.**
17. **Clean-on-launch safety depends on actual shortcut assignment.**
18. **Geometry OFF means no geometry interference.**
19. **Geometry ON affects presentation only.**
20. **Desktop placement never rewrites lineage.**
21. **No native helper is required for the Web Store product.**
22. **Few settings; no policy explosion.**
23. **Do not silently repair user-created topology.**

---

# Short principle to remember

> **NotF11 preserves browser relationships. Your desktop decides where windows live.**

And above everything else:

> **Clean changes the surface, not the family.**
