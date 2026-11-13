/*
 * Theme → CSS (ADR-0070 § 3, switch technique ADR-0072). Five axes nest independently:
 *
 * - Style scope (`:where(:root), [data-ok-style="<id>"]`): the style's literal tokens (radius,
 *   fonts, greys…) and its private inputs `--_ok-<token>--<variant>`, one literal per variant of
 *   every token that an axis changes (`--l` light, `--d` dark, `--h` light high contrast, `--dh`
 *   dark high contrast, `--s` / `--ds` the contrast surface). Every input is always declared, so
 *   a nested style never inherits another style's variants.
 * - Axis scopes (`data-ok-theme`, `data-ok-contrast`, `data-ok-surface`) declare only switches:
 *   pairs of space toggles (`--_ok-d1: initial` + `--_ok-d0: ;` in a dark scope).
 *   `var(--_ok-d1, A) var(--_ok-d0, B)` is A in a dark scope and B elsewhere, exactly (no color
 *   math, so computed colors keep their `rgb()` serialization).
 * - One resolver on every scope element declares each public token from the inputs and switches,
 *   so the nearest scope of each axis wins. Density only sets literal sizes (it depends on no
 *   other axis), so its scopes declare the tokens themselves.
 *
 * Everything sits in `@layer theme`: unlayered author CSS overrides any token.
 */
import { hexToRgb } from "./color.js";
import { treatmentShadows } from "./shadows.js";
import {
  breakpointNames,
  type ColorScheme,
  componentColorNames,
  densityNames,
  fontSizeNames,
  greyShades,
  lineWidthNames,
  type PaletteColor,
  paletteColorNames,
  radiusNames,
  radiusRoleNames,
  type ShadowLayer,
  type ShadowName,
  type ShadowTreatment,
  shadowNames,
  shadowTreatments,
  skinToneNames,
  type Theme,
  typographyVariants,
} from "./types.js";

/** Public `--ok-*` and private `--_ok-*` (theme plumbing) custom properties. */
export type CssVariables = Record<`--ok-${string}` | `--_ok-${string}`, string>;

export interface ThemeCssVariables {
  /** Every token that isn't a scheme color: literals, and formulas over other tokens. */
  root: CssVariables;
  /** Scheme colors, light and dark (default contrast, default surface). */
  light: CssVariables;
  dark: CssVariables;
}

/** Component color bindings. Non-inheriting, so a colored parent never leaks into children. */
export const colorBindingVariables = [
  "--ok-c-main",
  "--ok-c-channel",
  "--ok-c-lighter",
  "--ok-c-light",
  "--ok-c-hover",
  "--ok-c-darker",
  "--ok-c-contrast",
  "--ok-c-text",
  "--ok-c-shadow",
] as const;

/** `#4F39F6` → `79 57 246`, for `rgb(var(--…-channel) / <alpha>)`. */
const channel = (hex: string) => hexToRgb(hex).join(" ");

const kebab = (value: string) => value.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Motion keys: `spinReduced` → `spin-reduced`, `progress1` → `progress-1`. */
const motionName = (value: string) => kebab(value).replace(/(?<=[a-z])(\d)/g, "-$1");

const px = (value: number) => (value === 0 ? "0" : `${value}px`);

/** The shadow color at `alpha` %: a shared private token per alpha, or a `color-mix()`. */
const SHADOW_COLOR = "var(--ok-shadow-color)";
const shadowAlpha = (alpha: number) => `--_ok-sc${alpha}` as const;
const tinted = (color: string, alpha: number) =>
  alpha >= 100
    ? color
    : color === SHADOW_COLOR
      ? `var(${shadowAlpha(alpha)})`
      : `color-mix(in srgb, ${color} ${alpha}%, transparent)`;

const shadow = (layers: readonly ShadowLayer[], color: string) =>
  layers.length === 0
    ? "none"
    : layers
        .map((l) => `${px(l.x)} ${px(l.y)} ${px(l.blur)} ${px(l.spread)} ${tinted(color, l.alpha)}`)
        .join(", ");

/**
 * The same layers as a `filter` value (`drop-shadow()` per layer), for shapes that a box shadow
 * would draw around their box (SVG pins, icons). Only layers without spread: `drop-shadow()` has none.
 */
const dropShadow = (layers: readonly ShadowLayer[], color: string) =>
  layers.length === 0
    ? "none"
    : layers
        .map((l) => `drop-shadow(${px(l.x)} ${px(l.y)} ${px(l.blur)} ${tinted(color, l.alpha)})`)
        .join(" ");

/** Custom shadows that also get a `--ok-drop-shadow-*` filter (their layers have no spread). */
export const dropShadowNames = ["z1", "z4", "z8"] as const;

/** Gradient fill of a palette color (`--ok-gradient-<color>`): `light` to `main`, diagonally. */
const gradientFill = (name: string) =>
  `linear-gradient(135deg, var(--ok-palette-${name}-light), var(--ok-palette-${name}-main))`;

/**
 * Translucent paper with two soft glows (info top-right, error bottom-left), like popovers: the
 * scheme's paper at 90 %, so a `backdrop-filter` behind it shows through.
 */
const GRADIENT_PAPER = [
  "radial-gradient(circle at 100% 0%, rgb(var(--ok-palette-info-main-channel) / 0.12), transparent 40%)",
  "radial-gradient(circle at 0% 100%, rgb(var(--ok-palette-error-main-channel) / 0.12), transparent 40%)",
  "linear-gradient(rgb(var(--ok-bg-paper-channel) / 0.9), rgb(var(--ok-bg-paper-channel) / 0.9))",
].join(", ");

/* Switches --------------------------------------------------------------------------------- */

/** Space toggles: `initial` = the axis value is active (its `var()` fallback is used). */
const ON = "initial";
const OFF = " ";
const IS = {
  dark: "--_ok-d1",
  light: "--_ok-d0",
  high: "--_ok-h1",
  normal: "--_ok-h0",
  contrast: "--_ok-s1",
  flat: "--_ok-s0",
} as const;

/** `a` where the toggle is active, `b` where its partner is. */
const when = (on: string, off: string, a: string, b: string) =>
  a === b ? a : `var(${on}, ${a}) var(${off}, ${b})`;

/* Variant tokens ---------------------------------------------------------------------------- */

/** Variants of a token: `""` (light, default contrast, default surface), then the others. */
type Variant = "" | "d" | "h" | "dh" | "s" | "ds";
/** The variant an omitted one falls back to. */
const FALLBACK: Record<Exclude<Variant, "">, Variant> = { d: "", h: "", dh: "d", s: "", ds: "d" };

type Axes = "dh" | "h" | "d" | "ds";
const VARIANTS: Record<Axes, Variant[]> = {
  dh: ["", "d", "h", "dh"],
  h: ["", "h"],
  d: ["", "d"],
  ds: ["", "d", "s", "ds"],
};

interface VariantToken {
  name: `--ok-${string}`;
  key: string;
  axes: Axes;
  values: Partial<Record<Variant, string>>;
}

/**
 * A token's input for one variant: `--_ok-t<key>-<variant>` (`l` light, `d` dark, `h` light high
 * contrast, `dh`, `s`, `ds`). Keys are the token's index in `variantTokens()` (base 36): short,
 * since every name appears once in the core sheet. Style sheets and `applyThemeBrand()` get the
 * names from the same function (`themeInputs()`), never by hand.
 */
const input = (token: VariantToken, variant: Variant) =>
  `--_ok-t${token.key}-${variant || "l"}` as `--_ok-${string}`;

/** The value a variant resolves to (its own, or its fallback's). */
function variantValue(token: VariantToken, variant: Variant): string {
  const own = token.values[variant];
  if (own !== undefined || variant === "") return own ?? "";
  return variantValue(token, FALLBACK[variant]);
}

/** One variant's input. */
/** One variant's input, falling back to the core theme's own value (the default style needs no inputs). */
const read = (token: VariantToken, variant: Variant) =>
  `var(${input(token, variant)}, ${variantValue(token, variant)})`;

/** The resolver's formula for one token. */
function formula(token: VariantToken): string {
  const r = (v: Variant) => read(token, v);
  switch (token.axes) {
    case "h":
      return when(IS.high, IS.normal, r("h"), r(""));
    case "d":
      return when(IS.dark, IS.light, r("d"), r(""));
    case "dh":
      return when(
        IS.dark,
        IS.light,
        when(IS.high, IS.normal, r("dh"), r("d")),
        when(IS.high, IS.normal, r("h"), r("")),
      );
    case "ds":
      return when(
        IS.dark,
        IS.light,
        when(IS.contrast, IS.flat, r("ds"), r("d")),
        when(IS.contrast, IS.flat, r("s"), r("")),
      );
  }
}

/** Inputs of one token: every variant, always (a nested style never inherits another's). */
function inputs(token: VariantToken, vars: CssVariables) {
  for (const variant of VARIANTS[token.axes])
    vars[input(token, variant)] = variantValue(token, variant);
}

/** Palette shades that high contrast moves; `lighter`, `light` and `darker` are fixed steps. */
const FILL_SHADES = ["main", "dark", "contrastText"] as const;
/**
 * Channels (`rgb(var(--…-channel) / α)`, ADR-0013) exist for the colors components tint: each
 * palette color's `main`, greys 500–900, black, white and paper.
 */
const CHANNEL_GREYS: readonly number[] = [500, 600, 700, 800, 900];
const TINT_SHADES = ["lighter", "light", "darker"] as const;

/** Every token an axis changes, with its values per variant. */
function variantTokens(theme: Theme): VariantToken[] {
  const tokens: VariantToken[] = [];
  const hc = theme.highContrast;
  const add = (name: `--ok-${string}`, axes: Axes, values: Partial<Record<Variant, string>>) =>
    tokens.push({ name, key: tokens.length.toString(36), axes, values });

  // Fills: the same in both schemes; high contrast moves them (the tints are style literals).
  for (const name of paletteColorNames) {
    const normal: PaletteColor = theme.palette[name];
    const high: PaletteColor = hc.palette[name];
    for (const shade of FILL_SHADES) {
      const token = `--ok-palette-${name}-${kebab(shade)}` as const;
      add(token, "h", { "": normal[shade], h: high[shade] });
      if (shade === "main")
        add(`${token}-channel`, "h", { "": channel(normal[shade]), h: channel(high[shade]) });
    }
  }

  // Scheme colors: light / dark × default / high contrast.
  const schemes: Record<"" | "d" | "h" | "dh", ColorScheme> = {
    "": theme.schemes.light,
    d: theme.schemes.dark,
    h: hc.schemes.light,
    dh: hc.schemes.dark,
  };
  // Text, lines and borders: what high contrast moves.
  const scheme = (name: `--ok-${string}`, pick: (s: ColorScheme) => string) =>
    add(name, "dh", {
      "": pick(schemes[""]),
      d: pick(schemes.d),
      h: pick(schemes.h),
      dh: pick(schemes.dh),
    });
  // Surfaces, fills and tints: light / dark only (high contrast keeps them).
  const surface = (name: `--ok-${string}`, pick: (s: ColorScheme) => string) =>
    add(name, "d", { "": pick(schemes[""]), d: pick(schemes.d) });
  for (const name of paletteColorNames)
    scheme(`--ok-palette-${name}-text`, (s) => s.paletteText[name]);
  scheme("--ok-text-primary", (s) => s.text.primary);
  scheme("--ok-text-secondary", (s) => s.text.secondary);
  surface("--ok-text-disabled", (s) => s.text.disabled);
  surface("--ok-bg-paper", (s) => s.background.paper);
  surface("--ok-bg-paper-channel", (s) => channel(s.background.paper));
  surface("--ok-bg-neutral", (s) => s.background.neutral);
  surface("--ok-inherit-main", (s) => s.inherit.main);
  surface("--ok-inherit-hover", (s) => s.inherit.hover);
  surface("--ok-inherit-contrast", (s) => s.inherit.contrast);
  scheme("--ok-divider", (s) => s.divider);
  scheme("--ok-control-border-color", (s) => s.border);
  surface("--ok-surface-border-color", (s) => s.surfaceBorder);
  surface("--ok-backdrop", (s) => s.backdrop);
  surface("--ok-shadow-color", (s) => s.shadowColor);

  // The page background: light / dark × default / contrast surface.
  add("--ok-bg-default", "ds", {
    "": theme.schemes.light.background.default,
    d: theme.schemes.dark.background.default,
    s: theme.schemes.light.background.contrast,
    ds: theme.schemes.dark.background.contrast,
  });

  // Lines that high contrast widens.
  add("--ok-focus-ring-width", "h", { "": theme.focusRing.width, h: hc.focusRingWidth });
  add("--ok-icon-stroke", "h", { "": theme.icon.stroke, h: hc.iconStroke });
  return tokens;
}

/* Literals and formulas -------------------------------------------------------------------- */

/** A style's literal tokens (inherited from the style scope). */
function styleLiterals(theme: Theme): CssVariables {
  const vars: CssVariables = {};
  for (const name of paletteColorNames) {
    for (const shade of TINT_SHADES) {
      const value = theme.palette[name][shade];
      vars[`--ok-palette-${name}-${shade}`] = value;
    }
  }
  for (const shade of greyShades) {
    vars[`--ok-palette-grey-${shade}`] = theme.grey[shade];
    if (CHANNEL_GREYS.includes(shade))
      vars[`--ok-palette-grey-${shade}-channel`] = channel(theme.grey[shade]);
  }
  const { typography } = theme;
  // Action states: translucent neutral 500, the same in both schemes (ADR-0069 § 6).
  const action = theme.schemes.light.action;
  vars["--ok-action-hover"] = action.hover;
  vars["--ok-action-selected"] = action.selected;
  vars["--ok-action-focus"] = action.focus;
  vars["--ok-action-disabled"] = action.disabled;
  vars["--ok-action-disabled-bg"] = action.disabledBackground;
  vars["--ok-font-family"] = typography.fontFamily;
  vars["--ok-font-family-heading"] = typography.fontFamilyHeading;
  vars["--ok-font-family-label"] = typography.fontFamilyLabel;
  vars["--ok-font-family-mono"] = typography.fontFamilyMono;
  vars["--ok-label-text-transform"] = typography.label.textTransform;
  vars["--ok-label-letter-spacing"] = typography.label.letterSpacing;
  vars["--ok-heading-text-transform"] = typography.heading.textTransform;
  vars["--ok-heading-letter-spacing"] = typography.heading.letterSpacing;
  for (const [name, weight] of Object.entries(typography.fontWeight)) {
    vars[`--ok-font-weight-${name}`] = String(weight);
  }
  for (const variant of typographyVariants) {
    const style = typography.variants[variant];
    vars[`--ok-typography-${variant}-font-weight`] = String(style.fontWeight);
    // Case and tracking: the label variants' own; headings share the heading tokens.
    if (variant === "overline" || variant === "button") {
      vars[`--ok-typography-${variant}-text-transform`] = style.textTransform ?? "none";
      vars[`--ok-typography-${variant}-letter-spacing`] = style.letterSpacing ?? "normal";
    }
  }
  for (const name of radiusNames) vars[`--ok-radius-${name}`] = theme.radius[name];
  for (const name of radiusRoleNames) vars[`--ok-radius-${name}`] = theme.radiusRole[name];
  vars["--ok-border-width"] = theme.borderWidth.default;
  vars["--ok-border-width-strong"] = theme.borderWidth.strong;
  vars["--ok-border-width-heavy"] = theme.borderWidth.heavy;
  vars["--ok-surface-border-width"] = theme.surface.borderWidth;
  vars["--ok-surface-border-style"] = theme.surface.borderStyle;
  for (const name of lineWidthNames) vars[`--ok-line-width-${name}`] = theme.lineWidth[name];
  vars["--ok-focus-ring-offset"] = theme.focusRing.offset;
  vars["--ok-focus-ring-inset"] = theme.focusRing.inset;
  vars["--ok-focus-ring-offset-tight"] = theme.focusRing.offsetTight;
  return vars;
}

/** Tokens no style changes: declared once, on `:root`. */
function baseLiterals(theme: Theme): CssVariables {
  const vars: CssVariables = {};
  vars["--ok-palette-common-white"] = theme.common.white;
  vars["--ok-palette-common-white-channel"] = channel(theme.common.white);
  vars["--ok-palette-common-black"] = theme.common.black;
  vars["--ok-palette-common-black-channel"] = channel(theme.common.black);
  for (const name of skinToneNames)
    vars[`--ok-illustration-skin-${name}`] = theme.illustration.skin[name];
  const { typography } = theme;
  for (const name of fontSizeNames) vars[`--ok-font-size-${name}`] = typography.fontSize[name];
  vars["--ok-typography-quote-mark-size"] = typography.quoteMarkSize;
  for (const variant of typographyVariants) {
    const style = typography.variants[variant];
    vars[`--ok-typography-${variant}-font-size`] = style.fontSize;
    vars[`--ok-typography-${variant}-line-height`] = style.lineHeight;
  }
  vars["--ok-spacing"] = theme.spacing;
  for (const name of breakpointNames) {
    vars[`--ok-breakpoint-${name}`] = `${theme.breakpoints[name]}px`;
  }
  for (const [name, value] of Object.entries(theme.zIndex)) {
    vars[`--ok-z-${kebab(name)}`] = String(value);
  }
  for (const [name, value] of Object.entries(theme.motion.duration)) {
    vars[`--ok-duration-${motionName(name)}`] = value;
  }
  for (const [name, value] of Object.entries(theme.motion.easing)) {
    vars[`--ok-easing-${motionName(name)}`] = value;
  }
  return vars;
}

const densityVariables = (values: Theme["density"]): CssVariables => {
  const vars: CssVariables = {};
  for (const name of densityNames) vars[`--ok-${name}`] = values[name];
  return vars;
};

/** Tokens defined from other tokens: re-declared on every scope element by the resolver. */
function formulaVariables(theme: Theme): CssVariables {
  const vars: CssVariables = {};
  for (const variant of typographyVariants) {
    const family = theme.typography.variants[variant].fontFamily;
    vars[`--ok-typography-${variant}-font-family`] =
      family === "heading" || family === "label"
        ? `var(--ok-font-family-${family})`
        : "var(--ok-font-family)";
  }
  vars["--ok-focus-ring-color"] = theme.focusRing.color;
  vars["--ok-focus-ring-color-brand"] = theme.focusRing.colorBrand;
  for (const name of paletteColorNames) {
    vars[`--ok-gradient-${name}`] = gradientFill(name);
    // From the scheme's text tone to the next shade away from the background, so every stop meets AA.
    vars[`--ok-gradient-${name}-text`] =
      `linear-gradient(90deg, var(--ok-palette-${name}-text), ${when(
        IS.dark,
        IS.light,
        `var(--ok-palette-${name}-lighter)`,
        `var(--ok-palette-${name}-darker)`,
      )})`;
  }
  vars["--ok-gradient-paper"] = GRADIENT_PAPER;
  // Shadows read the nearest scope's shadow color (and colored ones the scope's `main`), through
  // one private token per alpha.
  Object.assign(vars, alphaVariables(shadowAlphas(theme.shadows)));
  Object.assign(vars, shadowVariables(theme.shadows, theme.colorShadow, theme.shadowTreatment));
  // Elevations alias the nearest named shadow, so they follow every treatment (ADR-0073).
  theme.elevation.forEach((name, index) => {
    vars[`--ok-elevation-${index + 1}`] = `var(--ok-shadow-${kebab(name)})`;
  });
  return vars;
}

/** Every alpha the layers use below 100 %. */
const shadowAlphas = (shadows: Record<ShadowName, ShadowLayer[]>) =>
  new Set(
    shadowNames.flatMap((n) => shadows[n].map((l) => l.alpha)).filter((alpha) => alpha < 100),
  );

/** `--_ok-sc<alpha>`: the scope's shadow color at each alpha. */
function alphaVariables(alphas: Set<number>): CssVariables {
  const vars: CssVariables = {};
  for (const alpha of [...alphas].sort((a, b) => a - b))
    vars[shadowAlpha(alpha)] = `color-mix(in srgb, ${SHADOW_COLOR} ${alpha}%, transparent)`;
  return vars;
}

/** The shadow tokens of one geometry: named, drop-shadow filters and colored. */
function shadowVariables(
  shadows: Record<ShadowName, ShadowLayer[]>,
  colorShadow: ShadowLayer[],
  treatment: ShadowTreatment,
): CssVariables {
  const vars: CssVariables = {};
  for (const name of shadowNames)
    vars[`--ok-shadow-${kebab(name)}`] = shadow(shadows[name], SHADOW_COLOR);
  for (const name of dropShadowNames)
    vars[`--ok-drop-shadow-${name}`] = dropShadow(shadows[name], SHADOW_COLOR);
  const ink = treatmentShadows(treatment).colorInk;
  for (const name of paletteColorNames)
    vars[`--ok-shadow-${name}`] = shadow(
      colorShadow,
      ink ? SHADOW_COLOR : `var(--ok-palette-${name}-main)`,
    );
  return vars;
}

/* Shadow treatments (ADR-0073) ------------------------------------------------------------ */

/**
 * One toggle per treatment: `initial` for the scope's treatment, a space for the others. Only
 * opt-in sheets of a treatment other than soft declare them, with their shadow switch below.
 */
const TREATMENT_TOGGLE: Record<ShadowTreatment, `--_ok-${string}`> = {
  soft: "--_ok-ws",
  subtle: "--_ok-wu",
  flat: "--_ok-wf",
  hard: "--_ok-wh",
};

const treatmentToggles = (active: ShadowTreatment): CssVariables => {
  const vars: CssVariables = {};
  for (const t of shadowTreatments) vars[TREATMENT_TOGGLE[t]] = t === active ? ON : OFF;
  return vars;
};

/**
 * The shadow tokens as a switch over every treatment, for every scope element. Identical in each
 * sheet that carries it (generated from the treatments, not from the sheet's style), so two such
 * sheets never undo each other; the nearest style scope's toggles pick the branch.
 */
function treatmentSwitch(): CssVariables {
  const branches = shadowTreatments.map((t) => {
    const { shadows, colorShadow } = treatmentShadows(t);
    return { t, vars: shadowVariables(shadows, colorShadow, t) };
  });
  const core = shadowAlphas(treatmentShadows("soft").shadows);
  const extra = new Set<number>();
  for (const t of shadowTreatments)
    for (const alpha of shadowAlphas(treatmentShadows(t).shadows))
      if (!core.has(alpha)) extra.add(alpha);
  const vars: CssVariables = alphaVariables(extra);
  for (const name of Object.keys(branches[0]?.vars ?? {}) as `--ok-${string}`[]) {
    vars[name] = branches
      .map(({ t, vars: values }) => `var(${TREATMENT_TOGGLE[t]}, ${values[name]})`)
      .join(" ");
  }
  return vars;
}

/** The literal value of every scheme token for one scheme (docs, tests, `themeToCssVariables`). */
function schemeLiterals(tokens: VariantToken[], variant: "" | "d"): CssVariables {
  const vars: CssVariables = {};
  for (const token of tokens) {
    if (token.axes === "dh" || token.axes === "ds" || token.axes === "d")
      vars[token.name] = variantValue(token, variant);
  }
  return vars;
}

/**
 * Every color a theme sets on a scope, as custom properties to write through CSSOM
 * (`applyThemeBrand()`, ADR-0070 § 8): the inputs of every axis variant, and the color literals
 * (palette tints, greys and their channels). The resolver on the scope derives the public tokens.
 */
export function themeColorVariables(theme: Theme): CssVariables {
  const vars: CssVariables = {};
  for (const token of variantTokens(theme)) inputs(token, vars);
  for (const [name, value] of Object.entries(styleLiterals(theme)) as [`--ok-${string}`, string][])
    if (name.startsWith("--ok-palette-")) vars[name] = value;
  return vars;
}

export function themeToCssVariables(theme: Theme): ThemeCssVariables {
  const tokens = variantTokens(theme);
  const root: CssVariables = {
    ...baseLiterals(theme),
    ...styleLiterals(theme),
    ...densityVariables(theme.density),
    ...formulaVariables(theme),
  };
  for (const token of tokens) if (token.axes === "h") root[token.name] = variantValue(token, "");
  return {
    root,
    light: schemeLiterals(tokens, ""),
    dark: schemeLiterals(tokens, "d"),
  };
}

/** Responsive type sizes: the variables to override from each breakpoint up. */
export function responsiveTypographyVariables(theme: Theme): [minWidth: number, CssVariables][] {
  const result: [number, CssVariables][] = [];
  for (const breakpoint of breakpointNames) {
    if (breakpoint === "xs") continue;
    const vars: CssVariables = {};
    for (const variant of typographyVariants) {
      const size = theme.typography.variants[variant].responsiveFontSize?.[breakpoint];
      if (size) vars[`--ok-typography-${variant}-font-size`] = size;
    }
    if (Object.keys(vars).length > 0) result.push([theme.breakpoints[breakpoint], vars]);
  }
  return result;
}

const block = (selector: string, vars: CssVariables | Record<string, string>, extra = "") =>
  `  ${selector} {\n${extra}${Object.entries(vars)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join("\n")}\n  }`;

const indent = (css: string) => css.replace(/^/gm, "  ");

export const LAYER_ORDER = "@layer theme, base, components, utilities;";

export const DARK_SELECTOR = '[data-ok-theme="dark"], .dark';
export const LIGHT_SELECTOR = '[data-ok-theme="light"]';

/** Every element that may scope an axis whose tokens the resolver computes. */
export const SCOPE_SELECTOR =
  ":root, [data-ok-style], [data-ok-theme], .dark, [data-ok-surface], [data-ok-contrast]";

export interface ThemeCssOptions {
  /**
   * Where the theme's style tokens and inputs go. Default `:where(:root), [data-ok-style="<id>"]`
   * with the whole core (switches, resolver, density, base tokens, color bindings). Any other
   * selector writes only the style scope: an opt-in style sheet, or a theme for one subtree. A
   * theme whose shadow treatment isn't `soft` also writes the treatment toggles and the shared
   * shadow switch (ADR-0073); the switch must load after the core sheet.
   */
  selector?: string;
  /** Emit the `[data-ok-color]` bindings and their `@property` registrations. Default `true`. */
  colorBindings?: boolean;
  /**
   * With `selector`: the style's own attribute selector (`[data-ok-style="nordic"]`), so every
   * other style scope nested inside resets this style's inputs. Opt-in style sheets pass it.
   */
  reset?: string;
}

/** `--ok-c-*` values for one component color. */
function colorBinding(name: (typeof componentColorNames)[number]): CssVariables {
  if (name === "black" || name === "white") {
    const self = `--ok-palette-common-${name}`;
    const other = `--ok-palette-common-${name === "black" ? "white" : "black"}`;
    return {
      "--ok-c-main": `var(${self})`,
      "--ok-c-channel": `var(${self}-channel)`,
      "--ok-c-hover": `rgb(var(${self}-channel) / 0.72)`,
      "--ok-c-contrast": `var(${other})`,
      // Black text on a dark scheme (outlined, soft) would be invisible: it turns to the
      // scheme's text there (AA, ADR-0070 § 7); fills keep the absolute color.
      "--ok-c-text":
        name === "black"
          ? when(IS.dark, IS.light, "var(--ok-text-primary)", `var(${self})`)
          : `var(${self})`,
      "--ok-c-shadow": "var(--ok-shadow-z8)",
    };
  }
  return {
    "--ok-c-main": `var(--ok-palette-${name}-main)`,
    "--ok-c-channel": `var(--ok-palette-${name}-main-channel)`,
    // Palette colors only: black and white have no tints (components fall back).
    "--ok-c-lighter": `var(--ok-palette-${name}-lighter)`,
    "--ok-c-light": `var(--ok-palette-${name}-light)`,
    "--ok-c-hover": `var(--ok-palette-${name}-dark)`,
    "--ok-c-darker": `var(--ok-palette-${name}-darker)`,
    "--ok-c-contrast": `var(--ok-palette-${name}-contrast-text)`,
    "--ok-c-text": `var(--ok-palette-${name}-text)`,
    "--ok-c-shadow": `var(--ok-shadow-${name})`,
  };
}

/**
 * The style scope's declarations: literal tokens, and (for any scope but the core theme's) every
 * input. The core theme needs no inputs: the resolver falls back to its values.
 */
function styleScope(theme: Theme, tokens: VariantToken[], core: boolean): CssVariables {
  const vars = styleLiterals(theme);
  if (!core) for (const token of tokens) inputs(token, vars);
  return vars;
}

/** Every input name, reset to `initial` (a nested scope of another style must not inherit them). */
function resetInputs(tokens: VariantToken[]): CssVariables {
  const vars: CssVariables = {};
  for (const token of tokens)
    for (const variant of VARIANTS[token.axes]) vars[input(token, variant)] = "initial";
  return vars;
}

/**
 * Serializes a theme to CSS. Variables live in `@layer theme`, so any unlayered consumer CSS
 * overrides them. The layer order statement keeps library layers in Tailwind's order even when
 * this file loads before Tailwind (ADR-0003).
 */
export function themeToCss(theme: Theme, options: ThemeCssOptions = {}): string {
  const tokens = variantTokens(theme);
  const core = options.selector === undefined;
  const selector = options.selector ?? `:where(:root), [data-ok-style="${theme.style}"]`;
  // A treatment other than the core's: the style scope sets its toggle, the root and every other
  // style scope the soft one, and every scope element recomputes the shadows (ADR-0073).
  const treatment = !core && theme.shadowTreatment !== "soft";
  const scope = styleScope(theme, tokens, core);
  if (treatment) Object.assign(scope, treatmentToggles(theme.shadowTreatment));
  const parts = [LAYER_ORDER, "", "@layer theme {", block(selector, scope)];
  if (core) {
    const dark = { "--_ok-dark": "1", [IS.dark]: ON, [IS.light]: OFF };
    const light = { "--_ok-dark": "0", [IS.dark]: OFF, [IS.light]: ON };
    const high = { [IS.high]: ON, [IS.normal]: OFF };
    const normal = { [IS.high]: OFF, [IS.normal]: ON };
    parts.push(
      block(":root", baseLiterals(theme)),
      // Light last at equal specificity: an explicit `data-ok-theme="light"` beats `.dark`, and
      // `:where(:root)` lets any scope on the root element win.
      block(DARK_SELECTOR, dark, "    color-scheme: dark;\n"),
      block(`:where(:root), ${LIGHT_SELECTOR}`, light, "    color-scheme: light;\n"),
      "  @media (prefers-color-scheme: dark) {",
      indent(block('[data-ok-theme="system"]', dark, "    color-scheme: dark;\n")),
      "  }",
      // Any contrast scope starts off (`default`, `system`, unknown values); `high` and the
      // `system` preference switch it on below.
      block(":where(:root), [data-ok-contrast]", normal),
      block('[data-ok-contrast="high"]', high),
      "  @media (prefers-contrast: more) {",
      indent(block('[data-ok-contrast="system"]', high)),
      "  }",
      block(":where(:root), [data-ok-surface]", { [IS.contrast]: OFF, [IS.flat]: ON }),
      block('[data-ok-surface="contrast"]', { [IS.contrast]: ON, [IS.flat]: OFF }),
      block(":where(:root), [data-ok-density]", densityVariables(theme.density)),
      block('[data-ok-density="compact"]', densityVariables(theme.densityCompact)),
    );
    const resolver: CssVariables = {};
    for (const token of tokens) resolver[token.name] = formula(token);
    Object.assign(resolver, formulaVariables(theme));
    parts.push(block(SCOPE_SELECTOR, resolver));
    for (const [minWidth, vars] of responsiveTypographyVariables(theme)) {
      parts.push(`  @media (min-width: ${minWidth}px) {`, indent(block(":root", vars)), "  }");
    }
    if (options.colorBindings !== false) {
      for (const name of componentColorNames) {
        parts.push(block(`[data-ok-color="${name}"]`, colorBinding(name)));
      }
    }
  }
  if (treatment) {
    parts.push(
      block(":where(:root)", treatmentToggles("soft")),
      block(`${SCOPE_SELECTOR}, ${selector}`, treatmentSwitch()),
    );
  }
  if (!core && options.reset) {
    // Zero specificity: another style's own scope still declares its inputs over the reset.
    parts.push(
      block(`:where([data-ok-style]:not(${options.reset}))`, {
        ...resetInputs(tokens),
        ...(treatment ? treatmentToggles("soft") : {}),
      }),
    );
  }
  parts.push("}");
  if (core && options.colorBindings !== false) {
    parts.push(
      "",
      ...colorBindingVariables.map(
        (v) => `@property ${v} {\n  syntax: "*";\n  inherits: false;\n}`,
      ),
    );
  }
  return `${parts.join("\n")}\n`;
}
