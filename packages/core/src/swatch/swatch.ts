/*
 * Color swatches (roadmap 4.23): the color pickers' Radio / Checkbox swatches and the color
 * preview's Avatars. A swatch color is user data, not a token: it reaches CSS as private custom
 * properties (React `style`, the HTML runtimes through CSSOM), never as a `style` attribute.
 * Specs: radio.md, checkbox.md, avatar.md.
 */
import { getContrastText, type RgbChannels } from "@owlky/tokens";

/** A token reference: `var(--ok-…)`. */
const TOKEN = /^var\(--ok-[a-z0-9-]+\)$/;
/** `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`. */
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
/** A color function with numbers, units, keywords and separators only. */
const FUNCTION = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([a-z0-9.,%/\s+-]*\)$/i;
/** A named color (`teal`, `rebeccapurple`). */
const NAMED = /^[a-z]+$/i;

/**
 * `value` when it is a safe CSS color: `#hex`, a color function, a named color or a
 * `var(--ok-…)` token, at most 64 characters, accepted by `CSS.supports` where it exists (the
 * server has no CSS). Anything else (`url(`, `;`, braces, quotes, other `var()`s) → `undefined`.
 */
export function swatchColor(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 64) return undefined;
  const text = value.trim();
  if (TOKEN.test(text)) return text;
  if (!HEX.test(text) && !FUNCTION.test(text) && !NAMED.test(text)) return undefined;
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function")
    return CSS.supports("color", text) ? text : undefined;
  return text;
}

/** The sRGB channels of a `#hex` or `rgb()` / `rgba()` color, else `undefined`. */
export function swatchChannels(color: string): RgbChannels | undefined {
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color)?.[1];
  if (hex) {
    const digits =
      hex.length <= 4 ? [...hex.slice(0, 3)].map((d) => d + d).join("") : hex.slice(0, 6);
    const value = Number.parseInt(digits, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(color);
  if (!rgb) return undefined;
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map((channel) =>
    Math.min(255, Math.round(channel)),
  ) as RgbChannels;
}

const WHITE = "#FFFFFF";
const BLACK = "#000000";

/**
 * The private properties of a swatch: its color and the mark drawn on it (white or pure black,
 * whichever contrasts more; white when the color can't be read without CSS). `{}` for an
 * invalid color, so the swatch keeps its grey fallback.
 */
export function swatchStyle(
  value: unknown,
): Partial<Record<"--_ok-swatch" | "--_ok-swatch-mark", string>> {
  const color = swatchColor(value);
  if (color === undefined) return {};
  const channels = swatchChannels(color);
  const hex = channels
    ? `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
    : undefined;
  const mark =
    hex !== undefined && getContrastText(hex, [WHITE, BLACK]) === BLACK ? "black" : "white";
  return { "--_ok-swatch": color, "--_ok-swatch-mark": `var(--ok-palette-common-${mark})` };
}
