---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add Collapse (ADR-0044): it shows or hides content by animating its height, or its width, from a collapsed size. The element is closed while it carries `hidden`, so content shows exactly as the markup says before JavaScript runs. Options: `in`, `orientation`, `collapsedSize`, `timeout` (milliseconds, `auto` or enter and exit values), `easing` and `disablePrefersReducedMotion`; React adds `component`, `mountOnEnter`, `unmountOnExit` and the six transition callbacks. In HTML, `data-ok-collapse-toggle` on a checkbox or a button opens and closes collapses, and the `collapse` runtime emits `ok:collapse:*` events. Nested lists, tree view groups and the content of vertical steppers now open and close with a Collapse animation (new `data-ok-collapse` attributes; no structural change).
