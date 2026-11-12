import {
  type LightboxImageFit,
  type LightboxRotateButtons,
  type LightboxTextAlign,
  type LightboxThumbnailsPosition,
  lightboxImageFits,
  lightboxRotateButtons,
  lightboxTextAligns,
  lightboxThumbnailsPositions,
} from "../lightbox/lightbox-model.js";
import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Lightbox (ADR-0032) ------------------------------------------------------------------------

export const lightboxOptions = defineOptions("lightbox", "data-ok-lightbox", {
  imageFit: style(
    "data-ok-image-fit",
    lightboxImageFits,
    "contain",
    "How images fill their slide: `contain` (whole image) or `cover` (cropped to fill).",
  ),
  finite: flag("data-ok-finite", "The slides don't wrap around: the first and last slides stop."),
  disableZoom: flag(
    "data-ok-disable-zoom",
    "No zoom: hides the zoom buttons and ignores gestures.",
  ),
  disableTotal: flag("data-ok-disable-total", "Hides the counter (`1 / 5`)."),
  disableCaptions: flag("data-ok-disable-captions", "Hides the titles and descriptions."),
  disableSlideshow: flag("data-ok-disable-slideshow", "Hides the play / pause button."),
  disableThumbnails: flag("data-ok-disable-thumbnails", "Hides the thumbnails."),
  disableFullscreen: flag("data-ok-disable-fullscreen", "Hides the fullscreen button."),
  download: flag("data-ok-download", "Shows a download button for the current slide."),
  share: flag(
    "data-ok-share",
    "Shows a share button (Web Share API; hidden where the browser can't share).",
  ),
  rotate: flag("data-ok-rotate", "Shows buttons that rotate the current image by quarter turns."),
  rotateButtons: style(
    "data-ok-rotate-buttons",
    lightboxRotateButtons,
    "both",
    "Rotate buttons: `both`, `clockwise` or `counterclockwise`.",
    { when: "rotate" },
  ),
  captionsHidden: flag(
    "data-ok-captions-hidden",
    "Captions start hidden (the captions toggle shows them).",
  ),
  captionsShowToggle: flag(
    "data-ok-captions-show-toggle",
    "Shows a toolbar button that hides and shows the captions.",
  ),
  descriptionTextAlign: style(
    "data-ok-description-text-align",
    lightboxTextAligns,
    "start",
    "Alignment of the descriptions: `start`, `center` or `end`.",
  ),
  descriptionMaxLines: number(
    "data-ok-description-max-lines",
    3,
    "Lines a description shows before it is cut.",
    { min: 1 },
  ),
  thumbnailsPosition: style(
    "data-ok-thumbnails-position",
    lightboxThumbnailsPositions,
    "bottom",
    "Where the thumbnails sit: `bottom`, `top`, `start` or `end`.",
  ),
  thumbnailsImageFit: style(
    "data-ok-thumbnails-image-fit",
    lightboxImageFits,
    "contain",
    "How images fill their thumbnail: `contain` or `cover`.",
  ),
  thumbnailsWidth: number("data-ok-thumbnails-width", 120, "Thumbnail width (px).", { min: 0 }),
  thumbnailsHeight: number("data-ok-thumbnails-height", 80, "Thumbnail height (px).", { min: 0 }),
  thumbnailsBorder: number("data-ok-thumbnails-border", 3, "Thumbnail border width (px).", {
    min: 0,
  }),
  thumbnailsBorderRadius: number(
    "data-ok-thumbnails-border-radius",
    10,
    "Thumbnail corner radius (px).",
    { min: 0 },
  ),
  thumbnailsPadding: number("data-ok-thumbnails-padding", 0, "Space inside a thumbnail (px).", {
    min: 0,
  }),
  thumbnailsGap: number("data-ok-thumbnails-gap", 16, "Space between thumbnails (px).", { min: 0 }),
  thumbnailsVignette: behavior(
    "data-ok-thumbnails-vignette",
    true,
    "The thumbnails fade out at the edges of their track; `false` turns it off.",
  ),
  thumbnailsHidden: flag(
    "data-ok-thumbnails-hidden",
    "Thumbnails start hidden (the thumbnails toggle shows them).",
  ),
  thumbnailsShowToggle: flag(
    "data-ok-thumbnails-show-toggle",
    "Shows a toolbar button that hides and shows the thumbnails.",
  ),
  slideshowAutoplay: flag(
    "data-ok-slideshow-autoplay",
    "The slideshow starts when the lightbox opens (never with reduced motion).",
  ),
  slideshowDelay: number("data-ok-slideshow-delay", 3000, "Slideshow: milliseconds per slide.", {
    min: 0,
  }),
  fullscreenAuto: flag("data-ok-fullscreen-auto", "Enters fullscreen when the lightbox opens."),
  maxZoomPixelRatio: number(
    "data-ok-max-zoom-pixel-ratio",
    1,
    "Largest zoom of an image: image pixels per screen pixel.",
    { min: 0 },
  ),
  zoomInMultiplier: number("data-ok-zoom-in-multiplier", 2, "Zoom factor of one zoom step.", {
    min: 1,
  }),
  doubleClickMaxStops: number(
    "data-ok-double-click-max-stops",
    2,
    "Zoom steps a double click or double tap goes through before it zooms out.",
    { min: 0 },
  ),
  keyboardMoveDistance: number(
    "data-ok-keyboard-move-distance",
    50,
    "Pixels an arrow key moves a zoomed image.",
    { min: 0 },
  ),
  wheelZoomDistanceFactor: number(
    "data-ok-wheel-zoom-distance-factor",
    100,
    "Wheel distance for one zoom step (larger is slower).",
    { min: 1 },
  ),
  scrollToZoom: flag("data-ok-scroll-to-zoom", "The mouse wheel zooms without the Ctrl key."),
  maxZoom: number("data-ok-max-zoom", 8, "Largest zoom of custom zoomable slides.", { min: 1 }),
  closeOnEscape: behavior("data-ok-close-on-escape", true, "Escape closes; `false` turns it off."),
  closeOnBackdropClick: flag(
    "data-ok-close-on-backdrop-click",
    "A click beside the image closes the lightbox.",
  ),
  closeOnPullDown: flag("data-ok-close-on-pull-down", "Pulling the slide down closes it."),
  closeOnPullUp: flag("data-ok-close-on-pull-up", "Pulling the slide up closes it."),
  disableSwipeNavigation: flag(
    "data-ok-disable-swipe-navigation",
    "Swipes and drags don't change slides (buttons, keys and thumbnails still do).",
  ),
  padding: number("data-ok-padding", 16, "Space around each slide (px or `%`).", {
    min: 0,
    units: ["px", "%"],
  }),
  spacing: number(
    "data-ok-spacing",
    undefined,
    "Space between slides (px, or `%` of the slide area). Default `30%`.",
    { min: 0, units: ["px", "%"] },
  ),
  animationFade: number("data-ok-animation-fade", 250, "Fade-in duration on open (ms).", {
    min: 0,
  }),
  animationSwipe: number("data-ok-animation-swipe", 500, "Slide change duration (ms).", {
    min: 0,
  }),
  animationZoom: number("data-ok-animation-zoom", 500, "Zoom animation duration (ms).", { min: 0 }),
  inline: flag("data-ok-inline", "Shown in the page (a carousel) instead of a modal overlay."),
  open: state(
    "open",
    "Open state (`open` / `onOpenChange`; HTML: a trigger or `open()`).",
    "close",
  ),
  index: state(
    "data-ok-snapped",
    "Current slide (`index` / `onIndexChange`; HTML: `data-ok-index` on triggers, `goTo()`).",
    "view",
  ),
});

export interface LightboxAnatomyOptions {
  imageFit?: LightboxImageFit | undefined;
  finite?: boolean | undefined;
  disableZoom?: boolean | undefined;
  disableTotal?: boolean | undefined;
  disableCaptions?: boolean | undefined;
  disableSlideshow?: boolean | undefined;
  disableThumbnails?: boolean | undefined;
  disableFullscreen?: boolean | undefined;
  download?: boolean | undefined;
  share?: boolean | undefined;
  rotate?: boolean | undefined;
  rotateButtons?: LightboxRotateButtons | undefined;
  captionsHidden?: boolean | undefined;
  captionsShowToggle?: boolean | undefined;
  descriptionTextAlign?: LightboxTextAlign | undefined;
  descriptionMaxLines?: number | undefined;
  thumbnailsPosition?: LightboxThumbnailsPosition | undefined;
  thumbnailsImageFit?: LightboxImageFit | undefined;
  thumbnailsWidth?: number | undefined;
  thumbnailsHeight?: number | undefined;
  thumbnailsBorder?: number | undefined;
  thumbnailsBorderRadius?: number | undefined;
  thumbnailsPadding?: number | undefined;
  thumbnailsGap?: number | undefined;
  thumbnailsVignette?: boolean | undefined;
  thumbnailsHidden?: boolean | undefined;
  thumbnailsShowToggle?: boolean | undefined;
  slideshowAutoplay?: boolean | undefined;
  slideshowDelay?: number | undefined;
  fullscreenAuto?: boolean | undefined;
  maxZoomPixelRatio?: number | undefined;
  zoomInMultiplier?: number | undefined;
  doubleClickMaxStops?: number | undefined;
  keyboardMoveDistance?: number | undefined;
  wheelZoomDistanceFactor?: number | undefined;
  scrollToZoom?: boolean | undefined;
  maxZoom?: number | undefined;
  closeOnEscape?: boolean | undefined;
  closeOnBackdropClick?: boolean | undefined;
  closeOnPullDown?: boolean | undefined;
  closeOnPullUp?: boolean | undefined;
  disableSwipeNavigation?: boolean | undefined;
  padding?: number | string | undefined;
  spacing?: number | string | undefined;
  animationFade?: number | undefined;
  animationSwipe?: number | undefined;
  animationZoom?: number | undefined;
  inline?: boolean | undefined;
}

/**
 * `data-ok-*` attributes of a lightbox root (`<dialog>`, or a `div` when `inline`). Behaviors are
 * written only when turned off.
 */
export function lightboxAttributes(options: LightboxAnatomyOptions = {}): DataAttributes {
  const attributes = optionAttributes(lightboxOptions, { ...options });
  const { options: spec } = lightboxOptions;
  if (options.thumbnailsVignette === false) attributes[spec.thumbnailsVignette.attr] = "false";
  if (options.closeOnEscape === false) attributes[spec.closeOnEscape.attr] = "false";
  return attributes;
}
