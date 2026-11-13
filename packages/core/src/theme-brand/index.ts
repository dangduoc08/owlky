/**
 * `@owlky/core/theme-brand` (ADR-0070 § 8): brand colors at run time. The role generator of
 * `@owlky/tokens` derives every role from the brand colors for every axis (light / dark, default /
 * high contrast, both surfaces) at AA, and the results are written as the scope's inputs through
 * CSSOM (strict-CSP safe). Not re-exported from `@owlky/core`: pages without brand colors don't
 * load the generator.
 */
import { type BrandColors, createTheme, type StyleName, themeColorVariables } from "@owlky/tokens";
import { themeSettingAttributes } from "../theme/attributes.js";

export type { BrandColors } from "@owlky/tokens";

export interface ThemeBrandOptions {
  /** Element that gets the colors. Default: `document.documentElement`. */
  target?: HTMLElement | undefined;
  /** The style to derive from. Default: the target's `data-ok-style`, else `soft`. */
  style?: StyleName | undefined;
}

/** The properties each target got, so a later call (or `null`) removes the old ones. */
const written = new WeakMap<HTMLElement, string[]>();

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Applies brand colors (`#RRGGBB` each; invalid ones are ignored) to `target`, or removes them
 * with `null`. Every role of every axis is derived at AA (ADR-0070 § 7), so nested
 * `data-ok-theme`, `data-ok-contrast` and `data-ok-surface` scopes keep working. Returns the
 * colors applied.
 */
export function applyThemeBrand(
  brand: BrandColors | null,
  options: ThemeBrandOptions = {},
): BrandColors {
  const target = options.target ?? document.documentElement;
  for (const name of written.get(target) ?? []) target.style.removeProperty(name);
  written.delete(target);
  const colors: BrandColors = {};
  for (const key of ["primary", "secondary", "neutral"] as const) {
    const value = brand?.[key];
    if (typeof value === "string" && HEX.test(value)) colors[key] = value;
  }
  if (Object.keys(colors).length === 0) return colors;
  const attribute = themeSettingAttributes.style;
  const style = (options.style ?? target.getAttribute(attribute) ?? "soft") as StyleName;
  // A style scope runs the resolver, so the inputs written here reach this element's tokens.
  if (target !== document.documentElement && !target.hasAttribute(attribute))
    target.setAttribute(attribute, style);
  const variables = themeColorVariables(createTheme({ style, brand: colors }));
  for (const [name, value] of Object.entries(variables)) target.style.setProperty(name, value);
  written.set(target, Object.keys(variables));
  return colors;
}
