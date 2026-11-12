import { type PaletteColorName, paletteColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Image --------------------------------------------------------------------------------------

export const imageRatios = [
  "1/1",
  "2/3",
  "3/2",
  "3/4",
  "4/3",
  "4/6",
  "6/4",
  "9/16",
  "16/9",
  "9/21",
  "21/9",
] as const;
export const imageFits = ["cover", "contain", "fill", "none", "scale-down"] as const;
export const imagePositions = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;
export const imageEffects = ["blur", "opacity", "black-and-white", "none"] as const;
export const imageOverlays = ["dark", ...paletteColorNames] as const;
export const imageStates = ["loading", "loaded", "error"] as const;

export type ImageRatio = (typeof imageRatios)[number];

/** A positive decimal, `16`, `1.6` or `.5` (the parts of a custom ratio). */
const RATIO_NUMBER = String.raw`(?:\d+(?:\.\d+)?|\.\d+)`;
/** Any ratio Image accepts besides its named ones: `<width>/<height>` or one number. */
const IMAGE_RATIO = `${RATIO_NUMBER}(?:/${RATIO_NUMBER})?`;

/**
 * A valid Image ratio as written in `data-ok-ratio` (spaces removed: `"16 / 10"` → `"16/10"`), or
 * `undefined`. Named ratios (`16/9`) and custom ones (`16/10`, `4/1`, a number such as `1.6`)
 * are valid when both terms are positive.
 */
export function imageRatio(value: unknown): string | undefined {
  const text =
    typeof value === "number" ? String(value) : typeof value === "string" ? value : undefined;
  if (text === undefined || text.length > 32) return undefined;
  const ratio = text.replace(/\s+/g, "");
  if (!new RegExp(`^${IMAGE_RATIO}$`).test(ratio)) return undefined;
  return ratio.split("/").every((term) => Number(term) > 0) ? ratio : undefined;
}

/**
 * Private properties of an image root (React `style`, HTML CSSOM): a custom ratio becomes
 * `--_ok-image-ratio` (`"16 / 10"`); named ratios are CSS rules on `data-ok-ratio`, so they need
 * none.
 */
export function imageStyle(ratio: unknown): Record<`--_ok-${string}`, string> {
  const value = imageRatio(ratio);
  if (value === undefined || imageRatios.includes(value as ImageRatio)) return {};
  return { "--_ok-image-ratio": value.replace("/", " / ") };
}
export type ImageFit = (typeof imageFits)[number];
export type ImagePosition = (typeof imagePositions)[number];
export type ImageEffect = (typeof imageEffects)[number];
export type ImageOverlay = (typeof imageOverlays)[number];
export type ImageState = (typeof imageStates)[number];

export const imageOptions = defineOptions("image", "data-ok-image", {
  ratio: style(
    "data-ok-ratio",
    imageRatios,
    "1/1",
    "Aspect ratio (width/height) the picture is cropped to: one of these, any other `width/height` such as `16/10`, or a number such as `1.6`. None: the picture's own ratio.",
    { optional: true, pattern: IMAGE_RATIO },
  ),
  fit: style("data-ok-fit", imageFits, "cover", "How the picture fills its box (`object-fit`)."),
  position: style(
    "data-ok-position",
    imagePositions,
    "center",
    "Which part of the picture stays in view when it is cropped (`object-position`).",
  ),
  effect: style(
    "data-ok-effect",
    imageEffects,
    "blur",
    "How the picture appears once loaded: blurred, faded, from grayscale, or at once.",
  ),
  overlay: style(
    "data-ok-overlay",
    imageOverlays,
    "dark",
    "A layer over the picture: `dark` (48% grey 900) or a palette color (a gradient to 80%).",
    { optional: true },
  ),
  overlayFrom: style(
    "data-ok-overlay-from",
    paletteColorNames,
    "primary",
    "With a color `overlay`: the gradient starts from this color (24%) at the bottom.",
    { optional: true },
  ),
  disablePlaceholder: flag(
    "data-ok-disable-placeholder",
    "No placeholder while the picture loads or after an error.",
  ),
  visibleByDefault: flag(
    "data-ok-visible-by-default",
    'Loads at once (`loading="eager"`), with no placeholder and no effect.',
  ),
  state: state(
    "data-ok-state",
    "`loading`, `loaded` or `error`, written by the component (never in snippets).",
    "load",
  ),
});

/** A named ratio, any other `width/height` (`"16/10"`) or a number (`1.6`). */
export type ImageRatioValue = ImageRatio | `${number}/${number}` | number;

export interface ImageAnatomyOptions {
  ratio?: ImageRatioValue | string | undefined;
  fit?: ImageFit | undefined;
  position?: ImagePosition | undefined;
  effect?: ImageEffect | undefined;
  overlay?: ImageOverlay | undefined;
  overlayFrom?: PaletteColorName | undefined;
  disablePlaceholder?: boolean | undefined;
  visibleByDefault?: boolean | undefined;
}

/** `data-ok-*` attributes of an image root (`ratio`, `overlay`, `overlayFrom` only when given). */
export const imageAttributes = (options: ImageAnatomyOptions = {}): DataAttributes =>
  optionAttributes(imageOptions, {
    ...options,
    ratio: imageRatio(options.ratio),
    overlayFrom: options.overlay && options.overlay !== "dark" ? options.overlayFrom : undefined,
  });

/** The load state of a settled `<img>`: `loaded`, `error`, or `loading` while it isn't. */
export function imageLoadState(
  img: Pick<HTMLImageElement, "complete" | "naturalWidth">,
): ImageState {
  if (!img.complete) return "loading";
  return img.naturalWidth > 0 ? "loaded" : "error";
}
