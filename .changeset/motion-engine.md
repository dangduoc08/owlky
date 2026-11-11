---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Motion full version, step 5.1 (ADR-0062, beta): an animation engine on the Web Animations API. `animate(element, keyframes, options)` (core, re-exported by `@owlky/react` and `@owlky/html`) plays Framer Motion-style keyframes (`x`, `y`, `scale`, `rotate` and any CSS property) with durations in ms, easings per segment, `times`, `repeat`, `repeatType`, `repeatDelay` and springs (`type: "spring"` with `stiffness` / `damping` / `mass` or `duration` + `bounce`, sampled into `linear()` easing, with a fallback curve where it isn't supported). Interrupted properties start from their current value, end values stay as inline styles, reduced motion jumps to the end. Motion takes custom `keyframes` and `transition` (HTML `data-ok-keyframes` / `data-ok-transition`, JSON). Exits before removal: React `MotionPresence` (`initial`, `mode`, `onExitComplete`), HTML motion instances `exit()`, `hide()` and `remove()`. The Motion "Logo" story now shows the reference's shape-morphing rings and turning disc.
