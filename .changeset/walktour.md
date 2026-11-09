---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add the Walktour (ADR-0039): guided tours whose steps point at page elements, over an overlay with a rounded spotlight, or behind pulsing beacons. It covers react-joyride's API: steps with `target`, `content`, `title` and `placement` (including `auto` and `center`), `run`, controlled `stepIndex`, `continuous`, `showProgress`, `showSkipButton`, `hideBackButton`, `hideCloseButton`, `disableBeacon`, `disableCloseOnEsc`, `disableOverlay`, `disableOverlayClose`, `spotlightClicks`, `spotlightPadding`, `spotlightRadius`, scrolling options, per-step overrides and `locale`. React reports `onStepChange`, `onStatusChange` and `onEvent` and gives an `apiRef`; in HTML, the `walktour` runtime reads `data-ok-*` options, emits `ok:walktour:beforechange|change|event` and exposes the same methods.
