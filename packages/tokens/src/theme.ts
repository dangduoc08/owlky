/*
 * A style → a theme (ADR-0070): the generator (`roles.ts`) derives every color role of the style
 * at both contrast levels from its hues (or brand colors), and the style's shape, fonts and
 * shadows complete the shared base (`default-theme.ts`).
 */
import { baseTheme } from "./default-theme.js";
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
import { elevationShadows, treatmentShadows } from "./shadows.js";
import type { StyleDefinition } from "./style-definition.js";
import { soft } from "./styles/soft.js";
import { type ColorScale, tailwindPalette } from "./tailwind-palette.js";
import {
  type ColorScheme,
  type PaletteColor,
  type PaletteColorName,
  paletteColorNames,
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
      // Hard shadows are ink, like the surface edge, in both schemes.
      shadowColor:
        style.shadows === "hard"
          ? base.text.primary
          : mode === "light"
            ? tintScale[style.shadowTint.step]
            : base.shadowColor,
      surfaceBorder: style.surfaceBorder.ink ? base.text.primary : "transparent",
    };
  };
  const palette = {} as Record<PaletteColorName, PaletteColor>;
  for (const name of paletteColorNames) palette[name] = roles[name].color;
  return { palette, schemes: { light: scheme("light"), dark: scheme("dark") }, grey: neutral.grey };
}

/**
 * The theme of a style: every color role at both contrast levels (from its hues or `brand`),
 * its fonts (or `fonts`), weights, radius roles, borders, surface edge, shadow treatment and icon
 * stroke on the shared base.
 */
export function styleTheme(style: StyleDefinition, options: StyleThemeOptions = {}): Theme {
  const scales = scalesOf(style, options.brand);
  const normal = colorsAt(style, scales, "default");
  const high = colorsAt(style, scales, "high");
  const fonts = { ...style.fonts, ...options.fonts };
  const treatment = treatmentShadows(style.shadows);
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
      fontWeight: { ...baseTheme.typography.fontWeight, ...style.fontWeight },
      label: { ...style.label },
      heading: {
        textTransform: style.heading.textTransform,
        letterSpacing: style.heading.letterSpacing,
      },
      variants,
    },
    radiusRole: { ...style.radius },
    borderWidth: { ...(style.borderWidth ?? baseTheme.borderWidth) },
    icon: { stroke: String(style.iconStroke) },
    shadowTreatment: style.shadows,
    shadows: { ...treatment.shadows },
    elevation: [...elevationShadows],
    colorShadow: [...treatment.colorShadow],
  };
}

/** The default theme: Soft (ADR-0070 § 1). */
export const defaultTheme: Theme = /* @__PURE__ */ styleTheme(soft);
