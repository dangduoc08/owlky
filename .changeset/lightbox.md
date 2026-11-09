---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add the Lightbox (ADR-0032): a modal dialog around the Carousel that shows images, videos and custom slides one at a time, with one behavior controller for React and HTML. It covers yet-another-react-lightbox and its plugins: captions, counter, download, fullscreen, inline, rotate, share, slideshow, thumbnails, video and zoom (buttons, keys, double click and tap, pinch, wheel, pan), plus pull and backdrop closing. React: `Lightbox` and `LightboxTrigger`. In HTML, the `lightbox` runtime opens from `data-ok-lightbox-open` triggers, emits `ok:lightbox:*` events and exposes the lightbox API on its instance. The Carousel's key and pointer handlers now skip events an owner already handled.
