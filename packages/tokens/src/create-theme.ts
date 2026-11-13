import { type StyleDefinition, type StyleName, soft, styles } from "./styles.js";
import { type BrandColors, styleTheme, type ThemeFonts } from "./theme.js";
import type { DeepPartial, Theme } from "./types.js";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Keys that would rewrite an object's prototype when assigned (prototype pollution). */
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function merge<T>(base: T, overrides: DeepPartial<T> | undefined): T {
  if (!isPlainObject(base) || !isPlainObject(overrides)) return base;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || UNSAFE_KEYS.has(key)) continue;
    const current = result[key];
    result[key] = isPlainObject(current) && isPlainObject(value) ? merge(current, value) : value;
  }
  return result as T;
}

export type ThemeOptions = Omit<DeepPartial<Theme>, "style"> & {
  /** The style to start from (ADR-0070): a style id or a definition. Default `"soft"`. */
  style?: StyleName | StyleDefinition;
  /** Brand colors: each becomes a scale and every role is derived from it at AA (ADR-0070 § 8). */
  brand?: BrandColors;
  /** Font stacks that replace the style's families. */
  fonts?: ThemeFonts;
};

/**
 * Creates a theme: the style's theme (with `brand` colors and `fonts`), then any other key
 * deep-merged on top. Arrays (shadow layers) are replaced, not merged. Overridden colors are not
 * re-derived for the other axes: use `brand` for that. Serialize the result with `themeToCss()`.
 */
export function createTheme(options: ThemeOptions = {}): Theme {
  const { style = "soft", brand, fonts, ...overrides } = options;
  const definition = typeof style === "string" ? (styles[style as StyleName] ?? soft) : style;
  return merge(styleTheme(definition, { brand, fonts }), overrides as DeepPartial<Theme>);
}
