# ADR-0032: Lightbox — a modal dialog around the Carousel, one controller in core

**Status:** Accepted (2026-11-09)

## Context
The reference's "Lightbox" page shows a gallery that opens yet-another-react-lightbox with its
Captions, Counter, Fullscreen, Slideshow, Thumbnails, Video and Zoom plugins (Minimals turns each
off with a `disable…` control). The owner wants every upstream feature, including the Download,
Inline, Rotate and Share plugins. The upstream is React only, so the HTML side is written by us;
no code is copied. Owlky already has the parts a lightbox is made of: the modal controller
(native `<dialog>` with a fallback), IconButton, and the Carousel (ADR-0033) with swiping, loops,
thumbnails, autoplay, keys and a live region.

## Decision
1. **Composition.** The lightbox is a modal `<dialog data-ok-lightbox>` (core
   `createModalController`) or, with `inline`, a `div`, around a Carousel
   (`[data-ok-lightbox-carousel]`) whose slides fill the view. The Carousel moves the slides
   (swipe, mouse drag, arrows, thumbnails, keys, `finite` = no loop, `animationSwipe` = its
   `duration`) and runs the slideshow (its autoplay, with hover, focus and interaction pauses off).
   Toolbar buttons are IconButtons; the dialog is always dark (`data-ok-theme="dark"`).
2. **One controller in core** (`createLightboxController`) reads the options from the root's
   attributes, writes the carousel attributes they imply, and adds the lightbox's own behavior:
   opening at a slide, zoom and pan (buttons, keys, double click and tap, pinch, wheel), rotation,
   fullscreen, download, share, captions and thumbnails toggles, the counter, pull to close, the
   backdrop click and videos. It reports intent (`onDismiss(reason)`) and never closes on its own.
3. **Derived state is written by the controller in both implementations**, like the Carousel's:
   `inert` on every slide but the current one, button states (`aria-disabled`, `hidden`), the
   counter, rotation, zoom offsets (CSSOM), root flags. React renders the initial state only.
4. **Every toolbar button is always in the markup** and the options show or hide it with CSS, so
   options are attributes only (Controls, options parity). Buttons that can't act stay focusable
   with `aria-disabled`; toggles name their next action with two visually hidden labels.
5. **Upstream API (ADR-0015)**, flattened: plugin options become prefixed props
   (`thumbnailsPosition`, `slideshowDelay`, `captionsShowToggle`…), `controller.*` and
   `carousel.*` options become props, refs become one `apiRef` / HTML instance, `close` becomes
   `onOpenChange(false, reason)`, `on.view` `onIndexChange`. Minimals' `disable…` props keep their
   names; every plugin the reference uses is on by default. Not applicable: `portal` (top layer),
   `noScroll` (the modal locks scroll), `styles` (CSS), `carousel.preload` (native lazy images),
   `animation.easing`, `disableVideo` (leave video slides out).
6. **Security:** URLs from attributes are only handed to a link or `navigator.share` after
   `safeUrl` (http, https, blob, image and video `data:`); cross-origin downloads are fetched with
   CORS and saved from a blob; failures are announced, never thrown.

## Consequences
- Two small changes in the Carousel controller: its key and pointer handlers skip events an owner
  already handled (`defaultPrevented`), so a zoomed image pans instead of changing slides.
- `lightbox.css` must load after `carousel.css` (same zero specificity).
- Zoom limits come from the images' natural sizes: images without `width` / `height` only zoom
  once loaded; images not larger than the screen don't zoom (as upstream).
- Rotation is kept per slide element (upstream keys it by image source).
- About 4 kB of the CDN bundle and 1.5 kB of CSS (gzip); no dependency.
