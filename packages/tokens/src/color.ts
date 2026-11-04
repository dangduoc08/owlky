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
