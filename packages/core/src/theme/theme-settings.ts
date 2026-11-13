/*
 * Theme settings (ADR-0070 § 2): the mode, the design style, density, surface contrast, high
 * contrast and the root font size, applied as `data-ok-theme`, `data-ok-style`,
 * `data-ok-density`, `data-ok-surface`, `data-ok-contrast` and the root `font-size`.
 * Framework-free, shared by React and HTML. Nothing is stored unless the app passes a storage.
 * Brand colors: `applyThemeBrand()` (`@owlky/core/theme-brand`) or a `createTheme()` theme.
 */
import { fontSizeRange, styleNames } from "@owlky/tokens";
import { THEME_ATTRIBUTES, themeSettingAttributes } from "./attributes.js";

export const themeModes = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof themeModes)[number];

/** Design styles (`data-ok-style`). Soft is the default. */
export const themeStyles = styleNames;
export type ThemeStyle = (typeof themeStyles)[number];

export const themeDensities = ["comfortable", "compact"] as const;
export type ThemeDensity = (typeof themeDensities)[number];

/** `contrast`: the page background one step away from paper. */
export const themeSurfaces = ["default", "contrast"] as const;
export type ThemeSurface = (typeof themeSurfaces)[number];

/** `high`: text 7:1, graphics 4.5:1; `system` follows `prefers-contrast: more`. */
export const themeContrasts = ["default", "high", "system"] as const;
export type ThemeContrast = (typeof themeContrasts)[number];

export interface ThemeSettings {
  mode: ThemeMode;
  style: ThemeStyle;
  density: ThemeDensity;
  surface: ThemeSurface;
  contrast: ThemeContrast;
  /** Root font size in px (12–20); every size is in rem, so the whole page scales. */
  fontSize: number;
}

export const defaultThemeSettings: Readonly<ThemeSettings> = Object.freeze({
  mode: "light",
  style: "soft",
  density: "comfortable",
  surface: "default",
  contrast: "default",
  fontSize: fontSizeRange.default,
});

export { THEME_ATTRIBUTES, themeSettingAttributes };

/** Storage key used when the app passes a storage. */
export const THEME_SETTINGS_KEY = "owlky:theme-settings";

export type ThemeSettingsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface ThemeSettingsOptions {
  /** Element that gets the attributes. Default: `document.documentElement`. */
  target?: HTMLElement | undefined;
  /** Where to keep the settings (e.g. `localStorage`). Default: nothing is stored. */
  storage?: ThemeSettingsStorage | null | undefined;
  /** Storage key. Default `THEME_SETTINGS_KEY`. */
  key?: string | undefined;
}

const pick = <V extends string>(values: readonly V[], value: unknown, fallback: V): V =>
  values.includes(value as V) ? (value as V) : fallback;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Valid settings from untrusted input (stored JSON, a query string…): unknown values → default. */
export function normalizeThemeSettings(input: unknown): ThemeSettings {
  const source = isRecord(input) ? input : {};
  const size = Number(source["fontSize"]);
  const d = defaultThemeSettings;
  return {
    mode: pick(themeModes, source["mode"], d.mode),
    style: pick(themeStyles, source["style"], d.style),
    density: pick(themeDensities, source["density"], d.density),
    surface: pick(themeSurfaces, source["surface"], d.surface),
    contrast: pick(themeContrasts, source["contrast"], d.contrast),
    fontSize:
      Number.isInteger(size) && size >= fontSizeRange.min && size <= fontSizeRange.max
        ? size
        : d.fontSize,
  };
}

const root = () => document.documentElement;

/** The settings currently applied to `target` (attributes) and the page (font size). */
function fromDom(target: HTMLElement): ThemeSettings {
  const read: Record<string, unknown> = {
    fontSize: Number.parseFloat(root().style.fontSize) || undefined,
  };
  for (const [key, attribute] of Object.entries(themeSettingAttributes))
    read[key] = target.getAttribute(attribute);
  return normalizeThemeSettings(read);
}

function stored(options: ThemeSettingsOptions): unknown {
  try {
    const raw = options.storage?.getItem(options.key ?? THEME_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined; // storage blocked or invalid JSON
  }
}

/** Settings from the storage when one is given and holds a value, otherwise from the DOM. */
export function readThemeSettings(options: ThemeSettingsOptions = {}): ThemeSettings {
  const saved = stored(options);
  return saved === undefined ? fromDom(options.target ?? root()) : normalizeThemeSettings(saved);
}

/**
 * Applies (and stores, when a storage is given) the settings. Missing keys keep their current
 * value; invalid ones fall back to the default. Every axis is written explicitly (a nested target
 * resets what an outer scope sets); the default font size removes the root style. Returns the
 * applied settings.
 */
export function applyThemeSettings(
  settings: Partial<ThemeSettings> = {},
  options: ThemeSettingsOptions = {},
): ThemeSettings {
  const target = options.target ?? root();
  const next = normalizeThemeSettings({ ...fromDom(target), ...settings });
  for (const [key, attribute] of Object.entries(themeSettingAttributes))
    target.setAttribute(attribute, next[key as keyof typeof themeSettingAttributes]);
  // CSSOM, not a style attribute string: works under a strict CSP.
  root().style.fontSize =
    next.fontSize === defaultThemeSettings.fontSize ? "" : `${next.fontSize}px`;
  try {
    options.storage?.setItem(options.key ?? THEME_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the settings still apply to the page.
  }
  return next;
}

/** Back to the defaults; forgets the stored settings. */
export function resetThemeSettings(options: ThemeSettingsOptions = {}): ThemeSettings {
  try {
    options.storage?.removeItem(options.key ?? THEME_SETTINGS_KEY);
  } catch {
    // Storage blocked: nothing to forget.
  }
  return applyThemeSettings(defaultThemeSettings, { ...options, storage: null });
}
