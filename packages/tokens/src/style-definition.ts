/*
 * Design styles (ADR-0070): a style is data. Its hues, fonts, shape, lines, shadow treatment,
 * label case and heading weight are the generator's inputs (`theme.ts`); every color role is
 * derived from them, never written in a definition. One file per style in `styles/`, listed in
 * `styles.ts` (ADR-0073: adding a style is that file, its list entries and a size budget).
 */

import type { TailwindHue } from "./tailwind-palette.js";
import type { PaletteColorName, RadiusRoleName, ShadowTreatment, Typography } from "./types.js";

const sans =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** The default monospace stack (styles without a monospace family of their own). */
export const monoStack =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

/** A font stack: the family (its Fontsource variable build first), then the system fallbacks. */
export const fontStack = (family: string, fallback = sans) =>
  `"${family} Variable", "${family}", ${fallback}`;

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
  /**
   * The weight scale (`--ok-font-weight-*`) for fonts with another range: Space Grotesk stops
   * at 700, so its `extrabold` is 700. Omitted keys keep 400 / 500 / 600 / 700 / 800.
   */
  fontWeight?: Partial<Typography["fontWeight"]>;
  radius: Record<RadiusRoleName, string>;
  /**
   * `--ok-border-width` (dividers, outlined variants, fields), `-strong` (focused fields,
   * indicators) and `-heavy`. Omitted: 1 / 2 / 3px.
   */
  borderWidth?: { default: string; strong: string; heavy: string };
  /** Surface edge width; its color is `transparent` for shadow styles, else the ink color. */
  surfaceBorder: { width: string; ink: boolean };
  /** How the style draws depth; the geometry is the treatment's (`shadows.ts`). */
  shadows: ShadowTreatment;
  /**
   * Tint of the light scheme's shadows: a palette color's step, or a neutral step. `hard`
   * shadows ignore it: they take the ink color (the text color) in both schemes.
   */
  shadowTint: { hue: PaletteColorName | "neutral"; step: 500 | 700 | 900 | 950 };
  /** `--ok-icon-stroke` (component icons). High contrast uses at least 1.75. */
  iconStroke: number;
}
