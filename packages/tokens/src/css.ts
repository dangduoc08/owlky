import { hexToRgb } from "./color.js";
import {
  fontFamilyPresetNames,
  fontFamilyPresets,
  paletteTextFor,
  primaryPresetNames,
  primaryPresets,
} from "./presets.js";
import {
  breakpointNames,
  type ColorScheme,
  componentColorNames,
  greyShades,
  type PaletteColor,
  paletteColorNames,
  radiusNames,
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

const shadow = (layers: readonly ShadowLayer[], color: string) =>
  layers
    .map(
      (l) =>
        `${l.x}px ${l.y}px ${l.blur}px ${l.spread}px color-mix(in srgb, ${color} ${l.alpha}%, transparent)`,
    )
    .join(", ");

function rootVariables(theme: Theme): CssVariables {
  const vars: CssVariables = {};
  for (const name of paletteColorNames) {
    const color: PaletteColor = theme.palette[name];
    for (const [shade, value] of Object.entries(color)) {
      vars[`--ok-palette-${name}-${kebab(shade)}`] = value;
      vars[`--ok-palette-${name}-${kebab(shade)}-channel`] = channel(value);
    }
    vars[`--ok-shadow-${name}`] = shadow([theme.colorShadow], `var(--ok-palette-${name}-main)`);
  }
  vars["--_ok-primary-text-light"] = theme.schemes.light.paletteText.primary;
  vars["--_ok-primary-text-dark"] = theme.schemes.dark.paletteText.primary;
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
  vars["--ok-font-family-secondary"] = typography.fontFamilySecondary;
  vars["--ok-font-family-mono"] = typography.fontFamilyMono;
  for (const [name, weight] of Object.entries(typography.fontWeight)) {
    vars[`--ok-font-weight-${name}`] = String(weight);
  }
  for (const [name, size] of Object.entries(typography.fontSize)) {
    vars[`--ok-font-size-${name}`] = size;
  }
  for (const variant of typographyVariants) {
    const style = typography.variants[variant];
    vars[`--ok-typography-${variant}-font-family`] =
      style.fontFamily === "secondary"
        ? "var(--ok-font-family-secondary)"
        : "var(--ok-font-family)";
    vars[`--ok-typography-${variant}-font-size`] = style.fontSize;
    vars[`--ok-typography-${variant}-line-height`] = style.lineHeight;
    vars[`--ok-typography-${variant}-font-weight`] = String(style.fontWeight);
    vars[`--ok-typography-${variant}-text-transform`] = style.textTransform ?? "none";
  }

  for (const name of radiusNames) vars[`--ok-radius-${name}`] = theme.radius[name];
  vars["--ok-spacing"] = theme.spacing;
  for (const name of breakpointNames) {
    vars[`--ok-breakpoint-${name}`] = `${theme.breakpoints[name]}px`;
  }
  for (const [name, value] of Object.entries(theme.zIndex)) {
    vars[`--ok-z-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] = String(value);
  }
  for (const [name, value] of Object.entries(theme.motion.duration)) {
    vars[`--ok-duration-${name}`] = value;
  }
  for (const [name, value] of Object.entries(theme.motion.easing)) {
    vars[`--ok-easing-${name}`] = value;
  }
  return vars;
}

function schemeVariables(scheme: ColorScheme, theme: Theme, dark: boolean): CssVariables {
  const vars: CssVariables = {};
  for (const name of paletteColorNames)
    vars[`--ok-palette-${name}-text`] = scheme.paletteText[name];
  // Presets (ADR-0017) change the primary text tone: the scheme picks its tone from the nearest
  // preset scope, and `--_ok-dark` lets a preset scope pick from the nearest scheme scope.
  vars["--ok-palette-primary-text"] = `var(--_ok-primary-text-${dark ? "dark" : "light"})`;
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
  // Shadows are re-declared per scheme: a custom property referencing another one is resolved
  // where it is declared, so nested `data-ok-theme` scopes need their own copy.
  vars["--ok-shadow-color"] = scheme.shadowColor;
  for (const name of shadowNames) {
    vars[`--ok-shadow-${kebab(name)}`] = shadow(theme.shadows[name], "var(--ok-shadow-color)");
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
  /** Emit the `[data-ok-preset]` / `[data-ok-font]` scopes (ADR-0017). Default `true`. */
  presets?: boolean;
}

/**
 * Serializes a theme to CSS. Variables live in `@layer theme`, so any unlayered consumer CSS
 * overrides them. The layer order statement keeps library layers in Tailwind's order even when
 * this file loads before Tailwind (see ADR-0003).
 */
/** Shadow variables: identical text in every scheme, resolved against `--ok-shadow-color`. */
const isShadowVariable = (name: string) =>
  name.startsWith("--ok-elevation-") ||
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

/** Variables of a primary preset scope (`[data-ok-preset]`, ADR-0017). */
export function primaryPresetVariables(color: PaletteColor, theme: Theme): CssVariables {
  const vars: CssVariables = {};
  for (const [shade, value] of Object.entries(color)) {
    vars[`--ok-palette-primary-${kebab(shade)}`] = value;
    vars[`--ok-palette-primary-${kebab(shade)}-channel`] = channel(value);
  }
  vars["--ok-shadow-primary"] = shadow([theme.colorShadow], "var(--ok-palette-primary-main)");
  const light = paletteTextFor(color, theme.schemes.light, false);
  const dark = paletteTextFor(color, theme.schemes.dark, true);
  vars["--_ok-primary-text-light"] = light;
  vars["--_ok-primary-text-dark"] = dark;
  // 0 % / 100 % of the dark tone: exactly one of the two, per the nearest scheme scope.
  vars["--ok-palette-primary-text"] =
    "color-mix(in srgb, var(--_ok-primary-text-dark) calc(var(--_ok-dark) * 100%), var(--_ok-primary-text-light))";
  return vars;
}

/** Variables of a font preset scope (`[data-ok-font]`): every variant on the main family follows. */
export function fontPresetVariables(family: string, theme: Theme): CssVariables {
  const vars: CssVariables = { "--ok-font-family": family };
  for (const variant of typographyVariants) {
    if (theme.typography.variants[variant].fontFamily !== "secondary")
      vars[`--ok-typography-${variant}-font-family`] = "var(--ok-font-family)";
  }
  return vars;
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
  if (options.presets !== false) {
    for (const name of primaryPresetNames) {
      parts.push(
        block(`[data-ok-preset="${name}"]`, primaryPresetVariables(primaryPresets[name], theme)),
      );
    }
    for (const name of fontFamilyPresetNames) {
      parts.push(
        block(`[data-ok-font="${name}"]`, fontPresetVariables(fontFamilyPresets[name], theme)),
      );
    }
  }
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
