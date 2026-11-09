# ADR-0033: Carousel — native scroll snapping, one controller in core, loop by reordering

**Status:** Accepted (2026-11-08)

## Context
The reference's "Carousel" page shows 16 Embla Carousel demos (align, progress, opacity, scale,
fade, parallax, autoplay, auto scroll, thumbnails on both axes, variable widths, auto height,
vertical axis, numbered dots, slide content animation, custom controls). Embla has a framework-free
core, but the owner chose our own implementation (2026-11-08): no new runtime dependency, one
behavior core for React and HTML, strict CSP, WCAG 2.2 AA. Embla (v8, the reference's version, and
the v9 docs) is a behavior and API reference only; no code is copied. The owner wants every Embla
option and plugin the reference relies on, in one review.

Embla moves a transformed track and, for `loop`, translates individual slides around. Doing the
same would need JavaScript for any scrolling at all, its own touch physics and its own scroll
chaining. A carousel built on a native scroll container gets touch swiping, momentum, trackpads,
scroll chaining and reduced-motion handling from the browser, and still works without JavaScript.

## Decision
1. **A native scroll container with CSS scroll snapping.** `[data-ok-carousel-viewport]` scrolls
   (`overflow: auto`, hidden scrollbar, `scroll-snap-type: x|y mandatory`), slides are flex items of
   `[data-ok-carousel-container]` with a `gap`. Without JavaScript the slides still swipe and snap.
   The controller sets each slide's snap alignment and margin through private custom properties
   (CSSOM) so that the browser's snap points equal the computed ones: groups (`slidesToScroll`),
   `align` (`start | center | end | number` and, in React, a function), `containScroll`
   (`trimSnaps` collapses positions clamped to the edges, `keepSnaps` keeps them, `false` adds
   leading / trailing space so every slide can reach its alignment).
2. **One controller in core** (`createCarouselController`) reads the options from the root's
   attributes (React writes the same attributes), measures, computes the snap list, and does what
   the browser can't: animated `scrollTo` with Embla's `duration`, mouse dragging (`dragFree`,
   `skipSnaps`, `dragThreshold`), wheel gestures, arrow keys, `startIndex`, `breakpoints` (media
   query → options), autoplay, auto scroll, auto height, fade, and the tween effects (opacity,
   scale, parallax). Touch keeps the browser's own panning: `skipSnaps: false` is
   `scroll-snap-stop: always`, `dragFree` turns snapping off.
3. **Derived state is written by the controller, in both implementations.** The selected snap is a
   function of the scroll position, which the browser owns (like the Tabs scroll flags). The
   controller writes `data-ok-snapped` / `data-ok-in-view` on slides, `aria-current` on dots and
   thumbnails, `aria-disabled` on arrows, the counter and live-region text, and progress, tween and
   order values as private custom properties. React renders the initial state (from
   `startIndex`) and never renders those attributes again; it only re-renders the dots when the
   number of snaps changes (`onReInit`). HTML and React therefore produce the same DOM by
   construction.
4. **Loop without clones.** Cloned slides would be read twice by screen readers and could be
   focused twice. Instead the controller rotates the visual order with the CSS `order` property
   (`--_ok-carousel-order`) so the selected slide always has room on both sides, and moves the
   scroll position by the same distance in the same frame (no visible jump). The DOM order, the
   reading order and the tab order stay 1…N. It recenters when scrolling settles and, during long
   flings, auto scroll and drags, as soon as an edge comes near. Loop needs content at least one
   viewport plus two steps long; shorter carousels fall back to `loop: false` (Embla also falls
   back, with a looser limit), and the root shows `data-ok-looping` only while looping.
5. **Fade stacks the slides** in one grid cell; the viewport doesn't scroll, swipes and drags step
   between slides, and slides that aren't selected are `visibility: hidden` once faded out, so they
   are neither visible nor focusable nor read.
6. **API mapping (ADR-0015).** Embla options keep their names as props and `data-ok-*`
   attributes (`loop`, `align`, `axis`, `direction` = the `dir` attribute, `dragFree`, `draggable`
   (v8 `watchDrag`), `dragThreshold`, `slidesToScroll`, `containScroll`, `startIndex`, `skipSnaps`,
   `duration`, `inViewThreshold`, `active`, `breakpoints`, `focus`). Plugins become options:
   `autoplay` (+ `autoplayDelay`, `autoplayJump`, `playOnInit`, `stopOnInteraction`,
   `stopOnMouseEnter`, `stopOnFocusIn`, `stopOnLastSnap`), `autoScroll` (+ `autoScrollSpeed`,
   `autoScrollStartDelay`, `autoScrollDirection`), `effect="fade"` (Fade), `autoHeight`
   (+ `heightEvent`), `wheelGestures` (+ `forceWheelAxis`), and Class Names become state attributes
   (`data-ok-snapped`, `data-ok-in-view`, `data-ok-dragging`, `data-ok-looping`). Minimals' own
   additions keep their names: `slidesToShow` (number, percentage or `auto`, per breakpoint
   `xs`…`xl`), `slideSpacing`. The Embla API methods (v8 names: `scrollNext`, `scrollTo`,
   `canScrollPrev`, `selectedScrollSnap`, `scrollProgress`, `slidesInView`, `reInit`…) are the HTML
   instance and React `apiRef`; events are `ok:carousel:<event>` and value-first React callbacks
   (`onSelect(index, previous)`).
7. **Accessibility follows the WAI-ARIA APG carousel pattern**: the root is a labelled
   `region` with `aria-roledescription="carousel"`, slides are `group`s with
   `aria-roledescription="slide"` and "N of M" labels, controls are native buttons (arrows stay
   focusable at the ends with `aria-disabled`), a polite live region announces slides moved by the
   user (never by autoplay), autoplay and auto scroll pause on hover, stop on focus and on
   interaction, never start under `prefers-reduced-motion`, and a play / pause button is part of
   the anatomy (WCAG 2.2.2). The scrolling viewport is focusable and answers the arrow keys, Home
   and End.

## Consequences
- No new dependency; about 9.5 kB of the CDN bundle and 2 kB of CSS (gzip), measured with
  `pnpm check:size`.
- Snap points are the browser's: rounding can differ by a pixel between engines, so tests assert
  selection and ranges, not exact scroll offsets.
- Loop needs enough content (decision 4); very short loops fall back to a bounded carousel.
- Mouse dragging and wheel gestures are ours; touch, pen and trackpad panning are native and feel
  like the platform rather than like Embla.
- Settling is a 120 ms debounce after the last scroll event (Safari 17 has no `scrollend`), the same
  in every engine.
