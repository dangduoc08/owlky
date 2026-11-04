import {
  type ColorScheme,
  greyShades,
  type PaletteColor,
  paletteColorNames,
  radiusNames,
  type ShadowLayer,
  shadowNames,
  type Theme,
  typographyVariants,
} from "./types.js";

export type CssVariables = Record<`--mt-${string}`, string>;

export interface ThemeCssVariables {
  /** Scheme-independent variables, declared on `:root`. */
  root: CssVariables;
  light: CssVariables;
  dark: CssVariables;
}

/** Component color bindings. Non-inheriting, so a colored parent never leaks into children. */
export const colorBindingVariables = [
  "--mt-c-main",
  "--mt-c-hover",
  "--mt-c-contrast",
  "--mt-c-text",
  "--mt-c-shadow",
] as const;

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
      vars[`--mt-palette-${name}-${kebab(shade)}`] = value;
    }
    vars[`--mt-shadow-${name}`] = shadow([theme.colorShadow], `var(--mt-palette-${name}-main)`);
  }
  for (const shade of greyShades) vars[`--mt-palette-grey-${shade}`] = theme.grey[shade];
  vars["--mt-palette-common-white"] = theme.common.white;
  vars["--mt-palette-common-black"] = theme.common.black;

  const { typography } = theme;
  vars["--mt-font-family"] = typography.fontFamily;
  vars["--mt-font-family-mono"] = typography.fontFamilyMono;
  for (const [name, weight] of Object.entries(typography.fontWeight)) {
    vars[`--mt-font-weight-${name}`] = String(weight);
  }
  for (const variant of typographyVariants) {
    const style = typography.variants[variant];
    vars[`--mt-typography-${variant}-font-size`] = style.fontSize;
    vars[`--mt-typography-${variant}-line-height`] = style.lineHeight;
    vars[`--mt-typography-${variant}-font-weight`] = String(style.fontWeight);
    vars[`--mt-typography-${variant}-text-transform`] = style.textTransform ?? "none";
  }

  for (const name of radiusNames) vars[`--mt-radius-${name}`] = theme.radius[name];
  vars["--mt-spacing"] = theme.spacing;
  for (const [name, value] of Object.entries(theme.zIndex)) vars[`--mt-z-${name}`] = String(value);
  for (const [name, value] of Object.entries(theme.motion.duration)) {
    vars[`--mt-duration-${name}`] = value;
  }
  for (const [name, value] of Object.entries(theme.motion.easing)) {
    vars[`--mt-easing-${name}`] = value;
  }
  return vars;
}

function schemeVariables(scheme: ColorScheme, theme: Theme): CssVariables {
  const vars: CssVariables = {};
  for (const name of paletteColorNames)
    vars[`--mt-palette-${name}-text`] = scheme.paletteText[name];
  vars["--mt-text-primary"] = scheme.text.primary;
  vars["--mt-text-secondary"] = scheme.text.secondary;
  vars["--mt-text-disabled"] = scheme.text.disabled;
  vars["--mt-bg-default"] = scheme.background.default;
  vars["--mt-bg-paper"] = scheme.background.paper;
  vars["--mt-bg-neutral"] = scheme.background.neutral;
  vars["--mt-inherit-main"] = scheme.inherit.main;
  vars["--mt-inherit-hover"] = scheme.inherit.hover;
  vars["--mt-inherit-contrast"] = scheme.inherit.contrast;
  vars["--mt-divider"] = scheme.divider;
  vars["--mt-action-hover"] = scheme.action.hover;
  vars["--mt-action-selected"] = scheme.action.selected;
  vars["--mt-action-focus"] = scheme.action.focus;
  vars["--mt-action-disabled"] = scheme.action.disabled;
  vars["--mt-action-disabled-bg"] = scheme.action.disabledBackground;
  vars["--mt-backdrop"] = scheme.backdrop;
  // Shadows are re-declared per scheme: a custom property referencing another one is resolved
  // where it is declared, so nested `data-mt-theme` scopes need their own copy.
  vars["--mt-shadow-color"] = scheme.shadowColor;
  for (const name of shadowNames) {
    vars[`--mt-shadow-${name}`] = shadow(theme.shadows[name], "var(--mt-shadow-color)");
  }
  return vars;
}

export function themeToCssVariables(theme: Theme): ThemeCssVariables {
  return {
    root: rootVariables(theme),
    light: schemeVariables(theme.schemes.light, theme),
    dark: schemeVariables(theme.schemes.dark, theme),
  };
}

const block = (selector: string, vars: CssVariables, extra = "") =>
  `  ${selector} {\n${extra}${Object.entries(vars)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join("\n")}\n  }`;

export const LAYER_ORDER = "@layer theme, base, components, utilities;";

export const DARK_SELECTOR = '[data-mt-theme="dark"], .dark';
export const LIGHT_SELECTOR = '[data-mt-theme="light"]';

export interface ThemeCssOptions {
  /** Emit the `[data-mt-color]` bindings and their `@property` registrations. Default `true`. */
  colorBindings?: boolean;
}

/**
 * Serializes a theme to CSS. Variables live in `@layer theme`, so any unlayered consumer CSS
 * overrides them. The layer order statement keeps library layers in Tailwind's order even when
 * this file loads before Tailwind (see ADR-0003).
 */
export function themeToCss(theme: Theme, options: ThemeCssOptions = {}): string {
  const { root, light, dark } = themeToCssVariables(theme);
  const parts = [
    LAYER_ORDER,
    "",
    "@layer theme {",
    block(":root", { ...root, ...light }, "    color-scheme: light;\n"),
    block(DARK_SELECTOR, dark, "    color-scheme: dark;\n"),
    block(LIGHT_SELECTOR, light, "    color-scheme: light;\n"),
    "  @media (prefers-color-scheme: dark) {",
    block('[data-mt-theme="system"]', dark, "    color-scheme: dark;\n").replace(/^/gm, "  "),
    "  }",
  ];
  if (options.colorBindings !== false) {
    for (const name of paletteColorNames) {
      parts.push(
        block(`[data-mt-color="${name}"]`, {
          "--mt-c-main": `var(--mt-palette-${name}-main)`,
          "--mt-c-hover": `var(--mt-palette-${name}-dark)`,
          "--mt-c-contrast": `var(--mt-palette-${name}-contrast-text)`,
          "--mt-c-text": `var(--mt-palette-${name}-text)`,
          "--mt-c-shadow": `var(--mt-shadow-${name})`,
        }),
      );
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
