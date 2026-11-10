/*
 * Lightbox behavior (ADR-0032), shared by React and the HTML runtime. The lightbox is a modal
 * `<dialog>` (or an inline `div`) around a Carousel (ADR-0033) that moves the slides; this
 * controller adds what a lightbox needs on top: opening at a slide, the toolbar (zoom, rotate,
 * fullscreen, download, share, captions and thumbnails toggles, counter, close), zoom and pan
 * gestures, pull to close, videos, and the state it writes into the DOM for both owners (current
 * slide `inert` on the others, zoom offsets, rotation, button states). App state stays with the
 * owner: the controller reports intent through callbacks (`onDismiss`).
 */

import {
  type CarouselAnatomyOptions,
  carouselAttributes,
  carouselOptions,
  lightboxOptions,
} from "../anatomy/anatomy.js";
import type { CarouselApi } from "../carousel/carousel-controller.js";
import { createModalController, type ModalController } from "../modal/modal-controller.js";
import { readBehavior, readNumber, readStyle } from "../options/define.js";
import {
  carouselDurationFor,
  clamp,
  clampPan,
  doubleClickZoom,
  fileName,
  formatLabel,
  imageMaxZoom,
  type LightboxCloseReason,
  type LightboxLabels,
  lightboxLabels,
  normalizeRotation,
  safeUrl,
  wheelZoomFactor,
  type ZoomState,
  zoomAround,
} from "./lightbox-model.js";

export interface LightboxControllerOptions {
  /** The Carousel's API (React `apiRef`, HTML runtime instance). */
  carousel: () => CarouselApi | null;
  /** The user asked to close (Escape, a backdrop click, a pull, the close button). */
  onDismiss?(reason: LightboxCloseReason): void;
  /** The browser closed the dialog itself; cleanup already ran. */
  onExternalClose?(): void;
  /** The current slide changed. */
  onView?(index: number): void;
  /** A slide was clicked (not after a drag). */
  onSlideClick?(index: number): void;
  onZoom?(zoom: number): void;
  onRotate?(index: number, rotation: number): void;
  onFullscreen?(fullscreen: boolean): void;
  onCaptions?(visible: boolean): void;
  onThumbnails?(visible: boolean): void;
  /** Before the default download: return `false` to handle it yourself (custom download). */
  onDownload?(index: number, slide: HTMLElement): boolean | undefined;
  /** Before the default share: return `false` to handle it yourself (custom share). */
  onShare?(index: number, slide: HTMLElement): boolean | undefined;
  /** Status texts read out in the live region (`labels` of React; HTML: the root's labels). */
  labels?: Partial<LightboxLabels> | undefined;
  /** Force the modal fallback (tests). */
  forceFallback?: boolean | undefined;
}

export interface LightboxApi {
  /** Whether the lightbox is open. */
  readonly isOpen: boolean;
  /** Current slide. */
  readonly index: number;
  /** Opens at `index` (default: the current slide). Focus returns to `returnFocusTo` on close. */
  open(index?: number, returnFocusTo?: HTMLElement | null): void;
  close(): void;
  /** Shows the previous slide. */
  prev(): void;
  /** Shows the next slide. */
  next(): void;
  /** Shows the slide at `index` (`jump`: without animation). */
  goTo(index: number, jump?: boolean): void;
  /** The zoom level (1: none). */
  readonly zoom: number;
  /** The highest zoom level of the current slide. */
  readonly maxZoom: number;
  /** The horizontal pan of the zoomed slide, in pixels. */
  readonly offsetX: number;
  /** The vertical pan of the zoomed slide, in pixels. */
  readonly offsetY: number;
  /** `true` when the current slide can't zoom. */
  readonly zoomDisabled: boolean;
  /** Zooms in one step. */
  zoomIn(): void;
  /** Zooms out one step. */
  zoomOut(): void;
  /** Sets the zoom; `rapid` skips the animation; `dx` / `dy` are offsets from the center. */
  changeZoom(zoom: number, rapid?: boolean, dx?: number, dy?: number): void;
  /** The rotation of the current slide, in degrees. */
  readonly rotation: number;
  /** Rotates the current slide by 90 degrees clockwise. */
  rotateClockwise(): void;
  /** Rotates the current slide by 90 degrees counterclockwise. */
  rotateCounterClockwise(): void;
  /** Whether the lightbox is in full screen. */
  readonly fullscreen: boolean;
  /** Whether full screen is unavailable (the browser refuses it). */
  readonly fullscreenDisabled: boolean;
  /** Enters full screen. */
  enterFullscreen(): Promise<void>;
  /** Leaves full screen. */
  exitFullscreen(): Promise<void>;
  /** Whether the slideshow plays. */
  readonly playing: boolean;
  /** Starts the slideshow. */
  play(): void;
  /** Pauses the slideshow. */
  pause(): void;
  /** Whether the captions are shown. */
  readonly captionsVisible: boolean;
  /** Shows the captions. */
  showCaptions(): void;
  /** Hides the captions. */
  hideCaptions(): void;
  /** Whether the thumbnails are shown. */
  readonly thumbnailsVisible: boolean;
  /** Shows the thumbnails. */
  showThumbnails(): void;
  /** Hides the thumbnails. */
  hideThumbnails(): void;
  /** Downloads the current slide. */
  download(): Promise<void>;
  /** Shares the current slide (the Web Share API). */
  share(): Promise<void>;
}

export interface LightboxController extends LightboxApi {
  /** Re-reads the options and the slides (called on attribute and slide changes). */
  sync(): void;
  destroy(): void;
}

const ROOT = "[data-ok-lightbox]";
/** Narrowest room (px) a title keeps beside the toolbar before it moves below it. */
const TITLE_ROOM = 96;
const CAROUSEL = "[data-ok-lightbox-carousel]";
const SLIDE = "[data-ok-carousel-slide]";
const ZOOM = "[data-ok-lightbox-zoom]";
const MEDIA = "[data-ok-lightbox-image], [data-ok-lightbox-video], [data-ok-lightbox-media]";
const FIELD =
  "input, textarea, select, video, audio, [contenteditable]:not([contenteditable='false'])";

/** Root flags written by the controller. */
export const LIGHTBOX_FLAGS = {
  ready: "data-ok-ready",
  zoomed: "data-ok-zoomed",
  zooming: "data-ok-zooming",
  pulling: "data-ok-pulling",
  fullscreen: "data-ok-fullscreen",
} as const;

/** Root attributes the controller re-reads when they change. */
export const LIGHTBOX_OBSERVED = Object.values(lightboxOptions.options)
  .map((option) => option.attr)
  .filter((attr) => attr.startsWith("data-ok-") && attr !== "data-ok-snapped");

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const toggle = (element: Element, name: string, on: boolean, value = "") => {
  if (on) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  } else if (element.hasAttribute(name)) element.removeAttribute(name);
};

/** The Carousel options a lightbox's options imply (React spreads them; HTML writes them). */
export function lightboxCarouselOptions(values: {
  finite?: boolean | undefined;
  disableSwipeNavigation?: boolean | undefined;
  slideshowDelay?: number | undefined;
  animationSwipe?: number | undefined;
}): CarouselAnatomyOptions {
  const swipe =
    typeof values.animationSwipe === "number" && values.animationSwipe >= 0
      ? values.animationSwipe
      : 500;
  return {
    loop: values.finite !== true,
    stopOnLastSnap: values.finite === true,
    draggable: values.disableSwipeNavigation !== true,
    duration: carouselDurationFor(swipe),
    autoplayDelay:
      typeof values.slideshowDelay === "number" && values.slideshowDelay >= 0
        ? values.slideshowDelay
        : 3000,
    playOnInit: false,
    stopOnInteraction: false,
    stopOnMouseEnter: false,
    stopOnFocusIn: false,
  };
}

/** Reads the lightbox options that matter to the carousel from the root's attributes. */
function readCarouselValues(root: Element) {
  const o = lightboxOptions.options;
  return {
    finite: root.hasAttribute(o.finite.attr),
    disableSwipeNavigation: root.hasAttribute(o.disableSwipeNavigation.attr),
    slideshowDelay: readNumber(root, o.slideshowDelay) as number,
    animationSwipe: readNumber(root, o.animationSwipe) as number,
  };
}

const CAROUSEL_ATTRIBUTES = [
  ...Object.values(carouselOptions.options)
    .map((option) => option.attr)
    .filter((attr) => attr.startsWith("data-ok-") && attr !== "data-ok-snapped"),
];

/** Writes the carousel attributes implied by the lightbox root (only what differs). */
function syncCarouselAttributes(root: Element, carousel: Element) {
  const wanted = carouselAttributes(lightboxCarouselOptions(readCarouselValues(root))) as Record<
    string,
    string
  >;
  for (const name of CAROUSEL_ATTRIBUTES) {
    const value = wanted[name];
    if (value === undefined) {
      if (carousel.hasAttribute(name)) carousel.removeAttribute(name);
    } else if (carousel.getAttribute(name) !== value) carousel.setAttribute(name, value);
  }
}

/**
 * Connects the lightbox `root` (`[data-ok-lightbox]`): its carousel (`[data-ok-lightbox-carousel]`,
 * driven through `options.carousel()`), toolbar buttons, counter, thumbnails and slides.
 */
export function createLightboxController(
  root: HTMLElement,
  options: LightboxControllerOptions,
): LightboxController {
  const abort = new AbortController();
  const { signal } = abort;
  const doc = root.ownerDocument;
  const o = lightboxOptions.options;
  const own = <E extends Element>(element: E | null): E | null =>
    element && element.closest(ROOT) === root ? element : null;
  const all = <E extends Element = HTMLElement>(selector: string): E[] =>
    [...root.querySelectorAll<E>(selector)].filter((element) => own(element) === element);
  const carouselEl = all(CAROUSEL)[0] ?? null;
  const viewport = carouselEl?.querySelector<HTMLElement>("[data-ok-carousel-viewport]") ?? null;
  const container = carouselEl?.querySelector("[data-ok-carousel-container]") ?? null;
  const slides = (): HTMLElement[] =>
    container
      ? [...container.children].filter((child): child is HTMLElement => child.matches(SLIDE))
      : [];
  const inline = () => root.hasAttribute(o.inline.attr) || root.tagName !== "DIALOG";
  const has = (attr: string) => root.hasAttribute(attr);
  const num = (spec: (typeof o)[keyof typeof o]) =>
    readNumber(root, spec as Parameters<typeof readNumber>[1]) as number;
  const labels = () => lightboxLabels(options.labels);

  let open = false;
  let current = 0;
  let zoom: ZoomState = { zoom: 1, x: 0, y: 0 };
  let maxZoom = 1;
  let fullscreen = false;

  // --- Modal --------------------------------------------------------------------------------

  let modal: ModalController | null = null;
  const modalOptions = () => ({
    contentSelector: CAROUSEL,
    closeOnEscape: readBehavior(root, o.closeOnEscape),
    closeOnBackdrop: root.hasAttribute(o.closeOnBackdropClick.attr),
    onDismiss: (reason: "escape" | "backdrop") => options.onDismiss?.(reason),
    onExternalClose: () => {
      cleanupOnClose();
      options.onExternalClose?.();
    },
    forceFallback: options.forceFallback,
  });
  if (!inline()) modal = createModalController(root, modalOptions());

  // --- Slides and state ------------------------------------------------------------------------

  const slideAt = (index: number) => slides()[index] ?? null;
  const currentSlide = () => slideAt(current);
  const media = (slide: Element | null) => slide?.querySelector<HTMLElement>(MEDIA) ?? null;
  const frameOf = (slide: Element | null) => slide?.querySelector<HTMLElement>(ZOOM) ?? null;
  const isImage = (slide: Element | null) =>
    Boolean(slide?.querySelector("[data-ok-lightbox-image]"));
  const zoomable = (slide: Element | null) =>
    isImage(slide) || Boolean(slide?.querySelector("[data-ok-lightbox-media][data-ok-zoomable]"));
  const thumbOf = (index: number) =>
    all("[data-ok-lightbox-thumbnails] [data-ok-carousel-thumb]")[index] ?? null;
  const rotationOf = (slide: Element | null) =>
    normalizeRotation(slide?.getAttribute("data-ok-rotation") ?? 0);

  const snappedIndex = () => {
    const index = slides().findIndex((slide) => slide.hasAttribute("data-ok-snapped"));
    return Math.max(0, index);
  };

  const announce = (text: string) => {
    for (const live of all("[data-ok-lightbox-live]")) {
      live.textContent = "";
      live.textContent = text;
    }
  };

  const computeMaxZoom = (slide: Element | null): number => {
    if (has(o.disableZoom.attr) || !slide || !zoomable(slide)) return 1;
    const element = media(slide);
    if (element instanceof HTMLImageElement) {
      const quarter = rotationOf(slide) % 180 !== 0;
      return imageMaxZoom(
        quarter ? element.naturalHeight : element.naturalWidth,
        quarter ? element.offsetHeight : element.offsetWidth,
        num(o.maxZoomPixelRatio),
        devicePixelRatio,
      );
    }
    return num(o.maxZoom);
  };
  const minZoom = () => 1;

  const sizes = (slide: Element | null) => {
    const frame = frameOf(slide);
    const element = media(slide);
    const quarter = rotationOf(slide) % 180 !== 0;
    // Only zoomable slides are measured: they have media.
    const width = (element as HTMLElement).offsetWidth;
    const height = (element as HTMLElement).offsetHeight;
    return {
      content: quarter ? { width: height, height: width } : { width, height },
      frame: { width: frame?.clientWidth ?? 0, height: frame?.clientHeight ?? 0 },
    };
  };

  const writeZoom = (rapid = false) => {
    const slide = currentSlide();
    for (const each of slides()) {
      const frame = frameOf(each);
      if (!frame) continue;
      if (each !== slide || zoom.zoom === 1) {
        frame.style.removeProperty("--_ok-lightbox-scale");
        frame.style.removeProperty("--_ok-lightbox-x");
        frame.style.removeProperty("--_ok-lightbox-y");
        continue;
      }
      frame.style.setProperty("--_ok-lightbox-scale", String(Number(zoom.zoom.toFixed(4))));
      frame.style.setProperty("--_ok-lightbox-x", `${Number(zoom.x.toFixed(2))}px`);
      frame.style.setProperty("--_ok-lightbox-y", `${Number(zoom.y.toFixed(2))}px`);
    }
    toggle(root, LIGHTBOX_FLAGS.zooming, rapid);
    toggle(root, LIGHTBOX_FLAGS.zoomed, zoom.zoom > 1);
    syncButtons();
  };

  const setZoom = (next: ZoomState, rapid = false, announced = false) => {
    const changed = next.zoom !== zoom.zoom;
    zoom = next;
    writeZoom(rapid);
    if (changed) {
      options.onZoom?.(zoom.zoom);
      if (announced)
        announce(formatLabel(labels()["Zoom level"], { zoom: Math.round(zoom.zoom * 100) }));
    }
  };

  const zoomTo = (target: number, point = { x: 0, y: 0 }, rapid = false, announced = false) => {
    const slide = currentSlide();
    maxZoom = computeMaxZoom(slide);
    if (maxZoom <= minZoom()) {
      if (zoom.zoom !== 1) setZoom({ zoom: 1, x: 0, y: 0 }, rapid);
      return;
    }
    const value = clamp(target, minZoom(), maxZoom);
    const { content, frame } = sizes(slide);
    setZoom(zoomAround(zoom, value, point, content, frame), rapid, announced);
  };

  const resetZoom = () => {
    if (zoom.zoom !== 1 || zoom.x !== 0 || zoom.y !== 0) setZoom({ zoom: 1, x: 0, y: 0 }, true);
  };

  /** Moves a zoomed image (callers check that it is zoomed). */
  const pan = (dx: number, dy: number, rapid = true) => {
    const { content, frame } = sizes(currentSlide());
    setZoom(clampPan({ zoom: zoom.zoom, x: zoom.x + dx, y: zoom.y + dy }, content, frame), rapid);
  };

  const buttons = (selector: string) => all<HTMLElement>(selector);
  const disable = (selector: string, disabled: boolean) => {
    for (const button of buttons(selector)) toggle(button, "aria-disabled", disabled, "true");
  };

  function syncButtons() {
    const slide = currentSlide();
    maxZoom = computeMaxZoom(slide);
    const noZoom = maxZoom <= minZoom();
    disable("[data-ok-lightbox-zoom-in]", noZoom || zoom.zoom >= maxZoom - 1e-3);
    disable("[data-ok-lightbox-zoom-out]", noZoom || zoom.zoom <= minZoom() + 1e-3);
    const image = isImage(slide);
    disable("[data-ok-lightbox-rotate-cw], [data-ok-lightbox-rotate-ccw]", !image);
    disable("[data-ok-lightbox-download]", slide?.getAttribute("data-ok-download") === "false");
    disable("[data-ok-lightbox-share]", slide?.getAttribute("data-ok-share") === "false");
  }

  const syncCounter = () => {
    const total = slides().length;
    for (const element of all("[data-ok-lightbox-counter-current]")) {
      const text = String(Math.min(current + 1, total));
      if (element.textContent !== text) element.textContent = text;
    }
    for (const element of all("[data-ok-lightbox-counter-total]")) {
      const text = String(total);
      if (element.textContent !== text) element.textContent = text;
    }
  };

  /** The video started on the current slide (autoplay starts it once per visit). */
  let started: HTMLVideoElement | null = null;
  const syncVideos = () => {
    slides().forEach((slide, i) => {
      for (const video of slide.querySelectorAll("video")) {
        if (i !== current || !open) {
          if (started === video) started = null;
          if (!video.paused) video.pause();
        } else if (video.hasAttribute("data-ok-autoplay") && video !== started) {
          started = video;
          video.play()?.catch(() => {
            // Autoplay refused by the browser (sound, data saver): the controls stay available.
          });
        }
      }
    });
  };

  /** Writes the state that follows from the current slide (both owners). */
  const writeCurrent = () => {
    const list = slides();
    list.forEach((slide, i) => {
      toggle(slide, "inert", i !== current);
    });
    // One slide: nothing to navigate to.
    for (const button of buttons("[data-ok-lightbox-nav]"))
      toggle(button, "hidden", list.length < 2);
    syncCounter();
    syncButtons();
    syncVideos();
  };

  const select = (index: number) => {
    if (index === current) return;
    resetZoom();
    current = index;
    writeCurrent();
    options.onView?.(index);
  };

  const syncOptions = () => {
    if (carouselEl) syncCarouselAttributes(root, carouselEl);
    const position = readStyle(root, o.thumbnailsPosition);
    for (const track of all("[data-ok-lightbox-thumbnails]")) {
      const orientation = position === "start" || position === "end" ? "vertical" : "horizontal";
      if (track.getAttribute("data-ok-orientation") !== orientation)
        track.setAttribute("data-ok-orientation", orientation);
    }
    modal?.setOptions(modalOptions());
    if (has(o.disableZoom.attr)) resetZoom();
    if (has(o.disableSlideshow.attr)) options.carousel()?.autoplay.stop();
    syncButtons();
  };

  // --- Fullscreen --------------------------------------------------------------------------------

  const fullscreenSupported = () =>
    Boolean(doc.fullscreenEnabled) && typeof root.requestFullscreen === "function";
  const syncSupport = () => {
    for (const button of buttons("[data-ok-lightbox-fullscreen]"))
      toggle(button, "hidden", !fullscreenSupported());
    for (const button of buttons("[data-ok-lightbox-share]"))
      toggle(
        button,
        "hidden",
        typeof navigator === "undefined" || typeof navigator.share !== "function",
      );
  };
  const enterFullscreen = async () => {
    if (fullscreen || !fullscreenSupported() || has(o.disableFullscreen.attr)) return;
    try {
      await root.requestFullscreen();
    } catch {
      announce(labels()["Fullscreen failed"]);
    }
  };
  const exitFullscreen = async () => {
    if (!fullscreen || doc.fullscreenElement !== root) return;
    try {
      await doc.exitFullscreen();
    } catch {
      // Already left (the user pressed Escape): `fullscreenchange` syncs the state.
    }
  };
  doc.addEventListener(
    "fullscreenchange",
    () => {
      const now = doc.fullscreenElement === root;
      if (now === fullscreen) return;
      fullscreen = now;
      toggle(root, LIGHTBOX_FLAGS.fullscreen, now);
      options.onFullscreen?.(now);
    },
    { signal },
  );

  // --- Captions and thumbnails ---------------------------------------------------------------------

  const setHidden = (attr: string, hidden: boolean, report?: (visible: boolean) => void) => {
    if (has(attr) === hidden) return;
    toggle(root, attr, hidden);
    report?.(!hidden);
  };

  // --- Download and share ----------------------------------------------------------------------------

  const sourceOf = (slide: HTMLElement): string | null => {
    const element = media(slide);
    // The slide's own source (not the `srcset` candidate on screen), like the upstream.
    if (element instanceof HTMLImageElement) return element.getAttribute("src");
    if (element instanceof HTMLVideoElement)
      return element.querySelector("source")?.getAttribute("src") ?? element.getAttribute("src");
    return null;
  };

  const save = async (url: URL, name: string) => {
    const link = doc.createElement("a");
    let objectUrl: string | null = null;
    const sameOrigin =
      url.origin === location.origin || (url.protocol !== "http:" && url.protocol !== "https:");
    if (!sameOrigin) {
      // The `download` attribute is ignored across origins: fetch the file (CORS) instead.
      const response = await fetch(url.href, { mode: "cors" });
      if (!response.ok) throw new Error(String(response.status));
      objectUrl = URL.createObjectURL(await response.blob());
    }
    link.href = objectUrl ?? url.href;
    link.download = name;
    link.rel = "noopener";
    link.hidden = true;
    root.append(link);
    link.click();
    link.remove();
    if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl as string), 1000);
  };

  const download = async () => {
    const slide = currentSlide();
    if (!slide || !has(o.download.attr) || slide.getAttribute("data-ok-download") === "false")
      return;
    if (options.onDownload?.(current, slide) === false) return;
    const custom = slide.getAttribute("data-ok-download");
    const url = safeUrl(custom && custom !== "true" ? custom : sourceOf(slide), doc.baseURI);
    if (!url) {
      announce(labels()["Download failed"]);
      return;
    }
    const name = slide.getAttribute("data-ok-download-filename") || fileName(url);
    try {
      await save(url, name);
    } catch {
      announce(labels()["Download failed"]);
    }
  };

  const share = async () => {
    const slide = currentSlide();
    if (!slide || !has(o.share.attr) || slide.getAttribute("data-ok-share") === "false") return;
    if (options.onShare?.(current, slide) === false) return;
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return;
    const custom = slide.getAttribute("data-ok-share-url");
    const url = safeUrl(custom || sourceOf(slide), doc.baseURI);
    const data: ShareData = {};
    if (url) data.url = url.href;
    const title = slide.getAttribute("data-ok-share-title");
    const text = slide.getAttribute("data-ok-share-text");
    if (title) data.title = title;
    if (text) data.text = text;
    try {
      await navigator.share(data);
    } catch (error) {
      if ((error as { name?: string } | null)?.name !== "AbortError")
        announce(labels()["Sharing failed"]);
    }
  };

  // --- Rotation ------------------------------------------------------------------------------------

  const rotateBy = (quarterTurns: number) => {
    const slide = currentSlide();
    if (!slide || !isImage(slide) || !has(o.rotate.attr)) return;
    const rotation = normalizeRotation(rotationOf(slide) + quarterTurns * 90);
    toggle(slide, "data-ok-rotation", rotation !== 0, String(rotation));
    const thumb = thumbOf(current);
    if (thumb) toggle(thumb, "data-ok-rotation", rotation !== 0, String(rotation));
    resetZoom();
    syncButtons();
    options.onRotate?.(current, rotation);
  };

  // --- Toolbar clicks ------------------------------------------------------------------------------

  const ACTIONS: [string, () => void][] = [
    ["[data-ok-lightbox-close]", () => options.onDismiss?.("close")],
    [
      "[data-ok-lightbox-zoom-in]",
      () => zoomTo(zoom.zoom * num(o.zoomInMultiplier), { x: zoom.x, y: zoom.y }, false, true),
    ],
    [
      "[data-ok-lightbox-zoom-out]",
      () => zoomTo(zoom.zoom / num(o.zoomInMultiplier), { x: zoom.x, y: zoom.y }, false, true),
    ],
    ["[data-ok-lightbox-rotate-cw]", () => rotateBy(1)],
    ["[data-ok-lightbox-rotate-ccw]", () => rotateBy(-1)],
    [
      "[data-ok-lightbox-fullscreen]",
      () => void (fullscreen ? exitFullscreen() : enterFullscreen()),
    ],
    ["[data-ok-lightbox-download]", () => void download()],
    ["[data-ok-lightbox-share]", () => void share()],
    [
      "[data-ok-lightbox-captions]",
      () => setHidden(o.captionsHidden.attr, !has(o.captionsHidden.attr), options.onCaptions),
    ],
    [
      "[data-ok-lightbox-thumbnails-toggle]",
      () => setHidden(o.thumbnailsHidden.attr, !has(o.thumbnailsHidden.attr), options.onThumbnails),
    ],
  ];

  root.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented) return;
      const target = event.target as Element;
      for (const [selector, action] of ACTIONS) {
        const button = own(target.closest(selector));
        if (!button) continue;
        if (button.getAttribute("aria-disabled") !== "true") action();
        return;
      }
      // A click on a slide (the carousel prevents the click that ends a drag). The carousel
      // captures mouse presses, so the click lands on the viewport: use the pressed element.
      const pressed = pressTarget;
      pressTarget = null;
      const origin = pressed && target.contains(pressed) ? pressed : target;
      const slide = own(origin.closest<HTMLElement>(SLIDE));
      if (!slide || slide !== currentSlide()) return;
      options.onSlideClick?.(current);
      if (
        has(o.closeOnBackdropClick.attr) &&
        !origin.closest(`${MEDIA}, [data-ok-lightbox-caption]`)
      )
        options.onDismiss?.("backdrop");
    },
    { signal },
  );

  // --- Keyboard ------------------------------------------------------------------------------------

  root.addEventListener(
    "keydown",
    (event) => {
      if (event.defaultPrevented || event.altKey || !open) return;
      const target = event.target as Element;
      if (target.closest(FIELD)) return;
      const modifier = event.ctrlKey || event.metaKey;
      const rtl = getComputedStyle(root).direction === "rtl";
      const zoomOn = zoom.zoom > 1;
      const step = num(o.keyboardMoveDistance);
      const carousel = options.carousel();
      let handled = true;
      switch (event.key) {
        case "+":
        case "=":
          zoomTo(zoom.zoom * num(o.zoomInMultiplier), { x: zoom.x, y: zoom.y }, false, true);
          break;
        case "-":
          zoomTo(zoom.zoom / num(o.zoomInMultiplier), { x: zoom.x, y: zoom.y }, false, true);
          break;
        case "0":
          if (modifier) zoomTo(1, { x: 0, y: 0 }, false, true);
          else handled = false;
          break;
        case "ArrowLeft":
        case "ArrowRight": {
          if (modifier) {
            handled = false;
            break;
          }
          const forward = (event.key === "ArrowRight") !== rtl;
          if (zoomOn) pan(event.key === "ArrowRight" ? -step : step, 0, false);
          else if (forward) carousel?.scrollNext();
          else carousel?.scrollPrev();
          break;
        }
        case "ArrowUp":
        case "ArrowDown":
          if (zoomOn && !modifier) pan(0, event.key === "ArrowDown" ? -step : step, false);
          else handled = false;
          break;
        // While zoomed, Home and End don't change slides (the carousel would).
        case "Home":
          if (!zoomOn) carousel?.scrollTo(0);
          break;
        case "End":
          if (!zoomOn) carousel?.scrollTo(slides().length - 1);
          break;
        default:
          handled = false;
      }
      if (handled) event.preventDefault();
    },
    // Capture: runs before the carousel's own keys on its viewport (it skips handled events).
    { signal, capture: true },
  );

  // --- Pointer: pan, pinch, double tap, pull to close -----------------------------------------------

  const pointers = new Map<number, { x: number; y: number }>();
  /** The element a press started on (clicks after a captured press land on the viewport). */
  let pressTarget: Element | null = null;
  let gesture:
    | { kind: "pan"; id: number; x: number; y: number }
    | { kind: "pinch"; distance: number; zoom: number }
    | { kind: "pull"; id: number; startX: number; startY: number; dy: number; active: boolean }
    | null = null;
  let lastTap = { time: 0, x: 0, y: 0 };

  const frameCenter = () => {
    const frame = frameOf(currentSlide());
    const box = frame?.getBoundingClientRect();
    return box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: 0, y: 0 };
  };
  const relative = (x: number, y: number) => {
    const center = frameCenter();
    return { x: x - center.x, y: y - center.y };
  };
  const onCurrentSlide = (target: EventTarget | null) => {
    const slide = target instanceof Element ? own(target.closest<HTMLElement>(SLIDE)) : null;
    return slide !== null && slide === currentSlide();
  };
  const pinchDistance = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const pinchMiddle = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : { x: 0, y: 0 };
  };
  const pullAllowed = () => has(o.closeOnPullDown.attr) || has(o.closeOnPullUp.attr);

  root.addEventListener(
    "pointerdown",
    (event) => {
      pressTarget = event.target as Element;
      if (!open || !onCurrentSlide(event.target) || event.button > 0) return;
      if ((event.target as Element).closest(FIELD)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2 && !has(o.disableZoom.attr) && zoomable(currentSlide())) {
        gesture = { kind: "pinch", distance: pinchDistance(), zoom: zoom.zoom };
        event.preventDefault();
        return;
      }
      if (pointers.size > 1) return;
      if (zoom.zoom > 1) {
        // Zoomed: the pointer pans the image (the carousel skips handled presses).
        gesture = { kind: "pan", id: event.pointerId, x: event.clientX, y: event.clientY };
        event.preventDefault();
        try {
          (event.target as Element).setPointerCapture?.(event.pointerId);
        } catch {
          // Synthetic or finished pointers can't be captured; panning still works.
        }
        toggle(root, LIGHTBOX_FLAGS.zooming, true);
        return;
      }
      if (pullAllowed())
        gesture = {
          kind: "pull",
          id: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          dy: 0,
          active: false,
        };
    },
    // Capture: runs before the carousel's drag, which skips presses handled here.
    { signal, capture: true },
  );

  root.addEventListener(
    "pointermove",
    (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (!gesture) return;
      if (gesture.kind === "pinch") {
        const distance = pinchDistance();
        if (gesture.distance > 0 && distance > 0) {
          const middle = pinchMiddle();
          zoomTo(gesture.zoom * (distance / gesture.distance), relative(middle.x, middle.y), true);
        }
      } else if (gesture.kind === "pan" && event.pointerId === gesture.id) {
        pan(event.clientX - gesture.x, event.clientY - gesture.y);
        gesture.x = event.clientX;
        gesture.y = event.clientY;
      } else if (gesture.kind === "pull" && event.pointerId === gesture.id) {
        const dx = event.clientX - gesture.startX;
        const dy = event.clientY - gesture.startY;
        if (!gesture.active) {
          if (Math.abs(dy) < 10 || Math.abs(dy) < Math.abs(dx) * 1.5) return;
          const down = dy > 0;
          if ((down && !has(o.closeOnPullDown.attr)) || (!down && !has(o.closeOnPullUp.attr))) {
            gesture = null;
            return;
          }
          gesture.active = true;
          root.setAttribute(LIGHTBOX_FLAGS.pulling, "");
        }
        gesture.dy = dy;
        root.style.setProperty("--_ok-lightbox-pull", `${Math.round(dy)}px`);
      }
    },
    { signal },
  );

  const endPointer = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) return;
    const start = pointers.get(event.pointerId);
    pointers.delete(event.pointerId);
    const state = gesture;
    if (state?.kind === "pinch") {
      if (pointers.size === 0) {
        gesture = null;
        writeZoom(false);
      }
      return;
    }
    gesture = null;
    if (state?.kind === "pan") {
      writeZoom(false);
      return;
    }
    if (state?.kind === "pull") {
      root.removeAttribute(LIGHTBOX_FLAGS.pulling);
      root.style.removeProperty("--_ok-lightbox-pull");
      if (state.active && event.type === "pointerup") {
        const threshold = Math.max(60, root.clientHeight * 0.15);
        if (Math.abs(state.dy) > threshold) {
          options.onDismiss?.("pull");
          return;
        }
      }
    }
    // Double tap (touch, pen): two quick taps at the same place zoom like a double click.
    if (event.type !== "pointerup" || event.pointerType === "mouse" || !start) return;
    const now = event.timeStamp;
    const near = Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 30;
    if (now - lastTap.time < 300 && near) {
      lastTap = { time: 0, x: 0, y: 0 };
      doubleZoom(event.clientX, event.clientY);
    } else lastTap = { time: now, x: event.clientX, y: event.clientY };
  };
  root.addEventListener("pointerup", endPointer, { signal });
  root.addEventListener("pointercancel", endPointer, { signal });

  const doubleZoom = (x: number, y: number) => {
    if (has(o.disableZoom.attr)) return;
    const slide = currentSlide();
    maxZoom = computeMaxZoom(slide);
    if (maxZoom <= minZoom()) return;
    const next = doubleClickZoom(
      zoom.zoom,
      num(o.zoomInMultiplier),
      num(o.doubleClickMaxStops),
      maxZoom,
    );
    zoomTo(next, next > zoom.zoom ? relative(x, y) : { x: 0, y: 0 }, false, true);
  };

  root.addEventListener(
    "dblclick",
    (event) => {
      if (!open || !onCurrentSlide(event.target)) return;
      if ((event.target as Element).closest(FIELD)) return;
      event.preventDefault();
      doubleZoom(event.clientX, event.clientY);
    },
    { signal },
  );

  let wheelTimer = 0;
  root.addEventListener(
    "wheel",
    (event) => {
      if (!open || !onCurrentSlide(event.target) || has(o.disableZoom.attr)) return;
      const toZoom = event.ctrlKey || event.metaKey || has(o.scrollToZoom.attr);
      if (toZoom && zoomable(currentSlide())) {
        event.preventDefault();
        const factor = wheelZoomFactor(event.deltaY, num(o.wheelZoomDistanceFactor));
        zoomTo(zoom.zoom * factor, relative(event.clientX, event.clientY), true);
      } else if (zoom.zoom > 1) {
        event.preventDefault();
        pan(-event.deltaX, -event.deltaY);
      } else return;
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => writeZoom(false), 150);
    },
    { signal, passive: false },
  );

  // Images that load later change the largest zoom.
  root.addEventListener(
    "load",
    (event) => {
      if (event.target instanceof HTMLImageElement && own(event.target)) syncButtons();
    },
    { signal, capture: true },
  );

  // --- Observers -----------------------------------------------------------------------------------

  const mutations = new MutationObserver((records) => {
    let optionsChanged = false;
    let selection = false;
    for (const record of records) {
      if (record.target === root && record.type === "attributes") optionsChanged = true;
      else if (record.type === "attributes" && record.attributeName === "data-ok-snapped")
        selection = true;
      else if (record.type === "childList") selection = true;
    }
    if (optionsChanged) syncOptions();
    if (selection) {
      const index = snappedIndex();
      // A closed lightbox's carousel re-measures as the dialog hides: that is no view change.
      if (open && index !== current) select(index);
      else writeCurrent();
    }
  });
  mutations.observe(root, { attributes: true, attributeFilter: LIGHTBOX_OBSERVED });
  if (container) {
    mutations.observe(container, {
      attributes: true,
      attributeFilter: ["data-ok-snapped"],
      subtree: true,
      childList: true,
    });
  }

  // Titles end before the toolbar that sits over them.
  const toolbar = all("[data-ok-lightbox-toolbar]")[0] ?? null;
  // A toolbar that leaves no room (narrow screens, many buttons) puts the title below it.
  const syncToolbarWidth = () => {
    if (!toolbar) return;
    const below = toolbar.offsetWidth > root.clientWidth - TITLE_ROOM;
    const values: [string, string][] = [
      ["--_ok-lightbox-toolbar-width", `${below ? 0 : Math.ceil(toolbar.offsetWidth)}px`],
      ["--_ok-lightbox-title-top", `${below ? Math.ceil(toolbar.offsetHeight) : 0}px`],
    ];
    for (const [name, value] of values)
      if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value);
  };
  const resize =
    typeof ResizeObserver === "function"
      ? new ResizeObserver((entries) => {
          syncToolbarWidth();
          if (!entries.some((entry) => entry.target === viewport)) return;
          if (zoom.zoom > 1) zoomTo(zoom.zoom, { x: zoom.x, y: zoom.y }, true);
          else syncButtons();
        })
      : null;
  if (viewport) resize?.observe(viewport);
  if (toolbar) resize?.observe(toolbar);

  // --- Open and close -----------------------------------------------------------------------------

  function cleanupOnClose() {
    open = false;
    options.carousel()?.autoplay.stop();
    void exitFullscreen();
    resetZoom();
    gesture = null;
    pointers.clear();
    syncVideos();
  }

  const goTo = (index: number, jump = false) => {
    const total = slides().length;
    if (total === 0) return;
    const target = clamp(Math.round(index) || 0, 0, total - 1);
    const carousel = options.carousel();
    if (carousel) carousel.scrollTo(target, jump);
    select(target);
  };

  const api: LightboxController = {
    get isOpen() {
      return open;
    },
    get index() {
      return current;
    },
    open(index = current, returnFocusTo) {
      const wasOpen = open;
      if (modal && !modal.isOpen) {
        modal.setOptions(modalOptions());
        modal.open(returnFocusTo);
      }
      open = true;
      const carousel = options.carousel();
      carousel?.reInit();
      goTo(index, true);
      writeCurrent();
      if (!inline() && !wasOpen) viewport?.focus({ preventScroll: true });
      if (wasOpen) return;
      if (has(o.slideshowAutoplay.attr) && !has(o.disableSlideshow.attr) && !reducedMotion())
        carousel?.autoplay.play();
      if (has(o.fullscreenAuto.attr)) void enterFullscreen();
    },
    close() {
      if (!open) return;
      cleanupOnClose();
      modal?.close();
    },
    prev: () => options.carousel()?.scrollPrev(),
    next: () => options.carousel()?.scrollNext(),
    goTo,
    get zoom() {
      return zoom.zoom;
    },
    get maxZoom() {
      return computeMaxZoom(currentSlide());
    },
    get offsetX() {
      return zoom.x;
    },
    get offsetY() {
      return zoom.y;
    },
    get zoomDisabled() {
      return computeMaxZoom(currentSlide()) <= minZoom();
    },
    zoomIn: () => zoomTo(zoom.zoom * num(o.zoomInMultiplier), { x: zoom.x, y: zoom.y }),
    zoomOut: () => zoomTo(zoom.zoom / num(o.zoomInMultiplier), { x: zoom.x, y: zoom.y }),
    changeZoom: (value, rapid = false, dx = 0, dy = 0) => {
      const { content, frame } = sizes(currentSlide());
      maxZoom = computeMaxZoom(currentSlide());
      if (maxZoom <= minZoom()) return;
      setZoom(
        clampPan({ zoom: clamp(value, minZoom(), maxZoom), x: dx, y: dy }, content, frame),
        rapid,
      );
    },
    get rotation() {
      return rotationOf(currentSlide());
    },
    rotateClockwise: () => rotateBy(1),
    rotateCounterClockwise: () => rotateBy(-1),
    get fullscreen() {
      return fullscreen;
    },
    get fullscreenDisabled() {
      return !fullscreenSupported();
    },
    enterFullscreen,
    exitFullscreen,
    get playing() {
      return options.carousel()?.autoplay.isPlaying() ?? false;
    },
    play: () => {
      if (!has(o.disableSlideshow.attr)) options.carousel()?.autoplay.play();
    },
    pause: () => options.carousel()?.autoplay.stop(),
    get captionsVisible() {
      return !has(o.captionsHidden.attr);
    },
    showCaptions: () => setHidden(o.captionsHidden.attr, false, options.onCaptions),
    hideCaptions: () => setHidden(o.captionsHidden.attr, true, options.onCaptions),
    get thumbnailsVisible() {
      return !has(o.thumbnailsHidden.attr);
    },
    showThumbnails: () => setHidden(o.thumbnailsHidden.attr, false, options.onThumbnails),
    hideThumbnails: () => setHidden(o.thumbnailsHidden.attr, true, options.onThumbnails),
    download,
    share,
    sync() {
      syncOptions();
      const index = snappedIndex();
      if (index !== current) select(index);
      else writeCurrent();
    },
    destroy() {
      if (signal.aborted) return;
      abort.abort();
      clearTimeout(wheelTimer);
      mutations.disconnect();
      resize?.disconnect();
      if (open) cleanupOnClose();
      modal?.destroy();
      for (const flag of Object.values(LIGHTBOX_FLAGS)) root.removeAttribute(flag);
      root.style.removeProperty("--_ok-lightbox-toolbar-width");
      root.style.removeProperty("--_ok-lightbox-title-top");
    },
  };

  current = snappedIndex();
  syncOptions();
  syncSupport();
  writeCurrent();
  root.setAttribute(LIGHTBOX_FLAGS.ready, "");
  // Inline lightboxes are always open (yet-another-react-lightbox Inline plugin).
  if (inline()) api.open(current);
  return api;
}
