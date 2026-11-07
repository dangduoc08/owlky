/*
 * Progress math shared by React and the HTML runtime (specs/components/circular-progress.md,
 * linear-progress.md). Pure functions: values in, ARIA attributes and private CSS custom
 * properties out. Every input may be untrusted (HTML attributes): invalid numbers fall back.
 */

/** Size of the circular progress's SVG coordinate system (viewBox `22 22 44 44`). */
export const CIRCULAR_PROGRESS_VIEWBOX = 44;
export const CIRCULAR_PROGRESS_THICKNESS = 3.6;

/** Private custom properties a progress root carries (set through CSSOM, never a style string). */
export type ProgressStyle = Partial<Record<`--_ok-progress-${string}`, string>>;

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** The value range, with fallbacks: min 0, max 100 (and max 100 above min when inverted). */
export function progressRange(min?: unknown, max?: unknown): { min: number; max: number } {
  const low = finite(min) ? min : 0;
  const high = finite(max) && max > low ? max : low + 100;
  return { min: low, max: high };
}

/** `value` clamped to the range (`min` when missing or invalid). */
export function progressValue(value: unknown, min?: unknown, max?: unknown): number {
  const range = progressRange(min, max);
  if (!finite(value)) return range.min;
  return Math.min(range.max, Math.max(range.min, value));
}

/** How far `value` is through the range: 0–1. */
export function progressFraction(value: unknown, min?: unknown, max?: unknown): number {
  const range = progressRange(min, max);
  return (progressValue(value, min, max) - range.min) / (range.max - range.min);
}

/** `aria-valuenow` / `-valuemin` / `-valuemax` of a progress with a known value. */
export function progressAria(
  value: unknown,
  min?: unknown,
  max?: unknown,
): { "aria-valuenow": number; "aria-valuemin": number; "aria-valuemax": number } {
  const range = progressRange(min, max);
  return {
    "aria-valuenow": progressValue(value, min, max),
    "aria-valuemin": range.min,
    "aria-valuemax": range.max,
  };
}

const round = (value: number) => Math.round(value * 1000) / 1000;

/** Circle radius and stroke width (SVG user units) for a thickness, clamped to (0, 22]. */
export function circularProgressGeometry(thickness?: unknown): { r: number; strokeWidth: number } {
  const half = CIRCULAR_PROGRESS_VIEWBOX / 2;
  const t =
    finite(thickness) && thickness > 0 ? Math.min(thickness, half) : CIRCULAR_PROGRESS_THICKNESS;
  return { r: round((CIRCULAR_PROGRESS_VIEWBOX - t) / 2), strokeWidth: round(t) };
}

/** A size option as CSS: numbers are px, lengths are kept. */
export const progressSize = (size: number | string | undefined): string | undefined =>
  size === undefined ? undefined : typeof size === "number" ? `${size}px` : size;

export interface CircularProgressStyleOptions {
  /** CSS length (from `progressSize`); omitted = the stylesheet's default. */
  size?: string | undefined;
  thickness?: unknown;
  /** 0–1 for the determinate variant; omitted = indeterminate. */
  fraction?: number | undefined;
}

/** Custom properties of a circular progress root: size, thickness and the determinate arc. */
export function circularProgressStyle(options: CircularProgressStyleOptions): ProgressStyle {
  const { r, strokeWidth } = circularProgressGeometry(options.thickness);
  const style: ProgressStyle = {};
  if (options.size !== undefined) style["--_ok-progress-size"] = options.size;
  if (strokeWidth !== CIRCULAR_PROGRESS_THICKNESS)
    style["--_ok-progress-thickness"] = String(strokeWidth);
  if (options.fraction !== undefined) {
    const circumference = 2 * Math.PI * r;
    style["--_ok-progress-dasharray"] = `${round(circumference)}px`;
    style["--_ok-progress-dashoffset"] = `${round((1 - options.fraction) * circumference)}px`;
  }
  return style;
}

/** Custom properties of a linear progress root: the bar and buffer positions (0–1). */
export function linearProgressStyle(options: {
  fraction?: number | undefined;
  buffer?: number | undefined;
}): ProgressStyle {
  const style: ProgressStyle = {};
  if (options.fraction !== undefined)
    style["--_ok-progress-value"] = String(round(options.fraction));
  if (options.buffer !== undefined) style["--_ok-progress-buffer"] = String(round(options.buffer));
  return style;
}
