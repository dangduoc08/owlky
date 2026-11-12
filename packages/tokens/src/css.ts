import { hexToRgb } from "./color.js";
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
  shadowNames,
  skinToneNames,
  type Theme,
  typographyVariants,
} from "./types.js";

/** Public `--ok-*` and private `--_ok-*` (theme plumbing) custom properties. */
export type CssVariables = Record<`--ok-${string}` | `--_ok-${string}`, string>;

export interface ThemeCssVariables {
  /** Scheme-independent variables, declared on `:root`. */
  root: CssVariables;
  light: CssVariables;
  dark: CssVariables;
}

/** Component color bindings. Non-inheriting, so a colored parent never leaks into children. */
export const colorBindingVariables = [
  "--ok-c-main",
  "--ok-c-channel",
  "--ok-c-hover",
  "--ok-c-contrast",
  "--ok-c-text",
  "--ok-c-shadow",
] as const;

/** `#00A76F` → `0 167 111`, for `rgb(var(--…-channel) / <alpha>)`. */
const channel = (hex: string) => hexToRgb(hex).join(" ");

const kebab = (value: string) => value.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Motion keys: `spinReduced` → `spin-reduced`, `progress1` → `progress-1`. */
const motionName = (value: string) => kebab(value).replace(/(?<=[a-z])(\d)/g, "-$1");

const shadow = (layers: readonly ShadowLayer[], color: string) =>
  layers
    .map(
      (l) =>
        `${l.x}px ${l.y}px ${l.blur}px ${l.spread}px color-mix(in srgb, ${color} ${l.alpha}%, transparent)`,
    )
    .join(", ");

/**
 * The same layers as a `filter` value (`drop-shadow()` per layer), for shapes that a box shadow
 * would draw around their box (SVG pins, icons). Only layers without spread: `drop-shadow()` has none.
 */
const dropShadow = (layers: readonly ShadowLayer[], color: string) =>
  layers
    .map(
      (l) =>
        `drop-shadow(${l.x}px ${l.y}px ${l.blur}px color-mix(in srgb, ${color} ${l.alpha}%, transparent))`,
    )
    .join(" ");

/** Custom shadows that also get a `--ok-drop-shadow-*` filter (their layers have no spread). */
export const dropShadowNames = ["z1", "z4", "z8"] as const;

/**
 * Gradient fill of a palette color (`--ok-gradient-<color>`): its `light` shade to its `main`
 * shade, diagonally. For backgrounds, borders and shapes, not for text.
 */
const gradientFill = (name: string) =>
  `linear-gradient(135deg, var(--ok-palette-${name}-light), var(--ok-palette-${name}-main))`;

/**
 * Gradient text of a palette color (`--ok-gradient-<color>-text`): from the scheme's AA text tone
 * to the next shade away from the background (`darker` in light schemes, `lighter` in dark ones),
 * so every stop meets AA. `end` is that shade's variable.
 */
const gradientText = (name: string, end: string) =>
  `linear-gradient(90deg, var(--ok-palette-${name}-text), ${end})`;

/**
 * Translucent paper with two soft glows (info top-right, error bottom-left), like popovers: the
 * scheme's paper at 90 %, so a `backdrop-filter` behind it shows through.
 */
const GRADIENT_PAPER = [
  "radial-gradient(circle at 100% 0%, rgb(var(--ok-palette-info-main-channel) / 0.12), transparent 40%)",
  "radial-gradient(circle at 0% 100%, rgb(var(--ok-palette-error-main-channel) / 0.12), transparent 40%)",
  "linear-gradient(rgb(var(--ok-bg-paper-channel) / 0.9), rgb(var(--ok-bg-paper-channel) / 0.9))",
].join(", ");

function rootVariables(theme: Theme): CssVariables {
  const vars: CssVariables = {};
  for (const name of paletteColorNames) {
    const color: PaletteColor = theme.palette[name];
    for (const [shade, value] of Object.entries(color)) {
      vars[`--ok-palette-${name}-${kebab(shade)}`] = value;
      vars[`--ok-palette-${name}-${kebab(shade)}-channel`] = channel(value);
    }
    vars[`--ok-shadow-${name}`] = shadow([theme.colorShadow], `var(--ok-palette-${name}-main)`);
    vars[`--ok-gradient-${name}`] = gradientFill(name);
  }
  for (const shade of greyShades) {
    vars[`--ok-palette-grey-${shade}`] = theme.grey[shade];
    vars[`--ok-palette-grey-${shade}-channel`] = channel(theme.grey[shade]);
  }
  vars["--ok-palette-common-white"] = theme.common.white;
  vars["--ok-palette-common-white-channel"] = channel(theme.common.white);
  vars["--ok-palette-common-black"] = theme.common.black;
  vars["--ok-palette-common-black-channel"] = channel(theme.common.black);
  for (const name of skinToneNames)
    vars[`--ok-illustration-skin-${name}`] = theme.illustration.skin[name];

  const { typography } = theme;
  vars["--ok-font-family"] = typography.fontFamily;
  vars["--ok-font-family-heading"] = typography.fontFamilyHeading;
  vars["--ok-font-family-label"] = typography.fontFamilyLabel;
  vars["--ok-font-family-mono"] = typography.fontFamilyMono;
  vars["--ok-label-text-transform"] = typography.label.textTransform;
  vars["--ok-label-letter-spacing"] = typography.label.letterSpacing;
  for (const [name, weight] of Object.entries(typography.fontWeight)) {
    vars[`--ok-font-weight-${name}`] = String(weight);
  }
  for (const name of fontSizeNames) vars[`--ok-font-size-${name}`] = typography.fontSize[name];
  vars["--ok-typography-quote-mark-size"] = typography.quoteMarkSize;
  for (const variant of typographyVariants) {
    const style = typography.variants[variant];
    vars[`--ok-typography-${variant}-font-family`] =
      style.fontFamily === "heading" || style.fontFamily === "label"
        ? `var(--ok-font-family-${style.fontFamily})`
        : "var(--ok-font-family)";
    vars[`--ok-typography-${variant}-font-size`] = style.fontSize;
    vars[`--ok-typography-${variant}-line-height`] = style.lineHeight;
    vars[`--ok-typography-${variant}-font-weight`] = String(style.fontWeight);
    vars[`--ok-typography-${variant}-text-transform`] = style.textTransform ?? "none";
    vars[`--ok-typography-${variant}-letter-spacing`] = style.letterSpacing ?? "normal";
  }

  for (const name of radiusNames) vars[`--ok-radius-${name}`] = theme.radius[name];
  for (const name of radiusRoleNames) vars[`--ok-radius-${name}`] = theme.radiusRole[name];
  vars["--ok-border-width"] = theme.borderWidth.default;
  vars["--ok-border-width-strong"] = theme.borderWidth.strong;
  vars["--ok-border-width-heavy"] = theme.borderWidth.heavy;
  for (const name of lineWidthNames) vars[`--ok-line-width-${name}`] = theme.lineWidth[name];
  vars["--ok-focus-ring-width"] = theme.focusRing.width;
  vars["--ok-focus-ring-offset"] = theme.focusRing.offset;
  vars["--ok-focus-ring-inset"] = theme.focusRing.inset;
  vars["--ok-focus-ring-offset-tight"] = theme.focusRing.offsetTight;
  for (const name of densityNames) vars[`--ok-${name}`] = theme.density[name];
  vars["--ok-icon-stroke"] = theme.icon.stroke;
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

function schemeVariables(scheme: ColorScheme, theme: Theme, dark: boolean): CssVariables {
  const vars: CssVariables = {};
  for (const name of paletteColorNames)
    vars[`--ok-palette-${name}-text`] = scheme.paletteText[name];
  // 0 | 1 per scheme scope: lets code read the nearest scheme (the Code editor theme, ADR-0034).
  vars["--_ok-dark"] = dark ? "1" : "0";
  vars["--ok-text-primary"] = scheme.text.primary;
  vars["--ok-text-secondary"] = scheme.text.secondary;
  vars["--ok-text-disabled"] = scheme.text.disabled;
  vars["--ok-bg-default"] = scheme.background.default;
  vars["--ok-bg-paper"] = scheme.background.paper;
  // Translucent paper (popovers, menus): `rgb(var(--ok-bg-paper-channel) / 0.9)`.
  vars["--ok-bg-paper-channel"] = channel(scheme.background.paper);
  vars["--ok-bg-neutral"] = scheme.background.neutral;
  vars["--ok-inherit-main"] = scheme.inherit.main;
  vars["--ok-inherit-hover"] = scheme.inherit.hover;
  vars["--ok-inherit-contrast"] = scheme.inherit.contrast;
  vars["--ok-divider"] = scheme.divider;
  vars["--ok-action-hover"] = scheme.action.hover;
  vars["--ok-action-selected"] = scheme.action.selected;
  vars["--ok-action-focus"] = scheme.action.focus;
  vars["--ok-action-disabled"] = scheme.action.disabled;
  vars["--ok-action-disabled-bg"] = scheme.action.disabledBackground;
  vars["--ok-backdrop"] = scheme.backdrop;
  // Focus ring colors may name scheme tokens: declared per scheme, so each scope resolves its own.
  vars["--ok-focus-ring-color"] = theme.focusRing.color;
  vars["--ok-focus-ring-color-brand"] = theme.focusRing.colorBrand;
  // Gradients that read scheme colors: declared in every scheme scope, so each resolves its own.
  for (const name of paletteColorNames)
    vars[`--ok-gradient-${name}-text`] = gradientText(
      name,
      `var(--ok-palette-${name}-${dark ? "lighter" : "darker"})`,
    );
  vars["--ok-gradient-paper"] = GRADIENT_PAPER;
  // Shadows are re-declared per scheme: a custom property referencing another one is resolved
  // where it is declared, so nested `data-ok-theme` scopes need their own copy.
  vars["--ok-shadow-color"] = scheme.shadowColor;
  for (const name of shadowNames) {
    vars[`--ok-shadow-${kebab(name)}`] = shadow(theme.shadows[name], "var(--ok-shadow-color)");
  }
  for (const name of dropShadowNames) {
    vars[`--ok-drop-shadow-${name}`] = dropShadow(theme.shadows[name], "var(--ok-shadow-color)");
  }
  theme.elevation.forEach((layers, index) => {
    vars[`--ok-elevation-${index + 1}`] = shadow(layers, "var(--ok-shadow-color)");
  });
  return vars;
}

export function themeToCssVariables(theme: Theme): ThemeCssVariables {
  return {
    root: rootVariables(theme),
    light: schemeVariables(theme.schemes.light, theme, false),
    dark: schemeVariables(theme.schemes.dark, theme, true),
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

const block = (selector: string, vars: CssVariables, extra = "") =>
  `  ${selector} {\n${extra}${Object.entries(vars)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join("\n")}\n  }`;

export const LAYER_ORDER = "@layer theme, base, components, utilities;";

export const DARK_SELECTOR = '[data-ok-theme="dark"], .dark';
export const LIGHT_SELECTOR = '[data-ok-theme="light"]';

export interface ThemeCssOptions {
  /** Emit the `[data-ok-color]` bindings and their `@property` registrations. Default `true`. */
  colorBindings?: boolean;
}

/**
 * Serializes a theme to CSS. Variables live in `@layer theme`, so any unlayered consumer CSS
 * overrides them. The layer order statement keeps library layers in Tailwind's order even when
 * this file loads before Tailwind (see ADR-0003).
 */
/** Shadow variables: identical text in every scheme, resolved against `--ok-shadow-color`. */
const isShadowVariable = (name: string) =>
  name.startsWith("--ok-elevation-") ||
  name.startsWith("--ok-drop-shadow-") ||
  (name.startsWith("--ok-shadow-") && name !== "--ok-shadow-color");

function splitShadows(vars: CssVariables): [scheme: CssVariables, shadows: CssVariables] {
  const scheme: CssVariables = {};
  const shadows: CssVariables = {};
  for (const [name, value] of Object.entries(vars) as [keyof CssVariables, string][]) {
    (isShadowVariable(name) ? shadows : scheme)[name] = value;
  }
  return [scheme, shadows];
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
      "--ok-c-text": `var(${self})`,
      "--ok-c-shadow": "var(--ok-shadow-z8)",
    };
  }
  return {
    "--ok-c-main": `var(--ok-palette-${name}-main)`,
    "--ok-c-channel": `var(--ok-palette-${name}-main-channel)`,
    "--ok-c-hover": `var(--ok-palette-${name}-dark)`,
    "--ok-c-contrast": `var(--ok-palette-${name}-contrast-text)`,
    "--ok-c-text": `var(--ok-palette-${name}-text)`,
    "--ok-c-shadow": `var(--ok-shadow-${name})`,
  };
}

export function themeToCss(theme: Theme, options: ThemeCssOptions = {}): string {
  const { root, light, dark } = themeToCssVariables(theme);
  const [lightScheme, shadows] = splitShadows(light);
  const [darkScheme] = splitShadows(dark);
  const parts = [
    LAYER_ORDER,
    "",
    "@layer theme {",
    block(":root", root),
    block(DARK_SELECTOR, darkScheme, "    color-scheme: dark;\n"),
    // `:where(:root)` has zero specificity, so a dark scope on the root element still wins,
    // while an explicit `data-ok-theme="light"` (declared after dark) wins over `.dark`.
    block(`:where(:root), ${LIGHT_SELECTOR}`, lightScheme, "    color-scheme: light;\n"),
    "  @media (prefers-color-scheme: dark) {",
    block('[data-ok-theme="system"]', darkScheme, "    color-scheme: dark;\n").replace(/^/gm, "  "),
    "  }",
    // Declared once on every theme scope: a custom property referencing another one is resolved
    // where it is declared, so each scope computes its shadows from its own --ok-shadow-color.
    block(":root, [data-ok-theme], .dark", shadows),
    ...responsiveTypographyVariables(theme).flatMap(([minWidth, vars]) => [
      `  @media (min-width: ${minWidth}px) {`,
      block(":root", vars).replace(/^/gm, "  "),
      "  }",
    ]),
  ];
  if (options.colorBindings !== false) {
    for (const name of componentColorNames) {
      parts.push(block(`[data-ok-color="${name}"]`, colorBinding(name)));
    }
  }
  parts.push("}");
  if (options.colorBindings !== false) {
    parts.push(
      "",
      ...colorBindingVariables.map(
        (v) => `@property ${v} {\n  syntax: "*";\n  inherits: false;\n}`,
      ),
    );
  }
  return `${parts.join("\n")}\n`;
}
