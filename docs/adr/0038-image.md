# ADR-0038: Image — native lazy loading, the load state as a data attribute

**Status:** Accepted (2026-11-09)

## Context
The reference's "Image" page (sections List, Aspect ratio, Overlay) is Minimals' own `Image`
component, a wrapper around `react-lazy-load-image-component` (MIT, React only): an
IntersectionObserver (or scroll listener) delays the `src`, a placeholder shows until the
picture loads, then the picture fades in with an `effect` (`blur`, `opacity`,
`black-and-white`); `ratio` crops the picture to an aspect ratio and `slotProps.overlay` paints
a layer over it. There is no framework-free version: the owner chose to write the HTML side
ourselves, native first. The roadmap listed Image under "Needs an ADR" because the upstream is a
runtime dependency and the load state needs JavaScript.

## Decision
1. **No dependency: native lazy loading.** The picture is a plain `<img>` with
   `loading="lazy"` (default) and `decoding="async"`; the browser defers it. The upstream's
   observer options (`threshold`, `delayTime`, `delayMethod`, `scrollPosition`,
   `useIntersectionObserver`, `beforeLoad`) are not applicable. `visibleByDefault` maps to
   `loading="eager"` with no placeholder and no effect.
2. **Markup that works without JavaScript.** `span[data-ok-image] › span[data-ok-image-placeholder]?
   › span[data-ok-image-overlay]? › img`. A `span` root keeps the image valid inside links and
   buttons (cards, lightbox triggers). Ratios, fit, position and overlays are CSS from
   attributes (allowlists, no free CSS values): a page without JavaScript shows every picture.
3. **The load state is `data-ok-state`** (`loading` · `loaded` · `error`), written by the owner:
   React from the image's `load` / `error` events and `complete` after hydration, the HTML
   runtime `image` from the same events and `complete` at setup (an image that settled before
   the runtime started). CSS hides the picture and shows the placeholder only while
   `[data-ok-state="loading"]`, and under `@media (scripting: none)` the picture always shows
   (React's server markup carries `loading`). Snippets never carry a state.
4. **Errors keep the text alternative.** A broken picture stays in the accessibility tree
   (`opacity: 0`, not `hidden`), the placeholder stays, and a decorative broken-image icon
   (`svg[data-ok-image-icon]`) is added: React renders it, the HTML runtime builds it with DOM
   methods.
5. **Effects are transitions, reduced motion honored.** `blur` (the reference default), `opacity`,
   `black-and-white`, `none`, timed with `--ok-duration-*` tokens; `prefers-reduced-motion`
   removes the transitions.

## Consequences
- No new runtime dependency; the HTML runtime is a few hundred bytes.
- Lazy loading follows the browser's distance thresholds, not a configurable `threshold`.
- Arbitrary aspect ratios and overlay gradients aren't options: eleven common ratios and the
  palette colors (`overlay`, `overlayFrom`) are; anything else is the consumer's CSS on the root
  or on `[data-ok-image-overlay]`.
- Components that show pictures can compose Image (Markdown's `images="image"`).
