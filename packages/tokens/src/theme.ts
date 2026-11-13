/*
 * A style → a theme (ADR-0070): the generator (`roles.ts`) derives every color role of the style
 * at both contrast levels from its hues (or brand colors), and the style's shape, fonts and
 * shadows complete the shared base (`default-theme.ts`).
 */
import { baseTheme, elevationLayers } from "./default-theme.js";
import {
  brandScale,
  type ColorRoles,
  type ContrastLevel,
  colorRoles,
  graphicTone,
  hexScale,
  neutralRoles,
  neutralSurfaces,
} from "./roles.js";
import { type StyleDefinition, soft } from "./styles.js";
import { type ColorScale, tailwindPalette } from "./tailwind-palette.js";
import {
  type ColorScheme,
  type PaletteColor,
  type PaletteColorName,
  paletteColorNames,
  type ShadowLayer,
  type ShadowName,
  shadowNames,
  type Theme,
} from "./types.js";

/** Brand colors (`#RRGGBB`) that replace a style's hues; each becomes an 11-step scale. */
export interface BrandColors {
  primary?: string;
  secondary?: string;
  neutral?: string;
}

/** Font stacks that replace a style's families. */
export interface ThemeFonts {
  text?: string;
  heading?: string;
  label?: string;
  mono?: string;
}

export interface StyleThemeOptions {
  brand?: BrandColors | undefined;
  fonts?: ThemeFonts | undefined;
}

type ScaleName = PaletteColorName | "neutral";

function scalesOf(style: StyleDefinition, brand: BrandColors = {}): Record<ScaleName, ColorScale> {
  const result = {} as Record<ScaleName, ColorScale>;
  for (const name of [...paletteColorNames, "neutral"] as const) {
    const hex = (brand as Record<string, string | undefined>)[name];
    result[name] = hex ? brandScale(hex) : hexScale(tailwindPalette[style.hues[name]]);
  }
  return result;
}

interface ContrastColors {
  palette: Record<PaletteColorName, PaletteColor>;
  schemes: { light: ColorScheme; dark: ColorScheme };
  grey: Theme["grey"];
}

function colorsAt(
  style: StyleDefinition,
  scales: Record<ScaleName, ColorScale>,
  level: ContrastLevel,
): ContrastColors {
  const neutral = neutralRoles(scales.neutral, level);
  const surfaces = neutralSurfaces(scales.neutral);
  const roles = {} as Record<PaletteColorName, ColorRoles>;
  for (const name of paletteColorNames) roles[name] = colorRoles(scales[name], surfaces, level);
  // A chart hue that is a palette hue follows that color's scale (a brand color included).
  const chartScale = (hue: StyleDefinition["chart"][number]) => {
    const owner = paletteColorNames.find((name) => style.hues[name] === hue);
    return owner ? scales[owner] : hexScale(tailwindPalette[hue]);
  };
  const chart = style.chart.map((hue) => graphicTone(chartScale(hue), surfaces, level));
  const tintScale =
    style.shadowTint.hue === "neutral" ? scales.neutral : scales[style.shadowTint.hue];
  const scheme = (mode: "light" | "dark"): ColorScheme => {
    const base = neutral[mode];
    const paletteText = {} as ColorScheme["paletteText"];
    for (const name of paletteColorNames) paletteText[name] = roles[name].text[mode];
    return {
      ...base,
      paletteText,
      chart: chart.map((tone) => tone[mode]),
      shadowColor: mode === "light" ? tintScale[style.shadowTint.step] : base.shadowColor,
      surfaceBorder: style.surfaceBorder.ink ? base.text.primary : "transparent",
    };
  };
  const palette = {} as Record<PaletteColorName, PaletteColor>;
  for (const name of paletteColorNames) palette[name] = roles[name].color;
  return { palette, schemes: { light: scheme("light"), dark: scheme("dark") }, grey: neutral.grey };
}

/** Shadows by treatment (ADR-0070 § 4.4). */
function shadowsOf(style: StyleDefinition): {
  shadows: Record<ShadowName, ShadowLayer[]>;
  elevation: ShadowLayer[][];
  colorShadow: ShadowLayer;
} {
  const shadows = {} as Record<ShadowName, ShadowLayer[]>;
  const material = elevationLayers();
  if (style.shadows === "flat") {
    for (const name of shadowNames) shadows[name] = [];
    return {
      shadows,
      elevation: material.map(() => []),
      colorShadow: { x: 0, y: 0, blur: 0, spread: 0, alpha: 0 },
    };
  }
  if (style.shadows === "hard") {
    // Offsets of 2 / 4 / 6 / 8px without blur, in the ink color (elevation n → n steps).
    const hard = (step: number): ShadowLayer[] => [
      { x: step * 2, y: step * 2, blur: 0, spread: 0, alpha: 100 },
    ];
    const steps: Record<ShadowName, number> = {
      z1: 1,
      z4: 2,
      z8: 2,
      z12: 3,
      z16: 3,
      z20: 4,
      z24: 4,
      card: 2,
      dropdown: 2,
      dialog: 4,
      dialogStart: 4,
    };
    for (const name of shadowNames) shadows[name] = hard(steps[name]);
    return {
      shadows,
      elevation: material.map((_, i) => hard(Math.min(4, Math.ceil((i + 1) / 6)))),
      colorShadow: { x: 2, y: 2, blur: 0, spread: 0, alpha: 100 },
    };
  }
  for (const name of shadowNames) shadows[name] = style.shadowLayers?.[name] ?? [];
  return {
    shadows,
    elevation: material,
    colorShadow:
      style.shadows === "subtle"
        ? { x: 0, y: 2, blur: 6, spread: 0, alpha: 20 }
        : { x: 0, y: 8, blur: 20, spread: -2, alpha: 28 },
  };
}

/**
 * The theme of a style: every color role at both contrast levels (from its hues or `brand`),
 * its fonts (or `fonts`), radius roles, surface edge, shadows and icon stroke on the shared base.
 */
export function styleTheme(style: StyleDefinition, options: StyleThemeOptions = {}): Theme {
  const scales = scalesOf(style, options.brand);
  const normal = colorsAt(style, scales, "default");
  const high = colorsAt(style, scales, "high");
  const fonts = { ...style.fonts, ...options.fonts };
  const variants = { ...baseTheme.typography.variants };
  for (const name of ["h1", "h2", "h3", "h4", "h5", "h6"] as const) {
    const small = name === "h4" || name === "h5" || name === "h6";
    variants[name] = {
      ...variants[name],
      fontFamily: "heading",
      fontWeight: small ? style.heading.weightSmall : style.heading.weight,
      textTransform: style.heading.textTransform as "none" | "uppercase",
      letterSpacing: style.heading.letterSpacing,
    };
  }
  return {
    ...baseTheme,
    style: style.id,
    palette: normal.palette,
    grey: normal.grey,
    schemes: normal.schemes,
    highContrast: {
      palette: high.palette,
      schemes: high.schemes,
      focusRingWidth: "3px",
      iconStroke: String(Math.max(1.75, style.iconStroke)),
    },
    surface: {
      borderWidth: style.surfaceBorder.width,
      borderStyle: Number.parseFloat(style.surfaceBorder.width) > 0 ? "solid" : "none",
    },
    typography: {
      ...baseTheme.typography,
      fontFamily: fonts.text,
      fontFamilyHeading: fonts.heading,
      fontFamilyLabel: fonts.label,
      fontFamilyMono: fonts.mono,
      label: { ...style.label },
      heading: {
        textTransform: style.heading.textTransform,
        letterSpacing: style.heading.letterSpacing,
      },
      variants,
    },
    radiusRole: { ...style.radius },
    icon: { stroke: String(style.iconStroke) },
    ...shadowsOf(style),
  };
}

/** The default theme: Soft (ADR-0070 § 1). */
export const defaultTheme: Theme = /* @__PURE__ */ styleTheme(soft);
