---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Dialog and Drawer exit transitions (ADR-0062): closing plays the exit first (the Dialog paper fades and scales out, a Motion paper plays its entrance backwards, the Drawer slides back to its edge, the backdrop fades), then the dialog closes and focus returns. Behavior change: `ok:dialog:close` and `ok:drawer:close` now fire after the exit animation (synchronously only when nothing animates, such as with reduced motion), and `open()` during the exit keeps the dialog open without a close event. Core `createModalController`: `close()` returns a promise, new `isClosing` and `exit` option. Dialog `transitionDuration` (roadmap 4.18.44, MUI): a number or `{ enter, exit }` in ms; HTML `data-ok-transition-duration` and `data-ok-transition-duration-exit`; core `dialogStyle`, `dialogDurations`, `readDialogTransitionDuration`.
