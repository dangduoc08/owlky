/*
 * Lightbox model (ADR-0032): option values, zoom and pan math, rotation, safe URLs and the
 * private custom properties written from numeric options. Pure functions, shared by the
 * controller, React and the HTML runtime.
 */

export const lightboxImageFits = ["contain", "cover"] as const;
export type LightboxImageFit = (typeof lightboxImageFits)[number];

export const lightboxThumbnailsPositions = ["bottom", "top", "start", "end"] as const;
export type LightboxThumbnailsPosition = (typeof lightboxThumbnailsPositions)[number];

export const lightboxRotateButtons = ["both", "clockwise", "counterclockwise"] as const;
export type LightboxRotateButtons = (typeof lightboxRotateButtons)[number];

export const lightboxTextAligns = ["start", "center", "end"] as const;
export type LightboxTextAlign = (typeof lightboxTextAligns)[number];

/** Why the lightbox asks to close. */
export type LightboxCloseReason = "escape" | "backdrop" | "pull" | "close";

/** Every text the lightbox shows or reads out (yet-another-react-lightbox `labels`). */
export interface LightboxLabels {
  Lightbox: string;
  Carousel: string;
  Previous: string;
  Next: string;
  Close: string;
  "Zoom in": string;
  "Zoom out": string;
  Play: string;
  Pause: string;
  "Enter Fullscreen": string;
  "Exit Fullscreen": string;
  Download: string;
  Share: string;
  "Rotate clockwise": string;
  "Rotate counterclockwise": string;
  "Show captions": string;
  "Hide captions": string;
  "Show thumbnails": string;
  "Hide thumbnails": string;
  Thumbnails: string;
  /** `{index}` and `{total}` are replaced (slide and thumbnail names). */
  Slide: string;
  /** Status messages, read out in the polite live region. */
  "Zoom level": string;
  "Download failed": string;
  "Sharing failed": string;
  "Fullscreen failed": string;
}

export const defaultLightboxLabels: LightboxLabels = {
  Lightbox: "Lightbox",
  Carousel: "Photo gallery",
  Previous: "Previous",
  Next: "Next",
  Close: "Close",
  "Zoom in": "Zoom in",
  "Zoom out": "Zoom out",
  Play: "Play",
  Pause: "Pause",
  "Enter Fullscreen": "Enter Fullscreen",
  "Exit Fullscreen": "Exit Fullscreen",
  Download: "Download",
  Share: "Share",
  "Rotate clockwise": "Rotate clockwise",
  "Rotate counterclockwise": "Rotate counterclockwise",
  "Show captions": "Show captions",
  "Hide captions": "Hide captions",
  "Show thumbnails": "Show thumbnails",
  "Hide thumbnails": "Hide thumbnails",
  Thumbnails: "Thumbnails",
  Slide: "{index} of {total}",
  "Zoom level": "Zoom {zoom}%",
  "Download failed": "The file could not be downloaded.",
  "Sharing failed": "The slide could not be shared.",
  "Fullscreen failed": "Fullscreen is not available.",
};

/** `labels` merged over the defaults; keys that aren't labels and non-string values are ignored. */
export function lightboxLabels(labels: Partial<LightboxLabels> | undefined = {}): LightboxLabels {
  const out = { ...defaultLightboxLabels };
  for (const key of Object.keys(defaultLightboxLabels) as (keyof LightboxLabels)[]) {
    const value = labels?.[key];
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/** A label with `{name}` placeholders filled in. */
export const formatLabel = (label: string, values: Record<string, string | number>): string =>
  label.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );

// --- Zoom and pan ----------------------------------------------------------------------------------

export interface LightboxZoomLimits {
  min: number;
  max: number;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Largest zoom of an image: its natural pixels per physical screen pixel at `ratio`
 * (yet-another-react-lightbox `maxZoomPixelRatio`). `rendered` is the unzoomed CSS size.
 * Unknown sizes (not loaded yet) give 1: no zoom.
 */
export function imageMaxZoom(
  natural: number,
  rendered: number,
  ratio: number,
  devicePixelRatio = 1,
): number {
  if (!(natural > 0) || !(rendered > 0) || !(ratio > 0)) return 1;
  return Math.max(1, (natural * ratio) / (rendered * Math.max(devicePixelRatio, 1)));
}

/** Pan limit on one axis: half of what the zoomed content overflows its frame by. */
export const panLimit = (content: number, zoom: number, frame: number): number =>
  Math.max(0, (content * zoom - frame) / 2);

export interface ZoomState {
  zoom: number;
  x: number;
  y: number;
}

/**
 * Zooms to `zoom` keeping the content point under `point` (relative to the frame's center) in
 * place, then keeps the offsets within the overflow.
 */
export function zoomAround(
  state: ZoomState,
  zoom: number,
  point: { x: number; y: number },
  content: { width: number; height: number },
  frame: { width: number; height: number },
): ZoomState {
  const ratio = state.zoom > 0 ? zoom / state.zoom : 1;
  return clampPan(
    {
      zoom,
      x: point.x - (point.x - state.x) * ratio,
      y: point.y - (point.y - state.y) * ratio,
    },
    content,
    frame,
  );
}

/** Offsets limited to the content's overflow (centered when it fits). */
export function clampPan(
  state: ZoomState,
  content: { width: number; height: number },
  frame: { width: number; height: number },
): ZoomState {
  const limitX = panLimit(content.width, state.zoom, frame.width);
  const limitY = panLimit(content.height, state.zoom, frame.height);
  return {
    zoom: state.zoom,
    x: clamp(state.x, -limitX, limitX) || 0,
    y: clamp(state.y, -limitY, limitY) || 0,
  };
}

/** Next zoom of a double click: one more `multiplier` step, back to 1 after `maxStops` steps. */
export function doubleClickZoom(
  zoom: number,
  multiplier: number,
  maxStops: number,
  max: number,
): number {
  const step = Math.max(multiplier, 1.01);
  const limit = Math.min(max, step ** Math.max(maxStops, 0));
  if (maxStops <= 0 || zoom >= limit - 1e-3) return 1;
  return Math.min(zoom * step, limit);
}

/** Zoom factor of one wheel event (`ctrl` + wheel, pinching trackpads). */
export const wheelZoomFactor = (deltaY: number, distanceFactor: number): number =>
  clamp(1 - deltaY / Math.max(distanceFactor, 1) / 4, 0.5, 2);

// --- Rotation ------------------------------------------------------------------------------------

/** A rotation in degrees as a quarter turn 0, 90, 180 or 270 (invalid → 0). */
export function normalizeRotation(value: unknown): number {
  const degrees = typeof value === "string" ? Number(value) : value;
  if (typeof degrees !== "number" || !Number.isFinite(degrees)) return 0;
  return (((Math.round(degrees / 90) * 90) % 360) + 360) % 360;
}

// --- URLs ----------------------------------------------------------------------------------------

const SAFE_PROTOCOLS = new Set(["http:", "https:", "blob:"]);

/**
 * `url` resolved against `base` when it is safe to hand to a link or `navigator.share`: http(s),
 * blob, or an image / video `data:` URL. Anything else (`javascript:`, `file:`…) gives `null`.
 */
export function safeUrl(url: string | null | undefined, base: string): URL | null {
  if (typeof url !== "string" || url.trim() === "") return null;
  try {
    const parsed = new URL(url.trim(), base);
    if (SAFE_PROTOCOLS.has(parsed.protocol)) return parsed;
    if (parsed.protocol === "data:" && /^data:(image|video)\//i.test(parsed.href)) return parsed;
  } catch {
    // Not a URL.
  }
  return null;
}

/** File name of a URL: its last path segment, decoded (`download` when there is none). */
export function fileName(url: URL): string {
  if (url.protocol === "data:" || url.protocol === "blob:") return "download";
  const segment = url.pathname.split("/").filter(Boolean).pop() ?? "";
  try {
    return decodeURIComponent(segment) || "download";
  } catch {
    return segment || "download";
  }
}

// --- Sizes ---------------------------------------------------------------------------------------

/** A length option: a number (px) or a string such as `"16px"` or `"10%"`; `null` when invalid. */
export function parseLength(value: unknown, percentUnit = "%"): string | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? `${value}px` : null;
  if (typeof value !== "string" || value.length > 12) return null;
  const match = /^(\d+(?:\.\d+)?)(px|%)?$/.exec(value.trim());
  if (!match) return null;
  return match[2] === "%" ? `${Number(match[1])}${percentUnit}` : `${Number(match[1])}px`;
}

const nonNegative = (value: unknown): number | null => {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) && number >= 0 ? number : null;
};

/** The numeric options that become private custom properties (React `style`, HTML CSSOM). */
export interface LightboxStyleValues {
  padding?: unknown;
  spacing?: unknown;
  thumbnailsWidth?: unknown;
  thumbnailsHeight?: unknown;
  thumbnailsBorder?: unknown;
  thumbnailsBorderRadius?: unknown;
  thumbnailsPadding?: unknown;
  thumbnailsGap?: unknown;
  descriptionMaxLines?: unknown;
  animationFade?: unknown;
  animationZoom?: unknown;
}

const PX_VARIABLES = [
  ["thumbnailsWidth", "--_ok-lightbox-thumb-width"],
  ["thumbnailsHeight", "--_ok-lightbox-thumb-height"],
  ["thumbnailsBorder", "--_ok-lightbox-thumb-border"],
  ["thumbnailsBorderRadius", "--_ok-lightbox-thumb-radius"],
  ["thumbnailsPadding", "--_ok-lightbox-thumb-padding"],
  ["thumbnailsGap", "--_ok-lightbox-thumb-gap"],
] as const;

/**
 * Private custom properties for the given option values (invalid values are left out, so the
 * stylesheet's defaults apply). Spacing in percent is relative to the slide area (`cqw`).
 */
export function lightboxStyle(values: LightboxStyleValues): Record<`--_ok-${string}`, string> {
  const style: Record<`--_ok-${string}`, string> = {};
  const padding = parseLength(values.padding);
  if (padding !== null) style["--_ok-lightbox-padding"] = padding;
  const spacing = parseLength(values.spacing, "cqw");
  if (spacing !== null) style["--_ok-lightbox-spacing"] = spacing;
  for (const [key, name] of PX_VARIABLES) {
    const value = nonNegative(values[key]);
    if (value !== null) style[name] = `${value}px`;
  }
  const lines = nonNegative(values.descriptionMaxLines);
  if (lines !== null && lines >= 1) style["--_ok-lightbox-lines"] = String(Math.floor(lines));
  const fade = nonNegative(values.animationFade);
  if (fade !== null) style["--_ok-lightbox-fade"] = `${fade}ms`;
  const zoom = nonNegative(values.animationZoom);
  if (zoom !== null) style["--_ok-lightbox-zoom-duration"] = `${zoom}ms`;
  return style;
}

/** Carousel `duration` (Embla units, 25 ≈ 500 ms) for a swipe animation of `ms`. */
export const carouselDurationFor = (ms: number): number => Math.max(0, Math.round(ms / 20));
