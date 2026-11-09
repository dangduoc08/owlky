---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add the Carousel (ADR-0033): a native scroll-snapping viewport with one behavior controller for React and HTML. It covers Embla Carousel's options and plugins: loop (without cloned slides), align, vertical axis, right to left, drag free, skip snaps, slides to scroll, contain scroll, start index, duration, breakpoints, autoplay, auto scroll, fade, opacity / scale / parallax effects, auto height, wheel gestures and state attributes. Parts: `CarouselStage`, `CarouselViewport`, `CarouselSlide`, `CarouselArrows` (basic, floating, number), `CarouselDots` (circular, rounded, number), `CarouselProgress` (scroll, autoplay), `CarouselThumbs` / `CarouselThumb` and `CarouselPlayButton`. In HTML, the `carousel` runtime emits `ok:carousel:*` events and exposes Embla's methods on its instance.
