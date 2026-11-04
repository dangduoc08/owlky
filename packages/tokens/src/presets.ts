/*
 * Theme presets (ADR-0017): primary color presets and font families from the reference "Settings"
 * drawer, applied with `data-ok-preset` / `data-ok-font` on any element, and the root font-size
 * range. Values follow the reference; the text tone of each preset is chosen for WCAG AA.
 */
import { contrastRatio, hexToRgb } from "./color.js";
import { defaultTheme } from "./default-theme.js";
import type { ColorScheme, PaletteColor } from "./types.js";

export const primaryPresetNames = ["default", "cyan", "purple", "blue", "orange", "red"] as const;
export type PrimaryPreset = (typeof primaryPresetNames)[number];

export const primaryPresets: Record<PrimaryPreset, PaletteColor> = {
  default: defaultTheme.palette.primary,
  cyan: {
    lighter: "#CCF4FE",
    light: "#68CDF9",
    main: "#078DEE",
    dark: "#0351AB",
    darker: "#012972",
    contrastText: "#FFFFFF",
  },
  purple: {
    lighter: "#EBD6FD",
    light: "#B985F4",
    main: "#7635DC",
    dark: "#431A9E",
    darker: "#200A69",
    contrastText: "#FFFFFF",
  },
  blue: {
    lighter: "#CDE9FD",
    light: "#6BB1F8",
    main: "#0C68E9",
    dark: "#063BA7",
    darker: "#021D6F",
    contrastText: "#FFFFFF",
  },
  orange: {
    lighter: "#FEF4D4",
    light: "#FED680",
    main: "#FDA92D",
    dark: "#B66816",
    darker: "#793908",
    contrastText: "#1C252E",
  },
  red: {
    lighter: "#FFE3D5",
    light: "#FFC1AC",
    main: "#FF3030",
    dark: "#B71833",
    darker: "#7A0930",
    contrastText: "#FFFFFF",
  },
};

const sans =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const fontFamilyPresetNames = ["public-sans", "inter", "dm-sans", "nunito-sans"] as const;
export type FontFamilyPreset = (typeof fontFamilyPresetNames)[number];

/** Font stacks only: load the fonts yourself (e.g. Fontsource). */
export const fontFamilyPresets: Record<FontFamilyPreset, string> = {
  "public-sans": defaultTheme.typography.fontFamily,
  inter: `"Inter Variable", "Inter", ${sans}`,
  "dm-sans": `"DM Sans Variable", "DM Sans", ${sans}`,
  "nunito-sans": `"Nunito Sans Variable", "Nunito Sans", ${sans}`,
};

/** Root font size in px (every size is in rem, so the whole UI scales). */
export const fontSizeRange = { min: 12, max: 20, step: 1, default: 16 } as const;

const AA = 4.5;

/** `fg` at `percent` over `bg`, as hex (for the soft variant's 16 % tint). */
function tint(fg: string, percent: number, bg: string): string {
  const base = hexToRgb(bg);
  return `#${hexToRgb(fg)
    .map((c, i) => Math.round((c * percent + (base[i] as number) * (100 - percent)) / 100))
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Text tone of a palette color on a scheme (text / outlined / soft variants): the first of
 * `dark`, `darker` (light schemes) or `light`, `lighter` (dark schemes) that meets AA on the
 * scheme's surfaces and on the 16 % tint; the last candidate otherwise.
 */
export function paletteTextFor(color: PaletteColor, scheme: ColorScheme, dark: boolean): string {
  const candidates = dark ? [color.light, color.lighter] : [color.dark, color.darker];
  const surfaces = [
    scheme.background.paper,
    scheme.background.default,
    tint(color.main, 16, scheme.background.paper),
  ];
  return (
    candidates.find((candidate) =>
      surfaces.every((surface) => contrastRatio(candidate, surface) >= AA),
    ) ?? (candidates[candidates.length - 1] as string)
  );
}
