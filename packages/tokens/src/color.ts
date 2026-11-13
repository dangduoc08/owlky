/** Color math shared by docs, tests and theme authors. Inputs are `#RGB` or `#RRGGBB`. */

export type RgbChannels = [red: number, green: number, blue: number];

export function hexToRgb(hex: string): RgbChannels {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) throw new TypeError(`Expected a #RGB or #RRGGBB color, got "${hex}".`);
  const digits =
    match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join("") : match[1];
  const value = Number.parseInt(digits, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const linear = (channel: number) => {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

/** WCAG 2.2 relative luminance (0 = black, 1 = white). */
export function relativeLuminance(color: string | RgbChannels): number {
  const [r, g, b] = typeof color === "string" ? hexToRgb(color) : color;
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG 2.2 contrast ratio between two colors (1–21). */
export function contrastRatio(a: string | RgbChannels, b: string | RgbChannels): number {
  const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (high + 0.05) / (low + 0.05);
}

/** The candidate text color with the highest contrast on `background`. */
export function getContrastText(
  background: string,
  candidates: readonly string[] = ["#FFFFFF", "#141A21"],
): string {
  let best = candidates[0] ?? "#FFFFFF";
  for (const candidate of candidates) {
    if (contrastRatio(candidate, background) > contrastRatio(best, background)) best = candidate;
  }
  return best;
}

/** An OKLCH color: lightness 0–1, chroma, hue in degrees. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const decode = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const encode = (value: number) =>
  value <= 0.0031308 ? 12.92 * value : 1.055 * Math.max(0, value) ** (1 / 2.4) - 0.055;

/** Linear sRGB of an OKLCH color (may fall outside 0–1: out of gamut). */
function oklchToLinear({ l, c, h }: Oklch): RgbChannels {
  const hue = (h * Math.PI) / 180;
  const a = c * Math.cos(hue);
  const b = c * Math.sin(hue);
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ];
}

const inGamut = (rgb: RgbChannels) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

const toHex = (rgb: RgbChannels) =>
  `#${rgb
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, encode(v))) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;

/**
 * `#RRGGBB` of an OKLCH color. With `fit`, chroma is reduced until the color is inside sRGB (hue
 * and lightness kept); otherwise channels are clipped, as browsers draw `oklch()` on sRGB screens.
 */
export function oklchColorToHex(color: Oklch, fit = false): string {
  let rgb = oklchToLinear(color);
  if (fit && !inGamut(rgb)) {
    let low = 0;
    let high = color.c;
    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinear({ ...color, c: mid }))) low = mid;
      else high = mid;
    }
    rgb = oklchToLinear({ ...color, c: low });
  }
  return toHex(rgb);
}

/** `oklch(L% C H)` (CSS Color 4, as in Tailwind's `theme.css`) as `#RRGGBB`. `H` may be `none`. */
export function oklchToHex(value: string): string {
  const match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+|none)\s*\)$/i.exec(value.trim());
  if (!match) throw new TypeError(`Expected an oklch(L% C H) color, got "${value}".`);
  return oklchColorToHex({
    l: Number(match[1]) / (match[2] ? 100 : 1),
    c: Number(match[3]),
    h: match[4] === "none" ? 0 : Number(match[4]),
  });
}

/** OKLCH of a `#RRGGBB` color. */
export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map((v) => decode(v / 255)) as RgbChannels;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(a, bb);
  const h = c < 1e-6 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return { l: lightness, c, h };
}
