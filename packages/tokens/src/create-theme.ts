import { defaultTheme } from "./default-theme.js";
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

/**
 * Creates a theme by deep-merging overrides into the default theme. Arrays (shadow layers) are
 * replaced, not merged. Serialize the result with `themeToCss()`.
 */
export function createTheme(overrides: DeepPartial<Theme> = {}, base: Theme = defaultTheme): Theme {
  return merge(base, overrides);
}
