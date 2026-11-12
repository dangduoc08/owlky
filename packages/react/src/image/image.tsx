"use client";

import {
  galleryRemoveLinear,
  type ImageEffect,
  type ImageFit,
  type ImageOverlay,
  type ImagePosition,
  type ImageRatioValue,
  type ImageState,
  imageAttributes,
  imageLoadState,
  imageOverlays,
  imageStyle,
  type PaletteColorName,
} from "@owlky/core";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "../utils/icon.js";
import { useMergedRefs } from "../utils/refs.js";

/** Shown over the placeholder when the picture fails to load (decorative). */
export function ImageErrorIcon() {
  return <Icon icon={galleryRemoveLinear} data-ok-image-icon="" />;
}

type ImgEvent = SyntheticEvent<HTMLImageElement, Event>;

export interface ImageProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "onLoad" | "onError" | "placeholder"> {
  /** Picture URL. */
  src?: string | undefined;
  /** Candidate pictures at other resolutions (the `srcset` of the `img`). */
  srcSet?: string | undefined;
  /** The `sizes` of the `img`, with `srcSet`. */
  sizes?: string | undefined;
  /** Text alternative (required). Use `""` for a decorative picture. */
  alt: string;
  /** Intrinsic size: reserves the picture's ratio before it loads (without `ratio`). */
  width?: number | string | undefined;
  /** The picture's height (the `img` attribute), which reserves its space with `width`. */
  height?: number | string | undefined;
  /** Native lazy loading. Default `"lazy"` (`"eager"` with `visibleByDefault`). */
  loading?: "lazy" | "eager" | undefined;
  /** How the browser decodes the picture (the `img` attribute). Default `"async"`. */
  decoding?: "async" | "auto" | "sync" | undefined;
  /** How soon the browser fetches the picture (`fetchpriority`). */
  fetchPriority?: "high" | "low" | "auto" | undefined;
  /** The `crossorigin` of the `img`. */
  crossOrigin?: ImgHTMLAttributes<HTMLImageElement>["crossOrigin"];
  /** The `referrerpolicy` of the `img`. */
  referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
  /**
   * Aspect ratio the picture is cropped to: a named ratio (`"16/9"`), any other `width/height`
   * (`"16/10"`, `"4/1"`) or a number (`1.6`). Default: the picture's own ratio.
   */
  ratio?: ImageRatioValue | undefined;
  /** `object-fit`. Default `"cover"`. */
  fit?: ImageFit | undefined;
  /** The part that stays in view when cropped (`object-position`). Default `"center"`. */
  position?: ImagePosition | undefined;
  /** How the picture appears once loaded. Default `"blur"`. */
  effect?: ImageEffect | undefined;
  /** A layer over the picture: `"dark"` or a palette color (a gradient). */
  overlay?: ImageOverlay | undefined;
  /** With a color `overlay`: the gradient starts from this color at the bottom. */
  overlayFrom?: PaletteColorName | undefined;
  /** No placeholder while loading. */
  disablePlaceholder?: boolean | undefined;
  /** Loads at once, with no placeholder and no effect. */
  visibleByDefault?: boolean | undefined;
  /** A small preview shown blurred in the placeholder while the picture loads. */
  placeholderSrc?: string | undefined;
  /** Custom placeholder content (decorative). */
  placeholder?: ReactNode;
  /** The picture loaded (also after an earlier error, when `src` changes). */
  onLoad?: ((event: ImgEvent) => void) | undefined;
  /** The picture failed to load: the placeholder stays, with a broken-image icon. */
  onError?: ((event: ImgEvent) => void) | undefined;
  /** Ref of the `<img>` (`ref` is the root). */
  imgRef?: Ref<HTMLImageElement> | undefined;
  /**
   * Other attributes of the `<img>`, `data-*` ones included (such as
   * `data-ok-carousel-parallax`, which marks the picture a parallax carousel moves).
   */
  imgProps?:
    | (ImgHTMLAttributes<HTMLImageElement> & { [data: `data-${string}`]: string | undefined })
    | undefined;
}

/**
 * Image — spec: specs/components/image.md. A picture that loads lazily behind a placeholder and
 * appears with an effect; `ratio` crops it, `overlay` paints a layer over it.
 */
export const Image = forwardRef<HTMLSpanElement, ImageProps>(function Image(
  {
    src,
    srcSet,
    sizes,
    alt,
    width,
    height,
    loading,
    decoding,
    fetchPriority,
    crossOrigin,
    referrerPolicy,
    ratio,
    fit,
    position,
    effect,
    overlay,
    overlayFrom,
    disablePlaceholder,
    visibleByDefault,
    placeholderSrc,
    placeholder,
    onLoad,
    onError,
    imgRef,
    imgProps,
    style,
    ...props
  },
  ref,
) {
  const own = useRef<HTMLImageElement>(null);
  const img = useMergedRefs(own, imgRef);
  const key = `${src ?? ""} ${srcSet ?? ""}`;
  const [result, setResult] = useState<{ key: string; state: ImageState } | null>(null);
  const state: ImageState = result?.key === key ? result.state : "loading";

  // An image that settled before hydration (cache, server markup) fires no event for React.
  useEffect(() => {
    // The img always renders, so the ref is set by now.
    const settled = imageLoadState(own.current as HTMLImageElement);
    if (settled !== "loading") setResult({ key, state: settled });
  }, [key]);

  // A custom ratio (`16/10`) is a private property; named ratios are CSS rules.
  const custom = imageStyle(ratio);
  const merged =
    Object.keys(custom).length > 0 ? ({ ...custom, ...style } as CSSProperties) : style;

  return (
    <span
      ref={ref}
      {...imageAttributes({
        ratio,
        fit,
        position,
        effect,
        overlay,
        overlayFrom,
        disablePlaceholder,
        visibleByDefault,
      })}
      data-ok-state={state}
      data-ok-runtime="off"
      style={merged}
      {...props}
    >
      {/* Always rendered (CSS hides it with `disablePlaceholder` / `visibleByDefault`). */}
      <span data-ok-image-placeholder="" aria-hidden="true">
        {placeholderSrc !== undefined ? <img src={placeholderSrc} alt="" /> : placeholder}
      </span>
      {overlay !== undefined && imageOverlays.includes(overlay) && (
        <span data-ok-image-overlay="" aria-hidden="true" />
      )}
      <img
        ref={img}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={visibleByDefault ? "eager" : (loading ?? "lazy")}
        decoding={decoding ?? "async"}
        fetchPriority={fetchPriority}
        crossOrigin={crossOrigin}
        referrerPolicy={referrerPolicy}
        {...imgProps}
        onLoad={(event) => {
          setResult({ key, state: "loaded" });
          imgProps?.onLoad?.(event);
          onLoad?.(event);
        }}
        onError={(event) => {
          setResult({ key, state: "error" });
          imgProps?.onError?.(event);
          onError?.(event);
        }}
      />
      {state === "error" && <ImageErrorIcon />}
    </span>
  );
});
