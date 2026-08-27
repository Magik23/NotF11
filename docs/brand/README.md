# NotF11 Icon Suite

Production-ready identity assets for **NotF11**.

> **Any browser tab, toolbar-free.**  
> Turn it into a clean, resizable window.

## Identity story

The icon reads from left to right:

1. The physical **F11** key.
2. A dominant acid-yellow clash breaking conventional fullscreen behavior.
3. A recognizable browser window that remains a normal, clean desktop window.

The clash is intentionally large: it is the event, not a decorative accent.

## Production files

```text
brand/
  notf11-icon-master.svg       Universal editable master
  notf11-icon-small.svg        Optical small-size master
  notf11-icon-dark.svg         Controlled dark-background variant
  notf11-icon-small-dark.svg   Optical dark small-size master
  notf11-icon-mono-black.svg   One-color black mark
  notf11-icon-mono-white.svg   One-color white mark

assets/icons/
  icon-16.png                  Small optical master
  icon-32.png                  Small optical master
  icon-48.png                  Full master
  icon-128.png                 Full master
  icon-256.png                 Large product/website export
  icon-512.png                 High-resolution product export

assets/icons-dark/
  icon-16.png
  icon-32.png
  icon-48.png
  icon-128.png
  icon-256.png
  icon-512.png

store/
  icon-128-store.png           Web Store-safe inner artwork area

previews/
  notf11-preview-light.png
  notf11-preview-dark.png
  notf11-size-test.png
  notf11-dark-alternative.png

manifest-icons.json
```

## Color palette

| Role | Value |
| --- | --- |
| Near black | `#0A0A0A` |
| Warm ivory | `#F7F1E5` |
| Protection edge | `#FFF8E7` |
| Clash yellow | `#F5E500` |

## Manifest use

Merge the `icons` object from `manifest-icons.json` into the extension's `manifest.json`.

The primary PNG set is designed as a universal transparent-background set. A restrained warm-ivory protection edge preserves the black silhouette on dark browser surfaces while remaining unobtrusive on light surfaces.

Do not add an `action` block unless NotF11 intentionally restores a toolbar button. If an action is added later, these same size-matched PNGs can be reused.

## Size strategy

- `128×128` and `48×48` use the full narrative master.
- `32×32` and `16×16` use an optically redrawn compact master with thicker shapes and fewer browser controls.
- `256×256` and `512×512` are high-resolution exports for websites, documentation, and promotional layouts.
- `store/icon-128-store.png` places the mark inside a conservative Web Store-safe inner area.
- Do not recreate the small icons by merely shrinking the 128-pixel PNG.

## Usage guidance

- Use the universal icons for the extension manifest and uncontrolled surfaces.
- Use the light or dark SVG variant only when the surrounding background is known.
- Use monochrome SVGs for embossing, one-color printing, or constrained partner placements.
- Preserve the built-in transparent padding. Do not crop the key, browser, or clash to the canvas edge.
- Do not recolor the clash red; acid yellow distinguishes transformation from security or threat signaling.

## Source

Created for **NotF11** by Pierre Dionne / [Albenoir Studio](https://albenoir.com).
