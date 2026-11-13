export const paletteColorNames = [
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
] as const;

export type PaletteColorName = (typeof paletteColorNames)[number];

/** Colors a component can take through `data-ok-color` (bound to `--ok-c-*`). */
export const componentColorNames = [...paletteColorNames, "black", "white"] as const;
export type ComponentColorName = (typeof componentColorNames)[number];

/** A component color, or `inherit` (neutral, follows the text color; no binding). */
export type ColorName = ComponentColorName | "inherit";

export interface PaletteColor {
  lighter: string;
  light: string;
  main: string;
  dark: string;
  darker: string;
  /** Text color placed on top of `main` (filled surfaces). Must meet WCAG AA (4.5:1). */
  contrastText: string;
}

export const greyShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type GreyShade = (typeof greyShades)[number];
export type GreyScale = Record<GreyShade, string>;

/** Values that differ between light and dark mode. */
export interface ColorScheme {
  /** Text tone of each palette color on this scheme's surfaces (outlined/soft/text variants). AA on paper. */
  paletteText: Record<PaletteColorName, string>;
  text: { primary: string; secondary: string; disabled: string };
  /**
   * `default`: the page background (`--ok-bg-default`); `contrast`: the page background with
   * `data-ok-surface="contrast"` (one neutral step away from paper).
   */
  background: { default: string; contrast: string; paper: string; neutral: string };
  /** The neutral `inherit` component color. */
  inherit: { main: string; hover: string; contrast: string };
  divider: string;
  /** Control borders (fields, outlined controls): 3:1 on the surfaces, 4.5:1 in high contrast. */
  border: string;
  /** Edge color of surfaces (`--ok-surface-border-color`), `transparent` in shadow styles. */
  surfaceBorder: string;
  action: {
    hover: string;
    selected: string;
    focus: string;
    disabled: string;
    disabledBackground: string;
  };
  /** Base color all elevation shadows are tinted with. */
  shadowColor: string;
  backdrop: string;
  /** Default categorical chart colors (`--ok-chart-series-1…8`): 3:1 on the surfaces. */
  chart: string[];
}

export const typographyVariants = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "subtitle1",
  "subtitle2",
  "body1",
  "body2",
  "caption",
  "overline",
  "button",
] as const;
export type TypographyVariant = (typeof typographyVariants)[number];

export const breakpointNames = ["xs", "sm", "md", "lg", "xl"] as const;
export type BreakpointName = (typeof breakpointNames)[number];

export interface TypographyStyle {
  /** Font size below the `sm` breakpoint. */
  fontSize: string;
  /** Larger font sizes from a breakpoint up (`min-width`). */
  responsiveFontSize?: Partial<Record<Exclude<BreakpointName, "xs">, string>>;
  lineHeight: string;
  fontWeight: number;
  /** `heading` = the heading family (h1–h3 today), `label` = the label family. Default `text`. */
  fontFamily?: "text" | "heading" | "label";
  textTransform?: "uppercase" | "none";
  /** Default `normal`. */
  letterSpacing?: string;
}

export const fontSizeNames = [
  "2xs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "quote",
  "code",
] as const;
export type FontSizeName = (typeof fontSizeNames)[number];

export interface Typography {
  /** Text family (`--ok-font-family`). */
  fontFamily: string;
  /** Heading family (`--ok-font-family-heading`). */
  fontFamilyHeading: string;
  /** Label family (`--ok-font-family-label`): buttons, chips, tabs, column headers. */
  fontFamilyLabel: string;
  fontFamilyMono: string;
  /** Case and tracking of the label role (`--ok-label-text-transform`, `--ok-label-letter-spacing`). */
  label: { textTransform: string; letterSpacing: string };
  /** Case and tracking of h1–h6 (`--ok-heading-text-transform`, `--ok-heading-letter-spacing`). */
  heading: { textTransform: string; letterSpacing: string };
  fontWeight: {
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  /**
   * Font-size scale for component text that isn't a typography variant (button sizes, tooltips,
   * quotes; `code` is relative to the surrounding text).
   */
  fontSize: Record<FontSizeName, string>;
  /** Size of the decorative quote mark of block quotes (`--ok-typography-quote-mark-size`). */
  quoteMarkSize: string;
  variants: Record<TypographyVariant, TypographyStyle>;
}

/** The radius scale, for authors and Tailwind. Components use the roles. */
export const radiusNames = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "full"] as const;
export type RadiusName = (typeof radiusNames)[number];

/** Radius roles that components read (`--ok-radius-<role>`, ADR-0070). */
export const radiusRoleNames = [
  "control",
  "control-sm",
  "inner",
  "surface",
  "surface-md",
  "surface-sm",
  "chip",
] as const;
export type RadiusRoleName = (typeof radiusRoleNames)[number];

/** SVG strokes and thin rings (`--ok-line-width-<name>`). */
export const lineWidthNames = ["hairline", "2xs", "xs", "sm", "md", "lg", "xl", "2xl"] as const;
export type LineWidthName = (typeof lineWidthNames)[number];

/** Control sizes that density changes (`--ok-<name>`, ADR-0070 § 4.6). */
export const densityNames = [
  "control-height-xs",
  "control-height-sm",
  "control-height-md",
  "control-height-lg",
  "control-height-xl",
  "fab-height-sm",
  "toggle-group-height-sm",
  "toggle-group-height-md",
  "toggle-group-height-lg",
  "pagination-size-sm",
  "pagination-size-md",
  "pagination-size-lg",
  "control-padding-x-sm",
  "control-padding-x-md",
  "control-padding-x-lg",
  "field-padding-y",
  "field-padding-y-sm",
  "field-padding-x",
  "item-height",
  "item-height-sm",
  "item-height-dense",
  "item-padding-y",
  "item-padding-x",
  "chip-height",
  "chip-height-sm",
  "tab-height",
  "cell-padding-y",
  "cell-padding-y-sm",
  "cell-padding-x",
  "row-height",
  "row-height-header",
  "accordion-summary-height",
  "switch-padding-x",
  "switch-padding-y",
  "switch-padding-x-sm",
  "switch-padding-y-sm",
] as const;
export type DensityName = (typeof densityNames)[number];

/** One shadow layer; the color is `shadowColor` (or a palette color) at `alpha`. */
export interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  alpha: number;
}

export const shadowNames = [
  "z1",
  "z4",
  "z8",
  "z12",
  "z16",
  "z20",
  "z24",
  "card",
  "dropdown",
  "dialog",
  "dialogStart",
] as const;
export type ShadowName = (typeof shadowNames)[number];

/**
 * How a style draws depth (ADR-0070 § 4.4): `soft` (two tinted layers), `subtle` (one short
 * layer), `flat` (no shadows: the surface border draws the edge), `hard` (offset, no blur, ink).
 */
export const shadowTreatments = ["soft", "subtle", "flat", "hard"] as const;
export type ShadowTreatment = (typeof shadowTreatments)[number];

export const skinToneNames = ["light", "medium", "deep"] as const;
export type SkinToneName = (typeof skinToneNames)[number];

export interface Theme {
  palette: Record<PaletteColorName, PaletteColor>;
  /**
   * Fills of the ink colors in the dark scheme (`StyleDefinition.ink`): `main`, `dark` and
   * `contrastText` that switch with the scheme. Other colors' fills are the same in both schemes.
   */
  darkPalette?: Partial<Record<PaletteColorName, PaletteColor>>;
  grey: GreyScale;
  common: { white: string; black: string };
  /**
   * Decorative colors of the illustration set (Foundations › Illustrations, ADR-0041) that no
   * palette color covers: the skin tones of its people. Never used for text.
   */
  illustration: { skin: Record<SkinToneName, string> };
  schemes: { light: ColorScheme; dark: ColorScheme };
  /** The style this theme was built from (`data-ok-style`, ADR-0070). */
  style: string;
  /**
   * Colors and line widths with `data-ok-contrast="high"`: text 7:1, graphics 4.5:1, the same
   * hues with only their lightness moved (ADR-0070 § 7).
   */
  highContrast: {
    palette: Record<PaletteColorName, PaletteColor>;
    darkPalette?: Partial<Record<PaletteColorName, PaletteColor>>;
    schemes: { light: ColorScheme; dark: ColorScheme };
    focusRingWidth: string;
    iconStroke: string;
  };
  /** The edge every surface draws (Paper and the surfaces built on it). */
  surface: { borderWidth: string; borderStyle: "none" | "solid" };
  typography: Typography;
  radius: Record<RadiusName, string>;
  radiusRole: Record<RadiusRoleName, string>;
  /** `--ok-border-width` (default), `-strong`, `-heavy`. */
  borderWidth: { default: string; strong: string; heavy: string };
  lineWidth: Record<LineWidthName, string>;
  /**
   * Focus rings (`--ok-focus-ring-*`). The colors may reference scheme tokens: they are declared
   * in every scheme scope.
   */
  focusRing: {
    width: string;
    offset: string;
    inset: string;
    offsetTight: string;
    color: string;
    colorBrand: string;
  };
  /** Control sizes with `data-ok-density="comfortable"` (the default). */
  density: Record<DensityName, string>;
  /** Control sizes with `data-ok-density="compact"`. */
  densityCompact: Record<DensityName, string>;
  /** Stroke width of component icons (`--ok-icon-stroke`, a number of user units). */
  icon: { stroke: string };
  /** Base spacing unit. Spacing step `n` = `n × spacing`. */
  spacing: string;
  /** Breakpoint min-widths in px. */
  breakpoints: Record<BreakpointName, number>;
  /** How the style draws depth (ADR-0070 § 4.4, ADR-0073): the treatment of `shadows`. */
  shadowTreatment: ShadowTreatment;
  shadows: Record<ShadowName, ShadowLayer[]>;
  /**
   * Elevations 1–24 (index 0 = elevation 1): the named shadow each level aliases
   * (`--ok-elevation-<n>: var(--ok-shadow-<name>)`), so every treatment reaches them.
   */
  elevation: ShadowName[];
  /**
   * Shadow under filled (contained) components: tinted with their palette color, or the scheme's
   * shadow color in the `hard` treatment. Empty = none.
   */
  colorShadow: ShadowLayer[];
  zIndex: {
    mobileStepper: number;
    dropdown: number;
    modal: number;
    toast: number;
    tooltip: number;
  };
  motion: {
    /**
     * UI transitions (`shortest`…`standard`), Motion entrances and exits (`enter`, `exit`) and the
     * cycles of loaders and cursors (`spin`…`caretBlink`). Not style values.
     */
    duration: {
      shortest: string;
      shorter: string;
      short: string;
      standard: string;
      exit: string;
      enter: string;
      spin: string;
      spinReduced: string;
      spinSlow: string;
      progressRotate: string;
      progressRotateReduced: string;
      progressBar: string;
      progressBarDelay: string;
      progressBarReduced: string;
      progressBarReducedDelay: string;
      progressBuffer: string;
      hintDelay: string;
      caretBlink: string;
    };
    easing: {
      standard: string;
      decelerate: string;
      accelerate: string;
      expressive: string;
      inOut: string;
      progress1: string;
      progress2: string;
    };
  };
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
