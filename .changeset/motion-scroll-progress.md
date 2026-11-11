---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Motion 5.2, scroll progress (Framer Motion's `useScroll`): Linear and Circular progress follow a scroll position. React: the `scroll` prop (`true` for the page, or `{ container, target, axis, offset }` with refs or ids) and the `useScroll()` hook (`scrollX`, `scrollY`, `scrollXProgress`, `scrollYProgress`). HTML: `data-ok-scroll-progress`, `data-ok-scroll-axis`, `data-ok-scroll-container`, `data-ok-scroll-target`, `data-ok-scroll-offset` on the progress, and the `scroll-progress` runtime (instance `progress`, `mode`, `update()`); `observeScroll` is exported. The page's progress runs on CSS scroll timelines without JavaScript; containers and targets use native `ScrollTimeline` / `ViewTimeline` where supported and a script fallback elsewhere (Firefox, `data-ok-fallback`). Scroll progresses are decorative (`aria-hidden`, no value). Core: `createScrollProgress`, `observeScroll`, `measureScroll`, `parseScrollOffset`, `readScrollProgress`, `supportsScrollTimeline`, `scrollProgressAttributes`; `animate()` takes `timeline`, `rangeStart` and `rangeEnd` (scroll-driven animations are never committed and ignore reduced motion). Behavior changes: LinearProgress and CircularProgress are now client components (`"use client"`); `runningAnimations` (exits) skips paused and scroll-driven animations.
