# NotF11 v0.1.1 — Localization Change Report

## Runtime changes

- Added Chromium native i18n with `default_locale: en`.
- Added 16 locales under `_locales/`.
- Localized manifest description and command descriptions.
- Localized popup settings, actions, warnings, errors, accessibility labels and feedback.
- Localized the complete built-in Help/documentation page.
- Localized user-visible background/service-worker error messages that can surface in the popup.
- Preserved all existing permissions; `storage` remains the only explicit permission.
- No host permissions, content scripts, analytics, telemetry or network service were added.

## Files changed

- `manifest.json`
- `background.js`
- `popup.html`
- `popup.js`
- `help.html`

## Files added

- `i18n.js`
- `_locales/<locale>/messages.json` for 16 locales

## Files intentionally unchanged

- `popup.css`
- `help.css`
- icons/assets
- canonical English `PRIVACY.md`
- engineering/internal docs

## Privacy strategy

All user-facing privacy copy in the popup/Help/Store materials is localized. The full English `PRIVACY.md` remains the single canonical policy to avoid legal-policy drift across 16 maintained copies.

## Version

The release candidate manifest is bumped from `0.1.0` to `0.1.1`.
