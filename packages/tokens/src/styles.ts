/*
 * Design styles (ADR-0070): a style is data. Its hues, fonts, shape, lines, shadow treatment,
 * label case and heading weight are the generator's inputs (`theme.ts`); every color role is
 * derived from them, never written here. Adding a style = one entry in `styles` plus its sheet.
 */

import type { TailwindHue } from "./tailwind-palette.js";
import type { PaletteColorName, RadiusRoleName, ShadowLayer, ShadowName } from "./types.js";

/** Style ids (`data-ok-style`). Soft is the default; ST4 adds the other eight. */
export const styleNames = ["soft"] as const;
export type StyleName = (typeof styleNames)[number];

const sans =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** A font stack: the family (its Fontsource variable build first), then the system fallbacks. */
export const fontStack = (family: string, fallback = sans) =>
  `"${family} Variable", "${family}", ${fallback}`;

/** How a style draws depth (ADR-0070 § 4.4). */
export type ShadowTreatment = "soft" | "subtle" | "flat" | "hard";

export interface StyleDefinition {
  id: string;
  /** Display name (toolbar menus, docs). */
  name: string;
  /** Tailwind hue of each palette color, and the neutral scale (greys, text, surfaces). */
  hues: Record<PaletteColorName | "neutral", TailwindHue>;
  /** Hues of the default chart series 1–8, in order (`--ok-chart-series-*`). */
  chart: readonly TailwindHue[];
  fonts: { text: string; heading: string; label: string; mono: string };
  /** Google Fonts families to load (the docs give the link; Owlky doesn't bundle fonts). */
  fontLinks: readonly string[];
  /** Heading variants: weight of h1–h3 and h4–h6, case and tracking. */
  heading: { weight: number; weightSmall: number; textTransform: string; letterSpacing: string };
  /** The label role (buttons, chips, tabs, column headers, overlines). */
  label: { textTransform: string; letterSpacing: string };
  radius: Record<RadiusRoleName, string>;
  /** Surface edge width; its color is `transparent` for shadow styles, else the ink color. */
  surfaceBorder: { width: string; ink: boolean };
  shadows: ShadowTreatment;
  /** Shadow layers per name for `soft` / `subtle` treatments. */
  shadowLayers?: Partial<Record<ShadowName, ShadowLayer[]>>;
  /** Tint of the light scheme's shadows: a palette color's step, or the neutral 500. */
  shadowTint: { hue: PaletteColorName | "neutral"; step: 500 | 700 | 900 | 950 };
  /** `--ok-icon-stroke` (component icons). High contrast uses at least 1.75. */
  iconStroke: number;
}

const layer = (x: number, y: number, blur: number, spread: number, alpha: number): ShadowLayer => ({
  x,
  y,
  blur,
  spread,
  alpha,
});

export const soft: StyleDefinition = {
  id: "soft",
  name: "Soft",
  hues: {
    primary: "indigo",
    secondary: "violet",
    info: "sky",
    success: "green",
    warning: "amber",
    error: "red",
    neutral: "zinc",
  },
  chart: ["indigo", "teal", "orange", "sky", "pink", "amber", "green", "violet"],
  fonts: {
    text: fontStack("Nunito"),
    heading: fontStack("Nunito"),
    label: fontStack("Nunito"),
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontLinks: ["Nunito:wght@400..800"],
  heading: { weight: 800, weightSmall: 700, textTransform: "none", letterSpacing: "normal" },
  label: { textTransform: "none", letterSpacing: "normal" },
  radius: {
    control: "10px",
    "control-sm": "6px",
    inner: "4px",
    surface: "18px",
    "surface-md": "14px",
    "surface-sm": "10px",
    chip: "9999px",
  },
  surfaceBorder: { width: "0px", ink: false },
  shadows: "soft",
  // Two layers each: a tight contact shadow and a long, soft one (ADR-0070 § 1). z1–z8 have no
  // spread: they double as `--ok-drop-shadow-*` filters.
  shadowLayers: {
    z1: [layer(0, 1, 2, 0, 10), layer(0, 1, 3, 0, 8)],
    z4: [layer(0, 1, 2, 0, 10), layer(0, 4, 10, 0, 10)],
    z8: [layer(0, 1, 3, 0, 10), layer(0, 8, 20, 0, 12)],
    z12: [layer(0, 2, 4, 0, 10), layer(0, 12, 30, -4, 12)],
    z16: [layer(0, 2, 6, 0, 10), layer(0, 16, 40, -6, 14)],
    z20: [layer(0, 3, 8, 0, 10), layer(0, 20, 50, -8, 14)],
    z24: [layer(0, 4, 10, 0, 10), layer(0, 24, 60, -10, 16)],
    card: [layer(0, 0, 2, 0, 14), layer(0, 10, 30, -4, 12)],
    dropdown: [layer(0, 0, 2, 0, 18), layer(-16, 16, 40, -4, 18)],
    dialog: [layer(0, 0, 2, 0, 12), layer(-40, 40, 80, -8, 20)],
    dialogStart: [layer(0, 0, 2, 0, 12), layer(40, 40, 80, -8, 20)],
  },
  shadowTint: { hue: "primary", step: 950 },
  iconStroke: 1.5,
};

export const styles: Record<StyleName, StyleDefinition> = { soft };
