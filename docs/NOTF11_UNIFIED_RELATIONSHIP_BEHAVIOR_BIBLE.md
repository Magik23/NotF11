# NotF11 — Unified Relationship & Behavior Bible
## Browser lineage, Clean/Raw state, source families, new-tab ancestry, geometry policy, OS/window-manager boundaries, expected behavior, limitations, acceptance tests, and AI handoff

**Project:** NotF11  
**Tagline:** *Any browser tab, toolbar-free.*  
**Product model:** One unified Chromium extension  
**Document status:** Canonical unified behavior specification / AI handoff  
**Date:** 2026-09-14  
**Supersedes:** `NOTF11_TILE_RELATIONSHIP_BEHAVIOR_BIBLE_2026-09-04.md` as the product-wide behavioral reference  
**Historical donor architecture:** NotF11 Tile  
**Core semantic invariant:** **Clean changes the surface, not the family.**  
**Core product principle:** **NotF11 owns browser relationships. The operating system / window manager owns final desktop placement unless the user explicitly enables size-and-position memory.**  
**Internal philosophy:** **Preserve relationships. Do not impose topology.**

---

# 1. Why this document exists

NotF11 looks simple from the outside.

Its visible purpose is straightforward:

- take the current live Chromium tab,
- remove ordinary browser chrome by moving it into a popup-style clean window,
- allow that same live tab to return to a normal browser source,
- preserve useful source relationships,
- provide Previous / Next clean-surface handoff,
- optionally keep Clean workflows Clean when new tabs are created,
- optionally remember window size and position.

But these few primitives interact with several independent systems:

1. Chromium tab identity.
2. Chromium window ownership.
3. NotF11's remembered source relationships.
4. Clean versus Raw representation.
5. Multiple normal browser windows.
6. Multiple simultaneous Clean windows.
7. New-tab ancestry.
8. Source-family ordering.
9. Previous / Next candidate eligibility.
10. Browser startup and shutdown behavior.
11. Chromium shortcut assignment.
12. Windows desktop placement behavior.
13. Tiling window managers such as Hyprland.
14. External layout tools such as FancyZones.
15. The order in which top-level browser windows are created, removed, and replaced.

The result is a small product with **emergent complexity rather than feature bloat**.

This document defines the unified model so future development does not accidentally reintroduce bugs that were already understood during the Tile work, or split the product back into OS-specific editions without a strong technical reason.

---

# 2. The consolidation decision

Historically, two closely related product directions existed:

## 2.1 Original NotF11

The original product focused on general Chromium use, especially Windows:

- normal browser window ↔ clean popup,
- live-tab preservation,
- window size / position continuity,
- Windows-friendly behavior,
- compatibility with FancyZones and ordinary desktop workflows.

## 2.2 NotF11 Tile

Tile was created as a Hyprland-focused edition:

- no forced geometry,
- compositor-owned placement,
- source-family lineage,
- Clean-parent new-tab behavior,
- session-backed relationship state,
- improved command targeting,
- direct recovery,
- compact settings popup,
- explicit relationship semantics.

## 2.3 Why one product is now preferable

The largest architectural difference between OG and Tile was no longer fundamental.

The difference can be represented as a user preference:

```text
Remember size & position = ON
    → NotF11 requests the remembered window footprint.

Remember size & position = OFF
    → NotF11 does not participate in geometry.
    → OS / window manager / compositor places the window.
```

Once geometry becomes a setting rather than a product identity, the strongest reason for maintaining separate browser extensions disappears.

The unified model therefore becomes:

```text
                NotF11
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
  Windows-like   Hyprland   Other Chromium
   workflows     workflows    environments

same relationship engine
same live-tab semantics
same source-family model
same commands
same extension identity

different placement preference
through one setting
```

NotF11 Tile remains historically important because many of the strongest relationship and hardening discoveries came from Tile testing, but those discoveries now belong to **NotF11 itself**.

---

# 3. Product philosophy

## 3.1 Mechanism, not policy

NotF11 should provide strong browser primitives.

It should remember relationships that are meaningful to the browser workflow.

It should **not** attempt to infer arbitrary desktop intentions.

NotF11 should not try to answer questions such as:

- Which workspace should this child appear on?
- Should every descendant stay physically adjacent to its parent?
- Should a Hyprland scratchpad source force all Clean descendants into a specific workspace?
- Should an already-Clean family member be stolen from its current window because Previous / Next would otherwise skip it?
- Should an unrelated normal browser window become a missing source merely because it already exists?
- Should a particular tiling layout be repaired automatically?

Those are policy decisions.

The stronger principle is:

> **Preserve relationships. Do not impose topology.**

---

## 3.2 Few controls, strong primitives

The unified product should remain intentionally small.

Current core settings:

1. **Clean on launch**
2. **New tabs stay clean**
3. **Remember size & position**

These settings should not become the beginning of a large matrix of layout rules.

NotF11 favors:

> **few settings + strong internal relationships + composability**

over:

> **many settings + special cases + hidden automation**

---

## 3.3 "Brutal but honest" survives as an internal design principle

The phrase came from the Tile work, but the principle still applies.

A coherent source family produces an exceptionally smooth workflow.

A deliberately tangled topology can produce unusual but explainable consequences.

NotF11 should preserve the relationships that actually exist rather than secretly constructing a new hierarchy that the user never created.

The user's workflow is part of the system.

---

# 4. The unified four-layer mental model

The cleanest way to reason about NotF11 is to separate four concerns.

```text
┌─────────────────────────────────────────────┐
│ 1. CHROMIUM TAB IDENTITY                    │
│    "Which actual live tab is this?"          │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ 2. NOTF11 SOURCE FAMILY                     │
│    "What logical source lineage does this   │
│     tab belong to?"                         │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ 3. NOTF11 REPRESENTATION                    │
│    "Is the tab currently Raw or Clean?"     │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ 4. DESKTOP PLACEMENT                        │
│    "Where does the OS/window manager put    │
│     this top-level browser window?"         │
└─────────────────────────────────────────────┘
```

These layers interact.

They must not be collapsed into one system.

A spatial oddity is not automatically a lineage bug.

A lineage bug must not be "fixed" by geometry.

A geometry preference must not alter family membership.

---

# 5. Vocabulary

## 5.1 Raw tab

A **Raw** tab is a normal Chromium tab physically contained inside an ordinary browser window.

Example:

```text
Normal Brave window
├─ A
├─ B
└─ C
```

Raw tabs have a native physical Chromium relationship to their current normal browser window.

They have:

- a real `windowId`,
- a physical position in the tab strip,
- ordinary browser chrome,
- native tab ordering.

---

## 5.2 Clean tab

A **Clean** tab is the same live Chromium tab moved into a popup-style top-level browser window.

Example:

```text
Before:

Normal Brave window
├─ A
├─ B
└─ C

Toggle B Clean:

Normal Brave window
├─ A
└─ C

Clean popup
└─ B
```

The page is **not recreated from its URL**.

The live tab is moved.

That distinction is fundamental.

Where Chromium permits, this preserves live state such as:

- scroll position,
- form state,
- authentication,
- in-page JavaScript state,
- history,
- navigation session,
- media state,
- application state.

---

## 5.3 Source window

The **source window** is the normal Chromium window associated with a tab's remembered source relationship.

It is the normal browser container to which a Clean tab should return when possible.

A source window can be:

- visible,
- minimized,
- on another desktop,
- inside a FancyZones arrangement,
- in a Hyprland scratchpad,
- on another Hyprland workspace,
- closed,
- destroyed automatically because its last tab was moved away.

NotF11 must treat source identity independently from desktop placement.

---

## 5.4 Source family

A **source family** is the logical collection and order of tabs that share a remembered source lineage.

Example:

```text
Family X
├─ A
├─ B
└─ C
```

The members can have different representations simultaneously:

```text
A → Clean
B → Raw
C → Clean
```

The family remains intact.

---

## 5.5 Source order

NotF11 maintains a logical order for a source family.

That order is not always identical to the tabs currently visible in the normal source window, because some family members can be detached as Clean windows.

Source order exists so Previous / Next can preserve meaningful navigation.

---

## 5.6 Eligible Raw source tab

Previous / Next normally considers **Raw members of the same source family**.

Already-Clean members are already occupying other Clean surfaces and should not be casually stolen.

Example:

```text
Family X
├─ A → Clean
├─ B → Raw
├─ C → Clean
└─ D → Clean
```

From D:

```text
Previous → B
Next     → B
```

if B is the only eligible Raw member.

That does not mean B and D form a special genealogy.

B is simply the only currently available Raw candidate.

---

## 5.7 Clean session

A **Clean session** is the runtime relationship metadata required to understand a Clean tab:

- tab identity,
- clean popup window,
- remembered source relationship,
- family membership,
- source order / position,
- any transient recovery information required for the current browser session.

Clean-session state is runtime state, not a permanent preference.

---

# 6. Foundational invariants

The unified product should treat the following as near-locked unless strong evidence disproves them.

## 6.1 Same live tab, not URL recreation

NotF11 moves the actual tab.

It does not rebuild the page from `tab.url`.

---

## 6.2 Clean changes the surface, not the family

If A belongs to family X:

```text
A Raw   → family X
A Clean → family X
```

Toggling representation must not create new ancestry.

---

## 6.3 Source lineage survives Raw ↔ Clean

Moving a tab between normal and popup containers changes physical ownership but should preserve logical family identity.

---

## 6.4 New-tab Clean behavior changes representation, not genealogy

A child created from a Clean parent inherits coherent lineage.

The setting decides the child's initial representation.

It does not decide whether the child belongs to the family.

---

## 6.5 Previous / Next stays inside the family

A family handoff must never jump into an unrelated source family.

---

## 6.6 Explicit command identity beats later focus

When the Chrome Commands API provides the tab associated with the keyboard command, that tab is authoritative.

Do not query focus later and substitute some other tab.

---

## 6.7 A missing source is not permission to adopt an unrelated window

Recovery must create or identify a legitimate replacement belonging to the same workflow.

It must not use an unrelated browser window simply because it exists.

---

## 6.8 Geometry is presentation state, not relationship state

The geometry setting must never change:

- family membership,
- ancestry,
- Previous / Next eligibility,
- recovery target,
- source identity,
- grouped-tab support,
- command targeting.

---

# 7. Raw → Clean

Conceptually:

```text
Raw A
  │
  ├─ identify source window
  ├─ preserve source family
  ├─ preserve logical order / position
  ├─ create Clean popup
  └─ move SAME live tab
       ↓
    Clean A
```

No URL recreation.

No family mutation.

No unrelated-window adoption.

---

# 8. Clean → Raw when the remembered source exists

Conceptually:

```text
Clean A
  │
  ├─ resolve remembered source
  ├─ move live tab back
  ├─ restore logical order when possible
  └─ retire Clean container
       ↓
Raw A in its source
```

The source may be:

- visible,
- minimized,
- on another desktop,
- in a scratchpad,
- inside a tiled layout.

NotF11 returns to the source relationship.

Desktop policy determines where that source is visible.

---

# 9. The one-tab source problem

This case is important because it is where browser mechanics can make a source window disappear naturally.

Start:

```text
Normal window
└─ A
```

Toggle A Clean.

Chromium now has no Raw tab left in that normal source window.

Depending on browser behavior, that source window can disappear.

Now:

```text
Clean A
source window missing
```

This is not necessarily an error.

It is a normal consequence of moving the only tab out of a window.

The unified architecture must treat this state deliberately.

---

# 10. Clean parent + Ctrl+T when the original source vanished

This is one of the most important unified semantics.

Start:

```text
A → Clean
original one-tab source no longer exists
New tabs stay clean = OFF
```

User presses:

```text
Ctrl+T
```

Expected conceptual result:

```text
A remains Clean

New B becomes Raw
B becomes the new valid normal source surface
B belongs to A's source family
```

Later, if A is returned Raw:

```text
Normal source
├─ A
└─ B
```

or the corresponding family-preserving ordering defined by the implementation.

The critical rule is:

> **B is a legitimate replacement source because B was created from A's own Clean workflow.**

An unrelated browser window is not.

---

# 11. Unrelated window isolation

Suppose the desktop already contains:

```text
Unrelated normal window
├─ X
└─ Y
```

and separately:

```text
A → Clean
A's original source is gone
```

NotF11 must not decide:

```text
"X|Y exists, so put A there."
```

That would corrupt lineage.

The correct principle is:

```text
same workflow / same family → valid recovery relationship
unrelated existing window   → never automatic source adoption
```

---

# 12. Source disappearance recovery

When a remembered source can no longer be resolved:

```text
Clean A
source missing
    ↓
create a real normal replacement
    ↓
move A into that replacement
    ↓
A becomes Raw
```

Recovery must be:

- visible,
- reversible,
- deterministic,
- family-safe.

It must not silently attach A to an unrelated browser window.

---

# 13. Why the fake minimized bridge should remain removed

An earlier strategy used a requested minimized normal window as a temporary bridge.

This proved fragile, especially on Linux / Wayland:

- requested minimized state could be ignored,
- the bridge could appear as a real compositor client,
- the bridge could create layout churn,
- API failures could strand the live tab in the bridge.

Unified NotF11 should therefore preserve the hardened rule:

- when the real source still exists, use only the temporary normal transition mechanics Chromium actually requires to move the live tab back into that source,
- when the source is gone, recover directly into the final normal replacement,
- do not use a fake/minimized bridge as the missing-source recovery strategy,
- never leave a live tab stranded in an intermediate bridge if a later operation fails.

---

# 14. New tabs from Raw tabs

`New tabs stay clean` is scoped to the Clean workflow.

Example:

```text
Raw A
Ctrl+T
   ↓
Normal source
├─ A Raw
└─ B Raw
```

Even if:

```text
New tabs stay clean = ON
```

a normal Raw-parent Ctrl+T remains ordinary Chromium behavior.

The setting does **not** mean:

> every new tab anywhere in Brave or Chrome should become Clean.

It means:

> when a new tab is created from a Clean NotF11 workflow, decide whether the child initially remains Raw or becomes Clean.

---

# 15. New tabs from Clean tabs — setting OFF

Given:

```text
A → Clean
New tabs stay clean = OFF
```

Ctrl+T from A should produce conceptually:

```text
A remains Clean
B joins A's source family
B is represented Raw
```

If the original source exists, B should belong to that source relationship.

If the original source disappeared because A was the only tab, B can become the family's new legitimate Raw source surface.

The important rule:

> **The parent remains Clean.**

Creating B must not kick A out of Clean merely to make the normal source exist.

---

# 16. New tabs from Clean tabs — setting ON

Given:

```text
A → Clean
New tabs stay clean = ON
```

Ctrl+T from A should produce:

```text
A remains Clean
B inherits A's source family
B becomes Clean
```

Possible family state:

```text
Family X
├─ A → Clean
├─ B → Clean
└─ C → Raw
```

Clean parenthood does not sever lineage.

---

# 17. New-tab semantic table

| Parent representation | New tabs stay clean | Child family | Child representation |
|---|---:|---|---|
| Raw | OFF | normal Chromium/source family | Raw |
| Raw | ON | normal Chromium/source family | Raw |
| Clean | OFF | parent's remembered source family | Raw |
| Clean | ON | parent's remembered source family | Clean |

The setting controls **representation**, not genealogy.

---

# 18. Why representation and ancestry must remain separate

If ancestry changed merely because a parent happened to be Clean, then:

```text
A creates B while Raw
```

would have fundamentally different genealogy from:

```text
A creates C while Clean
```

That would make user history affect family semantics in a way that is difficult to reason about.

The stronger architecture is:

```text
TAB IDENTITY
    │
    ▼
SOURCE FAMILY
   /     \
  /       \
Raw       Clean
surface   surface
```

---

# 19. Previous / Next: what they actually mean

Previous / Next is not ordinary global browser tab cycling.

It is a **Clean-surface handoff operation** inside a source family.

Example:

```text
Family X
├─ A
├─ B
└─ C

Current:
A → Clean
B → Raw
C → Raw
```

If A performs Next and B is the next eligible Raw member:

```text
A Clean
  │
  ├─ A returns Raw to source
  └─ B leaves source and becomes Clean
```

Result:

```text
A → Raw
B → Clean
C → Raw
```

The Clean working surface continues while the live page occupying that role changes.

---

# 20. Already-Clean members are normally skipped

Example:

```text
Family X
├─ A → Clean
├─ B → Raw
├─ C → Clean
└─ D → Clean
```

If D cycles:

```text
Previous → B
Next     → B
```

when B is the only eligible Raw candidate.

NotF11 should not casually steal A or C from their existing Clean windows.

Once C is returned Raw, C becomes eligible again.

---

# 21. Source-family isolation

Multiple source families are supported.

Example:

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

Required invariant:

> **Previous / Next from X must never select Y.**

Not:

- because Y is focused,
- because Y is closer spatially,
- because Y was used recently,
- because X's source disappeared,
- because Chromium reports Y as active later.

Family crossing is a real bug.

---

# 22. Command targeting

A major historical bug occurred when two Clean windows existed:

```text
A Clean
B Clean
```

The user focused A and pressed Toggle, but an asynchronous later focus query sometimes acted on B.

The hardened rule is:

```js
chrome.commands.onCommand.addListener((command, commandTab) => {
  // commandTab is authoritative when available
});
```

For keyboard commands:

- Toggle,
- Previous,
- Next,

the command-event tab should be treated as the concrete target whenever available.

---

# 23. Explicit target failure must not fall through

Suppose a command event identifies tab A.

If A disappears before the operation completes, NotF11 must not silently say:

```text
"Fine, operate on whichever tab is focused now."
```

That could target unrelated B.

The safe behavior is:

- complete only if the explicit target remains valid,
- otherwise fail or recover in a target-safe way,
- never substitute unrelated focus.

---

# 24. Focus is not lineage

Focus is transient.

Family identity is logical state.

Therefore:

```text
user command target
≠
whatever Chromium reports focused later
```

Focus may be useful for ordinary popup UI context.

It must not replace explicit command identity.

---

# 25. The geometry setting

Unified NotF11 introduces:

```text
Remember size & position
```

This replaces the need for separate OG-versus-Tile geometry policy.

The setting must affect only desktop footprint behavior.

It must never alter browser lineage.

---

# 26. Remember size & position = ON

Target behavior:

1. Capture the relevant source / Clean footprint.
2. When creating the corresponding replacement top-level window, request:
   - `left`,
   - `top`,
   - `width`,
   - `height`.
3. Where Chromium / Windows shifts the result slightly, reapply bounds when appropriate.
4. Preserve the visual illusion that the same page transformed between normal and Clean surfaces.

This is particularly useful on ordinary Windows desktops where Chromium popup creation may otherwise appear at a browser-chosen location and size.

It can also work with desktop tools such as FancyZones, but NotF11 must not make FancyZones a dependency.

The browser / OS can still clamp or alter requested bounds.

NotF11 requests geometry; it does not become the operating system's window manager.

---

# 27. Remember size & position = OFF

When OFF, geometry must be genuinely disabled.

NotF11 should not provide or later enforce:

```text
left
top
width
height
```

for the relevant Clean / Raw placement transition.

It should not:

- force coordinates,
- force size,
- restore an old footprint,
- infer a workspace,
- infer a split direction,
- reapply position after creation,
- simulate geometry through hidden bridge windows.

This is the preferred mode for Hyprland and other tiling environments where the compositor should own spatial topology.

---

# 28. Geometry OFF must be a real architectural path

This should not be implemented as:

```text
calculate geometry anyway
then mostly ignore it
```

The OFF path should be conceptually clean:

```text
create required Chromium top-level surface
without placement policy
    ↓
OS / window manager decides final location
```

That keeps the relationship engine independent from desktop layout.

---

# 29. Geometry ON and OS authority

Even with memory enabled, NotF11 cannot guarantee exact placement in every environment.

The OS, browser, compositor, DPI system, monitor topology, and desktop utilities can all constrain requested bounds.

Therefore the correct language is:

> **Remember size & position asks NotF11 to preserve the previous footprint where the platform allows it.**

Not:

> **NotF11 owns final desktop placement.**

---

# 30. Windows behavior

On ordinary Windows desktops, a Clean popup is a new top-level Chromium window.

Chromium cannot simply mutate the existing normal browser window into popup type in place.

Without geometry memory, Windows / Chromium may choose a new placement and size.

This is why geometry preservation existed in original NotF11.

Recommended typical Windows preference:

```text
Remember size & position = ON
```

This is a default user-experience recommendation, not a family semantic.

---

# 31. FancyZones

FancyZones can complement NotF11.

NotF11 should not depend on it.

The extension should work for users who have never heard of FancyZones.

Possible user experience:

```text
NotF11
→ requests / preserves the browser footprint

FancyZones / Windows
→ applies its own desktop placement policy
```

If the user's desktop tooling repositions the window after creation, that is external desktop policy.

---

# 32. Hyprland

Hyprland is now an important supported workflow, not a separate NotF11 product identity.

Recommended typical preference:

```text
Remember size & position = OFF
```

In that mode:

```text
NotF11
→ owns live tab movement
→ owns source-family relationships
→ owns Clean / Raw representation
→ owns Previous / Next handoff

Hyprland
→ owns tiling
→ owns workspace
→ owns Dwindle layout
→ owns scratchpad
→ owns grouping
→ owns physical placement
```

---

# 33. Hyprland scratchpad workflow

The Tile work discovered a particularly strong advanced workflow:

```text
Scratchpad
└─ normal Brave source
   ├─ ChatGPT
   ├─ GitHub
   ├─ Docs
   ├─ Mail
   └─ YouTube

Workspace
└─ one Clean active surface
```

Then:

```text
Ctrl+Shift+,  → Previous
Ctrl+Shift+.  → Next
```

can rotate the Clean role through eligible Raw source-family members.

This is an excellent Hyprland workflow.

It is no longer the definition of a separate Tile product.

---

# 34. Scratchpad is desktop policy

NotF11 should not:

- invoke `hyprctl`,
- move windows into scratchpad,
- choose a workspace,
- create compositor groups,
- enforce Hyprland rules.

The user or compositor owns those decisions.

NotF11 simply preserves the browser relationship well enough that the workflow becomes useful.

---

# 35. Why new Clean windows can appear in unexpected Hyprland locations

When a new top-level popup is created, Hyprland sees a new compositor client.

Its placement can depend on:

- active workspace,
- current Dwindle tree,
- currently focused client,
- browser timing,
- existing window rules,
- current split state.

Therefore:

```text
logical relationship = can be correct
physical placement    = can be surprising
```

Do not rewrite lineage to "fix" a compositor placement result.

---

# 36. Popup ↔ normal is not a true in-place morph

Chromium does not expose a simple API to change an existing top-level browser window's type:

```text
normal ↔ popup
```

in place.

Structural transitions can require:

- creating a new top-level window,
- moving the live tab,
- closing the old top-level container.

On tiling window managers, this can cause:

- temporary reflow,
- sibling resize,
- branch redistribution,
- focus movement.

That is often a compositor consequence, not a family failure.

---

# 37. Previous / Next can feel smoother than Raw ↔ Clean

A normal Clean handoff can reuse the logical family instead of repeatedly exposing and hiding source shells manually.

This is especially effective when:

- the source family already exists,
- one Raw chain is coherent,
- only one family member occupies the active Clean role,
- the source window remains in scratchpad or otherwise out of the way.

The product should preserve this strength.

---

# 38. Clean on launch

Unified target default:

```text
Clean on launch = OFF
```

This intentionally differs from the historical Tile default.

Reason:

A general-purpose Chromium extension should not surprise a new user by opening a toolbar-free browser surface before the user understands the shortcut and recovery model.

When the user explicitly enables Clean on launch, expected behavior is:

- clean the first appropriate browser surface,
- do not explode a restored session into many Clean windows,
- do not depend on page-load completion,
- tolerate Chromium / Brave remaining alive after visible windows close,
- preserve safe recovery.

---

# 39. Clean-on-launch shortcut safety

A Clean popup does not expose ordinary browser chrome.

If Clean on launch is ON while Toggle is unassigned, the user can enter an unpleasant recovery loop.

Therefore:

- verify whether the Toggle command is assigned,
- if not, disable Clean on launch,
- show a clear recovery notice,
- do not allow unsafe re-enabling while the command remains unassigned.

This is a safety invariant.

---

# 40. New tabs stay clean

Unified target default:

```text
New tabs stay clean = OFF
```

Reasons:

- preserves ordinary browser expectations by default,
- avoids multiplying Clean windows unexpectedly,
- maintains backward-compatible behavior for users who simply want one toolbar-free surface,
- advanced users can explicitly enable the Clean workflow.

The setting applies to children created from a Clean context.

---

# 41. Remember size & position

Unified target default:

```text
Remember size & position = ON
```

Rationale:

- preserves the traditional NotF11 Windows experience,
- makes normal → Clean feel like the same window transformed,
- avoids arbitrary popup placement for ordinary users.

Hyprland and other tiling users can switch it OFF.

Important implementation rule:

Changing the setting should affect **future transitions**.

It should not instantly yank already-existing windows around merely because the checkbox changed.

---

# 42. Current unified settings matrix

| Setting | Target default | Scope |
|---|---:|---|
| Clean on launch | OFF | startup representation |
| New tabs stay clean | OFF | children created from Clean context |
| Remember size & position | ON | desktop footprint requests only |

These are user preferences.

They must remain separate from runtime relationship state.

---

# 43. Persistent settings versus runtime state

## Persistent settings

Examples:

```text
cleanOnLaunch
newTabsStayClean
rememberWindowGeometry
```

These belong in persistent extension storage.

They should survive browser restart.

## Runtime relationship state

Examples:

```text
clean sessions
source window association
source family
source order
clean popup identity
transient focus context
recovery metadata
```

These belong to the currently running browser session.

They should not become permanent preferences.

Session storage is the appropriate conceptual home.

---

# 44. Browser startup / session lifecycle

NotF11 must remember that Chromium / Brave may:

- remain alive after visible windows close,
- restore browser windows asynchronously,
- create an initial normal surface before an extension can react,
- assign new runtime window IDs across sessions.

Therefore relationship state should not pretend that browser runtime identity is permanent.

Persistent settings survive.

Transient source / Clean sessions are rebuilt or discarded with the browser session.

---

# 45. Shortcut assignment is not guaranteed

Manifest `suggested_key` values are suggestions.

Chromium / Brave may leave them unassigned because of:

- OS conflicts,
- browser conflicts,
- previous assignments,
- another extension.

The extension must detect actual command assignment rather than assuming it exists.

---

# 46. Unified shortcuts

Intended user-facing commands:

```text
Ctrl+Shift+F  → Clean ↔ Raw toggle
Ctrl+Shift+.  → Next eligible source tab
Ctrl+Shift+,  → Previous eligible source tab
```

Actual assignment must be read from the browser.

The popup should display the real assigned values.

---

# 47. Chromium tab groups

Native Chromium grouped tabs remain intentionally unsupported.

Moving grouped tabs between windows can damage or lose group semantics.

Proper support would require explicit engineering for:

- group identity,
- group membership,
- restoration,
- ordering,
- repeated Clean / Raw transitions.

Until that work is intentionally done, grouped tabs should be guarded rather than falsely supported.

---

# 48. Untracked popup recovery

A popup-style Chromium window may occasionally exist without complete NotF11 session tracking, for example after abnormal lifecycle events.

The popup UI / runtime should provide a safe path to recover it into a normal browser surface.

Recovery must respect the same principles:

- preserve the live tab,
- do not attach to unrelated windows,
- fail visibly rather than silently corrupt lineage.

---

# 49. Popup UI principles

The popup should remain compact.

It should show:

- NotF11 identity,
- current state,
- three settings,
- Toggle action,
- actual shortcuts,
- Manage shortcuts,
- transient status / warning messages,
- concise privacy statement.

Behavioral feedback such as:

```text
Saved.
```

should be transient.

It should not remain indefinitely and create ambiguity about whether later changes were saved.

---

# 50. Privacy architecture

NotF11's value proposition includes narrow permissions and local behavior.

The browser extension should not need page-content access merely to move tabs and windows.

Core philosophy:

```text
Live tabs.
Local state.
No page access.
```

No telemetry should be introduced merely to support the relationship model.

---

# 51. What NotF11 should not own

The unified Web Store extension should not grow into:

- a Hyprland controller,
- a workspace router,
- a FancyZones controller,
- a native desktop daemon,
- a compositor grouping engine,
- a per-site layout rule system,
- a source-family editor,
- a tree visualizer,
- a topology auto-repair engine,
- a tab-content inspector.

The strongest product remains:

> **pure Chromium extension, immediate utility, strong relationship semantics, minimal setup.**

---

# 52. "Quirky" versus "bug"

This distinction remains essential.

## Contextual / acceptable

Behavior differs because:

- source window exists or does not,
- a family member is already Clean,
- candidate is Raw or Clean,
- another eligible Raw candidate exists,
- geometry memory is ON or OFF,
- OS / compositor places a new top-level window differently,
- source window is in scratchpad,
- current tiling tree differs,
- setting changed mid-session.

These can produce contextual results.

## Real bug

The identical logical topology and action:

- targets the wrong unrelated tab,
- crosses source families,
- loses lineage,
- attaches recovery to unrelated X|Y,
- kicks a Clean parent Raw during Ctrl+T when it should stay Clean,
- changes genealogy based only on representation,
- behaves differently due only to a focus race,
- cannot reverse an otherwise valid handoff,
- applies geometry despite geometry memory being OFF.

Those are real bugs.

---

# 53. The "egregor" phenomenon

Advanced users can intentionally build complex topologies.

Example:

```text
Family A
├─ A1 → Clean
│  ├─ A2 → Clean
│  │  └─ A3 → Clean
│  └─ A4 → Raw
├─ A5 → Raw
└─ A6 → Clean

Family B
├─ B1 → Clean
├─ B2 → Raw
└─ B3 → Clean
```

Then:

- source A is in scratchpad,
- source B is visible elsewhere,
- Clean windows span multiple desktops,
- New Tabs Stay Clean changes mid-session,
- geometry memory changes mid-session,
- some members return Raw,
- already-Clean members are skipped during handoff.

The result can be unusual.

Before changing code, ask:

1. Is family identity correct?
2. Is explicit command targeting correct?
3. Is the candidate actually eligible?
4. Is recovery using the correct lineage?
5. Is the oddity merely desktop placement?
6. Is geometry being applied only when enabled?
7. Does the same topology + same command produce the same logical result?

If yes, the system may be complex but coherent.

---

# 54. Recommended ordinary Windows workflow

Typical Windows user:

```text
Clean on launch          OFF
New tabs stay clean      OFF
Remember size & position ON
```

Workflow:

```text
normal browser tab
   ↓ Ctrl+Shift+F
same live page appears Clean
same desktop footprint is requested
   ↓ Ctrl+Shift+F
page returns Raw
```

This should feel like the browser surface transformed rather than like an unrelated popup appeared elsewhere.

---

# 55. Recommended Hyprland workflow

Typical Hyprland user:

```text
Clean on launch          optional
New tabs stay clean      user preference
Remember size & position OFF
```

Advanced workflow:

```text
Scratchpad
└─ normal source browser
   ├─ A
   ├─ B
   ├─ C
   └─ D

Workspace
└─ one Clean family member
```

Then use Previous / Next to hand off the Clean role through eligible Raw members.

Hyprland decides layout.

---

# 56. Multiple-source workflow

Example:

```text
Source Family X
├─ Work A
├─ Work B
└─ Work C

Source Family Y
├─ Media A
├─ Media B
└─ Media C
```

Possible desktop:

```text
Workspace 1
└─ Clean X surface

Workspace 2
└─ Clean Y surface
```

Each Clean surface must navigate only within its own family.

NotF11 does not need profiles or explicit workspace mapping to support this.

---

# 57. Why the unified model scales

The architecture supports:

- one source → one Clean window,
- one source → many Clean windows,
- multiple normal source windows,
- multiple independent families,
- Raw and Clean members coexisting,
- dynamic representation changes,
- Windows geometry preservation,
- Hyprland compositor-owned placement,
- source disappearance,
- new source creation from a Clean workflow,
- advanced scratchpad chains.

It does this without adding:

- separate OS-specific extensions,
- profiles,
- workspace maps,
- family-editing UI,
- tree editors,
- native helper requirements.

---

# 58. Unified acceptance tests

Before releasing the consolidated NotF11 build, run these as real browser tests.

---

## Test A — Basic Raw → Clean → Raw

State:

```text
Normal source
├─ A
├─ B
└─ C
```

Action:

```text
Toggle B Clean
Toggle B Raw
```

Expected:

- same live B,
- B returns to correct family,
- order remains sensible,
- no page recreation.

---

## Test B — Lone tab source

State:

```text
Normal source
└─ A
```

Action:

```text
Toggle A Clean
```

Expected:

- A remains same live tab,
- normal source may disappear,
- Clean session remains valid.

---

## Test C — Lone Clean + new tab, setting OFF

State:

```text
A Clean
source missing
New tabs stay clean = OFF
```

Action:

```text
Ctrl+T
```

Expected:

- A remains Clean,
- B is Raw,
- B belongs to A's family,
- B becomes the legitimate replacement source surface,
- unrelated X|Y is untouched.

Then toggle A Raw.

Expected:

- A rejoins the A/B family,
- A does not land in unrelated X|Y.

---

## Test D — Clean parent + new tab, setting OFF with source alive

Expected:

- parent remains Clean,
- child becomes Raw,
- same family,
- later Previous / Next can reach child.

---

## Test E — Clean parent + new tab, setting ON

Expected:

- parent remains Clean,
- child becomes Clean,
- same family,
- parent is not displaced.

---

## Test F — Raw parent + new tab while setting ON

Expected:

- ordinary Raw Chromium Ctrl+T behavior,
- child remains Raw.

---

## Test G — Previous / Next family handoff

State:

```text
A Clean
B Raw
C Raw
```

Expected:

```text
Next from A → B Clean
A returns Raw
```

Then continue cycling.

Expected:

- correct logical order,
- only same family.

---

## Test H — Already-Clean candidate skip

State:

```text
A Clean
B Raw
C Clean
D Clean
```

Expected:

- cycling from D can select B,
- should not casually steal A or C.

Return C Raw.

Expected:

- C becomes eligible again.

---

## Test I — Two independent families

Create X and Y.

Expected:

- Previous / Next from X never enters Y,
- Previous / Next from Y never enters X.

This is release-critical.

---

## Test J — Source disappearance

State:

```text
A Clean
remembered source closed
unrelated X|Y normal window exists
```

Action:

```text
Toggle A Raw
```

Expected:

- safe normal replacement,
- A becomes Raw,
- X|Y remains unrelated.

---

## Test K — Command target stress

State:

```text
A Clean
B Clean
```

Repeatedly:

```text
focus A → Toggle
focus B → Toggle
```

Expected:

- exact command-event target every time,
- no A/B substitution.

Also stress Previous / Next.

---

## Test L — Clean on launch OFF

Expected:

- ordinary browser launch remains ordinary,
- no surprise Clean surface.

---

## Test M — Clean on launch ON

Expected:

- first eligible browser surface becomes Clean,
- restored browser session does not explode into many Clean windows,
- shortcut safety works.

---

## Test N — Shortcut missing

Unassign Toggle.

Expected:

- Clean on launch is disabled / cannot be unsafely enabled,
- popup explains why,
- ordinary browser remains recoverable.

---

## Test O — Geometry ON

On Windows:

```text
Remember size & position = ON
```

Expected:

- normal → Clean requests same footprint,
- Clean → Raw preserves footprint where platform allows,
- edge cases do not visibly drift beyond reasonable platform behavior.

---

## Test P — Geometry OFF

Expected:

- no geometry create/update logic participates,
- popup placement is left to Windows / compositor,
- no stale geometry is reapplied later.

On Hyprland this is especially important.

---

## Test Q — Setting changed mid-session

Create Clean A.

Change geometry ON ↔ OFF.

Expected:

- current windows are not forcibly moved merely because the checkbox changed,
- new transitions use the new preference.

---

## Test R — Grouped tab

Attempt Toggle on a Chromium grouped tab.

Expected:

- safe guard / unsupported behavior,
- no silent group corruption.

---

## Test S — Untracked popup recovery

Expected:

- safe normal recovery,
- no unrelated window adoption,
- live tab survives.

---

# 59. Debugging decision tree

When behavior appears strange, investigate in this order.

## 1. What exact tab initiated the action?

If keyboard command:

- inspect command-event tab identity first.

## 2. What source family does it belong to?

Identify:

- family,
- remembered source,
- logical order.

## 3. Which family members are Raw?

Previous / Next eligibility depends on this.

## 4. Which family members are already Clean?

They may be intentionally skipped.

## 5. Is the remembered source alive?

If not, recovery semantics apply.

## 6. Was the original source a one-tab window?

If yes, its disappearance may be expected.

## 7. Did a Clean-parent Ctrl+T create a legitimate replacement source?

Do not confuse that with unrelated-window adoption.

## 8. Is the reported problem logical or spatial?

Logical:

- wrong family,
- wrong tab,
- wrong source,
- lost lineage,
- wrong representation.

Spatial:

- unexpected position,
- workspace,
- tile,
- sibling reflow.

## 9. Is Remember size & position ON?

If OFF, geometry intervention itself is suspicious.

If ON, compare requested versus platform-adjusted bounds.

## 10. Can the identical topology reproduce the result?

If not, investigate timing / focus races before adding policy.

---

# 60. Engineering invariants to protect

Treat these as near-locked.

1. **Same live tab, not recreated URL.**
2. **Clean changes surface, not family.**
3. **Source lineage survives Raw ↔ Clean.**
4. **Child from Clean parent inherits coherent source lineage.**
5. **New Tabs Stay Clean changes representation, not genealogy.**
6. **Clean parent remains Clean when creating a child.**
7. **Raw-parent new tabs remain ordinary Raw tabs.**
8. **Already-Clean family members are not casually stolen by cycling.**
9. **Previous / Next stays inside the source family.**
10. **Concrete command target beats later focus query.**
11. **Explicit target never falls through to unrelated focus.**
12. **Missing source does not adopt an unrelated browser window.**
13. **A child created from a lone Clean workflow can become the legitimate replacement source.**
14. **No fake minimized bridge architecture.**
15. **Grouped tabs remain guarded until properly engineered.**
16. **Persistent preferences and runtime lineage state remain separate.**
17. **Clean-on-launch safety depends on actual shortcut assignment.**
18. **Geometry OFF means no geometry interference.**
19. **Geometry ON affects presentation only.**
20. **Desktop placement must never rewrite lineage.**
21. **No native helper is required for the Web Store product.**
22. **Few settings; no policy explosion.**
23. **Do not silently "repair" user-created topology.**

---

# 61. Product-language summary

A concise public explanation:

> **NotF11 moves the same live Chromium tab between a normal browser source and a toolbar-free Clean window. Clean tabs keep their source relationships, so Previous / Next can hand the Clean role to other eligible tabs from the same source family. You can choose whether new tabs created from a Clean workflow also stay Clean, and whether NotF11 should remember window size and position or leave placement entirely to your desktop environment.**

Shorter:

> **Any browser tab, toolbar-free — without losing the live tab behind it.**

Advanced architecture summary:

> **NotF11 preserves browser relationships. Your desktop decides where windows live.**

---

# 62. What not to misunderstand

## NotF11 is not a window manager

Even with geometry memory enabled, it is not responsible for the entire desktop.

## NotF11 is not a workspace router

It should not choose Hyprland workspaces.

## NotF11 is not a FancyZones plugin

FancyZones can complement it, but is not required.

## A Clean tab is not a clone

It is the same live Chromium tab.

## Clean does not mean orphan

The family relationship is remembered.

## A vanished one-tab source is not automatically a failure

It can be a normal consequence of moving the only Raw tab Clean.

## A new Raw child can become a legitimate replacement source

If it came from the same Clean workflow.

## Previous / Next is not global tab cycling

It is source-family Clean handoff.

## Unexpected physical placement does not automatically imply bad lineage

Test relationship correctness separately from desktop placement.

---

# 63. Unified system model

```text
                        CHROMIUM
                           │
                  actual live tab identity
                           │
                           ▼
                   NOTF11 SOURCE FAMILY
                           │
                 remembered lineage + order
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
            RAW                       CLEAN
       normal Chromium            popup Chromium
           surface                   surface
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                 GEOMETRY PREFERENCE
                   /              \
                  /                \
          Remember ON          Remember OFF
           request prior         no placement
            footprint              policy
                  \                /
                   \              /
                           ▼
                OS / WINDOW MANAGER
        Windows / Hyprland / other desktop
```

The central architectural decision is that NotF11 preserves the middle relationship layers without trying to replace the bottom desktop layer.

---

# 64. Historical Tile concepts that remain canonical

The following discoveries from NotF11 Tile now belong to unified NotF11:

- Clean changes surface, not family.
- Source-family lineage is explicit.
- Previous / Next is family handoff.
- Already-Clean members are normally skipped.
- Clean-parent children inherit family lineage.
- Command-event tab targeting is authoritative.
- Explicit targets do not fall through to unrelated focus.
- Missing source recovery must be family-safe.
- Fake minimized bridge strategy should remain removed.
- Runtime relationship state belongs to the browser session.
- Chromium tab groups remain guarded.
- Clean-on-launch shortcut safety matters.
- Spatial placement and logical lineage are separate concerns.
- Hyprland scratchpad can be a powerful user-managed source layer.

These are no longer "Tile-only" semantics.

---

# 65. Historical Tile concepts that are superseded

The following were valid in the separate Tile era but are no longer universal product rules.

## 65.1 Separate product identity

Historical:

```text
NotF11
NotF11 Tile
```

Unified target:

```text
NotF11
```

with environment-sensitive user preferences.

## 65.2 No geometry under any circumstances

Historical Tile:

```text
no forced geometry
```

Unified NotF11:

```text
Remember size & position OFF
    → Tile-like no-geometry behavior

Remember size & position ON
    → OG-like footprint preservation
```

## 65.3 Clean on launch default ON

Historical Tile target:

```text
ON
```

Unified target:

```text
OFF
```

for safer general-purpose onboarding.

## 65.4 Hyprland as product definition

Hyprland remains an important supported workflow.

It no longer defines a separate extension.

---

# 66. Repo / release migration guidance

The unified OG repository should become the canonical active product repository.

Before formally retiring the separate Tile path:

1. validate all unified acceptance tests,
2. validate Windows geometry ON,
3. validate Hyprland geometry OFF,
4. verify new-tab lineage semantics,
5. verify family isolation,
6. verify shortcut targeting,
7. verify source disappearance recovery,
8. publish the unified update,
9. only then archive or clearly deprecate the Tile listing / repository if that remains the chosen release strategy.

Do not destroy the historical Tile repository before the unified build has proven itself in real browser use.

Tile is valuable engineering history and a recovery reference.

---

# 67. Release philosophy

The next engineering work should prefer:

```text
acceptance testing
→ reproducible bug classification
→ narrow semantic fix
```

over:

```text
new feature
→ new toggle
→ new topology policy
```

The product is already powerful because the primitives compose.

Do not confuse complexity of possible user workflows with a need for more product controls.

---

# 68. Guidance for a future AI agent

If continuing NotF11:

1. Treat this unified document as the primary relationship/behavior reference.
2. Read the historical Tile Bible when deeper development history is needed.
3. Start from the latest accepted unified NotF11 build.
4. Do not re-split the product by OS unless a hard browser-platform limitation truly requires it.
5. Reproduce anomalies with uniquely labeled tabs.
6. Separate:
   - tab identity,
   - source-family correctness,
   - Clean/Raw representation,
   - geometry preference,
   - desktop placement.
7. Use command-event tab identity for keyboard operations.
8. Do not adopt unrelated browser windows during recovery.
9. Preserve the lone-Clean replacement-source semantics.
10. Do not force geometry when memory is OFF.
11. Do not treat Hyprland reflow as a lineage failure.
12. Do not let Windows geometry behavior leak into family logic.
13. Keep the product lean.
14. Prefer a semantic fix over a new setting.
15. When in doubt, ask:

> **Is the browser relationship wrong, or is the desktop merely presenting the correct relationship somewhere unexpected?**

And separately:

> **Is geometry changing presentation, or has it accidentally changed semantics?**

---

# 69. Suggested continuation prompt for a future AI agent

> We are continuing the unified NotF11 Chromium extension. Treat `NOTF11_UNIFIED_RELATIONSHIP_BEHAVIOR_BIBLE_2026-09-14.md` as the canonical behavioral reference. Historical NotF11 Tile documents are supporting engineering history, not a separate current product specification. The core rules are: "Clean changes the surface, not the family," "Preserve relationships; do not impose topology," "explicit command target beats later focus," "missing sources never adopt unrelated browser windows," and "Remember size & position affects presentation only." The unified settings are Clean on launch, New tabs stay clean, and Remember size & position. Continue from the latest unified NotF11 build and prioritize acceptance testing before architectural redesign.

---

# 70. Final philosophy

NotF11 is easiest to understand when it is no longer viewed as merely a button that removes browser chrome.

It is a relationship-preserving bridge between:

- Chromium's live tab/window model,
- a small NotF11 source-family model,
- the user's desktop environment.

NotF11 should keep its own responsibility narrow:

> **preserve live browser identity, remember meaningful source relationships, expose Clean surfaces, provide deterministic handoff mechanics, and optionally preserve a window footprint.**

The operating system or window manager remains free to decide:

> **where those windows finally live, how they tile, what workspace contains them, and how desktop topology evolves.**

That separation is not a weakness.

It is what allows one NotF11 extension to serve:

- ordinary Windows users,
- FancyZones users,
- Hyprland users,
- other Chromium desktop environments,

without fragmenting the product into multiple near-identical extensions.

> **NotF11 — Any browser tab, toolbar-free.**
>
> **One relationship engine. One extension. User-controlled placement behavior.**
