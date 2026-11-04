export const paletteColorNames = [
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
] as const;

export type PaletteColorName = (typeof paletteColorNames)[number];

/** Colors a component can take through `data-mt-color` (bound to `--mt-c-*`). */
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

export const greyShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type GreyShade = (typeof greyShades)[number];
export type GreyScale = Record<GreyShade, string>;

/** Values that differ between light and dark mode. */
export interface ColorScheme {
  /** Text tone of each palette color on this scheme's surfaces (outlined/soft/text variants). AA on paper. */
  paletteText: Record<PaletteColorName, string>;
  text: { primary: string; secondary: string; disabled: string };
  background: { default: string; paper: string; neutral: string };
  /** The neutral `inherit` component color. */
  inherit: { main: string; hover: string; contrast: string };
  divider: string;
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
  /** `secondary` = display font (headings h1–h3). Default `primary`. */
  fontFamily?: "primary" | "secondary";
  textTransform?: "uppercase" | "none";
}

export interface Typography {
  fontFamily: string;
  /** Display font for large headings. */
  fontFamilySecondary: string;
  fontFamilyMono: string;
  fontWeight: {
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  /** Font-size scale for component text that isn't a typography variant (e.g. button sizes). */
  fontSize: Record<"xs" | "sm" | "md" | "lg" | "xl", string>;
  variants: Record<TypographyVariant, TypographyStyle>;
}

export const radiusNames = ["xs", "sm", "md", "lg", "xl", "2xl", "full"] as const;
export type RadiusName = (typeof radiusNames)[number];

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
] as const;
export type ShadowName = (typeof shadowNames)[number];

export interface Theme {
  palette: Record<PaletteColorName, PaletteColor>;
  grey: GreyScale;
  common: { white: string; black: string };
  schemes: { light: ColorScheme; dark: ColorScheme };
  typography: Typography;
  radius: Record<RadiusName, string>;
  /** Base spacing unit. Spacing step `n` = `n × spacing`. */
  spacing: string;
  /** Breakpoint min-widths in px. */
  breakpoints: Record<BreakpointName, number>;
  shadows: Record<ShadowName, ShadowLayer[]>;
  /**
   * System elevations 1–24 (index 0 = elevation 1): umbra, penumbra and ambient layers, tinted
   * with the scheme's shadow color.
   */
  elevation: ShadowLayer[][];
  /** Shadow under filled (contained) components, tinted with their palette color. */
  colorShadow: ShadowLayer;
  zIndex: { dropdown: number; modal: number; toast: number; tooltip: number };
  motion: {
    duration: { shortest: string; shorter: string; short: string; standard: string };
    easing: { standard: string; decelerate: string; accelerate: string };
  };
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
