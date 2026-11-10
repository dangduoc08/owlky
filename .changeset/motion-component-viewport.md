---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Motion: `component` on Motion, MotionGroup and MotionText (any element); in-view `viewportMargin` / `viewportRoot` (HTML `data-ok-viewport-margin`, `data-ok-viewport-root="<id>"`: the observer's `rootMargin` and `root`); viewport events `onViewportEnter` / `onViewportLeave` (HTML `ok:motion:enter` / `leave`, `ok:motion-group:*`, `ok:motion-text:*`, detail `{ ratio }`). Core: `createMotionTrigger` options `margin`, `root`, `onViewport`; `readMotionViewport`. The React refs of the three components are typed `HTMLElement`.
