# Chromium Clean Window

A lightweight Chromium browser extension for toggling the current live tab between a normal browser window and a clean popup window.

The project is designed primarily for desktop users who want to maximize screen real estate while using window-layout tools such as Microsoft PowerToys FancyZones.

## Current Status

Early development / technical prototype.

The immediate goal is to validate the Chromium APIs required to:

- move an existing live tab into a clean popup window;
- return that same tab to its original browser window;
- preserve page state during the transition;
- restore the clean popup reliably inside a FancyZones workflow.

## Design Principles

- Same live tab — no URL recreation
- Minimal permissions
- No webpage-content inspection
- No DOM injection
- No telemetry
- No cloud dependency
- No virtual-display or GPU manipulation
- Lightweight and auditable
- Chromium-native APIs wherever possible

## Primary Development Target

- Brave Desktop
- Windows 11
- Microsoft PowerToys FancyZones

Compatibility with Google Chrome, Microsoft Edge, and other Chromium-based browsers will be evaluated after the core behavior is proven.

## Project Documentation

The canonical architecture, technical investigation, decisions, and development roadmap are maintained in:

`docs/CHROMIUM_CLEAN_WINDOW_TOGGLE_CANONICAL_AI_HANDOFF_V3.md`

## License

MIT
