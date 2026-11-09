# Lightbox

Reference: Minimal UI kit "Lightbox" page (one section: a gallery with the `disableZoom`,
`disableVideo`, `disableTotal`, `disableCaptions`, `disableSlideshow`, `disableThumbnails` and
`disableFullscreen` controls; content only). Upstream: yet-another-react-lightbox v3 and its
plugins (Captions, Counter, Download, Fullscreen, Inline, Rotate, Share, Slideshow, Thumbnails,
Video, Zoom), as a behavior and API reference (ADR-0015, ADR-0032). Created with `/component`.
Reference URL: https://minimals.cc/components/extra/lightbox

The upstream is React only (no HTML version): the HTML side is written by us.

## Purpose
Show images and videos over the page, one at a time: open from a gallery, swipe or step between
slides, zoom and pan, rotate, play a slideshow, go fullscreen, download or share, read captions,
jump with thumbnails. A modal `<dialog>` (or an inline `div`) around a Carousel (ADR-0033) that
moves the slides; core `createLightboxController` adds the lightbox behavior and writes its state
for React and the HTML runtime alike.

## Anatomy
```
button[type="button"][data-ok-lightbox-trigger][data-ok-lightbox-open="<id>"][data-ok-index][aria-haspopup="dialog"]
  › img[alt]                                        (any number; React: LightboxTrigger, no -open)
dialog#<id>[data-ok-lightbox][data-ok-theme="dark"][aria-label="Lightbox"]  …options
       (inline: div[data-ok-lightbox][data-ok-inline][data-ok-theme="dark"], no aria-label)
       (+ controller flags: data-ok-ready, data-ok-zoomed, data-ok-zooming, data-ok-pulling,
        data-ok-fullscreen; state: data-ok-captions-hidden, data-ok-thumbnails-hidden)
  section[data-ok-carousel][data-ok-lightbox-carousel][aria-roledescription="carousel"][aria-label="Photo gallery"]
         …carousel attributes implied by the options (loop, duration, autoplay delay, …)
    div[data-ok-carousel-stage]
      div[data-ok-carousel-viewport][tabindex="0"]
        div[data-ok-carousel-container]
          div[role="group"][aria-roledescription="slide"][aria-label="1 of 5"][data-ok-carousel-slide]
             [data-ok-lightbox-slide][data-ok-snapped]?[data-ok-rotation]?[data-ok-image-fit]?
             [data-ok-download="false|<url>"]?[data-ok-download-filename]?[data-ok-share="false"]?
             [data-ok-share-url|-title|-text]?               (inert unless current: controller)
            div[data-ok-lightbox-zoom]                       (the zoom and pan frame)
              img[data-ok-lightbox-image][src][alt][width][height][srcset]?[sizes]?[loading="lazy"][draggable="false"]
              | video[data-ok-lightbox-video][poster][width][height][controls][playsinline][data-ok-autoplay]?
                  › source[src][type][media]? …, track[src][kind][srclang][label] …
              | div[data-ok-lightbox-media][data-ok-zoomable]?   (custom slides)
            h2[data-ok-lightbox-caption="title"]?
            div[data-ok-lightbox-caption="description"]? › div[data-ok-lightbox-description-text]
        span[data-ok-carousel-live][aria-live="polite"][aria-atomic="true"]
      div[data-ok-lightbox-toolbar]
        button[data-ok-icon-button][data-ok-lightbox-zoom-in][aria-label]
        button[data-ok-icon-button][data-ok-lightbox-zoom-out][aria-label]
        button[data-ok-icon-button][data-ok-lightbox-rotate-ccw][aria-label]
        button[data-ok-icon-button][data-ok-lightbox-rotate-cw][aria-label]
        button[data-ok-icon-button][data-ok-carousel-play][data-ok-lightbox-slideshow]
          › svg[data-ok-carousel-play-label="play|pause"] ×2, span[data-ok-carousel-play-label] ×2
        button[data-ok-icon-button][data-ok-lightbox-fullscreen]
          › svg[data-ok-lightbox-label="enter|exit"] ×2, span[data-ok-lightbox-label] ×2
        button[data-ok-icon-button][data-ok-lightbox-download][aria-label]
        button[data-ok-icon-button][data-ok-lightbox-share][aria-label]
        button[data-ok-icon-button][data-ok-lightbox-captions] › svg, span[data-ok-lightbox-label="hide|show"] ×2
        button[data-ok-icon-button][data-ok-lightbox-thumbnails-toggle] › svg, span[data-ok-lightbox-label="hide|show"] ×2
        …custom buttons (React toolbarButtons)
        span[data-ok-lightbox-counter] › span[data-ok-lightbox-counter-current], " / ",
                                         span[data-ok-lightbox-counter-total]
        button[data-ok-icon-button][data-ok-lightbox-close][aria-label]
      button[data-ok-icon-button][data-ok-carousel-prev][data-ok-lightbox-nav][aria-label]
      button[data-ok-icon-button][data-ok-carousel-next][data-ok-lightbox-nav][aria-label]
    div[data-ok-carousel-thumbs][data-ok-lightbox-thumbnails][role="group"][aria-label="Thumbnails"][data-ok-orientation]
      button[type="button"][data-ok-carousel-thumb][aria-label="1 of 5"][aria-current]?[data-ok-rotation]?
        › img[alt=""] (+ span[data-ok-lightbox-thumbnail-play] › svg for videos)
    span[data-ok-lightbox-live][aria-live="polite"][aria-atomic="true"]   (visually hidden)
```
Every toolbar button is always in the markup; the options show or hide them with CSS (so Controls
and parity only change attributes). React parts: `Lightbox`, `LightboxTrigger`.

## Options
<!-- options:lightbox (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-lightbox`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `imageFit` | `data-ok-image-fit="…"` | style | `contain` `cover` | `contain` | How images fill their slide: `contain` (whole image) or `cover` (cropped to fill). |
| `finite` | `data-ok-finite` | flag | boolean | off | The slides don't wrap around: the first and last slides stop. |
| `disableZoom` | `data-ok-disable-zoom` | flag | boolean | off | No zoom: hides the zoom buttons and ignores gestures. |
| `disableTotal` | `data-ok-disable-total` | flag | boolean | off | Hides the counter (`1 / 5`). |
| `disableCaptions` | `data-ok-disable-captions` | flag | boolean | off | Hides the titles and descriptions. |
| `disableSlideshow` | `data-ok-disable-slideshow` | flag | boolean | off | Hides the play / pause button. |
| `disableThumbnails` | `data-ok-disable-thumbnails` | flag | boolean | off | Hides the thumbnails. |
| `disableFullscreen` | `data-ok-disable-fullscreen` | flag | boolean | off | Hides the fullscreen button. |
| `download` | `data-ok-download` | flag | boolean | off | Shows a download button for the current slide. |
| `share` | `data-ok-share` | flag | boolean | off | Shows a share button (Web Share API; hidden where the browser can't share). |
| `rotate` | `data-ok-rotate` | flag | boolean | off | Shows buttons that rotate the current image by quarter turns. |
| `rotateButtons` | `data-ok-rotate-buttons="…"` | style (with `rotate`) | `both` `clockwise` `counterclockwise` | `both` | Rotate buttons: `both`, `clockwise` or `counterclockwise`. |
| `captionsHidden` | `data-ok-captions-hidden` | flag | boolean | off | Captions start hidden (the captions toggle shows them). |
| `captionsShowToggle` | `data-ok-captions-show-toggle` | flag | boolean | off | Shows a toolbar button that hides and shows the captions. |
| `descriptionTextAlign` | `data-ok-description-text-align="…"` | style | `start` `center` `end` | `start` | Alignment of the descriptions: `start`, `center` or `end`. |
| `descriptionMaxLines` | `data-ok-description-max-lines="…"` | number | number | `3` | Lines a description shows before it is cut. |
| `thumbnailsPosition` | `data-ok-thumbnails-position="…"` | style | `bottom` `top` `start` `end` | `bottom` | Where the thumbnails sit: `bottom`, `top`, `start` or `end`. |
| `thumbnailsImageFit` | `data-ok-thumbnails-image-fit="…"` | style | `contain` `cover` | `contain` | How images fill their thumbnail: `contain` or `cover`. |
| `thumbnailsWidth` | `data-ok-thumbnails-width="…"` | number | number | `120` | Thumbnail width (px). |
| `thumbnailsHeight` | `data-ok-thumbnails-height="…"` | number | number | `80` | Thumbnail height (px). |
| `thumbnailsBorder` | `data-ok-thumbnails-border="…"` | number | number | `3` | Thumbnail border width (px). |
| `thumbnailsBorderRadius` | `data-ok-thumbnails-border-radius="…"` | number | number | `10` | Thumbnail corner radius (px). |
| `thumbnailsPadding` | `data-ok-thumbnails-padding="…"` | number | number | `0` | Space inside a thumbnail (px). |
| `thumbnailsGap` | `data-ok-thumbnails-gap="…"` | number | number | `16` | Space between thumbnails (px). |
| `thumbnailsVignette` | `data-ok-thumbnails-vignette="false"` turns it off | behavior | boolean | on | The thumbnails fade out at the edges of their track; `false` turns it off. |
| `thumbnailsHidden` | `data-ok-thumbnails-hidden` | flag | boolean | off | Thumbnails start hidden (the thumbnails toggle shows them). |
| `thumbnailsShowToggle` | `data-ok-thumbnails-show-toggle` | flag | boolean | off | Shows a toolbar button that hides and shows the thumbnails. |
| `slideshowAutoplay` | `data-ok-slideshow-autoplay` | flag | boolean | off | The slideshow starts when the lightbox opens (never with reduced motion). |
| `slideshowDelay` | `data-ok-slideshow-delay="…"` | number | number | `3000` | Slideshow: milliseconds per slide. |
| `fullscreenAuto` | `data-ok-fullscreen-auto` | flag | boolean | off | Enters fullscreen when the lightbox opens. |
| `maxZoomPixelRatio` | `data-ok-max-zoom-pixel-ratio="…"` | number | number | `1` | Largest zoom of an image: image pixels per screen pixel. |
| `zoomInMultiplier` | `data-ok-zoom-in-multiplier="…"` | number | number | `2` | Zoom factor of one zoom step. |
| `doubleClickMaxStops` | `data-ok-double-click-max-stops="…"` | number | number | `2` | Zoom steps a double click or double tap goes through before it zooms out. |
| `keyboardMoveDistance` | `data-ok-keyboard-move-distance="…"` | number | number | `50` | Pixels an arrow key moves a zoomed image. |
| `wheelZoomDistanceFactor` | `data-ok-wheel-zoom-distance-factor="…"` | number | number | `100` | Wheel distance for one zoom step (larger is slower). |
| `scrollToZoom` | `data-ok-scroll-to-zoom` | flag | boolean | off | The mouse wheel zooms without the Ctrl key. |
| `maxZoom` | `data-ok-max-zoom="…"` | number | number | `8` | Largest zoom of custom zoomable slides. |
| `closeOnEscape` | `data-ok-close-on-escape="false"` turns it off | behavior | boolean | on | Escape closes; `false` turns it off. |
| `closeOnBackdropClick` | `data-ok-close-on-backdrop-click` | flag | boolean | off | A click beside the image closes the lightbox. |
| `closeOnPullDown` | `data-ok-close-on-pull-down` | flag | boolean | off | Pulling the slide down closes it. |
| `closeOnPullUp` | `data-ok-close-on-pull-up` | flag | boolean | off | Pulling the slide up closes it. |
| `disableSwipeNavigation` | `data-ok-disable-swipe-navigation` | flag | boolean | off | Swipes and drags don't change slides (buttons, keys and thumbnails still do). |
| `padding` | `data-ok-padding="…"` | number | number (px) or `px` `%` length | `16` | Space around each slide (px or `%`). |
| `spacing` | `data-ok-spacing="…"` | number | number (px) or `px` `%` length | — | Space between slides (px, or `%` of the slide area). Default `30%`. |
| `animationFade` | `data-ok-animation-fade="…"` | number | number | `250` | Fade-in duration on open (ms). |
| `animationSwipe` | `data-ok-animation-swipe="…"` | number | number | `500` | Slide change duration (ms). |
| `animationZoom` | `data-ok-animation-zoom="…"` | number | number | `500` | Zoom animation duration (ms). |
| `inline` | `data-ok-inline` | flag | boolean | off | Shown in the page (a carousel) instead of a modal overlay. |
| `open` | `open` · event `ok:lightbox:close` | state | — | — | Open state (`open` / `onOpenChange`; HTML: a trigger or `open()`). |
| `index` | `data-ok-snapped` · event `ok:lightbox:view` | state | — | — | Current slide (`index` / `onIndexChange`; HTML: `data-ok-index` on triggers, `goTo()`). |
<!-- /options:lightbox -->

Outside the schema (React props; HTML writes them as markup or listens to events):
- `slides`: image slides `{ src, alt, width, height, srcSet, imageFit, rotation, title,
  description, thumbnail, download, share }`, video slides `{ type: "video", sources, poster,
  width, height, tracks, autoPlay, controls, controlsList, crossOrigin, preload, loop, muted,
  playsInline, disablePictureInPicture, disableRemotePlayback, … }` and custom slides (any other
  `type`, rendered by `render.slide`, `zoomable` opts into zoom).
- `open` / `defaultOpen` / `onOpenChange(open, reason)`; `index` / `defaultIndex` /
  `onIndexChange(index)`; `LightboxTrigger index`.
- `labels` (every text; `Slide` and `Zoom level` take `{index}`, `{total}`, `{zoom}`); HTML: the
  text in the markup, and `data-ok-labels` (JSON) for the live region's messages.
- `counterSeparator` (default `" / "`), `video` (defaults of every video, default
  `{ controls: true, playsInline: true }`), `imageProps` (object or `(slide) => props`),
  `toolbarButtons`, `render` (`slide`, `slideHeader`, `slideFooter`, `controls`, `thumbnail`,
  `icon…`), `apiRef`, `customDownload(slide, index)`, `customShare(slide, index)`.
- Callbacks: `onSlideClick`, `onZoomChange`, `onRotate`, `onFullscreenChange`,
  `onSlideshowChange`, `onCaptionsChange`, `onThumbnailsChange`, `onDownload`, `onShare`.

### API mapping (yet-another-react-lightbox → Owlky)
| Upstream | Owlky | Note |
|---|---|---|
| `open`, `index`, `slides`, `labels`, `className`, `render.*` | kept | |
| `close` | `onOpenChange(false, reason)` | project callback shape; reasons `escape`, `backdrop`, `pull`, `close` |
| `on.view` / `on.click` | `onIndexChange` / `onSlideClick` | value-first callbacks |
| `on.entering/entered/exiting/exited` | `onOpenChange` | no exit animation (native dialog) |
| `toolbar.buttons` | `toolbarButtons` (before the counter) | built-in buttons are options |
| `carousel.finite`, `.padding`, `.spacing`, `.imageFit`, `.imageProps` | `finite`, `padding`, `spacing`, `imageFit`, `imageProps` | flattened (ADR-0015) |
| `carousel.preload` | not applicable | native `loading="lazy"` |
| `animation.fade`, `.swipe`, `.zoom` | `animationFade`, `animationSwipe`, `animationZoom` | |
| `animation.navigation`, `animation.easing` | not applicable | the carousel's eased scroll |
| `controller.closeOnPullDown/Up`, `.closeOnBackdropClick`, `.closeOnEscape`, `.disableSwipeNavigation` | kept, flattened | |
| `controller.ref` and plugin refs | `apiRef` (HTML: the instance) | one API |
| `controller.aria`, `.focus`, `.touchAction` | not applicable | always accessible; deprecated upstream |
| `portal`, `noScroll`, `styles` | not applicable | top layer; the modal locks scroll; CSS |
| Captions `hidden`, `showToggle`, `descriptionTextAlign`, `descriptionMaxLines` | `captionsHidden`, `captionsShowToggle`, `descriptionTextAlign`, `descriptionMaxLines` | |
| Counter `separator` / `container` | `counterSeparator` / not applicable | |
| Download `download.download`, slide `download` | `customDownload`, slide `download` | HTML: cancel `ok:lightbox:download` |
| Fullscreen `auto` | `fullscreenAuto` | |
| Inline `inline` | `inline` | |
| Rotate `buttons`, slide `rotation` | `rotateButtons`, slide `rotation` | rotation kept per slide element |
| Share `share.share`, slide `share` | `customShare`, slide `share` | |
| Slideshow `autoplay`, `delay` | `slideshowAutoplay`, `slideshowDelay` | the carousel's autoplay |
| Thumbnails `position`, `width`, `height`, `border`, `borderRadius`, `padding`, `gap`, `imageFit`, `vignette`, `hidden`, `showToggle` | `thumbnails…` | `borderStyle` / `borderColor` not applicable (tokens, CSS) |
| Video slide props and lightbox `video` | kept | + `tracks` (captions, WCAG 1.2) |
| Zoom `maxZoomPixelRatio`, `zoomInMultiplier`, `doubleClickMaxStops`, `keyboardMoveDistance`, `wheelZoomDistanceFactor`, `scrollToZoom`, `maxZoom`, `supports` | kept; `supports` = `zoomable` on custom slides | |
| Zoom `minZoom`, `doubleTapDelay`, `doubleClickDelay`, `pinchZoomDistanceFactor`, `pinchZoomV4` | not applicable | minimum is 1; native `dblclick`; deprecated upstream |
| Minimals `disableZoom`, `disableTotal`, `disableCaptions`, `disableSlideshow`, `disableThumbnails`, `disableFullscreen` | kept | plugins on by default, like the reference |
| Minimals `disableVideo` | not applicable | leave video slides out of `slides` |

Beyond the reference and upstream (accessibility, security, HTML parity): `tracks` on video
slides, a polite live region for zoom levels and failures, `aria-disabled` buttons that keep
focus, URLs checked before downloading or sharing (http, https, blob, image and video `data:`),
`data-ok-labels`.

## States
Written by the controller in both implementations: `inert` on every slide but the current one,
`aria-disabled="true"` on zoom, rotate, download and share buttons that can't act, `hidden` on the
fullscreen and share buttons where the browser can't, and on the navigation with one slide, the
counter's numbers, `data-ok-rotation` on slides and thumbnails, root flags (anatomy), the
carousel's attributes and the thumbnails' `data-ok-orientation` from the options, and private
custom properties: `--_ok-lightbox-scale`, `-x`, `-y` (zoom frame), `-pull`, `-toolbar-width`
(root). The runtime (HTML) and `style` (React) write the numeric options' sizes:
`--_ok-lightbox-padding`, `-spacing`, `-thumb-width|height|border|radius|padding|gap`, `-lines`,
`-fade`, `-zoom-duration`.

## Behavior
- Opening: a trigger (or `open(index)`) opens the modal at its slide without animation, focuses
  the slides, and starts the slideshow (`slideshowAutoplay`, never with reduced motion) and
  fullscreen (`fullscreenAuto`). Closing stops the slideshow, leaves fullscreen, resets the zoom,
  pauses videos and returns focus to the trigger.
- Slides move with the Carousel: swipes, mouse drags, the arrow buttons, thumbnails, keys;
  `finite` stops at the ends; `animationSwipe` sets the duration.
- Zoom (images; custom slides with `zoomable`): toolbar, `+` / `-`, Ctrl / Command + `0`, double
  click and double tap (`doubleClickMaxStops` steps, then back), pinch, Ctrl + wheel (`scrollToZoom`:
  the wheel alone). The largest zoom is the image's natural size × `maxZoomPixelRatio` per device
  pixel; images not larger than their frame don't zoom. Zoomed: drag, arrow keys
  (`keyboardMoveDistance`) and the wheel pan within the image; swiping is off. Changing slides,
  rotating and closing reset it.
- Rotate: quarter turns of the current image (and its thumbnail); the image fits the frame with
  its sides swapped.
- Slideshow: the play button toggles the carousel's autoplay every `slideshowDelay` ms; it keeps
  playing under the pointer and focus, stops at the last slide when `finite`.
- Captions: the title over the top (it ends before the toolbar), the description over the bottom
  (`descriptionMaxLines`); the toggle hides them.
- Download: the slide's `data-ok-download` URL (or its source) under `data-ok-download-filename`
  (or the URL's file name); other origins are fetched (CORS) and saved from a blob; failures are
  announced. Share: `navigator.share({ url, title, text })`; canceling is silent, failures are
  announced.
- Videos: the current video plays when it has `data-ok-autoplay`; others pause.
- Pull to close: a vertical drag of more than 15% of the height (at least 60px) closes.
- `closeOnBackdropClick`: a click on the slide outside its media and captions closes.

## Keyboard
| Key | Action (anywhere in the lightbox, except fields and videos) |
|---|---|
| Right / Left arrow | next / previous slide (mirrored right to left); zoomed: pan |
| Up / Down arrow | zoomed: pan |
| Home / End | first / last slide (not while zoomed) |
| `+` or `=` / `-` | zoom in / out |
| Ctrl or Command + `0` | reset the zoom |
| Escape | close (`closeOnEscape`); the browser leaves fullscreen first |
| Tab | toolbar, navigation and thumbnails (focus stays in the modal) |

## Accessibility
Modal `dialog` named "Lightbox" (the page is inert, Tab stays inside, focus returns to the
trigger); the carousel is a labelled region with "n of total" slides; other slides are `inert`;
toggles name their next action (Enter / Exit Fullscreen, Hide / Show captions, Play / Pause);
buttons that can't act stay focusable with `aria-disabled`; the slideshow has a pause button and
never starts with reduced motion (WCAG 2.2.2); zoom levels and failures are read out politely;
video slides take caption tracks; triggers are named by their image's `alt`. The lightbox is dark
in every theme (`data-ok-theme="dark"`); its text and icons meet AA on its background.

## Events / API
HTML events on the root: `ok:lightbox:beforeopen` (cancelable, `{ index, trigger }`), `open`,
`beforeclose` (cancelable, `{ reason }`), `close` (`reason`: `escape`, `backdrop`, `pull`, `close`,
`api`, `native`), `view` `{ index }`, `click` `{ index }`, `zoom` `{ zoom }`, `rotate`
`{ index, rotation }`, `fullscreen` `{ fullscreen }`, `slideshow` `{ playing }`, `captions` /
`thumbnails` `{ visible }`, `download` / `share` (cancelable, `{ index }`: cancel to replace).
Instance (`runtime.get(root, "lightbox")`) and React `apiRef`: `isOpen`, `index`, `open(index?)`,
`close()`, `prev()`, `next()`, `goTo(index, jump?)`, `zoom`, `maxZoom`, `offsetX`, `offsetY`,
`zoomDisabled`, `zoomIn()`, `zoomOut()`, `changeZoom(zoom, rapid?, dx?, dy?)`, `rotation`,
`rotateClockwise()`, `rotateCounterClockwise()`, `fullscreen`, `fullscreenDisabled`,
`enterFullscreen()`, `exitFullscreen()`, `playing`, `play()`, `pause()`, `captionsVisible`,
`showCaptions()`, `hideCaptions()`, `thumbnailsVisible`, `showThumbnails()`, `hideThumbnails()`,
`download()`, `share()`.

## Responsive
Mobile first: the lightbox covers the viewport; navigation buttons are 40px below 600px and 48px
from 600px; the thumbnails row scrolls (8px padding below 600px, 16px from 600px); the toolbar wraps
and the title shortens with an ellipsis. Inline lightboxes are 3:2 and as wide as their container.

## Parity notes
React renders the initial state (first slide current, counter); the controller writes the rest in
both implementations. HTML triggers carry `data-ok-lightbox-open` (parity ignores it). Load
`lightbox.css` after `carousel.css` (same zero specificity).
