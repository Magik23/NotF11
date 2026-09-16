# NotF11 v0.1.1 — Localization Smoke Test

Run this after loading the localized release candidate.

## 1. English baseline

With the browser UI language set to English:

- Open the NotF11 popup.
- Confirm settings, buttons, warnings and shortcut labels are English.
- Open built-in Help and confirm all sections are English.
- Run Raw → Clean → Raw once.

## 2. Spanish

Switch the browser UI language to Spanish and fully restart the browser.

Verify:

- Popup text is Spanish.
- Dynamic labels such as Return current tab are Spanish.
- `Saved.` feedback is Spanish.
- Built-in Help is Spanish.
- Manifest/extension description appears localized where Chromium displays it.

## 3. French

Repeat with French.

Focus on long labels and setting descriptions. They should wrap cleanly without clipping or overlapping switches/shortcut badges.

## 4. Japanese or Chinese

Repeat with Japanese, Simplified Chinese or Traditional Chinese.

Verify:

- Characters render correctly.
- No missing-glyph boxes appear.
- Help navigation and cards remain usable.
- Keyboard shortcut text stays readable.

## 5. German or Polish

Repeat with German or Polish to stress longer translated strings.

Verify:

- Popup width/layout remains usable.
- Buttons can grow vertically if needed.
- No text overlaps the toggle switches.
- Help sidebar wrapping remains readable.

## 6. Dynamic warnings

In one non-English language:

- Temporarily unassign a shortcut.
- Confirm the warning is localized.
- Toggle a setting and confirm the localized Saved message appears, then the persistent localized warning returns.
- Test a grouped tab and confirm the unsupported warning is localized.

## 7. Localized background errors

Temporarily remove the main Toggle shortcut and try enabling Clean on launch.

Expected: the rejection/error text is localized, proving background/service-worker messages use Chromium i18n too.

Restore the shortcut afterward.

## 8. Help/privacy

Open Help in at least English, Spanish/French and one CJK language.

Confirm the Privacy section contains the same claims in each language:

- no analytics,
- no telemetry,
- no ads,
- no tracking,
- no account,
- no cloud service,
- no host permissions,
- no content scripts.

## 9. Fallback

Set the browser UI to a language that is not included in `_locales` if practical.

Expected: Chromium falls back to English.

## 10. Regression sanity

Localization must not change NotF11 behavior. Run the normal short pre-store test after localization, especially:

- Raw ↔ Clean
- Previous / Next
- family isolation
- new-tab OFF / ON
- missing-source recovery
- geometry ON / OFF
- grouped-tab guard
- shortcut safety

Do not ship if localization changes runtime behavior.
