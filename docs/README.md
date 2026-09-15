# NotF11 Documentation

This folder contains the canonical documentation for the unified NotF11 Chromium extension.

NotF11 is now one product:

> **NotF11 — Any browser tab, toolbar-free.**

The former NotF11 Tile work is treated as historical engineering input to the unified relationship model rather than a separate current product specification.

---

# Documents

## `NOTF11_EXTENSION_PAGE.md`

Public-facing product explanation.

Use it as source material for:

- GitHub copy,
- Chrome Web Store description,
- website/project page,
- user-facing feature documentation.

It should stay concise enough for users and should not become the primary engineering specification.

---

## `NOTF11_UNIFIED_RELATIONSHIP_BEHAVIOR_BIBLE.md`

Canonical engineering / behavioral specification.

This is the primary reference for:

- Raw / Clean semantics,
- source families,
- new-tab ancestry,
- Previous / Next behavior,
- source disappearance,
- geometry policy,
- Windows / Hyprland boundaries,
- recovery invariants,
- future AI/developer handoff.

When code behavior and older Tile documentation disagree, investigate against this unified document first.

---

## `NOTF11_RELEASE_ACCEPTANCE_CHECKLIST.md`

Real-browser release gate.

Run it before:

- changing the Chrome Web Store package,
- tagging a new release,
- declaring the unified OG + Tile consolidation complete.

Relationship failures such as cross-family handoff or unrelated-window adoption are release blockers.

Normal compositor reflow is not automatically a bug.

---

# Repository-level document

## `../PRIVACY.md`

Public privacy policy.

It documents:

- no page-content access,
- no host permissions,
- no analytics / telemetry,
- local storage use,
- runtime relationship state,
- geometry data when enabled.

Keep this document synchronized with the manifest and actual runtime behavior.

---

# Canonical priority

When documentation appears to conflict, use this order:

```text
1. Actual accepted release behavior
2. NOTF11_UNIFIED_RELATIONSHIP_BEHAVIOR_BIBLE.md
3. NOTF11_RELEASE_ACCEPTANCE_CHECKLIST.md
4. NOTF11_EXTENSION_PAGE.md
5. Historical Tile / older handoff documents
```

If actual behavior differs from the Bible, reproduce and classify the behavior before changing either code or documentation.

---

# Core rules

```text
Clean changes the surface, not the family.

Preserve relationships; do not impose topology.

Explicit command target beats later focus.

Missing sources never adopt unrelated browser windows.

Remember size & position affects presentation only.
```

---

# Product boundary

NotF11 owns:

- the live browser tab transition,
- source-family relationships,
- Raw / Clean representation,
- Previous / Next family handoff,
- optional footprint memory.

The desktop environment owns:

- final placement,
- workspace,
- tiling,
- scratchpad,
- compositor grouping.

That separation allows one extension to support ordinary Windows workflows and tiling environments such as Hyprland without fragmenting the product.
