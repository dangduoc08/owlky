/*
 * Role generator (ADR-0070 § 7, from ADR-0069 § 5): every color role of a style is picked from
 * 11-step scales by the WCAG 2.2 rules below, never written by hand. One call per contrast level:
 * `default` (text 4.5:1, graphics 3:1) and `high` (text 7:1, graphics 4.5:1). When no step of a
 * scale reaches a target, the nearest step's OKLCH lightness moves until it does (hue kept,
 * chroma reduced only to stay in sRGB). Scales are `oklch(…)` (as in Tailwind's `theme.css`) or
 * hex; everything returned is `#RRGGBB` or a `color-mix()` of one.
 */
import { contrastRatio, hexToOklch, hexToRgb, oklchColorToHex, oklchToHex } from "./color.js";
import { type ColorScale, type ScaleStep, scaleSteps } from "./tailwind-palette.js";
import type { ColorScheme, GreyScale, PaletteColor } from "./types.js";

export type ContrastLevel = "default" | "high";

/** Minimum ratios per contrast level: text (WCAG 1.4.3 / 1.4.6) and graphics (1.4.11). */
export const CONTRAST_TARGETS: Record<ContrastLevel, { text: number; graphic: number }> = {
  default: { text: 4.5, graphic: 3 },
  high: { text: 7, graphic: 4.5 },
};

const WHITE = "#FFFFFF";
const BLACK = "#000000";

/** A scale with every step as `#RRGGBB`. */
export function hexScale(scale: ColorScale): ColorScale {
  const result = {} as ColorScale;
  for (const step of scaleSteps) {
    const value = scale[step];
    result[step] = value.startsWith("#") ? value.toUpperCase() : oklchToHex(value);
  }
  return result;
}

/** `fg` at `percent` % over `bg` (sRGB), as hex: what `rgb(… / 0.16)` paints over a surface. */
export function tint(fg: string, percent: number, bg: string): string {
  const base = hexToRgb(bg);
  return `#${hexToRgb(fg)
    .map((c, i) => Math.round((c * percent + (base[i] as number) * (100 - percent)) / 100))
    .map((c) => c.toString(16).padStart(2, "0").toUpperCase())
    .join("")}`;
}

/** Alpha of the soft variant's tint of `main` (components paint `rgb(main / 0.16)`). */
export const SOFT_TINT = 16;

const passes = (color: string, surfaces: readonly string[], target: number) =>
  surfaces.every((surface) => contrastRatio(color, surface) >= target);

/**
 * `color` with its OKLCH lightness moved in 0.01 steps (away from the surfaces) until it reaches
 * `target` on every surface. Hue is kept; chroma shrinks only as far as sRGB requires.
 */
export function shiftToContrast(
  color: string,
  surfaces: readonly string[],
  target: number,
  direction?: "darker" | "lighter",
): string {
  if (passes(color, surfaces, target)) return color;
  const start = hexToOklch(color);
  const lightSurfaces = surfaces.filter((s) => contrastRatio(s, BLACK) > contrastRatio(s, WHITE));
  const dir = direction ?? (lightSurfaces.length * 2 >= surfaces.length ? "darker" : "lighter");
  const delta = dir === "darker" ? -0.01 : 0.01;
  let last = color;
  for (let l = start.l + delta; l > 0 && l < 1; l += delta) {
    last = oklchColorToHex({ ...start, l }, true);
    if (passes(last, surfaces, target)) return last;
  }
  return last;
}

/** The first step of `order` that passes; otherwise the last step of `order`, shifted until it does. */
function pick(
  scale: ColorScale,
  order: readonly ScaleStep[],
  surfaces: readonly string[],
  target: number,
): string {
  for (const step of order) if (passes(scale[step], surfaces, target)) return scale[step];
  const nearest = scale[order[order.length - 1] as ScaleStep];
  return shiftToContrast(nearest, surfaces, target);
}

const next = (step: ScaleStep): ScaleStep =>
  scaleSteps[Math.min(scaleSteps.indexOf(step) + 1, scaleSteps.length - 1)] as ScaleStep;

/** Every surface a role must be readable on, per scheme (paper, page backgrounds, `neutral`). */
export interface RoleSurfaces {
  light: readonly string[];
  dark: readonly string[];
}

export interface ColorRoles {
  color: PaletteColor;
  /** Text tone per scheme: text, outlined and soft variants, and colored text. */
  text: { light: string; dark: string };
}

/**
 * Palette roles of one scale at one contrast level (target text T, ADR-0070 § 7):
 * - `main`: the first of 500 → 950 on which white text reaches T (`contrastText` white);
 *   otherwise 500 with pure black text (shifted darker until white reaches T if black doesn't).
 * - `lighter` 100, `light` 300, `dark` one step darker than `main`, `darker` 900.
 * - Light text tone: the first of 600 → 950 at T on the light surfaces, the soft tint of `main`
 *   and the soft fill (100). Dark text tone: the first of 400 → 50 at T on the dark surfaces,
 *   the soft tint and the soft fill (900).
 */
export function colorRoles(
  source: ColorScale,
  surfaces: RoleSurfaces,
  level: ContrastLevel = "default",
): ColorRoles {
  const scale = hexScale(source);
  const { text: target } = CONTRAST_TARGETS[level];
  const fills: ScaleStep[] = [500, 600, 700, 800, 900, 950];
  const onWhite = fills.find((step) => contrastRatio(WHITE, scale[step]) >= target);
  let main: string;
  let mainStep: ScaleStep = 500;
  let contrastText = WHITE;
  if (onWhite !== undefined) {
    mainStep = onWhite;
    main = scale[onWhite];
  } else if (contrastRatio(BLACK, scale[500]) >= target) {
    main = scale[500];
    contrastText = BLACK;
  } else {
    main = shiftToContrast(scale[500], [WHITE], target, "darker");
  }
  const color: PaletteColor = {
    lighter: scale[100],
    light: scale[300],
    main,
    dark: scale[next(mainStep)],
    darker: scale[900],
    contrastText,
  };
  const on = (list: readonly string[], fill: string) => [
    ...list,
    ...list.map((surface) => tint(main, SOFT_TINT, surface)),
    fill,
  ];
  const text = {
    light: pick(scale, [600, 700, 800, 900, 950], on(surfaces.light, scale[100]), target),
    dark: pick(scale, [400, 300, 200, 100, 50], on(surfaces.dark, scale[900]), target),
  };
  return { color, text };
}

/**
 * A graphic tone (chart series, ADR-0070 § 4.8) of one scale per scheme: the first of 500 → 950
 * (light) or 400 → 50 (dark) at the graphics target on every surface of the scheme.
 */
export function graphicTone(
  source: ColorScale,
  surfaces: RoleSurfaces,
  level: ContrastLevel = "default",
): { light: string; dark: string } {
  const scale = hexScale(source);
  const { graphic } = CONTRAST_TARGETS[level];
  return {
    light: pick(scale, [500, 600, 700, 800, 900, 950], surfaces.light, graphic),
    dark: pick(scale, [400, 300, 200, 100, 50], surfaces.dark, graphic),
  };
}

/** Neutral roles of a scheme (everything except the palette text tones and chart series). */
export type NeutralScheme = Omit<ColorScheme, "paletteText" | "chart" | "surfaceBorder">;

const mix = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/** The surfaces of each scheme (ADR-0070 § 7): paper, the default and contrast backgrounds, `neutral`. */
export function neutralSurfaces(scale: ColorScale): RoleSurfaces {
  const hex = hexScale(scale);
  return { light: [WHITE, hex[100]], dark: [hex[900], hex[950], hex[800]] };
}

/**
 * Grey scale and neutral scheme roles from one neutral scale at one contrast level:
 * - Light: white paper and default background, `contrast` background and `neutral` 100, text
 *   primary 900, secondary the first of 500 → 950 at T, disabled 400; control borders the first
 *   of 400 → 950 at the graphics target; dividers translucent 500 (decorative), or the first of
 *   300 → 950 at 3:1 in high contrast; shadows tinted with 500.
 * - Dark: paper and default background 900, `contrast` background 950, `neutral` 800, text
 *   primary 50, secondary the first of 400 → 50 at T, disabled 600; borders and dividers mirror
 *   the light rules from 600 → 50; black shadows.
 */
export function neutralRoles(
  source: ColorScale,
  level: ContrastLevel = "default",
): { grey: GreyScale; light: NeutralScheme; dark: NeutralScheme } {
  const scale = hexScale(source);
  const { text: target, graphic } = CONTRAST_TARGETS[level];
  const high = level === "high";
  const surfaces = neutralSurfaces(source);
  const action = {
    hover: mix(scale[500], 8),
    selected: mix(scale[500], 16),
    focus: mix(scale[500], 24),
    disabled: mix(scale[500], 80),
    disabledBackground: mix(scale[500], 24),
  };
  const light: NeutralScheme = {
    text: {
      primary: high ? scale[950] : scale[900],
      secondary: pick(scale, [500, 600, 700, 800, 900, 950], surfaces.light, target),
      disabled: scale[400],
    },
    background: { default: WHITE, contrast: scale[100], paper: WHITE, neutral: scale[100] },
    inherit: { main: scale[800], hover: scale[700], contrast: WHITE },
    divider: high ? pick(scale, [300, 400, 500, 600, 700], surfaces.light, 3) : mix(scale[500], 20),
    border: pick(scale, [400, 500, 600, 700, 800, 900, 950], surfaces.light, graphic),
    action,
    shadowColor: scale[500],
    backdrop: mix(scale[800], 48),
  };
  const dark: NeutralScheme = {
    text: {
      primary: high ? WHITE : scale[50],
      secondary: pick(scale, [400, 300, 200, 100, 50], surfaces.dark, target),
      disabled: scale[600],
    },
    background: {
      default: scale[900],
      contrast: scale[950],
      paper: scale[900],
      neutral: scale[800],
    },
    inherit: { main: scale[50], hover: scale[300], contrast: scale[900] },
    divider: high ? pick(scale, [600, 500, 400, 300, 200], surfaces.dark, 3) : mix(scale[500], 24),
    border: pick(scale, [600, 500, 400, 300, 200, 100, 50], surfaces.dark, graphic),
    action,
    shadowColor: BLACK,
    backdrop: mix(scale[950], 64),
  };
  const grey = {} as GreyScale;
  for (const step of scaleSteps) grey[step] = scale[step];
  return { grey, light, dark };
}

/**
 * An 11-step scale from one brand color (ADR-0070 § 8): the color's hue and chroma on an OKLCH
 * lightness ramp shaped like Tailwind's (50 ≈ 0.97 … 950 ≈ 0.27), the brand color itself at the
 * step whose lightness is nearest to its own. Chroma tapers at the light and dark ends and is
 * reduced to stay in sRGB.
 */
export function brandScale(hex: string): ColorScale {
  const base = hexToOklch(hex);
  const ramp: Record<ScaleStep, number> = {
    50: 0.975,
    100: 0.94,
    200: 0.885,
    300: 0.81,
    400: 0.71,
    500: 0.625,
    600: 0.545,
    700: 0.475,
    800: 0.41,
    900: 0.36,
    950: 0.27,
  };
  const taper: Record<ScaleStep, number> = {
    50: 0.12,
    100: 0.22,
    200: 0.42,
    300: 0.7,
    400: 0.9,
    500: 1,
    600: 1,
    700: 0.92,
    800: 0.78,
    900: 0.62,
    950: 0.45,
  };
  const own = scaleSteps.reduce((best, step) =>
    Math.abs(ramp[step] - base.l) < Math.abs(ramp[best] - base.l) ? step : best,
  );
  const scale = {} as ColorScale;
  for (const step of scaleSteps) {
    scale[step] =
      step === own
        ? hex.toUpperCase()
        : oklchColorToHex({ l: ramp[step], c: base.c * taper[step], h: base.h }, true);
  }
  return scale;
}
