"use client";

import {
  type CarouselAlign,
  type CarouselAnatomyOptions,
  type CarouselApi,
  type CarouselArrowsVariant,
  type CarouselColor,
  type CarouselController,
  type CarouselDotsVariant,
  type CarouselPlacement,
  type CarouselProgressVariant,
  carouselArrowsAttributes,
  carouselAttributes,
  carouselDotsAttributes,
  carouselProgressAttributes,
  carouselStyle,
  carouselThumbsAttributes,
  createCarouselController,
  estimateSnapCount,
  type Orientation,
  parseSlidesToScroll,
  responsiveValues,
} from "@owlky/core";
import {
  type ButtonHTMLAttributes,
  Children,
  type CSSProperties,
  createContext,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, type ButtonAsButtonProps } from "../button/button.js";
import { IconButton } from "../icon-button/icon-button.js";
import { useMergedRefs } from "../utils/refs.js";

export type { CarouselApi } from "@owlky/core";

interface CarouselContextValue {
  snapCount: number;
  startIndex: number;
  loop: boolean;
  slidesToScroll: number;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);
const SlideContext = createContext<{ index: number; count: number } | null>(null);
const ThumbContext = createContext<number>(0);

const useCarousel = (): CarouselContextValue =>
  useContext(CarouselContext) ?? { snapCount: 0, startIndex: 0, loop: false, slidesToScroll: 1 };

export interface CarouselProps
  extends Omit<HTMLAttributes<HTMLElement>, "onSelect" | "onScroll" | "draggable">,
    Omit<CarouselAnatomyOptions, "align"> {
  /** Where the selected slides sit: `start`, `center` (default), `end`, a fraction 0–1 of the viewport, or a function `(viewSize, snapSize, index) => offset`. */
  align?: CarouselAlign | undefined;
  /** Receives the carousel API (Embla's methods) once mounted. */
  apiRef?: RefObject<CarouselApi | null> | undefined;
  /** The selected snap changed. */
  onSelect?: ((index: number, previous: number) => void) | undefined;
  /** Scrolling came to rest on snap `index`. */
  onSettle?: ((index: number) => void) | undefined;
  /** Scroll progress 0–1, once per frame while scrolling. */
  onScroll?: ((progress: number) => void) | undefined;
  /** The slides in view changed. */
  onSlidesInView?: ((indexes: number[]) => void) | undefined;
  /** The carousel measured again: the number of snaps. */
  onReInit?: ((snapCount: number) => void) | undefined;
  /** Autoplay started or stopped. */
  onAutoplayChange?: ((playing: boolean) => void) | undefined;
  /** Auto scroll started or stopped. */
  onAutoScrollChange?: ((playing: boolean) => void) | undefined;
  /** An element inside slide `index` got keyboard focus. */
  onSlideFocus?: ((index: number) => void) | undefined;
  /** Names the carousel (required by the carousel pattern), for example "Featured articles". */
  "aria-label"?: string | undefined;
  children?: ReactNode;
}

/** Slides of the first `CarouselViewport` among `children` (for the dots before the first measure). */
function countSlides(children: ReactNode): number | undefined {
  let found: number | undefined;
  Children.forEach(children, (child) => {
    if (found !== undefined || !isValidElement<{ children?: ReactNode }>(child)) return;
    if (child.type === CarouselViewport)
      found = Children.toArray(child.props.children).filter(isValidElement).length;
    else found = countSlides(child.props.children);
  });
  return found;
}

/**
 * Carousel — spec: specs/components/carousel.md (ADR-0033). A labelled `section` with
 * `aria-roledescription="carousel"`; scrolling, snapping and every control are wired by core's
 * `createCarouselController`, which also writes the selected state into the DOM.
 */
export const Carousel = forwardRef<HTMLElement, CarouselProps>(function Carousel(
  {
    align,
    axis,
    containScroll,
    effect,
    loop,
    dragFree,
    skipSnaps,
    autoHeight,
    heightEvent,
    wheelGestures,
    forceWheelAxis,
    draggable,
    focus,
    active,
    startIndex = 0,
    slidesToScroll,
    slidesToShow,
    slideSpacing,
    duration,
    dragThreshold,
    inViewThreshold,
    autoplay,
    autoplayDelay,
    autoplayJump,
    autoScroll,
    autoScrollSpeed,
    autoScrollStartDelay,
    autoScrollDirection,
    playOnInit,
    stopOnInteraction,
    stopOnMouseEnter,
    stopOnFocusIn,
    stopOnLastSnap,
    breakpoints,
    apiRef,
    onSelect,
    onSettle,
    onScroll,
    onSlidesInView,
    onReInit,
    onAutoplayChange,
    onAutoScrollChange,
    onSlideFocus,
    style,
    children,
    ...props
  },
  ref,
) {
  const rootRef = useRef<HTMLElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);
  const controllerRef = useRef<CarouselController | null>(null);
  const [measured, setMeasured] = useState<number | null>(null);
  const callbacks = useRef({
    onSelect,
    onSettle,
    onScroll,
    onSlidesInView,
    onReInit,
    onAutoplayChange,
    onAutoScrollChange,
    onSlideFocus,
  });
  callbacks.current = {
    onSelect,
    onSettle,
    onScroll,
    onSlidesInView,
    onReInit,
    onAutoplayChange,
    onAutoScrollChange,
    onSlideFocus,
  };
  const alignRef = useRef(align);
  alignRef.current = align;

  useLayoutEffect(() => {
    const controller = createCarouselController(rootRef.current as HTMLElement, {
      align: () => (typeof alignRef.current === "function" ? alignRef.current : undefined),
      onSelect: (index, previous) => callbacks.current.onSelect?.(index, previous),
      onSettle: (index) => callbacks.current.onSettle?.(index),
      onScroll: (progress) => callbacks.current.onScroll?.(progress),
      onSlidesInView: (indexes) => callbacks.current.onSlidesInView?.(indexes),
      onReInit: (count) => {
        setMeasured(count);
        callbacks.current.onReInit?.(count);
      },
      onAutoplay: (playing) => callbacks.current.onAutoplayChange?.(playing),
      onAutoScroll: (playing) => callbacks.current.onAutoScrollChange?.(playing),
      onSlideFocus: (index) => callbacks.current.onSlideFocus?.(index),
    });
    controllerRef.current = controller;
    if (apiRef) (apiRef as { current: CarouselApi | null }).current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
      if (apiRef) (apiRef as { current: CarouselApi | null }).current = null;
    };
  }, [apiRef]);

  // A function `align` isn't an attribute: measure again when it changes.
  const alignFunction = typeof align === "function" ? align : undefined;
  const firstAlign = useRef(alignFunction);
  useLayoutEffect(() => {
    if (alignFunction === firstAlign.current) return;
    firstAlign.current = alignFunction;
    controllerRef.current?.reInit();
  }, [alignFunction]);

  // New dots, counters and thumbnails take the current state.
  useLayoutEffect(() => {
    if (measured !== null) controllerRef.current?.reInit();
  }, [measured]);

  const estimate = estimateSnapCount(countSlides(children) ?? 0, {
    slidesToShow: responsiveValues(slidesToShow).xs,
    slidesToScroll,
    loop,
    containScroll: containScroll === false ? "false" : containScroll,
    effect,
  });
  const step = parseSlidesToScroll(slidesToScroll);
  const context = useMemo(
    () => ({
      snapCount: measured ?? estimate,
      startIndex,
      loop: Boolean(loop),
      slidesToScroll: typeof step === "number" ? step : 1,
    }),
    [measured, estimate, startIndex, loop, step],
  );

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: a labelled section is a region (WAI-ARIA carousel pattern).
    <section
      ref={mergedRef}
      aria-roledescription="carousel"
      {...carouselAttributes({
        align: typeof align === "function" ? undefined : align,
        axis,
        containScroll,
        effect,
        loop,
        dragFree,
        skipSnaps,
        autoHeight,
        heightEvent,
        wheelGestures,
        forceWheelAxis,
        draggable,
        focus,
        active,
        startIndex: startIndex === 0 ? undefined : startIndex,
        slidesToScroll,
        slidesToShow,
        slideSpacing,
        duration,
        dragThreshold,
        inViewThreshold,
        autoplay,
        autoplayDelay,
        autoplayJump,
        autoScroll,
        autoScrollSpeed,
        autoScrollStartDelay,
        autoScrollDirection,
        playOnInit,
        stopOnInteraction,
        stopOnMouseEnter,
        stopOnFocusIn,
        stopOnLastSnap,
        breakpoints,
      })}
      data-ok-runtime="off"
      {...props}
      style={
        {
          ...carouselStyle(responsiveValues(slidesToShow), slideSpacing),
          ...style,
        } as CSSProperties
      }
    >
      <CarouselContext.Provider value={context}>{children}</CarouselContext.Provider>
    </section>
  );
});

export type CarouselStageProps = HTMLAttributes<HTMLDivElement>;

/** CarouselStage — the area of the slides: controls with a `placement` overlay it. */
export const CarouselStage = forwardRef<HTMLDivElement, CarouselStageProps>(
  function CarouselStage(props, ref) {
    return <div ref={ref} data-ok-carousel-stage="" {...props} />;
  },
);

export interface CarouselViewportProps extends HTMLAttributes<HTMLDivElement> {
  /** Props of the inner container (the flex row of slides). */
  containerProps?: HTMLAttributes<HTMLDivElement> | undefined;
  /** The `CarouselSlide`s. */
  children?: ReactNode;
}

/**
 * CarouselViewport — the scroll container (focusable: arrow keys, Home and End), its container of
 * slides and a polite live region that announces slides the user moves to.
 */
export const CarouselViewport = forwardRef<HTMLDivElement, CarouselViewportProps>(
  function CarouselViewport({ containerProps, children, ...props }, ref) {
    const slides = Children.toArray(children).filter(isValidElement);
    return (
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroll container answers the arrow keys (axe scrollable-region-focusable).
      <div ref={ref} data-ok-carousel-viewport="" tabIndex={0} {...props}>
        <div data-ok-carousel-container="" {...containerProps}>
          {slides.map((child, index) => (
            <SlideContext.Provider
              key={child.key as string}
              value={{ index, count: slides.length }}
            >
              {child}
            </SlideContext.Provider>
          ))}
        </div>
        <span data-ok-carousel-live="" aria-live="polite" aria-atomic="true" />
      </div>
    );
  },
);

export interface CarouselSlideProps extends HTMLAttributes<HTMLDivElement> {
  /** Default `"<n> of <total>"`. */
  "aria-label"?: string | undefined;
}

/** CarouselSlide — a `group` with `aria-roledescription="slide"`, labelled "n of total". */
export const CarouselSlide = forwardRef<HTMLDivElement, CarouselSlideProps>(function CarouselSlide(
  { "aria-label": label, ...props },
  ref,
) {
  const slide = useContext(SlideContext) ?? { index: 0, count: 1 };
  const carousel = useCarousel();
  const snapped = Math.floor(slide.index / carousel.slidesToScroll) === carousel.startIndex;
  return (
    // biome-ignore lint/a11y/useSemanticElements: the WAI-ARIA carousel pattern makes each slide a group.
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      aria-label={label ?? `${slide.index + 1} of ${slide.count}`}
      data-ok-carousel-slide=""
      data-ok-snapped={snapped ? "" : undefined}
      {...props}
    />
  );
});

function Chevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

export interface CarouselArrowsProps extends HTMLAttributes<HTMLDivElement> {
  /** `basic` (default), `floating` on the sides of the slides, or `number` with a counter. */
  variant?: CarouselArrowsVariant | undefined;
  /** Default `"inherit"` (neutral). */
  color?: CarouselColor | undefined;
  /** Overlays the slides at that corner or side; absent: in the flow. */
  placement?: CarouselPlacement | undefined;
  /** Default "Previous slide". */
  prevLabel?: string | undefined;
  /** Default "Next slide". */
  nextLabel?: string | undefined;
  /** Replaces the previous chevron (decorative `svg`). */
  prevIcon?: ReactElement | undefined;
  /** Replaces the next chevron (decorative `svg`). */
  nextIcon?: ReactElement | undefined;
}

/** CarouselArrows — previous / next icon buttons (`aria-disabled` at the ends). */
export const CarouselArrows = forwardRef<HTMLDivElement, CarouselArrowsProps>(
  function CarouselArrows(
    {
      variant,
      color,
      placement,
      prevLabel = "Previous slide",
      nextLabel = "Next slide",
      prevIcon,
      nextIcon,
      ...props
    },
    ref,
  ) {
    const carousel = useCarousel();
    const size = variant === "number" ? "sm" : "md";
    const atStart = !carousel.loop && carousel.startIndex <= 0;
    const atEnd = !carousel.loop && carousel.startIndex >= carousel.snapCount - 1;
    return (
      <div ref={ref} {...carouselArrowsAttributes({ variant, color, placement })} {...props}>
        <IconButton
          size={size}
          data-ok-carousel-prev=""
          aria-label={prevLabel}
          aria-disabled={atStart ? "true" : undefined}
        >
          {prevIcon ?? <Chevron direction="prev" />}
        </IconButton>
        {variant === "number" && (
          <span data-ok-carousel-counter="">{`${carousel.startIndex + 1}/${carousel.snapCount}`}</span>
        )}
        <IconButton
          size={size}
          data-ok-carousel-next=""
          aria-label={nextLabel}
          aria-disabled={atEnd ? "true" : undefined}
        >
          {nextIcon ?? <Chevron direction="next" />}
        </IconButton>
      </div>
    );
  },
);

export interface CarouselDotsProps extends HTMLAttributes<HTMLDivElement> {
  /** `circular` (default), `rounded` (the selected dot is a bar) or `number`. */
  variant?: CarouselDotsVariant | undefined;
  /** Default `"inherit"` (the text color). */
  color?: CarouselColor | undefined;
  /** Overlays the slides at that corner or side; absent: in the flow. */
  placement?: CarouselPlacement | undefined;
  /** Name of the dot of snap `index`. Default "Go to slide <n>". */
  getLabel?: ((index: number) => string) | undefined;
}

/** CarouselDots — one button per snap; the selected one has `aria-current="true"`. */
export const CarouselDots = forwardRef<HTMLDivElement, CarouselDotsProps>(function CarouselDots(
  { variant, color, placement, getLabel = (index) => `Go to slide ${index + 1}`, ...props },
  ref,
) {
  const carousel = useCarousel();
  return (
    <div ref={ref} {...carouselDotsAttributes({ variant, color, placement })} {...props}>
      {Array.from({ length: carousel.snapCount }, (_, index) => (
        <button
          // biome-ignore lint/suspicious/noArrayIndexKey: a dot is its snap index.
          key={index}
          type="button"
          data-ok-carousel-dot=""
          aria-label={getLabel(index)}
          aria-current={index === carousel.startIndex ? "true" : undefined}
        >
          {variant === "number" ? String(index + 1) : null}
        </button>
      ))}
    </div>
  );
});

export interface CarouselProgressProps extends HTMLAttributes<HTMLSpanElement> {
  /** `scroll` (default): the scroll position; `autoplay`: the time until the next snap. */
  variant?: CarouselProgressVariant | undefined;
  /** Default `"inherit"` (the text color). */
  color?: CarouselColor | undefined;
  /** Overlays the slides at that corner or side; absent: in the flow. */
  placement?: CarouselPlacement | undefined;
}

/** CarouselProgress — a decorative bar (the dots or the counter carry the position). */
export const CarouselProgress = forwardRef<HTMLSpanElement, CarouselProgressProps>(
  function CarouselProgress({ variant, color, placement, ...props }, ref) {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        {...carouselProgressAttributes({ variant, color, placement })}
        {...props}
      />
    );
  },
);

export interface CarouselThumbsProps extends HTMLAttributes<HTMLDivElement> {
  /** `horizontal` (default) or `vertical`. */
  orientation?: Orientation | undefined;
  /** Overlays the slides at that corner or side; absent: in the flow. */
  placement?: CarouselPlacement | undefined;
  /** One `CarouselThumb` per slide, in order. */
  children?: ReactNode;
}

/** CarouselThumbs — a scrolling row (or column) of thumbnail buttons, one per slide. */
export const CarouselThumbs = forwardRef<HTMLDivElement, CarouselThumbsProps>(
  function CarouselThumbs({ orientation, placement, children, ...props }, ref) {
    const thumbs = Children.toArray(children).filter(isValidElement);
    return (
      <div ref={ref} {...carouselThumbsAttributes({ orientation, placement })} {...props}>
        {thumbs.map((child, index) => (
          <ThumbContext.Provider key={child.key as string} value={index}>
            {child}
          </ThumbContext.Provider>
        ))}
      </div>
    );
  },
);

export interface CarouselThumbProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Default "Go to slide <n>". */
  "aria-label"?: string | undefined;
}

/** CarouselThumb — a button showing a small image of its slide. */
export const CarouselThumb = forwardRef<HTMLButtonElement, CarouselThumbProps>(
  function CarouselThumb({ "aria-label": label, ...props }, ref) {
    const index = useContext(ThumbContext);
    const carousel = useCarousel();
    const current = Math.floor(index / carousel.slidesToScroll) === carousel.startIndex;
    return (
      <button
        ref={ref}
        type="button"
        data-ok-carousel-thumb=""
        aria-label={label ?? `Go to slide ${index + 1}`}
        aria-current={current ? "true" : undefined}
        {...props}
      />
    );
  },
);

function PlayIcon({ state }: { state: "play" | "pause" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" data-ok-carousel-play-label={state}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d={
          state === "play"
            ? "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.6 6.1 5.1 3.1c.6.4.6 1.2 0 1.6l-5.1 3.1c-.6.4-1.4 0-1.4-.8V8.9c0-.8.8-1.2 1.4-.8Z"
            : "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM9 8h2v8H9Zm4 0h2v8h-2Z"
        }
      />
    </svg>
  );
}

export interface CarouselPlayButtonProps
  extends Omit<ButtonAsButtonProps, "children" | "startIcon" | "endIcon"> {
  /** Default "Play". */
  playLabel?: ReactNode;
  /** Default "Pause". */
  pauseLabel?: ReactNode;
}

/**
 * CarouselPlayButton — starts and stops autoplay (or auto scroll): a `Button` whose label follows
 * the root's `data-ok-playing` (WCAG 2.2.2 pause control).
 */
export const CarouselPlayButton = forwardRef<HTMLButtonElement, CarouselPlayButtonProps>(
  function CarouselPlayButton(
    {
      playLabel = "Play",
      pauseLabel = "Pause",
      variant = "contained",
      color = "primary",
      size = "sm",
      ...props
    },
    ref,
  ) {
    return (
      <Button
        ref={ref}
        variant={variant}
        color={color}
        size={size}
        data-ok-carousel-play=""
        startIcon={
          <>
            <PlayIcon state="play" />
            <PlayIcon state="pause" />
          </>
        }
        {...props}
      >
        <span data-ok-carousel-play-label="play">{playLabel}</span>
        <span data-ok-carousel-play-label="pause">{pauseLabel}</span>
      </Button>
    );
  },
);
