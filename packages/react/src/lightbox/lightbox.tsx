"use client";

import {
  type CarouselApi,
  createLightboxController,
  formatLabel,
  type LightboxAnatomyOptions,
  type LightboxApi,
  type LightboxCloseReason,
  type LightboxController,
  type LightboxImageFit,
  type LightboxLabels,
  lightboxAttributes,
  lightboxCarouselOptions,
  lightboxLabels,
  lightboxStyle,
  normalizeRotation,
} from "@owlky/core";
import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Carousel,
  CarouselSlide,
  CarouselStage,
  CarouselThumb,
  CarouselThumbs,
  CarouselViewport,
} from "../carousel/carousel.js";
import { IconButton } from "../icon-button/icon-button.js";
import { useMergedRefs } from "../utils/refs.js";
import {
  CaptionsIcon,
  CloseIcon,
  DownloadIcon,
  EnterFullscreenIcon,
  ExitFullscreenIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RotateClockwiseIcon,
  RotateCounterClockwiseIcon,
  ShareIcon,
  ThumbnailsIcon,
  VideoBadgeIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./lightbox-icons.js";

export type { LightboxApi, LightboxCloseReason, LightboxLabels } from "@owlky/core";

/** What every slide may carry (yet-another-react-lightbox slide props and plugin props). */
interface LightboxSlideBase {
  /** React key; default: the source or the index. */
  key?: string | undefined;
  /** Captions: shown over the top of the slide. */
  title?: ReactNode;
  /** Captions: shown over the bottom of the slide (cut after `descriptionMaxLines`). */
  description?: ReactNode;
  /** Thumbnail image URL (default: the image, or the video's poster). */
  thumbnail?: string | undefined;
  /** Download: `false` (not downloadable), a URL, or `{ url, filename }`. Default: the source. */
  download?: boolean | string | { url: string; filename?: string | undefined } | undefined;
  /** Share: `false`, a URL, or `{ url, title, text }` for `navigator.share()`. */
  share?:
    | boolean
    | string
    | { url?: string | undefined; title?: string | undefined; text?: string | undefined }
    | undefined;
}

export interface LightboxImageSlide extends LightboxSlideBase {
  type?: "image" | undefined;
  src: string;
  alt?: string | undefined;
  /** Natural size: sets the image's aspect ratio before it loads (needed with `srcSet`). */
  width?: number | undefined;
  height?: number | undefined;
  /** Other sizes of the image (`srcset`). */
  srcSet?: readonly { src: string; width: number; height?: number | undefined }[] | undefined;
  /** This slide's `imageFit`. */
  imageFit?: LightboxImageFit | undefined;
  /** Initial clockwise rotation in degrees (rounded to quarter turns). */
  rotation?: number | undefined;
}

export interface LightboxVideoSource {
  src: string;
  type: string;
  media?: string | undefined;
}

export interface LightboxVideoOptions {
  autoPlay?: boolean | undefined;
  controls?: boolean | undefined;
  controlsList?: string | undefined;
  crossOrigin?: "anonymous" | "use-credentials" | "" | undefined;
  preload?: "none" | "metadata" | "auto" | "" | undefined;
  loop?: boolean | undefined;
  muted?: boolean | undefined;
  playsInline?: boolean | undefined;
  disablePictureInPicture?: boolean | undefined;
  disableRemotePlayback?: boolean | undefined;
}

export interface LightboxVideoTrack {
  src: string;
  kind?: "captions" | "subtitles" | "descriptions" | "chapters" | "metadata" | undefined;
  srcLang?: string | undefined;
  label?: string | undefined;
  default?: boolean | undefined;
}

export interface LightboxVideoSlide extends LightboxSlideBase, LightboxVideoOptions {
  type: "video";
  sources: readonly LightboxVideoSource[];
  /** Captions and other text tracks (`<track>`). */
  tracks?: readonly LightboxVideoTrack[] | undefined;
  poster?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
}

/** Any other `type`: rendered by `render.slide`. */
export interface LightboxCustomSlide extends LightboxSlideBase {
  type: string;
  /** Zoom works on this slide (up to `maxZoom`). */
  zoomable?: boolean | undefined;
  [key: string]: unknown;
}

export type LightboxSlide = LightboxImageSlide | LightboxVideoSlide | LightboxCustomSlide;

/** Custom renderers (yet-another-react-lightbox `render`). */
export interface LightboxRender {
  /** Renders a custom slide type (or replaces an image / video slide when it returns a node). */
  slide?: ((props: { slide: LightboxSlide; index: number }) => ReactNode) | undefined;
  /** Added before / after the slide's content (position it yourself). */
  slideHeader?: ((props: { slide: LightboxSlide; index: number }) => ReactNode) | undefined;
  slideFooter?: ((props: { slide: LightboxSlide; index: number }) => ReactNode) | undefined;
  /** Extra controls over the slides (position them yourself). */
  controls?: (() => ReactNode) | undefined;
  /** Renders a thumbnail's content (default: its image). */
  thumbnail?: ((props: { slide: LightboxSlide; index: number }) => ReactNode) | undefined;
  iconPrev?: (() => ReactNode) | undefined;
  iconNext?: (() => ReactNode) | undefined;
  iconClose?: (() => ReactNode) | undefined;
  iconZoomIn?: (() => ReactNode) | undefined;
  iconZoomOut?: (() => ReactNode) | undefined;
  iconSlideshowPlay?: (() => ReactNode) | undefined;
  iconSlideshowPause?: (() => ReactNode) | undefined;
  iconEnterFullscreen?: (() => ReactNode) | undefined;
  iconExitFullscreen?: (() => ReactNode) | undefined;
  iconDownload?: (() => ReactNode) | undefined;
  iconShare?: (() => ReactNode) | undefined;
  iconRotateClockwise?: (() => ReactNode) | undefined;
  iconRotateCounterClockwise?: (() => ReactNode) | undefined;
  iconCaptions?: (() => ReactNode) | undefined;
  iconThumbnails?: (() => ReactNode) | undefined;
}

export interface LightboxProps
  extends Omit<HTMLAttributes<HTMLElement>, "onClick" | "children">,
    LightboxAnatomyOptions {
  /** The slides: images (default), videos (`type: "video"`) or custom types (`render.slide`). */
  slides: readonly LightboxSlide[];
  /** Controlled open state (ignored with `inline`). */
  open?: boolean | undefined;
  /** Initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean | undefined;
  /** The lightbox asks to open or close: `"escape"`, `"backdrop"`, `"pull"` or `"close"`. */
  onOpenChange?: ((open: boolean, reason?: LightboxCloseReason) => void) | undefined;
  /** Controlled current slide. */
  index?: number | undefined;
  /** Initial slide when uncontrolled. Default `0`. */
  defaultIndex?: number | undefined;
  /** The current slide changed (yet-another-react-lightbox `on.view`). */
  onIndexChange?: ((index: number) => void) | undefined;
  /** A slide was clicked (`on.click`). */
  onSlideClick?: ((index: number) => void) | undefined;
  onZoomChange?: ((zoom: number) => void) | undefined;
  onRotate?: ((index: number, rotation: number) => void) | undefined;
  onFullscreenChange?: ((fullscreen: boolean) => void) | undefined;
  onSlideshowChange?: ((playing: boolean) => void) | undefined;
  onCaptionsChange?: ((visible: boolean) => void) | undefined;
  onThumbnailsChange?: ((visible: boolean) => void) | undefined;
  /** A slide is being downloaded (`on.download`). */
  onDownload?: ((index: number) => void) | undefined;
  /** A slide is being shared (`on.share`). */
  onShare?: ((index: number) => void) | undefined;
  /** Replaces the default download (`download.download`). */
  customDownload?: ((slide: LightboxSlide, index: number) => void) | undefined;
  /** Replaces the default share (`share.share`). */
  customShare?: ((slide: LightboxSlide, index: number) => void) | undefined;
  /** Texts and translations (`labels`). */
  labels?: Partial<LightboxLabels> | undefined;
  /** Separator of the counter. Default `" / "`. */
  counterSeparator?: string | undefined;
  /** Defaults of every video slide. Default `{ controls: true, playsInline: true }`. */
  video?: LightboxVideoOptions | undefined;
  /** Attributes of every image (or a function of the slide). */
  imageProps?:
    | ImgHTMLAttributes<HTMLImageElement>
    | ((slide: LightboxImageSlide) => ImgHTMLAttributes<HTMLImageElement>)
    | undefined;
  /** Extra toolbar buttons, before the counter and the close button (`toolbar.buttons`). */
  toolbarButtons?: ReactNode;
  render?: LightboxRender | undefined;
  /** The lightbox API (yet-another-react-lightbox `controller.ref` and plugin refs). */
  apiRef?: RefObject<LightboxApi | null> | undefined;
  /** Triggers (`LightboxTrigger`) and other content rendered before the lightbox. */
  children?: ReactNode;
}

interface LightboxContextValue {
  openAt(index: number, trigger: HTMLElement | null): void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

const isVideo = (slide: LightboxSlide): slide is LightboxVideoSlide => slide.type === "video";
const isImage = (slide: LightboxSlide): slide is LightboxImageSlide =>
  slide.type === undefined || slide.type === "image";

/** Download and share settings of a slide as attributes (the controller reads them). */
function slideAttributes(slide: LightboxSlide): Record<string, string> {
  const attributes: Record<string, string> = {};
  const { download, share } = slide;
  if (download === false) attributes["data-ok-download"] = "false";
  else if (typeof download === "string") attributes["data-ok-download"] = download;
  else if (download && typeof download === "object") {
    attributes["data-ok-download"] = download.url;
    if (download.filename) attributes["data-ok-download-filename"] = download.filename;
  }
  if (share === false) attributes["data-ok-share"] = "false";
  else if (typeof share === "string") attributes["data-ok-share-url"] = share;
  else if (share && typeof share === "object") {
    if (share.url) attributes["data-ok-share-url"] = share.url;
    if (share.title) attributes["data-ok-share-title"] = share.title;
    if (share.text) attributes["data-ok-share-text"] = share.text;
  }
  if (isImage(slide)) {
    const rotation = normalizeRotation(slide.rotation ?? 0);
    if (rotation !== 0) attributes["data-ok-rotation"] = String(rotation);
    if (slide.imageFit) attributes["data-ok-image-fit"] = slide.imageFit;
  }
  return attributes;
}

const thumbnailSource = (slide: LightboxSlide): string | undefined =>
  slide.thumbnail ?? (isImage(slide) ? slide.src : isVideo(slide) ? slide.poster : undefined);

/**
 * Lightbox — spec: specs/components/lightbox.md (ADR-0032). A modal `<dialog data-ok-lightbox>`
 * (or an inline carousel with `inline`) around a Carousel of the slides, with a toolbar (zoom,
 * rotate, slideshow, fullscreen, download, share, captions and thumbnails toggles, counter,
 * close), navigation buttons and thumbnails. Behavior is core's `createLightboxController`, which
 * also writes the state into the DOM. Put `LightboxTrigger`s among the children to open it.
 */
export const Lightbox = forwardRef<HTMLElement, LightboxProps>(function Lightbox(
  {
    slides,
    open,
    defaultOpen = false,
    onOpenChange,
    index,
    defaultIndex = 0,
    onIndexChange,
    onSlideClick,
    onZoomChange,
    onRotate,
    onFullscreenChange,
    onSlideshowChange,
    onCaptionsChange,
    onThumbnailsChange,
    onDownload,
    onShare,
    customDownload,
    customShare,
    labels: labelOverrides,
    counterSeparator = " / ",
    video,
    imageProps,
    toolbarButtons,
    render,
    apiRef,
    children,
    // Options
    imageFit,
    finite,
    disableZoom,
    disableTotal,
    disableCaptions,
    disableSlideshow,
    disableThumbnails,
    disableFullscreen,
    download,
    share,
    rotate,
    rotateButtons,
    captionsHidden,
    captionsShowToggle,
    descriptionTextAlign,
    descriptionMaxLines,
    thumbnailsPosition,
    thumbnailsImageFit,
    thumbnailsWidth,
    thumbnailsHeight,
    thumbnailsBorder,
    thumbnailsBorderRadius,
    thumbnailsPadding,
    thumbnailsGap,
    thumbnailsVignette,
    thumbnailsHidden,
    thumbnailsShowToggle,
    slideshowAutoplay,
    slideshowDelay,
    fullscreenAuto,
    maxZoomPixelRatio,
    zoomInMultiplier,
    doubleClickMaxStops,
    keyboardMoveDistance,
    wheelZoomDistanceFactor,
    scrollToZoom,
    maxZoom,
    closeOnEscape,
    closeOnBackdropClick,
    closeOnPullDown,
    closeOnPullUp,
    disableSwipeNavigation,
    padding,
    spacing,
    animationFade,
    animationSwipe,
    animationZoom,
    inline,
    style,
    ...props
  },
  forwardedRef,
) {
  const rootRef = useRef<HTMLElement>(null);
  const ref = useMergedRefs(rootRef, forwardedRef);
  const carouselRef = useRef<CarouselApi | null>(null);
  const controllerRef = useRef<LightboxController | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const labels = lightboxLabels(labelOverrides);

  // Open state (controlled or not; inline lightboxes are always open).
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const openControlled = open !== undefined;
  const isOpen = inline === true || (openControlled ? open : internalOpen);
  // Current slide (controlled or not). The carousel renders the first one it is given.
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const currentIndex = index ?? internalIndex;
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;
  const [startIndex] = useState(() =>
    Math.min(Math.max(Math.round(currentIndex) || 0, 0), Math.max(slides.length - 1, 0)),
  );

  const callbacks = useRef({
    onOpenChange,
    onIndexChange,
    onSlideClick,
    onZoomChange,
    onRotate,
    onFullscreenChange,
    onCaptionsChange,
    onThumbnailsChange,
    onDownload,
    onShare,
    customDownload,
    customShare,
    slides,
    labelOverrides,
  });
  callbacks.current = {
    onOpenChange,
    onIndexChange,
    onSlideClick,
    onZoomChange,
    onRotate,
    onFullscreenChange,
    onCaptionsChange,
    onThumbnailsChange,
    onDownload,
    onShare,
    customDownload,
    customShare,
    slides,
    labelOverrides,
  };

  const setOpen = useCallback(
    (next: boolean, reason?: LightboxCloseReason) => {
      if (!openControlled) setInternalOpen(next);
      if (next) callbacks.current.onOpenChange?.(true);
      else callbacks.current.onOpenChange?.(false, reason);
    },
    [openControlled],
  );
  const setIndex = useCallback(
    (next: number) => {
      if (index === undefined) setInternalIndex(next);
      callbacks.current.onIndexChange?.(next);
    },
    [index],
  );
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;
  const setIndexRef = useRef(setIndex);
  setIndexRef.current = setIndex;

  useLayoutEffect(() => {
    const controller = createLightboxController(rootRef.current as HTMLElement, {
      carousel: () => carouselRef.current,
      onDismiss: (reason) => setOpenRef.current(false, reason),
      onExternalClose: () => setOpenRef.current(false, "close"),
      onView: (next) => {
        indexRef.current = next;
        setIndexRef.current(next);
      },
      onSlideClick: (i) => callbacks.current.onSlideClick?.(i),
      onZoom: (zoom) => callbacks.current.onZoomChange?.(zoom),
      onRotate: (i, rotation) => callbacks.current.onRotate?.(i, rotation),
      onFullscreen: (on) => callbacks.current.onFullscreenChange?.(on),
      onCaptions: (visible) => callbacks.current.onCaptionsChange?.(visible),
      onThumbnails: (visible) => callbacks.current.onThumbnailsChange?.(visible),
      onDownload: (i) => {
        const { customDownload: custom, onDownload: report, slides: list } = callbacks.current;
        report?.(i);
        if (!custom) return undefined;
        custom(list[i] as LightboxSlide, i);
        return false;
      },
      onShare: (i) => {
        const { customShare: custom, onShare: report, slides: list } = callbacks.current;
        report?.(i);
        if (!custom) return undefined;
        custom(list[i] as LightboxSlide, i);
        return false;
      },
      get labels() {
        return callbacks.current.labelOverrides;
      },
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  // Opening and closing follow the state; the slide too while open.
  useLayoutEffect(() => {
    const controller = controllerRef.current as LightboxController;
    if (isOpen) controller.open(indexRef.current, triggerRef.current);
    else controller.close();
  }, [isOpen]);
  useLayoutEffect(() => {
    const controller = controllerRef.current as LightboxController;
    if (isOpen && controller.index !== currentIndex) controller.goTo(currentIndex);
  }, [currentIndex, isOpen]);
  // New or removed slides: re-read them.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the slides change.
  useLayoutEffect(() => {
    controllerRef.current?.sync();
  }, [slides]);

  // The API: the controller, with open / close going through the state.
  useLayoutEffect(() => {
    if (!apiRef) return;
    const controller = controllerRef.current as LightboxController;
    const api = Object.create(controller) as LightboxApi;
    Object.defineProperties(api, {
      open: {
        value: (at?: number) => {
          if (at !== undefined) setIndexRef.current(at);
          if (at !== undefined) indexRef.current = at;
          setOpenRef.current(true);
        },
      },
      close: { value: () => setOpenRef.current(false, "close") },
    });
    (apiRef as { current: LightboxApi | null }).current = api;
    return () => {
      (apiRef as { current: LightboxApi | null }).current = null;
    };
  }, [apiRef]);

  const context = useMemo<LightboxContextValue>(
    () => ({
      openAt(at, trigger) {
        triggerRef.current = trigger;
        indexRef.current = at;
        setIndexRef.current(at);
        if (controllerRef.current?.isOpen) controllerRef.current.goTo(at, true);
        setOpenRef.current(true);
      },
    }),
    [],
  );

  const options: LightboxAnatomyOptions = {
    imageFit,
    finite,
    disableZoom,
    disableTotal,
    disableCaptions,
    disableSlideshow,
    disableThumbnails,
    disableFullscreen,
    download,
    share,
    rotate,
    rotateButtons,
    captionsHidden,
    captionsShowToggle,
    descriptionTextAlign,
    descriptionMaxLines,
    thumbnailsPosition,
    thumbnailsImageFit,
    thumbnailsWidth,
    thumbnailsHeight,
    thumbnailsBorder,
    thumbnailsBorderRadius,
    thumbnailsPadding,
    thumbnailsGap,
    thumbnailsVignette,
    thumbnailsHidden,
    thumbnailsShowToggle,
    slideshowAutoplay,
    slideshowDelay,
    fullscreenAuto,
    maxZoomPixelRatio,
    zoomInMultiplier,
    doubleClickMaxStops,
    keyboardMoveDistance,
    wheelZoomDistanceFactor,
    scrollToZoom,
    maxZoom,
    closeOnEscape,
    closeOnBackdropClick,
    closeOnPullDown,
    closeOnPullUp,
    disableSwipeNavigation,
    padding,
    spacing,
    animationFade,
    animationSwipe,
    animationZoom,
    inline,
  };
  const total = slides.length;
  const videoDefaults: LightboxVideoOptions = { controls: true, playsInline: true, ...video };
  const vertical = thumbnailsPosition === "start" || thumbnailsPosition === "end";
  const slideLabel = (i: number) => formatLabel(labels.Slide, { index: i + 1, total });

  const media = (slide: LightboxSlide, i: number): ReactNode => {
    const custom = render?.slide?.({ slide, index: i });
    if (custom !== undefined && custom !== null) {
      if (isImage(slide) || isVideo(slide)) return custom;
      return (
        <div data-ok-lightbox-media="" data-ok-zoomable={slide.zoomable ? "" : undefined}>
          {custom}
        </div>
      );
    }
    if (isVideo(slide)) {
      const settings = { ...videoDefaults, ...pickVideo(slide) };
      return (
        // biome-ignore lint/a11y/useMediaCaption: captions come from the slide's `tracks`.
        <video
          data-ok-lightbox-video=""
          poster={slide.poster}
          width={slide.width}
          height={slide.height}
          controls={settings.controls}
          controlsList={settings.controlsList}
          crossOrigin={settings.crossOrigin}
          preload={settings.preload}
          loop={settings.loop}
          muted={settings.muted}
          playsInline={settings.playsInline}
          disablePictureInPicture={settings.disablePictureInPicture}
          disableRemotePlayback={settings.disableRemotePlayback}
          data-ok-autoplay={settings.autoPlay ? "" : undefined}
        >
          {slide.sources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} media={source.media} />
          ))}
          {slide.tracks?.map((track) => (
            <track
              key={track.src}
              src={track.src}
              kind={track.kind ?? "captions"}
              srcLang={track.srcLang}
              label={track.label}
              default={track.default}
            />
          ))}
        </video>
      );
    }
    if (isImage(slide)) {
      const extra = typeof imageProps === "function" ? imageProps(slide) : imageProps;
      const srcSet = slide.srcSet?.map((each) => `${each.src} ${each.width}w`).join(", ");
      return (
        <img
          data-ok-lightbox-image=""
          src={slide.src}
          alt={slide.alt ?? ""}
          width={slide.width}
          height={slide.height}
          srcSet={srcSet || undefined}
          sizes={srcSet ? "100vw" : undefined}
          loading="lazy"
          draggable={false}
          {...extra}
        />
      );
    }
    return null;
  };

  const Root = (inline ? "div" : "dialog") as "dialog";
  return (
    <LightboxContext.Provider value={context}>
      {children}
      <Root
        ref={ref as unknown as RefObject<HTMLDialogElement>}
        {...lightboxAttributes(options)}
        data-ok-theme="dark"
        aria-label={inline ? undefined : labels.Lightbox}
        data-ok-runtime="off"
        {...props}
        style={
          {
            ...lightboxStyle({
              padding,
              spacing,
              thumbnailsWidth,
              thumbnailsHeight,
              thumbnailsBorder,
              thumbnailsBorderRadius,
              thumbnailsPadding,
              thumbnailsGap,
              descriptionMaxLines,
              animationFade,
              animationZoom,
            }),
            ...style,
          } as CSSProperties
        }
      >
        <Carousel
          aria-label={labels.Carousel}
          data-ok-lightbox-carousel=""
          startIndex={startIndex}
          apiRef={carouselRef}
          onAutoplayChange={(playing) => onSlideshowChange?.(playing)}
          {...lightboxCarouselOptions({
            finite,
            disableSwipeNavigation,
            slideshowDelay,
            animationSwipe,
          })}
        >
          <CarouselStage>
            <CarouselViewport>
              {slides.map((slide, i) => (
                <CarouselSlide
                  key={slide.key ?? (isImage(slide) ? `${slide.src}-${i}` : String(i))}
                  aria-label={slideLabel(i)}
                  data-ok-lightbox-slide=""
                  {...slideAttributes(slide)}
                >
                  {render?.slideHeader?.({ slide, index: i })}
                  <div data-ok-lightbox-zoom="">{media(slide, i)}</div>
                  {slide.title !== undefined && slide.title !== null && slide.title !== "" && (
                    <h2 data-ok-lightbox-caption="title">{slide.title}</h2>
                  )}
                  {slide.description !== undefined &&
                    slide.description !== null &&
                    slide.description !== "" && (
                      <div data-ok-lightbox-caption="description">
                        <div data-ok-lightbox-description-text="">{slide.description}</div>
                      </div>
                    )}
                  {render?.slideFooter?.({ slide, index: i })}
                </CarouselSlide>
              ))}
            </CarouselViewport>
            <div data-ok-lightbox-toolbar="">
              <IconButton data-ok-lightbox-zoom-in="" aria-label={labels["Zoom in"]}>
                {render?.iconZoomIn?.() ?? <ZoomInIcon />}
              </IconButton>
              <IconButton data-ok-lightbox-zoom-out="" aria-label={labels["Zoom out"]}>
                {render?.iconZoomOut?.() ?? <ZoomOutIcon />}
              </IconButton>
              <IconButton
                data-ok-lightbox-rotate-ccw=""
                aria-label={labels["Rotate counterclockwise"]}
              >
                {render?.iconRotateCounterClockwise?.() ?? <RotateCounterClockwiseIcon />}
              </IconButton>
              <IconButton data-ok-lightbox-rotate-cw="" aria-label={labels["Rotate clockwise"]}>
                {render?.iconRotateClockwise?.() ?? <RotateClockwiseIcon />}
              </IconButton>
              <IconButton data-ok-carousel-play="" data-ok-lightbox-slideshow="">
                {render?.iconSlideshowPlay?.() ?? <PlayIcon data-ok-carousel-play-label="play" />}
                {render?.iconSlideshowPause?.() ?? (
                  <PauseIcon data-ok-carousel-play-label="pause" />
                )}
                <span data-ok-carousel-play-label="play">{labels.Play}</span>
                <span data-ok-carousel-play-label="pause">{labels.Pause}</span>
              </IconButton>
              <IconButton data-ok-lightbox-fullscreen="">
                {render?.iconEnterFullscreen?.() ?? (
                  <EnterFullscreenIcon data-ok-lightbox-label="enter" />
                )}
                {render?.iconExitFullscreen?.() ?? (
                  <ExitFullscreenIcon data-ok-lightbox-label="exit" />
                )}
                <span data-ok-lightbox-label="enter">{labels["Enter Fullscreen"]}</span>
                <span data-ok-lightbox-label="exit">{labels["Exit Fullscreen"]}</span>
              </IconButton>
              <IconButton data-ok-lightbox-download="" aria-label={labels.Download}>
                {render?.iconDownload?.() ?? <DownloadIcon />}
              </IconButton>
              <IconButton data-ok-lightbox-share="" aria-label={labels.Share}>
                {render?.iconShare?.() ?? <ShareIcon />}
              </IconButton>
              <IconButton data-ok-lightbox-captions="">
                {render?.iconCaptions?.() ?? <CaptionsIcon />}
                <span data-ok-lightbox-label="hide">{labels["Hide captions"]}</span>
                <span data-ok-lightbox-label="show">{labels["Show captions"]}</span>
              </IconButton>
              <IconButton data-ok-lightbox-thumbnails-toggle="">
                {render?.iconThumbnails?.() ?? <ThumbnailsIcon />}
                <span data-ok-lightbox-label="hide">{labels["Hide thumbnails"]}</span>
                <span data-ok-lightbox-label="show">{labels["Show thumbnails"]}</span>
              </IconButton>
              {toolbarButtons}
              <span data-ok-lightbox-counter="">
                <span data-ok-lightbox-counter-current="">{total > 0 ? startIndex + 1 : 0}</span>
                {counterSeparator}
                <span data-ok-lightbox-counter-total="">{total}</span>
              </span>
              <IconButton data-ok-lightbox-close="" aria-label={labels.Close}>
                {render?.iconClose?.() ?? <CloseIcon />}
              </IconButton>
            </div>
            <IconButton
              data-ok-carousel-prev=""
              data-ok-lightbox-nav=""
              aria-label={labels.Previous}
              aria-disabled={finite && startIndex <= 0 ? "true" : undefined}
            >
              {render?.iconPrev?.() ?? <PrevIcon />}
            </IconButton>
            <IconButton
              data-ok-carousel-next=""
              data-ok-lightbox-nav=""
              aria-label={labels.Next}
              aria-disabled={finite && startIndex >= total - 1 ? "true" : undefined}
            >
              {render?.iconNext?.() ?? <NextIcon />}
            </IconButton>
            {render?.controls?.()}
          </CarouselStage>
          <CarouselThumbs
            role="group"
            aria-label={labels.Thumbnails}
            data-ok-lightbox-thumbnails=""
            orientation={vertical ? "vertical" : "horizontal"}
          >
            {slides.map((slide, i) => {
              const source = thumbnailSource(slide);
              const rotation = isImage(slide) ? normalizeRotation(slide.rotation ?? 0) : 0;
              return (
                <CarouselThumb
                  key={slide.key ?? (isImage(slide) ? `${slide.src}-${i}` : String(i))}
                  aria-label={slideLabel(i)}
                  data-ok-rotation={rotation !== 0 ? String(rotation) : undefined}
                >
                  {render?.thumbnail?.({ slide, index: i }) ??
                    (source ? <img src={source} alt="" loading="lazy" draggable={false} /> : null)}
                  {isVideo(slide) && (
                    <span data-ok-lightbox-thumbnail-play="">
                      <VideoBadgeIcon />
                    </span>
                  )}
                </CarouselThumb>
              );
            })}
          </CarouselThumbs>
          <span data-ok-lightbox-live="" aria-live="polite" aria-atomic="true" />
        </Carousel>
      </Root>
    </LightboxContext.Provider>
  );
});

function pickVideo(slide: LightboxVideoSlide): LightboxVideoOptions {
  const keys = [
    "autoPlay",
    "controls",
    "controlsList",
    "crossOrigin",
    "preload",
    "loop",
    "muted",
    "playsInline",
    "disablePictureInPicture",
    "disableRemotePlayback",
  ] as const;
  const out: Record<string, unknown> = {};
  for (const key of keys) if (slide[key] !== undefined) out[key] = slide[key];
  return out as LightboxVideoOptions;
}

export interface LightboxTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Slide to open at. Default `0`. */
  index?: number | undefined;
}

/**
 * LightboxTrigger — a button that opens the surrounding `Lightbox` at slide `index`; put the
 * slide's thumbnail (an `img` with `alt`) inside so the button has a name.
 */
export const LightboxTrigger = forwardRef<HTMLButtonElement, LightboxTriggerProps>(
  function LightboxTrigger({ index = 0, onClick, ...props }, ref) {
    const context = useContext(LightboxContext);
    if (!context) throw new Error("[owlky] <LightboxTrigger> must be used inside <Lightbox>.");
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      context.openAt(index, event.currentTarget);
    };
    return (
      <button
        ref={ref}
        type="button"
        data-ok-lightbox-trigger=""
        data-ok-index={String(index)}
        aria-haspopup="dialog"
        onClick={handleClick}
        {...props}
      />
    );
  },
);
